import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import logo from '../assets/logo.png'

export default function ShopDashboard() {
  const navigate = useNavigate()
  const [shop, setShop] = useState(null)
  const [loading, setLoading] = useState(true)

  const text = '#111817'
  const subtext = '#7A8987'
  const border = 'rgba(189,207,206,0.78)'

  const fetchShopInfo = async () => {
    setLoading(true)
    try {
      const res = await api.get('/dashboard/')
      setShop(res.data)
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    }
    setLoading(false)
  }

  useEffect(() => { fetchShopInfo() }, [])

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: subtext }}>
        Loading your shop dashboard...
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#FDFDFC 0%,#F3F3F0 46%,#E7EDEC 100%)', padding: '34px', fontFamily: '"Manrope","Inter",system-ui,sans-serif' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img src={logo} alt="Luxiva" style={{ width: 44, height: 44, objectFit: 'contain' }} />
            <div>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: text }}>{shop?.shop_name || 'Shop Dashboard'}</h2>
              <div style={{ fontSize: '12px', color: subtext, marginTop: '2px' }}>{shop?.shop_id}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ padding: '10px 20px', background: 'rgba(201,32,53,0.1)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '10px', fontSize: '13px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>

        <div style={{ background: '#FDFDFC', border: `1px solid ${border}`, borderRadius: '22px', padding: '30px 34px', boxShadow: '0 22px 58px rgba(7,59,63,0.08)' }}>
          <div style={{ color: '#0C4044', fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px', paddingBottom: '14px', borderBottom: `1px solid ${border}` }}>
            Shop Details
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              ['Shop Type', shop?.shop_type === 'live' ? 'Physical Shop' : 'Virtual Shop'],
              ['Owner Name', shop?.owner_name],
              ['Mobile Number', shop?.mobile_number],
              ['WhatsApp Number', shop?.whatsapp_number],
              ['Email', shop?.email],
              ['Shop Address', shop?.shop_address],
              ['Pincode', shop?.pincode],
              ['Street', shop?.street_name],
              ['City', shop?.city],
              ['District', shop?.district],
              ['State', shop?.state],
              ['PAN', shop?.pan_no],
              ['GST', shop?.gst_no],
              ['MSME', shop?.msme_no],
            ].map(([label, value]) => (
              <div key={label} style={{ padding: '14px', border: `1px solid ${border}`, borderRadius: '12px', background: 'rgba(189,207,206,0.06)' }}>
                <div style={{ fontSize: '9px', fontWeight: 800, color: subtext, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>{label}</div>
                <div style={{ fontSize: '14px', color: text, fontWeight: 650 }}>{value || 'Not provided'}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}