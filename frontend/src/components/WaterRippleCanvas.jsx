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
    displaceAt: (clientX, clientY, force = 90) => {
      displaceAtCoord(clientX, clientY, force)
    },
    streamGlowToTarget: () => {},
    setHoverLights: (lights = []) => {
      hoverLightsRef.current = lights
    },
  }))

  const displaceAtCoord = (clientX, clientY, force = 60) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    const blastRadius = 70
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

    const intensity = options.intensity || 190
    const carveRadius = options.carveRadius || 34

    wavesRef.current.push({
      x,
      y,
      radius: carveRadius * 0.5,
      speed: 360,
      maxRadius: Math.max(rect.width, rect.height) * 0.85,
      intensity,
      width: 50,
      life: 1.0,
      decay: 0.75,
    })

    const dots = dotsRef.current
    const blastRadius = carveRadius * 2.2
    for (let i = 0; i < dots.length; i++) {
      const dot = dots[i]
      const dx = dot.ox - x
      const dy = dot.oy - y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < blastRadius && dist > 0.001) {
        const factor = dist < carveRadius ? 0.75 : Math.max(0, 1 - (dist - carveRadius) / (blastRadius - carveRadius))
        const force = factor * (intensity * 0.45)
        dot.vx += (dx / dist) * force
        dot.vy += (dy / dist) * force
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
    const BASE_DOT_RADIUS = 1.3
    const K = 22
    const C = 2.4

    const initGrid = () => {
      dpr = window.devicePixelRatio || 1
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'
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

    let lastTime = performance.now()

    const render = (now) => {
      const rawDt = (now - lastTime) / 1000
      lastTime = now
      const dt = Math.min(rawDt, 0.033)

      const dots = dotsRef.current
      const waves = wavesRef.current
      const lights = hoverLightsRef.current

      // 1. Advance waves
      for (let i = waves.length - 1; i >= 0; i--) {
        const w = waves[i]
        w.radius += w.speed * dt
        w.life -= dt * w.decay
        w.intensity *= Math.exp(-1.6 * dt)

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
            const distanceAttenuation = 1 / (1 + dist * 0.0025)
            const impulse = w.intensity * radialFalloff * distanceAttenuation

            dot.vx += (dx / dist) * impulse * dt * 20
            dot.vy += (dy / dist) * impulse * dt * 20
          }
        }

        if (w.life <= 0 || w.intensity < 0.2 || w.radius > w.maxRadius) {
          waves.splice(i, 1)
        }
      }

      // 2. Fluid spring physics
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

      // 3. Render dots with light-up under icons (no drag)
      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, width, height)

      const LIGHT_RADIUS = 38
      const LIGHT_RADIUS_SQ = LIGHT_RADIUS * LIGHT_RADIUS

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i]
        const dx = dot.x - dot.ox
        const dy = dot.y - dot.oy
        const disp = Math.sqrt(dx * dx + dy * dy)

        // Wave excitation
        let energy = Math.min(1, disp / 10)

        // Light-up effect from overhead icons
        for (let l = 0; l < lights.length; l++) {
          const lx = lights[l].x - dot.ox
          const ly = lights[l].y - dot.oy
          const lDistSq = lx * lx + ly * ly
          if (lDistSq < LIGHT_RADIUS_SQ) {
            const lFactor = 1 - Math.sqrt(lDistSq) / LIGHT_RADIUS
            energy = Math.max(energy, lFactor * 0.95)
          }
        }

        const alpha = 0.35 + 0.58 * energy
        const radius = BASE_DOT_RADIUS + 0.8 * energy

        ctx.fillStyle = energy > 0.08
          ? 'rgba(' + Math.round(200 + 55 * energy) + ', ' + Math.round(210 + 45 * energy) + ', 255, ' + alpha.toFixed(3) + ')'
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
  }, [onSlam])

  return (
    <canvas
      ref={canvasRef}
      className={'absolute inset-0 block w-full h-full pointer-events-none select-none ' + className}
    />
  )
})

export default WaterRippleCanvas
