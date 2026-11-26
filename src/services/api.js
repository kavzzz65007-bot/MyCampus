// Frontend API client with fallback simulation and real backend connectivity

const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('fmc_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Auth
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Login failed');
    }
    return res.json();
  },

  async register(userData) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Registration failed');
    }
    return res.json();
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  },

  // Complaints
  async getComplaints(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'All') params.append('status', filters.status);
    if (filters.category && filters.category !== 'All') params.append('category', filters.category);
    if (filters.priority && filters.priority !== 'All') params.append('priority', filters.priority);
    if (filters.search) params.append('search', filters.search);
    if (filters.studentId) params.append('studentId', filters.studentId);

    const res = await fetch(`${API_BASE}/complaints?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch complaints');
    return res.json();
  },

  async getComplaintById(id) {
    const res = await fetch(`${API_BASE}/complaints/${id}`);
    if (!res.ok) throw new Error('Complaint not found');
    return res.json();
  },

  async createComplaint(formData) {
    // If formData is FormData instance, send multipart/form-data
    const isFormData = formData instanceof FormData;
    const res = await fetch(`${API_BASE}/complaints`, {
      method: 'POST',
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
      body: isFormData ? formData : JSON.stringify(formData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit complaint');
    }
    return res.json();
  },

  async checkDuplicate(payload) {
    const res = await fetch(`${API_BASE}/complaints/check-duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) return { isDuplicate: false, matches: [] };
    return res.json();
  },

  async classifyPreview(payload) {
    const res = await fetch(`${API_BASE}/complaints/classify-preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) return null;
    return res.json();
  },

  async upvoteComplaint(id, userId) {
    const res = await fetch(`${API_BASE}/complaints/${id}/upvote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    if (!res.ok) throw new Error('Failed to upvote');
    return res.json();
  },

  async addComment(id, commentData) {
    const res = await fetch(`${API_BASE}/complaints/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(commentData)
    });
    if (!res.ok) throw new Error('Failed to post comment');
    return res.json();
  },

  async updateComplaint(id, updateData) {
    const res = await fetch(`${API_BASE}/complaints/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(updateData)
    });
    if (!res.ok) throw new Error('Failed to update complaint');
    return res.json();
  },

  // QR Codes
  async getQRCodes() {
    const res = await fetch(`${API_BASE}/qr-codes`);
    if (!res.ok) throw new Error('Failed to fetch QR codes');
    return res.json();
  },

  async getQRCode(code) {
    const res = await fetch(`${API_BASE}/qr-codes/${code}`);
    if (!res.ok) throw new Error('QR spot not found');
    return res.json();
  },

  async createQRCode(qrData) {
    const res = await fetch(`${API_BASE}/qr-codes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(qrData)
    });
    if (!res.ok) throw new Error('Failed to generate QR code');
    return res.json();
  },

  // Analytics
  async getAnalytics() {
    const res = await fetch(`${API_BASE}/analytics`);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  // Notifications
  async getNotifications(userId) {
    const res = await fetch(`${API_BASE}/notifications?userId=${userId || ''}`);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  async markNotificationRead(id) {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH'
    });
    return res.json();
  },

  async markAllNotificationsRead(userId) {
    const res = await fetch(`${API_BASE}/notifications/mark-all-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    return res.json();
  },

  // Staff
  async getStaff() {
    const res = await fetch(`${API_BASE}/staff`);
    if (!res.ok) throw new Error('Failed to fetch staff directory');
    return res.json();
  },

  // Reset
  async resetData() {
    const res = await fetch(`${API_BASE}/reset-data`, { method: 'POST' });
    return res.json();
  }
};
