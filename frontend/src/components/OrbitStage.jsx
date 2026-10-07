import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { Link } from 'react-router-dom'
import { Lightbulb, Code2, Check, ArrowRight } from 'lucide-react'
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
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </>
  )
}

export default function OrbitStage({ onMounted, animationReady = true }) {
  const [centerBadge, setCenterBadge] = useState('skills')
  const [displayedPercent, setDisplayedPercent] = useState(96)
  const [captionKey, setCaptionKey] = useState(0)
  const [isCtaShimmering, setIsCtaShimmering] = useState(false)
  const [isTextFading, setIsTextFading] = useState(false)
  const [fadingOrb, setFadingOrb] = useState(null)
  const [orbsParked, setOrbsParked] = useState(false)
  const [stackTicks, setStackTicks] = useState(false)

  const canvasRef = useRef(null)
  const stageRef = useRef(null)
  const slotRef = useRef(null)
  const headingRef = useRef(null)
  const captionRef = useRef(null)
  const ctaRef = useRef(null)
  const ticksRef = useRef(null)
  const footerRef = useRef(null)

  const stateRef = useRef({
    phase: 'HOLD',
    timer: 0,
    sharedPhase: 0,
    angularVelocity: (26 * Math.PI) / 180,
    targetVelocity: (26 * Math.PI) / 180,
    incomingBadge: null,
    incomingStartPos: null,
    incomingProgress: 0,
    centerBadge: 'skills',
    // Triangle slot order is strictly fixed: no random swapping!
    // Vertices of triangle around center: 0, 120 deg (2π/3), 240 deg (4π/3)
    floatingBadges: ['github', 'leetcode', 'linkedin'],
    lastTime: null,
    isTabHidden: false,
    physics: {
      github:   { x: 0, y: 0, vx: 0, vy: 0 },
      leetcode: { x: 0, y: 0, vx: 0, vy: 0 },
      linkedin: { x: 0, y: 0, vx: 0, vy: 0 },
      skills:   { x: 0, y: 0, vx: 0, vy: 0 },
    },
    geometry: {
      slotCenterX: 0,
      slotCenterY: 0,
      rx: 280,
      ry: 280,
      iconRadius: 26,
      exclusionRect: { left: 0, top: 0, right: 0, bottom: 0 },
      isParked: false,
    },
  })

  // Measure exclusion zone and solve orbit clearance
  const updateGeometry = () => {
    if (!stageRef.current || !slotRef.current) return
    const stage = stageRef.current.getBoundingClientRect()
    const slot = slotRef.current.getBoundingClientRect()

    const slotCenterX = slot.left + slot.width / 2 - stage.left
    const slotCenterY = slot.top + slot.height / 2 - stage.top

    const vw = stage.width || window.innerWidth
    const vh = stage.height || window.innerHeight

    let iconRadius = vw < 360 ? 16 : vw < 480 ? 20 : 26
    let pad = vw < 640 ? 20 : 28

    const rects = [
      slotRef.current?.getBoundingClientRect(),
      headingRef.current?.getBoundingClientRect(),
      captionRef.current?.getBoundingClientRect(),
      ctaRef.current?.getBoundingClientRect(),
      ticksRef.current?.getBoundingClientRect(),
      footerRef.current?.getBoundingClientRect(),
    ].filter(Boolean).map(r => ({
      left: r.left - stage.left,
      top: r.top - stage.top,
      right: r.right - stage.left,
      bottom: r.bottom - stage.top,
    }))

    const unionOf = (padding) => {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      rects.forEach(r => {
        minX = Math.min(minX, r.left)
        minY = Math.min(minY, r.top)
        maxX = Math.max(maxX, r.right)
        maxY = Math.max(maxY, r.bottom)
      })
      return {
        left: minX - padding,
        top: minY - padding,
        right: maxX + padding,
        bottom: maxY + padding,
      }
    }

    const footTop = footerRef.current ? (footerRef.current.getBoundingClientRect().top - stage.top) : vh - 40

    const fitOrbit = (orbR, padV, rect) => {
      const rxCap = Math.max(120, slotCenterX - (orbR + padV))
      const ryCapTop = slotCenterY - (orbR + padV + 8)
      const ryCapBottom = footTop - slotCenterY - (orbR + padV)
      const ryCap = Math.min(ryCapTop, ryCapBottom)

      const halfW = Math.max(slotCenterX - rect.left, rect.right - slotCenterX)
      const halfH = Math.max(slotCenterY - rect.top, rect.bottom - slotCenterY)

      if (rxCap < halfW || ryCap < halfH) return null

      const corners = [
        [rect.left, rect.top],
        [rect.right, rect.top],
        [rect.left, rect.bottom],
        [rect.right, rect.bottom],
      ]

      let maxCornerDist = 0
      corners.forEach(([cx, cy]) => {
        maxCornerDist = Math.max(maxCornerDist, Math.hypot(cx - slotCenterX, cy - slotCenterY))
      })
      const minCircle = maxCornerDist + orbR + padV
      if (minCircle <= rxCap && minCircle <= ryCap) {
        return { rx: minCircle, ry: minCircle }
      }

      const needRx = rxCap
      let needRy = halfH
      for (const [cx, cy] of corners) {
        const dx = cx - slotCenterX
        const t = 1 - (dx * dx) / (needRx * needRx)
        if (t > 0.0001) {
          needRy = Math.max(needRy, Math.abs(cy - slotCenterY) / Math.sqrt(t))
        } else {
          return null
        }
      }
      needRy += orbR + padV
      if (needRy > ryCap) return null
      return { rx: needRx, ry: needRy }
    }

    let rect = unionOf(pad)
    let fit = fitOrbit(iconRadius, pad, rect)
    let parked = false
    let shouldStackTicks = false

    if (!fit) {
      shouldStackTicks = true
      iconRadius = vw < 360 ? 16 : 20
      pad = 12
      rect = unionOf(pad)
      fit = fitOrbit(iconRadius, pad, rect)
      if (!fit) {
        parked = true
      }
    }

    setStackTicks(shouldStackTicks)
    setOrbsParked(parked)

    const geom = {
      slotCenterX,
      slotCenterY,
      rx: fit ? fit.rx : 200,
      ry: fit ? fit.ry : 200,
      iconRadius,
      exclusionRect: rect,
      isParked: parked,
    }

    stateRef.current.geometry = geom

    if (canvasRef.current?.setProtectedRect) {
      canvasRef.current.setProtectedRect(rect)
    }
  }

  useLayoutEffect(() => {
    updateGeometry()
    const ro = new ResizeObserver(() => updateGeometry())
    if (stageRef.current) ro.observe(stageRef.current)
    window.addEventListener('resize', updateGeometry)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', updateGeometry)
    }
  }, [])

  // Main animation loop
  useEffect(() => {
    let animId = null
    const s = stateRef.current

    const handleVisibility = () => {
      s.isTabHidden = document.hidden
      if (!document.hidden) s.lastTime = null
    }
    document.addEventListener('visibilitychange', handleVisibility)

    const BASE_SPEED = (26 * Math.PI) / 180
    const HOLD_TIME = 4500
    const CHARGE_TIME = 700
    const COMET_TIME = 550
    const IMPACT_TIME = 80
    const READ_TIME = 3200

    const loop = (timestamp) => {
      if (s.lastTime === null) {
        s.lastTime = timestamp
        animId = requestAnimationFrame(loop)
        return
      }

      const rawDt = (timestamp - s.lastTime) / 1000
      s.lastTime = timestamp
      const dt = Math.min(rawDt, 0.1)

      if (s.isTabHidden) {
        animId = requestAnimationFrame(loop)
        return
      }

      const geom = s.geometry

      if (!geom.isParked) {
        // Continuous rotation maintaining equilateral triangle: angles at 0, 120, 240 deg
        s.angularVelocity += (s.targetVelocity - s.angularVelocity) * Math.min(dt * 3.5, 1)
        s.sharedPhase = (s.sharedPhase + s.angularVelocity * dt) % (2 * Math.PI)

        // Dock lane along the right side of the center slot
        const DOCK_LANE_X = geom.rx * 0.95
        const DOCK_LANE_Y = 0

        switch (s.phase) {
          case 'HOLD': {
            s.timer += dt * 1000
            s.targetVelocity = BASE_SPEED
            if (s.timer >= HOLD_TIME) {
              s.phase = 'BRAKE'
              s.timer = 0
              s.targetVelocity = 0
            }
            break
          }
          case 'BRAKE': {
            s.timer += dt * 1000
            if (s.angularVelocity < 0.05 || s.timer > 1400) {
              s.phase = 'CHARGE'
              s.timer = 0
              // Pick the next floating orb strictly in triangle order to strike center
              const candidate = s.floatingBadges[0]
              s.incomingBadge = candidate
              const candIndex = 0
              const slotAngle = (s.sharedPhase + candIndex * ((2 * Math.PI) / 3)) % (2 * Math.PI)
              s.incomingStartPos = {
                x: Math.cos(slotAngle) * geom.rx,
                y: Math.sin(slotAngle) * geom.ry,
              }
              s.incomingProgress = 0
            }
            break
          }
          case 'CHARGE': {
            s.timer += dt * 1000
            if (s.timer >= CHARGE_TIME) {
              s.phase = 'COMET'
              s.timer = 0
              setIsTextFading(true)
              setFadingOrb(s.centerBadge)
            }
            break
          }
          case 'COMET': {
            s.timer += dt * 1000
            const p = Math.min(s.timer / COMET_TIME, 1)
            // cubic-bezier(0.32,0.72,0,1)
            s.incomingProgress = p * p * (3 - 2 * p)
            if (p >= 1) {
              s.phase = 'IMPACT'
              s.timer = 0
            }
            break
          }
          case 'IMPACT': {
            s.timer += dt * 1000
            if (s.timer >= IMPACT_TIME) {
              const oldCenter = s.centerBadge
              const newCenter = s.incomingBadge
              s.centerBadge = newCenter
              setCenterBadge(newCenter)
              setDisplayedPercent(PLATFORM_CONFIG[newCenter].targetPercent)
              setCaptionKey(prev => prev + 1)

              // Rotate badge order in fixed triangle slots: new center leaves, old center takes its slot
              s.floatingBadges = s.floatingBadges.map(b => b === newCenter ? oldCenter : b)

              setFadingOrb(null)
              setIsTextFading(false)
              setIsCtaShimmering(true)

              if (canvasRef.current?.triggerSlam) {
                canvasRef.current.triggerSlam(geom.slotCenterX, geom.slotCenterY)
              }

              s.phase = 'SETTLE'
              s.timer = 0
            }
            break
          }
          case 'SETTLE': {
            s.timer += dt * 1000
            if (s.timer >= 500) {
              s.phase = 'READ'
              s.timer = 0
            }
            break
          }
          case 'READ': {
            s.timer += dt * 1000
            if (s.timer >= READ_TIME) {
              setIsCtaShimmering(false)
              s.phase = 'WAKE'
              s.timer = 0
              s.targetVelocity = BASE_SPEED
            }
            break
          }
          case 'WAKE': {
            s.timer += dt * 1000
            if (s.timer >= 1200) {
              s.phase = 'HOLD'
              s.timer = 0
            }
            break
          }
          default:
            break
        }

        // Calculate positions for 3 floating badges around equilateral triangle
        const timeSec = timestamp / 1000
        const floating = s.floatingBadges
        const curPhysics = s.physics

        floating.forEach((id, idx) => {
          const p = curPhysics[id]
          if (s.phase === 'COMET' && id === s.incomingBadge) {
            const t = s.incomingProgress
            const start = s.incomingStartPos || { x: geom.rx, y: 0 }
            p.x = start.x + (0 - start.x) * t
            p.y = start.y + (0 - start.y) * t
            return
          }

          // Equilateral triangle vertices: index * 2π/3
          const slotAngle = (s.sharedPhase + idx * ((2 * Math.PI) / 3)) % (2 * Math.PI)
          const sqX = Math.cos(slotAngle) * geom.rx
          const sqY = Math.sin(slotAngle) * geom.ry

          const d = DRIFT_CONFIG[id] || { T1: 8, phi1: 0, T2: 11, phi2: 0 }
          const rDrift = 5 * Math.sin(timeSec / d.T1 + d.phi1)
          const tDrift = 3 * Math.sin(timeSec / d.T2 + d.phi2)

          const invLen = 1 / (Math.hypot(sqX, sqY) || 1)
          const radDirX = sqX * invLen
          const radDirY = sqY * invLen
          const tanDirX = -radDirY
          const tanDirY = radDirX

          let nextX = sqX + radDirX * rDrift + tanDirX * tDrift
          let nextY = sqY + radDirY * rDrift + tanDirY * tDrift

          // Exclusion always wins: clamp orb outside exclusion zone
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

        // Separation enforcement (minimum 2 orb diameters between floating orbs)
        const minCenterDist = geom.iconRadius * 4
        for (let i = 0; i < floating.length; i++) {
          for (let j = i + 1; j < floating.length; j++) {
            const p1 = curPhysics[floating[i]]
            const p2 = curPhysics[floating[j]]
            const dx = p2.x - p1.x
            const dy = p2.y - p1.y
            const dist = Math.hypot(dx, dy)
            if (dist > 0 && dist < minCenterDist) {
              const overlap = (minCenterDist - dist) / 2
              const nx = dx / dist
              const ny = dy / dist
              p1.x -= nx * overlap
              p1.y -= ny * overlap
              p2.x += nx * overlap
              p2.y += ny * overlap
            }
          }
        }
      } else {
        // Parked orbs fallback: gentle drift in free bands above/below content
        const timeSec = timestamp / 1000
        const curPhysics = s.physics
        const floating = s.floatingBadges
        const ex = geom.exclusionRect

        floating.forEach((id, idx) => {
          const p = curPhysics[id]
          const d = DRIFT_CONFIG[id] || { T1: 8, phi1: 0, T2: 11, phi2: 0 }
          const baseX = (idx - 1) * 70
          const baseY = (ex.top - geom.iconRadius - 16) - geom.slotCenterY
          p.x = baseX + 4 * Math.sin(timeSec / d.T1 + d.phi1)
          p.y = baseY + 3 * Math.cos(timeSec / d.T2 + d.phi2)
        })
      }

      // Update DOM styles directly for silky 60fps
      s.floatingBadges.forEach((id) => {
        const el = document.getElementById(`orb-${id}`)
        if (el) {
          const p = s.physics[id]
          const isEntering = s.phase === 'COMET' && id === s.incomingBadge
          el.style.transform = `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0)`
          el.style.opacity = (fadingOrb === id) ? '0' : '1'
          el.style.zIndex = isEntering ? '35' : '10'
        }
      })

      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)
    return () => {
      if (animId) cancelAnimationFrame(animId)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [fadingOrb])

  const centerConfig = PLATFORM_CONFIG[centerBadge] || PLATFORM_CONFIG.skills
  const CenterIcon = centerConfig.icon

  return (
    <div
      ref={stageRef}
      className="relative w-full h-[100svh] min-h-[100svh] overflow-hidden bg-[#000000] text-white flex flex-col justify-between items-center select-none"
    >
      {/* Background Water Ripple Canvas */}
      <div className="absolute inset-0 pointer-events-auto z-0">
        <WaterRippleCanvas ref={canvasRef} />
      </div>

      {/* Screen 2 Content & Orbit Layer */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center w-full max-w-xl px-4 py-8 pointer-events-none">
        
        {/* Heading: "Do you have" */}
        <div ref={headingRef} className="text-center mb-6 pointer-events-auto">
          <p className="text-sm uppercase tracking-widest text-white/40 font-semibold mb-1">
            Proven engineering telemetry
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Do you have
          </h2>
        </div>

        {/* Orbit container around Center Slot */}
        <div className="relative flex items-center justify-center my-6">
          {/* Floating Orbiting Orbs */}
          {BADGES.map((id) => {
            const config = PLATFORM_CONFIG[id]
            const IconComp = config.icon
            const isCenter = id === centerBadge
            if (isCenter) return null

            return (
              <div
                key={id}
                id={`orb-${id}`}
                className="absolute top-1/2 left-1/2 -ml-6 -mt-6 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border border-white/20 bg-[#0d0d12]/90 backdrop-blur-md shadow-lg pointer-events-auto transition-opacity duration-300 will-change-transform"
                style={{
                  boxShadow: `0 0 24px ${config.color}20`,
                }}
              >
                <IconComp size={24} color={config.color} />
              </div>
            )
          })}

          {/* Center Orb Slot */}
          <div
            ref={slotRef}
            className="relative z-30 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center border-2 border-white/30 bg-[#12121a]/95 backdrop-blur-xl shadow-2xl pointer-events-auto"
            style={{
              boxShadow: `0 0 36px ${centerConfig.color}40`,
            }}
          >
            <CenterIcon
              size={32}
              color={centerConfig.color}
              className={`transition-all duration-300 ${isTextFading ? 'scale-90 opacity-40' : 'scale-100 opacity-100'}`}
            />
          </div>
        </div>

        {/* Stat Caption */}
        <div ref={captionRef} className="text-center my-4 min-h-[56px] pointer-events-auto">
          <div
            key={captionKey}
            className={`transition-opacity duration-300 ${isTextFading ? 'opacity-0' : 'opacity-100'}`}
          >
            <div className="text-2xl sm:text-3xl font-black text-white">
              {displayedPercent}% verified match
            </div>
            <p className="text-xs sm:text-sm text-white/50 tracking-wide mt-1">
              {centerConfig.name} activity cryptographic verification
            </p>
          </div>
        </div>

        {/* Primary CTA Button: "Get a job you'll love" */}
        <div ref={ctaRef} className="mt-4 pointer-events-auto">
          <Link
            to="/auth"
            className={`relative inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-semibold text-sm sm:text-base text-black bg-white hover:bg-white/90 transition-all duration-300 shadow-xl overflow-hidden group ${
              isCtaShimmering ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''
            }`}
          >
            <span>Get a job you'll love</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            <span
              className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full ${
                isCtaShimmering ? 'animate-shimmer' : ''
              }`}
            />
          </Link>
        </div>

        {/* The Three Trust Ticks */}
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

      {/* Minimal Footer Line */}
      <footer
        ref={footerRef}
        className="relative z-20 w-full py-4 px-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs text-white/35 pointer-events-auto"
      >
        <div className="flex items-center gap-4">
          <Link to="/about" className="hover:text-white/70 transition-colors">
            About
          </Link>
          <Link to="/about" className="hover:text-white/70 transition-colors">
            Privacy policy
          </Link>
          <Link to="/about" className="hover:text-white/70 transition-colors">
            Terms of service
          </Link>
        </div>
        <p className="text-right">
          &copy; {new Date().getFullYear()}. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
