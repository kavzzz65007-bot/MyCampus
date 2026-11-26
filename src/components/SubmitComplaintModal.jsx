import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  AlertTriangle,
  Upload,
  Camera,
  MapPin,
  Building,
  CheckCircle2,
  ThumbsUp,
  Image as ImageIcon,
  X,
  ShieldAlert,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';

const BUILDINGS = [
  'Central Library',
  'Engineering Block A',
  'Science Complex',
  'Boys Hostel Block 1',
  'Girls Hostel Block 2',
  'Student Dining Hall',
  'Sports Arena & Gymnasium',
  'Campus Health Center',
  'Administrative Quad'
];

const CATEGORIES = [
  'Auto (AI Decides)',
  'Electrical',
  'Plumbing',
  'HVAC',
  'Internet/Wi-Fi',
  'Classroom/AV',
  'Sanitation',
  'Infrastructure',
  'Safety & Security'
];

const DEMO_PHOTO_PRESETS = [
  { label: 'Broken AC', url: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800&auto=format&fit=crop&q=80' },
  { label: 'Water Leak', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80' },
  { label: 'Exposed Wire', url: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=800&auto=format&fit=crop&q=80' },
  { label: 'Projector Issue', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80' },
  { label: 'Clogged Sink', url: 'https://images.unsplash.com/photo-1585670210693-e7fdd16b142e?w=800&auto=format&fit=crop&q=80' }
];

export default function SubmitComplaintModal({ isOpen, onClose, prefillLocation = null, onSuccess }) {
  const { user } = useAuth();
  const { showToast, refreshNotifications } = useNotifications();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Auto (AI Decides)');
  const [building, setBuilding] = useState(prefillLocation?.building || BUILDINGS[0]);
  const [floor, setFloor] = useState(prefillLocation?.floor || '1st Floor');
  const [room, setRoom] = useState(prefillLocation?.room || '');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(DEMO_PHOTO_PRESETS[0].url);
  const [loading, setLoading] = useState(false);

  // AI live triage states
  const [aiPreview, setAiPreview] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [analyzingAi, setAnalyzingAi] = useState(false);

  // Sync prefilled location from QR scanner
  useEffect(() => {
    if (prefillLocation) {
      if (prefillLocation.building) setBuilding(prefillLocation.building);
      if (prefillLocation.floor) setFloor(prefillLocation.floor);
      if (prefillLocation.room) setRoom(prefillLocation.room);
      if (prefillLocation.category) setCategory(prefillLocation.category);
    }
  }, [prefillLocation]);

  // Debounced real-time AI Duplicate and Priority classification
  useEffect(() => {
    if (!title.trim() && !description.trim()) {
      setAiPreview(null);
      setDuplicateWarning(null);
      return;
    }

    const timer = setTimeout(async () => {
      setAnalyzingAi(true);
      try {
        const loc = { building, floor, room };
        const catArg = category === 'Auto (AI Decides)' ? null : category;

        // Run priority classifier and duplicate detector in parallel
        const [cls, dup] = await Promise.all([
          api.classifyPreview({ title, description, category: catArg, location: loc }),
          api.checkDuplicate({ title, description, category: catArg, location: loc })
        ]);

        setAiPreview(cls);
        if (dup && dup.isDuplicate) {
          setDuplicateWarning(dup);
        } else {
          setDuplicateWarning(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setAnalyzingAi(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [title, description, category, building, room]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      showToast({ title: 'Missing Information', message: 'Please provide both title and description.', type: 'alert' });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category === 'Auto (AI Decides)' ? '' : category);
      formData.append('building', building);
      formData.append('floor', floor);
      formData.append('room', room || 'General Area');
      formData.append('userId', user?.id || 'usr_student_1');
      formData.append('userName', user?.name || 'Alex Rivera');
      formData.append('userEmail', user?.email || 'student@campus.edu');

      if (prefillLocation?.code) {
        formData.append('qrCodeId', prefillLocation.code);
      }

      if (imageFile) {
        formData.append('image', imageFile);
      } else {
        formData.append('imagePreset', imagePreview);
      }

      const res = await api.createComplaint(formData);

      // Trigger celebration confetti
      confetti({
        particleCount: 90,
        spread: 60,
        origin: { y: 0.6 }
      });

      showToast({
        title: `Ticket Created: #${res.complaint.id}`,
        message: `AI categorized as ${res.complaint.priority} priority. Campus maintenance alerted!`,
        type: res.complaint.priority === 'CRITICAL' ? 'alert' : 'success'
      });

      refreshNotifications();
      onSuccess?.(res.complaint);
      onClose();

      // Reset form
      setTitle('');
      setDescription('');
      setRoom('');
      setImageFile(null);
      setImagePreview(DEMO_PHOTO_PRESETS[0].url);
      setAiPreview(null);
      setDuplicateWarning(null);
    } catch (err) {
      showToast({ title: 'Submission Failed', message: err.message, type: 'alert' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpvoteExisting = async (existingId) => {
    try {
      await api.upvoteComplaint(existingId, user?.id || 'usr_student_1');
      showToast({
        title: 'Upvoted Existing Ticket!',
        message: `You upvoted #${existingId}. Maintenance priority boosted without creating a duplicate.`,
        type: 'success'
      });
      onClose();
      onSuccess?.({ id: existingId });
    } catch (err) {
      showToast({ title: 'Upvote error', message: err.message, type: 'alert' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl glass-panel dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 my-8 relative text-left">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                Submit Campus Issue
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AI analyzes duplicate reports and assigns real-time priority
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI DUPLICATE WARNING BANNER */}
        {duplicateWarning && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 animate-fadeIn">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    AI Duplicate Detected ({duplicateWarning.highestSimilarity}% Match)
                  </h4>
                </div>
                <p className="text-xs mt-1 leading-relaxed">
                  {duplicateWarning.recommendation}
                </p>

                {duplicateWarning.matchedComplaint && (
                  <div className="mt-3 p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between gap-3">
                    <div className="truncate">
                      <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400 mr-2">
                        #{duplicateWarning.matchedComplaint.id}
                      </span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {duplicateWarning.matchedComplaint.title}
                      </span>
                      <div className="text-[10px] text-slate-500">
                        {duplicateWarning.matchedComplaint.location.building} • Status: {duplicateWarning.matchedComplaint.status}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUpvoteExisting(duplicateWarning.matchedComplaint.id)}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Upvote Existing</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
          {/* Issue Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Issue Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Water dripping from ceiling in Room 304, Exposed wiring on switchboard"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Detailed Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe the exact location, safety hazards (sparks, smell, leaks), and how it affects campus members..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none"
            />
          </div>

          {/* AI Priority & Category Live Preview Pill */}
          {aiPreview && (
            <div className="p-3 rounded-2xl bg-brand-50/60 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60 flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-brand-500 text-white mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-1 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900 dark:text-white">
                    AI Live Assessment:
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md font-extrabold uppercase text-[10px] ${
                      aiPreview.priority === 'CRITICAL'
                        ? 'bg-red-500 text-white animate-pulse'
                        : aiPreview.priority === 'HIGH'
                        ? 'bg-orange-500 text-white'
                        : aiPreview.priority === 'MEDIUM'
                        ? 'bg-amber-500 text-white'
                        : 'bg-emerald-500 text-white'
                    }`}
                  >
                    {aiPreview.priority} Priority
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    SLA Target: <strong>{aiPreview.slaHours}h</strong> ({Math.round(aiPreview.confidence * 100)}% match)
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                  {aiPreview.aiReasoning}
                </p>
              </div>
            </div>
          )}

          {/* Category & Location Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-brand-500 outline-none"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Campus Building
              </label>
              <select
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-brand-500 outline-none"
              >
                {BUILDINGS.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Floor / Wing
              </label>
              <input
                type="text"
                placeholder="e.g. 2nd Floor, East Wing"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Room or Specific Spot
              </label>
              <input
                type="text"
                placeholder="e.g. Lab 204, Water cooler hallway"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
          </div>

          {/* Photo Attachment & Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Photo Evidence
              </label>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Select preset or upload your photo
              </span>
            </div>

            {/* Photo preset chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {DEMO_PHOTO_PRESETS.map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setImagePreview(preset.url);
                    setImageFile(null);
                  }}
                  className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                    imagePreview === preset.url
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Preview & Upload Bar */}
            <div className="flex items-center gap-4 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <img
                src={imagePreview}
                alt="Issue Preview"
                className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors">
                    <Upload className="w-3.5 h-3.5 text-brand-500" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  JPG, PNG, or camera capture up to 10MB
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-500/25 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting & AI Triage...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Submit Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
