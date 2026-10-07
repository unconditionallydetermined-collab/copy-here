import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'

const WaterRippleCanvas = forwardRef(function WaterRippleCanvas(
  { className = '', onSlam },
  ref
) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const dotsRef = useRef([])
  const wavesRef = useRef([])
  const surgeWavesRef = useRef([])
  const hoverLightsRef = useRef([])
  const streamParticlesRef = useRef([])
  const glowDimRef = useRef(1.0)

  useImperativeHandle(ref, () => ({
    triggerSlam: (clientX, clientY, options = {}) => {
      triggerSlamInternal(clientX, clientY, options)
    },
    streamGlowToTarget: (targetX, targetY) => {
      startGlowStream(targetX, targetY)
    },
    setHoverLights: (lights = [], dim = 1.0) => {
      hoverLightsRef.current = lights
      glowDimRef.current = dim
    },
  }))

  const triggerSlamInternal = (clientX, clientY, options = {}) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = clientX !== undefined ? clientX - rect.left : rect.width / 2
    const y = clientY !== undefined ? clientY - rect.top : rect.height / 2

    const intensity = options.intensity || 380
    const blastRadius = options.blastRadius || 140
    const targetX = options.targetX ?? (rect.width / 2)
    const targetY = options.targetY ?? (rect.height * 0.72)

    // 1. Concentric physical ripple waves with visible refractive rings
    wavesRef.current.push({
      x,
      y,
      radius: 0,
      speed: 480,
      maxRadius: Math.max(rect.width, rect.height) * 0.95,
      intensity,
      width: 70,
      life: 1.0,
      decay: 0.55,
    })

    // 2. Visible directed water surge wave traveling straight down to CTA button
    surgeWavesRef.current.push({
      startX: x,
      startY: y,
      targetX,
      targetY,
      progress: 0,
      speed: 0.55, // reaches CTA in ~1.8s
      width: 120,
      alpha: 1.0,
    })

    // 3. Grid splash displacement
    const dots = dotsRef.current
    for (let i = 0; i < dots.length; i++) {
      const dot = dots[i]
      const dx = dot.x - x
      const dy = dot.y - y
      const distSq = dx * dx + dy * dy

      if (distSq < blastRadius * blastRadius && distSq > 0.001) {
        const dist = Math.sqrt(distSq)
        const falloff = 1 - dist / blastRadius
        const blastForce = falloff * 320
        dot.vx += (dx / dist) * blastForce
        dot.vy += (dy / dist) * blastForce
      }
    }

    // 4. Returning glowing dots ride along the wave crest toward CTA
    setTimeout(() => {
      const particles = []
      const count = 48
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4
        const dist = 60 + Math.random() * 110
        particles.push({
          x: x + Math.cos(angle) * dist,
          y: y + Math.sin(angle) * dist,
          vx: Math.cos(angle) * 20,
          vy: Math.sin(angle) * 20,
          targetX,
          targetY,
          progress: 0,
          speed: 0.52 + Math.random() * 0.28,
          alpha: 1.0,
          size: 2.2 + Math.random() * 2.4,
          hue: 200 + Math.random() * 25,
        })
      }
      streamParticlesRef.current.push(...particles)
    }, 450)

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
      triggerSlamInternal(e.clientX, e.clientY, { intensity: 320, blastRadius: 110 })
    }

    canvas.addEventListener('pointerdown', handlePointerDown)

    let lastTime = performance.now()

    const render = (now) => {
      const rawDt = (now - lastTime) / 1000
      lastTime = now
      const dt = Math.min(rawDt, 0.033)

      const dots = dotsRef.current
      const waves = wavesRef.current
      const surgeWaves = surgeWavesRef.current
      const lights = hoverLightsRef.current
      const particles = streamParticlesRef.current
      const dimFactor = glowDimRef.current

      // 1. Advance waves & calculate dot impulse
      for (let i = waves.length - 1; i >= 0; i--) {
        const w = waves[i]
        w.radius += w.speed * dt
        w.life -= dt * w.decay
        w.intensity *= Math.exp(-1.3 * dt)

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

      // 3. Clear canvas
      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, width, height)

      // 4. Render visible concentric water wave rings
      ctx.save()
      for (let i = 0; i < waves.length; i++) {
        const w = waves[i]
        const ringAlpha = Math.max(0, (w.intensity / 380) * (1 - w.radius / w.maxRadius))
        if (ringAlpha > 0.02) {
          // Double refractive water ring
          ctx.strokeStyle = `rgba(56, 189, 248, ${(ringAlpha * 0.45).toFixed(3)})`
          ctx.lineWidth = 3.5
          ctx.beginPath()
          ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2)
          ctx.stroke()

          ctx.strokeStyle = `rgba(255, 255, 255, ${(ringAlpha * 0.75).toFixed(3)})`
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.arc(w.x, w.y, Math.max(0, w.radius - 8), 0, Math.PI * 2)
          ctx.stroke()
        }
      }

      // 5. Render visible water surge wave traveling down to CTA
      for (let i = surgeWaves.length - 1; i >= 0; i--) {
        const s = surgeWaves[i]
        s.progress += dt * s.speed

        if (s.progress >= 1.0) {
          surgeWaves.splice(i, 1)
          continue
        }

        const currX = s.startX + (s.targetX - s.startX) * s.progress
        const currY = s.startY + (s.targetY - s.startY) * s.progress
        const waveArcRadius = 35 + s.progress * 45
        const waveAlpha = Math.sin(s.progress * Math.PI) * 0.65

        // Glowing water surge crescent
        const grad = ctx.createRadialGradient(currX, currY, 0, currX, currY, waveArcRadius)
        grad.addColorStop(0, `rgba(56, 189, 248, ${(waveAlpha * 0.35).toFixed(3)})`)
        grad.addColorStop(0.7, `rgba(56, 189, 248, ${(waveAlpha * 0.65).toFixed(3)})`)
        grad.addColorStop(1, 'rgba(56, 189, 248, 0)')

        ctx.strokeStyle = `rgba(186, 230, 253, ${waveAlpha.toFixed(3)})`
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.arc(currX, currY, waveArcRadius, 0.2 * Math.PI, 0.8 * Math.PI)
        ctx.stroke()

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(currX, currY, waveArcRadius, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()

      // 6. Render dots with bold orbit glow
      const LIGHT_RADIUS = 52
      const LIGHT_RADIUS_SQ = LIGHT_RADIUS * LIGHT_RADIUS

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i]
        const dx = dot.x - dot.ox
        const dy = dot.y - dot.oy
        const disp = Math.sqrt(dx * dx + dy * dy)

        let energy = Math.min(1, disp / 6)

        if (dimFactor > 0.01) {
          for (let l = 0; l < lights.length; l++) {
            const lx = lights[l].x - dot.ox
            const ly = lights[l].y - dot.oy
            const lDistSq = lx * lx + ly * ly
            if (lDistSq < LIGHT_RADIUS_SQ) {
              const lFactor = (1 - Math.sqrt(lDistSq) / LIGHT_RADIUS) * dimFactor
              energy = Math.max(energy, lFactor * 1.5)
            }
          }
        }

        const alpha = Math.min(1, 0.35 + 0.65 * energy)
        const radius = BASE_DOT_RADIUS + 2.2 * Math.min(1, energy)

        ctx.fillStyle = energy > 0.1
          ? `rgba(${Math.round(210 + 45 * energy)}, ${Math.round(230 + 25 * energy)}, 255, ${alpha.toFixed(3)})`
          : 'rgba(180, 185, 195, 0.35)'

        ctx.beginPath()
        ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2)
        ctx.fill()
      }

      // 7. Converging stream dots riding wave into CTA button
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.progress += dt * p.speed

        const dx = p.targetX - p.x
        const dy = p.targetY - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < 16 || p.progress >= 1.0) {
          particles.splice(i, 1)
          continue
        }

        const pull = 650 + p.progress * 950
        p.vx += (dx / dist) * pull * dt
        p.vy += (dy / dist) * pull * dt
        p.vx *= 0.88
        p.vy *= 0.88

        p.x += p.vx * dt
        p.y += p.vy * dt

        const pAlpha = Math.max(0, 1 - p.progress * 0.75)
        ctx.fillStyle = `hsla(${p.hue}, 100%, 75%, ${pAlpha.toFixed(2)})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
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
