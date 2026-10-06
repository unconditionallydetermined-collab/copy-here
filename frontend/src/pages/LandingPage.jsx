import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Lightbulb } from 'lucide-react'
import { Github, Linkedin } from '../components/Icons'

// TODO: replace placeholder percentages with sourced figures.
const ITEMS = [
  { id: 'github',   label: 'GitHub',   pct: 70, text: 'of companies hire through GitHub',   color: '#181717' },
  { id: 'leetcode', label: 'LeetCode', pct: 58, text: 'of companies hire through LeetCode', color: '#FFA116' },
  { id: 'linkedin', label: 'LinkedIn', pct: 87, text: 'of companies hire through LinkedIn', color: '#0A66C2' },
  { id: 'skills',   label: 'Skills',   pct: 76, text: 'of companies hire through skills',   color: '#F5B800' },
]

const SPEED = 72 // deg/s, fast linear orbit
const EASE_OUT = (t) => 1 - Math.pow(1 - t, 4)
const EASE_IO = (t) => (t < 0.5 ? 8 * t ** 4 : 1 - Math.pow(-2 * t + 2, 4) / 2)
const SPRING = (t) => 1 - Math.exp(-7 * t) * Math.cos(11 * t)
const rand = (a, b) => a + Math.random() * (b - a)
const wrap = (a) => ((a % 360) + 360) % 360

function LeetIcon({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.5 4 4.8 13.7a2.8 2.8 0 0 0 0 4l1.5 1.5a2.8 2.8 0 0 0 4 0L13.5 16" />
      <path d="M11 13h10" />
    </svg>
  )
}

function ItemIcon({ item, size }) {
  const s = size * 0.5
  if (item.id === 'github') return <Github size={s} style={{ color: item.color }} />
  if (item.id === 'linkedin') return <Linkedin size={s} style={{ color: item.color }} />
  if (item.id === 'leetcode') return <LeetIcon size={s} color={item.color} />
  return <Lightbulb size={s} color={item.color} strokeWidth={2.2} />
}

function Counter({ to, run, instant }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!run) return
    if (instant) { setN(to); return }
    let raf, t0
    const step = (now) => {
      t0 ??= now
      const p = Math.min(1, (now - t0) / 900)
      setN(Math.round(to * EASE_OUT(p)))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    setN(0)
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [to, run, instant])
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{n}%</span>
}

