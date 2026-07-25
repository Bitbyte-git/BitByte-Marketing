import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../api'

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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await api.get('/today-login-status/', { params: { period: periodFilter } })   // ── CHANGED
        let list = [...(res.data.inactive || [])]
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

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#f8fafc', fontFamily: '"Inter",system-ui,sans-serif', padding: '32px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#f87171' }}>⛔ Inactive Today</h1>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
              {data.length} users not logged in today{scopeLabel ? ` · ${scopeLabel}` : ''}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              style={{ padding: '10px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#f87171', fontSize: '13px', fontWeight: 700, cursor: 'pointer', outline: 'none' }}
            >
              <option value="all" style={{ background: '#020617' }}>All Levels</option>
<option value="Admin" style={{ background: '#020617' }}>Admin</option>
<option value="Dealer" style={{ background: '#020617' }}>Dealer</option>
<option value="Sub Dealer" style={{ background: '#020617' }}>Sub Dealer</option>
<option value="Promotor" style={{ background: '#020617' }}>Promotor</option>
<option value="Customer" style={{ background: '#020617' }}>Customer</option>
            </select>

            {/* ── NEW: All Levels-ku right side-la period dropdown ── */}
            <select
              value={periodFilter}
              onChange={e => setPeriodFilter(e.target.value)}
              style={{ padding: '10px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#f87171', fontSize: '13px', fontWeight: 700, cursor: 'pointer', outline: 'none' }}
            >
              {PERIOD_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value} style={{ background: '#020617' }}>{opt.label}</option>
              ))}
            </select>

            <button
              onClick={() => navigate(-1)}
              style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#f8fafc', fontSize: '13px', cursor: 'pointer' }}
            >
              ← Back
            </button>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>Loading...</div>
        )}

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '12px', padding: '14px 20px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {!loading && !error && (() => {
          const filtered = roleFilter === 'all' ? data : data.filter(u => u.level_role === roleFilter)
          return filtered.length === 0 ? (
            <div style={{ color: '#64748b', fontSize: '14px', padding: '40px 0', textAlign: 'center' }}>
              {roleFilter === 'all' ? 'Everyone logged in today 🎉' : `All ${roleFilter.toLowerCase()} logged in today`}
            </div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '14px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.25)' }}>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: '#f87171', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Level</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: '#f87171', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Position</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: '#f87171', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>User ID</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: '#f87171', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Name</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: '#f87171', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Phone No</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: '#f87171', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Last Inactive</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: '#f87171', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Day</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '14px 16px', color: '#94a3b8' }}>{u.level}</td>
                      <td style={{ padding: '14px 16px', color: '#f8fafc', fontWeight: 700 }}>{u.level_role}</td>
                      <td style={{ padding: '14px 16px', color: '#f87171', fontFamily: 'monospace' }}>{u.id || '—'}</td>
                      <td style={{ padding: '14px 16px', color: '#f8fafc' }}>{u.name || 'Unknown'}</td>
                      <td style={{ padding: '14px 16px', color: '#94a3b8' }}>{u.phone || '—'}</td>
                      <td style={{ padding: '14px 16px', color: '#f87171', fontWeight: 700 }}>{formatTime(u.last_login)}</td>
                      <td style={{ padding: '14px 16px', color: '#f87171', fontWeight: 700 }}>{formatDays(u.days_inactive)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })()}

      </div>
    </div>
  )
}