import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Lightbulb, Code2, Check } from 'lucide-react'
import { Github, Linkedin } from './Icons'
import WaterRippleCanvas from './WaterRippleCanvas'

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

export default function OrbitStage() {
  const [activeStageId, setActiveStageId] = useState('github')
  const [exitingStageId, setExitingStageId] = useState(null)
  const [exitingOpacity, setExitingOpacity] = useState(1.0)
  const [textPhase, setTextPhase] = useState('idle') // 'idle' | 'exiting' | 'entering' | 'hidden'
  const [displayCount, setDisplayCount] = useState(PLATFORM_CONFIG.github.targetPercent)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [ctaShimmerActive, setCtaShimmerActive] = useState(false)
  const [ctaShimmerCycle, setCtaShimmerCycle] = useState(0)
  const [pulseRingActive, setPulseRingActive] = useState(false)
  const [stackTicks, setStackTicks] = useState(false)

  const containerRef = useRef(null)
  const centerSlotRef = useRef(null)
  const headingRef = useRef(null)
  const captionRef = useRef(null)
  const buttonRef = useRef(null)
  const signInRef = useRef(null)
  const ticksRef = useRef(null)
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
    rx: 280,
    ry: 280,
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
    floatingSlots: ['leetcode', 'linkedin', 'skills'],
    incomingSlotIndex: 0, // 0 -> 1 -> 2 -> 0 ...
    incomingId: null,
    incomingSlot: null,
    returningId: null,
    returningSlot: null,
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
    cycleCount: 0,
    physics: {
      github:   { x: 0, y: 0, scale: 1, opacity: 0 },
      leetcode: { x: 0, y: 0, scale: 1, opacity: 0.85 },
      linkedin: { x: 0, y: 0, scale: 1, opacity: 0.85 },
      skills:   { x: 0, y: 0, scale: 1, opacity: 0.85 },
    },
  })

  // Detect reduced-motion preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Geometry measurement & exclusion zone calculation
  const updateGeometry = () => {
    const vw = window.innerWidth
    const vh = window.innerHeight

    let pad = vw < 640 ? 20 : 28
    let iconRadius = vw < 360 ? 16 : vw < 480 ? 20 : 27

    const slotEl = centerSlotRef.current
    let slotCenterX = vw / 2
    let slotCenterY = vh / 2
    if (slotEl) {
      const sr = slotEl.getBoundingClientRect()
      slotCenterX = sr.left + sr.width / 2
      slotCenterY = sr.top + sr.height / 2
    }

    const elements = [
      headingRef.current,
      centerSlotRef.current,
      captionRef.current,
      buttonRef.current,
      signInRef.current,
      ticksRef.current,
    ].filter(Boolean)

    const calcUnion = (p) => {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (const el of elements) {
        const r = el.getBoundingClientRect()
        minX = Math.min(minX, r.left)
        minY = Math.min(minY, r.top)
        maxX = Math.max(maxX, r.right)
        maxY = Math.max(maxY, r.bottom)
      }
      return {
        left: minX - p,
        top: minY - p,
        right: maxX + p,
        bottom: maxY + p,
      }
    }

    let exclusionRect = calcUnion(pad)

    // Margin from viewport safe boundary
    const margin = 14
    const rxCap = Math.max(80, Math.min(slotCenterX, vw - slotCenterX) - (iconRadius + margin))
    const ryCap = Math.max(80, Math.min(slotCenterY, vh - slotCenterY) - (iconRadius + margin))

    // Helper: test if an orbit (rx, ry) clears exclusionRect
    const testClearance = (rX, rY, rect, orbR) => {
      const corners = [
        [rect.left, rect.top],
        [rect.right, rect.top],
        [rect.left, rect.bottom],
        [rect.right, rect.bottom],
      ]
      let maxCornerDist = 0
      for (const [cx, cy] of corners) {
        maxCornerDist = Math.max(maxCornerDist, Math.hypot(cx - slotCenterX, cy - slotCenterY))
      }
      const circleR = maxCornerDist + orbR
      if (circleR <= rxCap && circleR <= ryCap) {
        return { rx: circleR, ry: circleR, type: 'circle' }
      }

      // Try ellipse with rx = rxCap
      let needRy = 0
      let possible = true
      for (const [cx, cy] of corners) {
        const dx = Math.abs(cx - slotCenterX)
        const dy = Math.abs(cy - slotCenterY) + orbR
        if (dx >= rxCap) continue
        const denom = 1 - (dx * dx) / (rxCap * rxCap)
        if (denom <= 0.0001) {
          possible = false
          break
        }
        needRy = Math.max(needRy, dy / Math.sqrt(denom))
      }
      if (possible && needRy <= ryCap) {
        return { rx: rxCap, ry: Math.max(needRy, 100), type: 'ellipse' }
      }
      return null
    }

    let fit = testClearance(rxCap, ryCap, exclusionRect, iconRadius)
    let isParked = false
    let shouldStackTicks = false

    if (!fit) {
      // Fallback 1: stack ticks, shrink orbs to 40px (32px under 360px), pad to 12px
      shouldStackTicks = true
      iconRadius = vw < 360 ? 16 : 20
      pad = 12
      exclusionRect = calcUnion(pad)
      fit = testClearance(rxCap, ryCap, exclusionRect, iconRadius)
      if (!fit) {
        isParked = true
      }
    }

    setStackTicks(shouldStackTicks)

    const finalGeom = {
      heroCenterX: vw / 2,
      heroCenterY: vh / 2,
      slotCenterX,
      slotCenterY,
      exclusionRect,
      rx: fit ? fit.rx : Math.min(rxCap, 240),
      ry: fit ? fit.ry : Math.min(ryCap, 240),
      iconRadius,
      pad,
      isParked,
      width: vw,
      height: vh,
    }

    geomRef.current = finalGeom

    if (rippleRef.current?.setProtectedRect) {
      rippleRef.current.setProtectedRect(exclusionRect)
    }
  }

  useLayoutEffect(() => {
    updateGeometry()
    const ro = new ResizeObserver(() => updateGeometry())
    if (containerRef.current) ro.observe(containerRef.current)
    window.addEventListener('resize', updateGeometry)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', updateGeometry)
    }
  }, [])

  // Main 60fps unified animation loop
  useEffect(() => {
    if (reducedMotion) return

    let animId = null
    const baseSpeedRad = (26 * Math.PI) / 180 // ~26 deg/s (~13.85s/lap)
    const MIN_HOLD_TIME = 4200

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

      // --- STATE MACHINE ---
      switch (state.phase) {
        case 'HOLD': {
          state.sharedPhase = (state.sharedPhase + baseSpeedRad * dt) % (2 * Math.PI)
          state.currentSpeed = baseSpeedRad

          if (timeInPhase >= MIN_HOLD_TIME && !geom.isParked) {
            // Incoming slot index strictly cycles: 0 -> 1 -> 2 -> 0 -> ...
            const incomingSlot = state.incomingSlotIndex
            const candidate = state.floatingSlots[incomingSlot]

            // Calculate current slot angle
            const slotAngle = (state.sharedPhase + incomingSlot * ((2 * Math.PI) / 3)) % (2 * Math.PI)
            const normSlotAngle = (slotAngle + 2 * Math.PI) % (2 * Math.PI)

            // Target dock angle at height of center slot:
            // Left dock = Math.PI (x = -rx, y = 0), Right dock = 2*Math.PI (x = +rx, y = 0)
            const targetDock = normSlotAngle < Math.PI ? Math.PI : 2 * Math.PI
            const distToDock = targetDock - normSlotAngle

            const brakeSec = 1.4
            const brakeDelta = (baseSpeedRad * brakeSec) / 2

            // Start BRAKE when approaching the dock point
            if (distToDock <= brakeDelta + baseSpeedRad * dt * 2) {
              state.incomingId = candidate
              state.incomingSlot = incomingSlot
              state.brakeStartAngle = state.sharedPhase
              state.brakeDelta = distToDock
              state.brakeDuration = Math.max(600, (2 * distToDock / baseSpeedRad) * 1000)
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
          state.currentSpeed = 0
          // Center icon fades in-place with opacity only: 150-700ms (1 -> 0.1)
          if (timeInPhase >= 150) {
            const fadeElapsed = timeInPhase - 150
            const fadeP = Math.min(1, fadeElapsed / 550)
            setExitingOpacity(Math.max(0.1, 1 - 0.9 * fadeP))
          }

          if (timeInPhase >= 900) {
            const dockX = state.dockSide === 'left' ? -geom.rx : geom.rx
            state.cometStartX = dockX
            state.cometStartY = 0
            state.phase = 'COMET'
            state.phaseStartTime = now
            setTextPhase('hidden')
          }
          break
        }

        case 'COMET': {
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
          const currentX = state.cometStartX * (1 - easeP)
          const currentY = 0 // Exactly horizontal along center slot height

          if (physics[incoming]) {
            physics[incoming].x = currentX
            physics[incoming].y = currentY
            physics[incoming].scale = 1.14 - 0.14 * easeP
            physics[incoming].opacity = 1.0
          }

          // Update comet tail
          if (cometTailRef.current) {
            const tailEl = cometTailRef.current
            tailEl.style.opacity = `${(1 - easeP * 0.4) * 0.55}`
            const tailLen = 130 * Math.sin(p * Math.PI)
            const moveAngle = Math.atan2(0, -state.cometStartX)
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
            if (cometTailRef.current) cometTailRef.current.style.opacity = '0'
            state.phase = 'IMPACT'
            state.phaseStartTime = now
          }
          break
        }

        case 'IMPACT': {
          state.currentSpeed = 0
          if (timeInPhase <= dt * 1000 + 10) {
            const oldCenter = state.currentActiveId
            const newCenter = state.incomingId
            state.currentActiveId = newCenter
            setActiveStageId(newCenter)
            setExitingStageId(null)
            setExitingOpacity(0)
            setPulseRingActive(true)
            setTimeout(() => setPulseRingActive(false), 800)

            // REPLACEMENT: old center orb replaces incoming orb in the vacated slot
            state.floatingSlots[state.incomingSlot] = oldCenter
            state.returningId = oldCenter
            state.returningSlot = state.incomingSlot
            state.returningOpacity = 0

            state.cycleCount += 1
            if (import.meta.env.DEV) {
              console.log(`[OrbitStage] Center platform: ${newCenter} (Cycle ${state.cycleCount}) | Floating slots:`, state.floatingSlots)
            }

            if (rippleRef.current) {
              rippleRef.current.triggerSlam(geom.slotCenterX, geom.slotCenterY)
            }
          }

          if (timeInPhase >= 80) {
            state.phase = 'SETTLE'
            state.phaseStartTime = now
          }
          break
        }

        case 'SETTLE': {
          state.currentSpeed = 0
          // Re-materialize old center orb in vacated floating slot (opacity only: 0 -> 0.5 over 500ms)
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
          if (state.readCountDone && timeInPhase >= 1200 + 3700) {
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

      // --- POSITIONS PASS ---
      const isHalted = state.phase !== 'HOLD' && state.phase !== 'WAKE'
      const driftScale = isHalted ? 0.25 : 1.0

      if (!geom.isParked) {
        state.floatingSlots.forEach((id, slotIdx) => {
          if (state.phase === 'COMET' && id === state.incomingId) return

          const p = physics[id]
          const slotAngle = (state.sharedPhase + slotIdx * ((2 * Math.PI) / 3)) % (2 * Math.PI)
          const sqX = Math.cos(slotAngle) * geom.rx
          const sqY = Math.sin(slotAngle) * geom.ry

          const dCfg = DRIFT_CONFIG[id] || { T1: 8, phi1: 0, T2: 11, phi2: 0 }
          const rDrift = 5 * Math.sin(tSec / dCfg.T1 + dCfg.phi1) * driftScale
          const tDrift = 3 * Math.sin(tSec / dCfg.T2 + dCfg.phi2) * driftScale

          const invLen = 1 / (Math.hypot(sqX, sqY) || 1)
          const radDirX = sqX * invLen
          const radDirY = sqY * invLen
          const tanDirX = -radDirY
          const tanDirY = radDirX

          let nextX = sqX + radDirX * rDrift + tanDirX * tDrift
          let nextY = sqY + radDirY * rDrift + tanDirY * tDrift

          // Exclusion zone clamp: exclusion ALWAYS wins over orbit shape
          const ex = geom.exclusionRect
          let absX = geom.slotCenterX + nextX
          let absY = geom.slotCenterY + nextY
          if (
            absX + geom.iconRadius > ex.left &&
            absX - geom.iconRadius < ex.right &&
            absY + geom.iconRadius > ex.top &&
            absY - geom.iconRadius < ex.bottom
          ) {
            const distLeft = absX + geom.iconRadius - ex.left
            const distRight = ex.right - (absX - geom.iconRadius)
            const distTop = absY + geom.iconRadius - ex.top
            const distBottom = ex.bottom - (absY - geom.iconRadius)
            const minDist = Math.min(distLeft, distRight, distTop, distBottom)
            if (minDist === distLeft) absX = ex.left - geom.iconRadius
            else if (minDist === distRight) absX = ex.right + geom.iconRadius
            else if (minDist === distTop) absY = ex.top - geom.iconRadius
            else absY = ex.bottom + geom.iconRadius
          }

          p.x = absX - geom.slotCenterX
          p.y = absY - geom.slotCenterY
        })

        // Minimum spacing between floating orbs (2 orb diameters = 4 * iconRadius)
        const minCenterDist = geom.iconRadius * 4
        for (let i = 0; i < state.floatingSlots.length; i++) {
          for (let j = i + 1; j < state.floatingSlots.length; j++) {
            const idA = state.floatingSlots[i]
            const idB = state.floatingSlots[j]
            if (state.phase === 'COMET' && (idA === state.incomingId || idB === state.incomingId)) continue
            const p1 = physics[idA]
            const p2 = physics[idB]
            const dx = p2.x - p1.x
            const dy = p2.y - p1.y
            const dist = Math.hypot(dx, dy)
            if (dist > 0 && dist < minCenterDist) {
              const overlap = (minCenterDist - dist) / 2
              p1.x -= (dx / dist) * overlap
              p1.y -= (dy / dist) * overlap
              p2.x += (dx / dist) * overlap
              p2.y += (dy / dist) * overlap
            }
          }
        }
      } else {
        // Parked orbs fallback: gentle drift in free bands above/below content
        state.floatingSlots.forEach((id, idx) => {
          const p = physics[id]
          const dCfg = DRIFT_CONFIG[id] || { T1: 8, phi1: 0, T2: 11, phi2: 0 }
          const baseX = (idx - 1) * 75
          const baseY = (geom.exclusionRect.top - geom.iconRadius - 16) - geom.slotCenterY
          p.x = baseX + 4 * Math.sin(tSec / dCfg.T1 + dCfg.phi1)
          p.y = baseY + 3 * Math.cos(tSec / dCfg.T2 + dCfg.phi2)
        })
      }

      // --- OPACITY & DOM UPDATES ---
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

        // Bottom edge gradient: orbs smoothly fade out approaching bottom edge
        const screenY = geom.slotCenterY + p.y
        const distFromBottom = geom.height - screenY
        const BOTTOM_FADE_MARGIN = Math.max(220, Math.min(320, geom.height * 0.3))
        const bottomFactor = Math.min(1, Math.max(0, distFromBottom / BOTTOM_FADE_MARGIN))
        const bottomGradient = 0.5 - 0.5 * Math.cos(bottomFactor * Math.PI)
        const effectiveOpacity = p.opacity * bottomGradient

        el.style.transform = `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0) scale(${p.scale.toFixed(3)})`
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
      ref={containerRef}
      className="relative w-screen h-[100svh] min-h-[100svh] overflow-hidden bg-[#0a0a0a] text-white flex flex-col items-center justify-center select-none font-sans"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        overscrollBehavior: 'none',
      }}
    >
      {/* Background Reacting Dot Grid Canvas */}
      <WaterRippleCanvas ref={rippleRef} className="z-0 pointer-events-auto" />

      {/* Orbit Track Layer (floating orbs + comet tail) */}
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
                  left: '50%',
                  top: '50%',
                  marginLeft: '-27px',
                  marginTop: '-27px',
                  boxShadow: `0 0 18px ${cfg.color}88, 0 0 39px ${cfg.color}44, 0 10px 22px rgba(0,0,0,0.55)`,
                }}
                className="absolute w-[54px] h-[54px] rounded-full bg-slate-900/85 backdrop-blur-xl shadow-2xl border border-white/25 flex items-center justify-center pointer-events-auto cursor-pointer will-change-transform active:scale-[0.92]"
              >
                <Icon size={26} color={cfg.color} />
              </button>
            )
          })}
      </div>

      {/* Center Stage & Content Stack (Exclusion Area) */}
      <div className="relative z-20 flex flex-col items-center text-center max-w-sm px-4 pointer-events-auto">
        {/* 1. Heading "Do you have" */}
        <h1
          ref={headingRef}
          className="text-[clamp(28px,6vmin,54px)] font-extrabold tracking-tight text-white leading-tight drop-shadow-md select-none"
        >
          Do you have
        </h1>

        {/* 2. Center orb slot */}
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
        <div ref={captionRef} aria-live="polite" className="h-14 flex flex-col items-center justify-center overflow-visible">
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
          className="relative overflow-hidden mt-6 inline-flex items-center justify-center min-w-[170px] min-h-[48px] px-8 py-3 rounded-xl bg-white text-slate-950 font-semibold text-base shadow-[0_0_0_1px_rgba(255,255,255,0.35)] active:scale-[0.97] transition-colors duration-200 ease-out hover:bg-slate-100 touch-manipulation select-none"
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
        <div ref={signInRef} className="mt-4 flex items-center justify-center gap-1.5 text-sm text-slate-400">
          <span>Already have an account?</span>
          <Link
            to="/auth?mode=signin"
            className="font-medium text-slate-200 hover:text-white underline underline-offset-4 decoration-slate-600 hover:decoration-slate-300 transition-colors duration-150"
          >
            Sign in
          </Link>
        </div>

        {/* 5. Three Trust Ticks */}
        <div
          ref={ticksRef}
          className={`flex ${
            stackTicks ? 'flex-col items-center gap-2' : 'flex-row flex-wrap justify-center gap-4 sm:gap-6'
          } mt-6 pointer-events-auto text-xs text-white/60`}
        >
          <div className="inline-flex items-center gap-1.5">
            <Check size={14} className="text-emerald-400" />
            <span>No credit card required</span>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <Check size={14} className="text-emerald-400" />
            <span>Syncs in 30 seconds</span>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <Check size={14} className="text-emerald-400" />
            <span>Cancel or delete anytime</span>
          </div>
        </div>
      </div>
    </main>
  )
}
