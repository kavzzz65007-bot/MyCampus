import React, { useState, useEffect } from 'react';
import {
  Shield,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Building,
  RefreshCw,
  Sparkles,
  ChevronDown,
  Upload,
  ArrowUpRight,
  ThumbsUp,
  FileText
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';

const RESOLUTION_PHOTO_PRESETS = [
  { label: 'Repaired AC Vent', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80' },
  { label: 'Fixed Plumbing Pipe', url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80' },
  { label: 'Re-wired Switchboard', url: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=800&auto=format&fit=crop&q=80' },
  { label: 'Classroom Projector Cleaned', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80' }
];

export default function AdminDashboard({ onSelectTicketForTracker }) {
  const { user } = useAuth();
  const { showToast, refreshNotifications } = useNotifications();

  const [complaints, setComplaints] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Resolution modal state
  const [resolveModalComplaint, setResolveModalComplaint] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolutionProofUrl, setResolutionProofUrl] = useState(RESOLUTION_PHOTO_PRESETS[0].url);
  const [submittingResolution, setSubmittingResolution] = useState(false);

  const fetchData = async () => {
    try {
      const [compRes, staffRes] = await Promise.all([
        api.getComplaints(),
        api.getStaff()
      ]);
      setComplaints(compRes.complaints || []);
      setStaffList(staffRes.staff || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssign = async (complaintId, staffId) => {
    try {
      await api.updateComplaint(complaintId, { assignedToId: staffId });
      showToast({ title: 'Technician Assigned', message: 'Staff member dispatched to ticket location.', type: 'success' });
      fetchData();
      refreshNotifications();
    } catch (err) {
      showToast({ title: 'Assignment Failed', message: err.message, type: 'alert' });
    }
  };

  const handleStatusChange = async (complaintId, newStatus) => {
    if (newStatus === 'Resolved') {
      const comp = complaints.find(c => c.id === complaintId);
      setResolveModalComplaint(comp);
      return;
    }

    try {
      await api.updateComplaint(complaintId, { status: newStatus });
      showToast({ title: 'Status Updated', message: `Ticket #${complaintId} marked as ${newStatus}.`, type: 'info' });
      fetchData();
      refreshNotifications();
    } catch (err) {
      showToast({ title: 'Update failed', message: err.message, type: 'alert' });
    }
  };

  const handleConfirmResolution = async (e) => {
    e.preventDefault();
    if (!resolveModalComplaint) return;

    setSubmittingResolution(true);
    try {
      await api.updateComplaint(resolveModalComplaint.id, {
        status: 'Resolved',
        resolutionNote: resolutionNote.trim() || 'Work verified and resolved by campus operations.',
        resolutionProofUrl
      });

      showToast({
        title: 'Ticket Marked Resolved 🎉',
        message: `Issue #${resolveModalComplaint.id} closed and student notified.`,
        type: 'success'
      });

      setResolveModalComplaint(null);
      setResolutionNote('');
      fetchData();
      refreshNotifications();
    } catch (err) {
      showToast({ title: 'Resolution failed', message: err.message, type: 'alert' });
    } finally {
      setSubmittingResolution(false);
    }
  };

  const handleResetData = async () => {
    if (window.confirm('Reset all demo complaints and notifications back to initial demo seeds?')) {
      await api.resetData();
      fetchData();
      refreshNotifications();
      showToast({ title: 'Demo Reset', message: 'Database refreshed with clean seed data.', type: 'info' });
    }
  };

  // Metrics
  const total = complaints.length;
  const critical = complaints.filter(c => c.priority === 'CRITICAL' && c.status !== 'Resolved').length;
  const pendingAssign = complaints.filter(c => !c.assignedTo && c.status !== 'Resolved').length;
  const inProgress = complaints.filter(c => c.status === 'In Progress').length;
  const resolved = complaints.filter(c => c.status === 'Resolved').length;

  // Filtered List
  const filtered = complaints.filter(c => {
    const matchStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchPriority = priorityFilter === 'All' || c.priority === priorityFilter;
    const matchSearch =
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.location?.building?.toLowerCase().includes(search.toLowerCase()) ||
      c.category?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchPriority && matchSearch;
  });

  return (
    <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Campus Operations Dispatch Console
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              Admin & Staff
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Assign technicians, review AI hazard assessments, and upload resolution proof photos.
          </p>
        </div>

        <button
          onClick={handleResetData}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Demo Data</span>
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        <div className="glass-card p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Tickets</span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{total}</div>
        </div>

        <div className="glass-card p-4 border-l-4 border-red-500">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">Critical Emergencies</span>
          <div className="text-2xl font-extrabold text-red-600 dark:text-red-400 mt-1">{critical}</div>
        </div>

        <div className="glass-card p-4 border-l-4 border-amber-500">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Needs Assignment</span>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{pendingAssign}</div>
        </div>

        <div className="glass-card p-4 border-l-4 border-sky-500">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-500">Active In Progress</span>
          <div className="text-2xl font-extrabold text-sky-600 dark:text-sky-400 mt-1">{inProgress}</div>
        </div>

        <div className="glass-card p-4 border-l-4 border-emerald-500 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Resolved</span>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{resolved}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by ID, description, or building..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold outline-none"
          >
            <option value="All">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <strong>{filtered.length}</strong> complaints
        </div>
      </div>

      {/* Complaints Management Table / Cards */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Ticket & Title</th>
                <th className="py-3 px-4">Category & Location</th>
                <th className="py-3 px-4">Priority / SLA</th>
                <th className="py-3 px-4">Assigned Technician</th>
                <th className="py-3 px-4">Status Action</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  {/* Ticket & Title */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-brand-600 dark:text-brand-400">
                        #{item.id}
                      </span>
                      {item.upvotes > 1 && (
                        <span className="px-1.5 py-0.2 rounded bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold text-[10px]">
                          +{item.upvotes}
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white mt-0.5 max-w-xs truncate">
                      {item.title}
                    </div>
                  </td>

                  {/* Category & Location */}
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                      {item.category}
                    </span>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      <span className="truncate max-w-[140px]">{item.location?.building}</span>
                    </div>
                  </td>

                  {/* Priority / SLA */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                        item.priority === 'CRITICAL'
                          ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                          : item.priority === 'HIGH'
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                          : item.priority === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {item.priority}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">
                      SLA: {item.slaHours || 24}h
                    </div>
                  </td>

                  {/* Assigned Technician */}
                  <td className="py-3.5 px-4">
                    <select
                      value={item.assignedTo?.id || ''}
                      onChange={(e) => handleAssign(item.id, e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-xs outline-none focus:ring-1 focus:ring-brand-500 max-w-[160px]"
                    >
                      <option value="">-- Unassigned --</option>
                      {staffList.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.specialty})
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Status Action */}
                  <td className="py-3.5 px-4">
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      className={`px-2.5 py-1.5 rounded-xl border font-bold text-xs outline-none ${
                        item.status === 'Resolved'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : item.status === 'In Progress'
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <option value="Submitted">Submitted</option>
                      <option value="Assigned">Assigned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </td>

                  {/* Inspect Link */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onSelectTicketForTracker(item.id)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-600 dark:text-brand-400 font-bold flex items-center gap-1 ml-auto"
                    >
                      <span>Track</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Proof Upload Modal */}
      {resolveModalComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="w-full max-w-lg glass-panel dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 relative">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>Verify & Resolve Ticket #{resolveModalComplaint.id}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Add completion remarks and resolution proof photo to complete SLA tracking.
            </p>

            <form onSubmit={handleConfirmResolution} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Resolution Notes
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Electrician replaced burnt capacitor and tested circuit. Voltage stable."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Resolution Proof Photo Preset
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {RESOLUTION_PHOTO_PRESETS.map(p => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setResolutionProofUrl(p.url)}
                      className={`p-2 rounded-xl border text-left text-xs font-medium transition-all ${
                        resolutionProofUrl === p.url
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setResolveModalComplaint(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingResolution}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Confirm & Close Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
