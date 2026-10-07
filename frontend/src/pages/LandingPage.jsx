import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { Lightbulb, Code2, ArrowRight, Check, ChevronDown, TrendingUp } from 'lucide-react'
import { Github, Linkedin } from '../components/Icons'
import WaterRippleCanvas from '../components/WaterRippleCanvas'

const PLATFORM_CONFIG = {
  github: {
    id: 'github',
    name: 'GitHub',
    label: 'Code Telemetry',
    targetPercent: 88,
    color: '#F8FAFC',
    icon: Github,
    tagline: 'matched through verified repositories',
  },
  leetcode: {
    id: 'leetcode',
    name: 'LeetCode',
    label: 'Algorithmic Proof',
    targetPercent: 92,
    color: '#FFA116',
    icon: Code2,
    tagline: 'higher technical interview pass rate',
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    label: 'Profile Authority',
    targetPercent: 94,
    color: '#38BDF8',
    icon: Linkedin,
    tagline: 'faster direct recruiter outreach',
  },
  skills: {
    id: 'skills',
    name: 'Skills',
    label: 'Skill Gap Match',
    targetPercent: 96,
    color: '#FACC15',
    icon: Lightbulb,
    tagline: 'placement readiness score achieved',
  },
}

const BADGES = ['github', 'leetcode', 'linkedin', 'skills']

const DRIFT_CONFIG = {
  github:   { T1: 8.2,  phi1: 0.2, T2: 11.4, phi2: 1.1 },
  leetcode: { T1: 9.6,  phi1: 2.3, T2: 10.2, phi2: 0.5 },
  linkedin: { T1: 7.8,  phi1: 4.1, T2: 13.1, phi2: 2.8 },
  skills:   { T1: 10.5, phi1: 1.7, T2: 9.1,  phi2: 3.9 },
}

