import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { SmoothScrollProvider } from './providers/SmoothScroll'
import Home from './pages/Home'
import Admin from './pages/Admin'
import Marketplace from './pages/Marketplace'
import { getGlobalSettings } from './lib/db'

export default function App() {
  const [adminPath, setAdminPath] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPath = async () => {
      try {
        const settings = await getGlobalSettings()
        setAdminPath(settings?.adminPath || '9f7a4b2c-8d1e-45a9-b3f6-c1d2e8a7b9f0')
      } catch (err) {
        console.error("Failed to fetch admin path:", err)
        setAdminPath('9f7a4b2c-8d1e-45a9-b3f6-c1d2e8a7b9f0')
      } finally {
        setIsLoading(false)
      }
    }
    fetchPath()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-[100svh] bg-gk-black flex flex-col items-center justify-center gap-6">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full blur-xl bg-gk-yellow/20 animate-pulse"></div>
          <div className="w-12 h-12 rounded-full border-4 border-white/5 border-t-gk-yellow animate-spin relative z-10"></div>
        </div>
        <div className="text-gk-yellow text-xs font-bold tracking-[0.3em] uppercase animate-pulse">Garage Kings</div>
      </div>
    )
  }

  return (
    <Router>
      <SmoothScrollProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path={`/${adminPath}/admin`} element={<Admin />} />
          <Route path="/marketplace" element={<Marketplace />} />
        </Routes>
      </SmoothScrollProvider>
    </Router>
  )
}
