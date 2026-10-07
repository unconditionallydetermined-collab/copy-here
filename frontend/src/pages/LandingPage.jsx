import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Lightbulb, Code2 } from 'lucide-react'
import { Github, Linkedin } from '../components/Icons'

// TODO: Replace placeholder percentages with verified sourced figures
const PLATFORM_CONFIG = {
  github: {
    id: 'github',
    name: 'GitHub',
    label: 'GitHub',
    statTemplate: '{percent}% of companies hire through GitHub',
    targetPercent: 84,
    color: '#24292F',
    icon: Github,
  },
  leetcode: {
    id: 'leetcode',
    name: 'LeetCode',
    label: 'LeetCode',
    statTemplate: '{percent}% of companies hire through LeetCode',
    targetPercent: 78,
    color: '#FFA116',
    icon: Code2,
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    label: 'LinkedIn',
    statTemplate: '{percent}% of companies hire through LinkedIn',
    targetPercent: 92,
    color: '#0A66C2',
    icon: Linkedin,
  },
  skills: {
    id: 'skills',
    name: 'Skills',
    label: 'Skills',
    statTemplate: '{percent}% of companies hire through skills',
    targetPercent: 96,
    color: '#EAB308',
    icon: Lightbulb,
  },
}

const BADGES = ['github', 'leetcode', 'linkedin', 'skills']
const DEBUG_SLOWMO = 1

