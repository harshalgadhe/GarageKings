import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { pitStopLanes } from '../../data/content'

const PitStopLanes = forwardRef(function PitStopLanes(_props, ref) {
  return (
    <section ref={ref} id="lanes" className="relative min-h-[100svh] py-32 md:py-40">
      <div className="mx-auto max-w-6xl px-6 md:max-w-2xl md:pl-[8%] lg:pl-[14%]">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gk-yellow">
            Inventory Lanes
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-5xl">
            The Pit Stops
          </h2>
          <p className="mt-5 max-w-xl text-base text-white/50">
            Four lanes. One vault. Find your niche.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2">
          {pitStopLanes.map((lane, i) => (
            <motion.div
              key={lane.id}
              className="group rounded-2xl border border-gk-border bg-gk-surface-2 p-8 transition-colors hover:border-gk-yellow/30 md:p-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: i * 0.07 }}
            >
              <div className="mb-4 h-1 w-12 rounded-full bg-gk-yellow" />
              <h3 className="text-xl font-bold text-white group-hover:text-gk-yellow transition-colors">
                {lane.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/55">{lane.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
})

export default PitStopLanes
