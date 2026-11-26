import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';
import { useAuth } from './AuthContext.jsx';

const NotificationContext = createContext();

// Play a subtle high-tech campus chime using Web Audio API (works offline, zero assets needed)
function playChime(type = 'info') {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'alert' || type === 'critical') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (e) {
    // Audio autoplay restrictions or headless environment
  }
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((toast) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    const newToast = {
      id,
      title: toast.title || 'Notice',
      message: toast.message || '',
      type: toast.type || 'info', // 'success' | 'alert' | 'info' | 'resolution'
      duration: toast.duration || 4500
    };

    setToasts(prev => [newToast, ...prev.slice(0, 4)]);
    playChime(newToast.type);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, newToast.duration);
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.getNotifications(user?.id);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (e) {
      // Server warming up
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead(user?.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toasts,
        showToast,
        markRead,
        markAllRead,
        refreshNotifications: fetchNotifications
      }}
    >
      {children}

      {/* Floating Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 pointer-events-none max-w-sm w-full">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 ${
              toast.type === 'alert' || toast.type === 'critical'
                ? 'bg-red-500/90 text-white border-red-600'
                : toast.type === 'success' || toast.type === 'resolution'
                ? 'bg-emerald-600/90 text-white border-emerald-700'
                : 'bg-slate-900/95 dark:bg-slate-800/95 text-white border-slate-700'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">
                {toast.type === 'alert' || toast.type === 'critical' ? '🚨' : toast.type === 'success' || toast.type === 'resolution' ? '✅' : '🔔'}
              </span>
              <div className="flex-1">
                <h4 className="font-semibold text-sm leading-tight">{toast.title}</h4>
                <p className="text-xs mt-1 text-slate-100 opacity-90">{toast.message}</p>
              </div>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-white/70 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
