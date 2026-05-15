import { useMemo, useRef } from 'react'
import { useActiveSection } from './hooks/useScrollJourney'
import { SmoothScrollProvider } from './providers/SmoothScroll'
import Navigation from './components/Navigation'
import PitLaneJourney from './components/PitLaneJourney'
import AmbientScene from './components/AmbientScene'
import Hero from './components/sections/Hero'
import GarageKingStandard from './components/sections/GarageKingStandard'
import PitStopLanes from './components/sections/PitStopLanes'
import VaultShowcase from './components/sections/VaultShowcase'
import DropRitual from './components/sections/DropRitual'

function GarageKingsApp() {
  const heroRef = useRef(null)
  const standardRef = useRef(null)
  const lanesRef = useRef(null)
  const vaultRef = useRef(null)
  const dropRef = useRef(null)

  const pitStopRefs = useMemo(
    () => [heroRef, standardRef, lanesRef, vaultRef, dropRef],
    [],
  )

  const activeSection = useActiveSection(pitStopRefs)

  return (
    <div className="relative bg-gk-black text-white">
      <AmbientScene />
      <Navigation activeSection={activeSection} />
      <PitLaneJourney />

      <main className="relative z-10">
        <Hero ref={heroRef} />
        <GarageKingStandard ref={standardRef} />
        <PitStopLanes ref={lanesRef} />
        <VaultShowcase ref={vaultRef} />
        <DropRitual ref={dropRef} />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <SmoothScrollProvider>
      <GarageKingsApp />
    </SmoothScrollProvider>
  )
}
