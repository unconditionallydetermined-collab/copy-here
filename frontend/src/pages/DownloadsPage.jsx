import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Download, Smartphone, ShieldCheck, CheckCircle2, ArrowLeft, Sparkles } from 'lucide-react'

export default function DownloadsPage() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', () => setInstalled(true))

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setInstalled(true)
      }
      setDeferredPrompt(null)
    } else {
      alert('To install on Android: tap the browser menu (⋮) in Chrome and select "Install app" or "Add to Home screen".')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col justify-between">
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
        <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-2xl">
          <img src="/favicon.svg" alt="CareerSync App Icon" className="w-12 h-12" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
          Install CareerSync
        </h1>
        <p className="text-white/50 text-sm sm:text-base leading-relaxed mb-8 max-w-md">
          Install CareerSync directly to your Android home screen as a standalone application with fluid touch feedback, zero browser chrome, and instant backend pre-warming.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={handleInstallPWA}
            className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full font-bold text-base text-black bg-white hover:bg-white/90 transition-all shadow-2xl hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Sparkles size={20} />
            <span>{installed ? 'App Installed' : 'Install Native WebAPK'}</span>
          </button>

          <a
            href="/careersync.apk"
            download="careersync.apk"
            className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full font-semibold text-sm text-white/80 border border-white/20 hover:bg-white/10 transition-all cursor-pointer"
          >
            <Download size={18} />
            <span>Download Wrapper</span>
          </a>
        </div>
        <p className="text-xs text-white/40 mt-3">Universal WebAPK &bull; Android Chrome &bull; Fast Standalone Launch</p>

        <div className="w-full mt-12 p-6 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-md text-left space-y-4 text-xs sm:text-sm text-white/70">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <strong className="text-white">Seamless Home Screen Install:</strong> Tap &ldquo;Install Native WebAPK&rdquo; (or open Chrome menu &rarr; &ldquo;Install app&rdquo;) to install the official full-screen app package directly through Google Play services without security or package parser errors.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Smartphone size={16} className="text-sky-400 mt-0.5 shrink-0" />
            <div>
              <strong className="text-white">Full-Screen Mobile Experience:</strong> Runs standalone with dynamic viewport sizing (`100svh`), safe area notch padding, and zero address bar interference.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck size={16} className="text-indigo-400 mt-0.5 shrink-0" />
            <div>
              <strong className="text-white">Cold-Start Ping:</strong> The app pre-warms the Render backend automatically upon opening, keeping latency minimal.
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