export default function LandingPage() {
  const rootRef = useRef(null)
  const slotRef = useRef(null)
  const btnRef = useRef(null)
  const badgeEls = useRef([])
  const [bs, setBs] = useState(56)
  const [facts, setFacts] = useState({ item: null, shown: false })
  const reduced = useRef(typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    const root = rootRef.current
    let alive = true
    const geo = { rx: 200, ry: 300, slot: { x: 0, y: 0 }, btn: { x: 0, y: 0 }, b: 56 }
    const badges = ITEMS.map((item, i) => ({
      item, home: i * 90, mode: 'orbit', x: 0, y: 0, s: 1, sx: 1, sy: 1, o: 1, prev: 0, enterT: 0,
    }))
    let base = 0, locked = false, ready = false, onDone = null, staged = null, lastId = null

    const measure = () => {
      const r = root.getBoundingClientRect()
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2
      const b = Math.round(Math.min(72, Math.max(48, r.width * 0.11)))
      geo.b = b
      geo.rx = Math.min(r.width / 2 - b * 0.6, 640)
      geo.ry = Math.min(r.height / 2 - b * 0.6 - 8, 340)
      const s = slotRef.current.getBoundingClientRect()
      geo.slot = { x: s.left + s.width / 2 - cx, y: s.top + s.height / 2 - cy }
      const k = btnRef.current.getBoundingClientRect()
      geo.btn = { x: k.left + k.width / 2 - cx, y: k.top - cy }
      setBs(b)
      if (staged) { staged.x = geo.slot.x; staged.y = geo.slot.y }
    }
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    measure()

    const orbitPos = (b) => {
      const a = (wrap(base + b.home) * Math.PI) / 180
      return { x: geo.rx * Math.sin(a), y: -geo.ry * Math.cos(a) }
    }
    const tween = (ms, fn, ease = (t) => t) => new Promise((res) => {
      const t0 = performance.now()
      const step = (now) => {
        if (!alive) return res()
        const p = Math.min(1, (now - t0) / ms)
        fn(ease(p), p)
        p < 1 ? requestAnimationFrame(step) : res()
      }
      requestAnimationFrame(step)
    })
    const sleep = async (ms) => {
      await new Promise((r) => setTimeout(r, ms))
      while (alive && document.visibilityState !== 'visible') await new Promise((r) => setTimeout(r, 300))
    }

    async function run(b) {
      const prev = staged
      const start = orbitPos(b)
      b.mode = 'fly'
      setFacts((f) => ({ ...f, shown: false }))
      // anticipation: tiny scale-down and pull toward center
      const len = Math.hypot(start.x, start.y) || 1
      const p0 = { x: start.x - (start.x / len) * 6, y: start.y - (start.y / len) * 6 }
      await tween(120, (e) => { b.x = start.x + (p0.x - start.x) * e; b.y = start.y + (p0.y - start.y) * e; b.s = 1 - 0.08 * e }, EASE_OUT)
      const dx = geo.slot.x - p0.x, dy = geo.slot.y - p0.y
      const dl = Math.hypot(dx, dy) || 1
      const nx = -dy / dl, ny = dx / dl
      const arc = Math.min(70, dl * 0.2) * (p0.x > 0 ? 1 : -1)
      const flight = tween(560, (e, p) => {
        const bell = Math.sin(Math.PI * p)
        b.x = p0.x + dx * e + nx * arc * bell
        b.y = p0.y + dy * e + ny * arc * bell
        b.s = 0.92 + 0.23 * Math.min(1, e)
      }, SPRING)
      // knock-out of the current occupant, partway through the flight
      const knock = prev ? (async () => {
        await sleep(0); await new Promise((r) => setTimeout(r, 260))
        const fx = prev.x, fy = prev.y
        prev.mode = 'knock'
        await tween(220, (e, p) => {
          const bell = Math.sin(Math.PI * p)
          prev.x = fx + (geo.btn.x - fx) * e
          prev.y = fy + (geo.btn.y - geo.b * 0.2 - fy) * e
          prev.sx = 1 - 0.08 * bell; prev.sy = 1 + 0.1 * bell
          prev.s = 1.15 - 0.2 * e
          prev.o = p < 0.5 ? 1 : 1 - (p - 0.5) * 2
        }, EASE_IO)
        prev.mode = 'hidden'; prev.o = 0; prev.sx = prev.sy = 1
      })() : Promise.resolve()
      await Promise.all([flight, knock])
      b.mode = 'staged'; b.x = geo.slot.x; b.y = geo.slot.y; b.s = 1.15
      staged = b; lastId = b.item.id
      setFacts({ item: b.item, shown: true })
    }

    // master render loop
    let last = performance.now()
    let raf
    const frame = (now) => {
      if (!alive) return
      const dt = Math.min(0.05, (now - last) / 1000); last = now
      if (!reduced.current) base = wrap(base + SPEED * dt)
      for (let i = 0; i < badges.length; i++) {
        const b = badges[i], el = badgeEls.current[i]
        const a = wrap(base + b.home)
        if (b.mode === 'orbit') {
          const p = orbitPos(b)
          let s = 1, o = 1
          if (b.enterT) {
            const e = EASE_OUT(Math.min(1, (now - b.enterT) / 250))
            s = 0.95 + 0.05 * e; o = e
            if (e >= 1) b.enterT = 0
          }
          b.x = p.x; b.y = p.y; b.s = s; b.o = o; b.sx = b.sy = 1
          // 2 o'clock = 60deg
          if (!reduced.current && ready && !locked && (b.prev - 60 + 360) % 360 > (a - 60 + 360) % 360 && b.item.id !== lastId) {
            locked = true; ready = false
            run(b).then(() => { locked = false; onDone && onDone() })
          }
        } else if (b.mode === 'hidden') {
          // reappear at its home spot when it reaches 8 o'clock (240deg)
          if ((b.prev - 240 + 360) % 360 > (a - 240 + 360) % 360) { b.mode = 'orbit'; b.enterT = now; b.o = 0 }
        }
        b.prev = a
        if (el) {
          el.style.opacity = b.o
          el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0) scale(${b.s * b.sx}, ${b.s * b.sy})`
        }
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    // scheduler: one permit, 5s minimum first, then random 5-11s cooldowns
    ;(async () => {
      await sleep(5000)
      let idx = 0
      while (alive) {
        if (reduced.current) {
          const it = ITEMS[idx++ % ITEMS.length]
          setFacts((f) => ({ ...f, shown: false }))
          await new Promise((r) => setTimeout(r, 180))
          setFacts({ item: it, shown: true })
        } else {
          ready = true
          await new Promise((r) => { onDone = r })
        }
        await sleep(rand(5000, 11000))
      }
    })()

    return () => { alive = false; cancelAnimationFrame(raf); ro.disconnect() }
  }, [])

  const item = facts.item
  return (
    <main
      ref={rootRef}
      className="landing-fit relative w-full overflow-hidden bg-white text-[#0A0A0A] font-sans"
      style={{ height: '100dvh', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <style>{`
        .landing-fit{--k:1}
        @media (max-height:560px){.landing-fit{--k:.7}}
        @media (max-height:420px){.landing-fit{--k:.5}}
        .lp-press{transition:transform 140ms cubic-bezier(.23,1,.32,1)}
        .lp-press:active{transform:scale(.97)}
      `}</style>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <h1 className="font-extrabold tracking-[-0.02em]" style={{ fontSize: 'calc(clamp(40px, 11vw, 96px) * var(--k))', lineHeight: 1.05 }}>
          Do you have
        </h1>

        <div ref={slotRef} style={{ width: bs, height: bs, margin: 'calc(8px * var(--k)) 0' }} aria-hidden="true" />

        <div
          aria-live="polite"
          className="flex flex-col items-center"
          style={{
            minHeight: 'calc((clamp(28px,7vw,56px)*1.2 + clamp(56px,16vw,128px)*1.05 + clamp(18px,4.2vw,28px)*1.4*2 + 16px) * var(--k))',
            opacity: facts.shown ? 1 : 0,
            transform: facts.shown ? 'translateY(0)' : 'translateY(8px)',
            transition: facts.shown
              ? 'opacity 220ms cubic-bezier(.23,1,.32,1), transform 220ms cubic-bezier(.23,1,.32,1)'
              : 'opacity 150ms ease-out',
          }}
        >
          {item && (
            <>
              <div className="font-bold" style={{ fontSize: 'calc(clamp(28px,7vw,56px) * var(--k))', lineHeight: 1.2 }}>{item.label}</div>
              <div className="font-extrabold" style={{ fontSize: 'calc(clamp(56px,16vw,128px) * var(--k))', lineHeight: 1.05, color: item.color }}>
                <Counter key={item.id + facts.shown} to={item.pct} run={facts.shown} instant={reduced.current} />
              </div>
              <p className="font-medium text-slate-600" style={{ fontSize: 'calc(clamp(18px,4.2vw,28px) * var(--k))', maxWidth: '28ch', lineHeight: 1.4 }}>{item.text}</p>
            </>
          )}
        </div>

        <Link
          ref={btnRef}
          to="/auth"
          className="lp-press mt-4 inline-flex items-center justify-center rounded-full bg-[#0A0A0A] font-bold text-white"
          style={{ fontSize: 'calc(clamp(20px,5vw,28px) * var(--k))', minHeight: 'calc(56px * var(--k))', paddingInline: 40 }}
        >
          Get a job
        </Link>
      </div>

      <div className="pointer-events-none absolute left-1/2 top-1/2" aria-hidden={false}>
        {ITEMS.map((it, i) => (
          <div
            key={it.id}
            ref={(el) => (badgeEls.current[i] = el)}
            role="img"
            aria-label={it.label}
            className="absolute flex items-center justify-center rounded-full bg-white"
            style={{ width: bs, height: bs, left: -bs / 2, top: -bs / 2, boxShadow: '0 4px 16px rgba(0,0,0,.14), 0 0 0 1px rgba(0,0,0,.05)', willChange: 'transform, opacity' }}
          >
            <ItemIcon item={it} size={bs} />
          </div>
        ))}
      </div>
    </main>
  )
}
