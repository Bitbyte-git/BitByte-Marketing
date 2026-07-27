import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../api'

// ── NEW: table role name → SalesCount page-oda role slug ──
const ROLE_SLUG = { Admin: 'admin', Dealer: 'dealer', 'Sub Dealer': 'sub_dealer', Promotor: 'promotor', Customer: 'customer' }

export default function LoginActive() {
  const navigate = useNavigate()
  const location = useLocation()
  const scopeIds = location.state?.ids || null
  const scopeLabel = location.state?.scopeLabel || null
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [orderFilter, setOrderFilter] = useState('0')   // ── NEW: default = 0 Orders

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await api.get('/today-login-status/')
        let list = [...(res.data.active || [])]
        if (scopeIds) list = list.filter(u => scopeIds.includes(u.id))
        const sorted = list.sort((a, b) => a.level - b.level)
        setData(sorted)
      } catch (err) {
        setError('Failed to load active users')
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const formatTime = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })
  }

  // ── NEW: role filter + order count filter, rendும் ஒரே இடத்துல ──
  const filtered = data.filter(u => {
    if (roleFilter !== 'all' && u.level_role !== roleFilter) return false
    const oc = u.order_count ?? 0
    if (orderFilter === '0' && oc !== 0) return false
    if (orderFilter === '1-10' && !(oc >= 1 && oc <= 10)) return false
    if (orderFilter === '11-20' && !(oc >= 11 && oc <= 20)) return false
    if (orderFilter === '21+' && !(oc > 20)) return false
    return true
  })

  // ── NEW: order button click → SalesCount page-ku today filter-oda jump ──
  const goToOrders = (u) => {
    const slug = ROLE_SLUG[u.level_role]
    if (!slug) return
    navigate(`/superadmin-hierarchy-salescount?role=${slug}&id=${u.id}&period=today`)
  }

  return (
    <div className="ls-page">
      <style>{`
        .ls-page{min-height:100vh;background:linear-gradient(135deg,#FDFDFC 0%,#F3F3F0 48%,#E7EDEC 100%);color:#111817;font-family:"Manrope","Inter",system-ui,sans-serif;padding:32px 24px}.ls-wrap{max-width:1200px;margin:0 auto}.ls-head{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:22px;flex-wrap:wrap}.ls-kicker{font-size:11px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:#BB8958;margin-bottom:8px}.ls-title{margin:0;font-size:30px;line-height:1;color:#0C4044;font-weight:900}.ls-sub{color:#53615F;font-size:13px;margin:8px 0 0;font-weight:650}.ls-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.ls-select{height:42px;padding:0 14px;background:#FFFFFF;border:1px solid #D1DFDE;border-radius:10px;color:#0C4044;font-size:13px;font-weight:850;outline:none}.ls-btn{height:42px;padding:0 18px;border-radius:10px;border:1px solid #073B3F;background:linear-gradient(135deg,#0C4044,#073B3F);color:#FDFDFC;font-size:13px;font-weight:900;cursor:pointer}.ls-card{background:#FFFFFF;border:1px solid #E0E9E8;border-radius:12px;box-shadow:0 16px 36px rgba(7,59,63,.06);overflow:hidden}.ls-summary{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:center;padding:18px 20px;border-bottom:1px solid #E0E9E8}.ls-count{font-size:34px;line-height:1;font-weight:900;color:#0C4044}.ls-label{font-size:12px;text-transform:uppercase;letter-spacing:.12em;color:#53615F;font-weight:900}.ls-status{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(12,64,68,.24);background:rgba(12,64,68,.08);color:#0C4044;border-radius:999px;padding:8px 12px;font-size:12px;font-weight:900}.ls-dot{width:9px;height:9px;border-radius:50%;background:#0C4044;box-shadow:0 0 0 4px rgba(12,64,68,.12)}.ls-state{padding:56px 20px;text-align:center;color:#6E7D7B;font-size:14px;font-weight:700}.ls-error{margin-bottom:18px;background:rgba(201,32,53,.08);border:1px solid rgba(201,32,53,.28);color:#C92035;border-radius:10px;padding:12px 16px;font-weight:750}.ls-table-wrap{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}.ls-table{width:100%;min-width:860px;border-collapse:collapse;font-size:14px}.ls-table thead tr{background:#F3F3F0;border-bottom:1px solid #D1DFDE}.ls-table th{padding:14px 16px;text-align:left;color:#0C4044;font-weight:900;font-size:12px;text-transform:uppercase;letter-spacing:.08em}.ls-table td{padding:14px 16px;border-bottom:1px solid #E9EFEE;color:#111817}.ls-role{font-weight:900;color:#0C4044}.ls-id{font-family:monospace;color:#9F6130;font-weight:850}.ls-muted{color:#6E7D7B!important}.ls-time{color:#0C4044;font-weight:900}.ls-order-btn{background:#0C4044;color:#FDFDFC;border:none;border-radius:20px;padding:5px 14px;font-size:12px;font-weight:900;cursor:pointer}.ls-order-btn:hover{background:#073B3F}@media(max-width:720px){.ls-page{padding:20px 12px}.ls-head{align-items:stretch;flex-direction:column}.ls-actions{display:grid;grid-template-columns:1fr 1fr;width:100%}.ls-select,.ls-btn{width:100%}.ls-summary{grid-template-columns:1fr}.ls-title{font-size:24px}.ls-count{font-size:28px}}@media(max-width:420px){.ls-actions{grid-template-columns:1fr}.ls-card{border-radius:10px}.ls-table{min-width:760px}}
      `}</style>
      <div className="ls-wrap">
        <header className="ls-head">
          <div>
            <div className="ls-kicker">Login Status</div>
            <h1 className="ls-title">Active Today</h1>
            <p className="ls-sub">{data.length} users logged in today{scopeLabel ? ` - ${scopeLabel}` : ''}</p>
          </div>
          <div className="ls-actions">
            {/* ── NEW: Orders range dropdown, All Levels-க்கு இடது பக்கம் ── */}
            <select className="ls-select" value={orderFilter} onChange={e => setOrderFilter(e.target.value)}>
              <option value="0">0 Orders</option>
              <option value="1-10">0 - 10 Orders</option>
              <option value="11-20">10 - 20 Orders</option>
              <option value="21+">20+ Orders</option>
            </select>
            <select className="ls-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="all">All Levels</option>
              <option value="Admin">Admin</option>
              <option value="Dealer">Dealer</option>
              <option value="Sub Dealer">Sub Dealer</option>
              <option value="Promotor">Promotor</option>
              <option value="Customer">Customer</option>
            </select>
            <button className="ls-btn" onClick={() => navigate(-1)}>Back</button>
          </div>
        </header>

        {error && <div className="ls-error">{error}</div>}

        <section className="ls-card">
          <div className="ls-summary">
            <div><div className="ls-count">{filtered.length}</div><div className="ls-label">Shown users</div></div>
            <div className="ls-status"><span className="ls-dot" /> Active session list</div>
          </div>
          {loading ? <div className="ls-state">Loading...</div> : filtered.length === 0 ? <div className="ls-state">{roleFilter === 'all' ? 'No one logged in today' : `No active ${roleFilter.toLowerCase()} today`}</div> : (
            <div className="ls-table-wrap">
              <table className="ls-table">
                <thead><tr>{['Level', 'Position', 'User ID', 'Name', 'Phone No', 'Orders', 'Login Active'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {filtered.map((u, i) => (
                    <tr key={i}>
                      <td className="ls-muted">{u.level}</td>
                      <td className="ls-role">{u.level_role}</td>
                      <td className="ls-id">{u.id || '—'}</td>
                      <td>{u.name || 'Unknown'}</td>
                      <td className="ls-muted">{u.phone || '—'}</td>
                      <td>
                        <button className="ls-order-btn" onClick={() => goToOrders(u)}>
                          {u.order_count ?? 0}
                        </button>
                      </td>
                      <td className="ls-time">{formatTime(u.last_login)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}