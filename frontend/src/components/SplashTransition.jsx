import { useEffect, useState } from 'react'

// Let the transition draw the user's eye toward the new page's primary focus.
export default function SplashTransition() {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    let frame = 0
    const setFocus = () => {
      const target = document.querySelector('[data-attention="Attention"]')
        || document.querySelector('main h1, h1, [data-page-focus]')
      if (!target) return
      const rect = target.getBoundingClientRect()
      const x = rect.left + rect.width / 2
      const y = rect.top + rect.height / 2
      document.documentElement.style.setProperty('--page-focus-x', `${x}px`)
      document.documentElement.style.setProperty('--page-focus-y', `${y}px`)
    }
    frame = window.requestAnimationFrame(setFocus)
    const timer = window.setTimeout(() => setVisible(false), 720)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(timer)
    }
  }, [])
  if (!visible) return null
  return <div aria-hidden="true" className="page-splash-transition" onAnimationEnd={() => setVisible(false)} />
}
