import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function LazyImage({
  src,
  alt,
  className = '',
  onClick,
  aspect = 'aspect-[4/3]',
}) {
  const [loaded, setLoaded] = useState(false)
  const [inView, setInView] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '120px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden bg-gk-surface ${aspect} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick()
            }
          : undefined
      }
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-gk-border to-gk-black"
        animate={{ opacity: loaded ? 0 : 1 }}
        transition={{ duration: 0.4 }}
      />
      {inView && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={`h-full w-full object-cover transition duration-700 ${
            loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          } ${onClick ? 'cursor-zoom-in' : ''}`}
          style={{
            filter: 'contrast(1.08) saturate(1.1)',
          }}
        />
      )}
      <motion.div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20"
        initial={false}
      />
    </div>
  )
}
