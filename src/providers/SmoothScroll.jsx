import Lenis from 'lenis'
import { createContext, useContext, useEffect, useRef } from 'react'

const LenisContext = createContext(null)

export function useLenis() {
  return useContext(LenisContext)
}

export function SmoothScrollProvider({ children }) {
  const lenisRef = useRef(null)
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.35,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.15,
      infinite: false,
    })

    lenisRef.current = lenis

    let frame = 0
    const raf = (time) => {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(frame)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  return (
    <LenisContext.Provider value={lenisRef}>{children}</LenisContext.Provider>
  )
}

export function scrollToSection(lenisRef, target, offset = -88) {
  const el = typeof target === 'string' ? document.getElementById(target) : target
  if (!el) return

  const lenis = lenisRef?.current
  if (lenis) {
    lenis.scrollTo(el, {
      offset,
      duration: 2.4,
      easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
    })
    return
  }

  const top = el.getBoundingClientRect().top + window.scrollY + offset
  window.scrollTo({ top, behavior: 'smooth' })
}
