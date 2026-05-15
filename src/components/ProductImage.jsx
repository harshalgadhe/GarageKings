import { useState } from 'react'

export default function ProductImage({ src, alt, className = '' }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  const fallback = `https://placehold.co/800x1000/141414/FFB800?text=${encodeURIComponent(alt || 'Hot Wheels')}`

  return (
    <div className={`relative overflow-hidden bg-gk-surface-2 ${className}`}>
      <div
        className={`absolute inset-0 bg-gk-surface-2 transition-opacity duration-500 ${
          loaded ? 'opacity-0' : 'opacity-100'
        }`}
      />
      <img
        src={error ? fallback : src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setError(true)
          setLoaded(true)
        }}
        className={`h-full w-full object-cover transition duration-700 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
    </div>
  )
}
