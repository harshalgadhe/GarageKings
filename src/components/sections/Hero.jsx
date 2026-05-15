import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { BRAND } from '../../data/content'
import { scrollToSection, useLenis } from '../../providers/SmoothScroll'

const Hero = forwardRef(function Hero(_props, ref) {
  const lenisRef = useLenis()

  return (
    <section
      ref={ref}
      id="hero"
      className="relative flex min-h-[100svh] flex-col items-center justify-center px-6 pt-28 pb-40"
    >
      <motion.div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(255,184,0,0.08),transparent_60%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      />

      <motion.div className="relative z-10 mx-auto max-w-4xl text-center md:ml-auto md:mr-8 md:max-w-xl md:text-right lg:mr-[12%]">
        <motion.img
          src="/brand-logo.png"
          alt={BRAND.name}
          className="mx-auto h-20 w-20 rounded-full object-cover ring-2 ring-gk-yellow/30 md:mx-0 md:ml-auto md:h-24 md:w-24"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />

        <motion.p
          className="mt-8 text-xs font-semibold uppercase tracking-[0.35em] text-gk-yellow"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.8 }}
        >
          {BRAND.tagline}
        </motion.p>

        <motion.h1
          className="mt-4 text-4xl font-bold leading-[1.05] tracking-tight text-white md:text-6xl lg:text-7xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          The Cars You Drew in School.
        </motion.h1>

        <motion.p
          className="mt-6 max-w-xl text-base leading-relaxed text-white/55 md:ml-auto md:text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          Handpicked, collector-grade Hot Wheels for the man who never outgrew the garage.
          No fakes. No damage. Guaranteed.
        </motion.p>

        <motion.p
          className="mt-4 text-sm font-medium text-gk-yellow/90"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {BRAND.pillars}
        </motion.p>

        <motion.button
          type="button"
          onClick={() => scrollToSection(lenisRef, 'vault')}
          className="gk-btn-primary mt-10 px-10 py-4 text-sm md:text-base"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileTap={{ scale: 0.98 }}
        >
          Enter the Vault
        </motion.button>
      </motion.div>

      <motion.div
        className="absolute bottom-12 right-8 flex flex-col items-center gap-2 md:right-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <span className="text-[10px] uppercase tracking-[0.3em] text-white/35">Scroll the pit lane</span>
        <motion.div className="h-10 w-px bg-gradient-to-b from-gk-yellow to-transparent" />
      </motion.div>
    </section>
  )
})

export default Hero
