import { forwardRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { WHATSAPP_URL, footerCopy } from '../../data/content'

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
    <section ref={ref} id="drop" className="relative py-32 md:py-40">
      <div className="mx-auto max-w-4xl px-6 text-center md:pl-32">
        <motion.p
          className="text-xs font-semibold uppercase tracking-[0.35em] text-gk-yellow"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Pit Stop · Final Lap
        </motion.p>

        <motion.h2
          className="mt-4 text-3xl font-bold tracking-tight text-white md:text-6xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          Don&apos;t Miss the Friday Drop
        </motion.h2>

        <motion.p
          className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-white/50"
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
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="gk-btn-primary mt-10 px-10 py-4 text-sm md:text-base"
          whileTap={{ scale: 0.98 }}
        >
          Join the WhatsApp Clubhouse
        </motion.a>
        <p className="mt-3 text-xs text-white/40">24-hour early access for members</p>
      </div>

      <footer className="mx-auto mt-28 max-w-3xl border-t border-gk-border px-6 pt-16 md:pl-32">
        <div className="flex flex-col items-center gap-6 text-center md:items-start md:text-left">
          <img
            src="/brand-logo.png"
            alt="Garage King"
            className="h-16 w-16 rounded-full object-cover ring-1 ring-gk-yellow/20"
          />
          <p className="text-sm text-white/50">{footerCopy.transparency}</p>
          <p className="text-sm leading-relaxed text-white/45">{footerCopy.returns}</p>
          <p className="text-sm font-semibold text-gk-yellow">{footerCopy.socialProof}</p>
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} Garage King · {footerCopy.socialProof}
          </p>
        </div>
      </footer>
    </section>
  )
})

export default DropRitual
