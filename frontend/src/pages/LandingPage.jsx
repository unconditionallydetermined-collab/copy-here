import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Lightbulb, Code2, Check } from 'lucide-react'
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

const ONE_LINERS = [
  "Finding boring jobs?",
  "Finding no jobs?",
  "Sending resumes into the void?",
  "Tired of ghost job posts?",
  "Getting ghosted after interviews?",
  "Applying everywhere, hearing nothing?",
  "Skills are strong, offers are missing?",
  "Stuck in a job you outgrew?",
  "Still waiting on that reply?",
  "Job hunting feels endless?",
]

function pickRandomOneLiner() {
  let lastIdx = -1
  try {
    const saved = sessionStorage.getItem('career_sync_last_headline_idx')
    if (saved !== null) lastIdx = parseInt(saved, 10)
  } catch {}

  let pick = Math.floor(Math.random() * ONE_LINERS.length)
  if (pick === lastIdx) {
    pick = (pick + 1 + Math.floor(Math.random() * (ONE_LINERS.length - 1))) % ONE_LINERS.length
  }

  try {
    sessionStorage.setItem('career_sync_last_headline_idx', String(pick))
  } catch {}

  return ONE_LINERS[pick]
}

const DRIFT_CONFIG = {
  github: {
    rT1: 7.8,  rPhi1: 0.2, rA1: 5.0,
    rT2: 10.4, rPhi2: 1.1, rA2: 3.0,
    tT1: 9.2,  tPhi1: 2.1, tA1: 3.8,
    tT2: 13.5, tPhi2: 0.7, tA2: 2.2,
    glowT: 4.8, glowPhi: 0.5,
    scaleT: 5.4, scalePhi: 1.2,
  },
  leetcode: {
    rT1: 8.6,  rPhi1: 2.3, rA1: 4.8,
    rT2: 11.1, rPhi2: 0.5, rA2: 3.2,
    tT1: 10.1, tPhi1: 1.4, tA1: 3.5,
    tT2: 12.8, tPhi2: 2.9, tA2: 2.5,
    glowT: 5.2, glowPhi: 1.8,
    scaleT: 4.6, scalePhi: 0.3,
  },
  linkedin: {
    rT1: 7.2,  rPhi1: 4.1, rA1: 5.2,
    rT2: 9.8,  rPhi2: 2.8, rA2: 2.8,
    tT1: 9.6,  tPhi1: 3.7, tA1: 3.6,
    tT2: 14.1, tPhi2: 1.5, tA2: 2.4,
    glowT: 4.5, glowPhi: 3.1,
    scaleT: 5.8, scalePhi: 2.4,
  },
  skills: {
    rT1: 9.5,  rPhi1: 1.7, rA1: 4.6,
    rT2: 10.9, rPhi2: 3.9, rA2: 3.4,
    tT1: 10.8, tPhi1: 0.8, tA1: 3.7,
    tT2: 13.0, tPhi2: 3.2, tA2: 2.3,
    glowT: 5.6, glowPhi: 4.2,
    scaleT: 5.0, scalePhi: 3.7,
  },
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
  const [headline] = useState(() => pickRandomOneLiner())
  const [headlineLoaded, setHeadlineLoaded] = useState(false)
  const [activeStageId, setActiveStageId] = useState('github')
  const [exitingStageId, setExitingStageId] = useState(null)
  const [exitingOpacity, setExitingOpacity] = useState(1.0)
  const [textPhase, setTextPhase] = useState('idle') // 'idle' | 'exiting' | 'entering' | 'hidden'
  const [displayCount, setDisplayCount] = useState(PLATFORM_CONFIG.github.targetPercent)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [ctaShimmerActive, setCtaShimmerActive] = useState(false)
  const [ctaShimmerCycle, setCtaShimmerCycle] = useState(0)
  const [pulseRingActive, setPulseRingActive] = useState(false)
  const [centerCoords, setCenterCoords] = useState({ x: 0, y: 0 })

  const heroWrapperRef = useRef(null)
  const centerSlotRef = useRef(null)
  const buttonRef = useRef(null)
  const signInRef = useRef(null)
  const ticksRef = useRef(null)
  const rippleRef = useRef(null)
  const badgeDomRefs = useRef({})
  const cometTailRef = useRef(null)

  // Layout & geometry cached state
  const geomRef = useRef({
    slotCenterX: 0,
    slotCenterY: 0,
    exclusionRect: { left: 0, top: 0, right: 0, bottom: 0 },
    radius: 260,
    iconRadius: 27,
    pad: 28,
    isParked: false,
    width: 0,
    height: 0,
  })

  // State machine & animation refs
  const stateRef = useRef({
    phase: 'HOLD', // HOLD | BRAKE | CHARGE | COMET | IMPACT | SETTLE | READ | PULSE | WAKE
    phaseStartTime: performance.now(),
    currentActiveId: 'github',
    // 3 fixed equilateral triangle slots (0, 120, 240 deg)
    slotAssignments: {
      github: null,
      leetcode: 0,
      linkedin: 1,
      skills: 2,
    },
    incomingSlotIndex: 0,
    incomingId: null,
    returningId: null,
    returningOpacity: 0,
    dockSide: 'right', // 'right' (angle 0) or 'left' (angle PI)
    brakeStartAngle: 0,
    brakeDelta: 0,
    brakeDuration: 1400,
    sharedPhase: 0,
    currentSpeed: (26 * Math.PI) / 180,
    targetSpeed: (26 * Math.PI) / 180,
    lastTime: performance.now(),
    readTargetCount: PLATFORM_CONFIG.github.targetPercent,
    readCountStart: 0,
    readCountDone: true,
    cometStartX: 0,
    cometStartY: 0,
    physics: {
      github:   { x: 0, y: 0, scale: 1, opacity: 0 },
      leetcode: { x: 0, y: 0, scale: 1, opacity: 0.85 },
      linkedin: { x: 0, y: 0, scale: 1, opacity: 0.85 },
      skills:   { x: 0, y: 0, scale: 1, opacity: 0.85 },
    },
  })

  // Smooth fade-in of randomized headline
  useEffect(() => {
    const t = setTimeout(() => setHeadlineLoaded(true), 50)
    return () => clearTimeout(t)
  }, [])

  // Detect reduced-motion preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Geometry measurement & exclusion zone calculation (Centered on Center Icon)
  const updateGeometry = () => {
    const vw = window.innerWidth
    const vh = window.innerHeight

    let pad = vw < 640 ? 20 : 28
    let iconRadius = vw < 360 ? 16 : vw < 480 ? 20 : 27

    const slotEl = centerSlotRef.current
    let slotCenterX = vw / 2
    let slotCenterY = vh / 2 - 20
    if (slotEl) {
      const sr = slotEl.getBoundingClientRect()
      slotCenterX = sr.left + sr.width / 2
      slotCenterY = sr.top + sr.height / 2
    }

    setCenterCoords({ x: slotCenterX, y: slotCenterY })

    // Measure the main content block (heading, slot, caption, CTA, sign in)
    const elements = [
      heroWrapperRef.current,
      centerSlotRef.current,
      buttonRef.current,
      signInRef.current,
    ].filter(Boolean)

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const el of elements) {
      const r = el.getBoundingClientRect()
      minX = Math.min(minX, r.left)
      minY = Math.min(minY, r.top)
      maxX = Math.max(maxX, r.right)
      maxY = Math.max(maxY, r.bottom)
    }

    let exclusionRect = {
      left: minX - pad,
      top: minY - pad,
      right: maxX + pad,
      bottom: maxY + pad,
    }

    const corners = [
      [exclusionRect.left, exclusionRect.top],
      [exclusionRect.right, exclusionRect.top],
      [exclusionRect.left, exclusionRect.bottom],
      [exclusionRect.right, exclusionRect.bottom],
    ]
    let maxCornerDist = 0
    for (const [cx, cy] of corners) {
      maxCornerDist = Math.max(maxCornerDist, Math.hypot(cx - slotCenterX, cy - slotCenterY))
    }

    let requiredR = maxCornerDist + iconRadius + pad
    const preferredR = Math.max(220, Math.min(vw * 0.45, vh * 0.42, 320))
    const R = Math.max(preferredR, requiredR)

    geomRef.current = {
      slotCenterX,
      slotCenterY,
      exclusionRect,
      radius: R,
      iconRadius,
      pad,
      isParked: false,
      width: vw,
      height: vh,
    }

    if (rippleRef.current?.setProtectedRect) {
      rippleRef.current.setProtectedRect(exclusionRect)
    }
  }

  useLayoutEffect(() => {
    updateGeometry()
    const ro = new ResizeObserver(() => updateGeometry())
    if (heroWrapperRef.current) ro.observe(heroWrapperRef.current)
    window.addEventListener('resize', updateGeometry)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', updateGeometry)
    }
  }, [headline])

  // Main 60fps unified animation loop with 6fd3b85 true circular kinematics around center icon
  useEffect(() => {
    if (reducedMotion) return

    let animId = null
    const baseSpeedRad = (26 * Math.PI) / 180 // ~26 deg/s (~13.85s/lap)
    const maxAccel = (35 * Math.PI) / 180 // ~35 deg/s^2
    const MIN_HOLD_TIME = 3800

    const loop = (now) => {
      const state = stateRef.current
      const geom = geomRef.current
      const physics = state.physics

      const rawDt = (now - state.lastTime) / 1000
      state.lastTime = now
      const dt = Math.min(rawDt, 0.05)

      if (document.visibilityState !== 'visible') {
        animId = requestAnimationFrame(loop)
        return
      }

      const tSec = now / 1000
      const timeInPhase = now - state.phaseStartTime
      const breathing = 1.0 + 0.12 * Math.sin((tSec * 2 * Math.PI) / 18)

      // Velocity-continuous kinematic speed ramping
      const targetSpeed = state.targetSpeed * breathing
      const speedDiff = targetSpeed - state.currentSpeed
      const maxDeltaV = maxAccel * dt
      if (Math.abs(speedDiff) <= maxDeltaV) {
        state.currentSpeed = targetSpeed
      } else {
        state.currentSpeed += Math.sign(speedDiff) * maxDeltaV
      }

      // STATE MACHINE ADVANCE
      switch (state.phase) {
        case 'HOLD': {
          state.sharedPhase = (state.sharedPhase + state.currentSpeed * dt) % (2 * Math.PI)
          state.targetSpeed = baseSpeedRad

          // Guard: if there is no orb in the center or on the page, don't replace; wait for it to appear again
          const centerEl = centerSlotRef.current
          const currentActive = state.currentActiveId
          const activeCfg = currentActive ? PLATFORM_CONFIG[currentActive] : null

          if (!currentActive || !activeCfg || !centerEl) {
            break
          }

          const missingFloatingOrb = BADGES.some(
            (id) => id !== currentActive && !badgeDomRefs.current[id]
          )
          if (missingFloatingOrb) {
            break
          }

          if (timeInPhase >= MIN_HOLD_TIME) {
            // Find which badge is assigned to the current incoming slot
            const incomingSlot = state.incomingSlotIndex
            const candidate = BADGES.find(
              (id) => id !== state.currentActiveId && state.slotAssignments[id] === incomingSlot
            ) || BADGES.find((id) => id !== state.currentActiveId)

            const actualSlot = state.slotAssignments[candidate] ?? incomingSlot

            // Calculate current slot angle
            const slotAngle = (state.sharedPhase + actualSlot * ((2 * Math.PI) / 3)) % (2 * Math.PI)
            const normSlotAngle = (slotAngle + 2 * Math.PI) % (2 * Math.PI)

            // Target dock angle at center icon height (y = 0):
            // Left dock = Math.PI (x = -R, y = 0), Right dock = 2*Math.PI (x = +R, y = 0)
            const targetDock = normSlotAngle < Math.PI ? Math.PI : 2 * Math.PI
            const distToDock = targetDock - normSlotAngle

            const brakeSec = 1.4
            const brakeDelta = (baseSpeedRad * brakeSec) / 2

            // Exact kinematic braking triggered at the precise angle
            if (distToDock <= brakeDelta + baseSpeedRad * dt * 2.5) {
              state.incomingId = candidate
              state.brakeStartAngle = state.sharedPhase
              state.brakeDelta = distToDock
              state.brakeDuration = Math.max(600, (2 * distToDock / Math.max(state.currentSpeed, 0.1)) * 1000)
              state.dockSide = targetDock === Math.PI ? 'left' : 'right'
              state.phase = 'BRAKE'
              state.phaseStartTime = now
            }
          }
          break
        }

        case 'BRAKE': {
          const p = Math.min(1, timeInPhase / state.brakeDuration)
          const progress = 1 - (1 - p) * (1 - p)
          state.sharedPhase = (state.brakeStartAngle + state.brakeDelta * progress) % (2 * Math.PI)
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
          // Center icon fades in-place with opacity only: 150-700ms (1 -> 0.1)
          if (timeInPhase >= 150) {
            const fadeElapsed = timeInPhase - 150
            const fadeP = Math.min(1, fadeElapsed / 550)
            setExitingOpacity(Math.max(0.1, 1 - 0.9 * fadeP))
          }

          if (timeInPhase >= 900) {
            const dockX = state.dockSide === 'left' ? -geom.radius : geom.radius
            state.cometStartX = dockX
            state.cometStartY = 0
            state.phase = 'COMET'
            state.phaseStartTime = now
            setTextPhase('hidden')
          }
          break
        }

        case 'COMET': {
          state.targetSpeed = 0
          state.currentSpeed = 0
          // Complete center icon fade to 0 over first 150ms of comet run
          if (timeInPhase <= 150) {
            setExitingOpacity(0.1 * (1 - timeInPhase / 150))
          } else {
            setExitingOpacity(0)
            setExitingStageId(null)
          }

          const cometDuration = 480
          const p = Math.min(1, timeInPhase / cometDuration)
          const easeP = Math.pow(p, 2.4)

          const incoming = state.incomingId
          // Strictly horizontal flight directly to center icon (0, 0)
          const currentX = state.cometStartX * (1 - easeP)
          const currentY = 0

          if (physics[incoming]) {
            physics[incoming].x = currentX
            physics[incoming].y = currentY
            physics[incoming].scale = 1.14 - 0.14 * easeP
            physics[incoming].opacity = 1.0
          }

          // Update comet tail pointing directly against direction of motion
          if (cometTailRef.current) {
            const tailEl = cometTailRef.current
            tailEl.style.opacity = `${(1 - easeP * 0.4) * 0.55}`
            const tailLen = 130 * Math.sin(p * Math.PI)
            const moveAngle = Math.atan2(0, -state.cometStartX)
            const tailX = currentX + Math.cos(moveAngle + Math.PI) * (geom.iconRadius + 4)
            const tailY = currentY + Math.sin(moveAngle + Math.PI) * (geom.iconRadius + 4)
            tailEl.style.transform = `translate3d(${tailX.toFixed(2)}px, ${tailY.toFixed(2)}px, 0) rotate(${moveAngle + Math.PI}rad)`
            tailEl.style.width = `${Math.max(0, tailLen)}px`
          }

          // Gentle dot nudge along flight corridor
          if (rippleRef.current && p > 0.1 && p < 0.9) {
            rippleRef.current.displaceAt(geom.slotCenterX + currentX, geom.slotCenterY, 8)
          }

          if (p >= 1) {
            if (cometTailRef.current) cometTailRef.current.style.opacity = '0'

            const centerEl = centerSlotRef.current
            const prevActive = state.currentActiveId
            const incomingEl = incoming ? badgeDomRefs.current[incoming] : null

            // Guard: if there is no orb in the center or on the page, don't replace; wait for orb to appear
            if (!prevActive || !incoming || !centerEl || !incomingEl) {
              state.phase = 'HOLD'
              state.phaseStartTime = now
              break
            }

            state.phase = 'IMPACT'
            state.phaseStartTime = now

            // IMPACT AND REPLACEMENT
            const incomingSlot = state.slotAssignments[incoming] ?? state.incomingSlotIndex

            // Swap active center platform and assign vacated slot to outgoing platform
            state.slotAssignments[prevActive] = incomingSlot
            state.slotAssignments[incoming] = null
            state.currentActiveId = incoming
            setActiveStageId(incoming)

            state.returningId = prevActive
            state.returningOpacity = 0

            // Splash dots with high fluid intensity ripple wave
            if (rippleRef.current) {
              rippleRef.current.triggerSlam(geom.slotCenterX, geom.slotCenterY, {
                intensity: 145,
                speed: 310,
                width: 65,
                maxRadius: 420,
                blastRadius: 140,
              })
              rippleRef.current.boostDamping(1200)
            }

            setPulseRingActive(true)
            setTimeout(() => setPulseRingActive(false), 800)
          }
          break
        }

        case 'IMPACT': {
          if (timeInPhase >= 80) {
            state.phase = 'SETTLE'
            state.phaseStartTime = now
          }
          break
        }

        case 'SETTLE': {
          state.currentSpeed = 0
          // Re-materialize previous active badge in its vacated slot (0 -> 0.5 over 500ms)
          if (timeInPhase >= 300) {
            const retP = Math.min(1, (timeInPhase - 300) / 500)
            state.returningOpacity = 0.5 * retP
          }

          const minMet = timeInPhase >= 700
          const maxMet = timeInPhase >= 2200
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
          state.currentSpeed = 0
          // Smooth count-up interpolation over 1200ms with easeOutCubic
          if (!state.readCountDone) {
            const countElapsed = now - state.readCountStart
            const countP = Math.min(1, countElapsed / 1200)
            const easeCount = 1 - Math.pow(1 - countP, 3)
            setDisplayCount(Math.round(state.readTargetCount * easeCount))

            if (countP >= 1) {
              state.readCountDone = true
              setDisplayCount(state.readTargetCount)
            }
          }

          // Hold READ for 1200ms after count finishes + 2500ms quiet pause
          if (state.readCountDone && timeInPhase >= 1200 + 2500) {
            state.phase = 'PULSE'
            state.phaseStartTime = now
            setCtaShimmerCycle((c) => c + 1)
            setCtaShimmerActive(true)
          }
          break
        }

        case 'PULSE': {
          state.currentSpeed = 0
          const pulseElapsed = now - state.phaseStartTime
          const shimmerDuration = reducedMotion ? 1200 : 3550
          const totalPulseDuration = shimmerDuration + 600

          if (pulseElapsed >= shimmerDuration && ctaShimmerActive) {
            setCtaShimmerActive(false)
          }

          if (pulseElapsed >= totalPulseDuration) {
            setCtaShimmerActive(false)
            // Cycle incoming slot strictly in triangle vertex order: 0 -> 1 -> 2 -> 0 -> ...
            state.incomingSlotIndex = (state.incomingSlotIndex + 1) % 3
            state.phase = 'WAKE'
            state.phaseStartTime = now
          }
          break
        }

        case 'WAKE': {
          const wakeP = Math.min(1, timeInPhase / 2500)
          const easeWake = 0.5 - 0.5 * Math.cos(wakeP * Math.PI)
          state.currentSpeed = baseSpeedRad * easeWake
          state.sharedPhase = (state.sharedPhase + state.currentSpeed * dt) % (2 * Math.PI)

          if (wakeP >= 1) {
            state.phase = 'HOLD'
            state.phaseStartTime = now
            setTextPhase('idle')
          }
          break
        }

        default:
          break
      }

      // --- POSITIONS PASS (ROTATION CENTERED DIRECTLY ON CENTER ICON) ---
      const isHalted = state.phase !== 'HOLD' && state.phase !== 'WAKE'
      const driftScale = isHalted ? 0.25 : 1.0

      BADGES.forEach((id) => {
        if (id === state.currentActiveId) return
        if (state.phase === 'COMET' && id === state.incomingId) return

        const p = physics[id]
        const slotIdx = state.slotAssignments[id] ?? 0
        const slotAngle = (state.sharedPhase + slotIdx * ((2 * Math.PI) / 3)) % (2 * Math.PI)

        // Circle coordinates around center icon (0, 0)
        const sqX = Math.cos(slotAngle) * geom.radius
        const sqY = Math.sin(slotAngle) * geom.radius

        // Organic sum-of-sines drift (radial up to 8px, tangential up to 6px)
        const d = DRIFT_CONFIG[id] || DRIFT_CONFIG.github
        const rDrift = (d.rA1 * Math.sin(tSec / d.rT1 + d.rPhi1) + d.rA2 * Math.sin(tSec / d.rT2 + d.rPhi2)) * driftScale
        const tDrift = (d.tA1 * Math.sin(tSec / d.tT1 + d.tPhi1) + d.tA2 * Math.sin(tSec / d.tT2 + d.tPhi2)) * driftScale

        const invLen = 1 / (Math.hypot(sqX, sqY) || 1)
        const radDirX = sqX * invLen
        const radDirY = sqY * invLen
        const tanDirX = -radDirY
        const tanDirY = radDirX

        p.x = sqX + radDirX * rDrift + tanDirX * tDrift
        p.y = sqY + radDirY * rDrift + tanDirY * tDrift

        // Scale breathing (±1.5%)
        p.scale = 1.0 + 0.015 * Math.sin(tSec / d.scaleT + d.scalePhi)
      })

      // --- OPACITY, DOM UPDATES & GLOW BREATHING ---
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
          el.style.opacity = '0'
          p.opacity = 0
          el.style.pointerEvents = 'none'
          return
        }

        el.style.pointerEvents = 'auto'

        let op = targetFloatingOpacity
        let sc = p.scale

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

        // Bottom edge gradient: orbs smoothly fade out approaching bottom edge
        const screenY = geom.slotCenterY + p.y
        const distFromBottom = geom.height - screenY
        const BOTTOM_FADE_MARGIN = Math.max(220, Math.min(320, geom.height * 0.3))
        const bottomFactor = Math.min(1, Math.max(0, distFromBottom / BOTTOM_FADE_MARGIN))
        const bottomGradient = 0.5 - 0.5 * Math.cos(bottomFactor * Math.PI)
        const effectiveOpacity = p.opacity * bottomGradient

        // Glow breathing (0.8 to 1.0 intensity)
        const d = DRIFT_CONFIG[id] || DRIFT_CONFIG.github
        const glowFactor = 0.9 + 0.1 * Math.sin(tSec / d.glowT + d.glowPhi)
        const cfg = PLATFORM_CONFIG[id]
        el.style.boxShadow = `0 0 ${18 * glowFactor}px ${cfg.color}88, 0 0 ${39 * glowFactor}px ${cfg.color}44, 0 10px 22px rgba(0,0,0,0.55)`

        el.style.transform = `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0) scale(${sc.toFixed(3)})`
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
        rippleRef.current.setHoverLights(hoverLights, isDimmed ? 0.4 : 1.0)
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
      className="relative w-screen h-[100svh] min-h-[100svh] overflow-hidden bg-[#0a0a0a] text-white flex flex-col items-center justify-center select-none font-sans"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        overscrollBehavior: 'none',
      }}
    >
      {/* Background Reacting Dot Grid Canvas with Splash Ripple */}
      <WaterRippleCanvas ref={rippleRef} className="z-0 pointer-events-auto" />

      {/* Orbit Track Layer (Centered exactly at the Center Icon coords) */}
      <div
        className="absolute z-10 pointer-events-none"
        style={{
          left: `${centerCoords.x || 0}px`,
          top: `${centerCoords.y || 0}px`,
        }}
      >
        {/* Comet Tail */}
        <div
          ref={cometTailRef}
          aria-hidden="true"
          className="absolute h-1.5 rounded-full pointer-events-none opacity-0 transition-opacity duration-200"
          style={{
            left: 0,
            top: 0,
            marginTop: '-1.5px',
            height: '3px',
            background: 'linear-gradient(90deg, rgba(56,189,248,0.85) 0%, rgba(56,189,248,0.2) 60%, transparent 100%)',
            boxShadow: '0 0 12px rgba(56,189,248,0.5)',
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
                  left: 0,
                  top: 0,
                  marginLeft: '-27px',
                  marginTop: '-27px',
                }}
                className="absolute w-[54px] h-[54px] rounded-full bg-slate-900/85 backdrop-blur-xl shadow-2xl border border-white/25 flex items-center justify-center pointer-events-auto cursor-pointer will-change-transform active:scale-[0.92]"
              >
                <Icon size={26} color={cfg.color} />
              </button>
            )
          })}
      </div>

      {/* Center Stage & Content Column */}
      <div
        ref={heroWrapperRef}
        className="relative z-20 flex flex-col items-center text-center max-w-sm px-4 pointer-events-auto"
      >
        {/* 1. Randomized One-liner Heading */}
        <div className="w-full max-w-[680px] min-h-[4.5rem] sm:min-h-[5.5rem] flex items-center justify-center text-center">
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight text-balance transition-opacity duration-600 ease-out select-none"
            style={{ opacity: headlineLoaded ? 1 : 0 }}
          >
            {headline}
          </h1>
        </div>

        {/* 2. Center orb slot with stat caption under it */}
        <div ref={centerSlotRef} className="h-20 w-20 my-3 flex items-center justify-center relative">
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
              className="w-[66px] h-[66px] rounded-full bg-slate-900/90 backdrop-blur-md shadow-2xl border border-white/25 flex items-center justify-center pointer-events-auto"
            >
              {React.createElement(activeConfig.icon, { size: 30, color: activeConfig.color })}
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-slate-700" />
          )}
        </div>

        {/* Stat caption under center orb slot */}
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

        {/* 3. White button "Get a job you'll love" with CTA text shimmer */}
        <Link
          ref={buttonRef}
          to="/auth"
          className="relative overflow-hidden mt-5 inline-flex items-center justify-center min-w-[170px] min-h-[48px] px-8 py-3 rounded-xl bg-white text-slate-950 font-semibold text-base shadow-[0_0_0_1px_rgba(255,255,255,0.35)] active:scale-[0.97] transition-colors duration-200 ease-out touch-manipulation select-none [@media(hover:hover)_and_(pointer:fine)]:hover:bg-slate-100"
        >
          <span className="grid grid-cols-1 grid-rows-1 items-center justify-center text-center [&>*]:col-start-1 [&>*]:row-start-1">
            <span
              className={`font-semibold text-base tracking-normal select-none ${
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
                className={`font-semibold text-base tracking-normal pointer-events-none select-none cta-text-shimmer ${
                  ctaShimmerActive ? 'cta-text-shimmer-active' : ''
                }`}
              >
                Get a job you'll love
              </span>
            )}
          </span>
        </Link>

        {/* 4. Secondary Sign in link below button */}
        <div ref={signInRef} className="mt-3.5 flex items-center justify-center gap-1.5 text-sm text-slate-400">
          <span>Already have an account?</span>
          <Link
            to="/auth?mode=signin"
            className="font-medium text-slate-200 hover:text-white underline underline-offset-4 decoration-slate-600 hover:decoration-slate-300 transition-colors duration-150"
          >
            Sign in
          </Link>
        </div>
      </div>

      {/* 5. Three Trust Ticks Stacked VERTICALLY moved further down near bottom */}
      <div
        ref={ticksRef}
        className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-start gap-2 text-xs text-white/50 pointer-events-auto z-20"
      >
        <div className="inline-flex items-center gap-2">
          <Check size={14} className="text-emerald-400 flex-shrink-0" />
          <span>No credit card required</span>
        </div>
        <div className="inline-flex items-center gap-2">
          <Check size={14} className="text-emerald-400 flex-shrink-0" />
          <span>Syncs in 30 seconds</span>
        </div>
        <div className="inline-flex items-center gap-2">
          <Check size={14} className="text-emerald-400 flex-shrink-0" />
          <span>Cancel or delete anytime</span>
        </div>
      </div>
    </main>
  )
}
