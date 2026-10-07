import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Lightbulb, Code2 } from 'lucide-react'
import { Github, Linkedin } from '../components/Icons'
import WaterRippleCanvas from '../components/WaterRippleCanvas'

const PLATFORM_CONFIG = {
  github: {
    id: 'github',
    name: 'GitHub',
    label: 'GitHub',
    targetPercent: 84,
    color: '#F8FAFC',
    icon: Github,
  },
  leetcode: {
    id: 'leetcode',
    name: 'LeetCode',
    label: 'LeetCode',
    targetPercent: 78,
    color: '#FFA116',
    icon: Code2,
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    label: 'LinkedIn',
    targetPercent: 92,
    color: '#38BDF8',
    icon: Linkedin,
  },
  skills: {
    id: 'skills',
    name: 'Skills',
    label: 'Skills',
    targetPercent: 96,
    color: '#FACC15',
    icon: Lightbulb,
  },
}

const BADGES = ['github', 'leetcode', 'linkedin', 'skills']
const DEBUG_SLOWMO = 1

export default function LandingPage() {
  const [activeStageId, setActiveStageId] = useState('github')
  const [exitingStageId, setExitingStageId] = useState(null)
  const [isSlamming, setIsSlamming] = useState(false)
  const [buttonShimmer, setButtonShimmer] = useState(false)
  const [displayCount, setDisplayCount] = useState(PLATFORM_CONFIG.github.targetPercent)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [badgeRadius, setBadgeRadius] = useState(240)

  const rippleRef = useRef(null)
  const centerSlotRef = useRef(null)

  const activeStageIdRef = useRef('github')
  const anglesRef = useRef({
    github: 0,
    leetcode: 90,
    linkedin: 180,
    skills: 270,
  })

  const [angles, setAngles] = useState(anglesRef.current)
  const [orbiting, setOrbiting] = useState({
    github: false,
    leetcode: true,
    linkedin: true,
    skills: true,
  })
  const orbitingRef = useRef(orbiting)
  orbitingRef.current = orbiting

    const handleSplash = () => {
    setTimeout(() => {
      setButtonShimmer(true)
      setTimeout(() => setButtonShimmer(false), 900)
    }, 3000)
  }
const animationFrameRef = useRef(null)
  const countIntervalRef = useRef(null)
  const wakeThrottleRef = useRef(0)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Keep orbit wide enough to never overlap text/buttons
  useEffect(() => {
    const calcRadius = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      // Minimum 200px radius to cleanly clear center card
      const r = Math.max(200, Math.min(vw * 0.44, vh * 0.40, 290))
      setBadgeRadius(r)
    }
    calcRadius()
    window.addEventListener('resize', calcRadius)
    return () => window.removeEventListener('resize', calcRadius)
  }, [])

  // Orbit animation loop with gentle wake emission
  useEffect(() => {
    if (reducedMotion) return
    let lastTime = performance.now()
    const speed = 0.052 / DEBUG_SLOWMO

    const tick = (now) => {
      const delta = now - lastTime
      lastTime = now

      if (document.visibilityState === 'visible') {
        const next = { ...anglesRef.current }
        const centerX = window.innerWidth / 2
        const centerY = window.innerHeight / 2

        wakeThrottleRef.current += 1
        const emitWake = wakeThrottleRef.current % 8 === 0

        BADGES.forEach((id) => {
          if (orbitingRef.current[id]) {
            next[id] = (next[id] + speed * delta) % 360
            if (emitWake && rippleRef.current) {
              const deg = next[id]
              const rad = ((deg - 90) * Math.PI) / 180
              const bx = centerX + Math.cos(rad) * badgeRadius
              const by = centerY + Math.sin(rad) * badgeRadius
              const vx = -Math.sin(rad) * 0.8
              const vy = Math.cos(rad) * 0.8
              rippleRef.current.addWake(bx, by, vx, vy, 0.3)
            }
          }
        })

        anglesRef.current = next
        setAngles({ ...next })
      }
      animationFrameRef.current = requestAnimationFrame(tick)
    }

    animationFrameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animationFrameRef.current)
  }, [reducedMotion, badgeRadius])

  // Continuous cycling scheduler that won't get cancelled
  useEffect(() => {
    if (reducedMotion) {
      setActiveStageId('skills')
      setDisplayCount(PLATFORM_CONFIG.skills.targetPercent)
      return
    }

    let isDestroyed = false

    const cycleToNext = () => {
      if (isDestroyed || document.visibilityState !== 'visible') return

      const currentActive = activeStageIdRef.current
      const currentIndex = BADGES.indexOf(currentActive)
      const nextId = BADGES[(currentIndex + 1) % BADGES.length]

      // Exit current
      setExitingStageId(currentActive)
      setTimeout(() => {
        if (isDestroyed) return
        setOrbiting((prev) => ({ ...prev, [currentActive]: true }))
        anglesRef.current[currentActive] = 230
        setExitingStageId(null)
      }, 220 * DEBUG_SLOWMO)

      // Enter next
      setOrbiting((prev) => ({ ...prev, [nextId]: false }))
      activeStageIdRef.current = nextId
      setActiveStageId(nextId)
      setIsSlamming(true)

      // Impact slam trigger
      setTimeout(() => {
        if (isDestroyed) return
        if (centerSlotRef.current && rippleRef.current) {
          const rect = centerSlotRef.current.getBoundingClientRect()
          const cx = rect.left + rect.width / 2
          const cy = rect.top + rect.height / 2
          rippleRef.current.triggerSlam(cx, cy, { intensity: 200, carveRadius: 32 })
        }
      }, 310 * DEBUG_SLOWMO)

      setTimeout(() => {
        if (!isDestroyed) setIsSlamming(false)
      }, 500 * DEBUG_SLOWMO)

      // Counter animation
      const target = PLATFORM_CONFIG[nextId].targetPercent
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
    }

    const interval = setInterval(cycleToNext, 5200 * DEBUG_SLOWMO)

    return () => {
      isDestroyed = true
      clearInterval(interval)
      clearInterval(countIntervalRef.current)
    }
  }, [reducedMotion])

  const activeConfig = activeStageId ? PLATFORM_CONFIG[activeStageId] : null
  const exitingConfig = exitingStageId ? PLATFORM_CONFIG[exitingStageId] : null

  return (
    <main
      className="relative w-screen min-h-[100svh] h-[100dvh] overflow-hidden bg-[#0a0a0a] text-white flex flex-col items-center justify-center select-none font-sans"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <WaterRippleCanvas ref={rippleRef} onSlam={handleSplash} className="z-0" />

      {/* Orbit Layer */}
      <div
        className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
      >
        {!reducedMotion &&
          BADGES.map((id) => {
            const isOrbiting = orbiting[id]
            const deg = angles[id] || 0
            const rad = ((deg - 90) * Math.PI) / 180
            const x = Math.cos(rad) * badgeRadius
            const y = Math.sin(rad) * badgeRadius
            const cfg = PLATFORM_CONFIG[id]
            const Icon = cfg.icon

            if (!isOrbiting) return null

            return (
              <div
                key={id}
                aria-label={cfg.name}
                className="absolute w-12 h-12 rounded-full bg-slate-900/80 backdrop-blur-md shadow-xl border border-white/10 flex items-center justify-center will-change-transform"
                style={{
                  transform: `translate3d(${x}px, ${y}px, 0)`,
                  transitionDuration: `${120 * DEBUG_SLOWMO}ms`,
                }}
              >
                <Icon size={22} color={cfg.color} />
              </div>
            )
          })}
      </div>

      {/* Center Stage & Content (Higher z-index, guaranteed no overlap) */}
      <div className="relative z-20 flex flex-col items-center text-center max-w-sm px-4 pointer-events-auto">
        <h1 className="text-[clamp(28px,6vmin,54px)] font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
          Do you have
        </h1>

        <div ref={centerSlotRef} className="h-16 w-16 my-3 flex items-center justify-center relative">
          {exitingConfig && (
            <div
              className="absolute w-14 h-14 rounded-full bg-slate-900/90 backdrop-blur-md shadow-2xl border border-white/20 flex items-center justify-center transition-all"
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

          {activeConfig ? (
            <div
              className={`w-14 h-14 rounded-full bg-slate-900/90 backdrop-blur-md shadow-2xl border border-white/20 flex items-center justify-center ${
                isSlamming ? 'animate-icon-slam' : 'transition-transform'
              }`}
              style={
                !isSlamming
                  ? {
                      transform: 'scale(1)',
                      transitionDuration: `${260 * DEBUG_SLOWMO}ms`,
                      transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
                    }
                  : undefined
              }
            >
              {React.createElement(activeConfig.icon, { size: 26, color: activeConfig.color })}
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-slate-700" />
          )}
        </div>

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
              <p className="text-[clamp(14px,2.2vmin,18px)] font-medium text-slate-300 mt-0.5">
                <span className="font-bold text-white tabular-nums">
                  {displayCount}%
                </span>{' '}
                of companies hire through {activeConfig.label.toLowerCase()}
              </p>
            </div>
          ) : (
            <span className="text-xs text-slate-500 font-medium">Waiting for credentials...</span>
          )}
        </div>

        <Link
          to="/auth"
          className={`relative overflow-hidden mt-6 inline-flex items-center justify-center min-h-[48px] px-8 py-3 rounded-xl bg-white text-slate-950 font-semibold text-base shadow-xl shadow-black/50 active:scale-[0.97] transition-all duration-150 ease-out hover:bg-slate-100 touch-manipulation select-none ${
            buttonShimmer ? 'ring-2 ring-white/40 ring-offset-2 ring-offset-black' : ''
          }`}
        >
          {buttonShimmer && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-black/20 to-transparent animate-btn-shimmer"
            />
          )}
          <span className="relative z-10">Get a job</span>
        </Link>
      </div>
    </main>
  )
}
