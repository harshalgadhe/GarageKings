import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Lightbox({ images, index, onClose, onNavigate }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onNavigate(1)
      if (e.key === 'ArrowLeft') onNavigate(-1)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, onNavigate])

  if (index === null || !images?.length) return null

  const current = images[index % images.length]

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative max-h-[90vh] max-w-5xl"
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={current}
            alt="Gallery detail"
            className="max-h-[85vh] w-auto max-w-full rounded-lg object-contain gk-macro-shadow"
            style={{ filter: 'contrast(1.05)' }}
          />
          <div className="mt-4 flex items-center justify-between gap-4 text-sm text-white/70">
            <span>
              {index + 1} / {images.length}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onNavigate(-1)}
                className="rounded-full border border-white/20 px-4 py-2 transition hover:border-gk-red hover:text-gk-red"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => onNavigate(1)}
                className="rounded-full border border-white/20 px-4 py-2 transition hover:border-gk-red hover:text-gk-red"
              >
                Next
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-gk-red px-4 py-2 font-medium text-white transition hover:bg-white hover:text-gk-black"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
