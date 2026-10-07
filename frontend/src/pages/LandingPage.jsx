import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { Lightbulb, Code2 } from 'lucide-react'
import { Github, Linkedin } from '../components/Icons'
import WaterRippleCanvas from '../components/WaterRippleCanvas'

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

export default function LandingPage() {
  const [activeStageId, setActiveStageId] = useState('github')
  const [exitingStageId, setExitingStageId] = useState(null)
  const [poweringId, setPoweringId] = useState(null)
  const [strikingId, setStrikingId] = useState(null)
  const [textPhase, setTextPhase] = useState('idle') // 'idle' | 'exiting' | 'entering'
  const [buttonShimmer, setButtonShimmer] = useState(false)
  const [buttonThinking, setButtonThinking] = useState(false)
  const [displayCount, setDisplayCount] = useState(PLATFORM_CONFIG.github.targetPercent)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [badgeRadius, setBadgeRadius] = useState(240)
  const [showLogs, setShowLogs] = useState(false)
  const [logCount, setLogCount] = useState(0)
  const [liveCoords, setLiveCoords] = useState({})
  const logsRef = useRef([])
  const pageStartTimeRef = useRef(performance.now())

  const addLog = (type, details) => {
    const elapsed = Math.round(performance.now() - pageStartTimeRef.current)
    const entry = `[+${elapsed}ms] [${type}] ${typeof details === 'object' ? JSON.stringify(details) : details}`
    logsRef.current.push(entry)
    // Keep last 1500 log entries
    if (logsRef.current.length > 1500) logsRef.current.shift()
    setLogCount(logsRef.current.length)
  }

  const rippleRef = useRef(null)
  const centerSlotRef = useRef(null)
  const buttonRef = useRef(null)
  const badgeDomRefs = useRef({})

  const activeStageIdRef = useRef('github')
  const incomingCandidateRef = useRef('leetcode')
  const pausedAtApexRef = useRef(null)
  const glowDimRef = useRef(1.0)
  const strikeProgressRef = useRef(null) // { id, startX, startY, startTime }

  const anglesRef = useRef({
    github: 0,
    leetcode: 120,
    linkedin: 240,
    skills: 0,
  })

  const orbitingRef = useRef({
    github: false,
    leetcode: true,
    linkedin: true,
    skills: true,
  })

  const animationFrameRef = useRef(null)
  const countIntervalRef = useRef(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    const calcRadius = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const r = Math.max(200, Math.min(vw * 0.44, vh * 0.40, 280))
      setBadgeRadius(r)
      addLog('VIEWPORT_INIT', { vw, vh, badgeRadius: r })
    }
    calcRadius()
    window.addEventListener('resize', calcRadius)
    return () => window.removeEventListener('resize', calcRadius)
  }, [])

  // 60fps orbit loop with apex detection and direct asteroid plunge translation
  useEffect(() => {
    if (reducedMotion) return
    let lastTime = performance.now()
    const baseSpeed = 0.05

    const tick = (now) => {
      const delta = Math.min(now - lastTime, 40)
      lastTime = now

      if (document.visibilityState === 'visible') {
        const nowMs = Math.round(now)
        if (!window.__lastCoordLog || nowMs - window.__lastCoordLog > 800) {
          window.__lastCoordLog = nowMs
          const sample = {}
          BADGES.forEach(id => {
            const rad = (((anglesRef.current[id] || 0) - 90) * Math.PI) / 180
            sample[id] = {
              deg: Math.round(anglesRef.current[id] || 0),
              x: Math.round(Math.cos(rad) * badgeRadius),
              y: Math.round(Math.sin(rad) * badgeRadius),
              orbiting: orbitingRef.current[id]
            }
          })
          addLog('COORDS_TICK', { active: activeStageIdRef.current, candidate: incomingCandidateRef.current, sample })
          setLiveCoords(sample)
        }
        const angles = anglesRef.current
        const activeOrbiters = BADGES.filter((id) => orbitingRef.current[id])
        const candidate = incomingCandidateRef.current

        const isPaused = Boolean(pausedAtApexRef.current || strikeProgressRef.current)

        // Advance orbiting icons with natural deceleration to rest at apex
        if (!isPaused) {
          activeOrbiters.forEach((id) => {
            const prevDeg = angles[id]
            let speed = baseSpeed

            // Natural deceleration when approaching apex
            if (candidate === id && !pausedAtApexRef.current && !strikeProgressRef.current) {
              const distToApex = (360 - prevDeg) % 360
              if (distToApex <= 75 && distToApex > 0) {
                // Easing down to zero velocity as it comes to rest
                const progress = distToApex / 75
                speed = baseSpeed * Math.max(0.06, Math.pow(progress, 1.25))
              }

              if (distToApex <= 1.2 || (prevDeg > 358 && prevDeg < 360) || nextDeg < 1.0) {
                angles[id] = 0
                pausedAtApexRef.current = id
                addLog('APEX_ARRIVAL', { id, prevDeg: Math.round(prevDeg), x: 0, y: -badgeRadius })
                setPoweringId(id)
                return
              }
            }

            const nextDeg = (prevDeg + speed * delta) % 360
            angles[id] = nextDeg
          })
        }

        // Position orbit elements in DOM
        const centerX = window.innerWidth / 2
        const centerY = window.innerHeight / 2
        const lights = []

        BADGES.forEach((id) => {
          const el = badgeDomRefs.current[id]

          // Check if this badge is currently plunging down as an asteroid
          if (strikeProgressRef.current && strikeProgressRef.current.id === id) {
            const sp = strikeProgressRef.current
            const elapsed = now - sp.startTime
            const duration = 380
            const p = Math.min(1, elapsed / duration)
            const easeP = p * p * p // Heavy acceleration

            const curX = sp.startX * (1 - easeP)
            const curY = sp.startY * (1 - easeP)

            if (el) {
              el.style.transform = `translate3d(${curX}px, ${curY}px, 0)`
              el.style.opacity = "1"
            }

            // Displace water particles dynamically along the asteroid flight path
            if (rippleRef.current && p < 0.95) {
              rippleRef.current.displaceAt(centerX + curX, centerY + curY, 110)
            }
            return
          }

          if (orbitingRef.current[id]) {
            const deg = angles[id]
            const rad = ((deg - 90) * Math.PI) / 180
            const x = Math.cos(rad) * badgeRadius
            const y = Math.sin(rad) * badgeRadius

            const isPower = poweringId === id
            const scale = isPower ? 1.15 : 1
            if (el) {
              el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`
              el.style.opacity = '1'
            }

            // Only moving icons emit dynamic disturbance & shark-fin wake
            const isMoving = !isPaused && (!isPower)
            lights.push({
              x: centerX + x,
              y: centerY + y,
              deg,
              moving: isMoving,
            })
          } else if (el) {
            el.style.opacity = '0'
          }
        })

        if (rippleRef.current) {
          rippleRef.current.setHoverLights(lights, glowDimRef.current)
        }
      }

      animationFrameRef.current = requestAnimationFrame(tick)
    }

    animationFrameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animationFrameRef.current)
  }, [reducedMotion, badgeRadius])

  // Queue next stage transition
  useEffect(() => {
    if (reducedMotion) {
      setActiveStageId('skills')
      setDisplayCount(PLATFORM_CONFIG.skills.targetPercent)
      return
    }

    let isDestroyed = false

    const scheduleNextCycle = () => {
      if (isDestroyed || document.visibilityState !== 'visible') return

      const currentActive = activeStageIdRef.current
      const currentIndex = BADGES.indexOf(currentActive)
      const nextId = BADGES[(currentIndex + 1) % BADGES.length]

      incomingCandidateRef.current = nextId
    }

    const interval = setInterval(scheduleNextCycle, 11500)

    return () => {
      isDestroyed = true
      clearInterval(interval)
      clearInterval(countIntervalRef.current)
    }
  }, [reducedMotion])

  // Powerup at apex -> S-curve text exit -> Direct asteroid plunge -> Impact replace
  useEffect(() => {
    if (!poweringId) return

    // 1. As powerup loads, dim glow under other orbs so focus snaps to apex
    glowDimRef.current = 0.15

    addLog('POWERUP_START', { id: poweringId, y: -badgeRadius })

    // 2. While asteroid is about to strike, get rid of text below with S-curve exit
    const textExitTimer = setTimeout(() => {
      addLog('TEXT_EXIT_START', { phase: 'exiting' })
      setTextPhase('exiting')
    }, 400)

    // 3. Launch asteroid directly straight down from apex
    const launchTimer = setTimeout(() => {
      const launchingId = poweringId
      setPoweringId(null)
      pausedAtApexRef.current = null
      setStrikingId(launchingId)

      strikeProgressRef.current = {
        id: launchingId,
        startX: 0,
        startY: -badgeRadius,
        startTime: performance.now(),
      }
      addLog('STRIKE_LAUNCH', { id: launchingId, startX: 0, startY: -badgeRadius })

      // 4. Exact moment of impact (360ms plunge)
      setTimeout(() => {
        strikeProgressRef.current = null
        orbitingRef.current[launchingId] = false
        setStrikingId(null)

        const prevActive = activeStageIdRef.current
        setExitingStageId(prevActive)
        activeStageIdRef.current = launchingId
        setActiveStageId(launchingId) // Replaces center icon
        incomingCandidateRef.current = null

        // Return previous icon smoothly into orbit queue at apex and resume
        setTimeout(() => {
          orbitingRef.current[prevActive] = true
          anglesRef.current[prevActive] = 0
          pausedAtApexRef.current = null
          setExitingStageId(null)
        }, 350)

        // Trigger impact slam ripple
        if (centerSlotRef.current && rippleRef.current) {
          const rect = centerSlotRef.current.getBoundingClientRect()
          const cx = rect.left + rect.width / 2
          const cy = rect.top + rect.height / 2

          rippleRef.current.triggerSlam(cx, cy, {
            intensity: 320,
            blastRadius: 120,
          })
          addLog('SLAM_IMPACT', { id: launchingId, cx: Math.round(cx), cy: Math.round(cy), intensity: 320 })
        }

        // Keep text hidden while ripples settle; fade in once dust settles (700ms later)
        setTimeout(() => {
          glowDimRef.current = 1.0
          setTextPhase("entering")

          // Percentage counter roll-up
          const target = PLATFORM_CONFIG[launchingId].targetPercent
          let current = 0
          setDisplayCount(0)
          clearInterval(countIntervalRef.current)
          const stepTime = 800 / target
          countIntervalRef.current = setInterval(() => {
            current += 2
            if (current >= target) {
              setDisplayCount(target)
              clearInterval(countIntervalRef.current)
            } else {
              setDisplayCount(current)
            }
          }, stepTime)

          // 5 seconds after text stabilizes, glow returns down to CTA button
          setTimeout(() => {
            if (buttonRef.current && rippleRef.current) {
              const btnRect = buttonRef.current.getBoundingClientRect()
              const btnX = btnRect.left + btnRect.width / 2
              const btnY = btnRect.top + btnRect.height / 2
              rippleRef.current.streamGlowToTarget(btnX, btnY)
              addLog('CTA_GLOW_STREAM', { btnX: Math.round(btnX), btnY: Math.round(btnY) })
            }

            // 3 seconds after glow returns, button does AI thinking text simmer
            setTimeout(() => {
              setButtonThinking(true)
              setTimeout(() => {
                setButtonThinking(false)
                setTextPhase("idle")
              }, 3200)
            }, 3000)
          }, 5000)
        }, 700)
      }, 360)
    }, 850)

    return () => {
      clearTimeout(textExitTimer)
      clearTimeout(launchTimer)
    }
  }, [poweringId, badgeRadius])

  const handleSplash = () => {
    // Wait as visible surge wave & glowing dots converge into CTA button (~2.2s)
    setTimeout(() => {
      setButtonShimmer(true)
      setTimeout(() => {
        setButtonShimmer(false)
        setTextPhase('idle')
      }, 950)
    }, 2200)
  }

  const activeConfig = activeStageId ? PLATFORM_CONFIG[activeStageId] : null
  const exitingConfig = exitingStageId ? PLATFORM_CONFIG[exitingStageId] : null

  return (
    <main
      className="relative w-screen min-h-[100svh] h-[100dvh] overflow-hidden bg-[#0a0a0a] text-white flex flex-col items-center justify-center select-none font-sans"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <WaterRippleCanvas ref={rippleRef} onSlam={handleSplash} className="z-0" />

      {/* Orbit Track with direct non-jerky transforms */}
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
        {!reducedMotion &&
          BADGES.map((id) => {
            const cfg = PLATFORM_CONFIG[id]
            const Icon = cfg.icon
            const isPowering = poweringId === id
            const isStriking = strikingId === id

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
                className={`absolute w-12 h-12 rounded-full bg-slate-900/80 backdrop-blur-xl shadow-2xl border border-white/20 flex items-center justify-center pointer-events-auto cursor-pointer will-change-transform transition-transform duration-100 ease-out active:scale-[0.92] ${
                  isPowering ? 'animate-powerup ring-2 ring-white scale-110' : ''
                } ${isStriking ? 'ring-2 ring-sky-400 drop-shadow-[0_-12px_18px_rgba(56,189,248,0.8)]' : ''}`}
              >
                <Icon size={22} color={cfg.color} />
              </button>
            )
          })}
      </div>

      {/* Center Stage & Content */}
      <div className="relative z-20 flex flex-col items-center text-center max-w-sm px-4 pointer-events-auto">
        <h1 className="text-[clamp(28px,6vmin,54px)] font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
          Do you have
        </h1>

        <div ref={centerSlotRef} className="h-16 w-16 my-3 flex items-center justify-center relative">
          {exitingConfig && (
            <div
              className="absolute w-14 h-14 rounded-full bg-slate-900/90 backdrop-blur-md shadow-2xl border border-white/20 flex items-center justify-center animate-asteroid-blast-exit"
            >
              {React.createElement(exitingConfig.icon, { size: 26, color: exitingConfig.color })}
            </div>
          )}

          {activeConfig ? (
            <div
              className="w-14 h-14 rounded-full bg-slate-900/90 backdrop-blur-md shadow-2xl border border-white/20 flex items-center justify-center"
            >
              {React.createElement(activeConfig.icon, { size: 26, color: activeConfig.color })}
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-slate-700" />
          )}
        </div>

        {/* Text area with S-curve exit and slam entrance */}
        <div aria-live="polite" className="h-14 flex flex-col items-center justify-center overflow-visible">
          {activeConfig ? (
            <div
              className={`flex flex-col items-center will-change-transform ${
                textPhase === 'exiting'
                  ? 'animate-text-scurve-out'
                  : textPhase === 'entering'
                  ? 'animate-text-slam-in'
                  : ''
              }`}
            >
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                {activeConfig.label}
              </span>
              <p className="text-[clamp(14px,2.2vmin,18px)] font-medium text-slate-300 mt-0.5">
                <span className="font-bold text-white tabular-nums">
                  {displayCount}%
                </span>{' '}
                of companies hire through {activeConfig.label.toLowerCase()}
              </p>
            </div>
          ) : (
            <span className="text-xs text-slate-500 font-medium">Waiting for credentials...</span>
          )}
        </div>

        <Link
          ref={buttonRef}
          to="/auth"
          className={`relative overflow-hidden mt-6 inline-flex items-center justify-center min-h-[48px] px-8 py-3 rounded-xl bg-white text-slate-950 font-semibold text-base shadow-xl shadow-black/50 active:scale-[0.97] transition-all duration-300 ease-out hover:bg-slate-100 touch-manipulation select-none ${
            buttonShimmer ? 'ring-2 ring-white/60 ring-offset-2 ring-offset-black scale-[1.02]' : ''
          }`}
        >
          {buttonShimmer && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-black/25 to-transparent animate-btn-shimmer"
            />
          )}
          <span className={`relative z-10 ${buttonThinking ? "ai-thinking-text font-bold" : ""}`}>Get a job</span>
        </Link>
      </div>
          {/* Diagnostic Coordinates & Event Log HUD */}
      <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start gap-2 pointer-events-auto select-text font-mono text-[11px]">
        <div className="bg-slate-950/90 backdrop-blur-xl border border-white/15 rounded-xl p-3 shadow-2xl text-slate-300 max-w-xs sm:max-w-md w-full">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2 mb-2">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Telemetry & Coordinates ({logCount})
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const content = logsRef.current.join('\n')
                  navigator.clipboard.writeText(content).then(() => {
                    toast.success('Telemetry logs copied to clipboard!', {
                      description: `${logsRef.current.length} lines copied from start to now.`
                    })
                  }).catch(() => {
                    toast.error('Failed to copy to clipboard')
                  })
                }}
                className="px-2.5 py-1 rounded-md bg-white text-slate-950 font-bold hover:bg-slate-200 active:scale-95 transition cursor-pointer"
              >
                Copy All Logs
              </button>
              <button
                type="button"
                onClick={() => setShowLogs(!showLogs)}
                className="px-2 py-1 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 active:scale-95 transition cursor-pointer"
              >
                {showLogs ? 'Hide' : 'View'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400">
            <div>Active: <span className="text-white font-bold">{activeStageId}</span></div>
            <div>Phase: <span className="text-amber-300">{strikingId ? `striking (${strikingId})` : poweringId ? `powering (${poweringId})` : textPhase}</span></div>
            {Object.entries(liveCoords).map(([id, data]) => (
              <div key={id} className="truncate">
                {id}: ({data.x}, {data.y}) {data.deg}°
              </div>
            ))}
          </div>

          {showLogs && (
            <div className="mt-2 pt-2 border-t border-white/10 max-h-48 overflow-y-auto space-y-0.5 text-[9px] text-slate-400 bg-black/40 p-2 rounded">
              {logsRef.current.slice(-30).map((l, i) => (
                <div key={i} className="truncate">{l}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
