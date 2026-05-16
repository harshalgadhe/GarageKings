import { useMemo, useRef, useState, useEffect } from 'react'
import { useActiveSection } from '../hooks/useScrollJourney'
import Navigation from '../components/Navigation'

import AmbientScene from '../components/AmbientScene'
import Hero from '../components/sections/Hero'
import GarageKingStandard from '../components/sections/GarageKingStandard'
import PitStopLanes from '../components/sections/PitStopLanes'
import VaultShowcase from '../components/sections/VaultShowcase'
import DropRitual from '../components/sections/DropRitual'
import { getCars } from '../lib/db'

export default function Home() {
  const heroRef = useRef(null)
  const standardRef = useRef(null)
  const lanesRef = useRef(null)
  const vaultRef = useRef(null)
  const dropRef = useRef(null)

  const [heroImages, setHeroImages] = useState([])
  const [carouselCars, setCarouselCars] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getCars()
        const activeHero = data.filter(c => c.isHero).map(c => c.image)
        const activeCarousel = data.filter(c => c.isCarousel)
        
        if (activeHero.length > 0) setHeroImages(activeHero)
        if (activeCarousel.length > 0) setCarouselCars(activeCarousel)
      } catch (e) {
        console.error("Failed to load homepage showcases", e)
      }
    }
    fetchData()
  }, [])

  const pitStopRefs = useMemo(
    () => [heroRef, standardRef, lanesRef, vaultRef, dropRef],
    [],
  )

  const activeSection = useActiveSection(pitStopRefs)

  return (
    <div className="relative bg-gk-black text-white">
      <AmbientScene />
      <Navigation activeSection={activeSection} />

      {/* Main content full width for centralized scrolling */}
      <main className="relative z-10 w-full">
        <Hero ref={heroRef} heroImages={heroImages} />
        <GarageKingStandard ref={standardRef} />
        <PitStopLanes ref={lanesRef} />
        <VaultShowcase ref={vaultRef} carouselCars={carouselCars} />
        <DropRitual ref={dropRef} />
      </main>
    </div>
  )
}
