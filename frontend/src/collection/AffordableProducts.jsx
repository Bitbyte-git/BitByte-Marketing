import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AffordableProducts() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { default: api } = await import('../api')
        const res = await api.get('/products/affordable/')
        setData(res.data)
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>
  if (!data) return <div style={{ padding: 40 }}>Something went wrong.</div>

  return (
    <div style={{ padding: 32 }}>
      <h2 style={{ fontFamily: 'Georgia, serif', color: '#073B3F' }}>
        Products you can buy with your coins
      </h2>
      <p style={{ color: '#7A8987', marginBottom: 24 }}>
        You have {data.wallet_coins.toLocaleString()} coins (₹{data.max_affordable_price} value)
      </p>

      {data.products.length === 0 ? (
        <p>No products available within your coin balance yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
          {data.products.map(p => (
            <div
              key={p.id}
              onClick={() => navigate(`/product/${p.id}`)}
              style={{ border: '1px solid #D1DFDE', borderRadius: 10, padding: 12, cursor: 'pointer' }}
            >
              {p.image && (
                <img src={p.image} alt={p.name} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8 }} />
              )}
              <h4 style={{ margin: '10px 0 4px' }}>{p.name}</h4>
              <p style={{ color: '#073B3F', fontWeight: 700 }}>₹{p.price}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}