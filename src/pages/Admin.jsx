import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Edit2, ChevronUp, ChevronDown, Save, X, Image as ImageIcon, Settings, Eye, EyeOff, LogOut, TrendingUp, Clock, ShoppingBag, DollarSign, Calendar, ChevronLeft, ChevronRight, BarChart3, Layers, Download, FileSpreadsheet, Filter } from 'lucide-react'
import { getCars, addCar, updateCar, deleteCar, updateCarOrder, uploadImageToStorage, isFirebaseConfigured, getGlobalSettings, updateGlobalSettings, getBids, getAuctions, addAuction, updateAuction, deleteAuction, getAuctionBids, getReceipts, addReceipt, updateReceipt, deleteReceipt, auth } from '../lib/db'
import { Link } from 'react-router-dom'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import * as XLSX from 'xlsx'

const parseReceiptDate = (receipt) => {
  if (!receipt) return new Date();
  
  if (receipt.receiptDate) {
    const d = new Date(receipt.receiptDate);
    if (!isNaN(d.getTime())) return d;
  }

  if (receipt.dateString) {
    let str = String(receipt.dateString).trim();
    str = str.replace(/^[A-Za-z]+,\s*/, '');

    const dmyMatch = str.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1;
      const year = parseInt(dmyMatch[3], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }

    const cleanedStr = str.replace(/\s*-\s*/, ' ');
    const parsed = new Date(cleanedStr);
    if (!isNaN(parsed.getTime())) return parsed;

    const datePart = str.split(' - ')[0];
    const parsedDatePart = new Date(datePart);
    if (!isNaN(parsedDatePart.getTime())) return parsedDatePart;
  }

  if (receipt.createdAt) {
    const d = new Date(receipt.createdAt);
    if (!isNaN(d.getTime())) return d;
  }

  return new Date();
};

const getDatetimeLocalValue = (dateObj = new Date()) => {
  if (!dateObj || isNaN(dateObj.getTime())) dateObj = new Date();
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

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
  hours = hours ? hours : 12;
  
  return `${dayName}, ${dateNum} ${monthName} ${year} - ${hours}:${minutes} ${ampm}`;
};

