# FixMyCampus – AI-Powered Campus Problem Solver 🎓⚡

A modern, responsive, full-stack web application designed to automate, triage, and accelerate facility issue resolutions across university campuses.

---

## 🌟 Key Features

1. **Role-Based Authentication**:
   - Student, Admin, and Maintenance Staff logins.
   - 1-click **Quick Demo Switcher** in the navbar to test as:
     - 🎓 **Alex Rivera** (Student, Computer Science)
     - 🏛️ **Dr. Evelyn Vance** (Campus Admin, Dean of Operations)
     - 🔧 **Rajesh Kumar** (Lead Maintenance Engineer, Electrical & Facilities)

2. **Smart Complaint Filing with Photo & Location**:
   - Title, description, building picker, floor/wing, and room coordinate tags.
   - Photo evidence drag-and-drop, camera snapshot preview, and quick demo presets (e.g., Burst Pipe, Broken AC, Exposed Live Wire).

3. **Autonomous AI Duplicate Detection & Priority Triage**:
   - Real-time text vectorization (TF-IDF & N-gram cosine similarity) scans active complaints as you type.
   - If an identical issue is already tracked in that building, displays an alert with a similarity match % and allows **1-click upvoting** instead of filing duplicates.
   - Algorithmic safety hazard classifier detects sparks, fire, water leaks, gas risks, or academic disruptions, assigning `CRITICAL` (4h SLA), `HIGH` (8h SLA), `MEDIUM` (24h SLA), or `LOW` (48h SLA) priority.

4. **Campus QR Code Issue Stations**:
   - Generates downloadable, printable QR codes for campus spots (Library, Science Labs, Hostels, Dining Hall).
   - Built-in interactive QR scanner modal that pre-fills and locks verified room coordinates.

5. **Real-Time Status Lifecycle Tracker**:
   - Visual 5-step status progression: `Submitted` ➜ `AI Verified` ➜ `Assigned` ➜ `In Progress` ➜ `Resolved`.
   - Before & After photo verification (side-by-side issue vs. resolution proof photo).
   - Live comments and discussion feed between students and maintenance staff.
   - Community upvotes ("I Also Have This Issue") and 1-5 star service rating.

6. **Admin & Staff Operations Console**:
   - Assign tickets to specialized maintenance technicians.
   - Update statuses and upload resolution proof photos.
   - Filter by status, priority, category, or search keywords.

7. **Campus Intelligence & Analytics**:
   - Interactive Chart.js charts: 7-day trend line (Reported vs. Resolved), category doughnut distribution, status pipeline bar chart, and building hotspot rankings.
   - 1-click CSV export of the campus maintenance audit log.

8. **Interactive 3D Hero + Spline Flexibility**:
   - Native Three.js interactive 3D Campus Hologram with mouse parallax tilt, orbital status satellites, and particle constellations.
   - Dedicated toggle button: **"Switch to Spline 3D Embed"** allowing you to paste any Spline scene URL or drop in `@splinetool/react-spline` without runtime errors.

---

## 🚀 Quick Start Guide

### 1. Run the Unified Production Server (Single Port):
```bash
npm start
```
The application will be live at:
👉 **http://localhost:5000**

### 2. Or Run in Development Mode (with Hot Module Replacement):
```bash
npm run dev
```
- Frontend: **http://localhost:5173**
- Backend API: **http://localhost:5000**

---

## 🎨 Adding Your Custom Spline 3D Model

In the hero section:
1. Click the **"Spline 3D Ready"** button in the 3D card header.
2. Click the gear icon to open **Spline 3D Settings**.
3. Paste your public Spline URL (e.g. `https://my.spline.design/your-scene-id/`) and click **Apply Spline Model**.
4. To integrate `@splinetool/react-spline` directly into code, refer to the drop-in instructions provided inside `src/components/Hero3D.jsx`.
