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
  const [stagePhase, setStagePhase] = useState('idle') // 'idle' | 'descending'
  const [buttonShimmer, setButtonShimmer] = useState(false)
  const [displayCount, setDisplayCount] = useState(PLATFORM_CONFIG.github.targetPercent)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [badgeRadius, setBadgeRadius] = useState(240)

  const rippleRef = useRef(null)
  const centerSlotRef = useRef(null)
  const badgeDomRefs = useRef({})

  const activeStageIdRef = useRef('github')
  const pausedBadgeRef = useRef(null) // badge hovering at top

  const anglesRef = useRef({
    github: 0,
    leetcode: 90,
    linkedin: 180,
    skills: 270,
  })

  const orbitingRef = useRef({
    github: false,
    leetcode: true,
    linkedin: true,
    skills: true,
  })

  const animationFrameRef = useRef(null)
  const countIntervalRef = useRef(null)

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
      const r = Math.max(200, Math.min(vw * 0.44, vh * 0.40, 290))
      setBadgeRadius(r)
    }
    calcRadius()
    window.addEventListener('resize', calcRadius)
    return () => window.removeEventListener('resize', calcRadius)
  }, [])

  // Smooth 60fps orbit without React re-render churn
  useEffect(() => {
    if (reducedMotion) return
    let lastTime = performance.now()
    const speed = 0.052 / DEBUG_SLOWMO

    const tick = (now) => {
      const delta = now - lastTime
      lastTime = now

      if (document.visibilityState === 'visible') {
        const next = anglesRef.current
        const centerX = window.innerWidth / 2
        const centerY = window.innerHeight / 2
        const lights = []

        BADGES.forEach((id) => {
          const el = badgeDomRefs.current[id]
          if (orbitingRef.current[id]) {
            if (pausedBadgeRef.current === id) {
              next[id] = 0 // Held vertically above at the apex
            } else {
              next[id] = (next[id] + speed * delta) % 360
            }

            const deg = next[id]
            const rad = ((deg - 90) * Math.PI) / 180
            const x = Math.cos(rad) * badgeRadius
            const y = Math.sin(rad) * badgeRadius

            if (el) {
              el.style.transform = `translate3d(${x}px, ${y}px, 0)`
              el.style.opacity = '1'
            }

            lights.push({
              x: centerX + x,
              y: centerY + y,
            })
          } else if (el) {
            el.style.opacity = '0'
          }
        })

        // Illuminate water dots beneath active icons without dragging physics
        if (rippleRef.current) {
          rippleRef.current.setHoverLights(lights)
        }
      }
      animationFrameRef.current = requestAnimationFrame(tick)
    }

    animationFrameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animationFrameRef.current)
  }, [reducedMotion, badgeRadius])

  // Choreography: arrival at apex, 1s hover, S-curve descent & exit
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

      // Step 1: Next icon moves to top (vertically above) and pauses for 1 second
      pausedBadgeRef.current = nextId
      anglesRef.current[nextId] = 0

      setTimeout(() => {
        if (isDestroyed) return

        // Step 2: Begin S-curve replacement
        pausedBadgeRef.current = null
        orbitingRef.current[nextId] = false

        setExitingStageId(currentActive)
        activeStageIdRef.current = nextId
        setActiveStageId(nextId)
        setStagePhase('descending')

        // Exit current icon back to orbit
        setTimeout(() => {
          if (isDestroyed) return
          orbitingRef.current[currentActive] = true
          anglesRef.current[currentActive] = 230
          setExitingStageId(null)
        }, 600 * DEBUG_SLOWMO)

        // Impact slam when S-curve lands (~650ms)
        setTimeout(() => {
          if (isDestroyed) return
          setStagePhase('idle')
          if (centerSlotRef.current && rippleRef.current) {
            const rect = centerSlotRef.current.getBoundingClientRect()
            const cx = rect.left + rect.width / 2
            const cy = rect.top + rect.height / 2
            rippleRef.current.triggerSlam(cx, cy, { intensity: 190, carveRadius: 32 })
          }
        }, 650 * DEBUG_SLOWMO)

        // Counter roll-up
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
      }, 1000 * DEBUG_SLOWMO) // 1 second hover at apex
    }

    const interval = setInterval(cycleToNext, 6200 * DEBUG_SLOWMO)

    return () => {
      isDestroyed = true
      clearInterval(interval)
      clearInterval(countIntervalRef.current)
    }
  }, [reducedMotion])

  const handleSplash = () => {
    // 3 seconds after each splash: shimmer effect sweeps left to right
    setTimeout(() => {
      setButtonShimmer(true)
      setTimeout(() => setButtonShimmer(false), 900)
    }, 3000)
  }

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

      {/* Orbit Layer with smooth non-jerky direct transforms */}
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
        {!reducedMotion &&
          BADGES.map((id) => {
            const cfg = PLATFORM_CONFIG[id]
            const Icon = cfg.icon

            return (
              <div
                key={id}
                ref={(el) => {
                  badgeDomRefs.current[id] = el
                }}
                aria-label={cfg.name}
                className="absolute w-12 h-12 rounded-full bg-slate-900/80 backdrop-blur-md shadow-xl border border-white/10 flex items-center justify-center will-change-transform"
              >
                <Icon size={22} color={cfg.color} />
              </div>
            )
          })}
      </div>

      {/* Center Stage & Content */}
      <div className="relative z-20 flex flex-col items-center text-center max-w-sm px-4 pointer-events-auto">
        <h1 className="text-[clamp(28px,6vmin,54px)] font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
          Do you have
        </h1>

        <div ref={centerSlotRef} className="h-16 w-16 my-3 flex items-center justify-center relative">
          {exitingConfig && (
            <div
              className="absolute w-14 h-14 rounded-full bg-slate-900/90 backdrop-blur-md shadow-2xl border border-white/20 flex items-center justify-center animate-s-curve-exit"
            >
              {React.createElement(exitingConfig.icon, { size: 26, color: exitingConfig.color })}
            </div>
          )}

          {activeConfig ? (
            <div
              className={`w-14 h-14 rounded-full bg-slate-900/90 backdrop-blur-md shadow-2xl border border-white/20 flex items-center justify-center ${
                stagePhase === 'descending' ? 'animate-s-curve-descend' : ''
              }`}
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
