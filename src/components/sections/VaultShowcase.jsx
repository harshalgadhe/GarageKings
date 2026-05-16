import { forwardRef, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { vaultProducts } from '../../data/content'

gsap.registerPlugin(ScrollTrigger)

const VaultShowcase = forwardRef(function VaultShowcase({ carouselCars = [] }, ref) {
  const containerRef = useRef(null)
  const scrollWrapperRef = useRef(null)
  const carouselRef = useRef(null)

  const activeCars = carouselCars && carouselCars.length > 0 ? carouselCars : vaultProducts

  useEffect(() => {
    const container = containerRef.current
    const carousel = carouselRef.current
    if (!container || !carousel) return

    let ctx = gsap.context(() => {
      const getScrollAmount = () => carousel.scrollWidth - window.innerWidth + 100

      gsap.to(carousel, {
        x: () => -getScrollAmount(),
        ease: 'none',
        scrollTrigger: {
          trigger: scrollWrapperRef.current,
          start: 'top top',
          end: () => `+=${getScrollAmount()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      })
    })

    return () => ctx.revert()
  }, [activeCars.length])

  return (
    <section 
      ref={(node) => {
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
        containerRef.current = node
      }} 
      id="vault" 
      className="relative w-full"
    >
      {/* 
        This wrapper is what gets pinned. Its height will be 100vh during the pin.
      */}
      <div ref={scrollWrapperRef} className="h-screen w-full flex flex-col justify-start pt-24 md:pt-32 overflow-hidden bg-gk-black">
        
        <div className="px-8 md:px-16 w-full mb-12">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gk-yellow">
              Featured Pulls
            </p>
            <h2 className="mt-3 text-5xl font-bold tracking-tight text-white md:text-7xl">
              The Vault
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/50">
              Macro-lit. Mint-documented. Hover over a casting to reveal its finish.
            </p>
          </motion.div>
        </div>

        {/* The horizontal scrolling track */}
        <div 
          ref={carouselRef} 
          className="flex gap-8 px-8 md:px-16 w-max pb-12"
        >
          {activeCars.map((product) => (
            <div 
              key={product.id || product.name} 
              className="relative w-[80vw] md:w-[400px] h-[50vh] min-h-[400px] shrink-0 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden group transition-all duration-500 hover:border-gk-yellow/40"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />
              
              <img 
                src={product.image} 
                alt={product.name} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              <div className="absolute bottom-0 left-0 w-full p-8 z-20">
                <span className="inline-block px-3 py-1 mb-3 text-[10px] font-bold uppercase tracking-widest text-gk-black bg-gk-yellow rounded-full">
                  {product.grade}
                </span>
                <h3 className="text-2xl font-bold text-white mb-1">{product.name}</h3>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-sm font-medium text-white/60">{product.lane}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
})

export default VaultShowcase
