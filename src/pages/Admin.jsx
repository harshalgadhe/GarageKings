import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Edit2, ChevronUp, ChevronDown, Save, X, Image as ImageIcon, Settings, Eye, EyeOff, LogOut } from 'lucide-react'
import { getCars, addCar, updateCar, deleteCar, updateCarOrder, uploadImageToStorage, isFirebaseConfigured, getGlobalSettings, updateGlobalSettings, getBids, getAuctions, addAuction, updateAuction, deleteAuction, getAuctionBids, getReceipts, addReceipt, deleteReceipt, auth } from '../lib/db'
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
  const [globalSettings, setGlobalSettings] = useState({ 
    showPrices: false, 
    adminPath: '9f7a4b2c-8d1e-45a9-b3f6-c1d2e8a7b9f0',
    dropDate: '',
    dropTime: '20:00',
    dropLabel: 'Friday · 8:00 PM IST',
    dropDesc: 'Every Friday at 8 PM IST, we release a fresh batch of 1:64 heat. The rarest pieces usually go in minutes.'
  })
  const [tempAdminPath, setTempAdminPath] = useState('')
  const [tempDropDate, setTempDropDate] = useState('')
  const [tempDropTime, setTempDropTime] = useState('20:00')
  const [tempDropLabel, setTempDropLabel] = useState('')
  const [tempDropDesc, setTempDropDesc] = useState('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  
  // Form state
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ name: '', lane: '', grade: '', price: '', currency: '₹', image: '', brand: '', scale: '1:64', description: '', carBrand: '', year: '', isHero: false, isCarousel: false })
  const [bidsModal, setBidsModal] = useState(null)
  const [bidsLoading, setBidsLoading] = useState(false)

  // Auction state
  const [adminTab, setAdminTab] = useState('inventory')
  const [auctions, setAuctions] = useState([])
  const [isAddingAuction, setIsAddingAuction] = useState(false)
  const [editingAuctionId, setEditingAuctionId] = useState(null)
  const [auctionForm, setAuctionForm] = useState({ title: '', brand: '', carBrand: '', scale: '1:64', grade: '', description: '', image: '', currency: '₹', startingPrice: '', minBidIncrement: '', endDate: '', endTime: '20:00' })
  const [auctionBidsModal, setAuctionBidsModal] = useState(null)
  const [auctionBidsLoading, setAuctionBidsLoading] = useState(false)

  // Receipt state
  const [receipts, setReceipts] = useState([])
  const [isAddingReceipt, setIsAddingReceipt] = useState(false)
  const [receiptSearch, setReceiptSearch] = useState('')
  const [receiptForm, setReceiptForm] = useState({
    receiptNumber: '',
    dateString: '',
    companyName: 'Garage Kings India',
    companyLocation: 'Delhi',
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    formatType: 'standard', // 'standard', 'prebooking', 'auction', 'custom'
    items: [{ qty: 1, description: '', amount: '' }],
    shippingCharges: 150,
    includeShipping: true,
    taxPercent: 0,
    footerNote: 'In the event that the order cannot be fulfilled from our end, a full refund will be issued.',
    pendingBalance: ''
  })
  const [activeReceiptPreview, setActiveReceiptPreview] = useState(null)

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
      const [carData, settingsData, auctionData, receiptData] = await Promise.all([
        getCars(),
        getGlobalSettings(),
        getAuctions(),
        getReceipts()
      ])
      setCars(carData)
      setAuctions(auctionData)
      setGlobalSettings(settingsData)
      setReceipts(receiptData)
      setTempAdminPath(settingsData?.adminPath || '9f7a4b2c-8d1e-45a9-b3f6-c1d2e8a7b9f0')
      const todayStr = new Date().toISOString().split('T')[0]
      setTempDropDate(settingsData?.dropDate || todayStr)
      setTempDropTime(settingsData?.dropTime || '20:00')
      setTempDropLabel(settingsData?.dropLabel || 'Friday · 8:00 PM IST')
      setTempDropDesc(settingsData?.dropDesc || 'Every Friday at 8 PM IST, we release a fresh batch of 1:64 heat. The rarest pieces usually go in minutes.')
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

  const saveDropSettings = async () => {
    try {
      const dropSettings = {
        dropDate: tempDropDate,
        dropTime: tempDropTime,
        dropLabel: tempDropLabel.trim(),
        dropDesc: tempDropDesc.trim()
      }
      await updateGlobalSettings(dropSettings)
      setGlobalSettings({ ...globalSettings, ...dropSettings })
      alert("Drop schedule updated successfully!")
    } catch (e) {
      alert("Failed to update drop settings: " + e.message)
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
    setFormData({ brand: '', scale: '1:64', description: '', carBrand: '', year: '', currency: '₹', isHero: false, isCarousel: false, isAuction: false, ...car })
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

  const handleAuctionImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const url = await uploadImageToStorage(file)
      if (url) setAuctionForm(f => ({ ...f, image: url }))
    } catch (err) { alert('Image upload failed: ' + err.message) }
  }

  const saveAuction = async () => {
    const { title, startingPrice, minBidIncrement, endDate, endTime } = auctionForm
    if (!title || !startingPrice || !minBidIncrement || !endDate || !endTime) {
      return alert('Please fill in Title, Starting Price, Min Increment, End Date and End Time.')
    }
    try {
      const data = { ...auctionForm, startingPrice: Number(startingPrice), minBidIncrement: Number(minBidIncrement) }
      if (editingAuctionId) {
        await updateAuction(editingAuctionId, data)
      } else {
        await addAuction(data)
      }
      setIsAddingAuction(false)
      setEditingAuctionId(null)
      setAuctionForm({ title: '', brand: '', carBrand: '', scale: '1:64', grade: '', description: '', image: '', currency: '₹', startingPrice: '', minBidIncrement: '', endDate: '', endTime: '20:00' })
      const refreshed = await getAuctions()
      setAuctions(refreshed)
    } catch (e) { alert('Failed to save: ' + e.message) }
  }

  const handleDeleteAuction = async (id) => {
    if (confirm('Delete this auction?')) {
      await deleteAuction(id)
      setAuctions(prev => prev.filter(a => a.id !== id))
    }
  }

  const viewAuctionBids = async (auction) => {
    setAuctionBidsLoading(true)
    setAuctionBidsModal({ auction, bids: [] })
    try {
      const bids = await getAuctionBids(auction.id)
      setAuctionBidsModal({ auction, bids })
    } catch (e) { alert('Failed to load bids') }
    finally { setAuctionBidsLoading(false) }
  }

  // Receipt helper functions
  const suggestNextReceiptNumber = (records) => {
    if (!records || records.length === 0) return 'RT00001';
    let maxNum = 0;
    records.forEach(r => {
      const match = r.receiptNumber?.match(/RT(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const nextNum = maxNum + 1;
    return `RT${String(nextNum).padStart(5, '0')}`;
  }

  const formatReceiptDate = (d = new Date()) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayName = days[d.getDay()];
    const dateNum = d.getDate();
    const monthName = months[d.getMonth()];
    const year = d.getFullYear();
    
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    
    return `${dayName}, ${dateNum} ${monthName} ${year} - ${hours}:${minutes} ${ampm}`;
  }

  const handleFormatTypeChange = (type) => {
    let footerNote = '';
    if (type === 'standard') {
      footerNote = 'In the event that the order cannot be fulfilled from our end, a full refund will be issued.';
    } else if (type === 'prebooking') {
      footerNote = 'This receipt is for the prebooking of the item. Rest of the payment is due when the stock arrives. Prebookings are non-refundable unless unfulfilled by Garage Kings India.';
    } else if (type === 'auction') {
      footerNote = 'This receipt confirms the successful win of the auction item. Thank you for bidding! In the event that the order cannot be fulfilled from our end, a full refund will be issued.';
    } else {
      footerNote = '';
    }
    
    setReceiptForm(prev => ({
      ...prev,
      formatType: type,
      footerNote
    }));
  }

  const handleSaveReceipt = async () => {
    const { receiptNumber, customerName, customerPhone, items, formatType, footerNote, companyName, companyLocation, pendingBalance } = receiptForm;
    if (!receiptNumber.trim()) return alert("Receipt Number is required");
    if (!customerName.trim()) return alert("Customer Name is required");
    if (!companyName.trim()) return alert("Company Name is required");
    if (!companyLocation.trim()) return alert("Company Location is required");
    if (items.some(it => !it.description.trim() || it.amount === '')) {
      return alert("All item descriptions and amounts are required");
    }

    try {
      // Calculate totals
      const subtotal = items.reduce((acc, it) => acc + (Number(it.qty) * Number(it.amount)), 0);
      const shipping = receiptForm.includeShipping ? Number(receiptForm.shippingCharges) : 0;
      const taxRate = Number(receiptForm.taxPercent) / 100;
      const taxAmount = (subtotal + shipping) * taxRate;
      const totalAmount = subtotal + shipping + taxAmount;

      const receiptData = {
        receiptNumber: receiptForm.receiptNumber.trim(),
        dateString: receiptForm.dateString || formatReceiptDate(),
        companyName: companyName.trim(),
        companyLocation: companyLocation.trim(),
        customerName: receiptForm.customerName.trim(),
        customerPhone: receiptForm.customerPhone.trim(),
        customerAddress: receiptForm.customerAddress.trim(),
        formatType,
        items: items.map(it => ({ qty: Number(it.qty), description: it.description.trim(), amount: Number(it.amount) })),
        includeShipping: receiptForm.includeShipping,
        shippingCharges: shipping,
        taxPercent: Number(receiptForm.taxPercent),
        taxAmount,
        totalAmount,
        pendingBalance: pendingBalance ? Number(pendingBalance) : 0,
        footerNote: footerNote.trim()
      };

      await addReceipt(receiptData);
      
      const refreshed = await getReceipts();
      setReceipts(refreshed);
      setIsAddingReceipt(false);
      alert("Receipt saved successfully!");
    } catch (e) {
      alert("Failed to save receipt: " + e.message);
    }
  }

  const handleDeleteReceipt = async (id) => {
    if (confirm("Are you sure you want to delete this receipt?")) {
      try {
        await deleteReceipt(id);
        setReceipts(prev => prev.filter(r => r.id !== id));
      } catch (e) {
        alert("Failed to delete receipt: " + e.message);
      }
    }
  }

  const handlePrintReceipt = (receipt) => {
    setActiveReceiptPreview(receipt);
    setTimeout(() => {
      window.print();
    }, 250);
  }

  if (isAuthLoading) {
    return (
      <div className="min-h-[100svh] bg-gk-black flex flex-col items-center justify-center gap-6">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full blur-xl bg-red-500/20 animate-pulse"></div>
          <div className="w-12 h-12 rounded-full border-4 border-white/5 border-t-red-500 animate-spin relative z-10"></div>
        </div>
        <div className="text-red-500 text-xs font-bold tracking-[0.3em] uppercase animate-pulse">Secure Auth</div>
      </div>
    )
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
              className={`px-6 py-2.5 rounded-full bg-gk-yellow text-black text-sm font-bold flex items-center gap-2 hover:bg-yellow-400 transition-colors ${adminTab !== 'inventory' ? 'hidden' : ''}`}
            >
              <Plus size={16} /> Add Item
            </button>
            <button 
              onClick={() => {
                setAuctionForm({ title: '', brand: '', carBrand: '', scale: '1:64', grade: '', description: '', image: '', currency: '₹', startingPrice: '', minBidIncrement: '', endDate: '', endTime: '20:00' })
                setEditingAuctionId(null)
                setIsAddingAuction(true)
              }}
              className={`px-6 py-2.5 rounded-full bg-purple-500 text-white text-sm font-bold flex items-center gap-2 hover:bg-purple-400 transition-colors ${adminTab !== 'auctions' ? 'hidden' : ''}`}
            >
              <Plus size={16} /> New Auction
            </button>
            <button 
              onClick={() => {
                setReceiptForm({
                  receiptNumber: suggestNextReceiptNumber(receipts),
                  dateString: formatReceiptDate(),
                  companyName: 'Garage Kings India',
                  companyLocation: 'Delhi',
                  customerName: '',
                  customerPhone: '',
                  customerAddress: '',
                  formatType: 'standard',
                  items: [{ qty: 1, description: '', amount: '' }],
                  shippingCharges: 150,
                  includeShipping: true,
                  taxPercent: 0,
                  footerNote: 'In the event that the order cannot be fulfilled from our end, a full refund will be issued.',
                  pendingBalance: ''
                })
                setIsAddingReceipt(true)
              }}
              className={`px-6 py-2.5 rounded-full bg-blue-500 text-white text-sm font-bold flex items-center gap-2 hover:bg-blue-450 transition-colors ${adminTab !== 'receipts' ? 'hidden' : ''}`}
            >
              <Plus size={16} /> New Receipt
            </button>
            <button 
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-sm font-bold flex items-center gap-2 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-colors"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </header>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-8 border-b border-white/8 pb-0">
          {['inventory', 'auctions', 'receipts'].map(t => (
            <button key={t} onClick={() => setAdminTab(t)}
              className={`px-5 py-3 text-sm font-black uppercase tracking-wider rounded-t-xl transition-colors ${
                adminTab === t ? 'bg-white/8 border border-white/10 border-b-0 text-white' : 'text-white/30 hover:text-white/60'
              }`}>
              {t === 'inventory' ? 'Inventory' : t === 'auctions' ? '🏷️ Auctions' : '🧾 Receipts'}
            </button>
          ))}
        </div>
        {adminTab === 'inventory' && (
          <>
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
                    <div className="flex flex-col sm:flex-row gap-4 mb-8 pb-8 border-b border-white/10">
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

                    <h3 className="text-lg font-bold text-white mb-2">Drop Schedule</h3>
                    <p className="text-sm text-white/60 mb-4 max-w-2xl">
                      Configure the countdown timer on the homepage.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Drop Date</label>
                        <input 
                          type="date" 
                          value={tempDropDate} 
                          onChange={(e) => setTempDropDate(e.target.value)}
                          onClick={(e) => {
                            try { e.target.showPicker() } catch(err) { /* ignore */ }
                          }}
                          className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gk-yellow cursor-pointer appearance-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Time (24HR format)</label>
                        <input 
                          type="time" 
                          value={tempDropTime}
                          onChange={(e) => setTempDropTime(e.target.value)}
                          onClick={(e) => {
                            try { e.target.showPicker() } catch(err) { /* ignore */ }
                          }}
                          className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gk-yellow cursor-pointer appearance-none"
                        />
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Short Label</label>
                      <input 
                        type="text" 
                        value={tempDropLabel}
                        onChange={(e) => setTempDropLabel(e.target.value)}
                        placeholder="e.g. Friday · 8:00 PM IST"
                        className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gk-yellow"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Description</label>
                      <textarea 
                        value={tempDropDesc}
                        onChange={(e) => setTempDropDesc(e.target.value)}
                        rows={2}
                        placeholder="Every Friday at 8 PM IST..."
                        className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gk-yellow"
                      />
                    </div>
                    
                    <button 
                      onClick={saveDropSettings}
                      className="px-6 py-2.5 rounded-lg bg-gk-yellow hover:bg-yellow-400 text-black font-bold transition-colors"
                    >
                      Save Drop Schedule
                    </button>
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
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.isAuction ? 'bg-purple-500 border-purple-500 text-white' : 'border-white/20 bg-black group-hover:border-white/40'}`}>
                        {formData.isAuction && <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3"><path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <input type="checkbox" className="hidden" checked={formData.isAuction} onChange={(e) => setFormData({...formData, isAuction: e.target.checked})} />
                      <span className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">Open for Bidding</span>
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
                  <div className="col-span-3 flex justify-end gap-2 flex-wrap">
                    {car.isAuction && (
                      <button
                        onClick={async () => {
                          setBidsLoading(true)
                          setBidsModal({ car, bids: [] })
                          try {
                            const bids = await getBids(car.id)
                            setBidsModal({ car, bids })
                          } catch(e) { alert('Failed to load bids') }
                          finally { setBidsLoading(false) }
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-purple-300 bg-purple-500/10 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 transition-colors whitespace-nowrap"
                      >
                        View Bids
                      </button>
                    )}
                    <button onClick={() => handleEdit(car)} className="p-2 text-white/50 hover:text-white bg-white/5 rounded-lg hover:bg-white/10 transition-colors"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(car.id)} className="p-2 text-white/50 hover:text-gk-orange bg-white/5 rounded-lg hover:bg-red-500/10 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
          </>
        )}
      </div>

      {/* Bids Modal */}
      <AnimatePresence>
        {bidsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setBidsModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-gk-black border border-purple-500/30 rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-[0_0_60px_rgba(168,85,247,0.2)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Bids</h3>
                  <p className="text-xs text-white/50 mt-1 truncate">{bidsModal.car.name}</p>
                </div>
                <button onClick={() => setBidsModal(null)} className="text-white/50 hover:text-white"><X size={20} /></button>
              </div>
              {bidsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
                </div>
              ) : bidsModal.bids.length === 0 ? (
                <div className="text-center py-12 text-white/40">
                  <p className="text-4xl mb-4">🏷️</p>
                  <p>No bids yet on this item.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bidsModal.bids.map((bid, i) => (
                    <div key={bid.id} className={`flex items-center gap-4 p-4 rounded-xl border ${
                      i === 0 ? 'bg-purple-500/15 border-purple-500/40' : 'bg-white/5 border-white/10'
                    }`}>
                      <div className={`text-lg font-black w-8 text-center ${ i === 0 ? 'text-purple-400' : 'text-white/30'}`}>
                        #{i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white">{bid.bidderName}</div>
                        <div className="text-xs text-white/50 truncate">{bid.contact}</div>
                        <div className="text-[10px] text-white/30 mt-0.5">{new Date(bid.timestamp).toLocaleString('en-IN')}</div>
                      </div>
                      <div className="font-mono font-black text-lg text-purple-300 shrink-0">
                        {bidsModal.car.currency || '₹'}{bid.amount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── AUCTION TAB PANEL ───────────────────────────── */}
      {adminTab === 'auctions' && (
        <div className="mt-2">
          {/* Auction Form */}
          <AnimatePresence>
            {isAddingAuction && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-8 overflow-hidden">
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-6 md:p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">{editingAuctionId ? 'Edit Auction' : 'New Auction'}</h2>
                    <button onClick={() => setIsAddingAuction(false)} className="text-white/50 hover:text-white"><X size={20} /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Title *</label>
                      <input type="text" value={auctionForm.title} onChange={e => setAuctionForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Ferrari F40 MiniGT Black" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Die-cast Maker</label>
                      <input type="text" value={auctionForm.brand} onChange={e => setAuctionForm(f => ({ ...f, brand: e.target.value }))} placeholder="e.g. MiniGT" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Car Brand</label>
                      <input type="text" value={auctionForm.carBrand} onChange={e => setAuctionForm(f => ({ ...f, carBrand: e.target.value }))} placeholder="e.g. Ferrari" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Scale</label>
                      <input type="text" value={auctionForm.scale} onChange={e => setAuctionForm(f => ({ ...f, scale: e.target.value }))} placeholder="e.g. 1:64" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Grade</label>
                      <input type="text" value={auctionForm.grade} onChange={e => setAuctionForm(f => ({ ...f, grade: e.target.value }))} placeholder="e.g. MIB" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500" />
                    </div>
                    {/* Pricing */}
                    <div>
                      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Currency</label>
                      <select value={auctionForm.currency} onChange={e => setAuctionForm(f => ({ ...f, currency: e.target.value }))} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 appearance-none">
                        <option value="₹">₹ INR</option><option value="$">$ USD</option><option value="€">€ EUR</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Starting Price *</label>
                      <input type="number" value={auctionForm.startingPrice} onChange={e => setAuctionForm(f => ({ ...f, startingPrice: e.target.value }))} placeholder="e.g. 2000" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Min Bid Increment *</label>
                      <input type="number" value={auctionForm.minBidIncrement} onChange={e => setAuctionForm(f => ({ ...f, minBidIncrement: e.target.value }))} placeholder="e.g. 100" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500" />
                    </div>
                    {/* End Date/Time */}
                    <div>
                      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Auction End Date *</label>
                      <input type="date" value={auctionForm.endDate} onChange={e => setAuctionForm(f => ({ ...f, endDate: e.target.value }))} onClick={e => { try { e.target.showPicker() } catch(err) {} }} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 cursor-pointer" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Auction End Time (IST) *</label>
                      <input type="time" value={auctionForm.endTime} onChange={e => setAuctionForm(f => ({ ...f, endTime: e.target.value }))} onClick={e => { try { e.target.showPicker() } catch(err) {} }} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 cursor-pointer" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Description</label>
                      <textarea rows={3} value={auctionForm.description} onChange={e => setAuctionForm(f => ({ ...f, description: e.target.value }))} placeholder="Details about this piece..." className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Image</label>
                      <div className="flex items-center gap-4">
                        <div className="h-20 w-20 rounded-lg bg-black/50 border border-dashed border-white/20 flex items-center justify-center overflow-hidden shrink-0">
                          {auctionForm.image ? <img src={auctionForm.image} alt="Preview" className="w-full h-full object-cover" /> : <ImageIcon className="text-white/20" />}
                        </div>
                        <input type="file" accept="image/*" onChange={handleAuctionImageUpload} className="text-sm text-white/50 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button onClick={saveAuction} className="px-8 py-3 bg-purple-500 hover:bg-purple-400 text-white rounded-lg font-bold flex items-center gap-2 transition-colors">
                      <Save size={18} /> {editingAuctionId ? 'Update Auction' : 'Create Auction'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Auction List */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-white/5 text-xs font-semibold text-white/50 uppercase tracking-wider">
              {auctions.length} Auction{auctions.length !== 1 ? 's' : ''}
            </div>
            {auctions.length === 0 ? (
              <div className="p-12 text-center text-white/30">No auctions yet. Click "New Auction" to create one.</div>
            ) : (
              <div className="divide-y divide-white/5">
                {auctions.map(auction => {
                  const isLive = new Date(`${auction.endDate}T${auction.endTime}:00+05:30`) > new Date()
                  return (
                    <div key={auction.id} className="grid grid-cols-12 gap-3 p-4 items-center hover:bg-white/5 transition-colors group">
                      <div className="col-span-2">
                        <img src={auction.image || '/vault-1.png'} alt={auction.title} className="w-16 h-12 object-cover rounded bg-black" />
                      </div>
                      <div className="col-span-5">
                        <div className="font-bold text-sm text-white">{auction.title}</div>
                        <div className="text-[10px] text-white/40 mt-0.5">{auction.brand}{auction.carBrand ? ` • ${auction.carBrand}` : ''}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${isLive ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-white/20'}`}>{isLive ? 'Live' : 'Ended'}</span>
                          <span className="text-[10px] text-white/30">{auction.endDate} {auction.endTime} IST</span>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-[10px] text-white/30">Start</div>
                        <div className="font-mono text-sm text-gk-yellow">{auction.currency}{Number(auction.startingPrice).toLocaleString()}</div>
                        <div className="text-[10px] text-purple-400">+{auction.currency}{Number(auction.minBidIncrement).toLocaleString()} inc</div>
                      </div>
                      <div className="col-span-3 flex justify-end gap-2 flex-wrap">
                        <button onClick={() => viewAuctionBids(auction)} className="px-3 py-1.5 text-xs font-bold text-purple-300 bg-purple-500/10 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 transition-colors whitespace-nowrap">View Bids</button>
                        <button onClick={() => { setAuctionForm({ ...auction }); setEditingAuctionId(auction.id); setIsAddingAuction(true) }} className="p-2 text-white/50 hover:text-white bg-white/5 rounded-lg hover:bg-white/10 transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => handleDeleteAuction(auction.id)} className="p-2 text-white/50 hover:text-gk-orange bg-white/5 rounded-lg hover:bg-red-500/10 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auction Bids Modal */}
      <AnimatePresence>
        {auctionBidsModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setAuctionBidsModal(null)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-gk-black border border-purple-500/30 rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-[0_0_60px_rgba(168,85,247,0.2)]"
              onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Auction Bids</h3>
                  <p className="text-xs text-white/50 mt-1">{auctionBidsModal.auction.title}</p>
                </div>
                <button onClick={() => setAuctionBidsModal(null)} className="text-white/50 hover:text-white"><X size={20} /></button>
              </div>
              {auctionBidsLoading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" /></div>
              ) : auctionBidsModal.bids.length === 0 ? (
                <div className="text-center py-12 text-white/40"><p className="text-4xl mb-4">🏷️</p><p>No bids placed yet.</p></div>
              ) : (
                <div className="space-y-3">
                  {auctionBidsModal.bids.map((bid, i) => (
                    <div key={bid.id} className={`flex items-center gap-4 p-4 rounded-xl border ${i === 0 ? 'bg-purple-500/15 border-purple-500/40' : 'bg-white/5 border-white/10'}`}>
                      <div className={`text-lg font-black w-8 text-center ${i === 0 ? 'text-purple-400' : 'text-white/30'}`}>#{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white">{bid.bidderName}</div>
                        <div className="text-xs text-white/50 truncate">{bid.contact}</div>
                        <div className="text-[10px] text-white/30 mt-0.5">{new Date(bid.timestamp).toLocaleString('en-IN')}</div>
                      </div>
                      <div className="font-mono font-black text-lg text-purple-300 shrink-0">{auctionBidsModal.auction.currency || '₹'}{bid.amount.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── RECEIPTS TAB PANEL ───────────────────────────── */}
      {adminTab === 'receipts' && (
        <div className="mt-2 space-y-6 no-print">
          {/* Receipts Form (Add / Edit) */}
          <AnimatePresence>
            {isAddingReceipt && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-8">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Create New Receipt</h2>
                    <button onClick={() => setIsAddingReceipt(false)} className="text-white/50 hover:text-white cursor-pointer"><X size={20} /></button>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Form Controls - 7 cols on large screens */}
                    <div className="lg:col-span-7 space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Receipt Number *</label>
                          <input type="text" value={receiptForm.receiptNumber} onChange={e => setReceiptForm(prev => ({ ...prev, receiptNumber: e.target.value }))} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Date & Time *</label>
                          <input type="text" value={receiptForm.dateString} onChange={e => setReceiptForm(prev => ({ ...prev, dateString: e.target.value }))} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                        </div>
                      </div>

                      <div className="bg-black/20 p-4 border border-white/5 rounded-xl space-y-4">
                        <h3 className="text-xs font-black uppercase text-blue-400 tracking-wider">Company Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Company Name *</label>
                            <input type="text" placeholder="e.g. Garage Kings India" value={receiptForm.companyName} onChange={e => setReceiptForm(prev => ({ ...prev, companyName: e.target.value }))} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Location / City *</label>
                            <input type="text" placeholder="e.g. Delhi" value={receiptForm.companyLocation} onChange={e => setReceiptForm(prev => ({ ...prev, companyLocation: e.target.value }))} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-black/20 p-4 border border-white/5 rounded-xl space-y-4">
                        <h3 className="text-xs font-black uppercase text-blue-400 tracking-wider">Customer Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Customer Name *</label>
                            <input type="text" placeholder="e.g. Rasesh Talati" value={receiptForm.customerName} onChange={e => setReceiptForm(prev => ({ ...prev, customerName: e.target.value }))} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Customer Phone</label>
                            <input type="text" placeholder="e.g. 9819169632" value={receiptForm.customerPhone} onChange={e => setReceiptForm(prev => ({ ...prev, customerPhone: e.target.value }))} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Customer Address</label>
                          <textarea rows={3} placeholder="Full shipping address..." value={receiptForm.customerAddress} onChange={e => setReceiptForm(prev => ({ ...prev, customerAddress: e.target.value }))} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                        </div>
                      </div>

                      <div className="bg-black/20 p-4 border border-white/5 rounded-xl space-y-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                          <h3 className="text-xs font-black uppercase text-blue-400 tracking-wider">Line Items</h3>
                          
                          {/* QUICK AUTOFILL SELECTOR */}
                          <div className="flex flex-wrap gap-2">
                            <select 
                              onChange={e => {
                                if (!e.target.value) return;
                                const car = cars.find(c => c.id === e.target.value);
                                if (car) {
                                  const newItem = { qty: 1, description: `${car.brand} ${car.name}${car.grade ? ' - ' + car.grade : ''}`, amount: String(car.price) };
                                  setReceiptForm(prev => {
                                    const first = prev.items[0];
                                    const isEmpty = prev.items.length === 1 && !first.description && !first.amount;
                                    return {
                                      ...prev,
                                      items: isEmpty ? [newItem] : [...prev.items, newItem]
                                    };
                                  });
                                }
                                e.target.value = ''; // Reset selector
                              }}
                              className="bg-[#111116] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white/80 hover:text-white cursor-pointer focus:outline-none outline-none max-w-[150px] md:max-w-xs"
                            >
                              <option value="" className="bg-[#111116] text-white">+ From Inventory</option>
                              {cars.map(c => (
                                <option key={c.id} value={c.id} className="bg-[#111116] text-white">{c.brand} {c.name} ({c.currency || '₹'}{c.price})</option>
                              ))}
                            </select>

                            <select 
                              onChange={e => {
                                if (!e.target.value) return;
                                const auction = auctions.find(a => a.id === e.target.value);
                                if (auction) {
                                  const newItem = { qty: 1, description: `${auction.brand} ${auction.title}${auction.grade ? ' - ' + auction.grade : ''}`, amount: String(auction.startingPrice) };
                                  setReceiptForm(prev => {
                                    const first = prev.items[0];
                                    const isEmpty = prev.items.length === 1 && !first.description && !first.amount;
                                    return {
                                      ...prev,
                                      items: isEmpty ? [newItem] : [...prev.items, newItem]
                                    };
                                  });
                                }
                                e.target.value = ''; // Reset selector
                              }}
                              className="bg-[#111116] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white/80 hover:text-white cursor-pointer focus:outline-none outline-none max-w-[150px] md:max-w-xs"
                            >
                              <option value="" className="bg-[#111116] text-white">+ From Auctions</option>
                              {auctions.map(a => (
                                <option key={a.id} value={a.id} className="bg-[#111116] text-white">{a.brand} {a.title} ({a.currency || '₹'}{a.startingPrice})</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {receiptForm.items.map((item, index) => (
                          <div key={index} className="flex gap-3 items-center">
                            <div className="w-16">
                              <label className="block text-[10px] font-semibold text-white/40 uppercase mb-1">Qty</label>
                              <input type="number" min="1" value={item.qty} onChange={e => {
                                const newItems = [...receiptForm.items];
                                newItems[index].qty = Math.max(1, parseInt(e.target.value) || 1);
                                setReceiptForm(prev => ({ ...prev, items: newItems }));
                              }} className="w-full bg-black/55 border border-white/10 rounded-lg px-3 py-2 text-center text-white focus:outline-none" />
                            </div>
                            <div className="flex-1">
                              <label className="block text-[10px] font-semibold text-white/40 uppercase mb-1">Description</label>
                              <input type="text" placeholder="e.g. Mini GT F1 - 999" value={item.description} onChange={e => {
                                const newItems = [...receiptForm.items];
                                newItems[index].description = e.target.value;
                                setReceiptForm(prev => ({ ...prev, items: newItems }));
                              }} className="w-full bg-black/55 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
                            </div>
                            <div className="w-28">
                              <label className="block text-[10px] font-semibold text-white/40 uppercase mb-1">Amount (₹)</label>
                              <input type="number" placeholder="2000" value={item.amount} onChange={e => {
                                const newItems = [...receiptForm.items];
                                newItems[index].amount = e.target.value;
                                setReceiptForm(prev => ({ ...prev, items: newItems }));
                              }} className="w-full bg-black/55 border border-white/10 rounded-lg px-3 py-2 text-right text-white focus:outline-none focus:border-blue-500" />
                            </div>
                            {receiptForm.items.length > 1 && (
                              <button onClick={() => {
                                const newItems = receiptForm.items.filter((_, i) => i !== index);
                                setReceiptForm(prev => ({ ...prev, items: newItems }));
                              }} className="mt-5 p-2 text-white/40 hover:text-gk-orange hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                        
                        <button onClick={() => {
                          setReceiptForm(prev => ({
                            ...prev,
                            items: [...prev.items, { qty: 1, description: '', amount: '' }]
                          }));
                        }} className="px-3 py-2 rounded-lg bg-white/5 border border-dashed border-white/10 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-colors w-full flex items-center justify-center gap-1.5 mt-2 cursor-pointer">
                          <Plus size={14} /> Add Item
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-black/20 p-4 border border-white/5 rounded-xl">
                        {/* Shipping quick-toggle */}
                        <div className="flex flex-col justify-center">
                          <label className="flex items-center gap-2.5 cursor-pointer group">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${receiptForm.includeShipping ? 'bg-blue-500 border-blue-500 text-white' : 'border-white/20 bg-black group-hover:border-white/40'}`}>
                              {receiptForm.includeShipping && <svg viewBox="0 0 14 14" fill="none" className="w-2.5 h-2.5"><path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                            </div>
                            <input type="checkbox" className="hidden" checked={receiptForm.includeShipping} onChange={e => setReceiptForm(prev => ({ ...prev, includeShipping: e.target.checked }))} />
                            <span className="text-xs font-semibold text-white/80 group-hover:text-white transition-colors">Include Shipping</span>
                          </label>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Shipping Fee (₹)</label>
                          <input 
                            type="number" 
                            min="0" 
                            disabled={!receiptForm.includeShipping}
                            value={receiptForm.shippingCharges} 
                            onChange={e => setReceiptForm(prev => ({ ...prev, shippingCharges: Math.max(0, parseInt(e.target.value) || 0) }))} 
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed" 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Tax Rate (%)</label>
                          <input type="number" min="0" value={receiptForm.taxPercent} onChange={e => setReceiptForm(prev => ({ ...prev, taxPercent: Math.max(0, parseInt(e.target.value) || 0) }))} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Receipt Format</label>
                          <select value={receiptForm.formatType} onChange={e => handleFormatTypeChange(e.target.value)} className="w-full bg-[#111116] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none cursor-pointer outline-none">
                            <option value="standard" className="bg-[#111116] text-white">Standard Sale</option>
                            <option value="prebooking" className="bg-[#111116] text-white">Prebooking</option>
                            <option value="auction" className="bg-[#111116] text-white">Auction Win</option>
                            <option value="custom" className="bg-[#111116] text-white">Custom Format</option>
                          </select>
                        </div>
                        {receiptForm.formatType === 'prebooking' && (
                          <div className="md:col-span-4 border-t border-white/5 pt-4 mt-2">
                            <label className="block text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Pending Balance / Remaining Amount (₹)</label>
                            <input 
                              type="number" 
                              min="0" 
                              placeholder="Enter remaining balance to be paid before delivery (e.g. 4000)" 
                              value={receiptForm.pendingBalance} 
                              onChange={e => setReceiptForm(prev => ({ ...prev, pendingBalance: e.target.value }))} 
                              className="w-full bg-black/55 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 font-semibold" 
                            />
                          </div>
                        )}
                      </div>

                      <div className="bg-black/20 p-4 border border-white/5 rounded-xl">
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Footer Refund / Payment Note</label>
                        <textarea rows={2} value={receiptForm.footerNote} onChange={e => setReceiptForm(prev => ({ ...prev, footerNote: e.target.value }))} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="Custom note to appear at the bottom of the receipt..." />
                      </div>

                      <div className="flex justify-end gap-3 pt-3">
                        <button onClick={() => setIsAddingReceipt(false)} className="px-6 py-3 rounded-lg border border-white/10 hover:bg-white/5 text-sm font-semibold transition-colors cursor-pointer">Cancel</button>
                        <button onClick={handleSaveReceipt} className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold flex items-center gap-2 transition-colors cursor-pointer">
                          <Save size={18} /> Save Receipt
                        </button>
                      </div>
                    </div>

                    {/* LIVE PREVIEW CONTAINER - 5 cols on large screens */}
                    <div className="lg:col-span-5 space-y-4">
                      <h3 className="text-xs font-black uppercase text-white/50 tracking-wider">Live Preview</h3>
                      
                      {/* High-fidelity Receipt Preview */}
                      <div className="bg-white text-black p-6 rounded-xl shadow-2xl overflow-hidden font-sans text-xs flex flex-col justify-between relative" style={{ minHeight: '560px', color: '#000000', backgroundColor: '#ffffff' }}>
                        {/* Faint Premium Brand Watermark */}
                        <div className="absolute pointer-events-none select-none z-0 text-center" style={{
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%) rotate(-20deg)',
                          fontSize: '36px',
                          fontWeight: '900',
                          letterSpacing: '0.25em',
                          background: 'linear-gradient(135deg, rgba(43, 149, 201, 0.12) 0%, rgba(67, 56, 202, 0.09) 50%, rgba(99, 102, 241, 0.06) 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          color: 'rgba(43, 149, 201, 0.08)',
                          width: '90%',
                          textAlign: 'center',
                          lineHeight: '1.2',
                          fontFamily: '"Outfit", "Montserrat", "Inter", system-ui, sans-serif',
                          textTransform: 'uppercase',
                          wordBreak: 'break-word'
                        }}>
                          {receiptForm.companyName || 'Garage Kings'}
                        </div>

                        <div className="relative z-10 flex flex-col justify-between h-full w-full">
                          <div>
                            {/* Header */}
                            <div className="flex justify-between items-start gap-4 mb-8">
                              <div>
                                <h1 className="text-xl font-black leading-none tracking-tight" style={{ fontFamily: 'system-ui, sans-serif' }}>{receiptForm.companyName || 'Garage Kings India'}</h1>
                                <p className="text-gray-600 text-[10px] mt-1.5">{receiptForm.companyLocation || 'Delhi'}</p>
                              </div>
                              <div className="text-right">
                                <h2 className="text-xl font-black text-gray-800 tracking-tight leading-none mb-1">Receipt</h2>
                                <p className="text-[9px] text-gray-600 font-semibold mt-1">Receipt # &nbsp;{receiptForm.receiptNumber || 'RTXXXXX'}</p>
                                <p className="text-[8px] text-gray-500 font-medium mt-1">Date &nbsp;{receiptForm.dateString || 'Saturday, 30 May 2026 - 2:16 PM'}</p>
                              </div>
                            </div>

                          {/* "To" Section */}
                          <div className="mb-6">
                            <div className="bg-[#2b95c9] text-white px-3 py-1 font-bold text-[10px] tracking-wider mb-2.5 rounded-sm">To</div>
                            <div className="px-1 space-y-0.5 text-gray-800 text-[10px] leading-relaxed">
                              {receiptForm.customerName ? (
                                <>
                                  <div className="font-bold text-black text-[11px]">{receiptForm.customerName}</div>
                                  {receiptForm.customerPhone && <div className="font-semibold">{receiptForm.customerPhone}</div>}
                                  {receiptForm.customerAddress && <div className="whitespace-pre-line text-gray-600 mt-0.5">{receiptForm.customerAddress}</div>}
                                </>
                              ) : (
                                <div className="text-gray-400 italic">No customer details set.</div>
                              )}
                            </div>
                          </div>

                          {/* Table Section */}
                          <div className="mb-6">
                            {/* Table Header */}
                            <div className="bg-[#2b95c9] text-white grid grid-cols-12 gap-2 px-3 py-1.5 font-bold text-[9px] tracking-wider rounded-sm">
                              <div className="col-span-2 text-center">Qty</div>
                              <div className="col-span-7">Description</div>
                              <div className="col-span-3 text-right">Amount</div>
                            </div>
                            
                            {/* Table Rows */}
                            <div className="divide-y divide-gray-150 px-1">
                              {receiptForm.items.map((it, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-2 py-2.5 text-[10px]">
                                  <div className="col-span-2 text-center text-gray-600">{it.qty}</div>
                                  <div className="col-span-7 font-medium text-gray-800 truncate">{it.description || <span className="text-gray-300 italic">Description...</span>}</div>
                                  <div className="col-span-3 text-right font-mono font-semibold text-gray-900">₹{(Number(it.qty) * (Number(it.amount) || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                </div>
                              ))}
                              
                              {/* Shipping row */}
                              {receiptForm.includeShipping && (
                                <div className="grid grid-cols-12 gap-2 py-2.5 text-[10px]">
                                  <div className="col-span-2 text-center text-gray-600">1</div>
                                  <div className="col-span-7 font-medium text-gray-800">Shipping Charges</div>
                                  <div className="col-span-3 text-right font-mono font-semibold text-gray-900">₹{Number(receiptForm.shippingCharges).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Summary and Footer */}
                        <div>
                          <div className="border-t border-gray-300 pt-3 space-y-1.5">
                            {/* Tax Row */}
                            <div className="flex justify-between items-center text-[10px] text-gray-600">
                              <span>Including Tax ({receiptForm.taxPercent}%)</span>
                              <span className="font-mono font-semibold">₹{((receiptForm.items.reduce((acc, it) => acc + (Number(it.qty) * (Number(it.amount) || 0)), 0) + (receiptForm.includeShipping ? Number(receiptForm.shippingCharges) : 0)) * (Number(receiptForm.taxPercent) / 100)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            
                             {/* Total Row */}
                            <div className="flex justify-between items-center text-sm font-black text-black pt-1">
                              <span>Total Paid</span>
                              <span className="font-mono font-black text-base">₹{
                                (
                                  (receiptForm.items.reduce((acc, it) => acc + (Number(it.qty) * (Number(it.amount) || 0)), 0) + (receiptForm.includeShipping ? Number(receiptForm.shippingCharges) : 0)) * (1 + (Number(receiptForm.taxPercent) / 100))
                                ).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                              }</span>
                            </div>

                            {/* Pending Balance Row */}
                            {receiptForm.formatType === 'prebooking' && receiptForm.pendingBalance && Number(receiptForm.pendingBalance) > 0 && (
                              <div className="flex justify-between items-center text-[10px] text-red-600 font-bold pt-1.5 border-t border-dashed border-gray-300 mt-1.5">
                                <span>Balance Due before Delivery</span>
                                <span className="font-mono font-bold text-red-650">₹{Number(receiptForm.pendingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                            )}
                          </div>

                          {/* Footer refund policy statement */}
                          {receiptForm.footerNote && (
                            <div className="mt-8 text-center text-[9px] text-gray-800 font-medium leading-normal px-2">
                              {receiptForm.footerNote}
                            </div>
                          )}
                        </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Receipts History List */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-4 md:p-6 border-b border-white/10 bg-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-white text-base">Receipt Records</h3>
                <p className="text-xs text-white/50 mt-1">Search, print, or manage previously generated client receipts.</p>
              </div>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  placeholder="Search customer, phone, or RT#..." 
                  value={receiptSearch} 
                  onChange={e => setReceiptSearch(e.target.value)} 
                  className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 w-full md:w-80" 
                />
              </div>
            </div>

            {/* List */}
            {receipts.length === 0 ? (
              <div className="p-12 text-center text-white/30">
                <p className="text-4xl mb-4">🧾</p>
                <p>No receipt history yet. Click "New Receipt" to create one.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {receipts
                  .filter(r => {
                    const search = receiptSearch.toLowerCase();
                    return r.customerName?.toLowerCase().includes(search) || 
                           r.customerPhone?.toLowerCase().includes(search) || 
                           r.receiptNumber?.toLowerCase().includes(search);
                  })
                  .map(receipt => (
                    <div key={receipt.id} className="grid grid-cols-12 gap-3 p-4 items-center hover:bg-white/5 transition-colors group">
                      <div className="col-span-2">
                        <div className="font-bold text-sm text-blue-400 font-mono">{receipt.receiptNumber}</div>
                        <div className="text-[9px] text-white/40 font-mono mt-0.5">{receipt.dateString?.split(' - ')[0]}</div>
                      </div>
                      <div className="col-span-5">
                        <div className="font-bold text-sm text-white">{receipt.customerName}</div>
                        <div className="text-xs text-white/50 truncate mt-0.5">{receipt.customerPhone || 'No Phone'}</div>
                        <div className="text-[10px] text-white/35 mt-1 truncate">
                          {receipt.items?.map(it => `${it.qty}x ${it.description}`).join(', ')}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          receipt.formatType === 'prebooking' ? 'bg-orange-500/20 text-orange-350' :
                          receipt.formatType === 'auction' ? 'bg-purple-500/20 text-purple-300' :
                          'bg-blue-500/20 text-blue-300'
                        }`}>
                          {receipt.formatType === 'prebooking' ? 'Prebooking' : 
                           receipt.formatType === 'auction' ? 'Auction Win' : 'Sale'}
                        </span>
                      </div>
                      <div className="col-span-2 text-right">
                        <div className="font-mono text-sm text-gk-yellow">₹{Number(receipt.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                        <div className="text-[9px] text-white/30 font-mono mt-0.5">Total paid</div>
                      </div>
                      <div className="col-span-1 flex justify-end gap-2">
                        <button onClick={() => handlePrintReceipt(receipt)} title="Print / Save PDF" className="p-2 text-blue-400 hover:text-white bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors cursor-pointer">
                          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                        </button>
                        <button onClick={() => handleDeleteReceipt(receipt.id)} title="Delete record" className="p-2 text-white/40 hover:text-gk-orange bg-white/5 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>
      )}

      {/* Screen Preview Modal / Overlay when customer wants to review details */}
      <AnimatePresence>
        {activeReceiptPreview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm no-print" onClick={() => setActiveReceiptPreview(null)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-gk-black border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col gap-6 shadow-[0_0_50px_rgba(59,130,246,0.15)] animate-none" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <div>
                  <h3 className="text-lg font-bold text-white">Receipt Details</h3>
                  <p className="text-xs text-white/50 mt-1 font-mono">Reference: {activeReceiptPreview.receiptNumber}</p>
                </div>
                <button onClick={() => setActiveReceiptPreview(null)} className="text-white/50 hover:text-white cursor-pointer"><X size={20} /></button>
              </div>

              {/* Receipt Body in screen view */}
              <div className="bg-white text-black p-8 rounded-xl shadow-inner font-sans text-xs flex flex-col justify-between relative overflow-hidden" style={{ minHeight: '520px', color: '#000000', backgroundColor: '#ffffff' }}>
                {/* Faint Premium Brand Watermark */}
                <div className="absolute pointer-events-none select-none z-0 text-center" style={{
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%) rotate(-20deg)',
                  fontSize: '48px',
                  fontWeight: '900',
                  letterSpacing: '0.25em',
                  background: 'linear-gradient(135deg, rgba(43, 149, 201, 0.12) 0%, rgba(67, 56, 202, 0.09) 50%, rgba(99, 102, 241, 0.06) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  color: 'rgba(43, 149, 201, 0.08)',
                  width: '90%',
                  textAlign: 'center',
                  lineHeight: '1.2',
                  fontFamily: '"Outfit", "Montserrat", "Inter", system-ui, sans-serif',
                  textTransform: 'uppercase',
                  wordBreak: 'break-word'
                }}>
                  {activeReceiptPreview.companyName || 'Garage Kings'}
                </div>

                <div className="relative z-10 flex flex-col justify-between h-full w-full">
                  <div>
                  {/* Header */}
                  <div className="flex justify-between items-start gap-4 mb-8">
                    <div>
                      <h1 className="text-2xl font-black leading-none tracking-tight">{activeReceiptPreview.companyName || 'Garage Kings India'}</h1>
                      <p className="text-gray-600 text-xs mt-2">{activeReceiptPreview.companyLocation || 'Delhi'}</p>
                    </div>
                    <div className="text-right">
                      <h2 className="text-2xl font-black text-gray-800 tracking-tight leading-none mb-1">Receipt</h2>
                      <p className="text-xs text-gray-600 font-semibold mt-1.5">Receipt # &nbsp;{activeReceiptPreview.receiptNumber}</p>
                      <p className="text-[10px] text-gray-500 font-medium mt-1">Date &nbsp;{activeReceiptPreview.dateString}</p>
                    </div>
                  </div>

                  {/* "To" Section */}
                  <div className="mb-6">
                    <div className="bg-[#2b95c9] text-white px-3 py-1 font-bold text-[10px] tracking-wider mb-2.5 rounded-sm">To</div>
                    <div className="px-1 space-y-0.5 text-gray-800 text-[10px] leading-relaxed">
                      <div className="font-bold text-black text-sm">{activeReceiptPreview.customerName}</div>
                      {activeReceiptPreview.customerPhone && <div className="font-semibold">{activeReceiptPreview.customerPhone}</div>}
                      {activeReceiptPreview.customerAddress && <div className="whitespace-pre-line text-gray-600 mt-1 leading-normal">{activeReceiptPreview.customerAddress}</div>}
                    </div>
                  </div>

                  {/* Table Section */}
                  <div className="mb-6">
                    <div className="bg-[#2b95c9] text-white grid grid-cols-12 gap-2 px-3 py-1.5 font-bold text-[10px] tracking-wider rounded-sm">
                      <div className="col-span-2 text-center">Qty</div>
                      <div className="col-span-7">Description</div>
                      <div className="col-span-3 text-right">Amount</div>
                    </div>
                    
                    <div className="divide-y divide-gray-150 px-1">
                      {activeReceiptPreview.items?.map((it, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 py-2 text-[10px]">
                          <div className="col-span-2 text-center text-gray-600">{it.qty}</div>
                          <div className="col-span-7 font-medium text-gray-800 truncate">{it.description}</div>
                          <div className="col-span-3 text-right font-mono font-semibold text-gray-900">₹{Number(it.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                      ))}
                      
                      {activeReceiptPreview.includeShipping && (
                        <div className="grid grid-cols-12 gap-2 py-2 text-[10px]">
                          <div className="col-span-2 text-center text-gray-600">1</div>
                          <div className="col-span-7 font-medium text-gray-800">Shipping Charges</div>
                          <div className="col-span-3 text-right font-mono font-semibold text-gray-900">₹{Number(activeReceiptPreview.shippingCharges).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="border-t border-gray-300 pt-3 space-y-1.5" style={{ borderTop: '1px solid #d1d5db' }}>
                    <div className="flex justify-between items-center text-[10px] text-gray-600">
                      <span>Including Tax ({activeReceiptPreview.taxPercent}%)</span>
                      <span className="font-mono font-semibold">₹{Number(activeReceiptPreview.taxAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-black text-black pt-1" style={{ borderTop: '1px solid #e5e7eb', marginTop: '4px' }}>
                      <span>Total Paid</span>
                      <span className="font-mono font-black text-lg">₹{Number(activeReceiptPreview.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>

                    {/* Pending Balance Row */}
                    {activeReceiptPreview.formatType === 'prebooking' && activeReceiptPreview.pendingBalance && Number(activeReceiptPreview.pendingBalance) > 0 && (
                      <div className="flex justify-between items-center text-[10px] text-red-650 font-bold pt-1.5 border-t border-dashed border-gray-300 mt-1.5">
                        <span>Balance Due before Delivery</span>
                        <span className="font-mono font-bold text-red-650">₹{Number(activeReceiptPreview.pendingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    )}
                  </div>

                  {activeReceiptPreview.footerNote && (
                    <div className="mt-8 text-center text-[9px] text-gray-800 font-medium leading-normal px-2">
                      {activeReceiptPreview.footerNote}
                    </div>
                  )}
                </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setActiveReceiptPreview(null)} className="px-6 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold transition-colors text-sm cursor-pointer">Close</button>
                <button onClick={() => window.print()} className="px-6 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-650 text-white font-bold flex items-center gap-2 transition-colors text-sm cursor-pointer">
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                  Print / Save PDF
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🧾 ACTUAL PRINTABLE DOM ELEMENT (For media print - hidden on screen) */}
      {activeReceiptPreview && (
        <div className="printable-receipt-wrapper hidden print:block bg-white text-black p-8 font-sans relative overflow-hidden" style={{ color: '#000000', backgroundColor: '#ffffff', minHeight: '297mm', width: '210mm' }}>
          {/* Faint Premium Brand Watermark */}
          <div className="absolute pointer-events-none select-none z-0 text-center" style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-25deg)',
            fontSize: '70px',
            fontWeight: '900',
            letterSpacing: '0.25em',
            background: 'linear-gradient(135deg, rgba(43, 149, 201, 0.07) 0%, rgba(67, 56, 202, 0.05) 50%, rgba(99, 102, 241, 0.04) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'rgba(43, 149, 201, 0.05)',
            width: '90%',
            textAlign: 'center',
            lineHeight: '1.2',
            fontFamily: '"Outfit", "Montserrat", "Inter", system-ui, sans-serif',
            textTransform: 'uppercase',
            wordBreak: 'break-word'
          }}>
            {activeReceiptPreview.companyName || 'Garage Kings'}
          </div>

          <div className="relative z-10 flex flex-col justify-between h-full w-full" style={{ minHeight: '265mm' }}>
            {/* Header */}
          <div className="flex justify-between items-start gap-4 mb-8" style={{ borderBottom: 'none', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <h1 className="text-3xl font-black leading-tight tracking-tight" style={{ fontSize: '28px', fontWeight: '900', fontFamily: 'system-ui, sans-serif', color: '#000000', margin: 0 }}>{activeReceiptPreview.companyName || 'Garage Kings India'}</h1>
              <p className="text-gray-600 text-sm" style={{ fontSize: '14px', margin: '6px 0 0 0', color: '#4b5563' }}>{activeReceiptPreview.companyLocation || 'Delhi'}</p>
            </div>
            <div className="text-right" style={{ textAlign: 'right' }}>
              <h2 className="text-3xl font-black text-gray-800 tracking-tight leading-none mb-1" style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 4px 0', color: '#1f2937' }}>Receipt</h2>
              <p className="text-sm text-gray-600 font-semibold" style={{ fontSize: '12px', margin: 0, color: '#4b5563' }}>Receipt # &nbsp;{activeReceiptPreview.receiptNumber}</p>
              <p className="text-xs text-gray-500 font-medium mt-1" style={{ fontSize: '11px', margin: '4px 0 0 0', color: '#6b7280' }}>Date &nbsp;{activeReceiptPreview.dateString}</p>
            </div>
          </div>

          {/* "To" Section */}
          <div className="mb-8" style={{ marginTop: '30px', marginBottom: '30px' }}>
            <div className="bg-[#2b95c9] text-white px-4 py-1.5 font-bold text-xs tracking-wider mb-3 rounded-sm print-bg-blue print-text-white" style={{ fontSize: '12px', fontWeight: 'bold', backgroundColor: '#2b95c9', color: '#ffffff', padding: '6px 12px', letterSpacing: '0.05em' }}>To</div>
            <div className="px-1 space-y-1 text-gray-800 text-xs leading-relaxed" style={{ fontSize: '11px', color: '#1f2937', paddingLeft: '4px' }}>
              <div className="font-bold text-black text-sm" style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 2px 0', color: '#000000' }}>{activeReceiptPreview.customerName}</div>
              {activeReceiptPreview.customerPhone && <div className="font-semibold" style={{ fontWeight: '600' }}>{activeReceiptPreview.customerPhone}</div>}
              {activeReceiptPreview.customerAddress && <div className="whitespace-pre-line text-gray-600 mt-1" style={{ lineHeight: '1.5', color: '#4b5563' }}>{activeReceiptPreview.customerAddress}</div>}
            </div>
          </div>

          {/* Table Section */}
          <div className="mb-8" style={{ marginTop: '35px', marginBottom: '35px' }}>
            <div className="bg-[#2b95c9] text-white grid grid-cols-12 gap-2 px-4 py-2 font-bold text-xs tracking-wider rounded-sm print-bg-blue print-text-white" style={{ fontSize: '12px', fontWeight: 'bold', backgroundColor: '#2b95c9', color: '#ffffff', padding: '8px 16px', letterSpacing: '0.05em', display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: '8px' }}>
              <div className="col-span-2 text-center" style={{ gridColumn: 'span 2 / span 2', textAlign: 'center' }}>Qty</div>
              <div className="col-span-7" style={{ gridColumn: 'span 7 / span 7', textAlign: 'left' }}>Description</div>
              <div className="col-span-3 text-right" style={{ gridColumn: 'span 3 / span 3', textAlign: 'right' }}>Amount</div>
            </div>
            
            <div className="divide-y divide-gray-150 px-1" style={{ borderBottom: '1px solid #e5e7eb', paddingLeft: '4px', paddingRight: '4px' }}>
              {activeReceiptPreview.items?.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 py-3 text-xs" style={{ borderTop: idx > 0 ? '1px solid #f3f4f6' : 'none', display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: '8px', padding: '12px 0' }}>
                  <div className="col-span-2 text-center text-gray-600" style={{ gridColumn: 'span 2 / span 2', textAlign: 'center', color: '#4b5563' }}>{it.qty}</div>
                  <div className="col-span-7 font-medium text-gray-800" style={{ gridColumn: 'span 7 / span 7', textAlign: 'left', color: '#1f2937' }}>{it.description}</div>
                  <div className="col-span-3 text-right font-mono font-semibold text-gray-900" style={{ gridColumn: 'span 3 / span 3', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600', color: '#111827' }}>₹{Number(it.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
              ))}
              
              {activeReceiptPreview.includeShipping && (
                <div className="grid grid-cols-12 gap-2 py-3 text-xs" style={{ borderTop: '1px solid #f3f4f6', display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: '8px', padding: '12px 0' }}>
                  <div className="col-span-2 text-center text-gray-600" style={{ gridColumn: 'span 2 / span 2', textAlign: 'center', color: '#4b5563' }}>1</div>
                  <div className="col-span-7 font-medium text-gray-800" style={{ gridColumn: 'span 7 / span 7', textAlign: 'left', color: '#1f2937' }}>Shipping Charges</div>
                  <div className="col-span-3 text-right font-mono font-semibold text-gray-900" style={{ gridColumn: 'span 3 / span 3', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600', color: '#111827' }}>₹{Number(activeReceiptPreview.shippingCharges).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
              )}
            </div>
          </div>

          {/* Totals Section */}
          <div style={{ marginTop: '40px' }}>
            <div className="pt-4 space-y-2 text-right flex flex-col items-end" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingTop: '16px' }}>
              <div className="flex justify-between items-center text-xs text-gray-600 w-72" style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', width: '280px', color: '#4b5563' }}>
                <span>Including Tax ({activeReceiptPreview.taxPercent}%)</span>
                <span className="font-mono font-semibold" style={{ fontFamily: 'monospace', fontWeight: '600' }}>₹{Number(activeReceiptPreview.taxAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-black text-black pt-2 w-72" style={{ borderTop: '1px solid #d1d5db', marginTop: '6px', fontSize: '14px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', width: '280px', color: '#000000', paddingTop: '8px' }}>
                <span>Total Paid</span>
                <span className="font-mono font-black text-xl" style={{ fontSize: '18px', fontWeight: '900', fontFamily: 'monospace' }}>₹{Number(activeReceiptPreview.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {activeReceiptPreview.formatType === 'prebooking' && activeReceiptPreview.pendingBalance && Number(activeReceiptPreview.pendingBalance) > 0 && (
                <div className="flex justify-between items-center text-xs text-red-600 font-bold pt-2 w-72" style={{ borderTop: '1px dashed #d1d5db', marginTop: '6px', fontSize: '11px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', width: '280px', color: '#dc2626', paddingTop: '6px' }}>
                  <span>Balance Due before Delivery</span>
                  <span className="font-mono font-bold" style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>₹{Number(activeReceiptPreview.pendingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>

            {/* Footer refund policy statement */}
            {activeReceiptPreview.footerNote && (
              <div className="text-center text-xs text-gray-800 font-medium leading-normal px-4" style={{ marginTop: '80px', fontSize: '11.5px', textAlign: 'center', color: '#374151', paddingLeft: '16px', paddingRight: '16px', lineHeight: '1.6' }}>
                {activeReceiptPreview.footerNote}
              </div>
            )}
          </div>
          </div>
        </div>
      )}
    </div>
  )
}
