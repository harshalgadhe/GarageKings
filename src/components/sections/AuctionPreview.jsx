import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Gavel, Clock, Trophy, ChevronRight, ShieldCheck, Zap, Heart } from 'lucide-react'

export default forwardRef(function AuctionPreview(props, ref) {
  const features = [
    {
      icon: <Zap size={20} className="text-purple-400" />,
      title: "Real-time Bidding",
      desc: "Experience high-stakes competition with instant bid updates and zero lag."
    },
    {
      icon: <ShieldCheck size={20} className="text-purple-400" />,
      title: "Fair Play",
      desc: "Mandatory bid increments ensure every bid is meaningful and fair for all collectors."
    },
    {
      icon: <Trophy size={20} className="text-purple-400" />,
      title: "Grail Drops",
      desc: "We exclusively auction the most sought-after RLCs, STHs, and limited chases."
    }
  ]

  return (
    <section ref={ref} id="auctions-info" className="py-24 md:py-32 relative overflow-hidden bg-gk-black">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-900/10 blur-[100px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Side: Content */}
          <div>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-black uppercase tracking-widest mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              The Auction House
            </motion.div>

            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-8"
            >
              Where <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-200">Legends</span> <br />
              Find New Homes.
            </motion.h2>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-white/50 max-w-xl mb-10 leading-relaxed"
            >
              Our standalone auction platform is designed for the serious collector. No "DM for price" games—just transparent, competitive bidding on the rarest die-cast grails in India.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <Link to="/auctions" className="px-8 py-4 rounded-full bg-purple-500 hover:bg-purple-400 text-white font-black uppercase tracking-widest text-sm transition-all shadow-[0_0_30px_rgba(168,85,247,0.4)] flex items-center gap-2">
                <Gavel size={18} /> Enter the Auction
              </Link>
              <Link to="/marketplace" className="px-8 py-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-widest text-sm transition-all flex items-center gap-2">
                Browse Marketplace
              </Link>
            </motion.div>
          </div>

          {/* Right Side: Features Grid */}
          <div className="grid grid-cols-1 gap-4">
            {features.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + (idx * 0.1) }}
                className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm group hover:border-purple-500/30 transition-all duration-500"
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}

          </div>

        </div>
      </div>
    </section>
  )
})
