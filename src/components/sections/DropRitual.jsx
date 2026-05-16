import { forwardRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { footerCopy } from '../../data/content'

function getNextFriday8PMIST() {
  const now = new Date()
  for (let addDays = 0; addDays <= 7; addDays++) {
    const probe = new Date(now.getTime() + addDays * 86_400_000)
    const parts = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(probe)
    const get = (t) => parts.find((p) => p.type === t)?.value
    const weekdays = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
    if (weekdays[get('weekday')] !== 5) continue
    const target = new Date(
      `${get('year')}-${String(get('month')).padStart(2, '0')}-${String(get('day')).padStart(2, '0')}T20:00:00+05:30`,
    )
    if (target.getTime() > now.getTime()) return target.getTime() - now.getTime()
  }
  return 7 * 86_400_000
}

function formatCountdown(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  return {
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
  }
}

function TimeBlock({ value, label }) {
  return (
    <div className="flex min-w-[4.5rem] flex-col items-center rounded-xl border border-gk-border bg-gk-surface px-5 py-4 md:min-w-[5.5rem] md:px-7 md:py-5">
      <span className="text-3xl font-bold tabular-nums text-gk-yellow md:text-5xl">
        {String(value).padStart(2, '0')}
      </span>
      <span className="mt-2 text-[10px] font-medium uppercase tracking-widest text-white/40">
        {label}
      </span>
    </div>
  )
}

const DropRitual = forwardRef(function DropRitual(_props, ref) {
  const [remaining, setRemaining] = useState(() => getNextFriday8PMIST())

  useEffect(() => {
    const id = setInterval(() => setRemaining(getNextFriday8PMIST()), 1000)
    return () => clearInterval(id)
  }, [])

  const { days, hours, minutes, seconds } = formatCountdown(remaining)

  return (
    <section ref={ref} id="drop" className="relative z-20 py-32 md:py-40 bg-gk-black">
      <div className="px-8 md:px-16 max-w-4xl mx-auto flex flex-col items-center text-center">
        <motion.p
          className="text-xs font-semibold uppercase tracking-[0.35em] text-gk-yellow"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Pit Stop · Final Lap
        </motion.p>

        <motion.h2
          className="mt-4 text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          Don&apos;t Miss the Friday Drop
        </motion.h2>

        <motion.p
          className="mt-6 max-w-lg text-base leading-relaxed text-white/50"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Every Friday at 8 PM IST, we release a fresh batch of 1:64 heat. The rarest pieces
          usually go in minutes.
        </motion.p>

        <motion.div
          className="mt-12 flex flex-wrap justify-center gap-4 md:gap-6"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <TimeBlock value={days} label="Days" />
          <TimeBlock value={hours} label="Hours" />
          <TimeBlock value={minutes} label="Min" />
          <TimeBlock value={seconds} label="Sec" />
        </motion.div>

        <motion.p className="mt-8 text-sm font-semibold text-gk-yellow">
          Friday · 8:00 PM IST
        </motion.p>

        <motion.a
          href="https://instagram.com/garagekingsindia"
          target="_blank"
          rel="noopener noreferrer"
          className="gk-btn-primary mt-10 px-10 py-4 text-sm md:text-base flex items-center justify-center gap-3"
          whileTap={{ scale: 0.98 }}
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <defs>
              <radialGradient id="ig-grad" r="1.5" cx="0.3" cy="1.07" >
                <stop offset="0" stopColor="#fdf497" />
                <stop offset="0.05" stopColor="#fdf497" />
                <stop offset="0.45" stopColor="#fd5949" />
                <stop offset="0.6" stopColor="#d6249f" />
                <stop offset="0.9" stopColor="#285AEB" />
              </radialGradient>
            </defs>
            <path fill="url(#ig-grad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm3.98-10.322a1.44 1.44 0 1 0-2.881.001 1.44 1.44 0 0 0 2.88-.001z"/>
          </svg>
          Follow us on Instagram
        </motion.a>
        <p className="mt-3 text-xs text-white/40">Turn on post notifications for drop alerts</p>
      </div>

      <footer className="mt-32 border-t border-gk-border px-8 md:px-16 pt-16 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-center md:items-start text-center md:text-left justify-between">
          <div className="flex flex-col items-center md:items-start gap-6">
            <img
              src="/brand-logo.png"
              alt="Garage Kings"
              className="h-16 w-16 rounded-full object-cover ring-1 ring-gk-yellow/20"
            />
            <p className="text-sm text-white/50 max-w-xs">{footerCopy.transparency}</p>
            <p className="text-sm leading-relaxed text-white/45 max-w-xs">{footerCopy.returns}</p>
            <p className="text-xs text-white/30 mt-4">
              © {new Date().getFullYear()} Garage Kings
            </p>
          </div>
          
          <div className="flex flex-col gap-4 items-center md:items-end">
            <h4 className="text-sm font-semibold text-white uppercase tracking-widest">Connect</h4>
            <a href="https://instagram.com/garagekingsindia" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white/60 hover:text-gk-yellow transition-colors text-sm font-medium">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <defs>
                  <radialGradient id="ig-grad-sm" r="1.5" cx="0.3" cy="1.07" >
                    <stop offset="0" stopColor="#fdf497" />
                    <stop offset="0.05" stopColor="#fdf497" />
                    <stop offset="0.45" stopColor="#fd5949" />
                    <stop offset="0.6" stopColor="#d6249f" />
                    <stop offset="0.9" stopColor="#285AEB" />
                  </radialGradient>
                </defs>
                <path fill="url(#ig-grad-sm)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm3.98-10.322a1.44 1.44 0 1 0-2.881.001 1.44 1.44 0 0 0 2.88-.001z"/>
              </svg>
              Instagram
            </a>
            <a href="https://youtube.com/@garagekingsindia" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white/60 hover:text-gk-yellow transition-colors text-sm font-medium">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="red" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
                <path fill="white" d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              YouTube
            </a>
          </div>
        </div>
      </footer>
    </section>
  )
})

export default DropRitual
