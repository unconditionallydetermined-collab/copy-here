import { Suspense, lazy } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, ArrowRight, Sparkles } from 'lucide-react'

const Spline = lazy(() => import('@splinetool/react-spline'))

export default function LandingPage() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0a0f] font-sans text-white">

      {/* ── Full-viewport Spline scene ── */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <Spline
            scene="https://prod.spline.design/xsA3z9LUDPMCjCjQ/scene.splinecode"
            style={{ width: '100%', height: '100%' }}
          />
        </Suspense>
      </div>

      {/* ── Vignette overlay (readable edges, transparent center) ── */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at center, transparent 35%, rgba(10,10,15,0.55) 100%),
            linear-gradient(to bottom, rgba(10,10,15,0.55) 0%, transparent 18%, transparent 72%, rgba(10,10,15,0.85) 100%)
          `
        }}
      />

      {/* ── Navbar ── */}
      <nav className="absolute top-0 left-0 right-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
            >
              <TrendingUp size={15} className="text-white" />
            </div>
            <span className="font-bold text-white text-[15px] tracking-tight">Career Sync</span>
          </div>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            <Link
              to="/about"
              className="text-sm text-white/60 hover:text-white transition-colors font-medium px-4 py-2 rounded-lg hover:bg-white/5"
            >
              Features
            </Link>
            <Link
              to="/auth"
              className="text-sm text-white/60 hover:text-white transition-colors font-medium px-4 py-2 rounded-lg hover:bg-white/5"
            >
              Sign In
            </Link>
            <Link
              to="/auth?mode=signup"
              className="ml-1 text-sm font-semibold px-5 py-2 rounded-xl transition-all text-white hover:opacity-90 hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero content (bottom-left anchored) ── */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-8 pb-12 md:px-14 md:pb-14 max-w-2xl">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 border border-indigo-500/30"
          style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc' }}
        >
          <Sparkles size={11} />
          Powered by Gemini AI · Built for Students
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold leading-[1.08] mb-4 tracking-tight">
          Your AI-Powered<br />
          <span
            style={{
              background: 'linear-gradient(135deg,#818cf8,#a78bfa,#38bdf8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Career Command Center
          </span>
        </h1>

        <p className="text-base text-white/55 mb-7 leading-relaxed max-w-lg">
          Resume, skills, GitHub, LeetCode, jobs, goals — all in one place.
          Let AI identify your gaps and guide your career journey.
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          <Link
            to="/auth?mode=signup"
            className="flex items-center gap-2 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:opacity-90 hover:scale-[1.02] text-sm"
            style={{
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              boxShadow: '0 0 28px rgba(99,102,241,0.45)',
            }}
          >
            Start for Free <ArrowRight size={16} />
          </Link>
          <Link
            to="/about"
            className="flex items-center gap-2 text-white/70 hover:text-white font-semibold px-6 py-3 rounded-xl border border-white/10 hover:border-white/25 hover:bg-white/5 transition-all text-sm"
          >
            See Features
          </Link>
        </div>
      </div>
    </div>
  )
}