const exportReceiptsToExcel = (receiptsList, groupBy = 'format', filterType = 'all', searchOnly = false, searchStr = '') => {
  let list = receiptsList;
  if (searchOnly && searchStr) {
    const s = searchStr.toLowerCase();
    list = list.filter(r => 
      r.customerName?.toLowerCase().includes(s) || 
      r.customerPhone?.toLowerCase().includes(s) || 
      r.receiptNumber?.toLowerCase().includes(s) ||
      r.customerEmail?.toLowerCase().includes(s) ||
      r.customerInsta?.toLowerCase().includes(s)
    );
  }

  if (filterType !== 'all') {
    list = list.filter(r => (r.formatType || 'standard') === filterType);
  }

  const wb = XLSX.utils.book_new();

  const mapReceiptRow = (r) => ({
    'Receipt #': r.receiptNumber || '',
    'Receipt Date': r.dateString || '',
    'Customer Name': r.customerName || '',
    'Phone': r.customerPhone || '',
    'Email': r.customerEmail || '',
    'Instagram': r.customerInsta || '',
    'Format': r.formatType === 'prebooking' ? 'Prebooking / PO' : r.formatType === 'auction' ? 'Auction Win' : 'Standard Sale',
    'Items Summary': r.items?.map(it => `${it.qty}x ${it.description} (₹${it.amount})`).join(' | ') || '',
    'Item Count': r.items?.reduce((acc, it) => acc + (Number(it.qty) || 0), 0) || 0,
    'Subtotal (₹)': r.items?.reduce((acc, it) => acc + ((Number(it.qty) || 0) * (Number(it.amount) || 0)), 0) || 0,
    'Shipping (₹)': Number(r.shippingCharges || 0),
    'Total Amount Paid (₹)': Number(r.totalAmount || 0),
    'Pending Balance Due (₹)': Number(r.pendingBalance || 0),
    'Shipping Address': r.customerAddress || '',
    'Company': r.companyName || 'Garage Kings India',
    'Created At (DB)': r.createdAt || ''
  });

  const colWidths = [
    { wch: 14 }, // Receipt #
    { wch: 32 }, // Date
    { wch: 22 }, // Customer Name
    { wch: 15 }, // Phone
    { wch: 25 }, // Email
    { wch: 18 }, // Insta
    { wch: 18 }, // Format
    { wch: 45 }, // Items
    { wch: 12 }, // Item Count
    { wch: 14 }, // Subtotal
    { wch: 14 }, // Shipping
    { wch: 20 }, // Total
    { wch: 22 }, // Pending
    { wch: 35 }, // Address
    { wch: 20 }, // Company
    { wch: 25 }  // Created At
  ];

  const masterData = list.map(mapReceiptRow);
  const wsMaster = XLSX.utils.json_to_sheet(masterData.length > 0 ? masterData : [{ 'Status': 'No receipts matched selected filters' }]);
  wsMaster['!cols'] = colWidths;
  XLSX.utils.book_append_sheet(wb, wsMaster, 'All Receipts');

  if (groupBy === 'format') {
    const formatKeys = [
      { key: 'standard', title: 'Standard Sales' },
      { key: 'prebooking', title: 'Prebooking PO' },
      { key: 'auction', title: 'Auction Wins' }
    ];
    formatKeys.forEach(fk => {
      const groupItems = list.filter(r => (r.formatType || 'standard') === fk.key).map(mapReceiptRow);
      if (groupItems.length > 0) {
        const wsGroup = XLSX.utils.json_to_sheet(groupItems);
        wsGroup['!cols'] = colWidths;
        XLSX.utils.book_append_sheet(wb, wsGroup, fk.title);
      }
    });
  } else if (groupBy === 'month') {
    const monthMap = {};
    list.forEach(r => {
      const d = parseReceiptDate(r);
      const mLabel = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      if (!monthMap[mLabel]) monthMap[mLabel] = [];
      monthMap[mLabel].push(mapReceiptRow(r));
    });

    Object.keys(monthMap).forEach(mLabel => {
      const wsMonth = XLSX.utils.json_to_sheet(monthMap[mLabel]);
      wsMonth['!cols'] = colWidths;
      XLSX.utils.book_append_sheet(wb, wsMonth, mLabel.slice(0, 31));
    });
  }

  XLSX.writeFile(wb, `GarageKings_Receipts_${groupBy}_grouped_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

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
  const [auctions, setAuctions] = useState([])
  const [isAddingAuction, setIsAddingAuction] = useState(false)
  const [editingAuctionId, setEditingAuctionId] = useState(null)
  const [auctionForm, setAuctionForm] = useState({ title: '', brand: '', carBrand: '', scale: '1:64', grade: '', description: '', image: '', currency: '₹', startingPrice: '', minBidIncrement: '', endDate: '', endTime: '20:00' })
  const [auctionBidsModal, setAuctionBidsModal] = useState(null)
  const [auctionBidsLoading, setAuctionBidsLoading] = useState(false)

  // Navigation & Receipt state
  const [adminTab, setAdminTab] = useState('dashboard') // 'dashboard', 'inventory', 'auctions', 'receipts'
  const [receipts, setReceipts] = useState([])
  const [isAddingReceipt, setIsAddingReceipt] = useState(false)
  const [editingReceiptId, setEditingReceiptId] = useState(null)
  const [receiptSearch, setReceiptSearch] = useState('')
  const [receiptPage, setReceiptPage] = useState(1)
  const RECEIPTS_PER_PAGE = 20

  // Excel Export Modal state
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false)
  const [excelGroupBy, setExcelGroupBy] = useState('format') // 'format', 'month', 'none'
  const [excelFilterType, setExcelFilterType] = useState('all') // 'all', 'standard', 'prebooking', 'auction'
  const [excelSearchOnly, setExcelSearchOnly] = useState(false)

  // Interactive Chart state
  const [chartTimeframe, setChartTimeframe] = useState('daily') // 'daily', 'weekly', 'monthly'
  const [chartMetric, setChartMetric] = useState('all') // 'all', 'stock', 'po'
  const [hoveredPointIndex, setHoveredPointIndex] = useState(null)

  // Interactive Revenue Chart Data Generation
  const chartData = useMemo(() => {
    const now = new Date();
    let buckets = [];

    if (chartTimeframe === 'daily') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dayStr = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
        const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
        const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

        buckets.push({
          label: i === 0 ? 'Today' : dayStr,
          startDate: startOfDay,
          endDate: endOfDay,
          stock: 0,
          po: 0,
          total: 0
        });
      }
    } else if (chartTimeframe === 'weekly') {
      for (let i = 7; i >= 0; i--) {
        const endW = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        const startW = new Date(endW.getTime() - 6 * 24 * 60 * 60 * 1000);
        startW.setHours(0, 0, 0, 0);
        endW.setHours(23, 59, 59, 999);

        const label = i === 0 ? 'This Wk' : `${startW.getDate()} ${startW.toLocaleDateString('en-IN', { month: 'short' })}`;

        buckets.push({
          label,
          startDate: startW,
          endDate: endW,
          stock: 0,
          po: 0,
          total: 0
        });
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const startM = new Date(now.getFullYear(), now.getMonth() - i, 1, 0, 0, 0);
        const endM = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

        const label = startM.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });

        buckets.push({
          label,
          startDate: startM,
          endDate: endM,
          stock: 0,
          po: 0,
          total: 0
        });
      }
    }

    receipts.forEach(r => {
      const amt = Number(r.totalAmount) || 0;
      const rDate = parseReceiptDate(r);

      const matchedBucket = buckets.find(b => rDate >= b.startDate && rDate <= b.endDate);
      if (matchedBucket) {
        if (r.formatType === 'prebooking') {
          matchedBucket.po += amt;
        } else {
          matchedBucket.stock += amt;
        }
        matchedBucket.total += amt;
      }
    });

    return buckets;
  }, [receipts, chartTimeframe]);

  // Dashboard Analytics Calculations
  const dashboardStats = useMemo(() => {
    let stockRevenue = 0;
    let poRevenue = 0;
    let poPendingAmount = 0;
    
    let standardCount = 0;
    let poCount = 0;
    let auctionCount = 0;
    let customCount = 0;

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    let thisMonthRevenue = 0;
    let lastMonthRevenue = 0;
    let thisWeekRevenue = 0;
    let lastWeekRevenue = 0;

    receipts.forEach(r => {
      const totalPaid = Number(r.totalAmount) || 0;
      const pending = Number(r.pendingBalance) || 0;
      const rDate = parseReceiptDate(r);

      if (r.formatType === 'prebooking') {
        poRevenue += totalPaid;
        poPendingAmount += pending;
        poCount++;
      } else {
        stockRevenue += totalPaid;
        if (r.formatType === 'auction') auctionCount++;
        else if (r.formatType === 'custom') customCount++;
        else standardCount++;
      }

      if (rDate >= startOfThisMonth) {
        thisMonthRevenue += totalPaid;
      } else if (rDate >= startOfLastMonth && rDate <= endOfLastMonth) {
        lastMonthRevenue += totalPaid;
      }

      if (rDate >= sevenDaysAgo) {
        thisWeekRevenue += totalPaid;
      } else if (rDate >= fourteenDaysAgo && rDate < sevenDaysAgo) {
        lastWeekRevenue += totalPaid;
      }
    });

    const totalRevenue = stockRevenue + poRevenue;
    const totalReceiptsCount = receipts.length;
    const avgReceiptValue = totalReceiptsCount > 0 ? totalRevenue / totalReceiptsCount : 0;

    const monthGrowthPct = lastMonthRevenue > 0 
      ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
      : thisMonthRevenue > 0 ? '100' : '0';

    const weekGrowthPct = lastWeekRevenue > 0
      ? (((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100).toFixed(1)
      : thisWeekRevenue > 0 ? '100' : '0';

    const totalCarsCount = cars.length;
    const totalInventoryValue = cars.reduce((acc, car) => acc + (Number(car.price) || 0), 0);
    const activeAuctionsCount = auctions.filter(a => {
      if (!a.endDate) return true;
      const end = new Date(`${a.endDate}T${a.endTime || '23:59'}`);
      return end > now;
    }).length;

    return {
      stockRevenue,
      poRevenue,
      poPendingAmount,
      totalRevenue,
      totalReceiptsCount,
      avgReceiptValue,
      thisMonthRevenue,
      lastMonthRevenue,
      monthGrowthPct,
      thisWeekRevenue,
      lastWeekRevenue,
      weekGrowthPct,
      standardCount,
      poCount,
      auctionCount,
      customCount,
      totalCarsCount,
      totalInventoryValue,
      activeAuctionsCount
    };
  }, [receipts, cars, auctions]);
  const [receiptForm, setReceiptForm] = useState({
    receiptNumber: '',
    dateString: '',
    companyName: 'Garage Kings India',
    companyLocation: 'Delhi',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerInsta: '',
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



  const handleFormatTypeChange = (type) => {
    let footerNote = '';
    let includeShipping = receiptForm.includeShipping;
    if (type === 'standard') {
      footerNote = 'In the event that the order cannot be fulfilled from our end, a full refund will be issued.';
    } else if (type === 'prebooking') {
      footerNote = 'This receipt is for the Pre-Order (PO) of the item. Rest of the payment is due when the stock arrives. Pre-Orders are non-refundable unless unfulfilled by Garage Kings India.';
      includeShipping = false;
    } else if (type === 'auction') {
      footerNote = 'This receipt confirms the successful win of the auction item. Thank you for bidding! In the event that the order cannot be fulfilled from our end, a full refund will be issued.';
    } else {
      footerNote = '';
    }
    
    setReceiptForm(prev => ({
      ...prev,
      formatType: type,
      includeShipping,
      footerNote
    }));
  }

  const handleEditReceipt = (receipt) => {
    setEditingReceiptId(receipt.id);
    const parsedDate = parseReceiptDate(receipt);
    setReceiptForm({
      receiptNumber: receipt.receiptNumber || '',
      dateString: receipt.dateString || formatReceiptDate(parsedDate),
      calendarDate: getDatetimeLocalValue(parsedDate),
      companyName: receipt.companyName || 'Garage Kings India',
      companyLocation: receipt.companyLocation || 'Delhi',
      customerName: receipt.customerName || '',
      customerPhone: receipt.customerPhone || '',
      customerEmail: receipt.customerEmail || '',
      customerInsta: receipt.customerInsta || '',
      customerAddress: receipt.customerAddress || '',
      formatType: receipt.formatType || 'standard',
      items: receipt.items && receipt.items.length > 0 ? receipt.items.map(it => ({ qty: it.qty, description: it.description, amount: String(it.amount) })) : [{ qty: 1, description: '', amount: '' }],
      shippingCharges: receipt.shippingCharges !== undefined ? receipt.shippingCharges : 150,
      includeShipping: receipt.includeShipping !== undefined ? receipt.includeShipping : true,
      taxPercent: receipt.taxPercent !== undefined ? receipt.taxPercent : 0,
      footerNote: receipt.footerNote !== undefined ? receipt.footerNote : '',
      pendingBalance: receipt.pendingBalance !== undefined && receipt.pendingBalance !== 0 ? String(receipt.pendingBalance) : ''
    });
    setIsAddingReceipt(true);
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

      const dateToUse = receiptForm.calendarDate ? new Date(receiptForm.calendarDate) : parseReceiptDate({ dateString: receiptForm.dateString });
      const finalDateString = formatReceiptDate(dateToUse);
      const computedReceiptDate = dateToUse.toISOString();

      const receiptData = {
        receiptNumber: receiptForm.receiptNumber.trim(),
        dateString: finalDateString,
        receiptDate: computedReceiptDate,
        companyName: companyName.trim(),
        companyLocation: companyLocation.trim(),
        customerName: receiptForm.customerName.trim(),
        customerPhone: receiptForm.customerPhone.trim(),
        customerEmail: receiptForm.customerEmail ? receiptForm.customerEmail.trim() : '',
        customerInsta: receiptForm.customerInsta ? receiptForm.customerInsta.trim() : '',
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

      if (editingReceiptId) {
        await updateReceipt(editingReceiptId, receiptData);
        alert("Receipt updated successfully!");
      } else {
        await addReceipt(receiptData);
        alert("Receipt saved successfully!");
      }
      
      const refreshed = await getReceipts();
      setReceipts(refreshed);
      setIsAddingReceipt(false);
      setEditingReceiptId(null);
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
      setActiveReceiptPreview(null);
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
                const now = new Date();
                setEditingReceiptId(null);
                setReceiptForm({
                  receiptNumber: suggestNextReceiptNumber(receipts),
                  dateString: formatReceiptDate(now),
                  calendarDate: getDatetimeLocalValue(now),
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
        <div className="flex gap-2 mb-8 border-b border-white/8 pb-0 overflow-x-auto">
          {['dashboard', 'inventory', 'receipts'].map(t => (
            <button key={t} onClick={() => setAdminTab(t)}
              className={`px-5 py-3 text-sm font-black uppercase tracking-wider rounded-t-xl transition-colors whitespace-nowrap ${
                adminTab === t ? 'bg-white/8 border border-white/10 border-b-0 text-white' : 'text-white/30 hover:text-white/60'
              }`}>
              {t === 'dashboard' ? '📊 Dashboard' : t === 'inventory' ? '📦 Inventory' : '🧾 Receipts'}
            </button>
          ))}
        </div>

        {/* ── DASHBOARD TAB PANEL ───────────────────────────── */}
        {adminTab === 'dashboard' && (
          <div className="space-y-8 no-print animate-fade-in mb-12">
            {/* Top Row: Key Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Stock Revenue */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/50">Stock Revenue</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <ShoppingBag size={18} />
                  </div>
                </div>
                <div className="text-2xl font-black font-mono text-white tracking-tight">
                  ₹{dashboardStats.stockRevenue.toLocaleString('en-IN')}
                </div>
                <p className="text-[11px] text-white/40 mt-1 font-medium">Non-PO / Stock & Auction Sales</p>
              </div>

              {/* PO Revenue */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-amber-500/40 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/50">PO Revenue</span>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Clock size={18} />
                  </div>
                </div>
                <div className="text-2xl font-black font-mono text-amber-350 tracking-tight">
                  ₹{dashboardStats.poRevenue.toLocaleString('en-IN')}
                </div>
                <p className="text-[11px] text-white/40 mt-1 font-medium">Pre-Orders Collected</p>
              </div>

              {/* PO Pending Amount */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-rose-500/40 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/50">PO Pending Due</span>
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <TrendingUp size={18} />
                  </div>
                </div>
                <div className="text-2xl font-black font-mono text-rose-400 tracking-tight">
                  ₹{dashboardStats.poPendingAmount.toLocaleString('en-IN')}
                </div>
                <p className="text-[11px] text-white/40 mt-1 font-medium">Balance Due Before Delivery</p>
              </div>

              {/* Total Revenue (PO + Stock) */}
              <div className="bg-gradient-to-br from-blue-600/20 via-blue-500/10 to-transparent border border-blue-500/30 rounded-2xl p-5 relative overflow-hidden group hover:border-blue-400/50 transition-all shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Total Revenue</span>
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    <DollarSign size={18} />
                  </div>
                </div>
                <div className="text-2xl font-black font-mono text-gk-yellow tracking-tight">
                  ₹{dashboardStats.totalRevenue.toLocaleString('en-IN')}
                </div>
                <p className="text-[11px] text-blue-200/60 mt-1 font-medium">Combined Collected (PO + Stock)</p>
              </div>
            </div>

            {/* ── INTERACTIVE REVENUE LINE GRAPH ──────────────────── */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
              {/* Header with Interactive Filter Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                      Revenue Trend Line Graph
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono font-normal">
                        {chartTimeframe === 'daily' ? 'Daily (Last 7 Days)' : chartTimeframe === 'weekly' ? 'Weekly (Last 8 Weeks)' : 'Monthly (Last 12 Months)'}
                      </span>
                    </h3>
                    <p className="text-xs text-white/40 mt-0.5">Filter timeframes and compare revenue performance over time</p>
                  </div>
                </div>

                {/* Filter Controllers */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Timeframe Filter Switcher */}
                  <div className="flex p-1 bg-black/50 border border-white/10 rounded-xl">
                    {[
                      { id: 'daily', label: '7 Days' },
                      { id: 'weekly', label: '8 Weeks' },
                      { id: 'monthly', label: '12 Months' }
                    ].map(tf => (
                      <button
                        key={tf.id}
                        onClick={() => { setChartTimeframe(tf.id); setHoveredPointIndex(null); }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          chartTimeframe === tf.id
                            ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                            : 'text-white/40 hover:text-white'
                        }`}
                      >
                        {tf.label}
                      </button>
                    ))}
                  </div>

                  {/* Metric Filter Switcher */}
                  <div className="flex p-1 bg-black/50 border border-white/10 rounded-xl">
                    {[
                      { id: 'all', label: 'All Revenue' },
                      { id: 'stock', label: 'Stock Only' },
                      { id: 'po', label: 'PO Only' }
                    ].map(m => (
                      <button
                        key={m.id}
                        onClick={() => { setChartMetric(m.id); setHoveredPointIndex(null); }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          chartMetric === m.id
                            ? 'bg-white/15 text-white border border-white/20'
                            : 'text-white/40 hover:text-white'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SVG Line Graph Render */}
              {(() => {
                const svgWidth = 800;
                const svgHeight = 260;
                const paddingLeft = 60;
                const paddingRight = 30;
                const paddingTop = 25;
                const paddingBottom = 40;

                const chartW = svgWidth - paddingLeft - paddingRight;
                const chartH = svgHeight - paddingTop - paddingBottom;

                const getVal = (d) => chartMetric === 'stock' ? d.stock : chartMetric === 'po' ? d.po : d.total;
                const maxVal = Math.max(...chartData.map(getVal), 100) * 1.15;

                const points = chartData.map((d, i) => {
                  const x = paddingLeft + (chartData.length > 1 ? (i / (chartData.length - 1)) * chartW : chartW / 2);
                  const val = getVal(d);
                  const y = svgHeight - paddingBottom - (val / maxVal) * chartH;
                  return { x, y, val, data: d, index: i };
                });

                let linePath = '';
                if (points.length > 0) {
                  linePath = `M ${points[0].x},${points[0].y}`;
                  for (let i = 0; i < points.length - 1; i++) {
                    const p0 = points[i];
                    const p1 = points[i + 1];
                    const cp1x = p0.x + (p1.x - p0.x) / 2;
                    const cp1y = p0.y;
                    const cp2x = p0.x + (p1.x - p0.x) / 2;
                    const cp2y = p1.y;
                    linePath += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p1.x},${p1.y}`;
                  }
                }

                const areaPath = points.length > 0 
                  ? `${linePath} L ${points[points.length - 1].x},${svgHeight - paddingBottom} L ${points[0].x},${svgHeight - paddingBottom} Z`
                  : '';

                const strokeColor = chartMetric === 'stock' ? '#34d399' : chartMetric === 'po' ? '#fbbf24' : '#eab308';
                const gradientId = `chartGradient_${chartMetric}`;

                const yTicks = [0, 0.33, 0.66, 1].map(pct => {
                  const val = maxVal * pct;
                  const y = svgHeight - paddingBottom - pct * chartH;
                  return { val, y };
                });

                const activePoint = hoveredPointIndex !== null ? points[hoveredPointIndex] : points[points.length - 1];

                return (
                  <div className="space-y-4">
                    {/* Active Hover Point Callout */}
                    {activePoint && (
                      <div className="flex flex-wrap items-center justify-between p-3.5 bg-black/40 border border-white/10 rounded-xl gap-4">
                        <div className="flex items-center gap-3">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: strokeColor }}></span>
                          <span className="text-xs font-bold text-white font-mono">{activePoint.data.label}</span>
                        </div>
                        <div className="flex items-center gap-6 text-xs">
                          <div>
                            <span className="text-white/40 mr-1.5">Stock Sales:</span>
                            <span className="font-mono font-bold text-emerald-400">₹{activePoint.data.stock.toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-white/40 mr-1.5">PO Revenue:</span>
                            <span className="font-mono font-bold text-amber-400">₹{activePoint.data.po.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="pl-3 border-l border-white/10">
                            <span className="text-white/40 mr-1.5">Selected Total:</span>
                            <span className="font-mono font-black text-gk-yellow text-sm">₹{activePoint.data.total.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SVG Canvas */}
                    <div className="relative w-full overflow-hidden">
                      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible select-none">
                        <defs>
                          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
                            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Y-Axis Lines */}
                        {yTicks.map((tick, idx) => (
                          <g key={idx}>
                            <line
                              x1={paddingLeft}
                              y1={tick.y}
                              x2={svgWidth - paddingRight}
                              y2={tick.y}
                              stroke="rgba(255, 255, 255, 0.07)"
                              strokeDasharray="4 4"
                            />
                            <text
                              x={paddingLeft - 10}
                              y={tick.y + 4}
                              textAnchor="end"
                              fill="rgba(255, 255, 255, 0.35)"
                              fontSize="10"
                              fontFamily="monospace"
                            >
                              ₹{tick.val >= 100000 ? `${(tick.val / 100000).toFixed(1)}L` : tick.val >= 1000 ? `${(tick.val / 1000).toFixed(0)}k` : tick.val.toFixed(0)}
                            </text>
                          </g>
                        ))}

                        {/* X-Axis Labels */}
                        {points.map((pt, idx) => (
                          <text
                            key={idx}
                            x={pt.x}
                            y={svgHeight - 12}
                            textAnchor="middle"
                            fill={hoveredPointIndex === idx ? '#ffffff' : 'rgba(255, 255, 255, 0.4)'}
                            fontSize="10"
                            fontWeight={hoveredPointIndex === idx ? 'bold' : 'normal'}
                          >
                            {pt.data.label}
                          </text>
                        ))}

                        {/* Area Gradient */}
                        <path d={areaPath} fill={`url(#${gradientId})`} />

                        {/* Line Path */}
                        <path
                          d={linePath}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Data Points */}
                        {points.map((pt, idx) => (
                          <g key={idx} className="cursor-pointer" onMouseEnter={() => setHoveredPointIndex(idx)}>
                            {hoveredPointIndex === idx && (
                              <line
                                x1={pt.x}
                                y1={paddingTop}
                                x2={pt.x}
                                y2={svgHeight - paddingBottom}
                                stroke="rgba(255, 255, 255, 0.25)"
                                strokeDasharray="3 3"
                              />
                            )}
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={hoveredPointIndex === idx ? 8 : 5}
                              fill={strokeColor}
                              fillOpacity={hoveredPointIndex === idx ? 0.4 : 0.2}
                            />
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={hoveredPointIndex === idx ? 5 : 3.5}
                              fill="#ffffff"
                              stroke={strokeColor}
                              strokeWidth="2.5"
                            />
                          </g>
                        ))}
                      </svg>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Second Row: Time-Based Analytics & Operational Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Month & Week Revenue Analytics */}
              <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
                      <BarChart3 size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Revenue Trends & Time Breakdown</h3>
                      <p className="text-xs text-white/40 mt-0.5">Comparative sales performance across time periods</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Monthly Comparison */}
                  <div className="bg-black/30 border border-white/8 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs text-white/50">
                      <span className="font-semibold uppercase tracking-wider">Month-over-Month</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        Number(dashboardStats.monthGrowthPct) >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {Number(dashboardStats.monthGrowthPct) >= 0 ? `+${dashboardStats.monthGrowthPct}%` : `${dashboardStats.monthGrowthPct}%`}
                      </span>
                    </div>
                    <div>
                      <div className="text-xl font-black font-mono text-white">₹{dashboardStats.thisMonthRevenue.toLocaleString('en-IN')}</div>
                      <div className="text-[11px] text-white/40 mt-0.5">This Month</div>
                    </div>
                    <div className="pt-2 border-t border-white/5 flex justify-between items-center text-xs text-white/50">
                      <span>Last Month:</span>
                      <span className="font-mono text-white/80 font-semibold">₹{dashboardStats.lastMonthRevenue.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Weekly Comparison */}
                  <div className="bg-black/30 border border-white/8 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs text-white/50">
                      <span className="font-semibold uppercase tracking-wider">Week-over-Week</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        Number(dashboardStats.weekGrowthPct) >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {Number(dashboardStats.weekGrowthPct) >= 0 ? `+${dashboardStats.weekGrowthPct}%` : `${dashboardStats.weekGrowthPct}%`}
                      </span>
                    </div>
                    <div>
                      <div className="text-xl font-black font-mono text-white">₹{dashboardStats.thisWeekRevenue.toLocaleString('en-IN')}</div>
                      <div className="text-[11px] text-white/40 mt-0.5">Last 7 Days</div>
                    </div>
                    <div className="pt-2 border-t border-white/5 flex justify-between items-center text-xs text-white/50">
                      <span>Prior 7 Days:</span>
                      <span className="font-mono text-white/80 font-semibold">₹{dashboardStats.lastWeekRevenue.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Format Distribution Progress Bars */}
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-white/50">Receipt Format Distribution</div>
                  <div className="space-y-2.5">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/70">Standard Sales ({dashboardStats.standardCount})</span>
                        <span className="font-mono text-white/50">{dashboardStats.totalReceiptsCount > 0 ? Math.round((dashboardStats.standardCount / dashboardStats.totalReceiptsCount) * 100) : 0}%</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${dashboardStats.totalReceiptsCount > 0 ? (dashboardStats.standardCount / dashboardStats.totalReceiptsCount) * 100 : 0}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-amber-350">Prebooking / PO ({dashboardStats.poCount})</span>
                        <span className="font-mono text-white/50">{dashboardStats.totalReceiptsCount > 0 ? Math.round((dashboardStats.poCount / dashboardStats.totalReceiptsCount) * 100) : 0}%</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${dashboardStats.totalReceiptsCount > 0 ? (dashboardStats.poCount / dashboardStats.totalReceiptsCount) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Operational Metrics & Quick Actions */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                  <h3 className="font-bold text-white text-base border-b border-white/10 pb-3">Operational Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-xl bg-black/30 border border-white/5">
                      <span className="text-xs text-white/60">Total Receipts Generated</span>
                      <span className="font-mono font-bold text-white">{dashboardStats.totalReceiptsCount}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-black/30 border border-white/5">
                      <span className="text-xs text-white/60">Average Receipt Value</span>
                      <span className="font-mono font-bold text-gk-yellow">₹{dashboardStats.avgReceiptValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider text-white/50">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => { 
                        const now = new Date();
                        setAdminTab('receipts'); 
                        setEditingReceiptId(null); 
                        setReceiptForm(prev => ({
                          ...prev,
                          receiptNumber: suggestNextReceiptNumber(receipts),
                          dateString: formatReceiptDate(now),
                          calendarDate: getDatetimeLocalValue(now)
                        }));
                        setIsAddingReceipt(true); 
                      }}
                      className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-300 font-bold text-xs hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Plus size={14} /> New Receipt
                    </button>
                    <button
                      onClick={() => setAdminTab('receipts')}
                      className="p-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold text-xs hover:bg-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Receipts History
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {adminTab === 'inventory' && (
          <div className="space-y-8">
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
          </div>
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
                    <h2 className="text-xl font-bold text-white">{editingReceiptId ? `Edit Receipt (${receiptForm.receiptNumber})` : 'Create New Receipt'}</h2>
                    <button onClick={() => { setIsAddingReceipt(false); setEditingReceiptId(null); }} className="text-white/50 hover:text-white cursor-pointer"><X size={20} /></button>
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
                          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 flex items-center justify-between">
                            <span>Receipt Date & Time *</span>
                            <span className="text-[10px] text-blue-400 font-normal lowercase">(calendar picker)</span>
                          </label>
                          <input 
                            type="datetime-local" 
                            value={receiptForm.calendarDate || getDatetimeLocalValue(parseReceiptDate(receiptForm))} 
                            onChange={e => {
                              const val = e.target.value;
                              if (!val) return;
                              const d = new Date(val);
                              const formatted = formatReceiptDate(d);
                              setReceiptForm(prev => ({
                                ...prev,
                                calendarDate: val,
                                dateString: formatted
                              }));
                            }} 
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 [color-scheme:dark]" 
                          />
                          <p className="text-[11px] text-blue-300 font-medium mt-1.5 truncate">
                            Label on Receipt: {receiptForm.dateString || formatReceiptDate()}
                          </p>
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
                          <div>
                            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Email ID (Optional)</label>
                            <input type="email" placeholder="e.g. customer@example.com" value={receiptForm.customerEmail} onChange={e => setReceiptForm(prev => ({ ...prev, customerEmail: e.target.value }))} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Instagram Handle (Optional)</label>
                            <input type="text" placeholder="e.g. @diecast_collector" value={receiptForm.customerInsta} onChange={e => setReceiptForm(prev => ({ ...prev, customerInsta: e.target.value }))} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Customer Address (Optional)</label>
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
                            <option value="prebooking" className="bg-[#111116] text-white">Prebooking / Pre-Order (PO)</option>
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
                                  {receiptForm.customerEmail && <div className="font-medium text-gray-600">{receiptForm.customerEmail}</div>}
                                  {receiptForm.customerInsta && <div className="font-medium text-blue-600">{receiptForm.customerInsta.startsWith('@') ? receiptForm.customerInsta : `@${receiptForm.customerInsta}`}</div>}
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
                              <div className="flex justify-between items-start text-[10px] text-red-600 font-bold pt-1.5 border-t border-dashed border-gray-300 mt-1.5 gap-2">
                                <div>
                                  <div>Balance Due before Delivery</div>
                                  <div className="text-[9px] text-red-500 font-normal">(Excluding shipping)</div>
                                </div>
                                <span className="font-mono font-bold text-red-650 whitespace-nowrap shrink-0">₹{Number(receiptForm.pendingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setIsExcelModalOpen(true)}
                  className="px-4 py-2 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-emerald-300 font-bold text-xs hover:bg-emerald-500/25 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap shadow-sm"
                  title="Export receipts to Excel with group-by tabs and filters"
                >
                  <FileSpreadsheet size={15} /> Export Excel (.xlsx)
                </button>
                <input 
                  type="text" 
                  placeholder="Search customer, phone, email, @insta, or RT#..." 
                  value={receiptSearch} 
                  onChange={e => { setReceiptSearch(e.target.value); setReceiptPage(1); }} 
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
            ) : (() => {
              const filteredReceipts = receipts.filter(r => {
                const search = receiptSearch.toLowerCase();
                return r.customerName?.toLowerCase().includes(search) || 
                       r.customerPhone?.toLowerCase().includes(search) || 
                       r.receiptNumber?.toLowerCase().includes(search) ||
                       r.customerEmail?.toLowerCase().includes(search) ||
                       r.customerInsta?.toLowerCase().includes(search);
              });
              const totalReceiptPages = Math.ceil(filteredReceipts.length / RECEIPTS_PER_PAGE) || 1;
              const paginatedReceipts = filteredReceipts.slice((receiptPage - 1) * RECEIPTS_PER_PAGE, receiptPage * RECEIPTS_PER_PAGE);

              return filteredReceipts.length === 0 ? (
                <div className="p-12 text-center text-white/30">
                  <p className="text-2xl mb-2">🔍</p>
                  <p>No receipts matched your search.</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-white/5">
                    {paginatedReceipts.map(receipt => (
                      <div key={receipt.id} className="grid grid-cols-12 gap-3 p-4 items-center hover:bg-white/5 transition-colors group">
                        <div className="col-span-2">
                          <div className="font-bold text-sm text-blue-400 font-mono">{receipt.receiptNumber}</div>
                          <div className="text-[9px] text-white/40 font-mono mt-0.5">{receipt.dateString?.split(' - ')[0]}</div>
                        </div>
                        <div className="col-span-4">
                          <div className="font-bold text-sm text-white">{receipt.customerName}</div>
                          <div className="flex flex-wrap gap-2 text-xs text-white/50 mt-0.5">
                            {receipt.customerPhone && <span>{receipt.customerPhone}</span>}
                            {receipt.customerEmail && <span className="text-blue-300 font-mono text-[11px]">{receipt.customerEmail}</span>}
                            {receipt.customerInsta && <span className="text-purple-300 font-mono text-[11px]">{receipt.customerInsta.startsWith('@') ? receipt.customerInsta : `@${receipt.customerInsta}`}</span>}
                          </div>
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
                            {receipt.formatType === 'prebooking' ? 'Prebooking / PO' : 
                             receipt.formatType === 'auction' ? 'Auction Win' : 'Sale'}
                          </span>
                        </div>
                        <div className="col-span-2 text-right">
                          <div className="font-mono text-sm text-gk-yellow">₹{Number(receipt.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                          <div className="text-[9px] text-white/30 font-mono mt-0.5">Total paid</div>
                        </div>
                        <div className="col-span-2 flex justify-end gap-1.5">
                          <button onClick={() => handleEditReceipt(receipt)} title="Edit receipt" className="p-2 text-white/60 hover:text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                            <Edit2 size={15} />
                          </button>
                          <button onClick={() => handlePrintReceipt(receipt)} title="Print / Save PDF" className="p-2 text-blue-400 hover:text-white bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors cursor-pointer">
                            <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                          </button>
                          <button onClick={() => handleDeleteReceipt(receipt.id)} title="Delete record" className="p-2 text-white/40 hover:text-gk-orange bg-white/5 border border-white/10 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Receipt Pagination Controls */}
                  <div className="p-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-black/20 text-xs text-white/60">
                    <div>
                      Showing <span className="font-bold text-white">{(receiptPage - 1) * RECEIPTS_PER_PAGE + 1}</span> to <span className="font-bold text-white">{Math.min(receiptPage * RECEIPTS_PER_PAGE, filteredReceipts.length)}</span> of <span className="font-bold text-white">{filteredReceipts.length}</span> receipts
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={receiptPage === 1}
                        onClick={() => setReceiptPage(p => Math.max(1, p - 1))}
                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <ChevronLeft size={14} /> Previous
                      </button>
                      <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-white font-mono font-bold">
                        Page {receiptPage} of {totalReceiptPages}
                      </div>
                      <button
                        disabled={receiptPage >= totalReceiptPages}
                        onClick={() => setReceiptPage(p => Math.min(totalReceiptPages, p + 1))}
                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        Next <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Screen Preview Modal / Overlay when customer wants to review details */}
      <AnimatePresence>
        {activeReceiptPreview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm no-print" onClick={() => setActiveReceiptPreview(null)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-gk-black border border-white/10 rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col gap-6 shadow-[0_0_50px_rgba(59,130,246,0.15)] animate-none" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <div>
                  <h3 className="text-lg font-bold text-white">Receipt Details</h3>
                  <p className="text-xs text-white/50 mt-1 font-mono">Reference: {activeReceiptPreview.receiptNumber}</p>
                </div>
                <button onClick={() => setActiveReceiptPreview(null)} className="text-white/50 hover:text-white cursor-pointer"><X size={20} /></button>
              </div>

              {/* Receipt Body in screen view - 100% 1:1 WYSIWYG match with print layout */}
              <div className="bg-white text-black p-8 rounded-xl shadow-inner font-sans relative overflow-hidden flex flex-col justify-between" style={{ color: '#000000', backgroundColor: '#ffffff', minHeight: '620px' }}>
                {/* Faint Premium Brand Watermark */}
                <div className="absolute pointer-events-none select-none z-0 text-center" style={{
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%) rotate(-25deg)',
                  fontSize: '70px',
                  fontWeight: '900',
                  letterSpacing: '0.25em',
                  color: 'rgba(43, 149, 201, 0.085)',
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
                        <h1 className="text-3xl font-black leading-tight tracking-tight" style={{ fontSize: '28px', fontWeight: '900', fontFamily: 'system-ui, sans-serif', color: '#000000', margin: 0 }}>{activeReceiptPreview.companyName || 'Garage Kings India'}</h1>
                        <p className="text-gray-600 text-sm" style={{ fontSize: '14px', margin: '6px 0 0 0', color: '#4b5563' }}>{activeReceiptPreview.companyLocation || 'Delhi'}</p>
                      </div>
                      <div className="text-right">
                        <h2 className="text-3xl font-black text-gray-800 tracking-tight leading-none mb-1" style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 4px 0', color: '#1f2937' }}>Receipt</h2>
                        <p className="text-sm text-gray-600 font-semibold" style={{ fontSize: '12px', margin: 0, color: '#4b5563' }}>Receipt # &nbsp;{activeReceiptPreview.receiptNumber}</p>
                        <p className="text-xs text-gray-500 font-medium mt-1" style={{ fontSize: '11px', margin: '4px 0 0 0', color: '#6b7280' }}>Date &nbsp;{activeReceiptPreview.dateString}</p>
                      </div>
                    </div>

                    {/* "To" Section */}
                    <div className="mb-8" style={{ marginTop: '30px', marginBottom: '30px' }}>
                      <div className="bg-[#2b95c9] text-white px-4 py-1.5 font-bold text-xs tracking-wider mb-3 rounded-sm" style={{ fontSize: '12px', fontWeight: 'bold', backgroundColor: '#2b95c9', color: '#ffffff', padding: '6px 12px', letterSpacing: '0.05em' }}>To</div>
                      <div className="px-1 space-y-1 text-gray-800 text-xs leading-relaxed" style={{ fontSize: '11px', color: '#1f2937', paddingLeft: '4px' }}>
                        <div className="font-bold text-black text-sm" style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 2px 0', color: '#000000' }}>{activeReceiptPreview.customerName}</div>
                        {activeReceiptPreview.customerPhone && <div className="font-semibold" style={{ fontWeight: '600' }}>{activeReceiptPreview.customerPhone}</div>}
                        {activeReceiptPreview.customerEmail && <div className="font-medium text-gray-600" style={{ fontWeight: '500', color: '#4b5563' }}>{activeReceiptPreview.customerEmail}</div>}
                        {activeReceiptPreview.customerInsta && <div className="font-medium text-blue-600" style={{ fontWeight: '500', color: '#2563eb' }}>{activeReceiptPreview.customerInsta.startsWith('@') ? activeReceiptPreview.customerInsta : `@${activeReceiptPreview.customerInsta}`}</div>}
                        {activeReceiptPreview.customerAddress && <div className="whitespace-pre-line text-gray-600 mt-1" style={{ lineHeight: '1.5', color: '#4b5563' }}>{activeReceiptPreview.customerAddress}</div>}
                      </div>
                    </div>

                    {/* Table Section */}
                    <div className="mb-8" style={{ marginTop: '35px', marginBottom: '35px' }}>
                      <div className="bg-[#2b95c9] text-white grid grid-cols-12 gap-2 px-4 py-2 font-bold text-xs tracking-wider rounded-sm" style={{ fontSize: '12px', fontWeight: 'bold', backgroundColor: '#2b95c9', color: '#ffffff', padding: '8px 16px', letterSpacing: '0.05em' }}>
                        <div className="col-span-2 text-center">Qty</div>
                        <div className="col-span-7">Description</div>
                        <div className="col-span-3 text-right">Amount</div>
                      </div>
                      
                      <div className="divide-y divide-gray-150 px-1" style={{ borderBottom: '1px solid #e5e7eb', paddingLeft: '4px', paddingRight: '4px' }}>
                        {activeReceiptPreview.items?.map((it, idx) => (
                          <div key={idx} className="grid grid-cols-12 gap-2 py-3 text-xs" style={{ borderTop: idx > 0 ? '1px solid #f3f4f6' : 'none', padding: '12px 0' }}>
                            <div className="col-span-2 text-center text-gray-600" style={{ color: '#4b5563' }}>{it.qty}</div>
                            <div className="col-span-7 font-medium text-gray-800" style={{ color: '#1f2937' }}>{it.description}</div>
                            <div className="col-span-3 text-right font-mono font-semibold text-gray-900" style={{ fontFamily: 'monospace', fontWeight: '600', color: '#111827' }}>₹{Number(it.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          </div>
                        ))}
                        
                        {activeReceiptPreview.includeShipping && (
                          <div className="grid grid-cols-12 gap-2 py-3 text-xs" style={{ borderTop: '1px solid #f3f4f6', padding: '12px 0' }}>
                            <div className="col-span-2 text-center text-gray-600" style={{ color: '#4b5563' }}>1</div>
                            <div className="col-span-7 font-medium text-gray-800" style={{ color: '#1f2937' }}>Shipping Charges</div>
                            <div className="col-span-3 text-right font-mono font-semibold text-gray-900" style={{ fontFamily: 'monospace', fontWeight: '600', color: '#111827' }}>₹{Number(activeReceiptPreview.shippingCharges).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Totals Section */}
                  <div style={{ marginTop: '40px' }}>
                    <div className="pt-4 space-y-2 text-right flex flex-col items-end" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingTop: '16px' }}>
                      <div className="flex justify-between items-center text-xs text-gray-600 w-80" style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', width: '340px', color: '#4b5563' }}>
                        <span>Including Tax ({activeReceiptPreview.taxPercent}%)</span>
                        <span className="font-mono font-semibold" style={{ fontFamily: 'monospace', fontWeight: '600' }}>₹{Number(activeReceiptPreview.taxAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-black text-black pt-2 w-80" style={{ borderTop: '1px solid #d1d5db', marginTop: '6px', fontSize: '14px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', width: '340px', color: '#000000', paddingTop: '8px' }}>
                        <span>Total Paid</span>
                        <span className="font-mono font-black text-xl" style={{ fontSize: '18px', fontWeight: '900', fontFamily: 'monospace' }}>₹{Number(activeReceiptPreview.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      {activeReceiptPreview.formatType === 'prebooking' && activeReceiptPreview.pendingBalance && Number(activeReceiptPreview.pendingBalance) > 0 && (
                        <div className="flex justify-between items-start text-xs text-red-600 font-bold pt-2 w-80 gap-3" style={{ borderTop: '1px dashed #d1d5db', marginTop: '6px', fontSize: '11px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '340px', color: '#dc2626', paddingTop: '6px' }}>
                          <div style={{ textAlign: 'left' }}>
                            <div>Balance Due before Delivery</div>
                            <div style={{ fontSize: '9.5px', color: '#dc2626', fontWeight: '500', marginTop: '1px' }}>(Excluding shipping)</div>
                          </div>
                          <span className="font-mono font-bold" style={{ fontFamily: 'monospace', fontWeight: 'bold', whiteSpace: 'nowrap', textAlign: 'right', flexShrink: 0 }}>₹{Number(activeReceiptPreview.pendingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer refund policy statement */}
                    {activeReceiptPreview.footerNote && (
                      <div className="text-center text-xs text-gray-800 font-medium leading-normal px-4" style={{ marginTop: '60px', fontSize: '11.5px', textAlign: 'center', color: '#374151', paddingLeft: '16px', paddingRight: '16px', lineHeight: '1.6' }}>
                        {activeReceiptPreview.footerNote}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setActiveReceiptPreview(null)} className="px-6 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold transition-colors text-sm cursor-pointer">Close</button>
                <button onClick={() => { window.print(); setActiveReceiptPreview(null); }} className="px-6 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-650 text-white font-bold flex items-center gap-2 transition-colors text-sm cursor-pointer">
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                  Print / Save PDF
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🧾 ACTUAL PRINTABLE DOM ELEMENT (For media print - hidden on screen) */}
      {activeReceiptPreview && createPortal(
        <div className="printable-receipt-wrapper hidden print:block bg-white text-black p-8 font-sans relative overflow-hidden" style={{ color: '#000000', backgroundColor: '#ffffff', minHeight: '297mm', width: '210mm' }}>
          {/* Faint Premium Brand Watermark */}
          <div className="absolute pointer-events-none select-none z-0 text-center" style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-25deg)',
            fontSize: '70px',
            fontWeight: '900',
            letterSpacing: '0.25em',
            color: 'rgba(43, 149, 201, 0.085)', // Solid light brand-tinted color for guaranteed print rendering without background-graphics enabled!
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
              {activeReceiptPreview.customerEmail && <div className="font-medium text-gray-600" style={{ fontWeight: '500', color: '#4b5563' }}>{activeReceiptPreview.customerEmail}</div>}
              {activeReceiptPreview.customerInsta && <div className="font-medium text-blue-600" style={{ fontWeight: '500', color: '#2563eb' }}>{activeReceiptPreview.customerInsta.startsWith('@') ? activeReceiptPreview.customerInsta : `@${activeReceiptPreview.customerInsta}`}</div>}
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
              <div className="flex justify-between items-center text-xs text-gray-600 w-80" style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', width: '340px', color: '#4b5563' }}>
                <span>Including Tax ({activeReceiptPreview.taxPercent}%)</span>
                <span className="font-mono font-semibold" style={{ fontFamily: 'monospace', fontWeight: '600' }}>₹{Number(activeReceiptPreview.taxAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-black text-black pt-2 w-80" style={{ borderTop: '1px solid #d1d5db', marginTop: '6px', fontSize: '14px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', width: '340px', color: '#000000', paddingTop: '8px' }}>
                <span>Total Paid</span>
                <span className="font-mono font-black text-xl" style={{ fontSize: '18px', fontWeight: '900', fontFamily: 'monospace' }}>₹{Number(activeReceiptPreview.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {activeReceiptPreview.formatType === 'prebooking' && activeReceiptPreview.pendingBalance && Number(activeReceiptPreview.pendingBalance) > 0 && (
                <div className="flex justify-between items-start text-xs text-red-600 font-bold pt-2 w-80 gap-3" style={{ borderTop: '1px dashed #d1d5db', marginTop: '6px', fontSize: '11px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '340px', color: '#dc2626', paddingTop: '6px' }}>
                  <div style={{ textAlign: 'left' }}>
                    <div>Balance Due before Delivery</div>
                    <div style={{ fontSize: '9.5px', color: '#dc2626', fontWeight: '500', marginTop: '1px' }}>(Excluding shipping)</div>
                  </div>
                  <span className="font-mono font-bold" style={{ fontFamily: 'monospace', fontWeight: 'bold', whiteSpace: 'nowrap', textAlign: 'right', flexShrink: 0 }}>₹{Number(activeReceiptPreview.pendingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
      </div>,
      document.body
    )}

      {/* Excel Export Filtered Modal */}
      <AnimatePresence>
        {isExcelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setIsExcelModalOpen(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111116] border border-emerald-500/30 rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-[0_0_50px_rgba(16,185,129,0.15)] text-white space-y-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                    <FileSpreadsheet size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Export Receipts to Excel</h3>
                    <p className="text-xs text-white/50">Generate a custom multi-sheet .xlsx workbook with group-by tabs</p>
                  </div>
                </div>
                <button onClick={() => setIsExcelModalOpen(false)} className="text-white/40 hover:text-white cursor-pointer"><X size={20} /></button>
              </div>

              <div className="space-y-4">
                {/* Group By Selector */}
                <div>
                  <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Filter size={14} /> Group By (Creates Individual Excel Tabs)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setExcelGroupBy('format')}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                        excelGroupBy === 'format' 
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      🏷️ By Format
                      <span className="block text-[10px] font-normal opacity-60 mt-0.5">(Standard vs PO)</span>
                    </button>
                    <button
                      onClick={() => setExcelGroupBy('month')}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                        excelGroupBy === 'month' 
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      📅 By Month
                      <span className="block text-[10px] font-normal opacity-60 mt-0.5">(Aug 2026, Jul...)</span>
                    </button>
                    <button
                      onClick={() => setExcelGroupBy('none')}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                        excelGroupBy === 'none' 
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      📋 Single Sheet
                      <span className="block text-[10px] font-normal opacity-60 mt-0.5">(Flat list)</span>
                    </button>
                  </div>
                </div>

                {/* Filter by Format Type */}
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Filter Format Type</label>
                  <select 
                    value={excelFilterType} 
                    onChange={e => setExcelFilterType(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="all">All Formats (Standard Sales + Prebooking PO + Auctions)</option>
                    <option value="standard">Standard Sales Only</option>
                    <option value="prebooking">Prebooking / PO Only</option>
                    <option value="auction">Auction Wins Only</option>
                  </select>
                </div>

                {/* Search Filter Scope */}
                {receiptSearch && (
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                    <div className="text-xs text-white/70">
                      Include only search results matching <span className="text-emerald-300 font-mono font-bold">&quot;{receiptSearch}&quot;</span>?
                    </div>
                    <input 
                      type="checkbox" 
                      checked={excelSearchOnly} 
                      onChange={e => setExcelSearchOnly(e.target.checked)} 
                      className="w-4 h-4 accent-emerald-500 cursor-pointer" 
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsExcelModalOpen(false)}
                  className="w-1/3 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    exportReceiptsToExcel(receipts, excelGroupBy, excelFilterType, excelSearchOnly, receiptSearch);
                    setIsExcelModalOpen(false);
                  }}
                  className="w-2/3 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <FileSpreadsheet size={16} /> Download Excel Workbook (.xlsx)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
