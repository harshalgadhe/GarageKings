import { useScroll, useTransform, useVelocity } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { lerpKeyframes, MOTION_KEYS } from '../lib/racePath'

export function useScrollJourney(pathRef) {
  const { scrollYProgress } = useScroll()
  const velocity = useVelocity(scrollYProgress)

  const carX = useTransform(scrollYProgress, (p) => {
    const path = pathRef.current
    if (!path) return 50
    const len = path.getTotalLength()
    return path.getPointAtLength(len * p).x
  })

  const carY = useTransform(scrollYProgress, (p) => {
    const path = pathRef.current
    if (!path) return 10
    const len = path.getTotalLength()
    return path.getPointAtLength(len * p).y
  })

  const carRotate = useTransform(scrollYProgress, (p) => {
    const path = pathRef.current
    if (!path) return 0
    const len = path.getTotalLength()
    const at = path.getPointAtLength(len * p)
    const ahead = path.getPointAtLength(Math.min(len, len * p + len * 0.012))
    return (Math.atan2(ahead.y - at.y, ahead.x - at.x) * 180) / Math.PI
  })

  const motionBlurPx = useTransform(scrollYProgress, (p) =>
    lerpKeyframes(p, MOTION_KEYS.progress, MOTION_KEYS.blur),
  )

  const scale = useTransform(scrollYProgress, (p) =>
    lerpKeyframes(p, MOTION_KEYS.progress, MOTION_KEYS.scale),
  )

  const roadReveal = useTransform(scrollYProgress, [0, 0.15], [0, 1])
  const dashOffset = useTransform(scrollYProgress, [0, 1], [0, -120])
  const trackOpacity = useTransform(scrollYProgress, [0, 0.05, 1], [0.35, 1, 0.7])
  const speedIntensity = useTransform(velocity, (v) => Math.min(1, Math.abs(v) * 80))

  return {
    scrollYProgress,
    carX,
    carY,
    carRotate,
    motionBlurPx,
    scale,
    roadReveal,
    dashOffset,
    trackOpacity,
    speedIntensity,
  }
}

export function useActiveSection(sectionRefs) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const elements = sectionRefs.map((r) => r.current).filter(Boolean)
    if (!elements.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (!visible) return
        const idx = elements.indexOf(visible.target)
        if (idx >= 0) setActive(idx)
      },
      { rootMargin: '-42% 0px -42% 0px', threshold: [0.15, 0.35, 0.55] },
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [sectionRefs])

  return active
}

export function usePathReady(pathRef) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const check = () => {
      if (pathRef.current?.getTotalLength() > 0) setReady(true)
    }
    check()
    const id = requestAnimationFrame(check)
    window.addEventListener('resize', check)
    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener('resize', check)
    }
  }, [pathRef])

  return ready
}