function AnimatedChars({ text, baseDelay = 0, speed = 18 }) {
  return (
    <>
      {text.split('').map((char, i) => (
        <span
          key={i}
          className="inline-block animate-char-reveal will-change-transform opacity-0"
          style={{
            animationDelay: `${baseDelay + i * speed}ms`,
            animationFillMode: 'forwards',
            whiteSpace: char === ' ' ? 'pre' : 'normal',
          }}
        >
          {char}
        </span>
      ))}
    </>
  )
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
  const [ctaShimmerActive, setCtaShimmerActive] = useState(false)
  const [ctaShimmerCycle, setCtaShimmerCycle] = useState(0)
  const [pulseRingActive, setPulseRingActive] = useState(false)
  const [isLockedAtBottom, setIsLockedAtBottom] = useState(false)

  const containerRef = useRef(null)
  const topFoldRef = useRef(null)
  const bottomFoldRef = useRef(null)
  const heroWrapperRef = useRef(null)
  const centerSlotRef = useRef(null)
  const buttonRef = useRef(null)
  const ticksBottomRef = useRef(null)
  const pulseTimerRef = useRef(null)
  const rippleRef = useRef(null)
  const badgeDomRefs = useRef({})
  const cometTailRef = useRef(null)

  const geomRef = useRef({
    heroCenterX: 0,
    heroCenterY: 0,
    slotCenterX: 0,
    slotCenterY: 0,
    ticksTop: 9999,
    exclusionRect: { left: 0, top: 0, right: 0, bottom: 0 },
    rx: 210,
    ry: 210,
    iconRadius: 26,
    pad: 24,
    height: 800,
  })

  const slotAssignRef = useRef({
    github: null,
    leetcode: 0,
    linkedin: 1,
    skills: 2,
  })

  // Initialize slots dynamically around initial active badge
  useEffect(() => {
    const floating = BADGES.filter((b) => b !== initialRandomBadge)
    const newSlots = {}
    BADGES.forEach((b) => {
      newSlots[b] = null
    })
    floating.forEach((b, i) => {
      newSlots[b] = i
    })
    slotAssignRef.current = newSlots
  }, [initialRandomBadge])

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
    brakeDuration: 2800,
    sharedPhase: 0,
    currentSpeed: 0.45,
    targetSpeed: 0.45,
    lastTime: performance.now(),
    lastCycleEndTime: performance.now(),
    readTargetCount: PLATFORM_CONFIG[initialRandomBadge].targetPercent,
    readCountStart: 0,
    readCountDone: true,
    lastSettleCheck: 0,
    pulseStage: 0,
    pulseStartTime: 0,
    waitingIncomingId: null,
    cometStartX: 0,
    cometStartY: 0,
  })

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

  // Lock user in bottom fold once reached
  useEffect(() => {
    const bottomEl = bottomFoldRef.current
    if (!bottomEl) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {
            setIsLockedAtBottom(true)
          }
        })
      },
      { threshold: [0.55] }
    )

    observer.observe(bottomEl)
    return () => observer.disconnect()
  }, [])

  // Prevent scrolling back up when locked in bottom fold
  useEffect(() => {
    if (!isLockedAtBottom) return

    const handleWheel = (e) => {
      if (e.deltaY < 0) {
        // Prevent scrolling up past bottom fold
        e.preventDefault()
      }
    }

    const handleKeyDown = (e) => {
      if (['ArrowUp', 'PageUp', 'Home'].includes(e.key)) {
        e.preventDefault()
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isLockedAtBottom])

  // Geometry measurement & strict orb clearance above ticks
  useEffect(() => {
    const updateGeometry = () => {
      const bottomEl = bottomFoldRef.current
      if (!bottomEl) return

      const vw = window.innerWidth
      const vh = window.innerHeight

      const heroEl = heroWrapperRef.current
      const slotEl = centerSlotRef.current
      const ticksEl = ticksBottomRef.current

      let heroRect = heroEl ? heroEl.getBoundingClientRect() : { left: vw / 2 - 160, top: vh / 2 - 160, width: 320, height: 320 }
      let slotRect = slotEl ? slotEl.getBoundingClientRect() : { left: vw / 2 - 32, top: vh / 2 - 32, width: 64, height: 64 }
      let ticksRect = ticksEl ? ticksEl.getBoundingClientRect() : { top: vh - 60 }

      const iconRadius = vw < 360 ? 18 : vw < 480 ? 22 : 26
      const pad = vw < 360 ? 14 : vw < 480 ? 20 : 26

      const heroCenterX = heroRect.left + heroRect.width / 2
      const heroCenterY = heroRect.top + heroRect.height / 2
      const slotCenterX = slotRect.left + slotRect.width / 2
      const slotCenterY = slotRect.top + slotRect.height / 2

      // Strict clearance: Ensure orbit NEVER dips down to the ticks level
      const distToTicks = Math.max(140, ticksRect.top - slotCenterY)
      const maxAllowedRadius = distToTicks - iconRadius - 28

      const preferredR = Math.max(160, Math.min(vw * 0.42, vh * 0.36, 260))
      const R = Math.max(150, Math.min(preferredR, maxAllowedRadius))

      const exclusionRect = {
        left: heroRect.left - pad,
        top: heroRect.top - pad,
        right: heroRect.right + pad,
        bottom: heroRect.bottom + pad,
      }

      geomRef.current = {
        heroCenterX,
        heroCenterY,
        slotCenterX,
        slotCenterY,
        ticksTop: ticksRect.top,
        exclusionRect,
        rx: R,
        ry: R,
        iconRadius,
        pad,
        height: vh,
      }

      if (rippleRef.current) {
        rippleRef.current.setProtectedRect(exclusionRect)
      }
    }

    updateGeometry()
    window.addEventListener('resize', updateGeometry)

    const observer = new ResizeObserver(() => updateGeometry())
    if (heroWrapperRef.current) observer.observe(heroWrapperRef.current)
    if (ticksBottomRef.current) observer.observe(ticksBottomRef.current)

    return () => {
      window.removeEventListener('resize', updateGeometry)
      observer.disconnect()
    }
  }, [])

  // 60fps Animation Loop with Unified State Machine (Hold -> Brake -> Charge -> Comet -> Impact -> Settle -> Read -> Pulse -> Wake)
  useEffect(() => {
    if (reducedMotion) return

    let animId = null
    const baseSpeedRad = (26 * Math.PI) / 180
    const maxAccel = (35 * Math.PI) / 180

    const getCirclePoint = (theta, rx, ry) => ({
      x: Math.cos(theta) * rx,
      y: Math.sin(theta) * ry,
    })

    const loop = (now) => {
      const state = stateRef.current
      const geom = geomRef.current
      const physics = iconPhysicsRef.current

      const rawDt = (now - state.lastTime) / 1000
      state.lastTime = now
      const dt = Math.min(rawDt, 0.04)

      if (document.visibilityState !== 'visible') {
        if (state.phase === 'PULSE') {
          setCtaShimmerActive(false)
          state.phase = 'WAKE'
          state.phaseStartTime = performance.now()
        }
        animId = requestAnimationFrame(loop)
        return
      }

      const tSec = now / 1000
      const breathing = 1.0 + 0.12 * Math.sin((tSec * 2 * Math.PI) / 18)

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

          if (timeSinceLastCycle >= 3400) {
            const currentIdx = BADGES.indexOf(state.currentActiveId)
            const nextCandidate = BADGES[(currentIdx + 1) % BADGES.length]

            const isBadgeInView = (id, margin = 20) => {
              const p = physics[id]
              if (!p) return false
              const sx = geom.slotCenterX + p.x
              const sy = geom.slotCenterY + p.y
              const r = geom.iconRadius
              return (
                sx - r >= margin &&
                sx + r <= window.innerWidth - margin &&
                sy - r >= margin &&
                sy + r <= geom.ticksTop - 12
              )
            }

            const onScreen = floatingIds.filter((id) => isBadgeInView(id))
            let incoming = null

            if (state.waitingIncomingId && isBadgeInView(state.waitingIncomingId)) {
              incoming = state.waitingIncomingId
            } else if (onScreen.includes(nextCandidate)) {
              incoming = nextCandidate
            } else if (onScreen.length > 0) {
              incoming = onScreen[0]
            } else {
              state.waitingIncomingId = nextCandidate
            }

            if (incoming) {
              const slotIdx = slotAssignRef.current[incoming] ?? floatingIds.indexOf(incoming)
              const incomingAngle = (state.sharedPhase + slotIdx * ((2 * Math.PI) / 3)) % (2 * Math.PI)

              const v0 = Math.max(state.currentSpeed, baseSpeedRad)
              const brakeSec = 1.3
              const brakeDelta = (v0 * brakeSec) / 2
              const stopAngle = (incomingAngle + brakeDelta) % (2 * Math.PI)

              state.incomingId = incoming
              state.waitingIncomingId = null
              state.brakeStartAngle = incomingAngle
              state.brakeDelta = brakeDelta
              state.brakeDuration = brakeSec * 1000
              state.phase = 'BRAKE'
              state.phaseStartTime = now
            }
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

          if (timeInPhase >= 150) {
            const fadeElapsed = timeInPhase - 150
            const fadeP = Math.min(1, fadeElapsed / 500)
            setExitingOpacity(Math.max(0.1, 1 - 0.9 * fadeP))
          }

          if (timeInPhase >= 850) {
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

          if (timeInPhase <= 150) {
            setExitingOpacity(0.1 * (1 - timeInPhase / 150))
          } else {
            setExitingOpacity(0)
            setExitingStageId(null)
          }

          const cometDuration = 450
          const p = Math.min(1, timeInPhase / cometDuration)
          const easeP = Math.pow(p, 2.3)

          const incoming = state.incomingId
          const startPX = state.cometStartX
          const startPY = state.cometStartY
          const currentX = startPX * (1 - easeP)
          const currentY = startPY * (1 - easeP)

          if (physics[incoming]) {
            physics[incoming].x = currentX
            physics[incoming].y = currentY
            physics[incoming].scale = 1.15 - 0.15 * easeP
            physics[incoming].opacity = 1.0
          }

          if (cometTailRef.current) {
            const tailEl = cometTailRef.current
            tailEl.style.opacity = `${(1 - easeP * 0.4) * 0.65}`
            const tailLen = 120 * Math.sin(p * Math.PI)
            const moveAngle = Math.atan2(-startPY, -startPX)
            const tailX = currentX + Math.cos(moveAngle + Math.PI) * (geom.iconRadius + 4)
            const tailY = currentY + Math.sin(moveAngle + Math.PI) * (geom.iconRadius + 4)
            tailEl.style.transform = `translate3d(${tailX}px, ${tailY}px, 0) rotate(${moveAngle + Math.PI}rad)`
            tailEl.style.width = `${Math.max(0, tailLen)}px`
          }

          if (rippleRef.current && p > 0.1 && p < 0.9) {
            rippleRef.current.displaceAt(geom.slotCenterX + currentX, geom.slotCenterY + currentY, 8)
          }

          if (p >= 1) {
            state.phase = 'IMPACT'
            state.phaseStartTime = now

            const prevActive = state.currentActiveId
            slotAssignRef.current[prevActive] = slotAssignRef.current[incoming] ?? floatingIds.indexOf(incoming)
            slotAssignRef.current[incoming] = null
            state.returningId = prevActive
            state.returningOpacity = 0
            state.currentActiveId = incoming
            setActiveStageId(incoming)

            if (rippleRef.current) {
              rippleRef.current.triggerSlam(geom.slotCenterX, geom.slotCenterY, {
                intensity: 105,
                speed: 280,
                width: 50,
                maxRadius: 320,
                blastRadius: 85,
              })
              rippleRef.current.boostDamping(1200)
            }

            setPulseRingActive(true)
            if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current)
            pulseTimerRef.current = setTimeout(() => setPulseRingActive(false), 550)
          }
          break
        }

        case 'IMPACT': {
          if (timeInPhase >= 280) {
            state.phase = 'SETTLE'
            state.phaseStartTime = now
            if (cometTailRef.current) {
              cometTailRef.current.style.opacity = '0'
            }
          }
          break
        }

        case 'SETTLE': {
          state.targetSpeed = 0
          state.currentSpeed = 0

          if (timeInPhase >= 250) {
            const retP = Math.min(1, (timeInPhase - 250) / 450)
            state.returningOpacity = 0.5 * retP
          }

          const minMet = timeInPhase >= 600
          const maxMet = timeInPhase >= 2000
          const isCanvasSettled = rippleRef.current ? rippleRef.current.isSettled() : true

          if ((minMet && isCanvasSettled) || maxMet) {
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
            const countP = Math.min(1, countElapsed / 1100)
            const easeCount = 1 - Math.pow(1 - countP, 3)
            const val = Math.round(state.readTargetCount * easeCount)
            setDisplayCount(val)

            if (countP >= 1) {
              state.readCountDone = true
              setDisplayCount(state.readTargetCount)
            }
          }

          const quietDuration = 1100 + 2200
          if (state.readCountDone && timeInPhase >= quietDuration) {
            state.phase = 'PULSE'
            state.phaseStartTime = now
            setCtaShimmerCycle((c) => c + 1)
            setCtaShimmerActive(true)
          }
          break
        }

        case 'PULSE': {
          state.targetSpeed = 0
          state.currentSpeed = 0

          const pulseElapsed = now - state.phaseStartTime
          const shimmerDuration = reducedMotion ? 1000 : 3200
          const totalPulseDuration = shimmerDuration + 500

          if (pulseElapsed >= shimmerDuration && ctaShimmerActive) {
            setCtaShimmerActive(false)
          }

          if (pulseElapsed >= totalPulseDuration) {
            setCtaShimmerActive(false)
            state.phase = 'WAKE'
            state.phaseStartTime = now
          }
          break
        }

        case 'WAKE': {
          const wakeP = Math.min(1, timeInPhase / 2200)
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

      // Orbital Position Calculation & Clamping
      const isHalted = state.phase !== 'HOLD' && state.phase !== 'WAKE'
      const driftScale = isHalted ? 0.2 : 0.9

      floatingIds.forEach((id) => {
        if (state.phase === 'COMET' && id === state.incomingId) return

        const p = physics[id]
        const slotIdx = slotAssignRef.current[id] ?? 0
        const slotAngle = (state.sharedPhase + slotIdx * ((2 * Math.PI) / 3)) % (2 * Math.PI)
        const sq = getCirclePoint(slotAngle, geom.rx, geom.ry)

        const dCfg = DRIFT_CONFIG[id]
        const rDrift = 6 * Math.sin(tSec / dCfg.T1 + dCfg.phi1) * driftScale
        const tDrift = 4 * Math.sin(tSec / dCfg.T2 + dCfg.phi2) * driftScale

        const invLen = 1 / (Math.sqrt(sq.x * sq.x + sq.y * sq.y) || 1)
        const radDirX = sq.x * invLen
        const radDirY = sq.y * invLen
        const tanDirX = -radDirY
        const tanDirY = radDirX

        let nextX = sq.x + radDirX * rDrift + tanDirX * tDrift
        let nextY = sq.y + radDirY * rDrift + tanDirY * tDrift

        // Strict avoidance of ticks area: never allow orb Y to cross into ticks
        const maxAllowedY = geom.ticksTop - geom.slotCenterY - geom.iconRadius - 16
        if (nextY > maxAllowedY) {
          nextY = maxAllowedY
        }

        p.x = nextX
        p.y = nextY
      })

      const isDimmed = state.phase === 'CHARGE' || state.phase === 'COMET' || state.phase === 'IMPACT' || state.phase === 'SETTLE' || state.phase === 'READ' || state.phase === 'PULSE'
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
          p.scale = 1
          el.style.pointerEvents = 'none'
          return
        }

        el.style.pointerEvents = 'auto'

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

        // Smooth bottom falloff as orbs approach ticks threshold
        const absY = geom.slotCenterY + p.y
        const distFromTicks = geom.ticksTop - absY
        const fadeMargin = 120
        const bottomFactor = Math.min(1, Math.max(0, distFromTicks / fadeMargin))
        const effectiveOpacity = p.opacity * bottomFactor

        el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) scale(${p.scale})`
        el.style.opacity = `${effectiveOpacity.toFixed(3)}`

        if (effectiveOpacity > 0.08) {
          hoverLights.push({
            x: geom.slotCenterX + p.x,
            y: geom.slotCenterY + p.y,
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

  const scrollToBottomFold = () => {
    bottomFoldRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-screen bg-[#0a0a0a] text-white selection:bg-white/20 font-sans snap-y snap-mandatory overflow-x-hidden"
    >
      {/* ── FOLD 1: INTRO HERO ── */}
      <section
        ref={topFoldRef}
        className="relative w-full min-h-[100svh] snap-start flex flex-col justify-between items-center px-6 py-8 bg-[#0a0a0a]"
      >
        {/* Navigation bar */}
        <header className="w-full max-w-6xl mx-auto flex items-center justify-between z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-950 font-bold shadow-md">
              <TrendingUp size={16} />
            </div>
            <span className="font-bold text-white text-base tracking-tight">Career Sync</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/about"
              className="text-sm text-slate-300 hover:text-white transition-colors font-medium px-3.5 py-1.5 rounded-lg hover:bg-white/5"
            >
              About
            </Link>
            <Link
              to="/auth?mode=signin"
              className="text-sm text-white font-medium px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 transition-colors border border-white/10"
            >
              Sign In
            </Link>
          </div>
        </header>

        {/* Center content */}
        <div className="my-auto max-w-3xl mx-auto text-center flex flex-col items-center z-10 pt-8 pb-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight [text-wrap:balance]">
            Stop sending static resumes
          </h1>

          {/* Styled gaining opacity & highlighting text */}
          <p className="text-lg sm:text-xl md:text-2xl text-slate-300 font-medium leading-relaxed max-w-2xl mb-10 [text-wrap:pretty]">
            <span className="text-white font-semibold drop-shadow-sm">Traditional resumes hide your true ability.</span>{' '}
            <span className="text-slate-300">Find your dream jobs easily and match careers that fit your skills.</span>
          </p>

          {/* Primary CTA */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              to="/auth?mode=signup"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-white text-slate-950 font-semibold text-base shadow-[0_0_30px_rgba(255,255,255,0.25)] hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 select-none"
            >
              Find your dream job
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>

          {/* Secondary Sign In */}
          <div className="mt-4 text-sm text-slate-400">
            <span>Already have an account? </span>
            <Link
              to="/auth?mode=signin"
              className="font-medium text-slate-200 hover:text-white underline underline-offset-4 decoration-slate-600 hover:decoration-slate-300 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Bottom ticks & scroll trigger */}
        <div className="w-full flex flex-col items-center gap-6 pb-4 z-10">
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

          <button
            type="button"
            onClick={scrollToBottomFold}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer group mt-2"
          >
            <span>Scroll down to interactive preview</span>
            <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5 animate-bounce" />
          </button>
        </div>
      </section>

      {/* ── FOLD 2: BOTTOM INTERACTIVE FOLD (Grid + Water Ripple + Smashed Orbs) ── */}
      <section
        ref={bottomFoldRef}
        className="relative w-full min-h-[100svh] h-[100dvh] snap-start overflow-hidden bg-[#0a0a0a] bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px] text-white flex flex-col items-center justify-between select-none font-sans py-6 px-4"
      >
        <WaterRippleCanvas ref={rippleRef} className="absolute inset-0 z-0 pointer-events-auto" />

        {/* Interactive Comet Tail Streak */}
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div
            ref={cometTailRef}
            aria-hidden="true"
            className="absolute h-1 rounded-full pointer-events-none opacity-0 transition-opacity duration-200"
            style={{
              left: '50%',
              top: '50%',
              marginTop: '-2px',
              height: '3px',
              background: 'linear-gradient(90deg, rgba(56,189,248,0.9) 0%, rgba(56,189,248,0.2) 60%, transparent 100%)',
              boxShadow: '0 0 14px rgba(56,189,248,0.5)',
            }}
          />

          {/* Floating Orbit Orbs */}
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
                    toast(cfg.label, {
                      description: `${cfg.targetPercent}% ${cfg.tagline}`,
                    })
                  }}
                  aria-label={cfg.name}
                  style={{
                    left: '50%',
                    top: '50%',
                    marginLeft: '-26px',
                    marginTop: '-26px',
                    boxShadow: `0 0 16px ${cfg.color}88, 0 0 36px ${cfg.color}44, 0 10px 22px rgba(0,0,0,0.55)`,
                  }}
                  className="absolute w-[52px] h-[52px] rounded-full bg-slate-900/85 backdrop-blur-xl shadow-2xl border border-white/25 flex items-center justify-center pointer-events-auto cursor-pointer will-change-transform z-10"
                >
                  <Icon size={22} color={cfg.color} />
                </button>
              )
            })}
        </div>

        {/* Top spacer / subtle headline */}
        <div className="relative z-20 text-center max-w-md pt-2 pointer-events-none">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white/90">
            Prove your real craft
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Automated verification replaces guesswork with live telemetry
          </p>
        </div>

        {/* Center Slot & Smash Impact Area */}
        <div
          ref={heroWrapperRef}
          className="relative z-20 flex flex-col items-center text-center max-w-sm px-4 pointer-events-auto my-auto"
        >
          <div ref={centerSlotRef} className="h-20 w-20 my-2 flex items-center justify-center relative">
            {/* Slot landing pulse ring */}
            {pulseRingActive && (
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-full border border-sky-400 pointer-events-none animate-dock-pulse"
              />
            )}

            {/* Outgoing center icon fading in-place */}
            {exitingConfig && (
              <div
                style={{
                  opacity: exitingOpacity,
                  boxShadow: `0 0 26px ${exitingConfig.color}99, 0 0 58px ${exitingConfig.color}55, 0 12px 28px rgba(0,0,0,0.55)`,
                }}
                className="absolute w-[66px] h-[66px] rounded-full bg-slate-900/90 backdrop-blur-md shadow-2xl border border-white/25 flex items-center justify-center pointer-events-none"
              >
                {React.createElement(exitingConfig.icon, { size: 30, color: exitingConfig.color })}
              </div>
            )}

            {/* Active Center Icon with calibrated colored orb glow */}
            {activeConfig ? (
              <div
                style={{
                  boxShadow: `0 0 26px ${activeConfig.color}99, 0 0 58px ${activeConfig.color}55, 0 12px 28px rgba(0,0,0,0.55)`,
                }}
                className="w-[66px] h-[66px] rounded-full bg-slate-900/90 backdrop-blur-md shadow-2xl border border-white/25 flex items-center justify-center cursor-default"
              >
                {React.createElement(activeConfig.icon, { size: 30, color: activeConfig.color })}
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full border-2 border-dashed border-slate-700" />
            )}
          </div>

          {/* Text Area: Verified stats readout */}
          <div aria-live="polite" className="h-14 flex flex-col items-center justify-center overflow-visible">
            {activeConfig && textPhase !== 'hidden' ? (
              <div
                className={`flex flex-col items-center will-change-transform ${
                  textPhase === 'exiting' ? 'animate-text-fade-out' : ''
                }`}
              >
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                  {textPhase === 'entering' ? (
                    <AnimatedChars text={activeConfig.label} baseDelay={0} speed={25} />
                  ) : (
                    activeConfig.label
                  )}
                </span>
                <p className="text-[clamp(14px,2.2vmin,17px)] font-medium text-slate-300 mt-0.5">
                  <span className="font-bold text-white tabular-nums inline-block min-w-[2.5ch] text-right">
                    {displayCount}%
                  </span>{' '}
                  {textPhase === 'entering' ? (
                    <AnimatedChars
                      text={activeConfig.tagline}
                      baseDelay={70}
                      speed={16}
                    />
                  ) : (
                    activeConfig.tagline
                  )}
                </p>
              </div>
            ) : (
              <div className="h-8" />
            )}
          </div>
        </div>

        {/* Bottom CTA & Trust Ticks (Orbs strictly stay ABOVE this container) */}
        <div
          ref={ticksBottomRef}
          className="relative z-30 flex flex-col items-center pb-4 pt-2 pointer-events-auto w-full max-w-md"
        >
          {/* Main CTA */}
          <Link
            ref={buttonRef}
            to="/auth?mode=signup"
            className="relative overflow-hidden inline-flex items-center justify-center min-w-[200px] min-h-[48px] px-8 py-3.5 rounded-xl bg-white text-slate-950 font-bold text-base shadow-[0_0_24px_rgba(255,255,255,0.2)] active:scale-[0.98] transition-all duration-200 hover:bg-slate-100 touch-manipulation select-none"
          >
            <span className="grid grid-cols-1 grid-rows-1 items-center justify-center text-center [&>*]:col-start-1 [&>*]:row-start-1">
              <span
                className={`font-bold text-base tracking-normal select-none ${
                  reducedMotion && ctaShimmerActive
                    ? 'animate-cta-reduced-color'
                    : 'text-slate-950 opacity-100'
                }`}
              >
                Get a job you'll love
              </span>

              {!reducedMotion && (
                <span
                  key={ctaShimmerCycle}
                  aria-hidden="true"
                  className={`font-bold text-base tracking-normal pointer-events-none select-none cta-text-shimmer ${
                    ctaShimmerActive ? 'cta-text-shimmer-active' : ''
                  }`}
                >
                  Get a job you'll love
                </span>
              )}
            </span>
          </Link>

          {/* Secondary Sign In */}
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <span>Already have an account?</span>
            <Link
              to="/auth?mode=signin"
              className="font-medium text-slate-200 hover:text-white underline underline-offset-4 decoration-slate-600 hover:decoration-slate-300 transition-colors"
            >
              Sign in
            </Link>
          </div>

          {/* Bottom ticks: Guaranteed no orb overlap */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400 select-none">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              Syncs in 30 seconds
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              Cancel or delete anytime
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}
