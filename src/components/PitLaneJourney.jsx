import { useEffect, useRef, useState } from 'react'
import {
  motion,
  useMotionTemplate,
  useMotionValueEvent,
  useTransform,
} from 'framer-motion'
import { PIT_STOPS, ROAD_PATH_D } from '../lib/racePath'
import { usePathReady, useScrollJourney } from '../hooks/useScrollJourney'

export default function PitLaneJourney() {
  const pathRef = useRef(null)
  const journey = useScrollJourney(pathRef)
  const ready = usePathReady(pathRef)

  const left = useMotionTemplate`${journey.carX}%`
  const top = useMotionTemplate`${journey.carY}%`
  const filter = useMotionTemplate`blur(${journey.motionBlurPx}px)`
  const roadDraw = useTransform(journey.roadReveal, (v) => v)

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-20 overflow-hidden"
      style={{ opacity: journey.trackOpacity }}
      aria-hidden
    >
      <motion.div className="gk-race-scene absolute inset-0">
        <motion.svg
          className="gk-race-track h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          initial={{ opacity: 0 }}
          animate={{ opacity: ready ? 1 : 0 }}
          transition={{ duration: 0.6 }}
        >
          <defs>
            <linearGradient id="asphalt" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#222" />
              <stop offset="100%" stopColor="#0c0c0c" />
            </linearGradient>
            <filter id="roadGlow">
              <feGaussianBlur stdDeviation="0.6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <path
            ref={pathRef}
            d={ROAD_PATH_D}
            fill="none"
            stroke="url(#asphalt)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#roadGlow)"
          />

          <path
            d={ROAD_PATH_D}
            fill="none"
            stroke="#4a4a4a"
            strokeWidth="0.4"
            strokeLinecap="round"
            opacity="0.7"
          />

          <motion.path
            d={ROAD_PATH_D}
            fill="none"
            stroke="#FFB800"
            strokeWidth="0.6"
            strokeLinecap="round"
            strokeDasharray="2 2.5"
            style={{
              pathLength: roadDraw,
              strokeDashoffset: journey.dashOffset,
            }}
          />

          {PIT_STOPS.map((stop) => (
            <PitMarker
              key={stop.id}
              pathRef={pathRef}
              progress={stop.progress}
              label={stop.label}
            />
          ))}
        </motion.svg>
      </motion.div>

      <SpeedStreaks
        intensity={journey.speedIntensity}
        x={journey.carX}
        y={journey.carY}
        rotate={journey.carRotate}
      />

      <motion.div
        className="absolute z-30 will-change-transform"
        style={{
          left,
          top,
          x: '-50%',
          y: '-50%',
          rotate: journey.carRotate,
          scale: journey.scale,
          filter,
        }}
      >
        <div className="relative" style={{ width: 'clamp(76px, 15vw, 140px)' }}>
          <motion.div className="absolute -inset-5 rounded-full bg-gk-yellow/25 blur-2xl" />
          <img
            src="/hotwheels-car.png"
            alt=""
            className="relative h-auto w-full drop-shadow-[0_16px_32px_rgba(0,0,0,0.95)]"
            draggable={false}
            onError={(e) => {
              e.currentTarget.src = '/hotwheels-car.svg'
            }}
          />
        </div>
      </motion.div>

      <LapHud progress={journey.scrollYProgress} />
    </motion.div>
  )
}

function PitMarker({ pathRef, progress, label }) {
  const [pt, setPt] = useState(null)

  useEffect(() => {
    const update = () => {
      const path = pathRef.current
      if (!path?.getTotalLength) return
      const len = path.getTotalLength()
      if (len <= 0) return
      setPt(path.getPointAtLength(len * progress))
    }
    update()
    const t = setTimeout(update, 150)
    window.addEventListener('resize', update)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', update)
    }
  }, [pathRef, progress])

  if (!pt) return null

  return (
    <g transform={`translate(${pt.x}, ${pt.y})`}>
      <circle r="1.4" fill="#0E0E0E" stroke="#FFB800" strokeWidth="0.4" />
      <text
        y="-2.4"
        textAnchor="middle"
        fill="#FFB800"
        fontSize="2.4"
        fontWeight="700"
        fontFamily="Space Grotesk, system-ui, sans-serif"
      >
        {label}
      </text>
    </g>
  )
}

function SpeedStreaks({ intensity, x, y, rotate }) {
  const left = useMotionTemplate`${x}%`
  const top = useMotionTemplate`${y}%`

  return (
    <motion.div
      className="absolute"
      style={{ left, top, x: '-50%', y: '-50%', rotate, opacity: intensity }}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute block h-[2px] rounded-full bg-gradient-to-r from-gk-yellow to-transparent"
          style={{
            width: 20 + i * 10,
            left: -30 - i * 14,
            top: -4 + i * 2,
          }}
          animate={{ opacity: [0.15, 0.7, 0.15], scaleX: [0.6, 1, 0.6] }}
          transition={{
            repeat: Infinity,
            duration: 0.28,
            delay: i * 0.04,
            ease: 'easeOut',
          }}
        />
      ))}
    </motion.div>
  )
}

function LapHud({ progress }) {
  const [lap, setLap] = useState(0)

  useMotionValueEvent(progress, 'change', (p) => {
    setLap(Math.round(Math.max(0, Math.min(100, p * 100))))
  })

  const hudOpacity = useTransform(progress, [0, 0.04, 1], [0, 1, 1])

  return (
    <motion.div
      className="fixed right-4 bottom-6 z-30 rounded-2xl border border-gk-border bg-gk-black/85 px-4 py-3 backdrop-blur-md md:right-8"
      style={{ opacity: hudOpacity }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/40">
        Pit Progress
      </p>
      <p className="mt-0.5 text-2xl font-bold tabular-nums text-gk-yellow">{lap}%</p>
    </motion.div>
  )
}
