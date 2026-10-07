import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  TerminalWindow, 
  Code, 
  Lightbulb, 
  GithubLogo, 
  LinkedinLogo,
  CaretDown,
  Sparkle
} from '@phosphor-icons/react'
import WaterRippleCanvas from '../components/WaterRippleCanvas'
import FloatingIslandNav from '../components/FloatingIslandNav'
import TaglineReveal from '../components/TaglineReveal'

const PLATFORM_CONFIG = {
  github: {
    id: 'github',
    name: 'GitHub',
    label: 'GitHub',
    targetPercent: 84.6,
    color: '#F8FAFC',
    icon: GithubLogo,
  },
  leetcode: {
    id: 'leetcode',
    name: 'LeetCode',
    label: 'LeetCode',
    targetPercent: 78.4,
    color: '#FFA116',
    icon: Code,
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    label: 'LinkedIn',
    targetPercent: 91.8,
    color: '#38BDF8',
    icon: LinkedinLogo,
  },
  skills: {
    id: 'skills',
    name: 'Skills',
    label: 'Skills',
    targetPercent: 96.2,
    color: '#FACC15',
    icon: Lightbulb,
  },
}

const BADGES = ['github', 'leetcode', 'linkedin', 'skills']

const DRIFT_CONFIG = {
  github:   { T1: 8.2,  phi1: 0.2, T2: 11.4, phi2: 1.1 },
  leetcode: { T1: 9.6,  phi1: 2.3, T2: 10.2, phi2: 0.5 },
  linkedin: { T1: 7.8,  phi1: 4.1, T2: 13.1, phi2: 2.8 },
  skills:   { T1: 10.5, phi1: 1.7, T2: 9.1,  phi2: 3.9 },
}

