import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { getCars, isFirebaseConfigured, getGlobalSettings } from '../lib/db'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Search } from 'lucide-react'
import { BRAND } from '../data/content'

export default function Marketplace() {
  const [cars, setCars] = useState([])
  const [settings, setSettings] = useState({ showPrices: false })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      if (!isFirebaseConfigured) {
        setError("Missing Firebase configuration. Please add your keys to the .env file.")
        setIsLoading(false)
        return
      }
      try {
        const [carData, settingsData] = await Promise.all([getCars(), getGlobalSettings()])
        setCars(carData)
        // Ensure showPrices is strictly boolean
        setSettings({ showPrices: settingsData?.showPrices === true })
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const filteredCars = useMemo(() => {
    if (!searchQuery.trim()) return cars;
    const query = searchQuery.toLowerCase();
    return cars.filter(car => {
      return (
        (car.name && car.name.toLowerCase().includes(query)) ||
        (car.brand && car.brand.toLowerCase().includes(query)) ||
        (car.carBrand && car.carBrand.toLowerCase().includes(query)) ||
        (car.lane && car.lane.toLowerCase().includes(query))
      )
    })
  }, [cars, searchQuery])

  return (
    <div className="min-h-[100svh] bg-gk-black text-white selection:bg-gk-yellow selection:text-black">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gk-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
            <ArrowLeft size={18} />
            <span className="text-sm font-bold uppercase tracking-wider">Back</span>
          </button>
          
          <div className="flex items-center gap-3">
            <img src="/brand-logo.png" alt="Logo" className="w-8 h-8 rounded-full border border-white/20" />
            <span className="font-black tracking-tight">{BRAND.name}</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative py-16 md:py-24 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,51,0,0.1)_0%,transparent_70%)]" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter mb-4">
            The <span className="text-gk-orange">Marketplace.</span>
          </h1>
          <p className="text-base md:text-lg text-white/50 max-w-xl mx-auto mb-8 md:mb-10">
            Exclusive die-cast inventory, curated and strictly graded. Secure your piece of the vault.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-gk-yellow transition-colors">
              <Search size={20} />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, brand, or category..."
              className="w-full bg-black/50 border border-white/20 rounded-full py-3.5 md:py-4 pl-12 pr-6 text-sm md:text-base text-white placeholder-white/30 focus:outline-none focus:border-gk-yellow focus:ring-1 focus:ring-gk-yellow transition-all"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        {error ? (
          <div className="text-center py-20 md:py-32">
            <div className="inline-block bg-red-500/20 border border-red-500/50 text-red-200 p-6 rounded-2xl max-w-lg">
              <h3 className="font-bold mb-2">Vault Connection Failed</h3>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-20 md:py-32">
            <div className="animate-pulse flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-gk-orange/30 border-t-gk-orange animate-spin" />
              <div className="text-sm font-bold uppercase tracking-widest text-gk-orange">Unlocking Vault...</div>
            </div>
          </div>
        ) : cars.length === 0 ? (
          <div className="text-center py-20 md:py-32 text-white/50">
            The marketplace is currently empty.
          </div>
        ) : filteredCars.length === 0 ? (
          <div className="text-center py-20 md:py-32 text-white/50">
            No items found matching "{searchQuery}".
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCars.map((car, index) => (
              <motion.div
                key={car.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative flex flex-col rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden hover:bg-white/10 transition-colors duration-500"
              >
                {/* Image */}
                <div 
                  className="aspect-[4/3] bg-black/10 overflow-hidden relative"
                  onContextMenu={(e) => e.preventDefault()}
                >
                  {/* Invisible Overlay to block right-clicks and dragging */}
                  <div className="absolute inset-0 z-30" />
                  
                  <img
                    src={car.image || '/vault-1.png'}
                    alt={car.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-[0.22,1,0.36,1] pointer-events-none select-none"
                    style={{ WebkitUserDrag: 'none' }}
                  />
                  <div className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest text-gk-yellow pointer-events-none shadow-xl">
                    {car.lane}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col grow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-white/40">
                      {car.grade}
                    </div>
                    {car.scale && (
                      <div className="text-[10px] font-bold uppercase tracking-wider text-white/30 bg-white/5 px-2 py-0.5 rounded">
                        {car.scale}
                      </div>
                    )}
                  </div>
                  
                  {(car.brand || car.carBrand) && (
                    <div className="text-[10px] font-black uppercase tracking-widest text-gk-orange mb-1">
                      {car.carBrand ? `${car.brand} • ${car.carBrand}` : car.brand}
                    </div>
                  )}
                  
                  <h3 className="text-xl font-bold leading-tight mb-3 group-hover:text-gk-orange transition-colors">
                    {car.name}
                  </h3>

                  {car.description && (
                    <p className="text-sm text-white/50 line-clamp-3 mb-6">
                      {car.description}
                    </p>
                  )}
                  
                  <div className="mt-auto pt-4 border-t border-white/10 flex items-end justify-between">
                    <div>
                      {settings.showPrices === true ? (
                        <>
                          <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Vault Price</div>
                          <div className="font-mono text-2xl text-white font-medium">{car.currency || '₹'}{car.price}</div>
                        </>
                      ) : (
                        <div className="text-xs uppercase tracking-wider text-gk-orange font-bold">DM for Price</div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
