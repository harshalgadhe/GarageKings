import { forwardRef, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { BRAND } from '../../data/content'
import { scrollToSection, useLenis } from '../../providers/SmoothScroll'

gsap.registerPlugin(ScrollTrigger)

const DEFAULT_HERO_IMAGES = [
  '/hotwheels-car.png',
  '/vault-3.png',
  '/vault-4.png',
  '/vault-5.png',
]

const Hero = forwardRef(function Hero({ heroImages = [] }, ref) {
  const lenisRef = useLenis()
  const carRef = useRef(null)
  const containerRef = useRef(null)
  const [currentImgIndex, setCurrentImgIndex] = useState(0)

  // Always use a static image for the first slide so the page loads instantly.
  // The database images will begin showing from the second slide onwards.
  const staticFirstImage = '/hotwheels-car.png'
  
  const activeImages = heroImages && heroImages.length > 0 
    ? [staticFirstImage, ...heroImages] 
    : DEFAULT_HERO_IMAGES

  // Preload all hero images in the background so there's no delay/flicker when the slider changes
  useEffect(() => {
    activeImages.forEach(src => {
      const img = new Image()
      img.src = src
    })
  }, [activeImages])

  // Carousel auto-scroll
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImgIndex((prev) => (prev + 1) % activeImages.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [activeImages.length])

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
      className="relative flex h-[100svh] w-full flex-col items-start justify-end px-10 sm:px-12 md:px-16 pb-24 md:pb-32 overflow-hidden bg-gk-black"
    >
      {/* Full-Screen Cinematic Hero Image Carousel */}
      <div className="absolute inset-0 z-0 pointer-events-none" ref={carRef}>
        <AnimatePresence>
          <motion.img
            key={currentImgIndex}
            src={activeImages[currentImgIndex]}
            alt="Garage Kings Vault"
            className="absolute inset-0 w-full h-full object-cover object-[center_75%] md:object-center"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
        </AnimatePresence>
        
        {/* Gradients to protect text at bottom left */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gk-black z-10 opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/90 via-black/20 to-transparent z-10" />
      </div>

      <motion.div className="relative z-20 w-full max-w-3xl flex flex-col items-start text-left">
        <motion.p
          className="mb-4 text-xs font-bold uppercase tracking-[0.4em] text-gk-yellow drop-shadow-[0_2px_10px_rgba(0,0,0,1)]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.8 }}
        >
          {BRAND.tagline}
        </motion.p>

        <motion.h1
          className="text-4xl sm:text-5xl font-bold leading-[1.05] tracking-tighter text-white md:text-6xl lg:text-7xl drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          Die-Cast<br/>Curators.
        </motion.h1>
      </motion.div>

      {/* Scroll Down Indicator - Absolute Centered at Bottom */}
      <motion.button
        onClick={() => scrollToSection(lenisRef, 'vault')}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50 hover:text-gk-yellow transition-colors z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
      >
        <span className="hidden md:block text-[10px] uppercase tracking-widest font-semibold">Scroll to explore</span>
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
