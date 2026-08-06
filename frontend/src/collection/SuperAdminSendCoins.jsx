import { useEffect, useRef, useState } from 'react'

const GOLD = '#BB8958'
const DARK = '#111817'
const MUTED = '#7A8987'
const RED = '#073B3F'
const COIN_RATE = 100

const MethodIcon = ({ type, size = 18 }) => {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (type === 'card') return (<svg {...common}><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>)
  if (type === 'upi') return (<svg {...common}><polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" /></svg>)
  if (type === 'netbanking') return (<svg {...common}><line x1="3" y1="22" x2="21" y2="22" /><line x1="6" y1="18" x2="6" y2="11" /><line x1="10" y1="18" x2="10" y2="11" /><line x1="14" y1="18" x2="14" y2="11" /><line x1="18" y1="18" x2="18" y2="11" /><polygon points="12 2 20 7 4 7" /></svg>)
  if (type === 'wallet') return (<svg {...common}><path d="M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2Z" /><path d="M2 9V6a2 2 0 0 1 2-2h13" /><circle cx="17" cy="13.5" r="1.5" /></svg>)
  if (type === 'commission') return (<svg {...common}><path d="M20.8 5.6a5.1 5.1 0 0 0-7.2 0L12 7.2l-1.6-1.6a5.1 5.1 0 0 0-7.2 7.2L12 21l8.8-8.2a5.1 5.1 0 0 0 0-7.2Z" /></svg>)
  if (type === 'admin') return (<svg {...common}><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4Z" /></svg>)
  return (<svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>)
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@400;500;600;700;800;900&display=swap');
  .sc-page{min-height:100vh;background:#FDFDFC;font-family:"Montserrat",system-ui,sans-serif;color:${DARK}}
  .sc-main{width:min(1300px,calc(100% - 48px));margin:0 auto;padding:36px 0 90px}
  .sc-kicker{margin:0 0 6px;color:${GOLD};font-size:12px;font-weight:900;letter-spacing:2.4px;text-transform:uppercase}
  .sc-title{margin:0 0 8px;color:${RED};font-family:"Playfair Display",serif;font-size:clamp(26px,4vw,34px)}
  .sc-note{color:${MUTED};font-size:12.5px;margin:0 0 24px;max-width:760px;line-height:1.6}
  .sc-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px}
  .sc-card{border:1px solid rgba(189,207,206,.8);border-radius:14px;background:#fff;padding:24px;box-shadow:0 18px 46px rgba(12,64,68,.06)}
  .sc-label{font-size:11px;font-weight:900;letter-spacing:.6px;text-transform:uppercase;color:${MUTED};margin-bottom:8px;display:block}
  .sc-input{width:100%;padding:14px 16px;border:1px solid #D1DFDE;border-radius:8px;font-size:15px;font-weight:700;color:${DARK};box-sizing:border-box}
  .sc-input:focus{outline:none;border-color:${RED}}
  .sc-status{font-size:12px;font-weight:700;margin-top:8px}
  .sc-status.searching{color:${MUTED}}
  .sc-status.error{color:#e53e3e}
  .sc-user-card{margin-top:16px;padding:16px;border-radius:10px;background:rgba(22,163,74,.06);border:1px solid rgba(22,163,74,.25)}
  .sc-user-row{display:flex;justify-content:space-between;padding:5px 0;font-size:13px}
  .sc-user-row span:first-child{color:${MUTED};font-weight:700}
  .sc-user-row span:last-child{color:${DARK};font-weight:800;text-align:right}
  .sc-coin-preview{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-radius:8px;background:rgba(187,137,88,.1);border:1px dashed ${GOLD};margin:16px 0;font-size:14px;font-weight:800;color:#9F6130}
  .sc-send-btn{width:100%;min-height:52px;border:none;border-radius:999px;background:linear-gradient(135deg,${RED},#0C4044);color:#fff;font-weight:900;font-size:13px;letter-spacing:1px;text-transform:uppercase;cursor:pointer}
  .sc-send-btn:disabled{background:#BDCFCE;cursor:not-allowed}
  .sc-send-btn:not(:disabled):hover{transform:translateY(-2px);box-shadow:0 14px 30px rgba(7,59,63,.22)}
  .sc-banner{margin-bottom:18px;padding:13px 16px;border-radius:8px;font-size:13px;font-weight:700}
  .sc-banner.success{background:rgba(22,163,74,.1);color:#16a34a;border:1px solid rgba(22,163,74,.3)}
  .sc-banner.error{background:rgba(229,62,62,.1);color:#e53e3e;border:1px solid rgba(229,62,62,.3)}
  .sc-section-title{margin:0 0 16px;font-size:14px;font-weight:900;color:${RED}}
  .sc-history-row{display:flex;align-items:center;gap:14px;padding:13px 4px;border-bottom:1px solid rgba(189,207,206,.4)}
  .sc-history-row:last-child{border-bottom:none}
  .sc-history-icon{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff}
  .sc-history-body{flex:1;min-width:0}
  .sc-history-amount{font-size:13px;font-weight:800;color:${DARK}}
  .sc-history-coins{color:${GOLD};font-weight:900}
  .sc-history-date{color:${MUTED};font-size:11px;font-weight:600;margin-top:2px}
  .sc-history-source{color:${GOLD};font-size:11px;font-weight:700;margin-top:2px}
  .sc-method-tag{font-size:10px;font-weight:900;padding:4px 11px;border-radius:20px;text-transform:uppercase;white-space:nowrap}
  .sc-empty{color:${MUTED};font-size:13px;text-align:center;padding:20px 0}
  .sc-filter-tabs{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:16px}
  .sc-filter-tab{padding:8px 16px;border-radius:20px;border:1.5px solid #D1DFDE;background:#FDFDFC;color:${DARK};font-weight:800;font-size:12px;cursor:pointer}
  .sc-filter-tab.active{border-color:${RED};background:${RED};color:#fff}
  .sc-loadmore{width:100%;margin-top:14px;padding:12px;border-radius:8px;border:1.5px solid #D1DFDE;background:#FDFDFC;color:${RED};font-weight:800;font-size:13px;cursor:pointer}
  .sc-loadmore:hover{border-color:${RED};background:rgba(7,59,63,.04)}
  @media(max-width:900px){.sc-grid{grid-template-columns:1fr}}
`

const METHOD_COLORS = { card: '#2563eb', upi: '#9333ea', netbanking: '#ea580c', wallet: '#0d9488', commission: '#8b5cf6', admin: GOLD, purchase: '#c0392b', other: RED }
const METHOD_TAG_BG = { card: 'rgba(37,99,235,.12)', upi: 'rgba(147,51,234,.12)', netbanking: 'rgba(234,88,12,.12)', wallet: 'rgba(13,148,136,.12)', commission: 'rgba(139,92,246,.12)', admin: 'rgba(187,137,88,.15)', purchase: 'rgba(229,62,62,.1)', other: 'rgba(7,59,63,.08)' }

function HistoryRow({ h }) {
  const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const methodLabel = h.payment_method === 'admin' ? 'BBTEAM' : h.payment_method
  return (
    <div className="sc-history-row">
      <div className="sc-history-icon" style={{ background: METHOD_COLORS[h.payment_method] || RED }}>
        <MethodIcon type={h.payment_method} size={17} />
      </div>
      <div className="sc-history-body">
        <div className="sc-history-amount">
          {h.direction === 'debit' ? '−' : '+'}₹{h.amount_paid} <span style={{ color: MUTED, fontWeight: 700 }}>→</span>{' '}
          <span className="sc-history-coins">{h.direction === 'debit' ? '−' : ''}{h.coins_credited.toLocaleString('en-IN')} coins</span>
        </div>
        <div className="sc-history-date">{fmtDate(h.created_at)}</div>
        {h.type === 'commission' && <div className="sc-history-source">From {h.source} · Level {h.level} · {h.order_id}</div>}
        {h.type === 'debit' && <div className="sc-history-source">Used for order {h.order_id}</div>}
        {h.type === 'admin_credit' && <div className="sc-history-source">Sent by {h.source}</div>}
      </div>
      <span className="sc-method-tag" style={{ background: METHOD_TAG_BG[h.payment_method] || METHOD_TAG_BG.other, color: METHOD_COLORS[h.payment_method] || RED }}>
        {methodLabel}
      </span>
    </div>
  )
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'month', label: 'This Month' },
  { key: '6month', label: '6 Months' },
  { key: 'year', label: 'This Year' },
]

export default function SuperAdminSendCoins() {
  const [userId, setUserId] = useState('')
  const [amount, setAmount] = useState('')
  const [foundUser, setFoundUser] = useState(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [sending, setSending] = useState(false)
  const [banner, setBanner] = useState(null)
  const debounceRef = useRef(null)

  const [fullHistory, setFullHistory] = useState([])
  const [historyPage, setHistoryPage] = useState(1)
  const [hasMoreHistory, setHasMoreHistory] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    setFoundUser(null)
    setSearchError('')
    setFullHistory([])
    if (!userId.trim()) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const { default: api } = await import('../api')
        const res = await api.get(`/users/lookup/?id=${encodeURIComponent(userId.trim())}`)
        setFoundUser(res.data)
        fetchFullHistory(res.data.user_pk, 1, 'all')
      } catch (err) {
        setSearchError(err.response?.data?.error || 'No user found with this ID')
      } finally {
        setSearching(false)
      }
    }, 800)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [userId])

  const fetchFullHistory = async (userPk, page = 1, period = activeFilter) => {
    try {
      const { default: api } = await import('../api')
      const res = await api.get(`/admin/user-history/?user_pk=${userPk}&page=${page}&period=${period}`)
      setFullHistory(prev => page === 1 ? res.data.items : [...prev, ...res.data.items])
      setHasMoreHistory(res.data.has_more)
      setHistoryPage(page)
    } catch {
      // silent
    } finally {
      setLoadingMore(false)
    }
  }

  const handleFilterClick = key => {
    setActiveFilter(key)
    if (foundUser) fetchFullHistory(foundUser.user_pk, 1, key)
  }

  const loadMore = () => {
    if (!foundUser) return
    setLoadingMore(true)
    fetchFullHistory(foundUser.user_pk, historyPage + 1, activeFilter)
  }

  const coinsPreview = amount > 0 ? Math.floor(Number(amount) * COIN_RATE) : 0

  const handleSend = async () => {
    if (!foundUser || !amount || Number(amount) <= 0) return
    setSending(true)
    setBanner(null)
    try {
      const { default: api } = await import('../api')
      const res = await api.post('/admin/send-coins/', { user_pk: foundUser.user_pk, amount: Number(amount) })
      setBanner({ type: 'success', text: `${res.data.coins_sent.toLocaleString('en-IN')} coins sent to ${foundUser.name}!` })
      setAmount('')
      fetchFullHistory(foundUser.user_pk, 1, activeFilter)
      const { default: api2 } = await import('../api')
      const refreshed = await api2.get(`/users/lookup/?id=${encodeURIComponent(userId.trim())}`)
      setFoundUser(refreshed.data)
    } catch (err) {
      setBanner({ type: 'error', text: err.response?.data?.error || 'Unable to send coins. Please try again.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="sc-page">
      <style>{styles}</style>
      <main className="sc-main">
        <p className="sc-kicker">Super Admin</p>
        <h1 className="sc-title">Add AUG Coins</h1>
        <p className="sc-note">
          Manually credit AUG Coin to any customer, promotor, sub dealer, dealer, or admin.
          This does not trigger commission distribution — it's a direct grant.
        </p>

        {banner && <div className={`sc-banner ${banner.type}`}>{banner.text}</div>}

        <div className="sc-grid">
          <section className="sc-card">
            <label className="sc-label">User ID</label>
            <input
              className="sc-input"
              type="text"
              placeholder="e.g. BBCUS20260001"
              value={userId}
              onChange={e => setUserId(e.target.value)}
            />
            {searching && <div className="sc-status searching">Searching...</div>}
            {searchError && <div className="sc-status error">{searchError}</div>}

            {foundUser && (
              <div className="sc-user-card">
                <div className="sc-user-row"><span>Name</span><span>{foundUser.name}</span></div>
                <div className="sc-user-row"><span>Email</span><span>{foundUser.email}</span></div>
                <div className="sc-user-row"><span>Phone</span><span>{foundUser.phone}</span></div>
                <div className="sc-user-row"><span>Role</span><span>{foundUser.role}</span></div>
                <div className="sc-user-row"><span>Current Balance</span><span>{foundUser.balance_coins.toLocaleString('en-IN')} coins</span></div>
              </div>
            )}
          </section>

          <section className="sc-card">
            <label className="sc-label">Amount to Send (₹)</label>
            <input
              className="sc-input"
              type="number"
              min="1"
              placeholder="Enter amount"
              value={amount}
              disabled={!foundUser}
              onChange={e => setAmount(e.target.value)}
            />
            <div className="sc-coin-preview">
              <span>Coins to send</span>
              <span>{coinsPreview.toLocaleString('en-IN')} coins</span>
            </div>
            <button className="sc-send-btn" disabled={!foundUser || sending || !amount || Number(amount) <= 0} onClick={handleSend}>
              {sending ? 'Sending...' : 'Send AUG Coins'}
            </button>
          </section>
        </div>

        {foundUser && (
          <>
            <section className="sc-card" style={{ marginBottom: 20 }}>
              <h3 className="sc-section-title">Recent Recharges</h3>
              {(foundUser.recent_history || []).length === 0 ? (
                <div className="sc-empty">No transactions yet</div>
              ) : (
                foundUser.recent_history.map(h => <HistoryRow key={h.id} h={h} />)
              )}
            </section>

            <section className="sc-card">
              <h3 className="sc-section-title">Transaction History</h3>
              <div className="sc-filter-tabs">
                {FILTERS.map(f => (
                  <button
                    key={f.key}
                    type="button"
                    className={`sc-filter-tab ${activeFilter === f.key ? 'active' : ''}`}
                    onClick={() => handleFilterClick(f.key)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              {fullHistory.length === 0 ? (
                <div className="sc-empty">No transactions in this period</div>
              ) : (
                fullHistory.map(h => <HistoryRow key={h.id} h={h} />)
              )}
              {hasMoreHistory && (
                <button className="sc-loadmore" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}