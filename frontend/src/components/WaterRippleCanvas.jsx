import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'

// Safe haptic feedback with varying fluid intensity
const triggerHaptic = (pattern) => {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern)
    } catch {
      // Ignore vibration unsupported/permission errors
    }
  }
}

const WaterRippleCanvas = forwardRef(function WaterRippleCanvas(
  { className = '', onSlam },
  ref
) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const dotsRef = useRef([])
  const wavesRef = useRef([])
  const hoverLightsRef = useRef([])
  const glowDimRef = useRef(1.0)
  const wakePointsRef = useRef([])
  const lastWakeStampRef = useRef(0)
  const onSlamRef = useRef(onSlam)
  const boostUntilRef = useRef(0)
  const protectedRectRef = useRef(null)
  const lastHapticTimeRef = useRef(0)

  // Always keep latest onSlam callback without rebuilding canvas
  onSlamRef.current = onSlam

  useImperativeHandle(ref, () => ({
    triggerSlam: (clientX, clientY, options = {}) => {
      triggerSlamInternal(clientX, clientY, options)
    },
    triggerReverseWave: (clientX, clientY, options = {}) => {
      triggerReverseWaveInternal(clientX, clientY, options)
    },
    displaceAt: (clientX, clientY, force = 12) => {
      displaceAtCoord(clientX, clientY, Math.min(force, 15))
      const now = performance.now()
      if (now - lastHapticTimeRef.current > 75) {
        lastHapticTimeRef.current = now
        const hapticMs = Math.max(35, Math.min(75, Math.round(force * 3.5)))
        triggerHaptic(hapticMs)
      }
    },
    streamGlowToTarget: () => {},
    setHoverLights: (lights = [], dimFactor = 1.0) => {
      hoverLightsRef.current = lights
      glowDimRef.current = Math.max(0.1, Math.min(1.0, dimFactor))
    },
    boostDamping: (durationMs = 1200) => {
      boostUntilRef.current = performance.now() + durationMs
    },
    setProtectedRect: (rect) => {
      if (!rect) {
        protectedRectRef.current = null
        return
      }
      protectedRectRef.current = {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
      }
    },
    isSettled: () => {
      if (wavesRef.current.length > 0) return false
      const dots = dotsRef.current
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i]
        const dx = dot.x - dot.ox
        const dy = dot.y - dot.oy
        const dispSq = dx * dx + dy * dy
        if (dispSq >= 0.36) return false
        const velSq = dot.vx * dot.vx + dot.vy * dot.vy
        if (velSq >= 4) return false
      }
      return true
    },
  }))

  const displaceAtCoord = (clientX, clientY, force = 16) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    const blastRadius = 65
    const dots = dotsRef.current
    for (let i = 0; i < dots.length; i++) {
      const dot = dots[i]
      const dx = dot.ox - x
      const dy = dot.oy - y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < blastRadius && dist > 0.01) {
        const factor = (1 - dist / blastRadius) * force * 1.4
        dot.vx += (dx / dist) * factor
        dot.vy += (dy / dist) * factor
      }
    }
  }

  const triggerReverseWaveInternal = (clientX, clientY, options = {}) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = clientX !== undefined ? clientX - rect.left : rect.width / 2
    const y = clientY !== undefined ? clientY - rect.top : rect.height / 2

    const intensity = options.intensity ?? 125
    const waveSpeed = options.speed ?? 290
    const waveWidth = options.width ?? 65
    const startRadius = Math.min(420, options.startRadius ?? 360)

    wavesRef.current.push({
      x,
      y,
      radius: startRadius,
      speed: waveSpeed,
      maxRadius: startRadius,
      intensity,
      width: waveWidth,
      life: 1.2,
      decay: 0.95,
      reverse: true,
      onComplete: options.onComplete,
    })

    if (intensity >= 100) {
      triggerHaptic([40, 30, 80])
    }
  }

  const triggerSlamInternal = (clientX, clientY, options = {}) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = clientX !== undefined ? clientX - rect.left : rect.width / 2
    const y = clientY !== undefined ? clientY - rect.top : rect.height / 2

    // Calibrated high-impact fluid particle ripple
    const intensity = options.intensity ?? 135
    const waveSpeed = options.speed ?? 285
    const waveWidth = options.width ?? 62
    const maxRadius = Math.min(420, options.maxRadius ?? 360)
    const blastRadius = options.blastRadius ?? 140

    wavesRef.current.push({
      x,
      y,
      radius: 14,
      speed: waveSpeed,
      maxRadius,
      intensity,
      width: waveWidth,
      life: 1.1,
      decay: 1.05,
    })

    const dots = dotsRef.current
    for (let i = 0; i < dots.length; i++) {
      const dot = dots[i]
      const dx = dot.ox - x
      const dy = dot.oy - y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < blastRadius && dist > 0.001) {
        const factor = Math.max(0, 1 - dist / blastRadius)
        const force = factor * (intensity * 0.38)
        dot.vx += (dx / dist) * force
        dot.vy += (dy / dist) * force
      }
    }

    // Varying intensity haptic feedback for fluid wave / slam
    if (intensity >= 120) {
      triggerHaptic([90, 40, 130])
    } else if (intensity >= 70) {
      triggerHaptic([60, 30, 60])
    } else {
      triggerHaptic(50)
    }

    if (typeof onSlamRef.current === 'function') {
      onSlamRef.current({ x, y })
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })

    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)
    let dpr = Math.min(window.devicePixelRatio || 1, 2)

    const SPACING = Math.max(22, Math.min(28, Math.floor(Math.min(width, height) / 32)))
    const BASE_DOT_RADIUS = 1.55
    const BASE_K = 28
    const BASE_C = 6.2
    const MAX_DISP = 28
    const MAX_DISP_SQ = MAX_DISP * MAX_DISP

    const initGrid = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const cols = Math.ceil(width / SPACING) + 2
      const rows = Math.ceil(height / SPACING) + 2
      const offsetX = (width - (cols - 1) * SPACING) / 2
      const offsetY = (height - (rows - 1) * SPACING) / 2

      const dots = []
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const ox = offsetX + c * SPACING
          const oy = offsetY + r * SPACING
          dots.push({ ox, oy, x: ox, y: oy, vx: 0, vy: 0 })
        }
      }
      dotsRef.current = dots
    }

    initGrid()

    const handleResize = () => {
      initGrid()
    }
    window.addEventListener('resize', handleResize)

    // Interactive pointer fluid ripples with varying haptic intensity
    const handlePointerDown = (e) => {
      triggerSlamInternal(e.clientX, e.clientY, {
        intensity: 85,
        speed: 230,
        maxRadius: 260,
        blastRadius: 90,
      })
    }

    const handlePointerMove = (e) => {
      if (e.buttons > 0) {
        displaceAtCoord(e.clientX, e.clientY, 14)
        const now = performance.now()
        if (now - lastHapticTimeRef.current > 65) {
          lastHapticTimeRef.current = now
          triggerHaptic(45)
        }
      }
    }

    canvas.addEventListener('pointerdown', handlePointerDown)
    const handleTouchStart = (e) => {
      if (e.touches && e.touches[0]) {
        triggerHaptic([80, 40, 100])
        triggerSlamInternal(e.touches[0].clientX, e.touches[0].clientY, {
          intensity: 110,
          speed: 260,
          maxRadius: 300,
          blastRadius: 100,
        })
      }
    }
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true })
    canvas.addEventListener('pointermove', handlePointerMove)

    let lastTime = performance.now()

    const render = (now) => {
      if (document.visibilityState === 'hidden') {
        lastTime = now
        animRef.current = requestAnimationFrame(render)
        return
      }

      const rawDt = (now - lastTime) / 1000
      lastTime = now
      const dt = Math.min(rawDt, 0.033)

      const dots = dotsRef.current
      const waves = wavesRef.current
      const lights = hoverLightsRef.current
      const dimFactor = glowDimRef.current
      const protRect = protectedRectRef.current

      // Trailing water wake stamps from moving orbs
      const wakePoints = wakePointsRef.current
      if (now - lastWakeStampRef.current >= 28) {
        lastWakeStampRef.current = now
        for (let l = 0; l < lights.length; l++) {
          const light = lights[l]
          if (light.moving) {
            wakePoints.push({
              x: light.x,
              y: light.y,
              birth: now,
              maxAge: 700,
            })
          }
        }
      }

      for (let i = wakePoints.length - 1; i >= 0; i--) {
        if (now - wakePoints[i].birth > wakePoints[i].maxAge) {
          wakePoints.splice(i, 1)
        }
      }

      // Gentle fluid skim displacement from moving orbs
      for (let l = 0; l < lights.length; l++) {
        const light = lights[l]
        if (!light.moving) continue
        const skimRadius = 45
        for (let j = 0; j < dots.length; j++) {
          const dot = dots[j]
          const dx = dot.ox - light.x
          const dy = dot.oy - light.y
          const dSq = dx * dx + dy * dy
          if (dSq < skimRadius * skimRadius && dSq > 1) {
            const d = Math.sqrt(dSq)
            const push = (1 - d / skimRadius) * 22 * dt
            dot.vx += (dx / d) * push
            dot.vy += (dy / d) * push
          }
        }
      }

      // Active damping with temporary boost on impact
      const isDampingBoosted = now < boostUntilRef.current
      const currentC = isDampingBoosted ? BASE_C * 2.1 : BASE_C
      const currentK = BASE_K

      // 1. Advance waves (both outward splash and inward reverse wave)
      for (let i = waves.length - 1; i >= 0; i--) {
        const w = waves[i]
        const isReverse = !!w.reverse

        if (isReverse) {
          w.radius -= w.speed * dt
        } else {
          w.radius += w.speed * dt
        }
        w.life -= dt * w.decay
        w.intensity *= Math.exp(-1.8 * dt)

        const waveFrontWidth = w.width
        const rMin = Math.max(0, w.radius - waveFrontWidth)
        const rMax = w.radius + waveFrontWidth
        const rMinSq = rMin * rMin
        const rMaxSq = rMax * rMax

        for (let j = 0; j < dots.length; j++) {
          const dot = dots[j]
          const dx = dot.ox - w.x
          const dy = dot.oy - w.y
          const distSq = dx * dx + dy * dy

          if (distSq >= rMinSq && distSq <= rMaxSq && distSq > 0.0001) {
            const dist = Math.sqrt(distSq)
            const diff = Math.abs(dist - w.radius)
            const radialFalloff = 0.5 * (1 + Math.cos((Math.PI * diff) / waveFrontWidth))
            const distanceAttenuation = 1 / (1 + dist * 0.004)
            const impulse = w.intensity * radialFalloff * distanceAttenuation

            // Outward or inward impulse direction
            const dirMultiplier = isReverse ? -1 : 1
            dot.vx += (dx / dist) * impulse * dt * 26 * dirMultiplier
            dot.vy += (dy / dist) * impulse * dt * 26 * dirMultiplier
          }
        }

        const isFinished = isReverse
          ? w.radius <= 10 || w.life <= 0
          : w.life <= 0 || w.intensity < 0.2 || w.radius > w.maxRadius

        if (isFinished) {
          if (typeof w.onComplete === 'function') {
            try { w.onComplete() } catch {}
          }
          waves.splice(i, 1)
        }
      }

      // 2. Fluid spring physics & displacement clamping
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i]
        const dispX = dot.x - dot.ox
        const dispY = dot.y - dot.oy

        const fx = -currentK * dispX - currentC * dot.vx
        const fy = -currentK * dispY - currentC * dot.vy

        dot.vx += fx * dt
        dot.vy += fy * dt

        dot.x += dot.vx * dt
        dot.y += dot.vy * dt

        const currentDispSq = (dot.x - dot.ox) ** 2 + (dot.y - dot.oy) ** 2
        if (currentDispSq > MAX_DISP_SQ) {
          const currentDisp = Math.sqrt(currentDispSq)
          const scale = MAX_DISP / currentDisp
          dot.x = dot.ox + (dot.x - dot.ox) * scale
          dot.y = dot.oy + (dot.y - dot.oy) * scale
        }
      }

      // 3. Render dots
      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, width, height)

      const ACTIVE_ORB_LIGHT_RADIUS = 48
      const ACTIVE_ORB_LIGHT_RADIUS_SQ = ACTIVE_ORB_LIGHT_RADIUS * ACTIVE_ORB_LIGHT_RADIUS

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i]
        const dx = dot.x - dot.ox
        const dy = dot.y - dot.oy
        const disp = Math.sqrt(dx * dx + dy * dy)

        let energy = Math.min(1, disp / 7)

        // Dynamic fluid glow under currently passing orbs
        for (let l = 0; l < lights.length; l++) {
          const lx = lights[l].x - dot.ox
          const ly = lights[l].y - dot.oy
          const lDistSq = lx * lx + ly * ly
          if (lDistSq < ACTIVE_ORB_LIGHT_RADIUS_SQ) {
            const lFactor = 1 - Math.sqrt(lDistSq) / ACTIVE_ORB_LIGHT_RADIUS
            const orbGlow = lFactor * 0.75 * dimFactor
            energy = Math.max(energy, orbGlow)
          }
        }

        // Skimming water wake
        for (let w = 0; w < wakePoints.length; w++) {
          const wp = wakePoints[w]
          const wx = wp.x - dot.ox
          const wy = wp.y - dot.oy
          const wDistSq = wx * wx + wy * wy
          const wakeRadius = 40
          if (wDistSq < wakeRadius * wakeRadius) {
            const wakeAgeNorm = (now - wp.birth) / wp.maxAge
            const timeFade = Math.pow(1 - wakeAgeNorm, 1.6)
            const spatialFade = 1 - Math.sqrt(wDistSq) / wakeRadius
            const wakeGlow = spatialFade * timeFade * 0.55 * dimFactor
            energy = Math.max(energy, wakeGlow)
          }
        }

        // Dot highlights suppressed inside exclusion zone
        if (protRect) {
          if (
            dot.ox >= protRect.left &&
            dot.ox <= protRect.right &&
            dot.oy >= protRect.top &&
            dot.oy <= protRect.bottom
          ) {
            energy = Math.min(energy, 0.28)
          }
        }

        // Bottom edge gradient
        const distFromBottom = height - dot.oy
        const BOTTOM_FADE_MARGIN = Math.max(220, Math.min(320, height * 0.3))
        const bottomFactor = Math.min(1, Math.max(0, distFromBottom / BOTTOM_FADE_MARGIN))
        const bottomGradient = 0.5 - 0.5 * Math.cos(bottomFactor * Math.PI)

        const baseAlpha = Math.min(0.92, 0.40 + 0.52 * energy)
        const alpha = baseAlpha * bottomGradient
        const radius = (BASE_DOT_RADIUS + 0.85 * energy) * Math.max(0.65, bottomGradient)

        ctx.fillStyle =
          energy > 0.06
            ? `rgba(${Math.round(215 + 40 * energy)}, ${Math.round(225 + 30 * energy)}, 255, ${alpha.toFixed(3)})`
            : `rgba(185, 195, 210, ${(0.38 * bottomGradient).toFixed(3)})`

        ctx.beginPath()
        ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2)
        ctx.fill()
      }

      animRef.current = requestAnimationFrame(render)
    }

    animRef.current = requestAnimationFrame(render)

    return () => {
      window.removeEventListener('resize', handleResize)
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('pointermove', handlePointerMove)
      if (animRef.current) {
        cancelAnimationFrame(animRef.current)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ touchAction: 'none' }} className={'absolute inset-0 block w-full h-full ' + className}
    />
  )
})

export default WaterRippleCanvas
