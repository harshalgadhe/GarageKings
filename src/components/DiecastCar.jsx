/** Die-cast silhouette — brand red / white / chrome */
export default function DiecastCar({ className = '' }) {
  return (
    <svg
      viewBox="0 0 240 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f5f5f5" />
          <stop offset="45%" stopColor="#d4d4d4" />
          <stop offset="100%" stopColor="#a3a3a3" />
        </linearGradient>
        <linearGradient id="stripeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E10600" />
          <stop offset="100%" stopColor="#9b0000" />
        </linearGradient>
        <filter id="carShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="8" floodOpacity="0.55" />
        </filter>
      </defs>
      <ellipse cx="120" cy="68" rx="88" ry="7" fill="#000" opacity="0.5" />
      <g filter="url(#carShadow)">
        <path
          d="M28 48 L42 32 L78 26 L162 24 L198 30 L212 42 L218 48 L28 48Z"
          fill="url(#bodyGrad)"
        />
        <path d="M48 30 L92 26 L148 26 L188 32 L176 40 L64 40 Z" fill="#1a1a1a" opacity="0.85" />
        <path d="M52 32 L88 28 L152 26 L178 30 L168 38 L72 40 L52 32Z" fill="#2a3a4a" opacity="0.9" />
        <path d="M70 28 L170 26 L165 34 L75 36 Z" fill="url(#stripeGrad)" />
        <path d="M38 48 L202 48 L198 52 L42 52 Z" fill="#111" />
        <text x="118" y="44" textAnchor="middle" fill="#E10600" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
          GK
        </text>
        <circle cx="62" cy="52" r="14" fill="#0a0a0a" stroke="#333" strokeWidth="2" />
        <circle cx="62" cy="52" r="8" fill="#1a1a1a" />
        <circle cx="62" cy="52" r="3" fill="#E10600" />
        <circle cx="178" cy="52" r="14" fill="#0a0a0a" stroke="#333" strokeWidth="2" />
        <circle cx="178" cy="52" r="8" fill="#1a1a1a" />
        <circle cx="178" cy="52" r="3" fill="#E10600" />
        <rect x="195" y="38" width="8" height="4" rx="1" fill="#E10600" />
      </g>
    </svg>
  )
}
