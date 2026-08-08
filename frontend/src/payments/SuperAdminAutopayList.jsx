import { useEffect, useState } from 'react'

export default function SuperAdminAutopayList() {
  const [mandates, setMandates] = useState([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div>
      <div style={{ padding: 32 }}>
        <h2 style={{ color: '#073B3F', fontFamily: 'Georgia, serif' }}>Autopay List</h2>
        {loading ? (
          <p>Loading...</p>
        ) : mandates.length === 0 ? (
          <p>No autopay mandates found.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 20 }}>
            <thead>
              <tr style={{ background: '#073B3F', color: '#fff' }}>
                <th style={{ padding: 12, textAlign: 'left' }}>Customer ID</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Name</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Phone</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Amount</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Frequency</th>
                <th style={{ padding: 12, textAlign: 'left' }}>week</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Status</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Next Charge</th>
              </tr>
            </thead>
            <tbody>
              {mandates.map((m, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #D1DFDE' }}>
                  <td style={{ padding: 12 }}>{m.customer_id || '—'}</td>
                  <td style={{ padding: 12 }}>{m.name || '—'}</td>
                  <td style={{ padding: 12 }}>{m.phone || '—'}</td>
                  <td style={{ padding: 12 }}>₹{m.amount}</td>
                  <td style={{ padding: 12 }}>{m.frequency === 'daily' ? 'Weekly' : 'Monthly'}</td>
                  <td style={{ padding: 12 }}>{m.frequency === 'daily' ? '—' : m.recharge_day}</td>
                  <td style={{ padding: 12 }}>{m.status}</td>
                  <td style={{ padding: 12 }}>{m.next_charge_date || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}