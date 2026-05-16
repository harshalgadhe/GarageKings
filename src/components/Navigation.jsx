import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BRAND } from '../data/content'
import { scrollToSection, useLenis } from '../providers/SmoothScroll'

const links = [
  { id: 'hero', label: 'Home' },
  { id: 'standard', label: 'Standard' },
  { id: 'lanes', label: 'Lanes' },
  { id: 'vault', label: 'Vault' },
  { id: 'drop', label: 'Drop' },
]

export default function Navigation({ activeSection }) {
  const lenisRef = useLenis()
  const [isOpen, setIsOpen] = useState(false)

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleNavClick = (id) => {
    setIsOpen(false)
    scrollToSection(lenisRef, id)
  }

  return (
    <>
      <motion.header
        className="fixed top-0 right-0 left-0 z-[70] bg-gradient-to-b from-gk-black/90 via-gk-black/40 to-transparent pt-2 pb-8 pointer-events-none"
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-8 py-4 md:px-12 pointer-events-auto">
          <button
            type="button"
            onClick={() => handleNavClick('hero')}
            className="flex shrink-0 items-center gap-3 relative z-[80]"
          >
            <img
              src="/brand-logo.png"
              alt={BRAND.name}
              className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover ring-1 ring-gk-yellow/30 shadow-[0_0_15px_rgba(255,179,0,0.2)]"
            />
            <span className="text-left">
              <span className="block text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-gk-yellow">
                Die-cast Vault
              </span>
              <span className="block text-sm md:text-base font-black tracking-tight text-white">{BRAND.name}</span>
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <ul className="flex gap-6">
              {links.map((link) => (
                <li key={link.id}>
                  <button
                    type="button"
                    onClick={() => handleNavClick(link.id)}
                    className="whitespace-nowrap py-2 px-1 text-sm font-bold tracking-wide transition-colors duration-300 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] hover:text-gk-yellow"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            className="md:hidden relative z-[80] flex flex-col justify-center items-center w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/10"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            <span className={`bg-white block transition-all duration-300 ease-out h-[2px] w-5 rounded-sm ${isOpen ? 'rotate-45 translate-y-[3px]' : '-translate-y-1'}`} />
            <span className={`bg-white block transition-all duration-300 ease-out h-[2px] w-5 rounded-sm my-0.5 ${isOpen ? 'opacity-0' : 'opacity-100'}`} />
            <span className={`bg-white block transition-all duration-300 ease-out h-[2px] w-5 rounded-sm ${isOpen ? '-rotate-45 -translate-y-[5px]' : 'translate-y-1'}`} />
          </button>
        </div>
      </motion.header>

      {/* Mobile Fullscreen Menu overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(24px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[60] bg-gk-black/95 flex flex-col items-center justify-center"
          >
            <nav className="flex flex-col gap-8 items-center w-full px-6">
              {links.map((link, i) => (
                <motion.button
                  key={link.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.4, delay: i * 0.05 + 0.1, ease: [0.22, 1, 0.36, 1] }}
                  type="button"
                  onClick={() => handleNavClick(link.id)}
                  className="group relative flex items-center justify-center w-full"
                >
                  <span className={`text-5xl font-black tracking-tighter uppercase transition-colors duration-300 ${
                    activeSection === i ? 'text-gk-yellow' : 'text-white/40 group-hover:text-white'
                  }`}>
                    {link.label}
                  </span>
                  {activeSection === i && (
                    <motion.div 
                      layoutId="mobile-nav-indicator"
                      className="absolute -bottom-4 w-2 h-2 rounded-full bg-gk-yellow shadow-[0_0_10px_rgba(255,179,0,0.8)]" 
                    />
                  )}
                </motion.button>
              ))}
            </nav>
            
            {/* Ambient glows inside menu */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gk-orange/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gk-yellow/10 rounded-full blur-[100px] pointer-events-none" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
