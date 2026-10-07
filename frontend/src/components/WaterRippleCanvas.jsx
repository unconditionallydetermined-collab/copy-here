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

  useImperativeHandle(ref, () => ({
    triggerSlam: (clientX, clientY, options = {}) => {
      triggerSlamInternal(clientX, clientY, options)
    },
    setHoverLights: (lights = []) => {
      hoverLightsRef.current = lights
    },
  }))

  const triggerSlamInternal = (clientX, clientY, options = {}) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = clientX !== undefined ? clientX - rect.left : rect.width / 2
    const y = clientY !== undefined ? clientY - rect.top : rect.height / 2

    const intensity = options.intensity || 320
    const blastRadius = options.blastRadius || 110

    // Concentric propagating wave
    wavesRef.current.push({
      x,
      y,
      radius: 0,
      speed: 520,
      maxRadius: Math.max(rect.width, rect.height) * 0.95,
      intensity,
      width: 58,
      life: 1.0,
      decay: 0.65,
    })

    // Immediate physical grid splash displacement
    const dots = dotsRef.current
    for (let i = 0; i < dots.length; i++) {
      const dot = dots[i]
      const dx = dot.x - x
      const dy = dot.y - y
      const distSq = dx * dx + dy * dy

      if (distSq < blastRadius * blastRadius && distSq > 0.001) {
        const dist = Math.sqrt(distSq)
        const falloff = 1 - dist / blastRadius
        const blastForce = falloff * 260
        dot.vx += (dx / dist) * blastForce
        dot.vy += (dy / dist) * blastForce
      }
    }

    if (typeof onSlam === 'function') {
      onSlam({ x, y })
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
    const BASE_DOT_RADIUS = 1.35
    const K = 24
    const C = 3.2

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

    const handlePointerDown = (e) => {
      triggerSlamInternal(e.clientX, e.clientY, { intensity: 300, blastRadius: 100 })
    }

    canvas.addEventListener('pointerdown', handlePointerDown)

    let lastTime = performance.now()

    const render = (now) => {
      const rawDt = (now - lastTime) / 1000
      lastTime = now
      const dt = Math.min(rawDt, 0.033)

      const dots = dotsRef.current
      const waves = wavesRef.current
      const lights = hoverLightsRef.current

      // 1. Advance waves & propagate impulse across grid dots
      for (let i = waves.length - 1; i >= 0; i--) {
        const w = waves[i]
        w.radius += w.speed * dt
        w.life -= dt * w.decay
        w.intensity *= Math.exp(-1.4 * dt)

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
            const distanceAttenuation = 1 / (1 + dist * 0.002)
            const impulse = w.intensity * radialFalloff * distanceAttenuation

            dot.vx += (dx / dist) * impulse * dt * 30
            dot.vy += (dy / dist) * impulse * dt * 30
          }
        }

        if (w.life <= 0 || w.intensity < 0.2 || w.radius > w.maxRadius) {
          waves.splice(i, 1)
        }
      }

      // 2. Spring Physics
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

      // 3. Render dots with visible grid splash displacement & glow
      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, width, height)

      const LIGHT_RADIUS = 38
      const LIGHT_RADIUS_SQ = LIGHT_RADIUS * LIGHT_RADIUS

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i]
        const dx = dot.x - dot.ox
        const dy = dot.y - dot.oy
        const disp = Math.sqrt(dx * dx + dy * dy)

        let energy = Math.min(1, disp / 6)

        for (let l = 0; l < lights.length; l++) {
          const lx = lights[l].x - dot.ox
          const ly = lights[l].y - dot.oy
          const lDistSq = lx * lx + ly * ly
          if (lDistSq < LIGHT_RADIUS_SQ) {
            const lFactor = 1 - Math.sqrt(lDistSq) / LIGHT_RADIUS
            energy = Math.max(energy, lFactor * 0.95)
          }
        }

        const alpha = 0.35 + 0.6 * energy
        const radius = BASE_DOT_RADIUS + 1.1 * energy

        ctx.fillStyle = energy > 0.08
          ? `rgba(${Math.round(210 + 45 * energy)}, ${Math.round(220 + 35 * energy)}, 255, ${alpha.toFixed(3)})`
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
