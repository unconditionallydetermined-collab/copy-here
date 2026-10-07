import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'

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
  const onSlamRef = useRef(onSlam)
  const boostUntilRef = useRef(0)
  const protectedRectRef = useRef(null)

  // Always keep latest onSlam callback without rebuilding canvas
  onSlamRef.current = onSlam

  useImperativeHandle(ref, () => ({
    triggerSlam: (clientX, clientY, options = {}) => {
      triggerSlamInternal(clientX, clientY, options)
    },
    displaceAt: (clientX, clientY, force = 12) => {
      displaceAtCoord(clientX, clientY, Math.min(force, 15))
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
      // Expand by 16px safety padding
      protectedRectRef.current = {
        left: rect.left - 16,
        top: rect.top - 16,
        right: rect.right + 16,
        bottom: rect.bottom + 16,
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
        if (dispSq >= 0.36) return false // sqrt(dispSq) >= 0.6px
        const velSq = dot.vx * dot.vx + dot.vy * dot.vy
        if (velSq >= 4) return false // sqrt(velSq) >= 2px/s
      }
      return true
    },
  }))

  const displaceAtCoord = (clientX, clientY, force = 12) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    const blastRadius = 40
    const dots = dotsRef.current
    for (let i = 0; i < dots.length; i++) {
      const dot = dots[i]
      const dx = dot.ox - x
      const dy = dot.oy - y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < blastRadius && dist > 0.01) {
        const factor = (1 - dist / blastRadius) * force
        dot.vx += (dx / dist) * factor
        dot.vy += (dy / dist) * factor
      }
    }
  }

  const triggerSlamInternal = (clientX, clientY, options = {}) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = clientX !== undefined ? clientX - rect.left : rect.width / 2
    const y = clientY !== undefined ? clientY - rect.top : rect.height / 2

    // Calibrated soft ripple: peak radius ~220px, settles within ~900ms
    const intensity = options.intensity ?? 105
    const waveSpeed = options.speed ?? 270
    const waveWidth = options.width ?? 54
    const maxRadius = Math.min(360, options.maxRadius ?? 330)
    const blastRadius = options.blastRadius ?? 90

    wavesRef.current.push({
      x,
      y,
      radius: 12,
      speed: waveSpeed,
      maxRadius,
      intensity,
      width: waveWidth,
      life: 1.0,
      decay: 1.15, // Wave fully expires within ~900ms
    })

    const dots = dotsRef.current
    for (let i = 0; i < dots.length; i++) {
      const dot = dots[i]
      const dx = dot.ox - x
      const dy = dot.oy - y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < blastRadius && dist > 0.001) {
        const factor = Math.max(0, 1 - dist / blastRadius)
        const force = factor * (intensity * 0.16)
        dot.vx += (dx / dist) * force
        dot.vy += (dy / dist) * force
      }
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
    const BASE_DOT_RADIUS = 1.3
    const BASE_K = 30
    const BASE_C = 7
    const MAX_DISP = 14
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

      // Active damping with temporary boost on impact
      const isDampingBoosted = now < boostUntilRef.current
      const currentC = isDampingBoosted ? BASE_C * 2.1 : BASE_C
      const currentK = BASE_K

      // 1. Advance waves
      for (let i = waves.length - 1; i >= 0; i--) {
        const w = waves[i]
        w.radius += w.speed * dt
        w.life -= dt * w.decay
        w.intensity *= Math.exp(-2.2 * dt)

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

            dot.vx += (dx / dist) * impulse * dt * 12
            dot.vy += (dy / dist) * impulse * dt * 12
          }
        }

        if (w.life <= 0 || w.intensity < 0.2 || w.radius > w.maxRadius) {
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

        // Clamp displacement to <= 14px
        const currentDispSq = (dot.x - dot.ox) ** 2 + (dot.y - dot.oy) ** 2
        if (currentDispSq > MAX_DISP_SQ) {
          const currentDisp = Math.sqrt(currentDispSq)
          const scale = MAX_DISP / currentDisp
          dot.x = dot.ox + (dot.x - dot.ox) * scale
          dot.y = dot.oy + (dot.y - dot.oy) * scale
        }
      }

      // 3. Render dots with controlled subtle highlight under icons
      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, width, height)

      const LIGHT_RADIUS = 28
      const LIGHT_RADIUS_SQ = LIGHT_RADIUS * LIGHT_RADIUS

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i]
        const dx = dot.x - dot.ox
        const dy = dot.y - dot.oy
        const disp = Math.sqrt(dx * dx + dy * dy)

        // Wave excitation capped
        let energy = Math.min(1, disp / 8)

        // Single soft light-up under floating icons (no extra wake)
        for (let l = 0; l < lights.length; l++) {
          const lx = lights[l].x - dot.ox
          const ly = lights[l].y - dot.oy
          const lDistSq = lx * lx + ly * ly
          if (lDistSq < LIGHT_RADIUS_SQ) {
            const lFactor = 1 - Math.sqrt(lDistSq) / LIGHT_RADIUS
            energy = Math.max(energy, lFactor * 0.6 * dimFactor)
          }
        }

        // Protected zone: keep dot energy <= 0.2 inside content exclusion zone
        if (protRect) {
          if (
            dot.ox >= protRect.left &&
            dot.ox <= protRect.right &&
            dot.oy >= protRect.top &&
            dot.oy <= protRect.bottom
          ) {
            energy = Math.min(energy, 0.2)
          }
        }

        // Strict alpha cap at 0.55 and radius growth at +0.35px
        const alpha = 0.35 + 0.20 * energy
        const radius = BASE_DOT_RADIUS + 0.35 * energy

        ctx.fillStyle =
          energy > 0.08
            ? `rgba(${Math.round(200 + 35 * energy)}, ${Math.round(210 + 30 * energy)}, 255, ${alpha.toFixed(3)})`
            : 'rgba(180, 185, 195, 0.35)'

        ctx.beginPath()
        ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2)
        ctx.fill()
      }

      animRef.current = requestAnimationFrame(render)
    }

    animRef.current = requestAnimationFrame(render)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animRef.current) {
        cancelAnimationFrame(animRef.current)
      }
    }
  }, []) // Empty deps ensures grid is never rebuilt on re-render

  return (
    <canvas
      ref={canvasRef}
      className={'absolute inset-0 block w-full h-full pointer-events-none select-none ' + className}
    />
  )
})

export default WaterRippleCanvas
