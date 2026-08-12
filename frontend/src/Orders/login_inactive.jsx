import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../api'
import SuperAdminNavbar from '../collection/SuperAdminNavbar'

// ── NEW: period dropdown options ──
const PERIOD_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: '3days', label: '3 Days' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
]

export default function LoginInactive() {
  const navigate = useNavigate()
  const location = useLocation()
  const scopeIds = location.state?.ids || null           // ── NEW
  const scopeLabel = location.state?.scopeLabel || null   // ── NEW
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('today')   // ── NEW
  const [offset, setOffset] = useState(0)
const [limit, setLimit] = useState(20)
const [totalCount, setTotalCount] = useState(0)
const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/today-login-status/', {
  params: { period: periodFilter, offset: 0, limit: 20, list_type: 'inactive' }
})
      let list = [...(res.data.inactive || [])]
      setTotalCount(res.data.total_count || 0)
      setOffset(20)
      setLimit(50)
      if (scopeIds) list = list.filter(u => scopeIds.includes(u.id))
      const sorted = list.sort((a, b) => a.level - b.level)
      setData(sorted)
    } catch (err) {
      setError('Failed to load inactive users')
    }
    setLoading(false)
  }
  fetchData()
}, [periodFilter])

  const formatTime = (iso) => {
    if (!iso) return 'Never logged in'
    const d = new Date(iso)
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })
  }

  // ── NEW: "Day" column value ──
  const formatDays = (days) => {
    if (days === null || days === undefined) return '—'
    if (days === 0) return 'Today'
    return `${days} day${days === 1 ? '' : 's'}`
  }

  const periodLabel = PERIOD_OPTIONS.find(p => p.value === periodFilter)?.label || 'Today'

  const filtered = roleFilter === 'all' ? data : data.filter(u => u.level_role === roleFilter)

const hasMore = data.length < totalCount

