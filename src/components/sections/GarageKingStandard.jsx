import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { standardPoints } from '../../data/content'

const GarageKingStandard = forwardRef(function GarageKingStandard(_props, ref) {
  return (
    <section ref={ref} id="standard" className="relative z-20 py-32 md:py-40 bg-gk-black border-t border-white/5">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,184,0,0.03)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative px-8 md:px-16 max-w-6xl mx-auto z-10">
        <motion.div
          className="text-center mb-24"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gk-yellow">
            Trust Layer
          </p>
          <h2 className="mt-4 text-5xl font-bold tracking-tight text-white md:text-7xl">
            The Standard
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-lg leading-relaxed text-white/50">
            We are not a grading company — we are curators who verify every piece before it enters the vault.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {standardPoints.map((point, i) => {
            // Bento box layout logic:
            // Item 0: 2 cols
            // Item 1: 1 col
            // Item 2: 1 col
            // Item 3: 2 cols
            const isWide = i === 0 || i === 3;
            
            const icons = [
              // 0: Search/Globe
              <svg key="0" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gk-yellow"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>,
              // 1: Eye
              <svg key="1" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>,
              // 2: Shield
              <svg key="2" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>,
              // 3: Box
              <svg key="3" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gk-yellow"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
            ];

            return (
              <motion.article
                key={point.title}
                className={`relative group rounded-[2rem] border border-white/5 bg-white/[0.02] p-10 overflow-hidden backdrop-blur-xl transition-all duration-500 hover:border-gk-yellow/30 hover:bg-white/[0.04] ${isWide ? 'md:col-span-2' : 'md:col-span-1'}`}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Subtle hover gradient inside card */}
                <div className="absolute inset-0 bg-gradient-to-br from-gk-yellow/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                
                <div className="mb-12 inline-flex items-center justify-center rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 group-hover:ring-gk-yellow/30 group-hover:scale-110 transition-all duration-500">
                  {icons[i]}
                </div>
                
                <h3 className="text-2xl font-bold text-white tracking-wide mb-4 group-hover:text-gk-yellow transition-colors duration-300">
                  {point.title}
                </h3>
                <p className="text-base leading-relaxed text-white/50 group-hover:text-white/70 transition-colors duration-300">
                  {point.body}
                </p>
                
                <span className="absolute top-10 right-10 font-mono text-[10px] font-bold text-white/10 group-hover:text-gk-yellow/20 transition-colors text-6xl tracking-tighter">
                  0{i + 1}
                </span>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
})

export default GarageKingStandard