export default function LandingPage() {
  const [initialRandomBadge] = useState(() => {
    const randomIndex = Math.floor(Math.random() * BADGES.length)
    return BADGES[randomIndex]
  })

  const [activeStageId, setActiveStageId] = useState(initialRandomBadge)
  const [exitingStageId, setExitingStageId] = useState(null)
  const [exitingOpacity, setExitingOpacity] = useState(1.0)
  const [textPhase, setTextPhase] = useState('idle')
  const [displayCount, setDisplayCount] = useState(PLATFORM_CONFIG[initialRandomBadge].targetPercent)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [pulseRingActive, setPulseRingActive] = useState(false)
  const [openFaqIndex, setOpenFaqIndex] = useState(null)

  const heroWrapperRef = useRef(null)
  const centerSlotRef = useRef(null)
  const pulseTimerRef = useRef(null)
  const rippleRef = useRef(null)
  const badgeDomRefs = useRef({})
  const cometTailRef = useRef(null)

  const geomRef = useRef({
    heroCenterX: 0,
    heroCenterY: 0,
    slotCenterX: 0,
    slotCenterY: 0,
    rx: 220,
    ry: 220,
    iconRadius: 27,
    pad: 24,
  })

  const slotAssignRef = useRef({
    github: 0,
    leetcode: 1,
    linkedin: 2,
    skills: 0,
  })

  const stateRef = useRef({
    phase: 'HOLD',
    phaseStartTime: performance.now(),
    currentActiveId: initialRandomBadge,
    incomingId: null,
    returningId: null,
    returningOpacity: 0,
    dockSide: 'right',
    brakeStartAngle: 0,
    brakeDelta: 0,
    brakeDuration: 1800,
    sharedPhase: 0,
    currentSpeed: 0.45,
    targetSpeed: 0.45,
    lastTime: performance.now(),
    lastCycleEndTime: performance.now(),
    readTargetCount: PLATFORM_CONFIG[initialRandomBadge].targetPercent,
    readCountStart: 0,
    readCountDone: true,
    cometStartX: 0,
    cometStartY: 0,
  })

  useEffect(() => {
    const floating = BADGES.filter((b) => b !== initialRandomBadge)
    const newSlots = {}
    floating.forEach((id, idx) => {
      newSlots[id] = idx
    })
    newSlots[initialRandomBadge] = null
    slotAssignRef.current = newSlots
  }, [initialRandomBadge])

  const iconPhysicsRef = useRef({
    github:   { x: 0, y: 0, vx: 0, vy: 0, opacity: 0.85, scale: 1 },
    leetcode: { x: 0, y: 0, vx: 0, vy: 0, opacity: 0.85, scale: 1 },
    linkedin: { x: 0, y: 0, vx: 0, vy: 0, opacity: 0.85, scale: 1 },
    skills:   { x: 0, y: 0, vx: 0, vy: 0, opacity: 0.85, scale: 1 },
  })

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    const updateGeometry = () => {
      const heroEl = heroWrapperRef.current
      const slotEl = centerSlotRef.current

      const vw = window.innerWidth
      const vh = window.innerHeight

      let heroRect = { left: vw / 2 - 160, top: vh / 2 - 160, width: 320, height: 320 }
      if (heroEl) {
        heroRect = heroEl.getBoundingClientRect()
      }

      let slotRect = { left: vw / 2 - 32, top: vh / 2 - 32, width: 64, height: 64 }
      if (slotEl) {
        slotRect = slotEl.getBoundingClientRect()
      }

      const iconRadius = vw < 480 ? 22 : 27
      const pad = vw < 480 ? 16 : 24

      const heroCenterX = heroRect.left + heroRect.width / 2
      const heroCenterY = heroRect.top + heroRect.height / 2
      const slotCenterX = slotRect.left + slotRect.width / 2
      const slotCenterY = slotRect.top + slotRect.height / 2
      const preferredR = Math.max(160, Math.min(vw * 0.38, 250))

      geomRef.current = {
        heroCenterX,
        heroCenterY,
        slotCenterX,
        slotCenterY,
        rx: preferredR,
        ry: preferredR,
        iconRadius,
        pad,
      }
    }

    updateGeometry()
    window.addEventListener('resize', updateGeometry)
    return () => window.removeEventListener('resize', updateGeometry)
  }, [])

  useEffect(() => {
    if (reducedMotion) return

    let animId = null
    const baseSpeedRad = (28 * Math.PI) / 180
    const maxAccel = (40 * Math.PI) / 180

    const getCirclePoint = (theta, radius) => ({
      x: Math.cos(theta) * radius,
      y: Math.sin(theta) * radius,
    })

    const loop = (now) => {
      const state = stateRef.current
      const geom = geomRef.current
      const physics = iconPhysicsRef.current

      const rawDt = (now - state.lastTime) / 1000
      state.lastTime = now
      const dt = Math.min(rawDt, 0.04)

      if (document.visibilityState !== 'visible') {
        animId = requestAnimationFrame(loop)
        return
      }

      const tSec = now / 1000
      const breathing = 1.0 + 0.1 * Math.sin((tSec * 2 * Math.PI) / 16)
      const targetSpeed = state.targetSpeed * breathing
      const speedDiff = targetSpeed - state.currentSpeed
      const maxDeltaV = maxAccel * dt
      if (Math.abs(speedDiff) <= maxDeltaV) {
        state.currentSpeed = targetSpeed
      } else {
        state.currentSpeed += Math.sign(speedDiff) * maxDeltaV
      }

      state.sharedPhase = (state.sharedPhase + state.currentSpeed * dt) % (2 * Math.PI)
      if (state.sharedPhase < 0) state.sharedPhase += 2 * Math.PI

      const floatingIds = BADGES.filter((id) => id !== state.currentActiveId)
      const timeInPhase = now - state.phaseStartTime

      switch (state.phase) {
        case 'HOLD': {
          state.targetSpeed = baseSpeedRad
          const timeSinceLastCycle = now - state.lastCycleEndTime

          if (timeSinceLastCycle >= 3200) {
            const currentIdx = BADGES.indexOf(state.currentActiveId)
            const nextCandidate = BADGES[(currentIdx + 1) % BADGES.length]
            const slotIdx = slotAssignRef.current[nextCandidate] ?? 0
            const incomingAngle = (state.sharedPhase + slotIdx * ((2 * Math.PI) / 3)) % (2 * Math.PI)

            const v0 = Math.max(state.currentSpeed, baseSpeedRad)
            const brakeSec = 1.2
            const brakeDelta = (v0 * brakeSec) / 2

            state.incomingId = nextCandidate
            state.brakeStartAngle = incomingAngle
            state.brakeDelta = brakeDelta
            state.brakeDuration = brakeSec * 1000
            state.phase = 'BRAKE'
            state.phaseStartTime = now
          }
          break
        }

        case 'BRAKE': {
          const p = Math.min(1, timeInPhase / state.brakeDuration)
          const progress = 1 - (1 - p) * (1 - p)
          state.sharedPhase = state.brakeStartAngle + state.brakeDelta * progress
          state.targetSpeed = 0
          state.currentSpeed = 0

          if (p >= 1) {
            state.phase = 'CHARGE'
            state.phaseStartTime = now
            setTextPhase('exiting')
            setExitingStageId(state.currentActiveId)
            setExitingOpacity(1.0)
          }
          break
        }

        case 'CHARGE': {
          state.targetSpeed = 0
          state.currentSpeed = 0
          if (timeInPhase >= 100) {
            const fadeP = Math.min(1, (timeInPhase - 100) / 450)
            setExitingOpacity(Math.max(0.1, 1 - 0.9 * fadeP))
          }
          if (timeInPhase >= 650) {
            const inc = state.incomingId
            state.cometStartX = physics[inc] ? physics[inc].x : 0
            state.cometStartY = physics[inc] ? physics[inc].y : 0
            state.phase = 'COMET'
            state.phaseStartTime = now
            setTextPhase('hidden')
          }
          break
        }

        case 'COMET': {
          state.targetSpeed = 0
          state.currentSpeed = 0
          if (timeInPhase <= 120) {
            setExitingOpacity(0.1 * (1 - timeInPhase / 120))
          } else {
            setExitingOpacity(0)
            setExitingStageId(null)
          }

          const cometDuration = 420
          const p = Math.min(1, timeInPhase / cometDuration)
          const easeP = Math.pow(p, 2.2)
          const incoming = state.incomingId
          const slotOffX = geom.slotCenterX - geom.heroCenterX
          const slotOffY = geom.slotCenterY - geom.heroCenterY
          const currentX = state.cometStartX + (slotOffX - state.cometStartX) * easeP
          const currentY = state.cometStartY + (slotOffY - state.cometStartY) * easeP

          if (physics[incoming]) {
            physics[incoming].x = currentX
            physics[incoming].y = currentY
            physics[incoming].scale = 1.15 - 0.15 * easeP
            physics[incoming].opacity = 1.0
          }

          if (p >= 1) {
            state.phase = 'IMPACT'
            state.phaseStartTime = now
            const prevActive = state.currentActiveId
            slotAssignRef.current[prevActive] = slotAssignRef.current[incoming] ?? 0
            slotAssignRef.current[incoming] = null
            state.returningId = prevActive
            state.returningOpacity = 0
            state.currentActiveId = incoming
            setActiveStageId(incoming)

            if (rippleRef.current) {
              rippleRef.current.triggerSlam(geom.slotCenterX, geom.slotCenterY, {
                intensity: 110,
                speed: 280,
                width: 50,
                maxRadius: 320,
                blastRadius: 85,
              })
            }
            setPulseRingActive(true)
            if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current)
            pulseTimerRef.current = setTimeout(() => setPulseRingActive(false), 550)
          }
          break
        }

        case 'IMPACT': {
          if (timeInPhase >= 250) {
            state.phase = 'SETTLE'
            state.phaseStartTime = now
          }
          break
        }

        case 'SETTLE': {
          state.targetSpeed = 0
          state.currentSpeed = 0
          if (timeInPhase >= 200) {
            const retP = Math.min(1, (timeInPhase - 200) / 400)
            state.returningOpacity = 0.5 * retP
          }
          if (timeInPhase >= 700) {
            state.phase = 'READ'
            state.phaseStartTime = now
            setTextPhase('entering')
            state.readTargetCount = PLATFORM_CONFIG[state.currentActiveId].targetPercent
            state.readCountStart = now
            state.readCountDone = false
            setDisplayCount(0)
          }
          break
        }

        case 'READ': {
          state.targetSpeed = 0
          state.currentSpeed = 0
          if (!state.readCountDone) {
            const countElapsed = now - state.readCountStart
            const countP = Math.min(1, countElapsed / 1000)
            const easeCount = 1 - Math.pow(1 - countP, 3)
            const val = parseFloat((state.readTargetCount * easeCount).toFixed(1))
            setDisplayCount(val)
            if (countP >= 1) {
              state.readCountDone = true
              setDisplayCount(state.readTargetCount)
            }
          }
          if (state.readCountDone && timeInPhase >= 2600) {
            state.phase = 'WAKE'
            state.phaseStartTime = now
          }
          break
        }

        case 'WAKE': {
          const wakeP = Math.min(1, timeInPhase / 1800)
          const easeWake = 0.5 - 0.5 * Math.cos(wakeP * Math.PI)
          state.targetSpeed = baseSpeedRad * easeWake
          if (wakeP >= 1) {
            state.phase = 'HOLD'
            state.phaseStartTime = now
            state.lastCycleEndTime = now
            setTextPhase('idle')
          }
          break
        }

        default:
          break
      }

      const isHalted = state.phase !== 'HOLD' && state.phase !== 'WAKE'
      const driftScale = isHalted ? 0.2 : 1.0

      floatingIds.forEach((id) => {
        if (state.phase === 'COMET' && id === state.incomingId) return
        const p = physics[id]
        const slotIdx = slotAssignRef.current[id] ?? 0
        const slotAngle = (state.sharedPhase + slotIdx * ((2 * Math.PI) / 3)) % (2 * Math.PI)
        const sq = getCirclePoint(slotAngle, geom.rx)

        const dCfg = DRIFT_CONFIG[id]
        const rDrift = 5 * Math.sin(tSec / dCfg.T1 + dCfg.phi1) * driftScale
        const tDrift = 3 * Math.sin(tSec / dCfg.T2 + dCfg.phi2) * driftScale
        const invLen = 1 / (Math.sqrt(sq.x * sq.x + sq.y * sq.y) || 1)
        p.x = sq.x + (sq.x * invLen) * rDrift + (-sq.y * invLen) * tDrift
        p.y = sq.y + (sq.y * invLen) * rDrift + (sq.x * invLen) * tDrift
      })

      const isDimmed = state.phase !== 'HOLD' && state.phase !== 'WAKE'
      const targetFloatingOpacity = isDimmed ? 0.45 : 0.85
      const hoverLights = []

      BADGES.forEach((id) => {
        const el = badgeDomRefs.current[id]
        if (!el) return
        const isCurrentActive = id === state.currentActiveId
        const isIncoming = id === state.incomingId
        const isReturning = id === state.returningId
        const p = physics[id]

        if (isCurrentActive) {
          el.style.opacity = '0'
          p.opacity = 0
          return
        }

        let op = targetFloatingOpacity
        let sc = 1.0
        if (isIncoming && state.phase === 'CHARGE') {
          op = 1.0
          sc = 1.14
        } else if (isIncoming && state.phase === 'COMET') {
          op = 1.0
          sc = p.scale
        } else if (isReturning && state.phase === 'SETTLE') {
          op = state.returningOpacity
        }

        p.opacity += (op - p.opacity) * 0.15
        p.scale += (sc - p.scale) * 0.15

        el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) scale(${p.scale})`
        el.style.opacity = `${p.opacity.toFixed(3)}`

        if (p.opacity > 0.08) {
          hoverLights.push({
            x: geom.heroCenterX + p.x,
            y: geom.heroCenterY + p.y,
            moving: !isHalted,
          })
        }
      })

      if (rippleRef.current) {
        rippleRef.current.setHoverLights(hoverLights, isDimmed ? 0.35 : 1.0)
      }

      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)
    return () => {
      if (animId) cancelAnimationFrame(animId)
    }
  }, [reducedMotion])

  const activeConfig = activeStageId ? PLATFORM_CONFIG[activeStageId] : null
  const exitingConfig = exitingStageId ? PLATFORM_CONFIG[exitingStageId] : null

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

  return (
    <div className="w-full min-h-screen bg-[#000000] text-white flex flex-col font-sans selection:bg-white/20">
      <FloatingIslandNav />

      {/* SECTION 1: HERO */}
      <section
        id="hero"
        className="relative w-full min-h-[92svh] overflow-hidden bg-[#000000] flex flex-col items-center justify-center pt-24 pb-16 px-4"
      >
        <WaterRippleCanvas ref={rippleRef} className="absolute inset-0 z-0 pointer-events-auto" />

        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div
            ref={cometTailRef}
            aria-hidden="true"
            className="absolute h-1 rounded-full pointer-events-none opacity-0"
          />

          {!reducedMotion &&
            BADGES.map((id) => {
              const cfg = PLATFORM_CONFIG[id]
              const Icon = cfg.icon

              return (
                <button
                  key={id}
                  type="button"
                  ref={(el) => {
                    badgeDomRefs.current[id] = el
                  }}
                  onClick={() => {
                    toast(`${cfg.name} Integration`, {
                      description: `${cfg.targetPercent}% of top tech companies evaluate candidates using ${cfg.name}.`,
                    })
                  }}
                  aria-label={cfg.name}
                  style={{
                    left: '50%',
                    top: '50%',
                    marginLeft: '-27px',
                    marginTop: '-27px',
                    boxShadow: `0 0 18px ${cfg.color}88, 0 0 36px ${cfg.color}44, 0 10px 22px rgba(0,0,0,0.6)`,
                  }}
                  className="absolute w-[54px] h-[54px] rounded-full bg-[#181818]/90 backdrop-blur-xl border border-white/25 flex items-center justify-center pointer-events-auto cursor-pointer will-change-transform active:scale-[0.98] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                >
                  <Icon size={26} color={cfg.color} />
                </button>
              )
            })}
        </div>

        <div
          ref={heroWrapperRef}
          className="relative z-20 flex flex-col items-center text-center max-w-[680px] px-4 pointer-events-auto"
        >
          <div className="inline-flex items-center gap-2 py-1 px-3 rounded-full border border-white/10 bg-[#181818]/80 backdrop-blur-md mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-medium text-slate-300">
              4,280 engineers hired across 380 tech teams
            </span>
          </div>

          <h1 className="hero-heading-gradient text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight [text-wrap:balance]">
            Turn your raw code and algorithms into offers
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-400 font-normal leading-relaxed max-w-[680px] [text-wrap:pretty]">
            CareerSync combines your real GitHub commits, LeetCode rankings, and LinkedIn credentials into one verified developer profile recruiters actually open.
          </p>

          <div ref={centerSlotRef} className="h-20 w-20 my-4 flex items-center justify-center relative">
            {pulseRingActive && (
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-full border border-sky-400 pointer-events-none animate-dock-pulse"
              />
            )}

            {exitingConfig && (
              <div
                style={{
                  opacity: exitingOpacity,
                  boxShadow: `0 0 24px ${exitingConfig.color}99, 0 0 48px ${exitingConfig.color}44`,
                }}
                className="absolute w-[64px] h-[64px] rounded-full bg-[#181818]/90 backdrop-blur-md border border-white/25 flex items-center justify-center pointer-events-none"
              >
                {React.createElement(exitingConfig.icon, { size: 28, color: exitingConfig.color })}
              </div>
            )}

            {activeConfig ? (
              <div
                style={{
                  boxShadow: `0 0 24px ${activeConfig.color}99, 0 0 48px ${activeConfig.color}44`,
                }}
                className="w-[64px] h-[64px] rounded-full bg-[#181818]/90 backdrop-blur-md border border-white/25 flex items-center justify-center"
              >
                {React.createElement(activeConfig.icon, { size: 28, color: activeConfig.color })}
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full border border-dashed border-slate-700" />
            )}
          </div>

          <div aria-live="polite" className="h-12 flex flex-col items-center justify-center">
            {activeConfig && textPhase !== 'hidden' ? (
              <div className="flex flex-col items-center">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                  {activeConfig.label} verification
                </span>
                <p className="text-sm sm:text-base font-medium text-slate-300 mt-0.5">
                  <span className="font-bold text-white tabular-nums inline-block min-w-[2.5ch] text-right">
                    {displayCount}%
                  </span>{' '}
                  of tech leads verify candidates through {activeConfig.label}
                </p>
              </div>
            ) : (
              <div className="h-6" />
            )}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
            {/* Button per B1 and B2: text-base semibold, 8px vertical 12px horizontal padding token */}
            <Link
              to="/auth"
              className="inline-flex items-center justify-center py-2 px-3 rounded-xl bg-white text-slate-950 font-semibold text-base shadow-lg hover:bg-slate-200 active:scale-[0.98] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
            >
              Build your portfolio
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-sm text-slate-400">
            <span>Already have an account?</span>
            <Link
              to="/auth?mode=signin"
              className="font-medium text-slate-200 hover:text-white underline underline-offset-4 decoration-slate-600 hover:decoration-slate-300 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none rounded"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 2: MANDATORY TAGLINE REVEAL (B11) */}
      <TaglineReveal />

      {/* SECTION 3: PROBLEM TO SOLUTION */}
      <section className="py-24 px-6 bg-[#181818] border-b border-white/10">
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
            {/* The Old Way: outer rounded-2xl (16px), gap 8px -> inner rounded-lg (8px) */}
            <div className="rounded-2xl border border-white/10 bg-[#1F1F1F] p-6 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 py-1 px-3 rounded-lg bg-[#272727] text-slate-400 text-xs font-semibold mb-6">
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
            <div className="rounded-2xl border border-white/10 bg-[#1F1F1F] p-6 flex flex-col justify-between shadow-xl">
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

      {/* SECTION 4: BENEFITS */}
      <section id="benefits" className="py-24 px-6 bg-[#000000] border-b border-white/10">
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
            {/* Benefit 1: outer rounded-2xl (16px), gap 8px -> inner rounded-lg (8px) */}
            <div className="rounded-2xl border border-white/10 bg-[#181818] p-6 hover:border-white/20 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
              <div className="w-10 h-10 rounded-lg bg-[#272727] flex items-center justify-center text-white mb-5 border border-white/10">
                <GithubLogo size={20} color="#FFFFFF" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Live repository telemetry
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed [text-wrap:pretty]">
                Auto sync active GitHub contributions and merged pull requests so engineering managers inspect production commits rather than buzzwords.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="rounded-2xl border border-white/10 bg-[#181818] p-6 hover:border-white/20 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
              <div className="w-10 h-10 rounded-lg bg-[#272727] flex items-center justify-center text-white mb-5 border border-white/10">
                <Code size={20} className="text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Verified algorithmic percentiles
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed [text-wrap:pretty]">
                Turn your solved problems and contest percentiles into an audited breakdown that signals problem solving depth at a glance.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="rounded-2xl border border-white/10 bg-[#181818] p-6 hover:border-white/20 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
              <div className="w-10 h-10 rounded-lg bg-[#272727] flex items-center justify-center text-white mb-5 border border-white/10">
                <ShieldCheck size={20} className="text-sky-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                One unified candidate link
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed [text-wrap:pretty]">
                Replace scattered links across LinkedIn, Google Drive, and repository bookmarks with a single fast link that loads in under 300 milliseconds.
              </p>
            </div>

            {/* Benefit 4 */}
            <div className="rounded-2xl border border-white/10 bg-[#181818] p-6 hover:border-white/20 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
              <div className="w-10 h-10 rounded-lg bg-[#272727] flex items-center justify-center text-white mb-5 border border-white/10">
                <TerminalWindow size={20} className="text-emerald-400" />
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

      {/* SECTION 5: HOW IT WORKS */}
      <section id="how-it-works" className="py-24 px-6 bg-[#181818] border-b border-white/10">
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
            <div className="rounded-2xl border border-white/10 bg-[#1F1F1F] p-6 flex flex-col">
              <span className="text-3xl font-bold text-slate-600 mb-4 font-mono">01</span>
              <h3 className="text-lg font-bold text-white mb-2">Connect your handles</h3>
              <p className="text-sm text-slate-400 leading-relaxed [text-wrap:pretty]">
                Enter your public GitHub, LeetCode, and LinkedIn usernames. We never ask for passwords or private keys.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#1F1F1F] p-6 flex flex-col">
              <span className="text-3xl font-bold text-slate-600 mb-4 font-mono">02</span>
              <h3 className="text-lg font-bold text-white mb-2">Verify your metrics</h3>
              <p className="text-sm text-slate-400 leading-relaxed [text-wrap:pretty]">
                Our background workers fetch public commits, contest ratings, and credentials, generating cryptographic proof badges.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#1F1F1F] p-6 flex flex-col">
              <span className="text-3xl font-bold text-slate-600 mb-4 font-mono">03</span>
              <h3 className="text-lg font-bold text-white mb-2">Share your verified link</h3>
              <p className="text-sm text-slate-400 leading-relaxed [text-wrap:pretty]">
                Send your custom URL to recruiters or link it on applications. Monitor live telemetry whenever managers open your profile.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: SOCIAL PROOF */}
      <section id="proof" className="py-24 px-6 bg-[#000000] border-b border-white/10">
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
            <div className="rounded-2xl border border-white/10 bg-[#181818] p-6 flex flex-col justify-between">
              <p className="text-sm text-slate-300 leading-relaxed mb-6 [text-wrap:pretty]">
                "Hiring managers told me in the first interview that seeing my real commit consistency and LeetCode contest percentile in one clean link made interviewing me an immediate priority."
              </p>
              <div>
                <p className="text-sm font-semibold text-white">Priya Sundaram</p>
                <p className="text-xs text-slate-400">Senior Distributed Systems Lead</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#181818] p-6 flex flex-col justify-between">
              <p className="text-sm text-slate-300 leading-relaxed mb-6 [text-wrap:pretty]">
                "I was sending standard PDF resumes and getting ignored. Switching to CareerSync boosted my callback rate to 42% because engineering directors could click through directly to my repositories."
              </p>
              <div>
                <p className="text-sm font-semibold text-white">Marcus Vance</p>
                <p className="text-xs text-slate-400">Staff Backend Engineer</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#181818] p-6 flex flex-col justify-between">
              <p className="text-sm text-slate-300 leading-relaxed mb-6 [text-wrap:pretty]">
                "The live visit telemetry is incredible. I saw an engineering director review my profile in the morning and received an interview invitation two hours later."
              </p>
              <div>
                <p className="text-sm font-semibold text-white">Elena Rostova</p>
                <p className="text-xs text-slate-400">Full Stack Architect</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#181818] p-8 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
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

      {/* SECTION 7: FAQ */}
      <section id="faq" className="py-24 px-6 bg-[#181818] border-b border-white/10">
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
                  className="rounded-2xl border border-white/10 bg-[#1F1F1F] p-6 transition-all duration-300"
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

      {/* SECTION 8: FINAL CTA & RISK REVERSAL */}
      <section className="py-24 px-6 bg-[#000000] border-b border-white/10 text-center">
        <div className="max-w-[680px] mx-auto flex flex-col items-center">
          <h2 className="hero-heading-gradient text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight [text-wrap:balance]">
            Stop sending static resumes into automated filters
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400 [text-wrap:pretty]">
            Build your verified developer portfolio today. Free forever for individual developers with instant GitHub sync.
          </p>

          <div className="mt-8">
            <Link
              to="/auth"
              className="inline-flex items-center justify-center py-2 px-3 rounded-xl bg-white text-slate-950 font-semibold text-base shadow-xl hover:bg-slate-200 active:scale-[0.98] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
            >
              Build your portfolio
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
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

      {/* SECTION 9: FOOTER */}
      <footer className="py-12 px-6 bg-[#181818] text-slate-400 text-sm">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#181818]" />
            </div>
            <span>CareerSync</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs">
            <Link to="/about" className="hover:text-white transition-colors">
              About
            </Link>
            <Link to="/debug" className="hover:text-white transition-colors">
              System telemetry
            </Link>
            <a
              href="https://github.com/unconditionallydetermined-collab/copy-here"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub repository
            </a>
            <a href="#hero" className="hover:text-white transition-colors">
              Privacy policy
            </a>
            <a href="#hero" className="hover:text-white transition-colors">
              Terms of service
            </a>
          </div>

          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} CareerSync. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
