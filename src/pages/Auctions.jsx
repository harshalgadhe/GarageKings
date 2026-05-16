import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getAuctions, isFirebaseConfigured, addAuctionBid, listenToAuctionTopBid, listenToAuctionBidCount, listenToAuctionRecentBids } from '../lib/db'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Gavel, TrendingUp, Users, Clock, X, Trophy, AlertCircle, ChevronRight } from 'lucide-react'
import { BRAND } from '../data/content'

// ── Countdown Hook ─────────────────────────────────────────────────
function useCountdown(endDate, endTime) {
  const [ms, setMs] = useState(0)
  useEffect(() => {
    if (!endDate || !endTime) return
    const calc = () => {
      const target = new Date(`${endDate}T${endTime}:00+05:30`)
      setMs(Math.max(0, target - Date.now()))
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [endDate, endTime])
  const s = Math.floor(ms / 1000)
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    mins: Math.floor((s % 3600) / 60),
    secs: s % 60,
    ended: ms === 0,
    upcoming: ms > 7 * 86400 * 1000,
  }
}

function pad(n) { return String(n).padStart(2, '0') }

// ── Live Data Hook ────────────────────────────────────────────────
function useAuctionLive(id) {
  const [topBid, setTopBid] = useState(null)
  const [bidCount, setBidCount] = useState(0)
  const [recentBids, setRecentBids] = useState([])
  useEffect(() => {
    const u1 = listenToAuctionTopBid(id, setTopBid)
    const u2 = listenToAuctionBidCount(id, setBidCount)
    const u3 = listenToAuctionRecentBids(id, setRecentBids, 5)
    return () => { u1(); u2(); u3() }
  }, [id])
  return { topBid, bidCount, recentBids }
}

// ── Bid Modal ─────────────────────────────────────────────────────
function BidModal({ auction, topBid, onClose }) {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const cur = auction.currency || '₹'
  const inc = Number(auction.minBidIncrement) || 1
  const minBid = topBid ? topBid.amount + inc : Number(auction.startingPrice)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (Number(amount) < minBid) { alert(`Minimum bid is ${cur}${minBid.toLocaleString()}`); return }
    setSubmitting(true)
    try {
      await addAuctionBid(auction.id, { bidderName: name.trim(), contact: contact.trim(), amount: Number(amount) })
      setSuccess(true)
      setTimeout(onClose, 2400)
    } catch (err) {
      alert('Failed: ' + err.message)
      setSubmitting(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}>
      <motion.div initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        className="w-full sm:max-w-md bg-[#0c0c0f] border border-purple-500/40 rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-[0_-20px_80px_rgba(168,85,247,0.3)]"
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-white/10 mx-auto mb-6 sm:hidden" />
        {success ? (
          <div className="text-center py-10">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15 }} className="text-6xl mb-4">🏆</motion.div>
            <h3 className="text-2xl font-black text-white mb-2">Bid Placed!</h3>
            <p className="text-white/50 text-sm">You're the highest bidder. We'll contact you if you win!</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1"><Gavel size={13} className="text-purple-400" /><span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Place Bid</span></div>
                <h3 className="text-lg font-black text-white leading-tight pr-4">{auction.title}</h3>
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white transition-colors shrink-0"><X size={16} /></button>
            </div>

            <div className="mb-5 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
              <div className="text-[10px] uppercase tracking-wider text-purple-400 font-bold mb-1">{topBid ? 'Current Highest' : 'Starting Price'}</div>
              <div className="font-mono text-3xl font-black text-white">{cur}{(topBid?.amount ?? Number(auction.startingPrice)).toLocaleString()}</div>
              {topBid && <div className="text-xs text-white/40 mt-1">by {topBid.bidderName}</div>}
              <div className="mt-3 pt-3 border-t border-purple-500/10 flex items-center justify-between text-xs">
                <span className="text-white/40">Min increment</span>
                <span className="text-purple-300 font-bold">{cur}{inc.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-white/40">Your min bid</span>
                <span className="text-white font-black">{cur}{minBid.toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-purple-500 transition-colors text-sm" />
              <input required type="text" value={contact} onChange={e => setContact(e.target.value)} placeholder="Phone / Instagram Handle"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-purple-500 transition-colors text-sm" />
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 text-sm font-bold">{cur}</span>
                <input required type="number" min={minBid} step={inc} value={amount} onChange={e => setAmount(e.target.value)} placeholder={minBid.toString()}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-purple-500 transition-colors text-sm" />
              </div>
              <button type="submit" disabled={submitting}
                className="w-full py-4 rounded-xl bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-white font-black text-sm uppercase tracking-wider transition-all hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] active:scale-[0.98]">
                {submitting ? 'Submitting…' : `Confirm Bid — ${cur}${amount ? Number(amount).toLocaleString() : minBid.toLocaleString()}`}
              </button>
              <p className="text-[10px] text-white/25 text-center">By bidding you agree to be contacted by {BRAND.name} if you win.</p>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

// ── Countdown Block ───────────────────────────────────────────────
function CountdownBlock({ label, value }) {
  return (
    <div className="flex flex-col items-center bg-white/5 rounded-xl px-3 py-2 min-w-[52px]">
      <span className="font-mono text-xl font-black text-white tabular-nums">{pad(value)}</span>
      <span className="text-[9px] uppercase tracking-widest text-white/30 font-semibold mt-0.5">{label}</span>
    </div>
  )
}

// ── Auction Card ──────────────────────────────────────────────────
function AuctionCard({ auction, onBid, featured }) {
  const { topBid, bidCount, recentBids } = useAuctionLive(auction.id)
  const timer = useCountdown(auction.endDate, auction.endTime)
  const cur = auction.currency || '₹'
  const inc = Number(auction.minBidIncrement) || 1
  const currentBid = topBid ? topBid.amount : Number(auction.startingPrice)
  const minNext = currentBid + (topBid ? inc : 0)
  const status = timer.ended ? 'ended' : 'live'

  return (
    <div className={`flex flex-col rounded-3xl overflow-hidden border transition-all duration-500 group ${
      featured ? 'border-purple-500/40 shadow-[0_0_60px_rgba(168,85,247,0.15)]' : 'border-white/8 hover:border-purple-500/30 hover:shadow-[0_0_40px_rgba(168,85,247,0.1)]'
    } bg-[#0e0e11]`}>

      {/* Image */}
      <div className={`relative overflow-hidden ${featured ? 'aspect-video' : 'aspect-[4/3]'}`} onContextMenu={e => e.preventDefault()}>
        <div className="absolute inset-0 z-10" />
        <img src={auction.image || '/vault-1.png'} alt={auction.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none select-none"
          style={{ WebkitUserDrag: 'none' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e11] via-[#0e0e11]/20 to-transparent z-10" />

        {/* Status pill */}
        <div className={`absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md border ${
          status === 'ended' ? 'bg-black/60 border-white/10 text-white/40' : 'bg-black/60 border-purple-500/40 text-purple-300'
        }`}>
          {status !== 'ended' && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />}
          {status === 'ended' ? 'Ended' : 'Live'}
        </div>

        {featured && <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-gk-yellow text-black text-[10px] font-black uppercase tracking-widest"><Trophy size={10} />Featured</div>}

        {/* Bid count chip on image */}
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10">
          <Users size={11} className="text-white/60" />
          <span className="text-xs font-bold text-white">{bidCount} {bidCount === 1 ? 'bid' : 'bids'}</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col grow p-5 gap-4">
        {(auction.brand || auction.carBrand) && (
          <div className="text-[10px] font-black uppercase tracking-widest text-gk-orange">
            {auction.carBrand ? `${auction.brand} • ${auction.carBrand}` : auction.brand}
          </div>
        )}
        <div>
          <h3 className={`font-black text-white leading-tight ${featured ? 'text-2xl md:text-3xl' : 'text-xl'}`}>{auction.title}</h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {auction.grade && <span className="text-[10px] text-white/40 font-semibold uppercase">{auction.grade}</span>}
            {auction.scale && <span className="text-[10px] bg-white/5 text-white/30 px-2 py-0.5 rounded font-bold">{auction.scale}</span>}
          </div>
        </div>

        {/* Countdown Timer */}
        {!timer.ended ? (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Clock size={11} className="text-gk-yellow" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gk-yellow">Ends in</span>
            </div>
            <div className="flex gap-2">
              <CountdownBlock label="Days" value={timer.days} />
              <CountdownBlock label="Hours" value={timer.hours} />
              <CountdownBlock label="Mins" value={timer.mins} />
              <CountdownBlock label="Secs" value={timer.secs} />
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] text-white/25 font-medium">
                {new Date(`${auction.endDate}T${auction.endTime}:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                {' · '}
                {new Date(`${auction.endDate}T${auction.endTime}:00+05:30`).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} IST
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="text-xs font-bold text-white/30 uppercase tracking-widest">Auction Closed</div>
            <div className="text-[10px] text-white/20">
              {new Date(`${auction.endDate}T${auction.endTime}:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        )}

        {/* Current Bid Panel */}
        <div className="rounded-2xl bg-purple-500/8 border border-purple-500/15 p-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-purple-400 font-bold mb-1">
                {topBid ? 'Highest Bid' : 'Starting Price'}
              </div>
              <div className="font-mono text-2xl font-black text-white">{cur}{currentBid.toLocaleString()}</div>
              {topBid && <div className="text-[11px] text-white/40 mt-1">by {topBid.bidderName}</div>}
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-white/30 font-bold mb-1">Min next bid</div>
              <div className="font-mono text-lg font-black text-purple-300">{cur}{minNext.toLocaleString()}</div>
              <div className="text-[10px] text-white/25 mt-0.5">+{cur}{inc.toLocaleString()} increment</div>
            </div>
          </div>

          {/* Recent bids mini-list */}
          {recentBids.length > 1 && (
            <div className="mt-3 pt-3 border-t border-purple-500/10 space-y-1.5">
              {recentBids.slice(1, 4).map((bid, i) => (
                <div key={bid.id} className="flex justify-between items-center text-[10px]">
                  <span className="text-white/30 flex items-center gap-1.5"><span className="text-white/15">#{i + 2}</span> {bid.bidderName}</span>
                  <span className="text-white/35 font-mono">{cur}{bid.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        {timer.ended ? (
          topBid ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gk-yellow/10 border border-gk-yellow/20">
              <Trophy size={16} className="text-gk-yellow shrink-0" />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-gk-yellow font-bold">Winner</div>
                <div className="text-sm font-black text-white">{topBid.bidderName} — {cur}{topBid.amount.toLocaleString()}</div>
              </div>
            </div>
          ) : (
            <div className="text-center text-xs text-white/25 py-2">No bids were placed</div>
          )
        ) : (
          <button
            onClick={() => onBid(auction, topBid)}
            className="w-full py-3.5 rounded-2xl bg-purple-500 hover:bg-purple-400 text-white font-black text-sm uppercase tracking-wider transition-all hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Gavel size={15} />
            Place a Bid
          </button>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────
const TABS = ['live', 'ended']

export default function Auctions() {
  const [auctions, setAuctions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('live')
  const [bidModal, setBidModal] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isFirebaseConfigured) { setError('Firebase not configured.'); setIsLoading(false); return }
    getAuctions().then(setAuctions).catch(e => setError(e.message)).finally(() => setIsLoading(false))
  }, [])

  const getStatus = (a) => {
    const target = new Date(`${a.endDate}T${a.endTime}:00+05:30`)
    return target > new Date() ? 'live' : 'ended'
  }

  const filtered = auctions.filter(a => getStatus(a) === tab)
  const featured = filtered[0]
  const rest = filtered.slice(1)

  return (
    <div className="min-h-[100svh] bg-gk-black text-white selection:bg-purple-500">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gk-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
            <ArrowLeft size={18} /><span className="text-sm font-bold uppercase tracking-wider">Back</span>
          </button>
          <div className="flex items-center gap-3">
            <img src="/brand-logo.png" alt="Logo" className="w-8 h-8 rounded-full border border-purple-500/40" />
            <span className="font-black tracking-tight">{BRAND.name}</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden py-20 md:py-28 border-b border-white/5">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-purple-600/15 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-purple-400/8 blur-[80px] pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-black uppercase tracking-widest mb-6">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />Live Auctions
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tighter mb-4">
            Bid on <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-200">Grails.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-base md:text-lg text-white/50 max-w-xl mx-auto">
            Real-time competitive bidding. Each bid must beat the previous by the stated increment. Winner gets contacted directly.
          </motion.p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 pt-10">
        <div className="flex gap-2 border-b border-white/8 pb-0">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-black uppercase tracking-wider rounded-t-xl transition-colors ${
                tab === t ? 'bg-purple-500/15 border border-purple-500/30 border-b-0 text-purple-300' : 'text-white/30 hover:text-white/60'
              }`}>
              {t}
              <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${tab === t ? 'bg-purple-500/30 text-purple-200' : 'bg-white/5 text-white/20'}`}>
                {auctions.filter(a => getStatus(a) === t).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12 pb-24">
        {error ? (
          <div className="flex flex-col items-center gap-3 py-32 text-center">
            <AlertCircle size={36} className="text-red-400" /><p className="text-white/50">{error}</p>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center gap-4 py-32">
            <div className="w-12 h-12 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
            <p className="text-xs font-black uppercase tracking-widest text-purple-400 animate-pulse">Loading Auctions…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-32 text-center">
            <Gavel size={48} className="text-white/10" />
            <h3 className="text-2xl font-black text-white/20">No {tab === 'live' ? 'Active' : 'Past'} Auctions</h3>
            <p className="text-white/25 text-sm">{tab === 'live' ? 'Check back soon — new auctions drop regularly.' : 'Completed auctions will appear here.'}</p>
          </div>
        ) : (
          <>
            {featured && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-5">
                  <Trophy size={14} className="text-gk-yellow" />
                  <span className="text-xs font-black uppercase tracking-widest text-gk-yellow">Featured Auction</span>
                </div>
                <AuctionCard auction={featured} onBid={(a, tb) => setBidModal({ auction: a, topBid: tb })} featured />
              </div>
            )}
            {rest.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-5 mt-8">
                  <Gavel size={14} className="text-purple-400" />
                  <span className="text-xs font-black uppercase tracking-widest text-purple-400">All Auctions</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rest.map(a => <AuctionCard key={a.id} auction={a} onBid={(a, tb) => setBidModal({ auction: a, topBid: tb })} featured={false} />)}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {bidModal && <BidModal auction={bidModal.auction} topBid={bidModal.topBid} onClose={() => setBidModal(null)} />}
      </AnimatePresence>
    </div>
  )
}
