import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import logo from '../assets/logo.png'
import CopyUrlButton from '../collection/CopyUrlButton'

export default function AddShop() {
  const navigate = useNavigate()
  const text = '#111817'
  const subtext = '#7A8987'
  const border = 'rgba(189,207,206,0.78)'
  const inpBg = '#FDFDFC'
  const inpBorder = '#BDCFCE'

  const [form, setForm] = useState({
    shop_name: '', owner_name: '', mobile_number: '', whatsapp_number: '',
    email: '', password: '',
    shop_address: '', pincode: '', street_name: '', city: '', district: '', state: '',
    shop_type: 'live',
    pan_no: '', gst_no: '', msme_no: '',
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [pincodeLookupMsg, setPincodeLookupMsg] = useState('')

  const handleChange = e => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const handlePincodeChange = async (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setForm(prev => ({ ...prev, pincode: value }))
    setPincodeLookupMsg('')
    if (value.length === 6) {
      setPincodeLookupMsg('Fetching location details...')
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${value}`)
        const data = await res.json()
        if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
          const po = data[0].PostOffice[0]
          setForm(prev => ({ ...prev, city: po.District || prev.city, district: po.District || prev.district, state: po.State || prev.state }))
          setPincodeLookupMsg('Location details auto-filled')
        } else {
          setPincodeLookupMsg('Pincode not found — please enter manually')
        }
      } catch {
        setPincodeLookupMsg('Unable to fetch location — please enter manually')
      }
    }
  }

  const s = {
    card: { background: '#FDFDFC', border: `1px solid ${border}`, borderRadius: '22px', padding: '34px 38px', boxShadow: '0 22px 58px rgba(7,59,63,0.08)' },
    secHead: { color: '#0C4044', fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 20px', paddingBottom: '14px', borderBottom: `1px solid ${border}` },
    lbl: { display: 'block', color: subtext, fontSize: '10.5px', fontWeight: 700, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' },
    inp: { width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '9px', padding: '10px 13px', color: text, fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' },
    section: { background: '#FDFDFC', border: '1px solid rgba(189,207,206,0.55)', borderRadius: '16px', padding: '22px 24px', marginBottom: '20px' },
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (form.password !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    setSaving(true)
    try {
      await api.post('/shops/', form)
      setMsg('Shop created successfully!')
      setTimeout(() => navigate('/super-admin'), 1200)
    } catch (err) {
      setMsg('Error: ' + JSON.stringify(err.response?.data))
    }
    setSaving(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#FDFDFC 0%,#F3F3F0 46%,#E7EDEC 100%)', padding: '34px', fontFamily: '"Manrope","Inter",system-ui,sans-serif' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img src={logo} alt="Luxiva" style={{ width: 44, height: 44, objectFit: 'contain' }} />
            <div>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: text }}>Add New Shop</h2>
              <div style={{ fontSize: '12px', color: subtext, marginTop: '2px' }}>Create a shop/branch record</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <CopyUrlButton />
            <button onClick={() => navigate(-1)} style={{ padding: '10px 20px', background: '#FFFFFF', border: `1px solid ${border}`, borderRadius: '10px', color: subtext, fontSize: '13px', cursor: 'pointer' }}>Back</button>
          </div>
        </div>

        {msg && (
          <div style={{ background: msg.includes('successfully') ? 'rgba(12,64,68,0.1)' : 'rgba(201,32,53,0.1)', border: `1px solid ${msg.includes('successfully') ? 'rgba(12,64,68,0.25)' : 'rgba(201,32,53,0.3)'}`, color: msg.includes('successfully') ? '#0C4044' : '#C92035', borderRadius: '12px', padding: '14px 20px', fontSize: '14px', marginBottom: '20px' }}>
            {msg}
          </div>
        )}

        <div style={s.card}>
          <form onSubmit={handleSubmit}>

            {/* Shop Info */}
            <div style={s.section}>
              <div style={s.secHead}>Shop Info</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div><label style={s.lbl}>Shop Name *</label><input name="shop_name" value={form.shop_name} onChange={handleChange} required style={s.inp} /></div>
                <div><label style={s.lbl}>Owner Name *</label><input name="owner_name" value={form.owner_name} onChange={handleChange} required style={s.inp} /></div>
                <div>
                  <label style={s.lbl}>Select Shop *</label>
                                    <select name="shop_type" value={form.shop_type} onChange={handleChange} required style={{ ...s.inp, cursor: 'pointer' }}>
                    <option value="live">Physical Shop</option>
                    <option value="virtual">Virtual Shop</option>
                  </select>
                </div>
                <div>
                  <label style={s.lbl}>Shop ID</label>
                  <div style={{ ...s.inp, opacity: 0.55, cursor: 'not-allowed' }}>
                    <span style={{ color: '#53615F', fontFamily: 'monospace', fontSize: '13px' }}>BBJS{new Date().getFullYear()}</span>
                    <span style={{ color: '#7A8987', fontSize: '12px', marginLeft: '6px' }}>&lt;auto-generated&gt;</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact + Account */}
            <div style={s.section}>
              <div style={s.secHead}>Contact & Account</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div><label style={s.lbl}>Mobile Number *</label><input name="mobile_number" maxLength={10} value={form.mobile_number} onChange={handleChange} required style={s.inp} /></div>
                <div><label style={s.lbl}>WhatsApp Number</label><input name="whatsapp_number" maxLength={10} value={form.whatsapp_number} onChange={handleChange} style={s.inp} /></div>
                <div><label style={s.lbl}>Email ID *</label><input type="email" name="email" value={form.email} onChange={handleChange} required style={s.inp} /></div>
                <div><label style={s.lbl}>Password *</label><input type="password" name="password" value={form.password} onChange={handleChange} required style={s.inp} /></div>
                <div>
                  <label style={s.lbl}>Confirm Password *</label>
                  <input type="password" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setPasswordError('') }} required style={{ ...s.inp, border: `1px solid ${passwordError ? '#C92035' : inpBorder}` }} />
                  {passwordError && <div style={{ color: '#C92035', fontSize: '12px', marginTop: '6px' }}>{passwordError}</div>}
                </div>
              </div>
            </div>

            {/* Address */}
            <div style={s.section}>
              <div style={s.secHead}>Shop Address</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: 'span 3' }}><label style={s.lbl}>Shop Address *</label><input name="shop_address" value={form.shop_address} onChange={handleChange} required style={s.inp} /></div>
                <div>
                  <label style={s.lbl}>Pincode *</label>
                  <input name="pincode" value={form.pincode} onChange={handlePincodeChange} required maxLength={6} inputMode="numeric" style={s.inp} />
                  {pincodeLookupMsg && <div style={{ fontSize: '11px', fontWeight: 700, marginTop: '4px', color: pincodeLookupMsg.includes('auto-filled') ? '#0C4044' : '#C92035' }}>{pincodeLookupMsg}</div>}
                </div>
                <div><label style={s.lbl}>Street Name *</label><input name="street_name" value={form.street_name} onChange={handleChange} required style={s.inp} /></div>
                <div><label style={s.lbl}>City *</label><input name="city" value={form.city} onChange={handleChange} required style={s.inp} /></div>
                <div><label style={s.lbl}>District *</label><input name="district" value={form.district} onChange={handleChange} required style={s.inp} /></div>
                <div><label style={s.lbl}>State *</label><input name="state" value={form.state} onChange={handleChange} required style={s.inp} /></div>
              </div>
            </div>

            {/* Optional Identity */}
            <div style={s.section}>
              <div style={s.secHead}>Identity (Optional)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div><label style={s.lbl}>PAN</label><input name="pan_no" maxLength={10} value={form.pan_no} onChange={handleChange} style={s.inp} /></div>
                <div><label style={s.lbl}>GST</label><input name="gst_no" maxLength={15} value={form.gst_no} onChange={handleChange} style={s.inp} /></div>
                <div><label style={s.lbl}>MSME</label><input name="msme_no" maxLength={25} value={form.msme_no} onChange={handleChange} style={s.inp} /></div>
              </div>
            </div>

            <button type="submit" disabled={saving} style={{ padding: '13px 30px', background: saving ? 'rgba(12,64,68,0.4)' : 'linear-gradient(90deg,#BDCFCE,#0C4044)', border: 'none', borderRadius: '12px', fontWeight: 800, color: '#FDFDFC', fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Creating...' : 'Create Shop'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}