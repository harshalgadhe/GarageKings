import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { standardPoints } from '../../data/content'

const GarageKingStandard = forwardRef(function GarageKingStandard(_props, ref) {
  return (
    <section ref={ref} id="standard" className="relative min-h-[100svh] py-32 md:py-40">
      <div className="mx-auto max-w-6xl px-6 md:ml-auto md:max-w-2xl md:pr-[8%] lg:pr-[14%]">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gk-yellow">
            Trust Layer
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-5xl">
            The Garage King Standard
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/50">
            We are not a grading company — we are curators who verify every piece before it
            enters the vault.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 md:gap-8">
          {standardPoints.map((point, i) => (
            <motion.article
              key={point.title}
              className="rounded-2xl border border-gk-border bg-gk-surface p-8 md:p-10"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="font-mono text-xs font-bold text-gk-yellow">0{i + 1}</span>
              <h3 className="mt-3 text-xl font-bold text-white">{point.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/55">{point.body}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
})

export default GarageKingStandard
