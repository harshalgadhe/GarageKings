import { forwardRef, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { BRAND } from '../../data/content'
import { scrollToSection, useLenis } from '../../providers/SmoothScroll'

gsap.registerPlugin(ScrollTrigger)

const Hero = forwardRef(function Hero(_props, ref) {
  const lenisRef = useLenis()
  const carRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    const el = carRef.current
    const container = containerRef.current
    if (!el || !container) return

    // Apple-style parallax: pin the car and scale it up slightly while fading out
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    })

    tl.to(el, {
      yPercent: 20,
      scale: 1.15,
      opacity: 0,
      ease: 'none',
    })

    return () => {
      tl.kill()
    }
  }, [])

  return (
    <section
      ref={(node) => {
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
        containerRef.current = node
      }}
      id="hero"
      className="relative flex min-h-[100svh] flex-col items-center justify-center px-6 text-center overflow-hidden"
    >
      {/* Full-Screen Cinematic Hero Image */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          ref={carRef}
          src="/hotwheels-car.png"
          alt="Garage Kings Vault"
          className="w-full h-full object-cover"
        />
        {/* Subtle gradient overlay to ensure the bottom blends into the vault */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gk-black z-10" />
        
        {/* Radial vignette behind the text to ensure legibility */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-full max-w-4xl aspect-square bg-[radial-gradient(ellipse_at_center,rgba(5,5,7,0.8)_0%,transparent_60%)]" />
        </div>
      </div>

      <motion.div className="relative z-20 mx-auto max-w-3xl flex flex-col items-center pt-20">
        <motion.p
          className="text-xs font-semibold uppercase tracking-[0.4em] text-gk-yellow drop-shadow-md"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.8 }}
        >
          {BRAND.tagline}
        </motion.p>

        <motion.h1
          className="mt-6 text-5xl font-bold leading-[1.05] tracking-tighter text-white md:text-7xl lg:text-[7rem] drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          Die-Cast<br/>Curators.
        </motion.h1>

        <motion.button
          type="button"
          onClick={() => scrollToSection(lenisRef, 'vault')}
          className="inline-flex items-center justify-center mt-12 px-12 py-5 text-sm md:text-base rounded-full bg-white/5 text-white backdrop-blur-md border border-white/20 hover:bg-gk-orange hover:text-white hover:border-gk-orange hover:shadow-[0_0_30px_rgba(255,51,0,0.6)] hover:-translate-y-px font-semibold tracking-wide transition-all duration-300"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileTap={{ scale: 0.98 }}
        >
          Enter the Vault
        </motion.button>
      </motion.div>

      {/* Scroll Down Indicator */}
      <motion.button
        onClick={() => scrollToSection(lenisRef, 'vault')}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-white/50 hover:text-white transition-colors"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
      >
        <span className="text-[10px] uppercase tracking-widest font-semibold">Scroll to explore</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </motion.div>
      </motion.button>
    </section>
  )
})

export default Hero
