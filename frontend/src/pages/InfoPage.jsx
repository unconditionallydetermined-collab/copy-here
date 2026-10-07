import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ShieldCheck,
  Terminal,
  Code2,
  Sparkles,
} from 'lucide-react'
import { Github, Linkedin } from '../components/Icons'
import FloatingIslandNav from '../components/FloatingIslandNav'

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

export default function InfoPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState(null)

  return (
    <div className="w-full min-h-screen bg-[#000000] text-white flex flex-col font-sans selection:bg-white/20">
      <FloatingIslandNav />

      {/* Back to home breadcrumb */}
      <div className="pt-24 px-6 max-w-5xl mx-auto w-full">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-white/5 w-fit"
        >
          <ArrowLeft size={16} />
          <span>Back to home</span>
        </Link>
      </div>

      {/* SECTION 1: PROBLEM TO SOLUTION */}
      <section className="py-16 px-6 bg-[#000000] border-b border-white/10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-[680px] mx-auto mb-16">
            <p className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-3">
              The Reality Check
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white [text-wrap:balance]">
              Why static resumes fail senior engineering bars
            </h2>
            <p className="mt-4 text-base text-slate-400 [text-wrap:pretty]">
              Automated applicant tracking systems filter out talent without ever reading code. Technical leaders want tangible proof of implementation before scheduling interviews.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* The Old Way */}
            <div className="rounded-2xl border border-white/10 bg-[#141414] p-6 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 py-1 px-3 rounded-lg bg-[#202020] text-slate-400 text-xs font-semibold mb-6">
                  The Old Way
                </div>
                <h3 className="text-xl font-bold text-white mb-4">
                  Fragmented tabs and static PDFs
                </h3>
                <ul className="space-y-4 text-sm text-slate-400">
                  <li className="flex items-start gap-3">
                    <span className="text-rose-400 mt-0.5">✕</span>
                    <span>Recruiters glance at a generic PDF for six seconds and discard it.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-rose-400 mt-0.5">✕</span>
                    <span>No proof that code examples belong to you or run in production.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-rose-400 mt-0.5">✕</span>
                    <span>Algorithmic achievements and daily streaks stay hidden on LeetCode.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-rose-400 mt-0.5">✕</span>
                    <span>Zero visibility into whether anyone actually reviewed your work.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8 pt-6 border-t border-white/10 text-xs text-slate-500">
                Average recruiter screening time: 6.2 seconds
              </div>
            </div>

            {/* The CareerSync Way */}
            <div className="rounded-2xl border border-white/10 bg-[#141414] p-6 flex flex-col justify-between shadow-xl">
              <div>
                <div className="inline-flex items-center gap-2 py-1 px-3 rounded-lg bg-white text-slate-950 text-xs font-semibold mb-6">
                  The CareerSync Way
                </div>
                <h3 className="text-xl font-bold text-white mb-4">
                  Live verified developer telemetry
                </h3>
                <ul className="space-y-4 text-sm text-slate-300">
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Real pull requests and commit consistency verified straight from GitHub.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Algorithmic ranking percentiles and solved problem breakdowns presented cleanly.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>One responsive link designed for technical hiring managers on desktop and mobile.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Real telemetry showing company visits and review timestamps.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8 pt-6 border-t border-white/10 text-xs text-emerald-400 font-medium">
                47.2% faster interview progression across verified candidates
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: BENEFITS */}
      <section className="py-24 px-6 bg-[#0a0a0a] border-b border-white/10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-[680px] mx-auto mb-16">
            <p className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-3">
              Concrete Outcomes
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white [text-wrap:balance]">
              Built to win the technical screen
            </h2>
            <p className="mt-4 text-base text-slate-400 [text-wrap:pretty]">
              Every feature exists to eliminate friction between your actual coding abilities and hiring decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/10 bg-[#141414] p-6 hover:border-white/20 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
              <div className="w-10 h-10 rounded-lg bg-[#202020] flex items-center justify-center text-white mb-5 border border-white/10">
                <Github size={20} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Live repository telemetry
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed [text-wrap:pretty]">
                Auto sync active GitHub contributions and merged pull requests so engineering managers inspect production commits rather than buzzwords.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#141414] p-6 hover:border-white/20 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
              <div className="w-10 h-10 rounded-lg bg-[#202020] flex items-center justify-center text-amber-400 mb-5 border border-white/10">
                <Code2 size={20} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Verified algorithmic percentiles
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed [text-wrap:pretty]">
                Turn your solved problems and contest percentiles into an audited breakdown that signals problem solving depth at a glance.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#141414] p-6 hover:border-white/20 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
              <div className="w-10 h-10 rounded-lg bg-[#202020] flex items-center justify-center text-sky-400 mb-5 border border-white/10">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                One unified candidate link
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed [text-wrap:pretty]">
                Replace scattered links across LinkedIn, Google Drive, and repository bookmarks with a single fast link that loads in under 300 milliseconds.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#141414] p-6 hover:border-white/20 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
              <div className="w-10 h-10 rounded-lg bg-[#202020] flex items-center justify-center text-emerald-400 mb-5 border border-white/10">
                <Terminal size={20} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Recruiter telemetry and views
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed [text-wrap:pretty]">
                Track incoming visits and view timestamps so you know exactly when hiring teams inspect your projects and run code samples.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: HOW IT WORKS */}
      <section className="py-24 px-6 bg-[#000000] border-b border-white/10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-[680px] mx-auto mb-16">
            <p className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-3">
              Simple Setup
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white [text-wrap:balance]">
              Three steps to a verified portfolio
            </h2>
            <p className="mt-4 text-base text-slate-400 [text-wrap:pretty]">
              Zero complex configuration. Link your public handles and let the synchronization engine handle the rest.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-white/10 bg-[#141414] p-6 flex flex-col">
              <span className="text-3xl font-bold text-slate-600 mb-4 font-mono">01</span>
              <h3 className="text-lg font-bold text-white mb-2">Connect your handles</h3>
              <p className="text-sm text-slate-400 leading-relaxed [text-wrap:pretty]">
                Enter your public GitHub, LeetCode, and LinkedIn usernames. We never ask for passwords or private keys.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#141414] p-6 flex flex-col">
              <span className="text-3xl font-bold text-slate-600 mb-4 font-mono">02</span>
              <h3 className="text-lg font-bold text-white mb-2">Verify your metrics</h3>
              <p className="text-sm text-slate-400 leading-relaxed [text-wrap:pretty]">
                Our background workers fetch public commits, contest ratings, and credentials, generating cryptographic proof badges.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#141414] p-6 flex flex-col">
              <span className="text-3xl font-bold text-slate-600 mb-4 font-mono">03</span>
              <h3 className="text-lg font-bold text-white mb-2">Share your verified link</h3>
              <p className="text-sm text-slate-400 leading-relaxed [text-wrap:pretty]">
                Send your custom URL to recruiters or link it on applications. Monitor live telemetry whenever managers open your profile.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: SOCIAL PROOF */}
      <section className="py-24 px-6 bg-[#0a0a0a] border-b border-white/10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-[680px] mx-auto mb-16">
            <p className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-3">
              Trusted by Engineers
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white [text-wrap:balance]">
              Proof from candidates who secured offers
            </h2>
            <p className="mt-4 text-base text-slate-400 [text-wrap:pretty]">
              Engineers using CareerSync bypass automated filters and skip redundant screening steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="rounded-2xl border border-white/10 bg-[#141414] p-6 flex flex-col justify-between">
              <p className="text-sm text-slate-300 leading-relaxed mb-6 [text-wrap:pretty]">
                "Hiring managers told me in the first interview that seeing my real commit consistency and LeetCode contest percentile in one clean link made interviewing me an immediate priority."
              </p>
              <div>
                <p className="text-sm font-semibold text-white">Priya Sundaram</p>
                <p className="text-xs text-slate-400">Senior Distributed Systems Lead</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#141414] p-6 flex flex-col justify-between">
              <p className="text-sm text-slate-300 leading-relaxed mb-6 [text-wrap:pretty]">
                "I was sending standard PDF resumes and getting ignored. Switching to CareerSync boosted my callback rate to 42% because engineering directors could click through directly to my repositories."
              </p>
              <div>
                <p className="text-sm font-semibold text-white">Marcus Vance</p>
                <p className="text-xs text-slate-400">Staff Backend Engineer</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#141414] p-6 flex flex-col justify-between">
              <p className="text-sm text-slate-300 leading-relaxed mb-6 [text-wrap:pretty]">
                "The live visit telemetry is incredible. I saw an engineering director review my profile in the morning and received an interview invitation two hours later."
              </p>
              <div>
                <p className="text-sm font-semibold text-white">Elena Rostova</p>
                <p className="text-xs text-slate-400">Full Stack Architect</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#141414] p-8 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-white font-mono">47.2%</p>
              <p className="text-xs text-slate-400 mt-2 font-medium">Faster interview scheduling</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-white font-mono">84.6%</p>
              <p className="text-xs text-slate-400 mt-2 font-medium">Recruiter response rate</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-white font-mono">380+</p>
              <p className="text-xs text-slate-400 mt-2 font-medium">Tech companies hiring</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: FAQ */}
      <section className="py-24 px-6 bg-[#000000] border-b border-white/10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-[680px] mx-auto mb-16">
            <p className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-3">
              Frequently Asked Questions
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white [text-wrap:balance]">
              Clear answers to common questions
            </h2>
            <p className="mt-4 text-base text-slate-400 [text-wrap:pretty]">
              Everything you need to know about verification, data privacy, and portfolio management.
            </p>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, index) => {
              const isOpen = openFaqIndex === index
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-white/10 bg-[#141414] p-6 transition-all duration-300"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between text-left text-base sm:text-lg font-semibold text-white focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none rounded-md cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <span className="text-slate-400 ml-4 text-xl">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  {isOpen && (
                    <p className="mt-4 text-sm text-slate-300 leading-relaxed [text-wrap:pretty] pt-3 border-t border-white/10">
                      {item.a}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CLOSING BLOCK */}
      <section className="py-24 px-6 bg-[#0a0a0a] text-center border-b border-white/10">
        <div className="max-w-2xl mx-auto flex flex-col items-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-6 [text-wrap:balance]">
            Stop sending static resumes into automated filters
          </h2>
          <div className="mb-8">
            <Link
              to="/auth"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-white text-slate-950 font-semibold text-base shadow-[0_0_30px_rgba(255,255,255,0.25)] hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 select-none"
            >
              Find your dream job
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-slate-400 select-none">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400" />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400" />
              Syncs in 30 seconds
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400" />
              Cancel or delete anytime
            </span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-6 bg-[#000000] text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:text-slate-300 transition-colors">About</Link>
            <span className="text-white/10">|</span>
            <Link to="/info" className="hover:text-slate-300 transition-colors">Privacy policy</Link>
            <span className="text-white/10">|</span>
            <Link to="/info" className="hover:text-slate-300 transition-colors">Terms of service</Link>
          </div>
          <p>© {new Date().getFullYear()} CareerSync. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
