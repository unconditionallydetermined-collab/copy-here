import React, { useRef, useEffect } from 'react'

export default function WaterRippleCanvas({ className = '', onSlam }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const dotsRef = useRef([])
  const wavesRef = useRef([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })

    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)
    let dpr = window.devicePixelRatio || 1

    const SPACING = Math.max(22, Math.min(30, Math.floor(Math.min(width, height) / 30)))
    const DOT_RADIUS = 1.35
    const K = 32 // Spring stiffness constant
    const C = 4.8 // Damping constant (heavy damping for viscous water return)

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

    // Impact / Slamming wave trigger
    const triggerSlam = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect()
      const x = clientX - rect.left
      const y = clientY - rect.top

      // Add symmetric concentric wave
      wavesRef.current.push({
        x,
        y,
        radius: 0,
        speed: 580, // pixels per second
        maxRadius: Math.max(width, height) * 0.95,
        intensity: 260,
        width: 48,
        life: 1.0,
      })

      // Immediate epicenter explosive outward impulse for closest dots
      const dots = dotsRef.current
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i]
        const dx = dot.x - x
        const dy = dot.y - y
        const distSq = dx * dx + dy * dy
        const blastRadius = 90
        if (distSq < blastRadius * blastRadius && distSq > 0.001) {
          const dist = Math.sqrt(distSq)
          const falloff = 1 - dist / blastRadius
          const blastForce = falloff * 240
          dot.vx += (dx / dist) * blastForce
          dot.vy += (dy / dist) * blastForce
        }
      }

      if (typeof onSlam === 'function') {
        onSlam({ x, y })
      }
    }

    // Pointer events for instant touch/click without 300ms delay
    const handlePointerDown = (e) => {
      triggerSlam(e.clientX, e.clientY)
    }

    canvas.addEventListener('pointerdown', handlePointerDown)

    // Trigger initial welcoming gentle ripple from center after 400ms
    const introTimer = setTimeout(() => {
      triggerSlam(width / 2, height / 2)
    }, 450)

    // Animation Loop
    let lastTime = performance.now()

    const render = (now) => {
      const rawDt = (now - lastTime) / 1000
      lastTime = now
      // Clamp dt to avoid physics blowups on tab backgrounding
      const dt = Math.min(rawDt, 0.033)

      const dots = dotsRef.current
      const waves = wavesRef.current

      // 1. Advance waves
      for (let i = waves.length - 1; i >= 0; i--) {
        const w = waves[i]
        w.radius += w.speed * dt
        w.life -= dt * 0.65
        w.intensity *= Math.pow(0.28, dt)

        // Wave propagation impulse on particles in the wavefront
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
            const radialFalloff = 1 - diff / waveFrontWidth
            const distanceAttenuation = 1 / (1 + dist * 0.0025)
            const impulse = w.intensity * radialFalloff * distanceAttenuation

            dot.vx += (dx / dist) * impulse * dt * 32
            dot.vy += (dy / dist) * impulse * dt * 32
          }
        }

        if (w.life <= 0 || w.radius > w.maxRadius || w.intensity < 0.5) {
          waves.splice(i, 1)
        }
      }

      // 2. Spring Physics (Force = -k * displacement - c * velocity)
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

      // 3. Render Canvas
      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, width, height)

      // Render dots batch
      // Base color: rgba(220, 220, 220, 0.6)
      // Active wave dots subtly elevate to brighter white rgba(255, 255, 255, 0.95)
      ctx.fillStyle = 'rgba(220, 220, 220, 0.6)'
      ctx.beginPath()
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i]
        const dispSq = (dot.x - dot.ox) * (dot.x - dot.ox) + (dot.y - dot.oy) * (dot.y - dot.oy)
        if (dispSq < 4) {
          ctx.moveTo(dot.x + DOT_RADIUS, dot.y)
          ctx.arc(dot.x, dot.y, DOT_RADIUS, 0, Math.PI * 2)
        }
      }
      ctx.fill()

      // High-energy dots with ethereal glow/brightness
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
      ctx.beginPath()
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i]
        const dispSq = (dot.x - dot.ox) * (dot.x - dot.ox) + (dot.y - dot.oy) * (dot.y - dot.oy)
        if (dispSq >= 4) {
          const r = DOT_RADIUS + Math.min(1.0, Math.sqrt(dispSq) * 0.08)
          ctx.moveTo(dot.x + r, dot.y)
          ctx.arc(dot.x, dot.y, r, 0, Math.PI * 2)
        }
      }
      ctx.fill()

      animRef.current = requestAnimationFrame(render)
    }

    animRef.current = requestAnimationFrame(render)

    return () => {
      window.removeEventListener('resize', handleResize)
      canvas.removeEventListener('pointerdown', handlePointerDown)
      clearTimeout(introTimer)
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
}
