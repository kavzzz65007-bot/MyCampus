import React, { useState, useEffect } from 'react';
import {
  QrCode,
  MapPin,
  Building,
  Camera,
  Download,
  PlusCircle,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Scan,
  RefreshCw,
  X
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';

export default function QRCodeHub({ onSelectStationToReport }) {
  const { isAdmin } = useAuth();
  const { showToast } = useNotifications();

  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New QR Code form
  const [name, setName] = useState('');
  const [building, setBuilding] = useState('Central Library');
  const [floor, setFloor] = useState('2nd Floor');
  const [room, setRoom] = useState('');
  const [category, setCategory] = useState('General');
  const [description, setDescription] = useState('');

  const fetchQRs = async () => {
    try {
      const data = await api.getQRCodes();
      setQrCodes(data.qrCodes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQRs();
  }, []);

  const handleCreateQR = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createQRCode({ name, building, floor, room, category, description });
      setQrCodes(prev => [res.qrCode, ...prev]);
      setCreateModalOpen(false);
      showToast({ title: 'QR Station Created', message: `${name} QR code generated and active.`, type: 'success' });
      setName('');
      setRoom('');
    } catch (err) {
      showToast({ title: 'Error', message: err.message, type: 'alert' });
    }
  };

  const handleSimulateScan = (station) => {
    showToast({
      title: 'QR Code Scanned! 📱',
      message: `Verified Location: ${station.name} (${station.building})`,
      type: 'success'
    });
    setScannerOpen(false);
    onSelectStationToReport(station);
  };

  return (
    <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Campus QR Issue Stations</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300 font-bold">
              Instant Triage
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Scan physical QR posters across campus to report issues with pre-verified room coordinates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setScannerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-600 to-sky-600 hover:from-brand-500 hover:to-sky-500 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 transition-all"
          >
            <Scan className="w-4 h-4" />
            <span>Open QR Scanner</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              <PlusCircle className="w-4 h-4 text-brand-500" />
              <span>Create Station</span>
            </button>
          )}
        </div>
      </div>

      {/* QR Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-sm">
            Loading campus QR locations...
          </div>
        ) : (
          qrCodes.map(qr => (
            <div
              key={qr.id}
              className="glass-card p-6 flex flex-col justify-between hover:border-brand-500/60 transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                    {qr.code}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase">
                    {qr.category}
                  </span>
                </div>

                {/* QR Image Preview */}
                <div className="my-4 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                  {qr.qrDataUrl ? (
                    <img
                      src={qr.qrDataUrl}
                      alt={qr.name}
                      className="w-40 h-40 rounded-xl shadow-sm border border-white dark:border-slate-800 bg-white p-2"
                    />
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center text-slate-400">
                      <QrCode className="w-16 h-16 animate-pulse text-brand-500" />
                    </div>
                  )}
                  <span className="text-[10px] text-slate-400 mt-2 font-mono">
                    Scans logged: {qr.scanCount || 0}
                  </span>
                </div>

                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  {qr.name}
                </h4>

                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                  <span>{qr.building} • {qr.floor} ({qr.room})</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <a
                  href={qr.qrDataUrl}
                  download={`FixMyCampus_${qr.code}.png`}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>

                <button
                  onClick={() => handleSimulateScan(qr)}
                  className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Scan className="w-3.5 h-3.5" />
                  <span>Test Scan</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Interactive QR Scanner Modal */}
      {scannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Scan className="w-5 h-5 text-brand-500" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Campus QR Code Scanner
                </h3>
              </div>
              <button
                onClick={() => setScannerOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Live Camera Viewfinder */}
            <div className="my-5 relative rounded-2xl overflow-hidden bg-slate-950 aspect-square flex flex-col items-center justify-center border-2 border-brand-500/50 shadow-inner">
              <div className="absolute inset-8 border-2 border-dashed border-sky-400/80 rounded-2xl pointer-events-none animate-pulse" />
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent absolute top-1/2 -translate-y-1/2 animate-bounce" />

              <div className="text-center p-6 z-10">
                <Camera className="w-10 h-10 text-cyan-400 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-medium text-slate-300">
                  Align camera with FixMyCampus QR code
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Or select a campus spot below to simulate instant scan:
                </p>
              </div>
            </div>

            {/* Quick Simulate Buttons */}
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {qrCodes.slice(0, 4).map(station => (
                <button
                  key={station.id}
                  onClick={() => handleSimulateScan(station)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950/60 text-xs text-left transition-colors"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{station.name}</div>
                    <div className="text-[10px] text-slate-400">{station.building} • {station.room}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-brand-500 text-white text-[10px] font-bold">
                    Scan Here
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Admin: Create QR Station Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="w-full max-w-lg glass-panel dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-brand-500" />
                <span>Create Campus QR Station</span>
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQR} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Station Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Lab 102 - Chemistry Prep"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Building
                  </label>
                  <input
                    type="text"
                    required
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Room / Spot
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Room 102"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Generate & Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
