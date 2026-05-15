import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { vaultProducts } from '../../data/content'
import ProductImage from '../ProductImage'

const VaultShowcase = forwardRef(function VaultShowcase(_props, ref) {
  return (
    <section ref={ref} id="vault" className="relative min-h-[100svh] py-32 md:py-40">
      <div className="mx-auto max-w-7xl px-6 md:ml-auto md:pr-[6%] lg:pr-[12%]">
        <motion.div
          className="mb-16 max-w-2xl"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gk-yellow">
            Featured Pulls
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-5xl">
            The Vault
          </h2>
          <p className="mt-5 text-base leading-relaxed text-white/50">
            Macro-lit. Mint-documented. Priced transparent — no DM games.
          </p>
        </motion.div>

        <motion.div
          className="flex gap-10 overflow-x-auto pb-8 hide-scrollbar snap-x snap-mandatory md:gap-14"
          data-lenis-prevent
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {vaultProducts.map((product, i) => (
            <motion.article
              key={product.id}
              className="w-[min(78vw,280px)] shrink-0 snap-center md:w-[300px]"
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="gk-macro-shadow overflow-hidden rounded-2xl border border-gk-border bg-gk-surface">
                <ProductImage
                  src={product.image}
                  alt={product.name}
                  className="aspect-[4/5]"
                />
                <div className="space-y-3 p-7 md:p-8">
                  <span className="inline-block rounded-full bg-gk-yellow/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gk-yellow">
                    {product.lane}
                  </span>
                  <h3 className="text-lg font-bold text-white">{product.name}</h3>
                  <p className="text-sm text-white/45">{product.grade}</p>
                  <p className="pt-2 text-2xl font-bold text-gk-yellow">{product.price}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  )
})

export default VaultShowcase
