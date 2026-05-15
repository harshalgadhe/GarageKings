export const BRAND = {
  name: 'Garage King',
  tagline: "India's Curated Die-cast Vault",
  pillars: 'Authenticated. Graded (by Condition). Delivered.',
}

export const WHATSAPP_URL =
  'https://wa.me/919000000000?text=Join%20Garage%20King%20WhatsApp%20Clubhouse'

/** Placeholder product shots — swap with your macro photography URLs */
const img = (label) =>
  `https://placehold.co/800x1000/141414/FFB800?text=${encodeURIComponent(label)}&font=space-grotesk`

export const vaultProducts = [
  {
    id: 'sth-2024',
    name: 'Super Treasure Hunt',
    lane: 'The Grail Room',
    grade: 'MIB · Short Card',
    price: '₹4,999',
    image: img('STH'),
  },
  {
    id: 'rlc-gt40',
    name: 'RLC Gulf GT40',
    lane: 'The Grail Room',
    grade: 'Blister Mint',
    price: '₹12,500',
    image: img('RLC'),
  },
  {
    id: 'jdm-r34',
    name: 'R34 Skyline',
    lane: 'JDM Legends',
    grade: 'MIB · Long Card',
    price: '₹1,899',
    image: img('R34'),
  },
  {
    id: 'premium-5',
    name: 'Real Riders 5-Pack',
    lane: 'The Premium Rack',
    grade: 'Sealed',
    price: '₹2,799',
    image: img('Premium'),
  },
]

export const standardPoints = [
  {
    title: 'Source Verification',
    body: 'Every piece is sourced from trusted global and local networks.',
  },
  {
    title: 'Condition Check',
    body: 'We inspect every card for soft corners, vein marks, or bubble cracks. You get exactly what you see.',
  },
  {
    title: 'Tamper Check',
    body: 'We ensure factory seals are intact so you never receive a "re-sealed" fake.',
  },
  {
    title: 'Double-Box Shipping',
    body: 'Indian couriers are rough. We ship every car in a protector or double-layered corrugated box to ensure it reaches you in "Mint" state.',
  },
]

export const pitStopLanes = [
  {
    id: 'jdm',
    title: 'JDM Legends',
    body: 'From R34s to Supras—the icons of Japanese car culture.',
  },
  {
    id: 'nostalgia',
    title: 'Nostalgia Lane',
    body: 'The classic Mainlines that defined your childhood.',
  },
  {
    id: 'premium',
    title: 'The Premium Rack',
    body: 'Metal/Metal bases and Real Riders for the serious shelf.',
  },
  {
    id: 'grail',
    title: 'The Grail Room',
    body: 'Rare RLC (Red Line Club) and Super Treasure Hunts (STH).',
  },
]

export const footerCopy = {
  transparency: 'Price Transparent. No "DM for Price" games here.',
  returns:
    "Damaged in transit? Send us an unboxing video, and we'll replace it or refund it. No questions asked.",
  socialProof: 'Serving 500+ collectors across India',
}
