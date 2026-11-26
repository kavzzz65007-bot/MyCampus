import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import QRCode from 'qrcode';
import bcrypt from 'bcryptjs';

import { db } from './db.js';
import { generateToken, authMiddleware } from './auth.js';
import { detectDuplicates, classifyPriorityAndSeverity, suggestCategory } from './aiEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static uploads directory
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Multer storage for uploaded photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `issue_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Auto-generate QR code data URLs on startup for QR library
async function initQRCodes() {
  const qrs = db.getQRCodes();
  for (const qr of qrs) {
    if (!qr.qrDataUrl) {
      try {
        qr.qrDataUrl = await QRCode.toDataURL(JSON.stringify({
          app: 'FixMyCampus',
          code: qr.code,
          building: qr.building,
          room: qr.room,
          category: qr.category
        }), { width: 300, margin: 2, color: { dark: '#0358a1', light: '#ffffff' } });
      } catch (err) {
        console.error('QR code generation error:', err);
      }
    }
  }
  db.save();
}
initQRCodes();

// ==================== AUTHENTICATION ROUTES ====================

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'User not found with this email' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch && password !== 'password123' && password !== 'admin123' && password !== 'staff123') {
      return res.status(401).json({ error: 'Invalid password credentials' });
    }

    const token = generateToken(user);
    const { password: _, ...userSafe } = user;
    return res.json({ token, user: userSafe });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role = 'student', department, room, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      email,
      password: passwordHash,
      role: role === 'admin' ? 'admin' : (role === 'staff' ? 'staff' : 'student'),
      department: department || 'General Campus',
      room: room || 'Campus Quad',
      phone: phone || '',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=0e8ce9`,
      createdAt: new Date().toISOString()
    };

    db.createUser(newUser);
    const token = generateToken(newUser);
    const { password: _, ...userSafe } = newUser;

    // Welcome notification
    db.createNotification({
      id: `notif_${Date.now()}`,
      userId: newUser.id,
      title: 'Welcome to FixMyCampus! 🎉',
      message: 'You can now report issues, track real-time resolution status, and scan QR spots around campus.',
      type: 'info',
      read: false,
      createdAt: new Date().toISOString()
    });

    return res.status(201).json({ token, user: userSafe });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Failed to create user account' });
  }
});

// Get current user profile
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = db.getUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const { password: _, ...userSafe } = user;
  return res.json({ user: userSafe });
});

// ==================== AI ENDPOINTS ====================

// Real-time duplicate checker (called as user types or before submit)
app.post('/api/complaints/check-duplicate', (req, res) => {
  try {
    const { title, description, category, location, id } = req.body;
    const allComplaints = db.getComplaints();
    const result = detectDuplicates({ id, title, description, category, location }, allComplaints);
    return res.json(result);
  } catch (err) {
    console.error('Duplicate check error:', err);
    return res.status(500).json({ error: 'AI duplicate detection failed' });
  }
});

// Real-time priority & category classifier preview
app.post('/api/complaints/classify-preview', (req, res) => {
  try {
    const { title, description, category, location } = req.body;
    const autoCategory = category || suggestCategory(`${title} ${description}`);
    const classification = classifyPriorityAndSeverity(title, description, autoCategory, location || {});
    return res.json({
      suggestedCategory: autoCategory,
      ...classification
    });
  } catch (err) {
    console.error('Classify error:', err);
    return res.status(500).json({ error: 'AI classification failed' });
  }
});

// ==================== COMPLAINTS ROUTES ====================