const loadMore = async () => {
  setLoadingMore(true)
  try {
    const res = await api.get('/today-login-status/', {
  params: { period: periodFilter, offset, limit, list_type: 'inactive' }
})
    const newList = res.data.inactive || []
    setData(prev => [...prev, ...newList].sort((a, b) => a.level - b.level))
    setOffset(prev => prev + limit)
    setLimit(100)
  } catch (err) {
    setError('Failed to load more users')
  }
  setLoadingMore(false)
}

  return (
    <>
    <SuperAdminNavbar showSidebar={false} />
    <div className="ls-page inactive">
      <style>{`
        .ls-page{min-height:100vh;background:linear-gradient(135deg,#FDFDFC 0%,#F3F3F0 48%,#E7EDEC 100%);color:#111817;font-family:"Manrope","Inter",system-ui,sans-serif;padding:32px 24px}.ls-wrap{max-width:1200px;margin:0 auto}.ls-head{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:22px;flex-wrap:wrap}.ls-kicker{font-size:11px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:#BB8958;margin-bottom:8px}.ls-title{margin:0;font-size:30px;line-height:1;color:#C92035;font-weight:900}.ls-sub{color:#53615F;font-size:13px;margin:8px 0 0;font-weight:650}.ls-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.ls-select{height:42px;padding:0 14px;background:#FFFFFF;border:1px solid #D1DFDE;border-radius:10px;color:#0C4044;font-size:13px;font-weight:850;outline:none}.ls-btn{height:42px;padding:0 18px;border-radius:10px;border:1px solid #073B3F;background:linear-gradient(135deg,#0C4044,#073B3F);color:#FDFDFC;font-size:13px;font-weight:900;cursor:pointer}.ls-card{background:#FFFFFF;border:1px solid #E0E9E8;border-radius:12px;box-shadow:0 16px 36px rgba(7,59,63,.06);overflow:hidden}.ls-summary{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:center;padding:18px 20px;border-bottom:1px solid #E0E9E8}.ls-count{font-size:34px;line-height:1;font-weight:900;color:#C92035}.ls-label{font-size:12px;text-transform:uppercase;letter-spacing:.12em;color:#53615F;font-weight:900}.ls-status{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(201,32,53,.24);background:rgba(201,32,53,.08);color:#C92035;border-radius:999px;padding:8px 12px;font-size:12px;font-weight:900}.ls-dot{width:9px;height:9px;border-radius:50%;background:#C92035;box-shadow:0 0 0 4px rgba(201,32,53,.12)}.ls-state{padding:56px 20px;text-align:center;color:#6E7D7B;font-size:14px;font-weight:700}.ls-error{margin-bottom:18px;background:rgba(201,32,53,.08);border:1px solid rgba(201,32,53,.28);color:#C92035;border-radius:10px;padding:12px 16px;font-weight:750}.ls-table-wrap{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}.ls-table{width:100%;min-width:860px;border-collapse:collapse;font-size:14px}.ls-table thead tr{background:#F3F3F0;border-bottom:1px solid #D1DFDE}.ls-table th{padding:14px 16px;text-align:left;color:#0C4044;font-weight:900;font-size:12px;text-transform:uppercase;letter-spacing:.08em}.ls-table td{padding:14px 16px;border-bottom:1px solid #E9EFEE;color:#111817}.ls-role{font-weight:900;color:#0C4044}.ls-id{font-family:monospace;color:#C92035;font-weight:850}.ls-muted{color:#6E7D7B!important}.ls-time{color:#C92035;font-weight:900}.ls-day{color:#C92035;font-weight:900}@media(max-width:720px){.ls-page{padding:20px 12px}.ls-head{align-items:stretch;flex-direction:column}.ls-actions{display:grid;grid-template-columns:1fr 1fr;width:100%}.ls-select,.ls-btn{width:100%}.ls-summary{grid-template-columns:1fr}.ls-title{font-size:24px}.ls-count{font-size:28px}}@media(max-width:420px){.ls-actions{grid-template-columns:1fr}.ls-card{border-radius:10px}.ls-table{min-width:760px}}
      `}</style>
      <div className="ls-wrap">
        <header className="ls-head">
          <div>
            <div className="ls-kicker">Login Status</div>
            <h1 className="ls-title">Inactive Today</h1>
            <p className="ls-sub">{data.length} users not logged in today{scopeLabel ? ` - ${scopeLabel}` : ''}</p>
          </div>
          <div className="ls-actions">
            <select className="ls-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="all">All Levels</option>
              <option value="Admin">Admin</option>
              <option value="Dealer">Dealer</option>
              <option value="Sub Dealer">Sub Dealer</option>
              <option value="Promotor">Promotor</option>
              <option value="Customer">Customer</option>
            </select>

            {/* ── NEW: period dropdown ── */}
            <select className="ls-select" value={periodFilter} onChange={e => setPeriodFilter(e.target.value)}>
              {PERIOD_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <button className="ls-btn" onClick={() => navigate(-1)}>Back</button>
          </div>
        </header>

        {error && <div className="ls-error">{error}</div>}

        <section className="ls-card">
          <div className="ls-summary">
            <div><div className="ls-count">{filtered.length}</div><div className="ls-label">Shown users</div></div>
            <div className="ls-status"><span className="ls-dot" /> Inactive · {periodLabel}</div>
          </div>
          {loading ? (
            // ── NEW: skeleton rows — table shape mattum, shimmer boxes ──
            <div className="ls-table-wrap">
              <table className="ls-table">
                <thead>
                  <tr>{['Level', 'Position', 'User ID', 'Name', 'Phone No', 'Last Inactive', 'Day'].map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j}><div className="skel-line" style={{ width: j === 3 ? '80%' : '60%', height: '12px', marginBottom: 0 }} /></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
         ) : data.length === 0 ? (
            <div className="ls-state">
              {roleFilter === 'all' ? 'Everyone logged in today 🎉' : `All ${roleFilter.toLowerCase()} logged in today`}
            </div>
          ) : (
            <>
              <div className="ls-table-wrap">
                <table className="ls-table">
                  <thead>
                    <tr>{['Level', 'Position', 'User ID', 'Name', 'Phone No', 'Last Inactive', 'Day'].map(h => <th key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {filtered.map((u, i) => (
                      <tr key={i}>
                        <td className="ls-muted">{u.level}</td>
                        <td className="ls-role">{u.level_role}</td>
                        <td className="ls-id">{u.id || '-'}</td>
                        <td>{u.name || 'Unknown'}</td>
                        <td className="ls-muted">{u.phone || '-'}</td>
                        <td className="ls-time">{formatTime(u.last_login)}</td>
                        <td className="ls-day">{formatDays(u.days_inactive)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* ── NEW: Load More — 20 -> 50 -> 100 -> +100 ── */}
              {hasMore && (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
    <button className="ls-btn" onClick={loadMore} disabled={loadingMore}>
      {loadingMore ? 'Loading…' : `Load More (${data.length} of ${totalCount})`}
    </button>
  </div>
)}
            </>
          )}
        </section>
      </div>
    </div>
    </>
  )
}