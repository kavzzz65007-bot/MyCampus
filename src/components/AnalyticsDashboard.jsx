import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  BarChart3,
  TrendingUp,
  Download,
  ShieldCheck,
  Clock,
  Sparkles,
  Building,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api.js';
import { useNotifications } from '../context/NotificationContext.jsx';

// Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AnalyticsDashboard() {
  const { showToast } = useNotifications();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAnalytics()
      .then(res => setData(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleExportCSV = async () => {
    try {
      const compRes = await api.getComplaints();
      const list = compRes.complaints || [];

      const headers = ['Ticket_ID', 'Title', 'Category', 'Priority', 'Status', 'Building', 'Room', 'Reported_Date', 'SLA_Hours', 'Upvotes'];
      const rows = list.map(c => [
        c.id,
        `"${c.title.replace(/"/g, '""')}"`,
        c.category,
        c.priority,
        c.status,
        `"${c.location?.building || ''}"`,
        `"${c.location?.room || ''}"`,
        c.createdAt,
        c.slaHours,
        c.upvotes || 0
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `FixMyCampus_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast({ title: 'Export Generated', message: 'Campus complaint dataset downloaded as CSV.', type: 'success' });
    } catch (err) {
      showToast({ title: 'Export Failed', message: err.message, type: 'alert' });
    }
  };

  if (loading || !data) {
    return (
      <div className="py-20 text-center text-slate-400 text-sm">
        Compiling campus analytics and SLA compliance...
      </div>
    );
  }

  // 1. Category Doughnut Chart Data
  const categoryLabels = Object.keys(data.categoryCounts || {});
  const categoryValues = Object.values(data.categoryCounts || {});
  const categoryChartData = {
    labels: categoryLabels,
    datasets: [
      {
        data: categoryValues,
        backgroundColor: [
          '#0ea5e9',
          '#6366f1',
          '#ec4899',
          '#f59e0b',
          '#10b981',
          '#8b5cf6',
          '#14b8a6'
        ],
        borderWidth: 0
      }
    ]
  };

  // 2. Status Bar Chart Data
  const statusChartData = {
    labels: ['Submitted', 'Assigned', 'In Progress', 'Resolved'],
    datasets: [
      {
        label: 'Issues Count',
        data: [data.submitted, data.assigned, data.inProgress, data.resolved],
        backgroundColor: ['#94a3b8', '#f59e0b', '#38bdf8', '#10b981'],
        borderRadius: 8
      }
    ]
  };

  // 3. 7-Day Trend Line Chart Data
  const trendChartData = {
    labels: data.trendData?.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Issues Reported',
        data: data.trendData?.reported || [4, 6, 5, 9, 7, 3, 5],
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.15)',
        tension: 0.35,
        fill: true
      },
      {
        label: 'Issues Resolved',
        data: data.trendData?.resolved || [3, 5, 4, 8, 6, 4, 5],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.35,
        fill: true
      }
    ]
  };

  return (
    <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Campus Intelligence & SLA Analytics</span>
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time resolution rates, department workloads, and building incident distribution.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 transition-all self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export Audit CSV Report</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Resolution Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
            {data.resolutionRate}%
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 inline-block">
            +6.2% vs last week
          </span>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg Resolution Speed</span>
            <Clock className="w-4 h-4 text-brand-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
            {data.avgResolutionHours}h
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 inline-block">
            Target SLA: &lt; 24h
          </span>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">SLA Compliance</span>
            <ShieldCheck className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-3xl font-black text-sky-600 dark:text-sky-400 mt-1">
            {data.slaComplianceRate}%
          </div>
          <span className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold mt-1 inline-block">
            Within promised timeline
          </span>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">AI Duplicate Catch</span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-3xl font-black text-purple-600 dark:text-purple-400 mt-1">
            87%
          </div>
          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-1 inline-block">
            Duplicates diverted to upvotes
          </span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        
        {/* 7-Day Trend Line Chart */}
        <div className="lg:col-span-8 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Incident Volume vs. Maintenance Resolutions (7 Days)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Comparison between student-submitted reports and verified maintenance fixes.
              </p>
            </div>
            <TrendingUp className="w-5 h-5 text-brand-500" />
          </div>
          <div className="h-64 sm:h-72">
            <Line
              data={trendChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top' }
                },
                scales: {
                  y: { beginAtZero: true }
                }
              }}
            />
          </div>
        </div>

        {/* Category Breakdown Doughnut */}
        <div className="lg:col-span-4 glass-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Complaints by Category
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 mb-4">
              Distribution of facility problem types.
            </p>
            <div className="h-56 relative flex items-center justify-center">
              <Doughnut
                data={categoryChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar & Building Hotspots Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Status Distribution */}
        <div className="lg:col-span-6 glass-card p-6">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-1">
            Status Pipeline Breakdown
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Current queue status across campus maintenance teams.
          </p>
          <div className="h-56">
            <Bar
              data={statusChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  y: { beginAtZero: true }
                }
              }}
            />
          </div>
        </div>

        {/* Building Hotspots */}
        <div className="lg:col-span-6 glass-card p-6">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <Building className="w-4 h-4 text-brand-500" />
            <span>Building Incident Hotspots</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Campus zones requiring highest operational attention.
          </p>

          <div className="space-y-3">
            {Object.entries(data.buildingCounts || {})
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([bName, count]) => {
                const percentage = Math.round((count / (data.total || 1)) * 100);
                return (
                  <div key={bName}>
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-800 dark:text-slate-200">{bName}</span>
                      <span className="text-brand-600 dark:text-brand-400 font-bold">
                        {count} tickets ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 to-sky-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(10, percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

      </div>
    </section>
  );
}
