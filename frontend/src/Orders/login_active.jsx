import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../api'

export default function LoginActive() {
  const navigate = useNavigate()
  const location = useLocation()
  const scopeIds = location.state?.ids || null           // ── NEW
  const scopeLabel = location.state?.scopeLabel || null   // ── NEW
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await api.get('/today-login-status/')
        let list = [...(res.data.active || [])]
        if (scopeIds) list = list.filter(u => scopeIds.includes(u.id))   // ── NEW
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

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#f8fafc', fontFamily: '"Inter",system-ui,sans-serif', padding: '32px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#4ade80' }}>✅ Active Today</h1>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
              {data.length} users logged in today{scopeLabel ? ` · ${scopeLabel}` : ''}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              style={{ padding: '10px 16px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '10px', color: '#4ade80', fontSize: '13px', fontWeight: 700, cursor: 'pointer', outline: 'none' }}
            >
              <option value="all" style={{ background: '#020617' }}>All Levels</option>
<option value="Admin" style={{ background: '#020617' }}>Admin</option>
<option value="Dealer" style={{ background: '#020617' }}>Dealer</option>
<option value="Sub Dealer" style={{ background: '#020617' }}>Sub Dealer</option>
<option value="Promotor" style={{ background: '#020617' }}>Promotor</option>
<option value="Customer" style={{ background: '#020617' }}>Customer</option>
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
              {roleFilter === 'all' ? 'No one logged in today' : `No active ${roleFilter.toLowerCase()} today`}
            </div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '14px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: 'rgba(74,222,128,0.08)', borderBottom: '1px solid rgba(74,222,128,0.25)' }}>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: '#4ade80', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Level</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: '#4ade80', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Position</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: '#4ade80', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>User ID</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: '#4ade80', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Name</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: '#4ade80', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Phone No</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: '#4ade80', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Login Active</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '14px 16px', color: '#94a3b8' }}>{u.level}</td>
                      <td style={{ padding: '14px 16px', color: '#f8fafc', fontWeight: 700 }}>{u.level_role}</td>
                      <td style={{ padding: '14px 16px', color: '#4ade80', fontFamily: 'monospace' }}>{u.id || '—'}</td>
                      <td style={{ padding: '14px 16px', color: '#f8fafc' }}>{u.name || 'Unknown'}</td>
                      <td style={{ padding: '14px 16px', color: '#94a3b8' }}>{u.phone || '—'}</td>
                      <td style={{ padding: '14px 16px', color: '#4ade80', fontWeight: 700 }}>{formatTime(u.last_login)}</td>
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