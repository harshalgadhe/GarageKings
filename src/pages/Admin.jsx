import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Edit2, ChevronUp, ChevronDown, Save, X, Image as ImageIcon, Settings, Eye, EyeOff, LogOut } from 'lucide-react'
import { getCars, addCar, updateCar, deleteCar, updateCarOrder, uploadImageToStorage, isFirebaseConfigured, getGlobalSettings, updateGlobalSettings, auth } from '../lib/db'
import { Link } from 'react-router-dom'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [dbError, setDbError] = useState('')
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  const [cars, setCars] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [globalSettings, setGlobalSettings] = useState({ showPrices: false, adminPath: '9f7a4b2c-8d1e-45a9-b3f6-c1d2e8a7b9f0' })
  const [tempAdminPath, setTempAdminPath] = useState('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  
  // Form state
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ name: '', lane: '', grade: '', price: '', currency: '₹', image: '', brand: '', scale: '1:64', description: '', carBrand: '', year: '', isHero: false, isCarousel: false })

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setDbError("Missing Firebase configuration. Please add your keys to the .env file.")
      setIsAuthLoading(false)
      return
    }
    
    // Listen to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
      }
      setIsAuthLoading(false)
    })
    
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (isAuthenticated && isFirebaseConfigured) {
      loadData()
    }
  }, [isAuthenticated])

  const loadData = async () => {
    try {
      const [carData, settingsData] = await Promise.all([getCars(), getGlobalSettings()])
      setCars(carData)
      setGlobalSettings(settingsData)
      setTempAdminPath(settingsData?.adminPath || '9f7a4b2c-8d1e-45a9-b3f6-c1d2e8a7b9f0')
    } catch (err) {
      alert(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleShowPrices = async () => {
    const newValue = !globalSettings.showPrices
    setGlobalSettings({ ...globalSettings, showPrices: newValue })
    try {
      await updateGlobalSettings({ showPrices: newValue })
    } catch (e) {
      alert("Failed to update settings: " + e.message)
      setGlobalSettings({ ...globalSettings, showPrices: !newValue }) // revert
    }
  }

  const saveAdminPath = async () => {
    if (!tempAdminPath.trim()) return alert("Admin path cannot be empty")
    if (!/^[a-zA-Z0-9-_]+$/.test(tempAdminPath)) {
      return alert("Admin path can only contain letters, numbers, dashes, and underscores.")
    }
    
    try {
      await updateGlobalSettings({ adminPath: tempAdminPath.trim() })
      setGlobalSettings({ ...globalSettings, adminPath: tempAdminPath.trim() })
      alert("Admin path updated! Note: You will need to use this new URL to access this page next time.")
      setIsSettingsOpen(false)
    } catch (e) {
      alert("Failed to update admin path: " + e.message)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!isFirebaseConfigured) {
      setError('Cannot login without Firebase configuration.')
      return
    }
    
    try {
      await signInWithEmailAndPassword(auth, email, password)
      setError('')
    } catch (err) {
      setError("Invalid email or password")
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (e) {
      console.error(e)
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      // In production, upload to Firebase Storage
      const url = await uploadImageToStorage(file)
      if (url) {
        setFormData({ ...formData, image: url })
      }
    } catch (err) {
      alert("Failed to upload image to Firebase Storage: " + err.message)
    }
  }

  const handleSave = async () => {
    if (!formData.name || !formData.price) return alert("Name and price are required")
    
    // Validation for max Hero and Carousel items
    if (formData.isHero) {
      const heroCount = cars.filter(c => c.isHero && c.id !== editingId).length
      if (heroCount >= 4) {
        return alert("Maximum of 4 Hero cars allowed. Please uncheck another Hero car first.")
      }
    }
    
    if (formData.isCarousel) {
      const carouselCount = cars.filter(c => c.isCarousel && c.id !== editingId).length
      if (carouselCount >= 8) {
        return alert("Maximum of 8 Carousel cars allowed. Please uncheck another Carousel car first.")
      }
    }
    
    try {
      if (editingId) {
        await updateCar(editingId, formData)
      } else {
        await addCar(formData)
      }
      
      setFormData({ name: '', lane: '', grade: '', price: '', currency: '₹', image: '', brand: '', scale: '1:64', description: '', carBrand: '', year: '', isHero: false, isCarousel: false })
      setIsAdding(false)
      setEditingId(null)
      loadData()
    } catch (err) {
      alert("Failed to save item to database: " + err.message)
      console.error(err)
    }
  }

  const handleEdit = (car) => {
    setFormData({ brand: '', scale: '1:64', description: '', carBrand: '', year: '', currency: '₹', isHero: false, isCarousel: false, ...car })
    setEditingId(car.id)
    setIsAdding(true)
  }

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this item?")) {
      await deleteCar(id)
      loadData()
    }
  }

  const handleMove = async (index, direction) => {
    const newCars = [...cars]
    if (direction === 'up' && index > 0) {
      const temp = newCars[index];
      newCars[index] = newCars[index - 1];
      newCars[index - 1] = temp;
    } else if (direction === 'down' && index < newCars.length - 1) {
      const temp = newCars[index];
      newCars[index] = newCars[index + 1];
      newCars[index + 1] = temp;
    } else {
      return
    }
    setCars(newCars)
    await updateCarOrder(newCars)
  }

  if (isAuthLoading) {
    return <div className="min-h-[100svh] bg-gk-black flex items-center justify-center text-white/50">Checking security...</div>
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[100svh] bg-gk-black flex items-center justify-center p-6">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl w-full max-w-sm flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-2">Secure Vault</h1>
            <p className="text-sm text-white/50">Admin Authentication Required</p>
          </div>
          
          {dbError && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 text-sm p-4 rounded-lg">
              {dbError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gk-yellow transition-colors"
              placeholder="Admin Email"
              disabled={!isFirebaseConfigured}
            />
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gk-yellow transition-colors"
              placeholder="Password"
              disabled={!isFirebaseConfigured}
            />
            {error && <p className="text-gk-orange text-xs mt-2">{error}</p>}
            
            <button 
              type="submit" 
              disabled={!isFirebaseConfigured}
              className="w-full bg-gk-yellow text-gk-black font-bold py-3 rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Authenticate
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100svh] bg-gk-black text-white p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">Vault Manager</h1>
            <p className="text-white/50 mt-2">Manage your die-cast inventory and marketplace listings.</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={toggleShowPrices}
              className={`px-4 py-2.5 rounded-full border text-sm font-semibold flex items-center gap-2 transition-colors ${globalSettings.showPrices ? 'border-gk-yellow text-gk-yellow bg-gk-yellow/10' : 'border-white/20 text-white hover:bg-white/10'}`}
            >
              {globalSettings.showPrices ? <><Eye size={16} /> Prices Visible</> : <><EyeOff size={16} /> Prices Hidden</>}
            </button>
            <button 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`px-4 py-2.5 rounded-full border text-sm font-semibold flex items-center gap-2 transition-colors ${isSettingsOpen ? 'border-white text-white bg-white/10' : 'border-white/20 text-white hover:bg-white/10'}`}
            >
              <Settings size={16} /> Security
            </button>
            <Link to="/marketplace" className="px-6 py-2.5 rounded-full border border-white/20 text-sm font-semibold hover:bg-white/10 transition-colors">
              View Marketplace
            </Link>
            <button 
              onClick={() => {
                setFormData({ name: '', lane: '', grade: '', price: '', currency: '₹', image: '', brand: '', scale: '1:64', description: '', carBrand: '', year: '', isHero: false, isCarousel: false })
                setEditingId(null)
                setIsAdding(true)
              }}
              className="px-6 py-2.5 rounded-full bg-gk-yellow text-black text-sm font-bold flex items-center gap-2 hover:bg-yellow-400 transition-colors"
            >
              <Plus size={16} /> Add Item
            </button>
            <button 
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-sm font-bold flex items-center gap-2 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-colors"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </header>

        <AnimatePresence>
          {isSettingsOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-12 overflow-hidden"
            >
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-start gap-4">
                  <div className="text-red-400 mt-1 hidden md:block"><Settings size={24} /></div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2">Secret Admin URL</h3>
                    <p className="text-sm text-white/60 mb-4 max-w-2xl">
                      Change the secret path required to access this admin panel. Do not include slashes. 
                      Your current login URL is: <code className="bg-black/50 px-2 py-1 rounded text-gk-yellow break-all">yourdomain.com/{globalSettings.adminPath}/admin</code>
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <input 
                        type="text" 
                        value={tempAdminPath}
                        onChange={(e) => setTempAdminPath(e.target.value)}
                        className="flex-1 max-w-md bg-black/50 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500"
                      />
                      <button 
                        onClick={saveAdminPath}
                        className="px-6 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold transition-colors whitespace-nowrap"
                      >
                        Update URL
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isAdding && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-12 overflow-hidden"
            >
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">{editingId ? 'Edit Item' : 'New Item'}</h2>
                  <button onClick={() => setIsAdding(false)} className="text-white/50 hover:text-white"><X size={20} /></button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Item Name</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gk-yellow" placeholder="e.g. Nissan Skyline GT-R" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Price</label>
                    <div className="flex gap-2">
                      <select 
                        value={formData.currency} 
                        onChange={e => setFormData({...formData, currency: e.target.value})}
                        className="bg-black/50 border border-white/10 rounded-lg px-3 py-3 text-white focus:outline-none focus:border-gk-yellow outline-none appearance-none cursor-pointer"
                      >
                        <option value="₹">₹</option>
                        <option value="$">$</option>
                        <option value="€">€</option>
                        <option value="£">£</option>
                      </select>
                      <input type="text" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gk-yellow" placeholder="e.g. 4999" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Die-cast Maker</label>
                    <input type="text" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gk-yellow" placeholder="e.g. Hot Wheels, MiniGT" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Car Brand (Make)</label>
                    <input type="text" value={formData.carBrand} onChange={e => setFormData({...formData, carBrand: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gk-yellow" placeholder="e.g. Porsche, Nissan" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Release Year</label>
                    <input type="text" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gk-yellow" placeholder="e.g. 2024" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Scale</label>
                    <input type="text" value={formData.scale} onChange={e => setFormData({...formData, scale: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gk-yellow" placeholder="e.g. 1:64" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Lane / Category</label>
                    <input type="text" value={formData.lane} onChange={e => setFormData({...formData, lane: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gk-yellow" placeholder="e.g. The Grail Room" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Condition Grade</label>
                    <input type="text" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gk-yellow" placeholder="e.g. MIB · Short Card" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Description</label>
                    <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gk-yellow" placeholder="Enter full details about this piece..."></textarea>
                  </div>
                  <div className="md:col-span-2 flex flex-col md:flex-row gap-6 p-4 bg-black/30 border border-white/5 rounded-lg">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.isHero ? 'bg-gk-yellow border-gk-yellow text-black' : 'border-white/20 bg-black group-hover:border-white/40'}`}>
                        {formData.isHero && <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3"><path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <input type="checkbox" className="hidden" checked={formData.isHero} onChange={(e) => setFormData({...formData, isHero: e.target.checked})} />
                      <span className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">Feature in Hero (Max 4)</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.isCarousel ? 'bg-gk-orange border-gk-orange text-black' : 'border-white/20 bg-black group-hover:border-white/40'}`}>
                        {formData.isCarousel && <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3"><path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <input type="checkbox" className="hidden" checked={formData.isCarousel} onChange={(e) => setFormData({...formData, isCarousel: e.target.checked})} />
                      <span className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">Feature in Carousel (Max 8)</span>
                    </label>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Image Upload</label>
                    <div className="flex items-center gap-6">
                      <div className="h-24 w-24 rounded-lg bg-black/50 border border-dashed border-white/20 flex items-center justify-center overflow-hidden shrink-0">
                        {formData.image ? <img src={formData.image} alt="Preview" className="w-full h-full object-cover" /> : <ImageIcon className="text-white/20" />}
                      </div>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm text-white/50 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer" />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button onClick={handleSave} className="px-8 py-3 bg-gk-yellow text-black rounded-lg font-bold flex items-center gap-2 hover:bg-yellow-400">
                    <Save size={18} /> Save Item
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inventory List */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-white/5 text-xs font-semibold text-white/50 uppercase tracking-wider">
            <div className="col-span-1 text-center">Order</div>
            <div className="col-span-2">Image</div>
            <div className="col-span-4">Details</div>
            <div className="col-span-2">Price</div>
            <div className="col-span-3 text-right">Actions</div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-white/50">Loading vault...</div>
          ) : cars.length === 0 ? (
            <div className="p-12 text-center text-white/50">The vault is empty.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {cars.map((car, index) => (
                <div key={car.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group">
                  <div className="col-span-1 flex flex-col items-center gap-1 opacity-50 group-hover:opacity-100">
                    <button onClick={() => handleMove(index, 'up')} className="hover:text-gk-yellow disabled:opacity-20" disabled={index === 0}><ChevronUp size={16} /></button>
                    <button onClick={() => handleMove(index, 'down')} className="hover:text-gk-yellow disabled:opacity-20" disabled={index === cars.length - 1}><ChevronDown size={16} /></button>
                  </div>
                  <div className="col-span-2">
                    <img src={car.image || '/vault-1.png'} alt={car.name} className="w-16 h-12 object-cover rounded bg-black" />
                  </div>
                  <div className="col-span-4">
                    <div className="font-bold text-sm">{car.name}</div>
                    <div className="text-[10px] text-gk-orange uppercase tracking-wider mt-0.5">{car.carBrand ? `${car.brand} • ${car.carBrand}` : car.brand}</div>
                    <div className="text-xs text-white/50 mt-1">{car.lane} • {car.grade}</div>
                  </div>
                  <div className="col-span-2 font-mono text-sm text-gk-yellow">{car.currency || '₹'}{car.price}</div>
                  <div className="col-span-3 flex justify-end gap-3">
                    <button onClick={() => handleEdit(car)} className="p-2 text-white/50 hover:text-white bg-white/5 rounded-lg hover:bg-white/10 transition-colors"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(car.id)} className="p-2 text-white/50 hover:text-gk-orange bg-white/5 rounded-lg hover:bg-red-500/10 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