export default function LandingPage() {
  const [activeStageId, setActiveStageId] = useState(null)
  const [exitingStageId, setExitingStageId] = useState(null)
  const [displayCount, setDisplayCount] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [badgeRadius, setBadgeRadius] = useState(200)

  const anglesRef = useRef({
    github: 0,
    leetcode: 90,
    linkedin: 180,
    skills: 270,
  })

  const [angles, setAngles] = useState(anglesRef.current)
  const [orbiting, setOrbiting] = useState({
    github: true,
    leetcode: true,
    linkedin: true,
    skills: true,
  })

  const lastPoppedRef = useRef(null)
  const stageLockRef = useRef(false)
  const animationFrameRef = useRef(null)
  const countIntervalRef = useRef(null)
  const headlineRef = useRef(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    const calcRadius = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const r = Math.min(vw * 0.42, vh * 0.36, 260)
      setBadgeRadius(Math.max(r, 110))
    }
    calcRadius()
    window.addEventListener('resize', calcRadius)
    return () => window.removeEventListener('resize', calcRadius)
  }, [])

  // Orbit animation loop
  useEffect(() => {
    if (reducedMotion) return
    let lastTime = performance.now()
    const speed = 0.055 / DEBUG_SLOWMO // degrees per ms

    const tick = (now) => {
      const delta = now - lastTime
      lastTime = now

      if (document.visibilityState === 'visible') {
        const next = { ...anglesRef.current }
        BADGES.forEach((id) => {
          if (orbiting[id]) {
            next[id] = (next[id] + speed * delta) % 360
          }
        })
        anglesRef.current = next
        setAngles({ ...next })
      }
      animationFrameRef.current = requestAnimationFrame(tick)
    }

    animationFrameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animationFrameRef.current)
  }, [reducedMotion, orbiting])

  // Scheduler logic with semaphore
  useEffect(() => {
    if (reducedMotion) {
      setActiveStageId('skills')
      setDisplayCount(PLATFORM_CONFIG.skills.targetPercent)
      return
    }

    let timer = null
    let active = true

    const popNext = () => {
      if (!active || stageLockRef.current || document.visibilityState !== 'visible') return

      // Find next candidate reaching near 2 o'clock (60 deg)
      const candidates = BADGES.filter((b) => orbiting[b] && b !== lastPoppedRef.current)
      if (candidates.length === 0) return

      let closest = candidates[0]
      let minDiff = 360
      candidates.forEach((b) => {
        const diff = (60 - anglesRef.current[b] + 360) % 360
        if (diff < minDiff) {
          minDiff = diff
          closest = b
        }
      })

      stageLockRef.current = true
      lastPoppedRef.current = closest

      // Knock out current
      if (activeStageId) {
        setExitingStageId(activeStageId)
        setTimeout(() => {
          setOrbiting((prev) => ({ ...prev, [activeStageId]: true }))
          anglesRef.current[activeStageId] = 240 // re-enter at 8 o'clock
          setExitingStageId(null)
        }, 220 * DEBUG_SLOWMO)
      }

      // Detach from orbit & place into stage
      setOrbiting((prev) => ({ ...prev, [closest]: false }))
      setActiveStageId(closest)

      // Count up ticker
      const target = PLATFORM_CONFIG[closest].targetPercent
      let current = 0
      setDisplayCount(0)
      clearInterval(countIntervalRef.current)
      const stepTime = (900 * DEBUG_SLOWMO) / target
      countIntervalRef.current = setInterval(() => {
        current += 2
        if (current >= target) {
          setDisplayCount(target)
          clearInterval(countIntervalRef.current)
        } else {
          setDisplayCount(current)
        }
      }, stepTime)

      // Unlock after transition + random cooldown (5s to 11s)
      const cooldown = Math.floor(5000 + Math.random() * 6000) * DEBUG_SLOWMO
      timer = setTimeout(() => {
        stageLockRef.current = false
        popNext()
      }, cooldown)
    }

    const firstTimer = setTimeout(popNext, 5000 * DEBUG_SLOWMO)

    return () => {
      active = false
      clearTimeout(firstTimer)
      clearTimeout(timer)
      clearInterval(countIntervalRef.current)
    }
  }, [reducedMotion, orbiting, activeStageId])

  const activeConfig = activeStageId ? PLATFORM_CONFIG[activeStageId] : null
  const exitingConfig = exitingStageId ? PLATFORM_CONFIG[exitingStageId] : null

  return (
    <main
      className="relative w-screen h-[100dvh] overflow-hidden bg-white text-slate-900 flex flex-col items-center justify-center select-none font-sans"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* ── Ambient Orbit Ring ── */}
      <div
        className="relative flex items-center justify-center pointer-events-none"
        style={{ width: badgeRadius * 2 + 100, height: badgeRadius * 2 + 100 }}
      >
        {!reducedMotion &&
          BADGES.map((id) => {
            const isOrbiting = orbiting[id]
            const deg = angles[id] || 0
            const rad = ((deg - 90) * Math.PI) / 180 // 12 o'clock = top (0 deg)
            const x = Math.cos(rad) * badgeRadius
            const y = Math.sin(rad) * badgeRadius
            const cfg = PLATFORM_CONFIG[id]
            const Icon = cfg.icon

            if (!isOrbiting) return null

            return (
              <div
                key={id}
                aria-label={cfg.name}
                className="absolute w-12 h-12 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center will-change-transform transition-opacity"
                style={{
                  transform: `translate3d(${x}px, ${y}px, 0)`,
                  transitionDuration: `${120 * DEBUG_SLOWMO}ms`,
                }}
              >
                <Icon size={22} color={cfg.color} />
              </div>
            )
          })}

        {/* ── Center Stage & Headline ── */}
        <div
          ref={headlineRef}
          className="relative z-10 flex flex-col items-center text-center max-w-sm px-4 pointer-events-auto"
        >
          <h1 className="text-[clamp(28px,6vmin,54px)] font-extrabold tracking-tight text-slate-900 leading-tight">
            Do you have
          </h1>

          {/* Reserved Stage Slot */}
          <div className="h-16 w-16 my-3 flex items-center justify-center relative">
            {/* Exiting occupant (knock-out) */}
            {exitingConfig && (
              <div
                className="absolute w-14 h-14 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center transition-all"
                style={{
                  transform: 'translateY(55px) scale(0.92, 1.1)',
                  opacity: 0,
                  transitionDuration: `${200 * DEBUG_SLOWMO}ms`,
                  transitionTimingFunction: 'cubic-bezier(0.77, 0, 0.175, 1)',
                }}
              >
                {React.createElement(exitingConfig.icon, { size: 26, color: exitingConfig.color })}
              </div>
            )}

            {/* Active occupant (pop-in) */}
            {activeConfig ? (
              <div
                className="w-14 h-14 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center transition-transform"
                style={{
                  transform: 'scale(1)',
                  transitionDuration: `${260 * DEBUG_SLOWMO}ms`,
                  transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
                }}
              >
                {React.createElement(activeConfig.icon, { size: 26, color: activeConfig.color })}
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full border-2 border-dashed border-slate-200" />
            )}
          </div>

          {/* Stage Label & Stat (Reserved height to prevent layout shift) */}
          <div aria-live="polite" className="h-14 flex flex-col items-center justify-center">
            {activeConfig ? (
              <div
                className="flex flex-col items-center transition-all"
                style={{
                  animation: `slideUpFade ${220 * DEBUG_SLOWMO}ms cubic-bezier(0.23, 1, 0.32, 1) forwards`,
                }}
              >
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                  {activeConfig.label}
                </span>
                <p className="text-[clamp(14px,2.2vmin,18px)] font-medium text-slate-700 mt-0.5">
                  <span className="font-bold text-slate-900 tabular-nums">
                    {displayCount}%
                  </span>{' '}
                  of companies hire through {activeConfig.label.toLowerCase()}
                </p>
              </div>
            ) : (
              <span className="text-xs text-slate-300 font-medium">Waiting for credentials...</span>
            )}
          </div>

          {/* Call to action button */}
          <Link
            to="/auth"
            className="mt-6 inline-flex items-center justify-center min-h-[48px] px-8 py-3 rounded-xl bg-slate-900 text-white font-semibold text-base shadow-lg shadow-slate-900/10 active:scale-[0.97] transition-transform duration-150 ease-out hover:bg-slate-800"
          >
            Get a job
          </Link>
        </div>
      </div>
    </main>
  )
}
