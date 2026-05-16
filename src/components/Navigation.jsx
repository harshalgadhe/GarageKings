import { motion } from 'framer-motion'
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

  return (
    <motion.header
      className="fixed top-0 right-0 left-0 z-[60] bg-gradient-to-b from-gk-black/90 via-gk-black/40 to-transparent pt-2 pb-8"
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
        <button
          type="button"
          onClick={() => scrollToSection(lenisRef, 'hero')}
          className="flex shrink-0 items-center gap-2.5"
        >
          <img
            src="/brand-logo.png"
            alt={BRAND.name}
            className="h-9 w-9 rounded-full object-cover ring-1 ring-gk-yellow/25 md:h-10 md:w-10"
          />
          <span className="hidden text-left sm:block">
            <span className="block text-[10px] font-medium uppercase tracking-[0.2em] text-gk-yellow">
              Die-cast Vault
            </span>
            <span className="block text-sm font-bold text-white">{BRAND.name}</span>
          </span>
        </button>

        <nav>
          <ul className="flex gap-1 overflow-x-auto hide-scrollbar">
            {links.map((link, i) => (
              <li key={link.id}>
                <button
                  type="button"
                  onClick={() => scrollToSection(lenisRef, link.id)}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-300 md:px-4 md:text-sm ${
                    activeSection === i
                      ? 'bg-gk-yellow text-gk-black'
                      : 'text-white/55 hover:text-gk-yellow'
                  }`}
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </motion.header>
  )
}
