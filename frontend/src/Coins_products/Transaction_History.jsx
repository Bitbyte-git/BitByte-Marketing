import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const COIN_METAL_LABELS_TEXT = { gold_22k: 'Gold 22K', gold_24k: 'Gold 24K', silver_999: 'Silver 999' }

const STATUS_CFG = {
  pending: { color: '#9F6130', bg: 'rgba(204,168,129,0.18)', border: 'rgba(204,168,129,0.6)', label: 'Pending' },
  sent: { color: '#0C4044', bg: 'rgba(209,223,222,0.72)', border: 'rgba(12,64,68,0.26)', label: 'Approved' },
  rejected: { color: '#C92035', bg: 'rgba(201,32,53,0.08)', border: 'rgba(201,32,53,0.28)', label: 'Rejected' },
}

export default function TransactionHistory() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true)
      try {
        const res = await api.get('/coin-requests/', { params: { box: 'history' } })
        setRequests(res.data)
      } catch (err) {
        setError('Failed to load transaction history')
      }
      setLoading(false)
    }
    fetchHistory()
  }, [])

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)

  const formatTime = (iso) => {
    if (!iso) return '-'
    const d = new Date(iso)
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
  }

  const countByStatus = status => requests.filter(r => r.status === status).length

  return (
    <main className="ct-page">
      <style>{`
        .ct-page{min-height:100vh;background:linear-gradient(135deg,#FDFDFC 0%,#F3F3F0 52%,#E7EDEC 100%);color:#111817;font-family:"Manrope","Inter",system-ui,sans-serif;padding:42px 28px 76px}.ct-wrap{max-width:1320px;margin:0 auto}.ct-hero,.ct-stat,.ct-table-wrap,.ct-empty{background:rgba(253,253,252,.95);border:1px solid rgba(189,207,206,.9);border-radius:8px;box-shadow:0 22px 58px rgba(7,59,63,.08)}.ct-hero{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;padding:34px 38px;margin-bottom:18px;position:relative;overflow:hidden}.ct-hero:after{content:"";position:absolute;right:-80px;top:-80px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(12,64,68,.16),transparent 70%)}.ct-kicker{font-size:12px;font-weight:950;letter-spacing:.18em;text-transform:uppercase;color:#BB8958}.ct-title{font-family:Georgia,'Times New Roman',serif;font-size:clamp(38px,5vw,64px);line-height:.95;margin:9px 0 0;color:#073B3F;font-weight:500}.ct-sub{margin:12px 0 0;color:#7A8987;font-weight:750}.ct-actions{position:relative;z-index:1;display:flex;gap:10px;flex-wrap:wrap}.ct-btn{height:46px;border-radius:999px;border:1px solid rgba(12,64,68,.24);background:#FDFDFC;color:#073B3F;padding:0 20px;font-weight:950;cursor:pointer}.ct-btn.primary{border:0;background:linear-gradient(135deg,#0C4044,#073B3F);color:#FDFDFC;box-shadow:0 16px 34px rgba(7,59,63,.16)}.ct-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:18px}.ct-stat{padding:20px}.ct-stat small{display:block;font-size:11px;font-weight:950;text-transform:uppercase;letter-spacing:.13em;color:#7A8987}.ct-stat strong{display:block;margin-top:8px;font-size:32px;color:#073B3F}.ct-filter{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px}.ct-filter button{height:40px;border-radius:999px;padding:0 18px;border:1px solid rgba(12,64,68,.2);background:#FDFDFC;color:#7A8987;font-weight:950;cursor:pointer}.ct-filter button.active{background:#0C4044;color:#FDFDFC;box-shadow:0 12px 26px rgba(7,59,63,.14)}.ct-table-wrap{overflow:hidden}.ct-scroll{overflow-x:auto}.ct-table{width:100%;border-collapse:collapse;min-width:980px;font-size:14px}.ct-table th{padding:16px;text-align:left;background:#E7EDEC;color:#073B3F;font-size:11px;font-weight:950;letter-spacing:.12em;text-transform:uppercase;border-bottom:1px solid #D1DFDE}.ct-table td{padding:17px 16px;border-bottom:1px solid rgba(189,207,206,.58);vertical-align:top}.ct-table tr:hover td{background:rgba(243,232,222,.38)}.ct-id{font-family:"JetBrains Mono",Consolas,monospace;color:#0C4044;font-weight:900}.ct-muted{color:#7A8987;font-weight:750}.ct-item{font-weight:850;color:#111817;margin-bottom:5px}.ct-badge{display:inline-flex;align-items:center;border-radius:999px;padding:6px 12px;font-size:11px;font-weight:950;border:1px solid var(--border);background:var(--bg);color:var(--color);white-space:nowrap}.ct-reason{margin-top:6px;color:#C92035;font-size:12px;font-weight:800;max-width:220px}.ct-loading{display:grid;place-items:center;min-height:240px;color:#7A8987;font-weight:900}.ct-empty{padding:60px 28px;text-align:center;color:#7A8987;font-weight:850}.ct-error{padding:16px 18px;border-radius:8px;background:rgba(201,32,53,.08);border:1px solid rgba(201,32,53,.24);color:#C92035;font-weight:850}@media(max-width:900px){.ct-page{padding:28px 14px 56px}.ct-hero{display:block;padding:28px 22px}.ct-actions{margin-top:18px}.ct-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.ct-stats{grid-template-columns:1fr}}
      `}</style>
      <div className="ct-wrap">
        <section className="ct-hero">
          <div>
            <div className="ct-kicker">Ledger View</div>
            <h1 className="ct-title">Coin Transactions</h1>
            <p className="ct-sub">Track requested, approved, and rejected coin movements across the internal role chain.</p>
          </div>
          <div className="ct-actions">
            <button className="ct-btn" onClick={() => navigate('/coin-requests-page')}>Requests</button>
            <button className="ct-btn primary" onClick={() => navigate('/buy-coin')}>Buy Coin</button>
          </div>
        </section>

        <section className="ct-stats">
          <div className="ct-stat"><small>Total Transactions</small><strong>{requests.length}</strong></div>
          <div className="ct-stat"><small>Pending</small><strong>{countByStatus('pending')}</strong></div>
          <div className="ct-stat"><small>Approved</small><strong>{countByStatus('sent')}</strong></div>
          <div className="ct-stat"><small>Rejected</small><strong>{countByStatus('rejected')}</strong></div>
        </section>

        <div className="ct-filter">
          {[{ key: 'all', label: 'All' }, { key: 'pending', label: 'Pending' }, { key: 'sent', label: 'Approved' }, { key: 'rejected', label: 'Rejected' }].map(f => (
            <button key={f.key} className={filter === f.key ? 'active' : ''} onClick={() => setFilter(f.key)}>{f.label}</button>
          ))}
        </div>

        {loading && <div className="ct-loading">Loading transaction history...</div>}
        {error && <div className="ct-error">{error}</div>}
        {!loading && !error && filtered.length === 0 && <div className="ct-empty">No transactions found.</div>}

        {!loading && !error && filtered.length > 0 && (
          <section className="ct-table-wrap">
            <div className="ct-scroll">
              <table className="ct-table">
                <thead>
                  <tr>
                    <th>Requester ID</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Items</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(req => {
                    const cfg = STATUS_CFG[req.status] || STATUS_CFG.pending
                    return (
                      <tr key={req.id}>
                        <td className="ct-id">{req.requested_by_id_str || '-'}</td>
                        <td>{req.requested_by_name || '-'}</td>
                        <td className="ct-muted">{req.requested_by_phone || '-'}</td>
                        <td className="ct-muted">{req.requested_by_email}</td>
                        <td>
                          {req.items.map((item, i) => (
                            <div className="ct-item" key={item.id}>{COIN_METAL_LABELS_TEXT[item.metal_type]} - {item.weight_label} x {item.qty}</div>
                          ))}
                        </td>
                        <td className="ct-muted" style={{ whiteSpace: 'nowrap' }}>{formatTime(req.created_at)}</td>
                        <td>
                          <span className="ct-badge" style={{ '--bg': cfg.bg, '--border': cfg.border, '--color': cfg.color }}>{cfg.label}</span>
                          {req.status === 'rejected' && req.reject_reason && <div className="ct-reason">{req.reject_reason}</div>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
