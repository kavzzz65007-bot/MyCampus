import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';

import Navbar from './components/Navbar.jsx';
import Hero3D from './components/Hero3D.jsx';
import StatusTracker from './components/StatusTracker.jsx';
import QRCodeHub from './components/QRCodeHub.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import AnalyticsDashboard from './components/AnalyticsDashboard.jsx';
import SubmitComplaintModal from './components/SubmitComplaintModal.jsx';
import AuthModal from './components/AuthModal.jsx';

import {
  Sparkles,
  Shield,
  PhoneCall,
  Clock,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Plus
} from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState('hero');
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [prefillLocation, setPrefillLocation] = useState(null);
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  const handleOpenSubmit = (locationData = null) => {
    setPrefillLocation(locationData);
    setSubmitModalOpen(true);
  };

  const handleSelectStationToReport = (station) => {
    setPrefillLocation({
      code: station.code,
      building: station.building,
      floor: station.floor,
      room: station.room,
      category: station.category
    });
    setSubmitModalOpen(true);
  };

  const handleNavigateTrack = (ticketId = null) => {
    if (ticketId) setSelectedTicketId(ticketId);
    setActiveTab('track');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSubmitModal={() => handleOpenSubmit()}
      />

      {/* Main Tab Content */}
      <main className="flex-1">
        {activeTab === 'hero' && (
          <div>
            <Hero3D
              onOpenSubmit={() => handleOpenSubmit()}
              onOpenQR={() => setActiveTab('qr')}
              onNavigateTrack={() => handleNavigateTrack()}
            />

            {/* Live Campus Issue Feed Preview on Home Page */}
            <div className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 py-12">
              <StatusTracker
                initialTicketId={selectedTicketId}
                onOpenSubmit={() => handleOpenSubmit()}
              />
            </div>
          </div>
        )}

        {activeTab === 'track' && (
          <StatusTracker
            initialTicketId={selectedTicketId}
            onOpenSubmit={() => handleOpenSubmit()}
          />
        )}

        {activeTab === 'qr' && (
          <QRCodeHub onSelectStationToReport={handleSelectStationToReport} />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            onSelectTicketForTracker={(id) => {
              setSelectedTicketId(id);
              setActiveTab('track');
            }}
          />
        )}

        {activeTab === 'analytics' && <AnalyticsDashboard />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md py-8 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-xs">
              F
            </div>
            <span className="font-bold text-slate-900 dark:text-white">FixMyCampus</span>
            <span>— AI-Powered Campus Problem Solver</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-red-500 font-bold">
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Campus Emergency Hotline: Ext 911 / (555) 019-2831</span>
            </span>
            <span>•</span>
            <span className="text-emerald-500 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>All Systems Operational</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <SubmitComplaintModal
        isOpen={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        prefillLocation={prefillLocation}
        onSuccess={(complaint) => {
          setSelectedTicketId(complaint.id);
          setActiveTab('track');
        }}
      />

      <AuthModal />

      {/* Mobile Floating Action Button */}
      <div className="sm:hidden fixed bottom-6 right-6 z-40">
        <button
          onClick={() => handleOpenSubmit()}
          className="w-14 h-14 rounded-full bg-brand-600 text-white shadow-xl flex items-center justify-center active:scale-95"
          title="Report Issue"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
