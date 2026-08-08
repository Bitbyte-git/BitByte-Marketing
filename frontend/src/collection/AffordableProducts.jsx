import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomerNavbar from './CustomerNavbar'
import CustomerFooter from './CustomerFooter'

export default function AffordableProducts() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

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

  if (loading) return (
    <>
      <CustomerNavbar />
      <div style={{
        minHeight: '50vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 14,
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: '50%',
          border: '3px solid #D1DFDE', borderTopColor: '#073B3F',
          animation: 'coinLoadSpin 800ms linear infinite',
        }} />
        <span style={{ color: '#7A8987', fontWeight: 700, fontSize: 14 }}>
          Loading your coin offers...
        </span>
        <style>{`
          @keyframes coinLoadSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
      <CustomerFooter />
    </>
  )
  if (!data) return (
    <>
      <CustomerNavbar />
      <div style={{ padding: 60, textAlign: 'center', color: '#7A8987', fontWeight: 700 }}>Something went wrong.</div>
      <CustomerFooter />
    </>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#FDFDFC' }}>
      <CustomerNavbar />
      <div style={{ padding: '32px clamp(20px,4vw,60px)' }}>
        <h2 style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: '#1a1a1a', fontSize: '1.7rem', fontWeight: 600 }}>
          Products you can buy with your coins
        </h2>
        <p style={{ color: '#7A8987', marginTop: 8, marginBottom: 24, fontSize: 14 }}>
          You have {data.wallet_coins.toLocaleString()} coins (₹{data.max_affordable_price} value)
        </p>

        {data.products.length === 0 ? (
          <p style={{ color: '#7A8987' }}>No products available within your coin balance yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            {data.products.map(p => (
              <div
                key={p.id}
                onClick={() => navigate(`/product-display?category=${p.category}&metal=${p.metal}&id=${p.id}`)}
                style={{
                  border: '1px solid #eef0ef', borderRadius: 16, overflow: 'hidden',
                  background: '#fff', cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(7,59,63,0.06), 0 8px 24px rgba(7,59,63,0.08)',
                }}
              >
                {p.image && (
                  <img src={p.image} alt={p.name} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                )}
                <div style={{ padding: 13 }}>
                  <h4 style={{ margin: '0 0 5px', fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{p.name}</h4>
                  <p style={{ color: '#1a1a1a', fontWeight: 700, fontSize: 14 }}>₹{p.price}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <CustomerFooter />
    </div>
  )
}