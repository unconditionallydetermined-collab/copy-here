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
    iconRadius: 24,
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
    brakeTargetAngle: 0,
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

      const iconRadius = vw < 360 ? 16 : vw < 480 ? 20 : 24
      const pad = vw < 360 ? 12 : vw < 480 ? 20 : 28

      const heroCenterX = heroRect.left + heroRect.width / 2
      const heroCenterY = heroRect.top + heroRect.height / 2
      const slotCenterX = slotRect.left + slotRect.width / 2
      const slotCenterY = slotRect.top + slotRect.height / 2

      const contentHalfW = heroRect.width / 2
      const contentHalfH = heroRect.height / 2

      const minRx = contentHalfW + pad + iconRadius
      const minRy = contentHalfH + pad + iconRadius

      const preferredR = Math.max(200, Math.min(vw * 0.44, vh * 0.40, 280))
      let rx = Math.max(preferredR, minRx)
      let ry = Math.max(preferredR * 0.88, minRy)

      // Clamping within viewport with fallback
      const maxViewportRx = vw / 2 - iconRadius - 10
      if (rx > maxViewportRx) {
        rx = Math.max(minRx, maxViewportRx)
      }

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

    // Helper: evaluate superellipse / squircle position at theta (0 = right dock point)
    const getSquirclePoint = (theta, rx, ry) => {
      const n = 2.6
      const cosT = Math.cos(theta)
      const sinT = Math.sin(theta)
      const x = rx * Math.sign(cosT) * Math.pow(Math.abs(cosT), 2 / n)
      const y = ry * Math.sign(sinT) * Math.pow(Math.abs(sinT), 2 / n)
      return { x, y }
    }

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

          // After >= 4s calm orbit, initiate BRAKE to dock next badge
          if (timeSinceLastCycle >= 4000) {
            const currentIdx = BADGES.indexOf(state.currentActiveId)
            const incoming = BADGES[(currentIdx + 1) % BADGES.length]
            state.incomingId = incoming

            // Determine slot index for incoming badge
            const slotIdx = floatingIds.indexOf(incoming)
            const incomingAngle = (state.sharedPhase + slotIdx * ((2 * Math.PI) / 3)) % (2 * Math.PI)

            // Choose dock point: angle 0 (right) or PI (left)
            // Distance forward along rotation to angle 0 vs angle PI
            const distTo0 = (2 * Math.PI - incomingAngle) % (2 * Math.PI)
            const distToPI = (3 * Math.PI - incomingAngle) % (2 * Math.PI)

            const targetDockAngle = distTo0 <= distToPI ? 0 : Math.PI
            const dockSide = targetDockAngle === 0 ? 'right' : 'left'
            const angleNeeded = targetDockAngle === 0 ? distTo0 : distToPI

            // Smooth braking profile: v(t) = v0*(1 - t/T)^2
            // Total distance during brake = v0 * T / 3
            // So needed T = 3 * angleNeeded / v0
            const v0 = Math.max(state.currentSpeed, baseSpeedRad)
            const neededDurationSec = Math.max(1.8, Math.min(3.8, (3 * angleNeeded) / v0))

            state.dockSide = dockSide
            state.brakeStartAngle = incomingAngle
            state.brakeTargetAngle = targetDockAngle
            state.brakeDuration = neededDurationSec * 1000
            state.phase = 'BRAKE'
            state.phaseStartTime = now
            setDebugPhase('BRAKE')
          }
          break
        }

        case 'BRAKE': {
          const p = Math.min(1, timeInPhase / state.brakeDuration)
          // Cubic deceleration curve arriving smoothly at halt
          state.targetSpeed = baseSpeedRad * Math.pow(1 - p, 2)

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
          const startX = isRight ? geom.rx : -geom.rx
          const currentX = startX * (1 - easeP)

          if (physics[incoming]) {
            physics[incoming].x = currentX
            physics[incoming].y = 0 // Locked strictly to dock lane center
            physics[incoming].scale = 1.14 - 0.14 * easeP
            physics[incoming].opacity = 1.0
          }

          // Update comet tail
          if (cometTailRef.current) {
            const tailEl = cometTailRef.current
            tailEl.style.opacity = `${(1 - easeP * 0.4) * 0.55}`
            const tailLen = 130 * Math.sin(p * Math.PI)
            const tailX = currentX + (isRight ? 1 : -1) * (geom.iconRadius + 4)
            tailEl.style.transform = `translate3d(${tailX}px, 0, 0)`
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

            // Swap active center configuration cleanly behind impact
            const prevActive = state.currentActiveId
            state.returningId = prevActive
            state.returningOpacity = 0
            state.currentActiveId = incoming
            setActiveStageId(incoming)

            // Trigger single gentle ripple and damping boost
            if (rippleRef.current) {
              rippleRef.current.triggerSlam(geom.slotCenterX, geom.slotCenterY, {
                intensity: 70,
                speed: 220,
                width: 36,
                maxRadius: 220,
                blastRadius: 60,
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

      // POSITIONS & PHYSICAL ELASTIC SEPARATION PASS
      const isHalted = state.phase !== 'HOLD' && state.phase !== 'WAKE'
      const driftScale = isHalted ? 0.25 : 1.0 // Calm drift during reading

      // 1. Calculate ideal slot targets for all 3 floating badges
      const targetPositions = {}
      floatingIds.forEach((id, idx) => {
        const slotAngle = (state.sharedPhase + idx * ((2 * Math.PI) / 3)) % (2 * Math.PI)
        const sq = getSquirclePoint(slotAngle, geom.rx, geom.ry)

        // Organic drift
        const dCfg = DRIFT_CONFIG[id]
        const rDrift = 7 * Math.sin(tSec / dCfg.T1 + dCfg.phi1) * driftScale
        const tDrift = 5 * Math.sin(tSec / dCfg.T2 + dCfg.phi2) * driftScale

        const radDirX = sq.x / (Math.sqrt(sq.x * sq.x + sq.y * sq.y) || 1)
        const radDirY = sq.y / (Math.sqrt(sq.x * sq.x + sq.y * sq.y) || 1)
        const tanDirX = -radDirY
        const tanDirY = radDirX

        const idealX = sq.x + radDirX * rDrift + tanDirX * tDrift
        const idealY = sq.y + radDirY * rDrift + tanDirY * tDrift

        targetPositions[id] = { x: idealX, y: idealY }
      })

      // 2. Damped spring physics towards ideal targets
      const springK = 40
      const dampingC = 7
      floatingIds.forEach((id) => {
        // Skip if this badge is currently actively flying as comet
        if (state.phase === 'COMET' && id === state.incomingId) return

        const p = physics[id]
        const target = targetPositions[id]

        const dispX = target.x - p.x
        const dispY = target.y - p.y

        const fx = springK * dispX - dampingC * p.vx
        const fy = springK * dispY - dampingC * p.vy

        p.vx += fx * dt
        p.vy += fy * dt

        p.x += p.vx * dt
        p.y += p.vy * dt

        // Cap displacement from ideal target at 24px
        const offX = p.x - target.x
        const offY = p.y - target.y
        const offDist = Math.sqrt(offX * offX + offY * offY)
        if (offDist > 24) {
          p.x = target.x + (offX / offDist) * 24
          p.y = target.y + (offY / offDist) * 24
        }
      })

      // 3. Pairwise soft repulsive elastic spacing
      const minDistance = geom.iconRadius * 4 // 2 * diameter
      for (let iter = 0; iter < 2; iter++) {
        for (let i = 0; i < floatingIds.length; i++) {
          for (let j = i + 1; j < floatingIds.length; j++) {
            const idA = floatingIds[i]
            const idB = floatingIds[j]
            if (state.phase === 'COMET' && (idA === state.incomingId || idB === state.incomingId)) continue

            const pA = physics[idA]
            const pB = physics[idB]

            const dx = pB.x - pA.x
            const dy = pB.y - pA.y
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < minDistance && dist > 0.001) {
              const overlap = minDistance - dist
              const pushX = (dx / dist) * (overlap * 0.5)
              const pushY = (dy / dist) * (overlap * 0.5)

              pA.x -= pushX * 0.4
              pA.y -= pushY * 0.4
              pB.x += pushX * 0.4
              pB.y += pushY * 0.4

              if (isDebug.current && iter === 0) {
                console.warn(`[Orbit Debug] Soft repulsion between ${idA} and ${idB}: dist=${dist.toFixed(1)}px < min=${minDistance}px`)
              }
            }
          }
        }
      }

      // 4. Content Exclusion Zone Push-Out
      const ex = geom.exclusionRect
      const heroCX = geom.heroCenterX
      const heroCY = geom.heroCenterY
      const iconR = geom.iconRadius

      floatingIds.forEach((id) => {
        if (state.phase === 'COMET' && id === state.incomingId) return

        const p = physics[id]
        const screenX = heroCX + p.x
        const screenY = heroCY + p.y

        // Check circle collision with exclusion rectangle
        const nearX = Math.max(ex.left, Math.min(screenX, ex.right))
        const nearY = Math.max(ex.top, Math.min(screenY, ex.bottom))
        const distX = screenX - nearX
        const distY = screenY - nearY
        const distSq = distX * distX + distY * distY

        if (distSq < iconR * iconR) {
          const dist = Math.sqrt(distSq) || 0.001
          const pushOut = iconR - dist
          const nx = distX / dist
          const ny = distY / dist

          p.x += nx * pushOut * 0.5
          p.y += ny * pushOut * 0.5

          if (isDebug.current) {
            console.warn(`[Orbit Debug] Exclusion zone collision for ${id}: pushed out by ${pushOut.toFixed(1)}px`)
          }
        }
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
          // Active icon sits inside the center slot
          el.style.opacity = '0'
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
                  marginLeft: '-24px',
                  marginTop: '-24px',
                }}
                className="absolute w-12 h-12 rounded-full bg-slate-900/80 backdrop-blur-xl shadow-2xl border border-white/20 flex items-center justify-center pointer-events-auto cursor-pointer will-change-transform active:scale-[0.92]"
              >
                <Icon size={22} color={cfg.color} />
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

        <div ref={centerSlotRef} className="h-16 w-16 my-3 flex items-center justify-center relative">
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
              style={{ opacity: exitingOpacity }}
              className="absolute w-14 h-14 rounded-full bg-slate-900/90 backdrop-blur-md shadow-2xl border border-white/20 flex items-center justify-center pointer-events-none"
            >
              {React.createElement(exitingConfig.icon, { size: 26, color: exitingConfig.color })}
            </div>
          )}

          {/* Active Center Icon */}
          {activeConfig ? (
            <div className="w-14 h-14 rounded-full bg-slate-900/90 backdrop-blur-md shadow-2xl border border-white/20 flex items-center justify-center">
              {React.createElement(activeConfig.icon, { size: 26, color: activeConfig.color })}
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
                textPhase === 'exiting'
                  ? 'animate-text-fade-out'
                  : textPhase === 'entering'
                  ? 'animate-text-fade-in'
                  : ''
              }`}
            >
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                {activeConfig.label}
              </span>
              <p className="text-[clamp(14px,2.2vmin,18px)] font-medium text-slate-300 mt-0.5">
                <span className="font-bold text-white tabular-nums inline-block min-w-[2.5ch] text-right">
                  {displayCount}%
                </span>{' '}
                of companies hire through {activeConfig.label.toLowerCase()}
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
            ctaPulse ? 'animate-cta-pulse ring-sky-400/60' : ''
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
