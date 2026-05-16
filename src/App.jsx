import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { SmoothScrollProvider } from './providers/SmoothScroll'
import Home from './pages/Home'
import Admin from './pages/Admin'
import Marketplace from './pages/Marketplace'

export default function App() {
  return (
    <Router>
      <SmoothScrollProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/9f7a4b2c-8d1e-45a9-b3f6-c1d2e8a7b9f0/admin" element={<Admin />} />
          <Route path="/marketplace" element={<Marketplace />} />
        </Routes>
      </SmoothScrollProvider>
    </Router>
  )
}
