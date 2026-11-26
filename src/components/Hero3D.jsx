import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Sparkles,
  PlusCircle,
  QrCode,
  Search,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Zap,
  Layers,
  RotateCw,
  Maximize2
} from 'lucide-react';

const DEFAULT_SPLINE_URL = 'https://prod.spline.design/Pj9sCtZBqa6HieUp/scene.splinecode';

export default function Hero3D({ onOpenSubmit, onOpenQR, onNavigateTrack }) {
  const mountRef = useRef(null);
  const [splineLoaded, setSplineLoaded] = useState(false);
  const [splineKey, setSplineKey] = useState(0); // for reload if needed
  const [useFallback, setUseFallback] = useState(false);

  // Fallback Three.js animation if user toggles or if offline
  useEffect(() => {
    if (!useFallback || !mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 480;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 2, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x0e8ce9, 3, 50);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const coreGeo = new THREE.IcosahedronGeometry(1.6, 2);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      wireframe: true,
      transparent: true,
      opacity: 0.85
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    scene.add(coreMesh);

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      coreMesh.rotation.y += 0.01;
      coreMesh.rotation.x += 0.005;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      coreGeo.dispose();
      coreMat.dispose();
    };
  }, [useFallback]);

  // Listen for spline-viewer load event
  useEffect(() => {
    const handleSplineLoaded = () => {
      setSplineLoaded(true);
    };

    const viewer = document.querySelector('spline-viewer');
    if (viewer) {
      viewer.addEventListener('load-complete', handleSplineLoaded);
    }

    // Safety timeout in case load-complete event is skipped
    const timer = setTimeout(() => setSplineLoaded(true), 2500);

    return () => {
      clearTimeout(timer);
      if (viewer) {
        viewer.removeEventListener('load-complete', handleSplineLoaded);
      }
    };
  }, [splineKey, useFallback]);

  return (
    <section className="relative overflow-hidden pt-6 pb-16 lg:py-20 border-b border-slate-200/60 dark:border-slate-800/60">
      {/* Background glowing mesh blur */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-brand-500/15 via-sky-400/20 to-indigo-500/10 blur-3xl pointer-events-none -z-10 rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Headline, Highlights, Actions */}
          <div className="lg:col-span-6 space-y-6 text-left">
            {/* Live Campus AI Status Pill */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-sm text-xs font-semibold">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-slate-800 dark:text-slate-200">
                FixMyCampus AI Engine Active
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-brand-600 dark:text-brand-400 font-bold">
                94% SLA Resolved
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
              Fix Campus Issues{' '}
              <span className="bg-gradient-to-r from-brand-600 via-sky-500 to-indigo-600 dark:from-brand-400 dark:via-sky-300 dark:to-indigo-400 bg-clip-text text-transparent">
                Before They Escalate
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Autonomous campus maintenance platform with real-time NLP duplicate detection,
              automated safety hazard classification, QR code instant reporting, and live SLA tracking for students and campus facilities.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onOpenSubmit}
                className="flex items-center gap-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-base font-bold shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/35 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <PlusCircle className="w-5 h-5" />
                <span>Report an Issue</span>
              </button>

              <button
                onClick={onOpenQR}
                className="flex items-center gap-2 px-5 py-3.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-xl text-base font-semibold transition-all shadow-sm"
              >
                <QrCode className="w-5 h-5 text-brand-500" />
                <span>Scan Campus QR</span>
              </button>

              <button
                onClick={onNavigateTrack}
                className="flex items-center gap-2 px-4 py-3.5 text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 text-sm font-semibold transition-colors"
              >
                <Search className="w-4 h-4" />
                <span>Track Ticket</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Feature Checklist */}
            <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  NLP Duplicate Alerts
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-500 flex-shrink-0" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Hazard Priority Triage
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Live Dispatch SLA
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Spline 3D Element */}
          <div className="lg:col-span-6 relative">
            <div className="relative glass-card overflow-hidden p-2 bg-gradient-to-b from-slate-50/50 to-white/90 dark:from-slate-900/50 dark:to-slate-900/90 border-slate-200/90 dark:border-slate-800/90 shadow-2xl rounded-3xl">
              
              {/* Spline 3D Top Header Bar */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200/80 dark:border-slate-800/80 text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 font-bold ml-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
                    <span>Spline 3D Campus Digital Twin</span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-extrabold uppercase">
                    Interactive
                  </span>

                  <button
                    onClick={() => {
                      setSplineLoaded(false);
                      setSplineKey(k => k + 1);
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    title="Reload 3D Scene"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 3D Spline Canvas Container */}
              <div className="relative h-[440px] sm:h-[480px] w-full flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/5 to-slate-900/20 dark:from-slate-950 dark:to-slate-900">
                
                {/* Loading Spinner Skeleton */}
                {!splineLoaded && !useFallback && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-sm transition-opacity duration-300">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3 animate-pulse">
                      <Sparkles className="w-6 h-6 animate-spin" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Loading Spline 3D Scene...
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      Streaming WebGL assets from Spline CDN
                    </span>
                  </div>
                )}

                {/* Spline 3D Web Component */}
                {!useFallback ? (
                  <div key={splineKey} className="w-full h-full relative cursor-grab active:cursor-grabbing">
                    <spline-viewer
                      url={DEFAULT_SPLINE_URL}
                      loading-anim
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'block'
                      }}
                    />
                  </div>
                ) : (
                  <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
                )}

                {/* Bottom Overlay Pill */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
                  <div className="px-3 py-1 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 text-[10px] font-mono text-slate-700 dark:text-slate-300 shadow-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Spline Real-time WebGL • Drag to Rotate / Hover</span>
                  </div>

                  <button
                    onClick={() => setUseFallback(!useFallback)}
                    className="pointer-events-auto px-2.5 py-1 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-colors"
                  >
                    {useFallback ? 'Switch to Spline' : 'Three.js Mode'}
                  </button>
                </div>

              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
