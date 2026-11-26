import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '..', 'data', 'database.json');

// Ensure data folder exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initial sample seed dataset
const getSeedData = () => {
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('password123', salt);
  const adminHash = bcrypt.hashSync('admin123', salt);
  const staffHash = bcrypt.hashSync('staff123', salt);

  const users = [
    {
      id: 'usr_student_1',
      name: 'Alex Rivera',
      email: 'alex@campus.edu',
      password: passwordHash,
      role: 'student',
      department: 'Computer Science',
      room: 'Hostel 3, Room 312',
      phone: '+1 (555) 234-5678',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-02-10T09:00:00.000Z'
    },
    {
      id: 'usr_student_2',
      name: 'Chloe Bennett',
      email: 'chloe@campus.edu',
      password: passwordHash,
      role: 'student',
      department: 'Mechanical Engineering',
      room: 'Hostel 2, Room 104',
      phone: '+1 (555) 345-6789',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-02-12T10:30:00.000Z'
    },
    {
      id: 'usr_admin_1',
      name: 'Dr. Dean Miller',
      email: 'admin@campus.edu',
      password: adminHash,
      role: 'admin',
      department: 'Campus Facility Operations',
      room: 'Admin Building, Office 201',
      phone: '+1 (555) 888-0001',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-01-01T08:00:00.000Z'
    },
    {
      id: 'usr_staff_1',
      name: 'Sam Walker',
      email: 'sam@campus.edu',
      password: staffHash,
      role: 'staff',
      department: 'Electrical & Power Systems',
      specialty: 'Electrical',
      activeTickets: 2,
      phone: '+1 (555) 777-1001',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-01-05T08:00:00.000Z'
    },
    {
      id: 'usr_staff_2',
      name: 'Maria Torres',
      email: 'maria@campus.edu',
      password: staffHash,
      role: 'staff',
      department: 'Water & Plumbing Maintenance',
      specialty: 'Plumbing',
      activeTickets: 1,
      phone: '+1 (555) 777-1002',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-01-05T08:00:00.000Z'
    },
    {
      id: 'usr_staff_3',
      name: 'Devon Chen',
      email: 'devon@campus.edu',
      password: staffHash,
      role: 'staff',
      department: 'HVAC & Climate Control',
      specialty: 'Classroom/AV',
      activeTickets: 1,
      phone: '+1 (555) 777-1003',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-01-05T08:00:00.000Z'
    },
    {
      id: 'usr_staff_4',
      name: 'Priya Patel',
      email: 'priya@campus.edu',
      password: staffHash,
      role: 'staff',
      department: 'Campus IT & Wi-Fi Operations',
      specialty: 'Internet/Wi-Fi',
      activeTickets: 2,
      phone: '+1 (555) 777-1004',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-01-05T08:00:00.000Z'
    }
  ];

  const complaints = [
    {
      id: 'FMC-101',
      title: 'Overhead Projector Sparking & Burning Smell in Science Lab',
      description: 'The ceiling projector in Science Lab 102 emitted sparks and a strong burning plastic odor during lecture. The projector has been turned off at breaker, but unit requires urgent replacement.',
      category: 'Electrical',
      location: {
        building: 'Science Block B',
        floor: '1st Floor',
        room: 'Lab 102',
        coordinates: { lat: 37.7749, lng: -122.4194 }
      },
      imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
      status: 'In Progress',
      priority: 'CRITICAL',
      aiConfidence: 0.95,
      aiReasoning: 'Critical risk: Electrical sparking and burning odor detected in laboratory environment. Automatic safety escalation triggered.',
      reportedBy: {
        id: 'usr_student_1',
        name: 'Alex Rivera',
        email: 'alex@campus.edu'
      },
      assignedTo: {
        id: 'usr_staff_1',
        name: 'Sam Walker',
        specialty: 'Electrical'
      },
      upvotes: 14,
      upvotedBy: ['usr_student_1', 'usr_student_2'],
      qrCodeId: 'QR-SCI-102',
      slaHours: 4,
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      statusHistory: [
        { status: 'Submitted', timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), note: 'Complaint logged via Web Portal' },
        { status: 'AI Verified', timestamp: new Date(Date.now() - 2.8 * 3600 * 1000).toISOString(), note: 'AI classified as CRITICAL (Sparks/Fire risk)' },
        { status: 'Assigned', timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), note: 'Assigned to Senior Electrician Sam Walker' },
        { status: 'In Progress', timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString(), note: 'Technician on-site with replacement fuse & circuit test' }
      ]
    },
    {
      id: 'FMC-102',
      title: 'Major Water Pipe Leak Flooding Restroom Floor',
      description: 'The pipe under the second washbasin in Engineering Block A 2nd floor restroom is ruptured and water is pooling across the walkway into the main corridor.',
      category: 'Plumbing',
      location: {
        building: 'Engineering Block A',
        floor: '2nd Floor',
        room: 'East Wing Restroom',
        coordinates: { lat: 37.7752, lng: -122.4182 }
      },
      imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80',
      status: 'Assigned',
      priority: 'HIGH',
      aiConfidence: 0.92,
      aiReasoning: 'Water leak causing pooling hazard and structural runoff risk. Classified as HIGH priority.',
      reportedBy: {
        id: 'usr_student_2',
        name: 'Chloe Bennett',
        email: 'chloe@campus.edu'
      },
      assignedTo: {
        id: 'usr_staff_2',
        name: 'Maria Torres',
        specialty: 'Plumbing'
      },
      upvotes: 9,
      upvotedBy: ['usr_student_2'],
      qrCodeId: 'QR-ENG-REST-2',
      slaHours: 8,
      createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      statusHistory: [
        { status: 'Submitted', timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString(), note: 'Complaint logged via QR Scanner' },
        { status: 'AI Verified', timestamp: new Date(Date.now() - 5.8 * 3600 * 1000).toISOString(), note: 'AI matched water damage severity (92% confidence)' },
        { status: 'Assigned', timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), note: 'Assigned to Maria Torres' }
      ]
    },
    {
      id: 'FMC-103',
      title: 'Central Library AC blowing hot air during exam study hours',
      description: 'The central air conditioning on the 3rd floor quiet study zone has been blowing warm humid air for the past 4 hours. The room is overheating.',
      category: 'HVAC',
      location: {
        building: 'Central Library',
        floor: '3rd Floor',
        room: 'Silent Study Zone 3B',
        coordinates: { lat: 37.7761, lng: -122.4175 }
      },
      imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80',
      status: 'In Progress',
      priority: 'MEDIUM',
      aiConfidence: 0.88,
      aiReasoning: 'Comfort and study disruption in high-occupancy library zone. Medium urgency.',
      reportedBy: {
        id: 'usr_student_1',
        name: 'Alex Rivera',
        email: 'alex@campus.edu'
      },
      assignedTo: {
        id: 'usr_staff_3',
        name: 'Devon Chen',
        specialty: 'HVAC'
      },
      upvotes: 21,
      upvotedBy: ['usr_student_1', 'usr_student_2'],
      qrCodeId: 'QR-LIB-3B',
      slaHours: 24,
      createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      statusHistory: [
        { status: 'Submitted', timestamp: new Date(Date.now() - 14 * 3600 * 1000).toISOString(), note: 'Student reported via Mobile' },
        { status: 'AI Verified', timestamp: new Date(Date.now() - 13.9 * 3600 * 1000).toISOString(), note: 'Auto-clustered 3 related reports' },
        { status: 'Assigned', timestamp: new Date(Date.now() - 8 * 3600 * 1000).toISOString(), note: 'Assigned to Devon Chen' },
        { status: 'In Progress', timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), note: 'Compressor refrigerant reset underway' }
      ]
    },
    {
      id: 'FMC-104',
      title: 'Hostel 3 Wi-Fi Gateway Offline on Floors 3 & 4',
      description: 'Campus Wi-Fi AP-H3-401 is showing solid red light. Students are unable to access campus portals or submit assignments from their rooms.',
      category: 'Internet/Wi-Fi',
      location: {
        building: 'Hostel 3 (Cedar Hall)',
        floor: '3rd & 4th Floors',
        room: 'Corridor AP-401',
        coordinates: { lat: 37.7741, lng: -122.4211 }
      },
      imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=80',
      status: 'Submitted',
      priority: 'HIGH',
      aiConfidence: 0.91,
      aiReasoning: 'Impacts academic connectivity for over 60 resident students before assignment deadlines.',
      reportedBy: {
        id: 'usr_student_1',
        name: 'Alex Rivera',
        email: 'alex@campus.edu'
      },
      assignedTo: null,
      upvotes: 38,
      upvotedBy: ['usr_student_1', 'usr_student_2'],
      qrCodeId: 'QR-H3-WIFI',
      slaHours: 12,
      createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      statusHistory: [
        { status: 'Submitted', timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString(), note: 'Reported with 38 community upvotes' },
        { status: 'AI Verified', timestamp: new Date(Date.now() - 0.9 * 3600 * 1000).toISOString(), note: 'Elevated to HIGH priority based on cluster impact' }
      ]
    },
    {
      id: 'FMC-105',
      title: 'Broken Glass Panel on South Stairwell Fire Door',
      description: 'The safety glass insert on the emergency exit door is shattered. Shards are cracked and could fall if door is pushed hard.',
      category: 'Infrastructure',
      location: {
        building: 'Student Union Hub',
        floor: 'Ground Floor',
        room: 'South Emergency Stairwell',
        coordinates: { lat: 37.7765, lng: -122.4168 }
      },
      imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
      status: 'Resolved',
      priority: 'CRITICAL',
      aiConfidence: 0.94,
      aiReasoning: 'Emergency exit safety violation and laceration hazard.',
      reportedBy: {
        id: 'usr_student_2',
        name: 'Chloe Bennett',
        email: 'chloe@campus.edu'
      },
      assignedTo: {
        id: 'usr_staff_1',
        name: 'Sam Walker',
        specialty: 'Electrical'
      },
      upvotes: 5,
      upvotedBy: ['usr_student_2'],
      qrCodeId: 'QR-UNION-DOOR',
      slaHours: 4,
      resolutionNote: 'Installed new tempered safety glass panel and replaced emergency panic push-bar.',
      resolutionProofUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
      resolvedAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
      statusHistory: [
        { status: 'Submitted', timestamp: new Date(Date.now() - 28 * 3600 * 1000).toISOString(), note: 'Emergency hazard reported' },
        { status: 'AI Verified', timestamp: new Date(Date.now() - 27.9 * 3600 * 1000).toISOString(), note: 'Auto-flagged as Safety Hazard' },
        { status: 'Assigned', timestamp: new Date(Date.now() - 27 * 3600 * 1000).toISOString(), note: 'Assigned to Facility response team' },
        { status: 'In Progress', timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), note: 'Area cordoned off and glass cleanup started' },
        { status: 'Resolved', timestamp: new Date(Date.now() - 18 * 3600 * 1000).toISOString(), note: 'New tempered glass installed & safety inspected' }
      ]
    },
    {
      id: 'FMC-106',
      title: 'Water Cooler Dispenser Making Strange Hum and Not Cooling',
      description: 'The drinking fountain in the Cafeteria annex is dispensing room-temperature water with a loud grinding motor sound.',
      category: 'Sanitation',
      location: {
        building: 'Student Dining Hall',
        floor: 'Ground Floor',
        room: 'Cafeteria Annex Water Station',
        coordinates: { lat: 37.7770, lng: -122.4180 }
      },
      imageUrl: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=800&auto=format&fit=crop&q=80',
      status: 'Submitted',
      priority: 'LOW',
      aiConfidence: 0.86,
      aiReasoning: 'Non-hazardous sanitation and utility issue. Low urgency.',
      reportedBy: {
        id: 'usr_student_1',
        name: 'Alex Rivera',
        email: 'alex@campus.edu'
      },
      assignedTo: null,
      upvotes: 4,
      upvotedBy: ['usr_student_1'],
      qrCodeId: 'QR-CAFE-WATER',
      slaHours: 48,
      createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      statusHistory: [
        { status: 'Submitted', timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), note: 'Submitted via Web' }
      ]
    }
  ];

  const qrCodes = [
    {
      id: 'QR-SCI-102',
      code: 'SCI-B-LAB102',
      name: 'Science Block B – Room 102 Lab',
      building: 'Science Block B',
      floor: '1st Floor',
      room: 'Lab 102',
      category: 'Classroom/AV',
      description: 'Advanced Chemistry & Physics Research Lab',
      qrDataUrl: '',
      scanCount: 19
    },
    {
      id: 'QR-ENG-REST-2',
      code: 'ENG-A-FL2-REST',
      name: 'Engineering Block A – 2nd Floor Restroom',
      building: 'Engineering Block A',
      floor: '2nd Floor',
      room: 'East Wing Restroom',
      category: 'Plumbing',
      description: 'Facility & Plumbing Station',
      qrDataUrl: '',
      scanCount: 42
    },
    {
      id: 'QR-LIB-3B',
      code: 'LIB-3B-AC',
      name: 'Central Library – 3rd Floor Quiet Zone',
      building: 'Central Library',
      floor: '3rd Floor',
      room: 'Silent Study Zone 3B',
      category: 'HVAC',
      description: 'HVAC Unit 3-East & Reading Desks',
      qrDataUrl: '',
      scanCount: 56
    },
    {
      id: 'QR-H3-WIFI',
      code: 'H3-CORR-AP401',
      name: 'Hostel 3 – Cedar Hall Wi-Fi AP 401',
      building: 'Hostel 3 (Cedar Hall)',
      floor: '4th Floor',
      room: 'Corridor Junction 4',
      category: 'Internet/Wi-Fi',
      description: 'Cisco Campus Wi-Fi 6 Access Point',
      qrDataUrl: '',
      scanCount: 78
    },
    {
      id: 'QR-CAFE-WATER',
      code: 'CAFE-WATER-STN',
      name: 'Student Dining Hall – Water Station',
      building: 'Student Dining Hall',
      floor: 'Ground Floor',
      room: 'Cafeteria Annex Water Station',
      category: 'Sanitation',
      description: 'Filtered RO Chilled Water Station',
      qrDataUrl: '',
      scanCount: 31
    },
    {
      id: 'QR-UNION-DOOR',
      code: 'UNION-EXIT-SOUTH',
      name: 'Student Union – South Emergency Exit',
      building: 'Student Union Hub',
      floor: 'Ground Floor',
      room: 'South Emergency Stairwell',
      category: 'Infrastructure',
      description: 'Fire Door & Emergency Egress Corridor',
      qrDataUrl: '',
      scanCount: 15
    }
  ];

  const comments = [
    {
      id: 'cmt_1',
      complaintId: 'FMC-101',
      userId: 'usr_staff_1',
      userName: 'Sam Walker (Staff)',
      userRole: 'staff',
      content: 'Power to circuit breaker B-12 has been isolated. I have requested a replacement projector ballast from the central inventory.',
      createdAt: new Date(Date.now() - 1.2 * 3600 * 1000).toISOString()
    },
    {
      id: 'cmt_2',
      complaintId: 'FMC-101',
      userId: 'usr_student_1',
      userName: 'Alex Rivera',
      userRole: 'student',
      content: 'Thank you for the quick response! Professor confirmed lab class can resume once power is safely restored.',
      createdAt: new Date(Date.now() - 0.8 * 3600 * 1000).toISOString()
    },
    {
      id: 'cmt_3',
      complaintId: 'FMC-102',
      userId: 'usr_staff_2',
      userName: 'Maria Torres (Staff)',
      userRole: 'staff',
      content: 'Shutoff valve closed to stop pooling. Sourcing replacement copper fitting from warehouse.',
      createdAt: new Date(Date.now() - 3.5 * 3600 * 1000).toISOString()
    }
  ];

  const notifications = [
    {
      id: 'notif_1',
      userId: 'usr_student_1',
      title: 'Technician Assigned to Your Report',
      message: 'Sam Walker (Electrical) is now handling ticket #FMC-101: Science Lab Projector.',
      type: 'assignment',
      complaintId: 'FMC-101',
      read: false,
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
    },
    {
      id: 'notif_2',
      userId: 'usr_student_1',
      title: 'High Community Upvotes Alert',
      message: 'Your report #FMC-104: Hostel 3 Wi-Fi has reached 38 upvotes! Priority has been elevated.',
      type: 'priority',
      complaintId: 'FMC-104',
      read: false,
      createdAt: new Date(Date.now() - 0.9 * 3600 * 1000).toISOString()
    },
    {
      id: 'notif_3',
      userId: 'usr_admin_1',
      title: 'Critical Safety Hazard Flagged by AI',
      message: 'AI Engine categorized #FMC-101 as CRITICAL (Fire/Sparks risk). Immediate technician dispatch recommended.',
      type: 'alert',
      complaintId: 'FMC-101',
      read: true,
      createdAt: new Date(Date.now() - 2.8 * 3600 * 1000).toISOString()
    },
    {
      id: 'notif_4',
      userId: 'usr_student_2',
      title: 'Issue Resolved & Verified',
      message: 'Ticket #FMC-105: Broken Glass Panel has been marked Resolved with proof of repair.',
      type: 'resolution',
      complaintId: 'FMC-105',
      read: true,
      createdAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString()
    }
  ];

  return { users, complaints, qrCodes, comments, notifications };
};

