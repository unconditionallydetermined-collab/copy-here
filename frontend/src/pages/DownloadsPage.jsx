import React from 'react'
import { Link } from 'react-router-dom'
import { Download, Smartphone, ShieldCheck, CheckCircle2, ArrowLeft } from 'lucide-react'

export default function DownloadsPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col justify-between">
      {/* Top bar */}
      <div className="max-w-4xl w-full mx-auto px-6 py-8 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={16} /> Back to home
        </Link>
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="CareerSync Icon" className="w-7 h-7" />
          <span className="font-bold text-sm tracking-tight">CareerSync Mobile</span>
        </div>
      </div>

      {/* Main card */}
      <div className="max-w-xl w-full mx-auto px-6 py-12 flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500/20 via-sky-500/10 to-transparent border border-white/10 flex items-center justify-center mb-6 shadow-2xl">
          <img src="/favicon.svg" alt="CareerSync App Icon" className="w-12 h-12" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
          Download CareerSync for Android
        </h1>
        <p className="text-white/50 text-sm sm:text-base leading-relaxed mb-8 max-w-md">
          Install the native mobile web wrapper. Fast startup, automatic backend warming, and fluid tactile feedback.
        </p>

        <a
          href="/downloads/careersync.apk"
          download="careersync.apk"
          className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full font-bold text-base text-black bg-white hover:bg-white/90 transition-all shadow-2xl hover:scale-105 active:scale-95"
        >
          <Download size={20} />
          <span>Download Android APK</span>
        </a>
        <p className="text-xs text-white/30 mt-3">Version 1.0.0 (Universal APK &bull; Signed)</p>

        <div className="w-full mt-12 p-6 rounded-2xl border border-white/10 bg-[#0a0a0f] text-left space-y-4 text-xs sm:text-sm text-white/70">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <strong className="text-white">Instant Render Warm-Up:</strong> The app silently pings the backend immediately upon launch so cold-start wait times are eliminated.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Smartphone size={16} className="text-sky-400 mt-0.5 shrink-0" />
            <div>
              <strong className="text-white">Mobile Native Tuning:</strong> Configured for 100svh safe areas, dynamic notch spacing, and zero tap delay.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck size={16} className="text-indigo-400 mt-0.5 shrink-0" />
            <div>
              <strong className="text-white">Safe Sideloading:</strong> If prompted by Android, choose &ldquo;Install unknown apps &rarr; Allow from this source&rdquo;.
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-white/30 border-t border-white/5">
        &copy; {new Date().getFullYear()} CareerSync. All rights reserved.
      </footer>
    </div>
  )
}