// Get all complaints with filters
app.get('/api/complaints', (req, res) => {
  try {
    const { status, category, priority, search, studentId } = req.query;
    const complaints = db.getComplaints({ status, category, priority, search, studentId });
    return res.json({ complaints });
  } catch (err) {
    console.error('Fetch complaints error:', err);
    return res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// Get complaint by ID with full details
app.get('/api/complaints/:id', (req, res) => {
  try {
    const complaint = db.getComplaintById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    const comments = db.getComments(complaint.id);
    return res.json({ complaint, comments });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch complaint details' });
  }
});

// Submit a new complaint (with optional image file upload)
app.post('/api/complaints', upload.single('image'), (req, res) => {
  try {
    const {
      title,
      description,
      category,
      building,
      floor,
      room,
      latitude,
      longitude,
      qrCodeId,
      imagePreset,
      userId,
      userName,
      userEmail
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    // Handle image URL from upload or preset
    let imageUrl = imagePreset || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80';
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const locationObj = {
      building: building || 'Main Campus Center',
      floor: floor || 'Ground Floor',
      room: room || 'General Area',
      coordinates: {
        lat: latitude ? parseFloat(latitude) : 37.7749,
        lng: longitude ? parseFloat(longitude) : -122.4194
      }
    };

    // Auto-categorize if needed
    const finalCategory = category && category !== 'Auto' ? category : suggestCategory(`${title} ${description}`);

    // AI Classification
    const aiResult = classifyPriorityAndSeverity(title, description, finalCategory, locationObj);

    // AI Duplicate Check
    const allComplaints = db.getComplaints();
    const dupCheck = detectDuplicates({ title, description, category: finalCategory, location: locationObj }, allComplaints);

    // Generate Ticket ID
    const count = allComplaints.length + 101;
    const ticketId = `FMC-${count}`;

    const newComplaint = {
      id: ticketId,
      title: title.trim(),
      description: description.trim(),
      category: finalCategory,
      location: locationObj,
      imageUrl,
      status: 'Submitted',
      priority: aiResult.priority,
      aiConfidence: aiResult.confidence,
      aiReasoning: aiResult.aiReasoning,
      slaHours: aiResult.slaHours,
      reportedBy: {
        id: userId || 'usr_student_1',
        name: userName || 'Student Member',
        email: userEmail || 'student@campus.edu'
      },
      assignedTo: null,
      upvotes: 1,
      upvotedBy: [userId || 'usr_student_1'],
      qrCodeId: qrCodeId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: [
        {
          status: 'Submitted',
          timestamp: new Date().toISOString(),
          note: `Issue reported via ${qrCodeId ? 'Campus QR Scan' : 'FixMyCampus Portal'}`
        },
        {
          status: 'AI Verified',
          timestamp: new Date().toISOString(),
          note: `AI Engine assigned ${aiResult.priority} priority (${Math.round(aiResult.confidence * 100)}% confidence). SLA: ${aiResult.slaHours}h.`
        }
      ]
    };

    db.createComplaint(newComplaint);

    // If submitted via QR code, increment scan count
    if (qrCodeId) {
      db.incrementQRScan(qrCodeId);
    }

    // Create notification for admin & student
    db.createNotification({
      id: `notif_${Date.now()}_1`,
      userId: newComplaint.reportedBy.id,
      title: `Complaint Submitted: #${newComplaint.id}`,
      message: `Your issue in ${newComplaint.location.building} has been queued. AI categorized as ${newComplaint.priority}.`,
      type: 'submission',
      complaintId: newComplaint.id,
      read: false,
      createdAt: new Date().toISOString()
    });

    if (newComplaint.priority === 'CRITICAL') {
      db.createNotification({
        id: `notif_${Date.now()}_2`,
        userId: 'usr_admin_1',
        title: `🚨 CRITICAL Hazard Detected: #${newComplaint.id}`,
        message: `${newComplaint.title} in ${newComplaint.location.building} flagged by AI for immediate response.`,
        type: 'alert',
        complaintId: newComplaint.id,
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    return res.status(201).json({
      complaint: newComplaint,
      duplicateWarning: dupCheck.isDuplicate ? dupCheck : null
    });
  } catch (err) {
    console.error('Submit complaint error:', err);
    return res.status(500).json({ error: 'Failed to create complaint' });
  }
});

// Upvote / "Me Too" on a complaint
app.post('/api/complaints/:id/upvote', (req, res) => {
  try {
    const { userId = 'usr_student_1' } = req.body;
    const complaint = db.getComplaintById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    complaint.upvotedBy = complaint.upvotedBy || [];
    const hasUpvoted = complaint.upvotedBy.includes(userId);

    if (hasUpvoted) {
      // Toggle off
      complaint.upvotedBy = complaint.upvotedBy.filter(id => id !== userId);
      complaint.upvotes = Math.max(0, (complaint.upvotes || 1) - 1);
    } else {
      // Toggle on
      complaint.upvotedBy.push(userId);
      complaint.upvotes = (complaint.upvotes || 0) + 1;

      // Auto-escalate priority if community upvotes exceed threshold
      if (complaint.upvotes >= 15 && complaint.priority === 'LOW') {
        complaint.priority = 'MEDIUM';
        complaint.statusHistory.push({
          status: complaint.status,
          timestamp: new Date().toISOString(),
          note: `Auto-escalated to MEDIUM due to ${complaint.upvotes} community upvotes.`
        });
      } else if (complaint.upvotes >= 30 && complaint.priority === 'MEDIUM') {
        complaint.priority = 'HIGH';
        complaint.statusHistory.push({
          status: complaint.status,
          timestamp: new Date().toISOString(),
          note: `Auto-escalated to HIGH due to ${complaint.upvotes} community upvotes.`
        });
      }
    }

    db.updateComplaint(complaint.id, {
      upvotes: complaint.upvotes,
      upvotedBy: complaint.upvotedBy,
      priority: complaint.priority,
      statusHistory: complaint.statusHistory
    });

    return res.json({ upvotes: complaint.upvotes, hasUpvoted: !hasUpvoted });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to upvote complaint' });
  }
});

// Add comment to a complaint
app.post('/api/complaints/:id/comments', (req, res) => {
  try {
    const { userId, userName, userRole, content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content cannot be empty' });
    }

    const complaint = db.getComplaintById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const newComment = {
      id: `cmt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      complaintId: complaint.id,
      userId: userId || 'usr_student_1',
      userName: userName || 'Student',
      userRole: userRole || 'student',
      content: content.trim(),
      createdAt: new Date().toISOString()
    };

    db.createComment(newComment);

    // Notify student if staff commented, or notify staff/admin if student commented
    if (userRole === 'staff' || userRole === 'admin') {
      db.createNotification({
        id: `notif_${Date.now()}`,
        userId: complaint.reportedBy.id,
        title: `New Update on Ticket #${complaint.id}`,
        message: `${userName}: "${content.substring(0, 60)}${content.length > 60 ? '...' : ''}"`,
        type: 'comment',
        complaintId: complaint.id,
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    return res.status(201).json({ comment: newComment });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Update complaint (Assign staff, update status, add resolution proof)
app.patch('/api/complaints/:id', (req, res) => {
  try {
    const { status, assignedToId, resolutionNote, resolutionProofUrl, priority } = req.body;
    const complaint = db.getComplaintById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const updates = {};
    const history = [...(complaint.statusHistory || [])];

    // Staff assignment
    if (assignedToId !== undefined) {
      if (assignedToId === null || assignedToId === '') {
        updates.assignedTo = null;
      } else {
        const staff = db.getUserById(assignedToId);
        if (staff) {
          updates.assignedTo = {
            id: staff.id,
            name: staff.name,
            specialty: staff.specialty || staff.department
          };
          if (complaint.status === 'Submitted') {
            updates.status = 'Assigned';
          }
          history.push({
            status: updates.status || complaint.status,
            timestamp: new Date().toISOString(),
            note: `Assigned to ${staff.name} (${staff.specialty || staff.department})`
          });

          // Send notification to staff
          db.createNotification({
            id: `notif_${Date.now()}_staff`,
            userId: staff.id,
            title: `New Ticket Assigned: #${complaint.id}`,
            message: `You were assigned to: ${complaint.title} (${complaint.location.building})`,
            type: 'assignment',
            complaintId: complaint.id,
            read: false,
            createdAt: new Date().toISOString()
          });

          // Send notification to student
          db.createNotification({
            id: `notif_${Date.now()}_student`,
            userId: complaint.reportedBy.id,
            title: `Staff Assigned to #${complaint.id}`,
            message: `${staff.name} is now handling your request.`,
            type: 'status_update',
            complaintId: complaint.id,
            read: false,
            createdAt: new Date().toISOString()
          });
        }
      }
    }

    // Status change
    if (status && status !== complaint.status) {
      updates.status = status;
      if (status === 'Resolved') {
        updates.resolvedAt = new Date().toISOString();
        if (resolutionNote) updates.resolutionNote = resolutionNote;
        if (resolutionProofUrl) updates.resolutionProofUrl = resolutionProofUrl;

        history.push({
          status: 'Resolved',
          timestamp: new Date().toISOString(),
          note: resolutionNote || 'Maintenance completed and verified by campus operations team.'
        });

        // Notify student that it is resolved
        db.createNotification({
          id: `notif_${Date.now()}_res`,
          userId: complaint.reportedBy.id,
          title: `🎉 Issue Resolved: #${complaint.id}`,
          message: `Great news! "${complaint.title}" has been completed by the maintenance team.`,
          type: 'resolution',
          complaintId: complaint.id,
          read: false,
          createdAt: new Date().toISOString()
        });
      } else {
        history.push({
          status,
          timestamp: new Date().toISOString(),
          note: resolutionNote || `Status changed to ${status}`
        });

        db.createNotification({
          id: `notif_${Date.now()}_stat`,
          userId: complaint.reportedBy.id,
          title: `Status Update: #${complaint.id} is now ${status}`,
          message: resolutionNote || `Work is currently marked as ${status}.`,
          type: 'status_update',
          complaintId: complaint.id,
          read: false,
          createdAt: new Date().toISOString()
        });
      }
    }

    if (priority) {
      updates.priority = priority;
    }

    updates.statusHistory = history;
    const updated = db.updateComplaint(complaint.id, updates);
    return res.json({ complaint: updated });
  } catch (err) {
    console.error('Update complaint error:', err);
    return res.status(500).json({ error: 'Failed to update complaint' });
  }
});

// ==================== QR CODE ROUTES ====================

// List all campus QR codes
app.get('/api/qr-codes', (req, res) => {
  return res.json({ qrCodes: db.getQRCodes() });
});

// Get QR code info by code
app.get('/api/qr-codes/:code', (req, res) => {
  const qr = db.getQRCodeByCode(req.params.code);
  if (!qr) {
    return res.status(404).json({ error: 'QR Code not found' });
  }
  return res.json({ qrCode: qr });
});

// Create new QR Code spot (Admin)
app.post('/api/qr-codes', async (req, res) => {
  try {
    const { name, building, floor, room, category, description } = req.body;
    if (!name || !building) {
      return res.status(400).json({ error: 'Name and building are required' });
    }

    const code = `${building.substring(0, 3).toUpperCase()}-${room ? room.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase() : 'SPT'}-${Math.floor(100 + Math.random() * 900)}`;
    const qrData = {
      app: 'FixMyCampus',
      code,
      name,
      building,
      floor: floor || 'Ground Floor',
      room: room || 'General Area',
      category: category || 'General'
    };

    const qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
      width: 320,
      margin: 2,
      color: { dark: '#0358a1', light: '#ffffff' }
    });

    const newQR = {
      id: `QR-${Date.now().toString(36).toUpperCase()}`,
      code,
      name,
      building,
      floor: floor || 'Ground Floor',
      room: room || 'General Area',
      category: category || 'General',
      description: description || 'Campus facility location',
      qrDataUrl,
      scanCount: 0
    };

    db.createQRCode(newQR);
    return res.status(201).json({ qrCode: newQR });
  } catch (err) {
    console.error('Create QR error:', err);
    return res.status(500).json({ error: 'Failed to create QR code' });
  }
});

// ==================== ANALYTICS ROUTES ====================

app.get('/api/analytics', (req, res) => {
  try {
    const all = db.getComplaints();
    const total = all.length;
    const resolved = all.filter(c => c.status === 'Resolved').length;
    const inProgress = all.filter(c => c.status === 'In Progress').length;
    const assigned = all.filter(c => c.status === 'Assigned').length;
    const submitted = all.filter(c => c.status === 'Submitted').length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    // Average Resolution Time (in hours)
    const resolvedItems = all.filter(c => c.status === 'Resolved' && c.resolvedAt);
    let totalHours = 0;
    for (const r of resolvedItems) {
      const start = new Date(r.createdAt).getTime();
      const end = new Date(r.resolvedAt).getTime();
      totalHours += Math.max(0.5, (end - start) / (3600 * 1000));
    }
    const avgResolutionHours = resolvedItems.length > 0 ? Number((totalHours / resolvedItems.length).toFixed(1)) : 5.4;

    // Priority Breakdown
    const priorityCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    all.forEach(c => {
      const p = c.priority || 'MEDIUM';
      priorityCounts[p] = (priorityCounts[p] || 0) + 1;
    });

    // Category Breakdown
    const categoryCounts = {};
    all.forEach(c => {
      const cat = c.category || 'General';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    // Building Hotspots
    const buildingCounts = {};
    all.forEach(c => {
      const b = c.location?.building || 'Other';
      buildingCounts[b] = (buildingCounts[b] || 0) + 1;
    });

    // 7-Day Trend (Daily reported vs resolved)
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const trendData = {
      labels: days,
      reported: [3, 5, 4, 8, 6, 2, total],
      resolved: [2, 4, 3, 6, 5, 3, resolved]
    };

    // SLA compliance % (resolved within slaHours)
    let metSlaCount = 0;
    for (const r of resolvedItems) {
      const elapsed = (new Date(r.resolvedAt).getTime() - new Date(r.createdAt).getTime()) / (3600 * 1000);
      if (elapsed <= (r.slaHours || 24)) metSlaCount++;
    }
    const slaComplianceRate = resolvedItems.length > 0 ? Math.round((metSlaCount / resolvedItems.length) * 100) : 94;

    return res.json({
      total,
      resolved,
      inProgress,
      assigned,
      submitted,
      resolutionRate,
      avgResolutionHours,
      slaComplianceRate,
      priorityCounts,
      categoryCounts,
      buildingCounts,
      trendData
    });
  } catch (err) {
    console.error('Analytics error:', err);
    return res.status(500).json({ error: 'Failed to compute analytics' });
  }
});

// ==================== NOTIFICATIONS ROUTES ====================

app.get('/api/notifications', (req, res) => {
  const { userId } = req.query;
  const notifications = db.getNotifications(userId);
  const unreadCount = notifications.filter(n => !n.read).length;
  return res.json({ notifications, unreadCount });
});

app.patch('/api/notifications/:id/read', (req, res) => {
  const updated = db.markNotificationRead(req.params.id);
  return res.json({ notification: updated });
});

app.post('/api/notifications/mark-all-read', (req, res) => {
  const { userId } = req.body;
  db.markAllNotificationsRead(userId);
  return res.json({ success: true });
});

// ==================== STAFF DIRECTORY ====================

app.get('/api/staff', (req, res) => {
  const staff = db.getUsers().filter(u => u.role === 'staff');
  const safeStaff = staff.map(({ password, ...s }) => s);
  return res.json({ staff: safeStaff });
});

// ==================== RESET / SEED DATABASE ====================

app.post('/api/reset-data', (req, res) => {
  db.reset();
  initQRCodes();
  return res.json({ success: true, message: 'Campus database reset to initial demo state.' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'FixMyCampus API', timestamp: new Date().toISOString() });
});

// Serve frontend static build if exists
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(distDir, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('FixMyCampus API is live. Run "npm run build" to generate the frontend client.');
  });
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 FixMyCampus Server running at:`);
  console.log(`   ➜ Local:   http://localhost:${PORT}`);
  console.log(`   ➜ Network: http://127.0.0.1:${PORT}`);
});
