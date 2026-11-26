import React, { useState, useEffect } from 'react';
import {
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Building,
  User,
  ThumbsUp,
  MessageSquare,
  Send,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Star,
  ExternalLink,
  Filter,
  Image as ImageIcon
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';

const STATUS_STEPS = ['Submitted', 'AI Verified', 'Assigned', 'In Progress', 'Resolved'];

export default function StatusTracker({ initialTicketId, onOpenSubmit }) {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [comments, setComments] = useState([]);
  const [searchQuery, setSearchQuery] = useState(initialTicketId || '');
  const [statusFilter, setStatusFilter] = useState('All');
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const fetchComplaints = async () => {
    try {
      const data = await api.getComplaints();
      setComplaints(data.complaints || []);
      if (!selectedComplaint && data.complaints?.length > 0) {
        if (initialTicketId) {
          const match = data.complaints.find(c => c.id.toLowerCase() === initialTicketId.toLowerCase());
          setSelectedComplaint(match || data.complaints[0]);
        } else {
          setSelectedComplaint(data.complaints[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
    const interval = setInterval(fetchComplaints, 8000);
    return () => clearInterval(interval);
  }, []);

  // Fetch comments whenever selected complaint changes
  useEffect(() => {
    if (selectedComplaint?.id) {
      api.getComplaintById(selectedComplaint.id)
        .then(res => {
          setComments(res.comments || []);
          setSelectedComplaint(res.complaint);
        })
        .catch(err => console.error(err));
    }
  }, [selectedComplaint?.id]);

  const handleUpvote = async (complaintId) => {
    try {
      const res = await api.upvoteComplaint(complaintId, user?.id || 'usr_student_1');
      setSelectedComplaint(prev => ({ ...prev, upvotes: res.upvotes }));
      setComplaints(prev =>
        prev.map(c => (c.id === complaintId ? { ...c, upvotes: res.upvotes } : c))
      );
      showToast({
        title: res.hasUpvoted ? 'Upvote Added' : 'Upvote Removed',
        message: res.hasUpvoted ? 'Community upvote recorded.' : 'Upvote retracted.',
        type: 'info'
      });
    } catch (err) {
      showToast({ title: 'Upvote failed', message: err.message, type: 'alert' });
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedComplaint) return;

    setCommentLoading(true);
    try {
      const res = await api.addComment(selectedComplaint.id, {
        userId: user?.id || 'usr_student_1',
        userName: user?.name || 'Alex Rivera',
        userRole: user?.role || 'student',
        content: newComment.trim()
      });
      setComments(prev => [...prev, res.comment]);
      setNewComment('');
      showToast({ title: 'Comment Posted', message: 'Staff & subscribers notified.', type: 'success' });
    } catch (err) {
      showToast({ title: 'Error', message: err.message, type: 'alert' });
    } finally {
      setCommentLoading(false);
    }
  };

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch =
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location?.building?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStepIndex = (status) => {
    const idx = STATUS_STEPS.indexOf(status);
    return idx === -1 ? 1 : idx;
  };

  return (
    <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 text-left">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Real-Time Complaint Tracker</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track status progression, technician assignments, SLA countdowns, and resolution proof.
          </p>
        </div>

        <button
          onClick={onOpenSubmit}
          className="self-start sm:self-auto px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
        >
          + File New Complaint
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Complaint Search & List */}
        <div className="lg:col-span-5 space-y-4 text-left">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Ticket ID (e.g. FMC-101) or building..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-brand-500 outline-none shadow-sm"
            />
          </div>

          {/* Status filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {['All', 'Submitted', 'Assigned', 'In Progress', 'Resolved'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                  statusFilter === st
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Ticket List */}
          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                Loading campus issues...
              </div>
            ) : filteredComplaints.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                No matching complaints found.
              </div>
            ) : (
              filteredComplaints.map(item => {
                const isSelected = selectedComplaint?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedComplaint(item)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'bg-brand-50/70 dark:bg-brand-950/40 border-brand-500 shadow-md ring-1 ring-brand-500'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                          #{item.id}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
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
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          item.status === 'Resolved'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : item.status === 'In Progress'
                            ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1.5 line-clamp-1">
                      {item.title}
                    </h4>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-2">
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[140px]">{item.location?.building}</span>
                      </span>
                      <span>•</span>
                      <span>{item.category}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-400">
                        <ThumbsUp className="w-3 h-3" />
                        {item.upvotes || 0}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Complaint View & Timeline */}
        <div className="lg:col-span-7 space-y-6 text-left">
          {selectedComplaint ? (
            <div className="glass-card p-6 sm:p-8 space-y-6">
              
              {/* Header Info */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-extrabold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2.5 py-1 rounded-lg border border-brand-200 dark:border-brand-800">
                      #{selectedComplaint.id}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Reported {new Date(selectedComplaint.createdAt).toLocaleDateString()} at{' '}
                      {new Date(selectedComplaint.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <button
                    onClick={() => handleUpvote(selectedComplaint.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm transition-all"
                  >
                    <ThumbsUp className="w-4 h-4 text-brand-500" />
                    <span>I Also Have This Issue ({selectedComplaint.upvotes || 0})</span>
                  </button>
                </div>

                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  {selectedComplaint.title}
                </h3>

                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {selectedComplaint.description}
                </p>
              </div>

              {/* Status Stepper Progression */}
              <div className="py-4 border-y border-slate-200/80 dark:border-slate-800/80">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                  Resolution Lifecycle
                </div>

                <div className="grid grid-cols-5 gap-2 relative">
                  {STATUS_STEPS.map((step, idx) => {
                    const currentIdx = getStepIndex(selectedComplaint.status);
                    const isDone = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;

                    return (
                      <div key={step} className="flex flex-col items-center text-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-2 transition-all ${
                            isCurrent
                              ? 'bg-brand-600 text-white ring-4 ring-brand-100 dark:ring-brand-950 shadow-md'
                              : isDone
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isDone && !isCurrent ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <span
                          className={`text-[11px] font-semibold leading-tight ${
                            isCurrent
                              ? 'text-brand-600 dark:text-brand-400 font-bold'
                              : isDone
                              ? 'text-slate-800 dark:text-slate-200'
                              : 'text-slate-400'
                          }`}
                        >
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location</span>
                  <div className="font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-brand-500" />
                    <span>{selectedComplaint.location?.building}</span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                    {selectedComplaint.location?.floor} • {selectedComplaint.location?.room}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned Technician</span>
                  {selectedComplaint.assignedTo ? (
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
                        <User className="w-4 h-4 text-emerald-500" />
                        <span>{selectedComplaint.assignedTo.name}</span>
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                        {selectedComplaint.assignedTo.specialty}
                      </div>
                    </div>
                  ) : (
                    <div className="text-amber-600 dark:text-amber-400 font-semibold mt-1">
                      Awaiting Department Dispatch
                    </div>
                  )}
                </div>
              </div>

              {/* AI Diagnostic Card */}
              {selectedComplaint.aiReasoning && (
                <div className="p-4 rounded-2xl bg-brand-50/60 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60 text-xs">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    <span className="font-bold text-slate-900 dark:text-white">AI Engine Diagnostics</span>
                    <span className="px-2 py-0.5 bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 rounded font-bold text-[10px]">
                      SLA: {selectedComplaint.slaHours || 24}h
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {selectedComplaint.aiReasoning}
                  </p>
                </div>
              )}

              {/* Before & After Photo Comparison */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-brand-500" />
                  <span>Photo Evidence & Verification</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Before Photo */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <div className="px-3 py-1.5 bg-slate-200/80 dark:bg-slate-700/80 text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>BEFORE (Reported Issue)</span>
                    </div>
                    <img
                      src={selectedComplaint.imageUrl}
                      alt="Reported Issue"
                      className="w-full h-44 object-cover"
                    />
                  </div>

                  {/* After Photo (If resolved) */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-800 flex flex-col justify-center">
                    <div className="px-3 py-1.5 bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-between">
                      <span>AFTER (Resolution Proof)</span>
                      {selectedComplaint.status === 'Resolved' && <span>VERIFIED</span>}
                    </div>
                    {selectedComplaint.resolutionProofUrl ? (
                      <img
                        src={selectedComplaint.resolutionProofUrl}
                        alt="Resolution Proof"
                        className="w-full h-44 object-cover"
                      />
                    ) : (
                      <div className="h-44 flex flex-col items-center justify-center p-4 text-center text-slate-400 text-xs">
                        <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                        <span>Work currently in progress.</span>
                        <span className="text-[11px] text-slate-400 mt-1">Resolution photo will be uploaded upon fix.</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedComplaint.resolutionNote && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 mt-2">
                    <span className="font-bold">Maintenance Resolution Note: </span>
                    {selectedComplaint.resolutionNote}
                  </div>
                )}
              </div>

              {/* Student Rating if Resolved */}
              {selectedComplaint.status === 'Resolved' && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">
                        Rate Maintenance Service
                      </h4>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                        Help campus operations improve technician response times.
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={() => {
                            setRating(star);
                            setRatingSubmitted(true);
                            showToast({ title: 'Feedback Recorded', message: `Thank you for rating ${star} stars!`, type: 'success' });
                          }}
                          className={`p-1 text-lg ${star <= rating ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Discussion & Updates Thread */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-brand-500" />
                  <span>Ticket Activity & Messages ({comments.length})</span>
                </h4>

                <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                  {comments.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No comments yet on this ticket.</p>
                  ) : (
                    comments.map(c => (
                      <div
                        key={c.id}
                        className={`p-3 rounded-2xl text-xs ${
                          c.userRole === 'staff' || c.userRole === 'admin'
                            ? 'bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800'
                            : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white mb-1">
                          <span className="flex items-center gap-1.5">
                            <span>{c.userName}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 font-semibold uppercase text-slate-600 dark:text-slate-300">
                              {c.userRole}
                            </span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Comment Input */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a message or ask maintenance for an update..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="submit"
                    disabled={commentLoading || !newComment.trim()}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              Select a ticket on the left to view real-time status details.
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
