import { useEffect, useState } from 'react'

// Brief dotted splash that expands and retracts over view changes.
export default function SplashTransition() {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 720)
    return () => window.clearTimeout(timer)
  }, [])
  if (!visible) return null
  return <div aria-hidden="true" className="page-splash-transition" onAnimationEnd={() => setVisible(false)} />
}