// Database state management
class Database {
  constructor() {
    this.data = null;
    this.init();
  }

  init() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.error('Error reading database file, re-initializing seed:', err);
        this.reset();
      }
    } else {
      this.reset();
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  reset() {
    this.data = getSeedData();
    this.save();
    return this.data;
  }

  // Users
  getUsers() { return this.data.users; }
  getUserById(id) { return this.data.users.find(u => u.id === id); }
  getUserByEmail(email) { return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase()); }
  createUser(user) {
    this.data.users.push(user);
    this.save();
    return user;
  }

  // Complaints
  getComplaints(filter = {}) {
    let list = [...this.data.complaints];
    if (filter.status && filter.status !== 'All') {
      list = list.filter(c => c.status.toLowerCase() === filter.status.toLowerCase());
    }
    if (filter.category && filter.category !== 'All') {
      list = list.filter(c => c.category.toLowerCase() === filter.category.toLowerCase());
    }
    if (filter.priority && filter.priority !== 'All') {
      list = list.filter(c => c.priority.toLowerCase() === filter.priority.toLowerCase());
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(c => 
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.location.building.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      );
    }
    if (filter.studentId) {
      list = list.filter(c => c.reportedBy.id === filter.studentId);
    }
    // Sort newest first
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list;
  }

  getComplaintById(id) {
    return this.data.complaints.find(c => c.id === id);
  }

  createComplaint(complaint) {
    this.data.complaints.unshift(complaint);
    this.save();
    return complaint;
  }

  updateComplaint(id, updates) {
    const idx = this.data.complaints.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.data.complaints[idx] = {
        ...this.data.complaints[idx],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.save();
      return this.data.complaints[idx];
    }
    return null;
  }

  // QR Codes
  getQRCodes() { return this.data.qrCodes; }
  getQRCodeByCode(code) { return this.data.qrCodes.find(q => q.code === code || q.id === code); }
  createQRCode(qr) {
    this.data.qrCodes.push(qr);
    this.save();
    return qr;
  }
  incrementQRScan(code) {
    const qr = this.getQRCodeByCode(code);
    if (qr) {
      qr.scanCount = (qr.scanCount || 0) + 1;
      this.save();
    }
  }

  // Comments
  getComments(complaintId) {
    return this.data.comments
      .filter(c => c.complaintId === complaintId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  createComment(comment) {
    this.data.comments.push(comment);
    this.save();
    return comment;
  }

  // Notifications
  getNotifications(userId) {
    return this.data.notifications
      .filter(n => !userId || n.userId === userId || n.userId === 'all')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  createNotification(notif) {
    this.data.notifications.unshift(notif);
    this.save();
    return notif;
  }

  markNotificationRead(id) {
    const n = this.data.notifications.find(item => item.id === id);
    if (n) {
      n.read = true;
      this.save();
    }
    return n;
  }

  markAllNotificationsRead(userId) {
    this.data.notifications.forEach(n => {
      if (!userId || n.userId === userId) {
        n.read = true;
      }
    });
    this.save();
  }
}

export const db = new Database();
