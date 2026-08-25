import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api'

export default function SuperStockist() {
  const navigate = useNavigate()
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionOpen, setActionOpen] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [selectedDetail, setSelectedDetail] = useState(null)

  const fetchAdmins = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admins/')
      const rows = Array.isArray(res.data) ? res.data : (res.data.results || res.data.admins || [])
      setAdmins(rows)
    } catch (e) {
      console.error('fetch admins error:', e)
      setAdmins([])
    }
    setLoading(false)
  }

  useEffect(() => { fetchAdmins() }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return admins
    return admins.filter(a =>
      (a.admin_id || '').toLowerCase().includes(q) ||
      (a.email || '').toLowerCase().includes(q) ||
      (a.mobile_number || '').toLowerCase().includes(q)
    )
  }, [admins, search])

  const text = '#111817'
  const subtext = '#7A8987'
  const border = 'rgba(189,207,206,0.78)'

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#FDFDFC 0%,#F3F3F0 46%,#E7EDEC 100%)', padding: '28px 34px' }}>
      <style>{`
        @keyframes skelShimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .ss-action-btn{width:34px;height:34px;border-radius:9px;border:1px solid #D8E3E1;background:#FFFFFF;color:#0C4044;cursor:pointer;font-weight:900;font-size:16px;transition:.2s}
        .ss-action-btn:hover,.ss-action-btn.is-open{color:#fff;background:#073B3F;border-color:#073B3F;box-shadow:0 10px 22px rgba(7,59,63,.18)}
        .ss-action-menu{position:absolute;z-index:80;top:44px;right:0;width:220px;padding:8px;border:1px solid rgba(189,207,206,.85);border-radius:14px;background:rgba(255,255,255,.98);box-shadow:0 24px 58px rgba(7,59,63,.2);backdrop-filter:blur(14px)}
        .ss-action-menu button{width:100%;min-height:40px;padding:0 11px;border:0;border-radius:9px;background:transparent;color:#173230;display:flex;align-items:center;justify-content:space-between;gap:12px;text-align:left;font-size:12px;font-weight:750;cursor:pointer}
        .ss-action-menu button:hover{color:#073B3F;background:#EDF3F1}
        .ss-action-menu button span:last-child{color:#A2764C}
      `}</style>
      <div style={{
        background: 'rgba(253,253,252,0.97)', border: `1px solid ${border}`, borderRadius: '22px',
        padding: '34px 38px', boxShadow: '0 22px 58px rgba(7,59,63,0.08)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
          <p style={{ color: '#0C4044', fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
            SUPER STOCKIST ({filtered.length})
          </p>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by ID, email, phone..."
              style={{
                height: '42px', minWidth: '280px', border: `1px solid ${border}`, borderRadius: '10px',
                padding: '0 14px', color: text, fontSize: '13px', outline: 'none',
              }}
            />
            <button type="button" onClick={() => navigate('/super-admin')}
              style={{ height: '42px', padding: '0 16px', borderRadius: '10px', border: `1px solid ${border}`, background: '#FFFFFF', color: '#0C4044', fontWeight: 800, cursor: 'pointer' }}>
              ← Back
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid rgba(12,64,68,0.22)' }}>
                  {['First Name', 'Last Name', 'Email', 'Mobile', 'ID', 'City', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', color: '#0C4044', fontSize: '13px', fontWeight: 900, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(12,64,68,0.16)' }}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} style={{ padding: '14px 16px' }}>
                        <div style={{
                          height: '14px', borderRadius: '4px', width: j === 4 ? '70%' : '80%',
                          background: 'linear-gradient(90deg,#E7EDEC 25%,#F3F3F0 50%,#E7EDEC 75%)',
                          backgroundSize: '200% 100%', animation: 'skelShimmer 1.4s ease-in-out infinite',
                        }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : filtered.length === 0 ? (
          <p style={{ color: subtext, textAlign: 'center', padding: '60px 0', fontSize: '15px' }}>
            {search ? `No results for "${search}"` : 'No Super Stockist yet!'}
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid rgba(12,64,68,0.22)' }}>
                  {['First Name', 'Last Name', 'Email', 'Mobile', 'ID', 'City', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', color: '#0C4044', fontSize: '13px', fontWeight: 900, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id || a.admin_id} style={{ borderBottom: '1px solid rgba(12,64,68,0.16)' }}>
                    <td style={{ padding: '14px 16px', color: text, fontWeight: 700 }}>{a.first_name}</td>
                    <td style={{ padding: '14px 16px', color: text, fontWeight: 700 }}>{a.last_name}</td>
                    <td style={{ padding: '14px 16px', color: text, fontWeight: 650 }}>{a.email}</td>
                    <td style={{ padding: '14px 16px', color: text, fontWeight: 650 }}>{a.mobile_number}</td>
                    <td style={{ padding: '14px 16px', color: text, fontFamily: 'monospace', fontWeight: 800 }}>{a.admin_id}</td>
                    <td style={{ padding: '14px 16px', color: text, fontWeight: 650 }}>{a.city_name}</td>
                    <td style={{ padding: '10px 16px', position: 'relative' }}>
                      <button type="button" className={`ss-action-btn ${actionOpen === a.id ? 'is-open' : ''}`}
                        onClick={() => setActionOpen(cur => cur === a.id ? null : a.id)}>•••</button>
                      {actionOpen === a.id && (
                        <div className="ss-action-menu">
                          <button type="button" onClick={() => { setSelectedDetail(a); setActionOpen(null) }}>
                            <span>View profile</span><span>↗</span>
                          </button>
                          <button type="button" onClick={() => navigate(`/hierarchy-sales-count?role=admin&id=${a.id}`)}>
                            <span>Performance report</span><span>↗</span>
                          </button>
                          <button type="button" onClick={() => navigate(`/superadmin-hierarchy-grid?role=admin&id=${a.id}`)}>
                            <span>View hierarchy</span><span>↗</span>
                          </button>
                          <button type="button" onClick={async () => {
                            await navigator.clipboard.writeText(a.admin_id || '')
                            setCopiedId(a.id)
                            setTimeout(() => setCopiedId(null), 1600)
                          }}>
                            <span>{copiedId === a.id ? 'Admin ID copied' : 'Copy Admin ID'}</span>
                            <span>{copiedId === a.id ? '✓' : '⧉'}</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedDetail && (
        <div onClick={() => setSelectedDetail(null)} style={{ position: 'fixed', inset: 0, zIndex: 1350, padding: 20, display: 'grid', placeItems: 'center', background: 'rgba(7,31,34,.52)', backdropFilter: 'blur(8px)' }}>
          <section onClick={e => e.stopPropagation()} style={{ width: 'min(520px,100%)', overflow: 'hidden', border: '1px solid rgba(204,168,129,.38)', borderRadius: 22, background: 'linear-gradient(155deg,#fff,#F7FAF8)', boxShadow: '0 35px 90px rgba(7,31,34,.3)' }}>
            <header style={{ padding: '24px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff', background: 'linear-gradient(120deg,#073B3F,#0C5254)' }}>
              <div>
                <small style={{ display: 'block', marginBottom: 5, color: '#D9B780', fontSize: 9, fontWeight: 800, letterSpacing: '.16em' }}>SUPER STOCKIST PROFILE</small>
                <h3 style={{ margin: 0, fontFamily: 'Georgia,serif', fontSize: 25 }}>{selectedDetail.first_name} {selectedDetail.last_name}</h3>
              </div>
              <button type="button" onClick={() => setSelectedDetail(null)} style={{ width: 34, height: 34, border: '1px solid rgba(255,255,255,.25)', borderRadius: '50%', color: '#fff', background: 'rgba(255,255,255,.08)', cursor: 'pointer' }}>×</button>
            </header>
            <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }}>
              {[['ID', selectedDetail.admin_id], ['Email', selectedDetail.email], ['Mobile', selectedDetail.mobile_number], ['City', selectedDetail.city_name]].map(([label, value]) => (
                <div key={label} style={{ padding: 14, border: '1px solid #E0E9E8', borderRadius: 11, background: '#F8FAF9' }}>
                  <small style={{ display: 'block', marginBottom: 5, color: '#83918F', fontSize: 9, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase' }}>{label}</small>
                  <strong style={{ color: '#173230', fontSize: 13, overflowWrap: 'anywhere' }}>{value || 'Not provided'}</strong>
                </div>
              ))}
            </div>
            <footer style={{ padding: '0 24px 24px', display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => navigate(`/hierarchy-sales-count?role=admin&id=${selectedDetail.id}`)} style={{ flex: 1, minHeight: 44, border: 0, borderRadius: 11, color: '#fff', background: '#073B3F', fontWeight: 800, cursor: 'pointer' }}>Open performance</button>
              <button type="button" onClick={() => setSelectedDetail(null)} style={{ minWidth: 100, border: '1px solid #D8E3E1', borderRadius: 11, color: '#53615F', background: '#fff', fontWeight: 750, cursor: 'pointer' }}>Close</button>
            </footer>
          </section>
        </div>
      )}
    </div>
  )
}