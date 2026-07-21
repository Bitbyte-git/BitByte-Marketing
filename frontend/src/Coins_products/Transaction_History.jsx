import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const COIN_METAL_LABELS_TEXT = { gold_22k: 'Gold 22K', gold_24k: 'Gold 24K', silver_999: 'Silver 999' }

const STATUS_CFG = {
  pending:  { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.3)', label: 'Pending' },
  sent:     { color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.3)', label: 'Approved' },
  rejected: { color: '#f87171', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)', label: 'Rejected' },
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
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#f8fafc', fontFamily: '"Inter",system-ui,sans-serif', padding: '32px 24px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#38bdf8' }}>Coin Transaction History</h1>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
              {requests.length} total transactions
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#f8fafc', fontSize: '13px', cursor: 'pointer' }}
          >
            Back
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'sent', label: 'Approved' },
            { key: 'rejected', label: 'Rejected' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '8px 18px', borderRadius: '20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                background: filter === f.key ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${filter === f.key ? 'rgba(56,189,248,0.6)' : 'rgba(255,255,255,0.1)'}`,
                color: filter === f.key ? '#38bdf8' : '#94a3b8',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>Loading...</div>
        )}

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '12px', padding: '14px 20px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '60px 0', fontSize: '14px' }}>
            No transactions found
          </div>
        )}

        {!loading && !error && (
          <div style={{ overflowX: 'auto', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '14px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'rgba(56,189,248,0.08)', borderBottom: '1px solid rgba(56,189,248,0.25)' }}>
                  <th style={{ padding: '14px 16px', textAlign: 'left', color: '#38bdf8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Requester ID</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', color: '#38bdf8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Name</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', color: '#38bdf8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Phone</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', color: '#38bdf8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Email</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', color: '#38bdf8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Items</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', color: '#38bdf8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Date</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', color: '#38bdf8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(req => {
                  const cfg = STATUS_CFG[req.status] || STATUS_CFG.pending
                  return (
                    <tr key={req.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '14px 16px', color: '#38bdf8', fontFamily: 'monospace' }}>{req.requested_by_id_str || '—'}</td>
                      <td style={{ padding: '14px 16px', color: '#f8fafc' }}>{req.requested_by_name || '—'}</td>
                      <td style={{ padding: '14px 16px', color: '#94a3b8' }}>{req.requested_by_phone || '—'}</td>
                      <td style={{ padding: '14px 16px', color: '#94a3b8' }}>{req.requested_by_email}</td>
                      <td style={{ padding: '14px 16px', color: '#f8fafc' }}>
                        {req.items.map((item, i) => (
                          <div key={item.id} style={{ marginBottom: i < req.items.length - 1 ? '4px' : 0 }}>
                            {COIN_METAL_LABELS_TEXT[item.metal_type]} — {item.weight_label} × {item.qty}
                          </div>
                        ))}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{formatTime(req.created_at)}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-block', padding: '4px 12px', borderRadius: '20px',
                          background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
                          fontSize: '11px', fontWeight: 800, whiteSpace: 'nowrap'
                        }}>
                          {cfg.label}
                        </span>
                        {req.status === 'rejected' && req.reject_reason && (
                          <div style={{ color: '#f87171', fontSize: '11px', marginTop: '4px', maxWidth: '200px' }}>
                            {req.reject_reason}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  )
}