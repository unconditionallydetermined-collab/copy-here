import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
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

// Per-badge organic drift constants
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
  const [activeStageId, setActiveStageId] = useState('github')
  const [exitingStageId, setExitingStageId] = useState(null)
  const [exitingOpacity, setExitingOpacity] = useState(1.0)
  const [textPhase, setTextPhase] = useState('idle') // 'idle' | 'exiting' | 'entering' | 'hidden'
  const [displayCount, setDisplayCount] = useState(PLATFORM_CONFIG.github.targetPercent)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [ctaPulse, setCtaPulse] = useState(false)
  const [ctaThinking, setCtaThinking] = useState(false)
  const [pulseRingActive, setPulseRingActive] = useState(false)
  const [debugPhase, setDebugPhase] = useState('HOLD')

  const heroWrapperRef = useRef(null)
  const centerSlotRef = useRef(null)
  const buttonRef = useRef(null)
  const pulseTimerRef = useRef(null)
  const rippleRef = useRef(null)
  const badgeDomRefs = useRef({})
  const cometTailRef = useRef(null)

  // Layout & geometry cached state
  const geomRef = useRef({
    heroCenterX: 0,
    heroCenterY: 0,
    slotCenterX: 0,
    slotCenterY: 0,
    exclusionRect: { left: 0, top: 0, right: 0, bottom: 0 },
    rx: 240,
    ry: 240,
    iconRadius: 36,
    pad: 28,
  })

  // State machine & animation refs
  const stateRef = useRef({
    phase: 'HOLD', // HOLD | BRAKE | CHARGE | COMET | IMPACT | SETTLE | READ | PULSE | WAKE
    phaseStartTime: performance.now(),
    currentActiveId: 'github',
    incomingId: null,
    returningId: null,
    returningOpacity: 0,
    dockSide: 'right', // 'right' (angle 0) or 'left' (angle PI)
    brakeStartAngle: 0,
    brakeDelta: 0,
    brakeDuration: 2800,
    sharedPhase: 0,
    currentSpeed: 0.45, // rad/s (~26 deg/s)
    targetSpeed: 0.45,
    lastTime: performance.now(),
    lastCycleEndTime: performance.now(),
    readTargetCount: PLATFORM_CONFIG.github.targetPercent,
    readCountStart: 0,
    readCountDone: true,
    lastSettleCheck: 0,
    pulseStage: 0, // 0 = not started, 1 = pulse 1, 2 = gap, 3 = pulse 2
    pulseStartTime: 0,
  })

  // Persistent orbit slot per badge (0..2). A badge keeps its slot for its
  // whole floating lifetime; only the badge returning from the center adopts
  // the slot vacated by the badge that just docked. Prevents floating icons
  // from being re-indexed into different slots (the "appears from nowhere" jump).
  const slotAssignRef = useRef({ github: null, leetcode: 0, linkedin: 1, skills: 2 })

  // Physical simulation for floating icons
  const iconPhysicsRef = useRef({
    github:   { x: 0, y: 0, vx: 0, vy: 0, opacity: 0.85, scale: 1 },
    leetcode: { x: 0, y: 0, vx: 0, vy: 0, opacity: 0.85, scale: 1 },
    linkedin: { x: 0, y: 0, vx: 0, vy: 0, opacity: 0.85, scale: 1 },
    skills:   { x: 0, y: 0, vx: 0, vy: 0, opacity: 0.85, scale: 1 },
  })

  // Debug flag (?debug=orbit)
  const isDebug = useRef(
    typeof window !== 'undefined' &&
    window.location.search.includes('debug=orbit') &&
    import.meta.env.DEV
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Geometry measurement & exclusion zone calculation
  useEffect(() => {
    const updateGeometry = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight

      const heroEl = heroWrapperRef.current
      const slotEl = centerSlotRef.current

      let heroRect = { left: vw / 2 - 160, top: vh / 2 - 160, width: 320, height: 320, right: vw / 2 + 160, bottom: vh / 2 + 160 }
      if (heroEl) {
        heroRect = heroEl.getBoundingClientRect()
      }

      let slotRect = { left: vw / 2 - 32, top: vh / 2 - 32, width: 64, height: 64 }
      if (slotEl) {
        slotRect = slotEl.getBoundingClientRect()
      }

      const iconRadius = vw < 360 ? 24 : vw < 480 ? 30 : 36
      const pad = vw < 360 ? 16 : vw < 480 ? 24 : 32

      const heroCenterX = heroRect.left + heroRect.width / 2
      const heroCenterY = heroRect.top + heroRect.height / 2
      const slotCenterX = slotRect.left + slotRect.width / 2
      const slotCenterY = slotRect.top + slotRect.height / 2

      const contentHalfW = heroRect.width / 2
      const contentHalfH = heroRect.height / 2

      // True circular orbit: one radius for both axes, sized to clear the
      // content column measured to its corner (not half-width), so there is
      // no per-axis distortion and no viewport squashing. On small viewports
      // icons travel off-screen rather than deform the circle.
      const cornerDist = Math.sqrt(contentHalfW * contentHalfW + contentHalfH * contentHalfH)
      const minR = cornerDist + pad + iconRadius
      const preferredR = Math.max(200, Math.min(vw * 0.44, vh * 0.40, 280))
      const R = Math.max(preferredR, minR)
      const rx = R
      const ry = R

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
        exclusionRect,
        rx,
        ry,
        iconRadius,
        pad,
      }

      if (rippleRef.current) {
        rippleRef.current.setProtectedRect(exclusionRect)
      }
    }

    updateGeometry()
    window.addEventListener('resize', updateGeometry)

    const observer = new ResizeObserver(() => {
      updateGeometry()
    })
    if (heroWrapperRef.current) {
      observer.observe(heroWrapperRef.current)
    }

    return () => {
      window.removeEventListener('resize', updateGeometry)
      observer.disconnect()
    }
  }, [])

  // Main 60fps Animation Loop with Unified State Machine
  useEffect(() => {
    if (reducedMotion) return

    let animId = null
    const baseSpeedRad = (26 * Math.PI) / 180 // ~26 deg/s
    const maxAccel = (35 * Math.PI) / 180 // ~35 deg/s^2

    // Helper: point on a true circle at theta (0 = right dock point)
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
      const breathing = 1.0 + 0.15 * Math.sin((tSec * 2 * Math.PI) / 18)

      // Velocity-continuous speed change
      const targetSpeed = state.targetSpeed * breathing
      const speedDiff = targetSpeed - state.currentSpeed
      const maxDeltaV = maxAccel * dt
      if (Math.abs(speedDiff) <= maxDeltaV) {
        state.currentSpeed = targetSpeed
      } else {
        state.currentSpeed += Math.sign(speedDiff) * maxDeltaV
      }

      // Advance shared orbit phase
      state.sharedPhase = (state.sharedPhase + state.currentSpeed * dt) % (2 * Math.PI)
      if (state.sharedPhase < 0) state.sharedPhase += 2 * Math.PI

      // Non-active floating badges currently in orbit (always 3 badges)
      const floatingIds = BADGES.filter((id) => id !== state.currentActiveId)

      // STATE MACHINE ADVANCE
      const timeInPhase = now - state.phaseStartTime

      switch (state.phase) {
        case 'HOLD': {
          state.targetSpeed = baseSpeedRad
          const timeSinceLastCycle = now - state.lastCycleEndTime

          // After >= 4s calm orbit, prepare to dock the next badge
          if (timeSinceLastCycle >= 4000) {
            const currentIdx = BADGES.indexOf(state.currentActiveId)
            const incoming = BADGES[(currentIdx + 1) % BADGES.length]

            // Slot angle from the badge's persistent slot
            const slotIdx = slotAssignRef.current[incoming] ?? floatingIds.indexOf(incoming)
            const incomingAngle = (state.sharedPhase + slotIdx * ((2 * Math.PI) / 3)) % (2 * Math.PI)

            // Choose dock point: angle 0 (right) or PI (left)
            const distTo0 = (2 * Math.PI - incomingAngle) % (2 * Math.PI)
            const distToPI = (3 * Math.PI - incomingAngle) % (2 * Math.PI)
            const targetDockAngle = distTo0 <= distToPI ? 0 : Math.PI
            const angleNeeded = targetDockAngle === 0 ? distTo0 : distToPI

            // Only start braking when the badge is close enough to a dock
            // axis that it can glide there with an ease-out whose initial
            // velocity matches the current orbital speed — no sudden speed
            // change, and it stops exactly on the dock axis. Until then,
            // keep cruising in HOLD.
            const v0 = Math.max(state.currentSpeed, baseSpeedRad)
            const brakeDurationSec = (2 * angleNeeded) / v0
            if (brakeDurationSec <= 3.5) {
              state.incomingId = incoming
              state.dockSide = targetDockAngle === 0 ? 'right' : 'left'
              state.brakeStartAngle = incomingAngle
              state.brakeDelta = angleNeeded
              state.brakeDuration = brakeDurationSec * 1000
              state.phase = 'BRAKE'
              state.phaseStartTime = now
              setDebugPhase('BRAKE')
            }
          }
          break
        }

        case 'BRAKE': {
          const p = Math.min(1, timeInPhase / state.brakeDuration)
          // Quadratic ease-out applied to the orbit phase itself: starts at
          // the current orbital speed, ends at exactly the dock angle with
          // zero velocity.
          const progress = 1 - (1 - p) * (1 - p)
          state.sharedPhase = state.brakeStartAngle + state.brakeDelta * progress
          state.targetSpeed = 0
          state.currentSpeed = 0

          if (p >= 1) {
            state.targetSpeed = 0
            state.currentSpeed = 0
            state.phase = 'CHARGE'
            state.phaseStartTime = now
            setDebugPhase('CHARGE')
            setTextPhase('exiting')
            setExitingStageId(state.currentActiveId)
            setExitingOpacity(1.0)
          }
          break
        }

        case 'CHARGE': {
          state.targetSpeed = 0
          state.currentSpeed = 0

          // Center icon fades in-place with opacity only:
          // 150-700ms: 1 -> 0.1
          if (timeInPhase >= 150) {
            const fadeElapsed = timeInPhase - 150
            const fadeP = Math.min(1, fadeElapsed / 550)
            const op = Math.max(0.1, 1 - 0.9 * fadeP)
            setExitingOpacity(op)
          }

          if (timeInPhase >= 900) {
            state.phase = 'COMET'
            state.phaseStartTime = now
            setDebugPhase('COMET')
            setTextPhase('hidden')
          }
          break
        }

        case 'COMET': {
          state.targetSpeed = 0
          state.currentSpeed = 0

          // Complete center icon fade to 0 over first 150ms of comet run
          if (timeInPhase <= 150) {
            const op = 0.1 * (1 - timeInPhase / 150)
            setExitingOpacity(op)
          } else {
            setExitingOpacity(0)
            setExitingStageId(null)
          }

          const cometDuration = 480
          const p = Math.min(1, timeInPhase / cometDuration)
          // Accelerating ease-in curve
          const easeP = Math.pow(p, 2.4)

          const incoming = state.incomingId
          const isRight = state.dockSide === 'right'
          // Fly from the badge's exact position when CHARGE ended (the dock
          // point on the circle) to the exact center slot, so the comet
          // starts where the orbit stopped and lands where the new icon
          // renders — no snap at either end.
          const slotOffX = geom.slotCenterX - geom.heroCenterX
          const slotOffY = geom.slotCenterY - geom.heroCenterY
          const startPX = physics[incoming] ? physics[incoming].x : (isRight ? geom.rx : -geom.rx)
          const startPY = physics[incoming] ? physics[incoming].y : 0
          const currentX = startPX + (slotOffX - startPX) * easeP
          const currentY = startPY + (slotOffY - startPY) * easeP

          if (physics[incoming]) {
            physics[incoming].x = currentX
            physics[incoming].y = currentY
            physics[incoming].scale = 1.14 - 0.14 * easeP
            physics[incoming].opacity = 1.0
          }

          // Update comet tail (kept pointing against the direction of travel)
          if (cometTailRef.current) {
            const tailEl = cometTailRef.current
            tailEl.style.opacity = `${(1 - easeP * 0.4) * 0.55}`
            const tailLen = 130 * Math.sin(p * Math.PI)
            const moveAngle = Math.atan2(slotOffY - startPY, slotOffX - startPX)
            const tailX = currentX + Math.cos(moveAngle + Math.PI) * (geom.iconRadius + 4)
            const tailY = currentY + Math.sin(moveAngle + Math.PI) * (geom.iconRadius + 4)
            tailEl.style.transform = `translate3d(${tailX}px, ${tailY}px, 0) rotate(${moveAngle + Math.PI}rad)`
            tailEl.style.width = `${Math.max(0, tailLen)}px`
          }

          // Gentle dot nudge along flight corridor
          if (rippleRef.current && p > 0.1 && p < 0.9) {
            rippleRef.current.displaceAt(geom.slotCenterX + currentX, geom.slotCenterY, 8)
          }

          if (p >= 1) {
            // IMPACT!
            state.phase = 'IMPACT'
            state.phaseStartTime = now
            setDebugPhase('IMPACT')

            // Swap active center configuration cleanly behind impact.
            // The returning badge adopts the slot just vacated by the
            // incoming badge, so the other floating icons keep their exact
            // slots and nothing re-indexes or jumps.
            const prevActive = state.currentActiveId
            slotAssignRef.current[prevActive] = slotAssignRef.current[incoming] ?? floatingIds.indexOf(incoming)
            slotAssignRef.current[incoming] = null
            state.returningId = prevActive
            state.returningOpacity = 0
            state.currentActiveId = incoming
            setActiveStageId(incoming)

            // Trigger single gentle ripple and damping boost
            if (rippleRef.current) {
              rippleRef.current.triggerSlam(geom.slotCenterX, geom.slotCenterY, {
                intensity: 105,
                speed: 270,
                width: 54,
                maxRadius: 330,
                blastRadius: 90,
              })
              rippleRef.current.boostDamping(1200)
            }

            // Pulse ring at center slot
            setPulseRingActive(true)
            if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current)
            pulseTimerRef.current = setTimeout(() => setPulseRingActive(false), 600)
          }
          break
        }

        case 'IMPACT': {
          if (timeInPhase >= 300) {
            state.phase = 'SETTLE'
            state.phaseStartTime = now
            setDebugPhase('SETTLE')
            if (cometTailRef.current) {
              cometTailRef.current.style.opacity = '0'
            }
          }
          break
        }

        case 'SETTLE': {
          state.targetSpeed = 0
          state.currentSpeed = 0

          // Re-materialize previous active badge in its vacated floating slot
          // Starting >= 300ms after impact, opacity 0 -> 0.5 over 500ms
          if (timeInPhase >= 300) {
            const retP = Math.min(1, (timeInPhase - 300) / 500)
            state.returningOpacity = 0.5 * retP
          }

          // Check if canvas is settled, min 700ms, max 2200ms
          const minMet = timeInPhase >= 700
          const maxMet = timeInPhase >= 2200
          const isCanvasSettled = rippleRef.current ? rippleRef.current.isSettled() : true

          if ((minMet && isCanvasSettled) || maxMet) {
            state.phase = 'READ'
            state.phaseStartTime = now
            setDebugPhase('READ')
            setTextPhase('entering')

            // Start smooth performance.now percentage counter
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

          // Smooth counter interpolation over 1200ms with easeOutCubic
          if (!state.readCountDone) {
            const countElapsed = now - state.readCountStart
            const countP = Math.min(1, countElapsed / 1200)
            const easeCount = 1 - Math.pow(1 - countP, 3)
            const val = Math.round(state.readTargetCount * easeCount)
            setDisplayCount(val)

            if (countP >= 1) {
              state.readCountDone = true
              setDisplayCount(state.readTargetCount)
            }
          }

          // Hold READ for at least 1200ms after count finishes + 2500ms quiet pause
          const quietDuration = 1200 + 2500
          if (state.readCountDone && timeInPhase >= 1200 + quietDuration) {
            state.phase = 'PULSE'
            state.phaseStartTime = now
            state.pulseStage = 1
            state.pulseStartTime = now
            setDebugPhase('PULSE')
            setCtaPulse(true)
            setCtaThinking(true)
          }
          break
        }

        case 'PULSE': {
          state.targetSpeed = 0
          state.currentSpeed = 0

          const pulseElapsed = now - state.pulseStartTime
          // Pulse 1: 0 - 1400ms
          // Gap: 1400 - 1900ms
          // Pulse 2: 1900 - 3300ms
          if (state.pulseStage === 1 && pulseElapsed >= 1400) {
            state.pulseStage = 2
            setCtaPulse(false)
            setCtaThinking(false)
          } else if (state.pulseStage === 2 && pulseElapsed >= 1900) {
            state.pulseStage = 3
            setCtaPulse(true)
          } else if (state.pulseStage === 3 && pulseElapsed >= 3300) {
            setCtaPulse(false)
            state.pulseStage = 0
            state.phase = 'WAKE'
            state.phaseStartTime = now
            setDebugPhase('WAKE')
          }
          break
        }

        case 'WAKE': {
          // Speed eases 0 -> baseSpeed over 2500ms
          const wakeP = Math.min(1, timeInPhase / 2500)
          const easeWake = 0.5 - 0.5 * Math.cos(wakeP * Math.PI)
          state.targetSpeed = baseSpeedRad * easeWake

          if (wakeP >= 1) {
            state.phase = 'HOLD'
            state.phaseStartTime = now
            state.lastCycleEndTime = now
            setDebugPhase('HOLD')
            setTextPhase('idle')
          }
          break
        }

        default:
          break
      }

      // POSITIONS PASS — deterministic circular orbit.
      // Badges sit directly on the circle at their persistent slots with a
      // gentle organic drift. No springs, no pairwise repulsion, no exclusion
      // pushes: nothing fights the orbit, so the motion stays smooth and
      // icons may travel off-screen instead of deforming the path.
      const isHalted = state.phase !== 'HOLD' && state.phase !== 'WAKE'
      const driftScale = isHalted ? 0.25 : 1.0
      const heroCX = geom.heroCenterX
      const heroCY = geom.heroCenterY

      floatingIds.forEach((id) => {
        // Skip if this badge is currently flying as the comet
        if (state.phase === 'COMET' && id === state.incomingId) return

        const p = physics[id]
        const slotIdx = slotAssignRef.current[id] ?? 0
        const slotAngle = (state.sharedPhase + slotIdx * ((2 * Math.PI) / 3)) % (2 * Math.PI)
        const sq = getCirclePoint(slotAngle, geom.rx)

        // Organic drift
        const dCfg = DRIFT_CONFIG[id]
        const rDrift = 7 * Math.sin(tSec / dCfg.T1 + dCfg.phi1) * driftScale
        const tDrift = 5 * Math.sin(tSec / dCfg.T2 + dCfg.phi2) * driftScale

        const invLen = 1 / (Math.sqrt(sq.x * sq.x + sq.y * sq.y) || 1)
        const radDirX = sq.x * invLen
        const radDirY = sq.y * invLen
        const tanDirX = -radDirY
        const tanDirY = radDirX

        p.x = sq.x + radDirX * rDrift + tanDirX * tDrift
        p.y = sq.y + radDirY * rDrift + tanDirY * tDrift
      })

      // 5. Opacity & Glow Updates
      const isDimmed = state.phase === 'CHARGE' || state.phase === 'COMET' || state.phase === 'IMPACT' || state.phase === 'SETTLE' || state.phase === 'READ' || state.phase === 'PULSE'
      const targetFloatingOpacity = isDimmed ? 0.5 : 0.85
      const hoverLights = []

      BADGES.forEach((id) => {
        const el = badgeDomRefs.current[id]
        if (!el) return

        const isCurrentActive = id === state.currentActiveId
        const isIncoming = id === state.incomingId
        const isReturning = id === state.returningId
        const p = physics[id]

        if (isCurrentActive) {
          // Active icon sits inside the center slot; keep the physics
          // opacity at 0 so its later return fade starts from invisible.
          el.style.opacity = '0'
          p.opacity = 0
          p.scale = 1
          el.style.pointerEvents = 'none'
          return
        }

        el.style.pointerEvents = 'auto'

        // Determine target opacity and scale
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
        el.style.opacity = `${p.opacity}`

        // Hover lights on water ripple canvas
        if (p.opacity > 0.1) {
          hoverLights.push({
            x: heroCX + p.x,
            y: heroCY + p.y,
            moving: !isHalted,
          })
        }
      })

      if (rippleRef.current) {
        const dimFactor = isDimmed ? 0.4 : 1.0
        rippleRef.current.setHoverLights(hoverLights, dimFactor)
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

  return (
    <main
      className="relative w-screen min-h-[100svh] h-[100dvh] overflow-hidden bg-[#0a0a0a] text-white flex flex-col items-center justify-center select-none font-sans"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <WaterRippleCanvas ref={rippleRef} className="z-0" />

      {/* Dev-only debug HUD */}
      {isDebug.current && (
        <div className="absolute top-4 left-4 z-50 bg-black/80 px-3 py-1.5 rounded border border-white/20 text-xs font-mono text-sky-400 pointer-events-none">
          PHASE: {debugPhase}
        </div>
      )}

      {/* Orbit Track with shared phase and smooth continuous motion */}
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
        {/* Comet Tail */}
        <div
          ref={cometTailRef}
          aria-hidden="true"
          className="absolute h-1.5 rounded-full pointer-events-none opacity-0 transition-opacity duration-200"
          style={{
            left: '50%',
            top: '50%',
            marginTop: '-3px',
            background: 'linear-gradient(90deg, rgba(56,189,248,0.6) 0%, transparent 100%)',
          }}
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
                  marginLeft: '-36px',
                  marginTop: '-36px',
                  boxShadow: `0 0 24px ${cfg.color}66, 0 0 52px ${cfg.color}33, 0 12px 30px rgba(0,0,0,0.6)`,
                }}
                className="absolute w-[72px] h-[72px] rounded-full bg-slate-900/85 backdrop-blur-xl shadow-2xl border border-white/25 flex items-center justify-center pointer-events-auto cursor-pointer will-change-transform active:scale-[0.92]"
              >
                <Icon size={34} color={cfg.color} />
              </button>
            )
          })}
      </div>

      {/* Center Stage & Content: Wrapper stays 100% stable in layout */}
      <div
        ref={heroWrapperRef}
        className="relative z-20 flex flex-col items-center text-center max-w-sm px-4 pointer-events-auto"
      >
        <h1 className="text-[clamp(28px,6vmin,54px)] font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
          Do you have
        </h1>

        <div ref={centerSlotRef} className="h-24 w-24 my-3 flex items-center justify-center relative">
          {/* Slot landing pulse ring */}
          {pulseRingActive && (
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-full border border-sky-400 pointer-events-none animate-dock-pulse"
            />
          )}

          {/* Outgoing center icon fading in-place quietly */}
          {exitingConfig && (
            <div
              style={{
                opacity: exitingOpacity,
                boxShadow: `0 0 35px ${exitingConfig.color}88, 0 0 75px ${exitingConfig.color}44, 0 15px 35px rgba(0,0,0,0.6)`,
              }}
              className="absolute w-[84px] h-[84px] rounded-full bg-slate-900/90 backdrop-blur-md shadow-2xl border border-white/25 flex items-center justify-center pointer-events-none"
            >
              {React.createElement(exitingConfig.icon, { size: 38, color: exitingConfig.color })}
            </div>
          )}

          {/* Active Center Icon with prominent colored orb glow */}
          {activeConfig ? (
            <div
              style={{
                boxShadow: `0 0 35px ${activeConfig.color}88, 0 0 75px ${activeConfig.color}44, 0 15px 35px rgba(0,0,0,0.6)`,
              }}
              className="w-[84px] h-[84px] rounded-full bg-slate-900/90 backdrop-blur-md shadow-2xl border border-white/25 flex items-center justify-center"
            >
              {React.createElement(activeConfig.icon, { size: 38, color: activeConfig.color })}
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-slate-700" />
          )}
        </div>

        {/* Text area: strictly fixed h-14 container prevents any layout shifts */}
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
              <p className="text-[clamp(14px,2.2vmin,18px)] font-medium text-slate-300 mt-0.5">
                <span className="font-bold text-white tabular-nums inline-block min-w-[2.5ch] text-right">
                  {displayCount}%
                </span>{' '}
                {textPhase === 'entering' ? (
                  <AnimatedChars
                    text={`of companies hire through ${activeConfig.label.toLowerCase()}`}
                    baseDelay={80}
                    speed={16}
                  />
                ) : (
                  `of companies hire through ${activeConfig.label.toLowerCase()}`
                )}
              </p>
            </div>
          ) : (
            <div className="h-8" />
          )}
        </div>

        {/* CTA: Stable min-width, base label text-slate-950 always fully readable */}
        <Link
          ref={buttonRef}
          to="/auth"
          className={`relative overflow-hidden mt-6 inline-flex items-center justify-center min-w-[170px] min-h-[48px] px-8 py-3 rounded-xl bg-white text-slate-950 font-semibold text-base cta-button-glow ring-1 ring-white/45 active:scale-[0.97] transition-[transform,background-color,box-shadow,border-color] duration-300 ease-out hover:bg-slate-100 hover:ring-white/70 hover:scale-[1.02] touch-manipulation select-none border border-white/35 ${
            ctaPulse ? 'animate-cta-pulse ring-2 ring-sky-400 shadow-[0_0_40px_rgba(56,189,248,0.55)]' : ''
          }`}
        >
          {/* Subtle light sweep */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-sky-400/20 to-transparent animate-btn-shimmer"
          />

          {/* Stacked label container: base label in text-slate-950 + dark shimmer overlay */}
          <div className="relative z-10 grid grid-cols-1 grid-rows-1 items-center justify-center [&>*]:col-start-1 [&>*]:row-start-1">
            {/* Always visible base label (never blank or transparent) */}
            <span className="text-slate-950 font-semibold text-base tracking-normal">
              Get a job
            </span>

            {/* Dark gradient shimmer overlay that activates during thinking/pulse */}
            <span
              aria-hidden="true"
              className={`font-semibold text-base tracking-normal ai-thinking-overlay transition-opacity duration-250 ${
                ctaThinking ? 'opacity-100' : 'opacity-0'
              }`}
            >
              Get a job
            </span>
          </div>
        </Link>

        {/* Secondary Sign In option below CTA */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-sm text-slate-400">
          <span>Already have an account?</span>
          <Link
            to="/auth?mode=signin"
            className="font-medium text-slate-200 hover:text-white underline underline-offset-4 decoration-slate-600 hover:decoration-slate-300 transition-colors duration-150"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  )
}
