import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'

const WaterRippleCanvas = forwardRef(function WaterRippleCanvas(
  { className = '', onSlam },
  ref
) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const dotsRef = useRef([])
  const wavesRef = useRef([])
  const wakesRef = useRef([])

  // Expose triggerSlam and addWake to parent
  useImperativeHandle(ref, () => ({
    triggerSlam: (clientX, clientY, options = {}) => {
      triggerSlamInternal(clientX, clientY, options)
    },
    addWake: (clientX, clientY, vx = 0, vy = 0, strength = 1) => {
      addWakeInternal(clientX, clientY, vx, vy, strength)
    },
  }))

  const triggerSlamInternal = (clientX, clientY, options = {}) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = clientX !== undefined ? clientX - rect.left : rect.width / 2
    const y = clientY !== undefined ? clientY - rect.top : rect.height / 2

    const intensity = options.intensity || 380
    const carveRadius = options.carveRadius || 36

    // Outward displacement wave
    wavesRef.current.push({
      x,
      y,
      radius: carveRadius * 0.5,
      speed: 460,
      maxRadius: Math.max(rect.width, rect.height) * 0.95,
      intensity,
      width: 64,
      life: 1.0,
      decay: 0.85,
    })

    // Carve out fluid: direct radial outward displacement forming an impact crater
    const dots = dotsRef.current
    const blastRadius = carveRadius * 2.8
    for (let i = 0; i < dots.length; i++) {
      const dot = dots[i]
      const dx = dot.ox - x
      const dy = dot.oy - y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < blastRadius && dist > 0.001) {
        // Carve cavity inside icon radius, crest water just outside
        const factor = dist < carveRadius ? 1.0 : Math.max(0, 1 - (dist - carveRadius) / (blastRadius - carveRadius))
        const force = factor * (intensity * 0.9)
        dot.vx += (dx / dist) * force
        dot.vy += (dy / dist) * force
      }
    }

    if (typeof onSlam === 'function') {
      onSlam({ x, y })
    }
  }

  const addWakeInternal = (clientX, clientY, vx = 0, vy = 0, strength = 1) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top

    // Soft wake ripple
    if (wakesRef.current.length < 35) {
      wakesRef.current.push({
        x,
        y,
        radius: 4,
        speed: 140,
        intensity: 28 * strength,
        life: 1.0,
        decay: 1.4,
      })
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })

    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)
    let dpr = window.devicePixelRatio || 1

    const SPACING = Math.max(22, Math.min(28, Math.floor(Math.min(width, height) / 32)))
    const BASE_DOT_RADIUS = 1.3
    const K = 20 // Natural spring stiffness
    const C = 2.1 // Smooth, silky fluid damping without sudden cutoff

    const initGrid = () => {
      dpr = window.devicePixelRatio || 1
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.scale(dpr, dpr)

      const cols = Math.ceil(width / SPACING) + 2
      const rows = Math.ceil(height / SPACING) + 2
      const offsetX = (width - (cols - 1) * SPACING) / 2
      const offsetY = (height - (rows - 1) * SPACING) / 2

      const dots = []
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const ox = offsetX + c * SPACING
          const oy = offsetY + r * SPACING
          dots.push({
            ox,
            oy,
            x: ox,
            y: oy,
            vx: 0,
            vy: 0,
          })
        }
      }
      dotsRef.current = dots
    }

    initGrid()

    const handleResize = () => {
      initGrid()
    }
    window.addEventListener('resize', handleResize)

    const handlePointerDown = (e) => {
      triggerSlamInternal(e.clientX, e.clientY, { intensity: 320 })
    }

    canvas.addEventListener('pointerdown', handlePointerDown)

    let lastTime = performance.now()

    const render = (now) => {
      const rawDt = (now - lastTime) / 1000
      lastTime = now
      const dt = Math.min(rawDt, 0.033)

      const dots = dotsRef.current
      const waves = wavesRef.current
      const wakes = wakesRef.current

      // 1. Advance impact waves
      for (let i = waves.length - 1; i >= 0; i--) {
        const w = waves[i]
        w.radius += w.speed * dt
        w.life -= dt * w.decay
        // Smooth exponential damping instead of abrupt step
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
            // Smooth cosine bell-curve for wavefront impulse
            const radialFalloff = 0.5 * (1 + Math.cos((Math.PI * diff) / waveFrontWidth))
            const distanceAttenuation = 1 / (1 + dist * 0.002)
            const impulse = w.intensity * radialFalloff * distanceAttenuation

            dot.vx += (dx / dist) * impulse * dt * 28
            dot.vy += (dy / dist) * impulse * dt * 28
          }
        }

        // Natural soft fadeout condition
        if (w.life <= 0 || w.intensity < 0.2 || w.radius > w.maxRadius) {
          waves.splice(i, 1)
        }
      }

      // 2. Advance moving icon wakes
      for (let i = wakes.length - 1; i >= 0; i--) {
        const wk = wakes[i]
        wk.radius += wk.speed * dt
        wk.life -= dt * wk.decay
        wk.intensity *= Math.exp(-2.4 * dt)

        const rMin = Math.max(0, wk.radius - 24)
        const rMax = wk.radius + 24
        const rMinSq = rMin * rMin
        const rMaxSq = rMax * rMax

        for (let j = 0; j < dots.length; j++) {
          const dot = dots[j]
          const dx = dot.ox - wk.x
          const dy = dot.oy - wk.y
          const distSq = dx * dx + dy * dy

          if (distSq >= rMinSq && distSq <= rMaxSq && distSq > 0.0001) {
            const dist = Math.sqrt(distSq)
            const diff = Math.abs(dist - wk.radius)
            const falloff = 0.5 * (1 + Math.cos((Math.PI * diff) / 24))
            const impulse = wk.intensity * falloff
            dot.vx += (dx / dist) * impulse * dt * 18
            dot.vy += (dy / dist) * impulse * dt * 18
          }
        }

        if (wk.life <= 0 || wk.intensity < 0.1) {
          wakes.splice(i, 1)
        }
      }

      // 3. Fluid particle spring physics
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i]
        const dispX = dot.x - dot.ox
        const dispY = dot.y - dot.oy

        const fx = -K * dispX - C * dot.vx
        const fy = -K * dispY - C * dot.vy

        dot.vx += fx * dt
        dot.vy += fy * dt

        dot.x += dot.vx * dt
        dot.y += dot.vy * dt
      }

      // 4. Render dots with continuous smooth luminance and radius gradient
      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, width, height)

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i]
        const dx = dot.x - dot.ox
        const dy = dot.y - dot.oy
        const disp = Math.sqrt(dx * dx + dy * dy)

        // Smooth normalized excitation factor [0 .. 1]
        const energy = Math.min(1, disp / 12)
        const alpha = 0.35 + 0.6 * energy
        const radius = BASE_DOT_RADIUS + 0.9 * energy

        // Smooth transition from calm muted zinc to brilliant fluid crest
        ctx.fillStyle = energy > 0.1
          ? `rgba(${Math.round(200 + 55 * energy)}, ${Math.round(210 + 45 * energy)}, 255, ${alpha.toFixed(3)})`
          : 'rgba(180, 185, 195, 0.38)'

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
      if (animRef.current) {
        cancelAnimationFrame(animRef.current)
      }
    }
  }, [onSlam])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 block w-full h-full cursor-pointer touch-none select-none ${className}`}
      style={{ touchAction: 'none' }}
    />
  )
})

export default WaterRippleCanvas
