import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'

export default function FloatingIslandNav() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Why CareerSync', href: '/info' },
  ]

  return (
    <>
      {/* Floating Island Nav Pill */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <nav
          aria-label="Primary navigation"
          className="mt-6 pointer-events-auto flex items-center justify-between gap-6 px-4 py-2 rounded-full border border-white/10 bg-[#181818]/90 backdrop-blur-xl shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] max-w-4xl w-full sm:w-auto"
        >
          {/* Brand Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 px-2 py-1 text-white font-bold text-sm tracking-tight focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none rounded-md"
          >
            <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-slate-950 font-bold">
              <div className="w-2 h-2 rounded-full bg-[#181818]" />
            </div>
            <span>CareerSync</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href
              return (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none ${
                    isActive ? 'text-white bg-white/10' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>

          {/* Header Action Buttons */}
          <div className="hidden sm:flex items-center gap-2">
            <Link
              to="/auth?mode=signin"
              className="py-2 px-3 text-sm font-semibold text-slate-300 hover:text-white rounded-full transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
            >
              Sign in
            </Link>
            <Link
              to="/auth"
              className="py-2 px-3.5 text-sm font-semibold text-slate-950 bg-white rounded-full hover:bg-slate-200 active:scale-[0.98] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
            >
              Find your dream job
            </Link>
          </div>

          {/* Mobile Hamburger Morph */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-label="Toggle navigation menu"
            className="sm:hidden relative w-9 h-9 rounded-full flex items-center justify-center text-white focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none cursor-pointer"
          >
            <span
              className={`absolute w-4 h-0.5 bg-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                isOpen ? 'rotate-45' : '-translate-y-1'
              }`}
            />
            <span
              className={`absolute w-4 h-0.5 bg-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                isOpen ? '-rotate-45' : 'translate-y-1'
              }`}
            />
          </button>
        </nav>
      </header>

      {/* Screen filling Modal Expansion with Glass Effect */}
      {isOpen && (
        <div className="fixed inset-0 z-40 sm:hidden backdrop-blur-3xl bg-black/80 flex flex-col justify-center px-8 transition-opacity duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
          <div className="flex flex-col gap-6 text-center">
            {navLinks.map((link, idx) => (
              <div key={link.label} className="overflow-hidden">
                <Link
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  style={{
                    animationDelay: `${100 + idx * 50}ms`,
                  }}
                  className="inline-block text-2xl font-semibold text-white tracking-tight animate-stagger-up active:scale-[0.98] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                >
                  {link.label}
                </Link>
              </div>
            ))}

            <div className="pt-6 flex flex-col gap-3">
              <Link
                to="/auth?mode=signin"
                onClick={() => setIsOpen(false)}
                className="w-full py-2 px-3 rounded-xl border border-white/10 text-white font-semibold text-base active:scale-[0.98] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
              >
                Sign in
              </Link>
              <Link
                to="/auth"
                onClick={() => setIsOpen(false)}
                className="w-full py-2 px-3 rounded-xl bg-white text-slate-950 font-semibold text-base active:scale-[0.98] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
              >
                Find your dream job
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
