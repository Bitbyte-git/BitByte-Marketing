import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function CoinsReward() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rangeFilter, setRangeFilter] = useState('all')

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
        .rw-summary-card{background:#FFFFFF;border:1px solid #E0E9E8;border-radius:12px;padding:18px;box-shadow:0 16px 36px rgba(7,59,63,.06)}
        .rw-summary-label{font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#53615F;font-weight:900;margin-bottom:8px}
        .rw-summary-users{font-size:12px;color:#9F6130;font-weight:800;margin-top:4px}
        .rw-summary-coins{font-size:28px;font-weight:900;color:#0C4044}
        .rw-total-card{background:linear-gradient(135deg,#0C4044,#073B3F);border-radius:14px;padding:22px 24px;color:#FDFDFC;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
        .rw-total-label{font-size:12px;text-transform:uppercase;letter-spacing:.14em;font-weight:900;opacity:.85}
        .rw-total-num{font-size:38px;font-weight:900}
        .rw-card{background:#FFFFFF;border:1px solid #E0E9E8;border-radius:12px;box-shadow:0 16px 36px rgba(7,59,63,.06);overflow:hidden}
        .rw-card-head{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid #E0E9E8}
        .rw-card-title{font-size:15px;font-weight:900;color:#0C4044}
        .rw-state{padding:56px 20px;text-align:center;color:#6E7D7B;font-size:14px;font-weight:700}
        .rw-error{margin-bottom:18px;background:rgba(201,32,53,.08);border:1px solid rgba(201,32,53,.28);color:#C92035;border-radius:10px;padding:12px 16px;font-weight:750}
        .rw-table-wrap{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}
        .rw-table{width:100%;min-width:700px;border-collapse:collapse;font-size:14px}
        .rw-table thead tr{background:#F3F3F0;border-bottom:1px solid #D1DFDE}
        .rw-table th{padding:14px 16px;text-align:left;color:#0C4044;font-weight:900;font-size:12px;text-transform:uppercase;letter-spacing:.08em}
        .rw-table td{padding:14px 16px;border-bottom:1px solid #E9EFEE;color:#111817}
        .rw-id{font-family:monospace;color:#9F6130;font-weight:850}
        .rw-muted{color:#6E7D7B!important}
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
          <div className="rw-state">Loading...</div>
        ) : data && (
          <>
            <div className="rw-total-card">
              <div className="rw-total-label">Total Coins Given Today</div>
              <div className="rw-total-num">{data.total_coins_today}</div>
            </div>

            <div className="rw-summary-grid">
              {data.summary.map(s => (
                <div className="rw-summary-card" key={s.reward_type}>
                  <div className="rw-summary-label">{s.label}</div>
                  <div className="rw-summary-coins">{s.coins}</div>
                  <div className="rw-summary-users">{s.users} users</div>
                </div>
              ))}
            </div>

            <section className="rw-card">
              <div className="rw-card-head">
                <div className="rw-card-title">All Rewards</div>
                <span className="rw-badge">{data.rewards.length} entries</span>
              </div>
              {data.rewards.length === 0 ? (
                <div className="rw-state">No rewards in this range today</div>
              ) : (
                <div className="rw-table-wrap">
                  <table className="rw-table">
                    <thead><tr>{['User ID', 'Name', 'Phone No', 'Reward', 'Date'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                    <tbody>
                      {data.rewards.map(r => (
                        <tr key={r.id}>
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