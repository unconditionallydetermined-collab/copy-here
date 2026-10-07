import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp, Code2, FileText, Zap, Bot,
  Briefcase, Target, Globe, ArrowRight, CheckCircle2,
  Sparkles, Users, BookOpen
} from 'lucide-react'
import { Github } from '../components/Icons'

const features = [
  { icon: FileText,  color: '#818cf8', bg: 'rgba(99,102,241,0.1)',  title: 'Smart Resume Analysis',   desc: 'Upload your resume and get AI-powered insights, skill extraction, and improvement recommendations instantly.' },
  { icon: Zap,       color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  title: 'Skill Gap Detection',     desc: 'Paste any job description and instantly see which skills you have, which you are missing, and a personalized learning roadmap.' },
  { icon: Github,    color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', title: 'GitHub Integration',      desc: 'Connect your GitHub to showcase repositories, languages, contribution stats, and activity on your dashboard.' },
  { icon: Code2,     color: '#34d399', bg: 'rgba(52,211,153,0.1)',  title: 'LeetCode Tracking',       desc: 'Track your DSA progress with easy, medium, and hard problem counts and visualize your coding growth.' },
  { icon: Bot,       color: '#38bdf8', bg: 'rgba(56,189,248,0.1)',  title: 'AI Career Assistant',     desc: '"Am I ready for an SDE internship?" Get answers from Gemini AI, tailored to your profile.' },
  { icon: Briefcase, color: '#f472b6', bg: 'rgba(244,114,182,0.1)', title: 'Job Application Tracker', desc: 'Track every application from Saved to Applied to Interview to Selected. Never lose track of an opportunity.' },
  { icon: Target,    color: '#fb923c', bg: 'rgba(251,146,60,0.1)',  title: 'Goal Tracking',           desc: 'Set DSA, project, certification, and placement goals with deadlines. Visualize progress and stay on track.' },
  { icon: Globe,     color: '#4ade80', bg: 'rgba(74,222,128,0.1)',  title: 'Portfolio Generator',     desc: 'Auto-generate a shareable portfolio from your profile, skills, projects, and certificates with zero hassle.' },
]

const problems = [
  'Resume on Google Drive, skills on LinkedIn',
  'No idea which skills are missing for a target role',
  'Lost track of 20+ job applications',
  'GitHub and LeetCode progress not connected',
  'No single view of career readiness',
]

const solutions = [
  'Centralized career profile with all your information',
  'AI skill-gap analysis against any job description',
  'Visual job application pipeline tracker',
  'GitHub and LeetCode stats on your dashboard',
  'Career readiness score with actionable advice',
]

const steps = [
  { n: '01', icon: Users,     title: 'Create Your Profile', desc: 'Add your education, target role, LinkedIn, GitHub, and LeetCode.' },
  { n: '02', icon: FileText,  title: 'Upload Your Resume',  desc: 'AI extracts skills, projects, and education automatically.' },
  { n: '03', icon: Sparkles,  title: 'Get AI Analysis',     desc: 'Gemini analyzes your profile and identifies skill gaps.' },
  { n: '04', icon: Target,    title: 'Track & Improve',     desc: 'Monitor applications, goals, and career progress in one place.' },
]

const faqItems = [
  {
    q: 'Which platforms connect to my portfolio profile?',
    a: 'CareerSync connects directly to your public GitHub profile and repositories, LeetCode contest rankings and problem statistics, and LinkedIn credentials. Each integration requires zero passwords.',
  },
  {
    q: 'How does CareerSync verify my GitHub activity?',
    a: 'We query the public GitHub API to verify your contribution heatmaps, merged pull requests, and repository stars. This generates cryptographic proof badges that hiring managers can audit in one click.',
  },
  {
    q: 'Do I need to grant write access to my repositories?',
    a: 'No. CareerSync only requires read access to your public metrics. Your private repositories, code contents, and commit messages remain completely untouched and private.',
  },
  {
    q: 'Can I connect a custom domain to my profile?',
    a: 'Yes. Every verified profile receives a fast public link, and you can point your personal domain with automatic HTTPS provisioning.',
  },
  {
    q: 'How does this differ from sending a standard PDF resume?',
    a: 'Resumes are static text that automated filters scan in six seconds. CareerSync gives technical recruiters interactive proof of what you built, live code telemetry, and verified algorithmic performance.',
  },
  {
    q: 'Does CareerSync work for self taught developers and students?',
    a: 'Yes. Engineering teams evaluate proof over credentials. A verified portfolio with daily GitHub activity and solved algorithmic problems outranks a pedigree without proof.',
  },
  {
    q: 'What is the cost for individual developers?',
    a: 'The core platform is free forever for individual developers. You get full platform sync, verified proof cards, and a permanent live URL without entering a credit card.',
  },
]

export default function AboutPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState(null)

  return (
    <div className="min-h-screen bg-[#0a0a0f] font-sans text-white">
      {/* ── Navbar ── */}
      <nav
        className="sticky top-0 z-50 border-b border-white/5"
        style={{ background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(20px)' }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
            >
              <TrendingUp size={15} className="text-white" />
            </div>
            <span className="font-bold text-white text-[15px] tracking-tight">Career Sync</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link to="/" className="text-sm text-white/60 hover:text-white transition-colors font-medium px-3 py-2 rounded-lg hover:bg-white/5">
              Home
            </Link>
            <Link to="/auth?mode=signin" className="text-sm text-white/60 hover:text-white transition-colors font-medium px-3 py-2 rounded-lg hover:bg-white/5">
              Sign In
            </Link>
            <Link
              to="/auth?mode=signup"
              className="ml-1 text-sm font-semibold px-4 py-2 rounded-xl transition-all text-white hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
            >
              Find your dream job
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Page Header ── */}
      <section className="py-20 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 65%)' }}
        />
        <div className="relative max-w-3xl mx-auto px-6">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5 border border-indigo-500/30"
            style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc' }}
          >
            <BookOpen size={11} /> Detailed platform information
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
            Built to get candidates{' '}
            <span style={{ background: 'linear-gradient(135deg,#818cf8,#a78bfa,#38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              hired faster
            </span>
          </h1>
          <p className="text-white/50 text-lg leading-relaxed">
            Career Sync replaces static resumes with verified developer telemetry, AI skill matching, and instant portfolio generation.
          </p>
        </div>
      </section>

      {/* ── Problem / Solution ── */}
      <section className="pb-24 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-5">
          <div
            className="p-8 rounded-2xl border border-red-500/10"
            style={{ background: 'rgba(239,68,68,0.04)' }}
          >
            <div className="inline-flex items-center gap-2 bg-red-500/10 text-red-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 border border-red-500/20">
              The Problem
            </div>
            <h2 className="text-xl font-bold text-white mb-5">Why static resumes fail senior engineering bars</h2>
            <div className="space-y-3">
              {problems.map((p) => (
                <div key={p} className="flex items-start gap-3 text-white/50 text-sm">
                  <div className="mt-0.5 w-4 h-4 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-red-400 text-[10px]">✕</span>
                  </div>
                  {p}
                </div>
              ))}
            </div>
          </div>

          <div
            className="p-8 rounded-2xl border border-indigo-500/10"
            style={{ background: 'rgba(99,102,241,0.04)' }}
          >
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 border border-indigo-500/20">
              Career Sync Solution
            </div>
            <h2 className="text-xl font-bold text-white mb-5">Live verified developer telemetry</h2>
            <div className="space-y-3">
              {solutions.map((s) => (
                <div key={s} className="flex items-start gap-3 text-white/60 text-sm">
                  <CheckCircle2 size={16} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                  {s}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-white mb-3">8 powerful modules</h2>
            <p className="text-white/40">All AI-powered. All in one dashboard.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map(({ icon: Icon, color, bg, title, desc }) => (
              <div
                key={title}
                className="p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all group cursor-default"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ background: bg }}
                >
                  <Icon size={18} style={{ color }} />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">{title}</h3>
                <p className="text-xs text-white/35 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-white mb-3">How it works</h2>
            <p className="text-white/40">Get started in minutes, see results immediately.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(({ n, icon: Icon, title, desc }) => (
              <div key={n} className="text-center group">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-110"
                  style={{
                    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                    boxShadow: '0 0 22px rgba(99,102,241,0.3)',
                  }}
                >
                  <Icon size={20} className="text-white" />
                </div>
                <div className="text-[10px] font-bold text-indigo-400/60 mb-1 tracking-widest">{n}</div>
                <h3 className="text-sm font-semibold text-white mb-2">{title}</h3>
                <p className="text-xs text-white/35 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-white mb-3">Frequently asked questions</h2>
            <p className="text-white/40">Clear answers to common questions about verification and privacy.</p>
          </div>
          <div className="space-y-4">
            {faqItems.map((item, index) => {
              const isOpen = openFaqIndex === index
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-white/10 bg-[#16161d] p-6 transition-all duration-300"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between text-left text-base sm:text-lg font-semibold text-white focus-visible:outline-none cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <span className="text-white/50 ml-4 text-xl">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  {isOpen && (
                    <p className="mt-4 text-sm text-white/60 leading-relaxed pt-3 border-t border-white/10">
                      {item.a}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 border-t border-white/5 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.1) 0%, transparent 70%)' }}
        />
        <div className="relative max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Ready to find your dream job?
          </h2>
          <p className="text-white/45 mb-8 text-base">
            Join Career Sync today and let your proven skills speak directly to hiring teams.
          </p>
          <Link
            to="/auth?mode=signup"
            className="inline-flex items-center gap-2 text-white font-semibold px-9 py-3.5 rounded-xl hover:opacity-90 hover:scale-[1.02] transition-all text-sm"
            style={{
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              boxShadow: '0 0 36px rgba(99,102,241,0.4)',
            }}
          >
            Find your dream job <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-7 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
            >
              <TrendingUp size={11} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-white/60">Career Sync</span>
          </Link>
          <p className="text-xs text-white/25">&copy; {new Date().getFullYear()} Career Sync. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
