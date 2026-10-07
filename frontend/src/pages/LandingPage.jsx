import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'
import OrbitStage from '../components/OrbitStage'

const HEADLINE_LINES = [
  'Traditional resumes hide your true ability.',
  'Stop sending static resumes into automated filters.',
  'Find your dream job easily. Match careers that fit your skills.',
]

const ALL_WORDS = HEADLINE_LINES.flatMap((line) => line.split(' '))

export default function LandingPage() {
  const [litWordCount, setLitWordCount] = useState(0)
  const [stagePhase, setStagePhase] = useState('SCREEN_1') // 'SCREEN_1' | 'SLIDING' | 'SCREEN_2_LOCKED'
  const [slideProgress, setSlideProgress] = useState(100) // 100 -> 0 (percentage translateY)

  const trackRef = useRef(null)
  const isCompleteRef = useRef(false)
  const completeTimeRef = useRef(null)
  const isTransitioningRef = useRef(false)
  const touchStartY = useRef(null)

  // Scroll mapping for Screen 1
  useEffect(() => {
    if (stagePhase === 'SCREEN_2_LOCKED') return

    let rafId = null

    const handleScroll = () => {
      if (!trackRef.current || isTransitioningRef.current) return

      const track = trackRef.current
      const rect = track.getBoundingClientRect()
      const scrollDist = -rect.top
      const maxScroll = rect.height - window.innerHeight

      if (maxScroll <= 0) return

      const rawProgress = Math.max(0, Math.min(1, scrollDist / maxScroll))
      // Map linearly to first 85% of track so 100% lit has rest zone
      const litProgress = Math.min(1, rawProgress / 0.85)
      const count = Math.min(ALL_WORDS.length, Math.floor(litProgress * (ALL_WORDS.length + 0.999)))

      setLitWordCount(count)

      if (count >= ALL_WORDS.length) {
        if (!isCompleteRef.current) {
          isCompleteRef.current = true
          completeTimeRef.current = performance.now()
        }
      } else {
        isCompleteRef.current = false
        completeTimeRef.current = null
      }
    }

    const onScrollPassive = () => {
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(handleScroll)
    }

    window.addEventListener('scroll', onScrollPassive, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', onScrollPassive)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [stagePhase])

  // Trigger Screen 2 slide
  const startTransition = () => {
    if (isTransitioningRef.current || stagePhase !== 'SCREEN_1') return
    if (!isCompleteRef.current) return

    // Require ~200ms rest at the end of track so fast fling doesn't skip
    if (completeTimeRef.current && performance.now() - completeTimeRef.current < 180) {
      return
    }

    isTransitioningRef.current = true
    setStagePhase('SLIDING')

    const duration = 900
    const startTime = performance.now()

    const animateSlide = (now) => {
      const elapsed = now - startTime
      const t = Math.min(1, elapsed / duration)
      // cubic-bezier(0.32, 0.72, 0, 1) approximation
      const ease = 1 - Math.pow(1 - t, 3)
      const curY = (1 - ease) * 100
      setSlideProgress(curY)

      if (t < 1) {
        requestAnimationFrame(animateSlide)
      } else {
        setSlideProgress(0)
        setStagePhase('SCREEN_2_LOCKED')
        isTransitioningRef.current = false
      }
    }

    requestAnimationFrame(animateSlide)
  }

  // Input listeners for transition trigger (Screen 1 only)
  useEffect(() => {
    if (stagePhase !== 'SCREEN_1') return

    const handleWheel = (e) => {
      if (e.deltaY > 15 && isCompleteRef.current) {
        startTransition()
      }
    }

    const handleKeyDown = (e) => {
      if (['ArrowDown', 'PageDown', 'Space', 'End'].includes(e.key) && isCompleteRef.current) {
        startTransition()
      }
    }

    const handleTouchStart = (e) => {
      if (e.touches && e.touches[0]) {
        touchStartY.current = e.touches[0].clientY
      }
    }

    const handleTouchMove = (e) => {
      if (touchStartY.current === null || !isCompleteRef.current) return
      const deltaY = touchStartY.current - e.touches[0].clientY
      if (deltaY > 40) {
        startTransition()
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: true })
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })

    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [stagePhase])

  // One-way lock on Screen 2
  useLayoutEffect(() => {
    if (stagePhase === 'SCREEN_2_LOCKED') {
      window.scrollTo(0, 0)
      document.documentElement.style.overflow = 'hidden'
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overscrollBehavior = 'none'
      document.body.style.overscrollBehavior = 'none'

      const preventUpwards = (e) => {
        if (e.type === 'wheel' && e.deltaY < 0) {
          e.preventDefault()
        }
        if (e.type === 'keydown' && ['ArrowUp', 'PageUp', 'Home', 'Space'].includes(e.key)) {
          e.preventDefault()
        }
      }

      window.addEventListener('wheel', preventUpwards, { passive: false })
      window.addEventListener('keydown', preventUpwards)

      return () => {
        window.removeEventListener('wheel', preventUpwards)
        window.removeEventListener('keydown', preventUpwards)
        document.documentElement.style.overflow = ''
        document.body.style.overflow = ''
        document.documentElement.style.overscrollBehavior = ''
        document.body.style.overscrollBehavior = ''
      }
    }
  }, [stagePhase])

  let wordIndexCounter = 0

  return (
    <div className="relative w-full min-h-screen bg-[#000000] text-white">
      {/* SCREEN 1: Scroll track & pinned text */}
      {stagePhase !== 'SCREEN_2_LOCKED' && (
        <div ref={trackRef} className="relative w-full h-[300svh]">
          <div
            className={`sticky top-0 w-full h-[100svh] min-h-[100svh] flex items-center justify-center px-6 transition-opacity duration-300 ${
              stagePhase === 'SLIDING' ? 'opacity-40' : 'opacity-100'
            }`}
          >
            <div className="w-full max-w-[900px] text-center select-none">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.2] sm:leading-[1.15] text-wrap-balance">
                {HEADLINE_LINES.map((line, lineIdx) => {
                  const wordsInLine = line.split(' ')
                  return (
                    <span key={lineIdx} className="block mb-6 last:mb-0">
                      {wordsInLine.map((word) => {
                        const wordIdx = wordIndexCounter++
                        const isLit = wordIdx < litWordCount
                        return (
                          <span
                            key={wordIdx}
                            className={`inline-block mr-[0.28em] last:mr-0 transition-colors duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                              isLit ? 'text-white' : 'text-white/25'
                            }`}
                          >
                            {word}
                          </span>
                        )
                      })}
                    </span>
                  )
                })}
              </h1>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 2: Orbit stage fold */}
      {stagePhase === 'SLIDING' && (
        <div
          className="fixed inset-0 z-50 w-full h-full pointer-events-none will-change-transform"
          style={{ transform: `translate3d(0, ${slideProgress}%, 0)` }}
        >
          <OrbitStage animationReady={false} />
        </div>
      )}

      {stagePhase === 'SCREEN_2_LOCKED' && (
        <div className="relative w-full h-[100svh] overflow-hidden">
          <OrbitStage animationReady={true} />
        </div>
      )}
    </div>
  )
}
