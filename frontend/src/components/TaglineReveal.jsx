import React, { useEffect, useRef, useState } from 'react'

export default function TaglineReveal() {
  const containerRef = useRef(null)
  const [revealedCount, setRevealedCount] = useState(0)

  // Copy with no hyphens per B1 copy rules
  const line1 = 'Traditional resumes hide your true ability.'
  const line2 = 'Live verifiable execution proves it before the first interview.'
  const allWords = `${line1} ${line2}`.split(' ')

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight

      // Trigger zone: when the container moves through the center of the viewport
      const start = windowHeight * 0.85
      const end = windowHeight * 0.25
      const current = rect.top

      if (current > start) {
        setRevealedCount(0)
      } else if (current < end) {
        setRevealedCount(allWords.length)
      } else {
        const progress = Math.min(1, Math.max(0, (start - current) / (start - end)))
        const targetWords = Math.floor(progress * allWords.length)
        setRevealedCount(targetWords)
      }
    }

    let rafId = null
    const onScrollThrottled = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          handleScroll()
          rafId = null
        })
      }
    }

    window.addEventListener('scroll', onScrollThrottled, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', onScrollThrottled)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [allWords.length])

  return (
    <section
      ref={containerRef}
      className="py-24 px-6 bg-[#000000] border-t border-b border-white/10 flex flex-col items-center justify-center text-center select-none"
    >
      <div className="max-w-[680px] mx-auto">
        <p className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-6">
          The Proof Principle
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight [text-wrap:balance]">
          {allWords.map((word, index) => {
            const isRevealed = index < revealedCount
            return (
              <span
                key={`${word}-${index}`}
                className={`inline-block mr-2.5 transition-colors duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  isRevealed ? 'text-white' : 'text-white/25'
                }`}
              >
                {word}
              </span>
            )
          })}
        </h2>
      </div>
    </section>
  )
}
