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
  const [globalSettings, setGlobalSettings] = useState({ showPrices: false })
  
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

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      setError('')
    } catch (err) {
      setError("Failed to sign in with Google: " + err.message)
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

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink-0 mx-4 text-white/30 text-xs uppercase tracking-widest font-bold">Or</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={!isFirebaseConfigured}
            className="w-full bg-white text-black font-bold py-3 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
            Continue with Google
          </button>
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
          <div className="flex gap-4">
            <button 
              onClick={toggleShowPrices}
              className={`px-4 py-2.5 rounded-full border text-sm font-semibold flex items-center gap-2 transition-colors ${globalSettings.showPrices ? 'border-gk-yellow text-gk-yellow bg-gk-yellow/10' : 'border-white/20 text-white hover:bg-white/10'}`}
            >
              {globalSettings.showPrices ? <><Eye size={16} /> Prices Visible</> : <><EyeOff size={16} /> Prices Hidden</>}
            </button>
            <Link to="/marketplace" className="px-6 py-2.5 rounded-full border border-white/20 text-sm font-semibold hover:bg-white/10 transition-colors">
              View Marketplace
            </Link>
            <button 
              onClick={() => {
                setFormData({ name: '', lane: '', grade: '', price: '', currency: '₹', image: '', brand: '', scale: '1:64', description: '', carBrand: '', year: '' })
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
