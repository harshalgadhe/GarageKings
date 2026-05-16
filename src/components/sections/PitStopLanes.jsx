import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { pitStopLanes } from '../../data/content'

const PitStopLanes = forwardRef(function PitStopLanes(_props, ref) {
  return (
    <section ref={ref} id="lanes" className="relative z-20 min-h-[100svh] py-32 md:py-40 bg-gk-black gk-checkered-flag overflow-hidden">
      {/* Blending Gradients */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-gk-black to-transparent z-0 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-gk-black to-transparent z-0 pointer-events-none" />

      {/* The Hot Wheels Track Line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-4 md:w-6 -translate-x-1/2 gk-hotwheels-track hidden md:block z-0" />

      <div className="relative px-8 md:px-16 max-w-5xl mx-auto z-10">
        <motion.div
          className="text-center mb-20 relative z-10 flex justify-center"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="inline-block bg-gk-black/90 backdrop-blur-md px-8 md:px-12 py-8 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.9)]">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-gk-orange">
              Inventory Lanes
            </p>
            <h2 className="mt-6 text-4xl font-black italic tracking-tighter text-white md:text-6xl uppercase">
              <span className="bg-gk-yellow text-gk-black px-6 py-2 inline-block shadow-[0_0_30px_rgba(255,184,0,0.4)]">
                The Pit Stops
              </span>
            </h2>
            <p className="mt-5 max-w-xl mx-auto text-base text-white/70 font-medium">
              Four lanes. One vault. Find your niche.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-x-24 md:gap-y-12 items-start">
          {pitStopLanes.map((lane, i) => {
            const isEven = i % 2 === 0;
            return (
              <motion.div
                key={lane.id}
                className={`relative group rounded-3xl border-2 border-white/5 bg-gk-surface-2/90 backdrop-blur-md p-10 transition-all duration-500 hover:border-gk-orange/50 hover:bg-black hover:-translate-y-2 hover:shadow-[0_0_40px_rgba(255,90,0,0.15)] ${
                  !isEven ? 'md:mt-32' : 'md:-mt-16'
                }`}
                initial={{ opacity: 0, x: isEven ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.8, delay: (i % 2) * 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Connector line to the main track (desktop only) */}
                <div className={`absolute top-1/2 -translate-y-1/2 w-12 h-2 gk-hotwheels-track hidden md:block opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${isEven ? '-right-12' : '-left-12'}`} />
                
                <div className="mb-6 h-1.5 w-16 bg-gk-orange transform -skew-x-12" />
                <h3 className="text-2xl font-black italic uppercase tracking-wider text-white group-hover:text-gk-orange transition-colors">
                  {lane.title}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-white/60">{lane.body}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
})

export default PitStopLanes
