import { motion } from 'framer-motion'

export default function AmbientScene() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="gk-grid-floor absolute inset-0" />
      <motion.div
        className="absolute -top-1/4 left-1/2 h-[60vh] w-[80vw] -translate-x-1/2 rounded-full bg-gk-yellow/[0.04] blur-[100px]"
        animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.08, 1] }}
        transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute right-0 bottom-0 h-[40vh] w-[40vw] rounded-full bg-gk-yellow/[0.03] blur-[80px]"
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut', delay: 1 }}
      />
      </div>
    )
  }
