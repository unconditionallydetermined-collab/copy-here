import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { Lightbulb, Code2, ArrowRight, Check } from 'lucide-react'
import { Github, Linkedin } from '../components/Icons'
import WaterRippleCanvas from '../components/WaterRippleCanvas'
import FloatingIslandNav from '../components/FloatingIslandNav'

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

const REVEAL_WORDS = [
  'Traditional', 'resumes', 'hide', 'your', 'true', 'ability.',
  'Stop', 'sending', 'static', 'resumes', 'into', 'automated', 'filters.',
  'Find', 'your', 'dream', 'job', 'easily.', 'Match', 'careers', 'that', 'fit', 'your', 'skills.'
]

function AnimatedChars({ text, baseDelay = 0, speed = 18 }) {
  return (
    <>
      {text.split('').map((char, i) => (
        <span
          key={i}
          className="inline-block animate-char-reveal will-change-transform"
          style={{
            animationDelay: `${baseDelay + i * speed}ms`,
            animationFillMode: 'both',
          }}
        >
          {char === ' ' ? ' ' : char}
        </span>
      ))}
    </>
  )
}

export default function LandingPage() {
  const [initialRandomBadge] = useState(() => {
    return BADGES[Math.floor(Math.random() * BADGES.length)]
  })

  // Stage 2 state
  const [activeStageId, setActiveStageId] = useState(initialRandomBadge)
  const [exitingStageId, setExitingStageId] = useState(null)
  const [exitingOpacity, setExitingOpacity] = useState(1.0)
  const [textPhase, setTextPhase] = useState('idle')
  const [displayCount, setDisplayCount] = useState(PLATFORM_CONFIG[initialRandomBadge].targetPercent)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [ctaShimmerActive, setCtaShimmerActive] = useState(false)
  const [ctaShimmerCycle, setCtaShimmerCycle] = useState(0)
  const [pulseRingActive, setPulseRingActive] = useState(false)
  const [orbsParked, setOrbsParked] = useState(false)

  // Scroll reveal and lock state
  const [isLocked, setIsLocked] = useState(false)
  const [revealedCount, setRevealedCount] = useState(0)
  const [actionsVisible, setActionsVisible] = useState(false)

  // Refs
  const screen1TrackRef = useRef(null)
  const screen2Ref = useRef(null)
  const heroWrapperRef = useRef(null)
  const centerSlotRef = useRef(null)
  const headingRef = useRef(null)
  const captionRef = useRef(null)
  const buttonRef = useRef(null)
  const ticksBottomRef = useRef(null)
  const footerRef = useRef(null)
  const navRef = useRef(null)
  const pulseTimerRef = useRef(null)
  const rippleRef = useRef(null)
  const badgeDomRefs = useRef({})
  const cometTailRef = useRef(null)

  const isSnappingRef = useRef(false)
  const revealCompleteTimeRef = useRef(0)
  const isRevealCompleteRef = useRef(false)

  const geomRef = useRef({
    slotCenterX: 0,
    slotCenterY: 0,
    exclusionRect: { left: 0, top: 0, right: 0, bottom: 0 },
    rx: 200,
    ry: 200,
    iconRadius: 26,
    pad: 28,
    isParked: false,
    parkedPositions: {},
  })

  const slotAssignRef = useRef({
    github: 0,
    leetcode: 1,
    linkedin: 2,
    skills: null,
  })

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
    cometStartX: 0,
    cometStartY: 0,
    cometTargetX: 0,
    cometTargetY: 0,
    currentSpeed: (26 * Math.PI) / 180,
    targetSpeed: (26 * Math.PI) / 180,
    sharedPhase: 0,
    lastTime: performance.now(),
    lastCycleEndTime: performance.now(),
    cycleCount: 0,
  })

  const iconPhysicsRef = useRef({
    github:   { x: 0, y: 0, opacity: 1, scale: 1, vx: 0, vy: 0 },
    leetcode: { x: 0, y: 0, opacity: 1, scale: 1, vx: 0, vy: 0 },
    linkedin: { x: 0, y: 0, opacity: 1, scale: 1, vx: 0, vy: 0 },
    skills:   { x: 0, y: 0, opacity: 0, scale: 1, vx: 0, vy: 0 },
  })

  // Reduced motion preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    if (mq.matches) {
      setRevealedCount(REVEAL_WORDS.length)
      setActionsVisible(true)
    }
    const handler = (e) => {
      setReducedMotion(e.matches)
      if (e.matches) {
        setRevealedCount(REVEAL_WORDS.length)
        setActionsVisible(true)
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // SCREEN 1: Scroll-driven reveal listener
  useEffect(() => {
    if (isLocked || reducedMotion) return

    let rafId = null

    const handleScroll = () => {
      if (!screen1TrackRef.current) return
      const track = screen1TrackRef.current
      const rect = track.getBoundingClientRect()
      const scrollDist = -rect.top
      const maxScrollDist = track.scrollHeight - window.innerHeight

      if (maxScrollDist <= 0) return

      // Linear mapping to first ~85% of track (with rest zone 85-100%)
      const progress = Math.min(1, Math.max(0, scrollDist / (maxScrollDist * 0.85)))
      const targetWords = Math.floor(progress * REVEAL_WORDS.length)
      setRevealedCount(targetWords)

      const isComplete = targetWords >= REVEAL_WORDS.length
      if (isComplete && !isRevealCompleteRef.current) {
        isRevealCompleteRef.current = true
        revealCompleteTimeRef.current = performance.now()
        setActionsVisible(true)
      } else if (!isComplete && isRevealCompleteRef.current) {
        isRevealCompleteRef.current = false
        setActionsVisible(false)
      }

      // If user drags scrollbar and Screen 2 becomes more than 35% visible after reveal complete
      if (isComplete && screen2Ref.current && !isSnappingRef.current) {
        const s2Rect = screen2Ref.current.getBoundingClientRect()
        const visibleHeight = Math.max(0, window.innerHeight - s2Rect.top)
        if (visibleHeight > window.innerHeight * 0.35) {
          triggerSnap()
        }
      }
    }

    const onScroll = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          handleScroll()
          rafId = null
        })
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [isLocked, reducedMotion])

  // Snap transition to Screen 2
  const triggerSnap = () => {
    if (isSnappingRef.current || isLocked) return
    isSnappingRef.current = true

    if (reducedMotion) {
      setIsLocked(true)
      window.scrollTo(0, 0)
      isSnappingRef.current = false
      return
    }

    const startScroll = window.scrollY
    const s2Top = screen2Ref.current ? screen2Ref.current.getBoundingClientRect().top + window.scrollY : window.innerHeight * 3
    const targetScroll = s2Top
    const distance = targetScroll - startScroll
    const duration = 900
    const startTime = performance.now()

    // cubic-bezier(0.32,0.72,0,1) approximation
    const ease = (t) => {
      return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2
    }

    const step = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / duration)
      const eased = ease(progress)
      window.scrollTo(0, startScroll + distance * eased)

      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        // ONE WAY LOCK: Unmount Screen 1 and reset scroll to 0 seamlessly
        setIsLocked(true)
        window.scrollTo(0, 0)
        isSnappingRef.current = false
      }
    }

    requestAnimationFrame(step)
  }

  // Input detection for snap (wheel, touch swipe, arrow keys)
  useEffect(() => {
    if (isLocked || reducedMotion) return

    let touchStartY = 0

    const canTriggerIntent = () => {
      if (!isRevealCompleteRef.current || isSnappingRef.current) return false
      // Must have rested at least 200ms at end of track
      return performance.now() - revealCompleteTimeRef.current >= 200
    }

    const handleWheel = (e) => {
      if (canTriggerIntent() && e.deltaY > 15) {
        e.preventDefault()
        triggerSnap()
      }
    }

    const handleTouchStart = (e) => {
      if (e.touches && e.touches[0]) {
        touchStartY = e.touches[0].clientY
      }
    }

    const handleTouchMove = (e) => {
      if (!canTriggerIntent()) return
      if (e.touches && e.touches[0]) {
        const deltaY = e.touches[0].clientY - touchStartY
        if (deltaY < -25) {
          e.preventDefault()
          triggerSnap()
        }
      }
    }

    const handleKeyDown = (e) => {
      if (!canTriggerIntent()) return
      if (['ArrowDown', 'PageDown', 'Space', 'End'].includes(e.key)) {
        e.preventDefault()
        triggerSnap()
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isLocked, reducedMotion])

  // One-way lock scroll reset and prevent upward navigation
  useLayoutEffect(() => {
    if (isLocked) {
      window.scrollTo(0, 0)
      document.documentElement.style.overflow = 'hidden'
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overscrollBehavior = 'none'
      document.body.style.overscrollBehavior = 'none'
    } else {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
      document.documentElement.style.overscrollBehavior = ''
      document.body.style.overscrollBehavior = ''
    }

    return () => {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
      document.documentElement.style.overscrollBehavior = ''
      document.body.style.overscrollBehavior = ''
    }
  }, [isLocked])

  // Ignore upward keys and gestures once locked
  useEffect(() => {
    if (!isLocked) return

    const handleLockedWheel = (e) => {
      e.preventDefault()
    }
    const handleLockedTouch = (e) => {
      // allow horizontal or tap, but prevent vertical bounce
    }
    const handleLockedKeys = (e) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', 'Space'].includes(e.key)) {
        e.preventDefault()
      }
    }

    window.addEventListener('wheel', handleLockedWheel, { passive: false })
    window.addEventListener('keydown', handleLockedKeys)

    return () => {
      window.removeEventListener('wheel', handleLockedWheel)
      window.removeEventListener('keydown', handleLockedKeys)
    }
  }, [isLocked])

  // Strict Exclusion Zone & Geometry Calculation for Screen 2
  useEffect(() => {
    const updateGeometry = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight

      const slotEl = centerSlotRef.current
      const headingEl = headingRef.current
      const captionEl = captionRef.current
      const btnEl = buttonRef.current
      const ticksEl = ticksBottomRef.current
      const footerEl = footerRef.current

      const getRect = (el) => {
        if (!el) return null
        const r = el.getBoundingClientRect()
        return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }
      }

      const slotR = getRect(slotEl) || { left: vw / 2 - 33, top: vh / 2 - 33, right: vw / 2 + 33, bottom: vh / 2 + 33 }
      const headR = getRect(headingEl)
      const capR = getRect(captionEl)
      const btnR = getRect(btnEl)
      const ticksR = getRect(ticksEl)
      const footR = getRect(footerEl)

      // Measured fixed nav pill
      const navEl = document.querySelector('[aria-label="Primary navigation"]')
      const navR = getRect(navEl) || { left: vw / 2 - 180, top: 0, right: vw / 2 + 180, bottom: 64 }

      let iconRadius = vw < 360 ? 16 : vw < 480 ? 20 : 26
      let pad = vw < 640 ? 20 : 28

      // Union rectangle of heading, slot, caption, button, ticks
      const contentRects = [slotR, headR, capR, btnR, ticksR].filter(Boolean)
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      contentRects.forEach((r) => {
        if (r.left < minX) minX = r.left
        if (r.top < minY) minY = r.top
        if (r.right > maxX) maxX = r.right
        if (r.bottom > maxY) maxY = r.bottom
      })

      let exclusionRect = {
        left: minX - pad,
        top: minY - pad,
        right: maxX + pad,
        bottom: maxY + pad,
      }

      const slotCenterX = (slotR.left + slotR.right) / 2
      const slotCenterY = (slotR.top + slotR.bottom) / 2

      const navBottom = navR.bottom
      const footTop = footR ? footR.top : vh - 32

      const cornersOf = (rect) => [
        { x: rect.left, y: rect.top },
        { x: rect.right, y: rect.top },
        { x: rect.left, y: rect.bottom },
        { x: rect.right, y: rect.bottom },
      ]

      const maxRx = slotCenterX - (iconRadius + pad)
      const maxRy = Math.min(
        slotCenterY - (navBottom + iconRadius + pad),
        footTop - slotCenterY - (iconRadius + pad)
      )

      // Find the smallest ellipse CONTAINING the exclusion zone that fits the viewport
      const fitOrbit = (orbR, padV, rect) => {
        const rxCap = Math.max(130, slotCenterX - (orbR + padV))
        const ryCapTop = slotCenterY - (navBottom + orbR + padV)
        const ryCapBottom = footTop - slotCenterY - (orbR + padV)
        const ryCap = Math.min(ryCapTop, ryCapBottom)

        const halfW = Math.max(slotCenterX - rect.left, rect.right - slotCenterX)
        const halfH = Math.max(slotCenterY - rect.top, rect.bottom - slotCenterY)
        if (rxCap < halfW || ryCap < halfH) return null

        const corners = cornersOf(rect)
        let needRx = halfW
        let needRy = halfH
        // Smallest circle containing the zone
        let maxCornerDist = 0
        corners.forEach((c) => {
          maxCornerDist = Math.max(maxCornerDist, Math.hypot(c.x - slotCenterX, c.y - slotCenterY))
        })
        const minCircle = maxCornerDist + orbR + padV

        if (minCircle <= rxCap && minCircle <= ryCap) {
          return { rx: minCircle, ry: minCircle }
        }

        // Flatten: horizontal axis at cap, vertical axis sized so all corners stay inside the ellipse
        needRx = rxCap
        needRy = halfH
        for (let i = 0; i < corners.length; i++) {
          const cx = corners[i].x - slotCenterX
          const cy = corners[i].y - slotCenterY
          const t = 1 - (cx * cx) / (needRx * needRx)
          if (t > 0.0001) {
            needRy = Math.max(needRy, Math.abs(cy) / Math.sqrt(t))
          } else {
            return null
          }
        }
        needRy += orbR + padV
        if (needRy > ryCap) return null
        return { rx: needRx, ry: needRy }
      }

      let fit = fitOrbit(iconRadius, pad, exclusionRect)

      // Fallback cascade: shrink orbs to 40px (32px under 360px wide), reduce pad to 12px
      if (!fit) {
        iconRadius = vw < 360 ? 16 : 20
        pad = 12
        exclusionRect = {
          left: minX - pad,
          top: minY - pad,
          right: maxX + pad,
          bottom: maxY + pad,
        }
        fit = fitOrbit(iconRadius, pad, exclusionRect)
      }

      let isParked = false
      let rx = 0
      let ry = 0
      const parkedPositions = {}

      if (fit) {
        rx = fit.rx
        ry = fit.ry
      } else {
        // Last resort: park the three floating orbs in free space with gentle drift
        isParked = true
        const orbR = iconRadius
        const bandAbove = { top: navBottom, bottom: exclusionRect.top }
        const bandBelow = { top: exclusionRect.bottom, bottom: footTop }
        const bandSide = { left: 0, right: exclusionRect.left, otherRight: exclusionRect.right }
        const yAbove = (bandAbove.top + bandAbove.bottom) / 2 - slotCenterY
        const yBelow = (bandBelow.top + bandBelow.bottom) / 2 - slotCenterY
        const aboveOk = bandAbove.bottom - bandAbove.top >= orbR * 2 + 8
        const belowOk = bandBelow.bottom - bandBelow.top >= orbR * 2 + 8
        const sideW = Math.min(exclusionRect.left, vw - exclusionRect.right)
        const sideOk = sideW >= orbR * 2 + 8
        const yMid = 0 - (slotCenterY - (exclusionRect.top + exclusionRect.bottom) / 2)

        // Distribute orbs across whichever free bands exist
        const spots = []
        if (aboveOk) spots.push({ x: -Math.min(90, sideW > 0 ? sideW / 2 - orbR : 90), y: yAbove })
        if (belowOk) spots.push({ x: Math.min(90, sideW > 0 ? sideW / 2 - orbR : 90), y: yBelow })
        if (sideOk) {
          spots.push({ x: -(slotCenterX - exclusionRect.left) / 2 - orbR / 2, y: yMid })
          spots.push({ x: (vw - exclusionRect.right) / 2 + orbR / 2, y: yMid })
        }
        while (spots.length < 3) {
          spots.push({ x: (spots.length - 1) * 100 - 100, y: yAbove })
        }

        const floatingIds = BADGES.filter((b) => b !== stateRef.current.currentActiveId)
        floatingIds.forEach((id, idx) => {
          parkedPositions[id] = spots[idx % spots.length]
        })
      }

      geomRef.current = {
        slotCenterX,
        slotCenterY,
        exclusionRect,
        rx,
        ry,
        iconRadius,
        pad,
        isParked,
        parkedPositions,
        vw,
        vh,
      }

      setOrbsParked(isParked)

      if (rippleRef.current) {
        rippleRef.current.setProtectedRect(exclusionRect)
      }
    }

    updateGeometry()
    window.addEventListener('resize', updateGeometry)

    const observer = new ResizeObserver(() => updateGeometry())
    if (centerSlotRef.current) observer.observe(centerSlotRef.current)
    if (headingRef.current) observer.observe(headingRef.current)
    if (buttonRef.current) observer.observe(buttonRef.current)
    if (ticksBottomRef.current) observer.observe(ticksBottomRef.current)
    if (footerRef.current) observer.observe(footerRef.current)

    return () => {
      window.removeEventListener('resize', updateGeometry)
      observer.disconnect()
    }
  }, [isLocked])

  // 60fps Animation Loop with Unified State Machine  // 60fps Animation Loop with Unified State Machine
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
          const holdDuration = 4500
          if (timeInPhase >= holdDuration) {
            const isBadgeInView = (id, margin = 20) => {
              const p = physics[id]
              const absX = geom.slotCenterX + p.x
              const absY = geom.slotCenterY + p.y
              return (
                absX >= margin &&
                absX <= geom.vw - margin &&
                absY >= margin &&
                absY <= geom.vh - margin
              )
            }

            const onScreen = floatingIds.filter((id) => isBadgeInView(id))
            const pool = onScreen.length > 0 ? onScreen : floatingIds
            const incoming = pool[Math.floor(Math.random() * pool.length)]

            state.incomingId = incoming
            state.phase = 'BRAKE'
            state.phaseStartTime = now
            state.targetSpeed = 0
          }
          break
        }

        case 'BRAKE': {
          state.targetSpeed = 0
          if (Math.abs(state.currentSpeed) < 0.005) {
            state.currentSpeed = 0
            state.phase = 'CHARGE'
            state.phaseStartTime = now
          }
          break
        }

        case 'CHARGE': {
          const chargeDuration = 700
          if (timeInPhase >= chargeDuration) {
            state.phase = 'COMET'
            state.phaseStartTime = now

            const incoming = state.incomingId
            const p = physics[incoming]
            state.cometStartX = p.x
            state.cometStartY = p.y
            state.cometTargetX = 0
            state.cometTargetY = 0

            setExitingStageId(state.currentActiveId)
            setExitingOpacity(1.0)
          }
          break
        }

        case 'COMET': {
          const cometDuration = 550
          const p = Math.min(1, timeInPhase / cometDuration)
          const ease = p * p * (3 - 2 * p)

          const currentX = state.cometStartX + (state.cometTargetX - state.cometStartX) * ease
          const currentY = state.cometStartY + (state.cometTargetY - state.cometStartY) * ease

          const pInc = physics[state.incomingId]
          pInc.x = currentX
          pInc.y = currentY
          pInc.scale = 1.0 + 0.15 * Math.sin(p * Math.PI)

          setExitingOpacity(1.0 - p)

          if (cometTailRef.current) {
            const tailEl = cometTailRef.current
            const dx = state.cometTargetX - state.cometStartX
            const dy = state.cometTargetY - state.cometStartY
            const angle = Math.atan2(dy, dx) * (180 / Math.PI)
            const tailLength = Math.min(80, Math.hypot(dx, dy) * 0.45)

            tailEl.style.width = `${tailLength}px`
            tailEl.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) rotate(${angle}deg)`
            tailEl.style.opacity = `${(Math.sin(p * Math.PI) * 0.85).toFixed(2)}`
          }

          if (rippleRef.current && p > 0.1 && p < 0.9) {
            rippleRef.current.displaceAt(geom.slotCenterX + currentX, geom.slotCenterY + currentY, 8)
          }

          if (p >= 1) {
            state.phase = 'IMPACT'
            state.phaseStartTime = now

            const prevActive = state.currentActiveId
            const incoming = state.incomingId
            state.returningId = prevActive
            state.currentActiveId = incoming

            slotAssignRef.current[prevActive] = slotAssignRef.current[incoming] ?? 0
            slotAssignRef.current[incoming] = null

            setActiveStageId(incoming)
            setExitingStageId(null)
            setPulseRingActive(true)

            if (rippleRef.current) {
              rippleRef.current.triggerSlam(geom.slotCenterX, geom.slotCenterY, {
                intensity: 140,
                speed: 300,
                maxRadius: 380,
                blastRadius: 140,
              })
              rippleRef.current.boostDamping(1200)
            }

            if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current)
            pulseTimerRef.current = setTimeout(() => setPulseRingActive(false), 550)
          }
          break
        }

        case 'IMPACT': {
          if (timeInPhase >= 80) {
            state.phase = 'SETTLE'
            state.phaseStartTime = now
            if (cometTailRef.current) {
              cometTailRef.current.style.opacity = '0'
            }
          }
          break
        }

        case 'SETTLE': {
          const settleDuration = 800
          const p = Math.min(1, timeInPhase / settleDuration)
          state.returningOpacity = p

          const isCanvasSettled = rippleRef.current ? rippleRef.current.isSettled() : true
          if (p >= 1 && (isCanvasSettled || timeInPhase >= 1400)) {
            state.phase = 'READ'
            state.phaseStartTime = now
            setTextPhase('entering')

            const targetP = PLATFORM_CONFIG[state.currentActiveId].targetPercent
            const startP = Math.max(0, targetP - 25)
            const countDuration = 650
            const countStart = performance.now()

            const countStep = (ts) => {
              const el = ts - countStart
              const cp = Math.min(1, el / countDuration)
              const easeCount = 1 - Math.pow(1 - cp, 3)
              setDisplayCount(Math.round(startP + (targetP - startP) * easeCount))
              if (cp < 1) requestAnimationFrame(countStep)
            }
            requestAnimationFrame(countStep)
          }
          break
        }

        case 'READ': {
          const readDuration = 2000
          if (timeInPhase >= readDuration) {
            state.phase = 'PULSE'
            state.phaseStartTime = now
            setCtaShimmerCycle((c) => c + 1)
            setCtaShimmerActive(true)
          }
          break
        }

        case 'PULSE': {
          const pulseElapsed = now - state.phaseStartTime
          if (pulseElapsed >= 1400) {
            setCtaShimmerActive(false)
            state.phase = 'WAKE'
            state.phaseStartTime = now
            state.cycleCount += 1
          }
          break
        }

        case 'WAKE': {
          const wakeDuration = 2200
          const wakeP = Math.min(1, timeInPhase / wakeDuration)
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
        if (geom.isParked && geom.parkedPositions[id]) {
          const park = geom.parkedPositions[id]
          const dCfg = DRIFT_CONFIG[id]
          p.x = park.x + 5 * Math.sin(tSec / dCfg.T1 + dCfg.phi1)
          p.y = park.y + 4 * Math.sin(tSec / dCfg.T2 + dCfg.phi2)
          return
        }

        const slotIdx = slotAssignRef.current[id] ?? 0
        const slotAngle = (state.sharedPhase + slotIdx * ((2 * Math.PI) / 3)) % (2 * Math.PI)
        const sq = getCirclePoint(slotAngle, geom.rx, geom.ry)

        const dCfg = DRIFT_CONFIG[id]
        const rDrift = 5 * Math.sin(tSec / dCfg.T1 + dCfg.phi1) * driftScale
        const tDrift = 3 * Math.sin(tSec / dCfg.T2 + dCfg.phi2) * driftScale

        const invLen = 1 / (Math.sqrt(sq.x * sq.x + sq.y * sq.y) || 1)
        const radDirX = sq.x * invLen
        const radDirY = sq.y * invLen
        const tanDirX = -radDirY
        const tanDirY = radDirX

        let nextX = sq.x + radDirX * rDrift + tanDirX * tDrift
        let nextY = sq.y + radDirY * rDrift + tanDirY * tDrift

        // Exclusion always wins: clamp orb outside the zone (nearest edge push-out)
        {
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
          nextX = absX - geom.slotCenterX
          nextY = absY - geom.slotCenterY
        }

        p.x = nextX
        p.y = nextY
      })

      // Soft spring separation: ensure minimum 2 orb diameters between floating orbs
      const minOrbDist = geom.iconRadius * 4
      for (let i = 0; i < floatingIds.length; i++) {
        for (let j = i + 1; j < floatingIds.length; j++) {
          const idA = floatingIds[i]
          const idB = floatingIds[j]
          const pA = physics[idA]
          const pB = physics[idB]
          const dx = pB.x - pA.x
          const dy = pB.y - pA.y
          const dist = Math.hypot(dx, dy)
          if (dist < minOrbDist && dist > 0.1) {
            const overlap = (minOrbDist - dist) * 0.5
            const nx = dx / dist
            const ny = dy / dist
            pA.x -= nx * overlap
            pA.y -= ny * overlap
            pB.x += nx * overlap
            pB.y += ny * overlap
          }
        }
      }

      // Dev check (DEV only): verify no exclusion zone intersections across cycles
      if (import.meta.env.DEV && state.cycleCount <= 2) {
        floatingIds.forEach((id) => {
          if (state.phase === 'COMET' && id === state.incomingId) return
          const p = physics[id]
          const absX = geom.slotCenterX + p.x
          const absY = geom.slotCenterY + p.y
          const r = geom.iconRadius
          const ex = geom.exclusionRect
          if (
            absX + r > ex.left &&
            absX - r < ex.right &&
            absY + r > ex.top &&
            absY - r < ex.bottom
          ) {
            console.warn(`[DEV CHECK] Orb ${id} intersected exclusion zone at (${absX}, ${absY})`)
          }
        })
      }

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

        el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) scale(${p.scale})`
        el.style.opacity = `${p.opacity.toFixed(3)}`

        if (p.opacity > 0.08) {
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

  return (
    <div
      className="relative w-full min-h-screen bg-[#000000] text-white selection:bg-white/20 font-sans overflow-x-hidden"
    >
      <FloatingIslandNav />

      {/* ── SCREEN 1: SCROLL-DRIVEN REVEAL (Unmounted when locked) ── */}
      {!isLocked && (
        <section
          ref={screen1TrackRef}
          className="relative w-full h-[300svh] bg-[#000000]"
        >
          <div className="sticky top-0 h-[100svh] w-full flex flex-col items-center justify-center px-6 text-center select-none">
            <div className="max-w-[680px] mx-auto flex flex-col items-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight [text-wrap:balance]">
                {REVEAL_WORDS.map((word, index) => {
                  const isRevealed = reducedMotion || index < revealedCount
                  return (
                    <span
                      key={`${word}-${index}`}
                      className={`inline-block mr-2.5 transition-colors duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                        isRevealed ? 'text-white' : 'text-white/25'
                      }`}
                    >
                      {word}
                    </span>
                  )
                })}
              </h1>

              {/* Actions below text: fade in only when last word is lit */}
              <div
                className={`mt-10 flex flex-col items-center gap-4 transition-opacity duration-500 ${
                  actionsVisible || reducedMotion ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
              >
                <Link
                  to="/auth"
                  className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-white text-slate-950 font-semibold text-base shadow-[0_0_30px_rgba(255,255,255,0.25)] hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 select-none"
                >
                  Find your dream job
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>

                <div className="text-sm text-slate-400">
                  <span>Already have an account? </span>
                  <Link
                    to="/auth?mode=signin"
                    className="font-medium text-slate-200 hover:text-white underline underline-offset-4 decoration-slate-600 hover:decoration-slate-300 transition-colors"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── SCREEN 2: THE ORBIT STAGE (Final fold) ── */}
      <section
        ref={screen2Ref}
        className="relative w-full h-[100svh] overflow-hidden bg-[#0a0a0a] bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px] text-white flex flex-col items-center justify-between select-none font-sans py-6 px-4"
      >
        <WaterRippleCanvas ref={rippleRef} className="absolute inset-0 z-0 pointer-events-auto" />

        {/* Comet streak and floating orbit orbs */}
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

        {/* Top spacer for floating nav */}
        <div className="h-14 w-full pointer-events-none" />

        {/* Center Stage & Content */}
        <div
          ref={heroWrapperRef}
          className="relative z-20 flex flex-col items-center text-center max-w-sm px-4 pointer-events-auto my-auto"
        >
          <h1
            ref={headingRef}
            className="text-[clamp(28px,6vmin,54px)] font-extrabold tracking-tight text-white leading-tight drop-shadow-md"
          >
            Do you have
          </h1>

          <div ref={centerSlotRef} className="h-20 w-20 my-2 flex items-center justify-center relative">
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
                  boxShadow: `0 0 26px ${exitingConfig.color}99, 0 0 58px ${exitingConfig.color}55, 0 12px 28px rgba(0,0,0,0.55)`,
                }}
                className="absolute w-[66px] h-[66px] rounded-full bg-slate-900/90 backdrop-blur-md shadow-2xl border border-white/25 flex items-center justify-center pointer-events-none"
              >
                {React.createElement(exitingConfig.icon, { size: 30, color: exitingConfig.color })}
              </div>
            )}

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

          <div
            ref={captionRef}
            aria-live="polite"
            className="h-14 flex flex-col items-center justify-center overflow-visible"
          >
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

          {/* Button directly under caption */}
          <div className="mt-4 flex flex-col items-center">
            <Link
              ref={buttonRef}
              to="/auth"
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

            {/* Three ticks directly below button */}
            <div
              ref={ticksBottomRef}
              className={`mt-4 flex ${orbsParked ? 'flex-col' : 'flex-wrap'} items-center justify-center gap-4 text-[11px] text-slate-400 select-none`}
            >
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
        </div>

        {/* Minimal Footer Line at the very bottom */}
        <footer
          ref={footerRef}
          className="relative z-30 w-full max-w-4xl flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-slate-500 pb-2 pt-2"
        >
          <Link to="/info" className="hover:text-slate-300 transition-colors">
            Why CareerSync
          </Link>
          <Link to="/about" className="hover:text-slate-300 transition-colors">
            About
          </Link>
          <Link to="/info" className="hover:text-slate-300 transition-colors">
            Privacy policy
          </Link>
          <Link to="/info" className="hover:text-slate-300 transition-colors">
            Terms of service
          </Link>
          <span>© {new Date().getFullYear()} CareerSync</span>
        </footer>
      </section>
    </div>
  )
}
