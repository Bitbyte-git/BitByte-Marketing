import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { SkeletonText } from '../components/Skeleton'

// ── SVG ICONS for reward types ──
const IconSpark = ({ color = '#0C4044', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)
const IconCalendarCheck = ({ color = '#0C4044', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    <path d="M9 16l2 2 4-4" />
  </svg>
)
const IconMedal10 = ({ color = '#0C4044', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6" />
    <path d="M9 13.5L7 22l5-3 5 3-2-8.5" />
  </svg>
)
const IconMedal20 = ({ color = '#0C4044', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6" />
    <path d="M15 6.5l-4 4-2-2" />
    <path d="M9 13.5L7 22l5-3 5 3-2-8.5" />
  </svg>
)
const IconTrophy30 = ({ color = '#0C4044', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 21h8M12 17v4" />
    <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
    <path d="M17 5h2a2 2 0 0 1 2 2 4 4 0 0 1-4 4M7 5H5a2 2 0 0 0-2 2 4 4 0 0 0 4 4" />
  </svg>
)
const REWARD_ICONS = {
  first_login: IconSpark,
  daily_login: IconCalendarCheck,
  bonus_10: IconMedal10,
  bonus_20: IconMedal20,
  bonus_30: IconTrophy30,
}

export default function CoinsReward() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rangeFilter, setRangeFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/rewards/today/?range=${rangeFilter}`)
        setData(res.data)
        setError('')
      } catch (err) {
        setError('Failed to load rewards')
      }
      setLoading(false)
    }
    fetchData()
  }, [rangeFilter])

  // ── NEW: card click handler — same card mela rendaam thadava click pannaa, filter clear aagum ──
  const handleCardClick = (rewardType) => {
    setTypeFilter(prev => (prev === rewardType ? null : rewardType))
  }

  // ── NEW: typeFilter set aagirundhaa, andha reward_type mattum table-la kaatanum ──
  const displayedRewards = data
    ? (typeFilter ? data.rewards.filter(r => r.reward_type === typeFilter) : data.rewards)
    : []

  const formatDate = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  }

  return (
    <div className="rw-page">
      <style>{`
        .rw-page{min-height:100vh;background:linear-gradient(135deg,#FDFDFC 0%,#F3F3F0 48%,#E7EDEC 100%);color:#111817;font-family:"Manrope","Inter",system-ui,sans-serif;padding:32px 24px}
        .rw-wrap{max-width:1200px;margin:0 auto}
        .rw-head{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:22px;flex-wrap:wrap}
        .rw-kicker{font-size:11px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:#BB8958;margin-bottom:8px}
        .rw-title{margin:0;font-size:30px;line-height:1;color:#0C4044;font-weight:900}
        .rw-sub{color:#53615F;font-size:13px;margin:8px 0 0;font-weight:650}
        .rw-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
        .rw-select{height:42px;padding:0 14px;background:#FFFFFF;border:1px solid #D1DFDE;border-radius:10px;color:#0C4044;font-size:13px;font-weight:850;outline:none}
        .rw-btn{height:42px;padding:0 18px;border-radius:10px;border:1px solid #073B3F;background:linear-gradient(135deg,#0C4044,#073B3F);color:#FDFDFC;font-size:13px;font-weight:900;cursor:pointer}
        .rw-summary-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;margin-bottom:20px}
        .rw-summary-card{background:#FFFFFF;border:1.5px solid #E0E9E8;border-radius:12px;padding:18px;box-shadow:0 16px 36px rgba(7,59,63,.06);cursor:pointer;transition:all .2s ease}
        .rw-summary-card:hover{transform:translateY(-2px);box-shadow:0 20px 44px rgba(7,59,63,.12);border-color:#BB8958}
        .rw-summary-card-active{background:linear-gradient(135deg,#0C4044,#073B3F);border-color:#073B3F}
        .rw-summary-card-active .rw-summary-label,.rw-summary-card-active .rw-summary-coins{color:#FFFFFF}
        .rw-summary-card-active .rw-summary-users{color:#F3C88A}
        .rw-summary-icon{margin-bottom:10px}
        .rw-summary-label{font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#53615F;font-weight:900;margin-bottom:8px}
        .rw-summary-users{font-size:12px;color:#9F6130;font-weight:800;margin-top:4px}
        .rw-summary-coins{font-size:28px;font-weight:900;color:#0C4044}
        .rw-total-card{background:linear-gradient(135deg,#0C4044,#073B3F);border-radius:14px;padding:22px 24px;color:#FDFDFC;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
        .rw-total-label{font-size:12px;text-transform:uppercase;letter-spacing:.14em;font-weight:900;opacity:.85}
        .rw-total-num{font-size:38px;font-weight:900}
        .rw-card{background:#FFFFFF;border:1px solid #E0E9E8;border-radius:12px;box-shadow:0 16px 36px rgba(7,59,63,.06);overflow:hidden}
        .rw-card-head{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid #E0E9E8}
        .rw-card-title{font-size:15px;font-weight:900;color:#0C4044;display:flex;align-items:center;gap:12px}
        .rw-clear-filter{background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,0.3);color:#DC2626;border-radius:20px;padding:4px 12px;font-size:11px;font-weight:800;cursor:pointer}
        .rw-clear-filter:hover{background:rgba(220,38,38,0.15)}
        .rw-state{padding:56px 20px;text-align:center;color:#6E7D7B;font-size:14px;font-weight:700}
        .rw-error{margin-bottom:18px;background:rgba(201,32,53,.08);border:1px solid rgba(201,32,53,.28);color:#C92035;border-radius:10px;padding:12px 16px;font-weight:750}
        .rw-table-wrap{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}
        .rw-table{width:100%;min-width:700px;border-collapse:collapse;font-size:14px}
        .rw-table thead tr{background:#F3F3F0;border-bottom:1px solid #D1DFDE}
        .rw-table th{padding:14px 16px;text-align:left;color:#0C4044;font-weight:900;font-size:12px;text-transform:uppercase;letter-spacing:.08em}
        .rw-table td{padding:14px 16px;border-bottom:1px solid #E9EFEE;color:#111817}
        .rw-id{font-family:monospace;color:#9F6130;font-weight:850}
        .rw-muted{color:#6E7D7B!important}
        .rw-role{font-weight:900;color:#0C4044}
        .rw-badge{display:inline-block;background:rgba(12,64,68,.08);color:#0C4044;border:1px solid rgba(12,64,68,.2);border-radius:999px;padding:4px 12px;font-size:12px;font-weight:900}
        @media(max-width:720px){.rw-page{padding:20px 12px}.rw-head{align-items:stretch;flex-direction:column}.rw-actions{display:grid;grid-template-columns:1fr 1fr;width:100%}.rw-select,.rw-btn{width:100%}.rw-title{font-size:24px}}
      `}</style>
      <div className="rw-wrap">
        <header className="rw-head">
          <div>
            <div className="rw-kicker">Login Status</div>
            <h1 className="rw-title">🪙 Rewards</h1>
            <p className="rw-sub">Today's coin rewards summary{data ? ` — ${formatDate(data.date)}` : ''}</p>
          </div>
          <div className="rw-actions">
            <select className="rw-select" value={rangeFilter} onChange={e => setRangeFilter(e.target.value)}>
              <option value="all">All Reward</option>
              <option value="1-10">1 - 10 Reward</option>
              <option value="11-50">11 - 50 Reward</option>
              <option value="51-100">51 - 100 Reward</option>
              <option value="100+">100+ Reward</option>
            </select>
            <button className="rw-btn" onClick={() => navigate(-1)}>Back</button>
          </div>
        </header>

        {error && <div className="rw-error">{error}</div>}

        {loading ? (
          <>
            <div className="rw-total-card">
              <div className="rw-total-label">Total Coins Given Today</div>
              <div style={{ marginTop: 6 }}><SkeletonText width="90px" height="34px" /></div>
            </div>

            <div className="rw-summary-grid">
              {[0, 1, 2, 3, 4].map(i => (
                <div className="rw-summary-card" key={i} style={{ cursor: 'default' }}>
                  <div className="rw-summary-icon">
                    <div className="skel-line" style={{ width: 20, height: 20, borderRadius: '50%', marginBottom: 0 }} />
                  </div>
                  <div style={{ marginTop: 10, marginBottom: 8 }}><SkeletonText width="70%" height="10px" /></div>
                  <div style={{ marginBottom: 6 }}><SkeletonText width="50%" height="24px" /></div>
                  <SkeletonText width="60%" height="10px" />
                </div>
              ))}
            </div>

            <section className="rw-card">
              <div className="rw-card-head">
                <SkeletonText width="120px" height="14px" />
                <SkeletonText width="70px" height="20px" />
              </div>
              <div className="rw-table-wrap">
                <table className="rw-table">
                  <thead>
                    <tr>{['Level', 'Position', 'User ID', 'Name', 'Phone No', 'Reward', 'Date'].map(h => <th key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {[0, 1, 2, 3, 4, 5].map(i => (
                      <tr key={i}>
                        <td><SkeletonText width="30px" height="12px" /></td>
                        <td><SkeletonText width="70px" height="12px" /></td>
                        <td><SkeletonText width="90px" height="12px" /></td>
                        <td><SkeletonText width="100px" height="12px" /></td>
                        <td><SkeletonText width="90px" height="12px" /></td>
                        <td><SkeletonText width="80px" height="12px" /></td>
                        <td><SkeletonText width="60px" height="12px" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : data && (
          <>
            <div className="rw-total-card">
              <div className="rw-total-label">Total Coins Given Today</div>
              <div className="rw-total-num">{data.total_coins_today}</div>
            </div>

            <div className="rw-summary-grid">
              {data.summary.map(s => {
                const Icon = REWARD_ICONS[s.reward_type]
                const isActive = typeFilter === s.reward_type
                return (
                  <div
                    className={`rw-summary-card${isActive ? ' rw-summary-card-active' : ''}`}
                    key={s.reward_type}
                    onClick={() => handleCardClick(s.reward_type)}
                  >
                    <div className="rw-summary-icon">{Icon && <Icon color={isActive ? '#FFFFFF' : '#0C4044'} />}</div>
                    <div className="rw-summary-label">{s.label}</div>
                    <div className="rw-summary-coins">{s.coins}</div>
                    <div className="rw-summary-users">{s.users} users</div>
                  </div>
                )
              })}
            </div>

            <section className="rw-card">
              <div className="rw-card-head">
                <div className="rw-card-title">
                  {typeFilter ? (data.summary.find(s => s.reward_type === typeFilter)?.label || 'Rewards') : 'All Rewards'}
                  {typeFilter && (
                    <button className="rw-clear-filter" onClick={() => setTypeFilter(null)}>✕ Clear</button>
                  )}
                </div>
                <span className="rw-badge">{displayedRewards.length} entries</span>
              </div>
              {displayedRewards.length === 0 ? (
                <div className="rw-state">No rewards in this selection today</div>
              ) : (
                <div className="rw-table-wrap">
                  <table className="rw-table">
                    <thead><tr>{['Level', 'Position', 'User ID', 'Name', 'Phone No', 'Reward', 'Date'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                    <tbody>
                      {displayedRewards.map(r => (
                        <tr key={r.id}>
                          <td className="rw-muted">{r.level || '—'}</td>
                          <td className="rw-role">{r.position || '—'}</td>
                          <td className="rw-id">{r.user_id || '—'}</td>
                          <td>{r.name || 'Unknown'}</td>
                          <td className="rw-muted">{r.phone || '—'}</td>
                          <td>+{r.coins} {r.reward_label}</td>
                          <td className="rw-muted">{formatDate(r.date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}