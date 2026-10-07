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

export default function LandingPage() {
  const [activeStageId, setActiveStageId] = useState('github')
  const [exitingStageId, setExitingStageId] = useState(null)
  const [stagePhase, setStagePhase] = useState('idle') // 'idle' | 'striking'
  const [poweringId, setPoweringId] = useState(null)
  const [buttonShimmer, setButtonShimmer] = useState(false)
  const [displayCount, setDisplayCount] = useState(PLATFORM_CONFIG.github.targetPercent)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [badgeRadius, setBadgeRadius] = useState(240)

  const rippleRef = useRef(null)
  const centerSlotRef = useRef(null)
  const buttonRef = useRef(null)
  const badgeDomRefs = useRef({})

  const activeStageIdRef = useRef('github')
  const incomingCandidateRef = useRef('leetcode')
  const pausedAtApexRef = useRef(null)

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
      const r = Math.max(200, Math.min(vw * 0.44, vh * 0.40, 280))
      setBadgeRadius(r)
    }
    calcRadius()
    window.addEventListener('resize', calcRadius)
    return () => window.removeEventListener('resize', calcRadius)
  }, [])

  // 60fps orbit loop with elastic anti-collision & apex detection
  useEffect(() => {
    if (reducedMotion) return
    let lastTime = performance.now()
    const baseSpeed = 0.05

    const tick = (now) => {
      const delta = Math.min(now - lastTime, 40)
      lastTime = now

      if (document.visibilityState === 'visible') {
        const angles = anglesRef.current
        const activeOrbiters = BADGES.filter((id) => orbitingRef.current[id])
        const candidate = incomingCandidateRef.current

        // Check if candidate reached top apex naturally along circular path (360° or 0°)
        if (candidate && orbitingRef.current[candidate] && !pausedAtApexRef.current) {
          const currentDeg = angles[candidate] % 360
          // If within reach of apex (top = 0 deg)
          if (currentDeg >= 354 || currentDeg <= 6) {
            angles[candidate] = 0
            pausedAtApexRef.current = candidate
            setPoweringId(candidate)
          }
        }

        // Advance each orbiting icon with elastic spacing to strictly prevent overlaps
        activeOrbiters.forEach((id) => {
          if (pausedAtApexRef.current === id) {
            angles[id] = 0
            return
          }

          let speedFactor = 1.0
          const myDeg = angles[id] % 360

          // Elastic collision avoidance against other orbiting badges ahead
          activeOrbiters.forEach((otherId) => {
            if (otherId === id) return
            const otherDeg = angles[otherId] % 360
            let gap = (otherDeg - myDeg + 360) % 360

            // If badge ahead is within 70 degrees, apply elastic deceleration
            const MIN_SAFE_GAP = 72
            if (gap > 0 && gap < MIN_SAFE_GAP) {
              const elasticity = Math.max(0.05, (gap - 18) / (MIN_SAFE_GAP - 18))
              speedFactor = Math.min(speedFactor, elasticity)
            }
          })

          angles[id] = (angles[id] + baseSpeed * speedFactor * delta) % 360
        })

        // Position active orbit elements in DOM
        const centerX = window.innerWidth / 2
        const centerY = window.innerHeight / 2
        const lights = []

        BADGES.forEach((id) => {
          const el = badgeDomRefs.current[id]
          if (orbitingRef.current[id]) {
            const deg = angles[id]
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

        if (rippleRef.current) {
          rippleRef.current.setHoverLights(lights)
        }
      }

      animationFrameRef.current = requestAnimationFrame(tick)
    }

    animationFrameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animationFrameRef.current)
  }, [reducedMotion, badgeRadius])

  // Choreography for powerup & direct asteroid strike
  useEffect(() => {
    if (reducedMotion) {
      setActiveStageId('skills')
      setDisplayCount(PLATFORM_CONFIG.skills.targetPercent)
      return
    }

    let isDestroyed = false

    const scheduleNextCycle = () => {
      if (isDestroyed || document.visibilityState !== 'visible') return

      const currentActive = activeStageIdRef.current
      const currentIndex = BADGES.indexOf(currentActive)
      const nextId = BADGES[(currentIndex + 1) % BADGES.length]

      incomingCandidateRef.current = nextId
    }

    const interval = setInterval(scheduleNextCycle, 5800)

    return () => {
      isDestroyed = true
      clearInterval(interval)
      clearInterval(countIntervalRef.current)
    }
  }, [reducedMotion])

  // Triggered when a badge has reached the top apex and acquired powerup
  useEffect(() => {
    if (!poweringId) return

    const timer = setTimeout(() => {
      // 1. Release from orbit into asteroid strike mode
      const strikingId = poweringId
      setPoweringId(null)
      pausedAtApexRef.current = null
      orbitingRef.current[strikingId] = false

      const prevActive = activeStageIdRef.current
      setExitingStageId(prevActive)
      activeStageIdRef.current = strikingId
      setActiveStageId(strikingId)
      setStagePhase('striking')

      // 2. Return previous icon back to orbit queue
      setTimeout(() => {
        orbitingRef.current[prevActive] = true
        anglesRef.current[prevActive] = 230
        setExitingStageId(null)
      }, 420)

      // 3. Impact slam when asteroid strikes center icon (~400ms)
      setTimeout(() => {
        setStagePhase('idle')
        if (centerSlotRef.current && rippleRef.current) {
          const rect = centerSlotRef.current.getBoundingClientRect()
          const cx = rect.left + rect.width / 2
          const cy = rect.top + rect.height / 2

          let btnX = cx
          let btnY = cy + 180
          if (buttonRef.current) {
            const btnRect = buttonRef.current.getBoundingClientRect()
            btnX = btnRect.left + btnRect.width / 2
            btnY = btnRect.top + btnRect.height / 2
          }

          rippleRef.current.triggerSlam(cx, cy, {
            intensity: 340,
            blastRadius: 130,
            targetX: btnX,
            targetY: btnY,
          })
        }
      }, 400)

      // 4. Update percentage counter
      const target = PLATFORM_CONFIG[strikingId].targetPercent
      let current = 0
      setDisplayCount(0)
      clearInterval(countIntervalRef.current)
      const stepTime = 800 / target
      countIntervalRef.current = setInterval(() => {
        current += 2
        if (current >= target) {
          setDisplayCount(target)
          clearInterval(countIntervalRef.current)
        } else {
          setDisplayCount(current)
        }
      }, stepTime)
    }, 750) // Powerup duration at apex

    return () => clearTimeout(timer)
  }, [poweringId])

  const handleSplash = () => {
    // Shimmer triggers as returning converging dots converge into the button (~2.4s)
    setTimeout(() => {
      setButtonShimmer(true)
      setTimeout(() => setButtonShimmer(false), 950)
    }, 2400)
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

      {/* Orbit Track with direct transforms and anti-overlap elasticity */}
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
        {!reducedMotion &&
          BADGES.map((id) => {
            const cfg = PLATFORM_CONFIG[id]
            const Icon = cfg.icon
            const isPowering = poweringId === id

            return (
              <div
                key={id}
                ref={(el) => {
                  badgeDomRefs.current[id] = el
                }}
                aria-label={cfg.name}
                className={`absolute w-12 h-12 rounded-full bg-slate-900/85 backdrop-blur-md shadow-xl border border-white/10 flex items-center justify-center will-change-transform transition-shadow duration-300 ${
                  isPowering ? 'animate-powerup ring-2 ring-white' : ''
                }`}
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
              className="absolute w-14 h-14 rounded-full bg-slate-900/90 backdrop-blur-md shadow-2xl border border-white/20 flex items-center justify-center animate-asteroid-blast-exit"
            >
              {React.createElement(exitingConfig.icon, { size: 26, color: exitingConfig.color })}
            </div>
          )}

          {activeConfig ? (
            <div
              className={`w-14 h-14 rounded-full bg-slate-900/90 backdrop-blur-md shadow-2xl border border-white/20 flex items-center justify-center ${
                stagePhase === 'striking' ? 'animate-asteroid-strike' : ''
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
                animation: `fadeIn 250ms cubic-bezier(0.23, 1, 0.32, 1) forwards`,
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
          ref={buttonRef}
          to="/auth"
          className={`relative overflow-hidden mt-6 inline-flex items-center justify-center min-h-[48px] px-8 py-3 rounded-xl bg-white text-slate-950 font-semibold text-base shadow-xl shadow-black/50 active:scale-[0.97] transition-all duration-200 ease-out hover:bg-slate-100 touch-manipulation select-none ${
            buttonShimmer ? 'ring-2 ring-white/60 ring-offset-2 ring-offset-black scale-[1.02]' : ''
          }`}
        >
          {buttonShimmer && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-black/25 to-transparent animate-btn-shimmer"
            />
          )}
          <span className="relative z-10">Get a job</span>
        </Link>
      </div>
    </main>
  )
}
