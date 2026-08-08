import { useEffect, useState } from 'react'

export default function SuperAdminAutopayList() {
  const [mandates, setMandates] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [periodFilter, setPeriodFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    const fetchMandates = async () => {
      try {
        const { default: api } = await import('../api')
        const res = await api.get('/autopay/mandates/')
        setMandates(res.data)
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    fetchMandates()
  }, [])

  const withinPeriod = (dateStr, period) => {
    if (period === 'all') return true
    if (!dateStr) return false
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = (now - date) / (1000 * 60 * 60 * 24)
    if (period === 'today') return date.toDateString() === now.toDateString()
    if (period === 'month') return diffDays <= 30
    if (period === '6month') return diffDays <= 180
    if (period === 'year') return diffDays <= 365
    return true
  }

  const filtered = mandates.filter(m => {
    const searchLower = search.trim().toLowerCase()
    const matchesSearch = !searchLower ||
      (m.customer_id || '').toLowerCase().includes(searchLower) ||
      (m.email || '').toLowerCase().includes(searchLower) ||
      (m.phone || '').toLowerCase().includes(searchLower)

    const matchesStatus = statusFilter === 'all' || m.last_charge_status === statusFilter

    const matchesPeriod = withinPeriod(m.last_charge_date, periodFilter)

    return matchesSearch && matchesStatus && matchesPeriod
  })

  return (
    <div>
      <div style={{ padding: 32 }}>
        <h2 style={{ color: '#073B3F', fontFamily: 'Georgia, serif' }}>Autopay List</h2>

        <div style={{ display: 'flex', gap: 12, marginTop: 16, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by ID, email, or phone"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: '1 1 260px', minWidth: 220, padding: '10px 14px',
              border: '1.5px solid #D1DFDE', borderRadius: 8, fontSize: 13,
            }}
          />
          <select
            value={periodFilter}
            onChange={e => setPeriodFilter(e.target.value)}
            style={{ padding: '10px 14px', border: '1.5px solid #D1DFDE', borderRadius: 8, fontSize: 13, fontWeight: 700 }}
          >
            <option value="all">All</option>
            <option value="today">Today</option>
            <option value="month">This Month</option>
            <option value="6month">6 Months</option>
            <option value="year">This Year</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '10px 14px', border: '1.5px solid #D1DFDE', borderRadius: 8, fontSize: 13, fontWeight: 700 }}
          >
            <option value="all">All Payments</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '40px 0', color: '#7A8987', fontSize: 14 }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              border: '2.5px solid #D1DFDE', borderTopColor: '#073B3F',
              animation: 'spin 0.8s linear infinite'
            }} />
            Loading autopay mandates...
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px 0', color: '#7A8987', fontSize: 14, textAlign: 'center' }}>
            No autopay mandates found.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 20 }}>
            <thead>
              <tr style={{ background: '#073B3F', color: '#fff' }}>
                <th style={{ padding: 12, textAlign: 'left' }}>Customer ID</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Name</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Phone</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Amount</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Frequency</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Charge Day</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Status</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Next Charge</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Last Payment</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #D1DFDE' }}>
                  <td style={{ padding: 12 }}>{m.customer_id || '—'}</td>
                  <td style={{ padding: 12 }}>{m.name || '—'}</td>
                  <td style={{ padding: 12 }}>{m.phone || '—'}</td>
                  <td style={{ padding: 12 }}>₹{m.amount}</td>
                  <td style={{ padding: 12 }}>{m.frequency === 'daily' ? 'Weekly' : 'Monthly'}</td>
                  <td style={{ padding: 12 }}>{m.frequency === 'daily' ? 'N/A' : m.recharge_day}</td>
                  <td style={{ padding: 12 }}>{m.status}</td>
                  <td style={{ padding: 12 }}>{m.next_charge_date || '—'}</td>
                  <td style={{ padding: 12 }}>
                    {!m.last_charge_status ? (
                      <span style={{ color: '#7A8987' }}>— (no payment yet)</span>
                    ) : m.last_charge_status === 'success' ? (
                      <span style={{ color: '#16a34a', fontWeight: 700 }}>
                        Success — {m.last_charge_date}
                      </span>
                    ) : (
                      <span style={{ color: '#c0392b', fontWeight: 700 }}>
                        Failed ({m.last_charge_error}) — {m.last_charge_date}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}