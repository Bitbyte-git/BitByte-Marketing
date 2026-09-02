import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import InternalRoleNavbar from '../collection/InternalRoleNavbar'

function SectionHeader({ icon, label }) {
  const paths = {
    shop: <><rect x="3" y="10" width="18" height="11" rx="2" /><path d="M3 10 5 3h14l2 7" /><path d="M9 21v-6h6v6" /></>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>,
    briefcase: <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>,
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', marginBottom: '20px', background: 'linear-gradient(90deg, rgba(12,64,68,0.08), rgba(12,64,68,0.02))' }}>
      <div style={{ width: '30px', height: '30px', borderRadius: '9px', flexShrink: 0, background: 'linear-gradient(135deg,#0C4044,#073B3F)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FDFDFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {paths[icon] || paths.shop}
        </svg>
      </div>
      <span style={{ color: '#0C4044', fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
    </div>
  )
}

const PROFILE_FIELDS = [
  ['shop_name', 'Shop Name'], ['owner_name', 'Owner Name'],
  ['mobile_number', 'Mobile Number'], ['whatsapp_number', 'WhatsApp Number'],
  ['shop_address', 'Shop Address'], ['pincode', 'Pincode'],
  ['street_name', 'Street Name'], ['city', 'City'], ['district', 'District'], ['state', 'State'],
  ['pan_no', 'PAN'], ['gst_no', 'GST'], ['msme_no', 'MSME'],
]

export default function ShopDashboard() {
  const navigate = useNavigate()
  const [shop, setShop] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showProfile, setShowProfile] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [announcements, setAnnouncements] = useState([])
  const [showAnnouncements, setShowAnnouncements] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const text = '#111817'
  const subtext = '#7A8987'
  const border = 'rgba(189,207,206,0.78)'
  const inpBg = '#FDFDFC'
  const inpBorder = '#BDCFCE'
  const cardStyle = { background: '#FDFDFC', border: `1px solid ${border}`, borderRadius: '22px', padding: '34px 38px', marginBottom: '26px', boxShadow: '0 22px 58px rgba(7,59,63,0.08)' }
  const secHead = { color: '#0C4044', fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.16em', margin: '0 0 22px', paddingBottom: '15px', borderBottom: `1px solid ${border}` }
  const inp = { width: '100%', background: inpBg, border: `1px solid ${inpBorder}`, borderRadius: '12px', padding: '13px 16px', color: text, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }
  const lbl = { display: 'block', color: subtext, fontSize: '11px', fontWeight: 800, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.09em' }
  const sectionCard = { background: '#FDFDFC', border: '1px solid rgba(189,207,206,0.55)', borderRadius: '16px', padding: '22px 24px', marginBottom: '4px' }

  const fetchShopInfo = async () => {
    setLoading(true)
    try {
      const res = await api.get('/my-shop-profile/')
      setShop(res.data)
    } catch (err) {
      console.error('Shop profile fetch error:', err)
    }
    setLoading(false)
  }

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/announcements/')
      const sorted = res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setAnnouncements(sorted)
      const lastSeen = parseInt(localStorage.getItem('shopAnnouncementSeen') || '0')
      setUnreadCount(sorted.filter(a => new Date(a.created_at).getTime() > lastSeen).length)
    } catch { /* ignore */ }
  }

  useEffect(() => { fetchShopInfo(); fetchAnnouncements() }, [])

  const openEdit = () => {
    const next = {}
    PROFILE_FIELDS.forEach(([key]) => { next[key] = shop?.[key] || '' })
    next.shop_type = shop?.shop_type || 'live'
    setEditForm(next)
    setSaveMsg('')
    setShowEdit(true)
  }

  const handleEditChange = e => setEditForm({ ...editForm, [e.target.name]: e.target.value })

  const submitEdit = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.patch('/my-shop-profile/', editForm)
      setShop(res.data)
      setSaveMsg('Profile updated successfully!')
      setTimeout(() => setShowEdit(false), 1200)
    } catch (err) {
      setSaveMsg('Error: ' + JSON.stringify(err.response?.data))
    }
    setSaving(false)
  }

  const handleLogout = () => { localStorage.clear(); navigate('/login') }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#FDFDFC 0%,#F3F3F0 46%,#E7EDEC 100%)', color: text, fontFamily: '"Inter",system-ui,sans-serif' }}>
      <InternalRoleNavbar
        roleTitle="SHOP"
        homePath="/shop-dashboard"
        managementItems={[
          { label: 'Dashboard', path: '/shop-dashboard' },
          { label: 'My Profile', action: () => { setShowProfile(true); fetchShopInfo() } },
        ]}
        celebrationItems={[]}
        announcementItems={[
          { label: 'View Announcements', action: () => { setShowAnnouncements(true); localStorage.setItem('shopAnnouncementSeen', Date.now().toString()); setUnreadCount(0) }, badge: unreadCount },
        ]}
        coinItems={[]}
        reportItems={[]}
        actionItems={[
          { label: 'Profile', icon: 'user', action: () => { setShowProfile(true); fetchShopInfo() } },
          { label: 'Announcements', icon: 'bell', action: () => { setShowAnnouncements(true); localStorage.setItem('shopAnnouncementSeen', Date.now().toString()); setUnreadCount(0) }, badge: unreadCount },
          { label: 'Logout', icon: 'logout', variant: 'danger', action: handleLogout },
        ]}
      />

      <div style={{ padding: '42px 46px 56px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ marginBottom: '26px' }}>
          <div style={{ color: '#BB8958', fontSize: '12px', fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '8px' }}>Shop Panel</div>
          <h2 style={{ fontSize: 'clamp(30px,4vw,50px)', lineHeight: 0.95, fontFamily: 'Georgia, serif', color: '#0C4044', fontWeight: 500, margin: 0 }}>
            {loading ? 'Loading...' : shop?.shop_name || 'Shop Dashboard'}
          </h2>
        </div>

        <div style={cardStyle}>
          <p style={secHead}>Shop Overview</p>
          {loading ? (
            <div style={{ textAlign: 'center', color: subtext, padding: '40px 0' }}>Loading...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '16px' }}>
              {[
                ['Shop ID', shop?.shop_id],
                ['Shop Type', shop?.shop_type === 'live' ? 'Physical Shop' : 'Virtual Shop'],
                ['Owner Name', shop?.owner_name],
                ['Mobile Number', shop?.mobile_number],
                ['WhatsApp Number', shop?.whatsapp_number],
                ['Email', shop?.email],
                ['City', shop?.city],
                ['District', shop?.district],
                ['State', shop?.state],
              ].map(([label, value]) => (
                <div key={label} style={{ padding: '16px', border: `1px solid ${border}`, borderRadius: '14px', background: 'rgba(189,207,206,0.06)' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: subtext, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{label}</div>
                  <div style={{ fontSize: '14px', color: text, fontWeight: 650 }}>{value || 'Not provided'}</div>
                </div>
              ))}
            </div>
          )}
          <button onClick={openEdit} style={{ marginTop: '20px', padding: '11px 24px', background: 'linear-gradient(90deg,#0C4044,#BDCFCE)', border: 'none', borderRadius: '12px', fontWeight: 800, color: '#FDFDFC', fontSize: '13px', cursor: 'pointer' }}>
            ✎ Edit Profile
          </button>
        </div>
      </div>

      {/* ── PROFILE VIEW MODAL ── */}
      {showProfile && (
        <div onClick={() => setShowProfile(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.82)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#FDFDFC', border: '1px solid rgba(12,64,68,0.3)', borderRadius: '24px', width: '95%', maxWidth: '580px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(17,24,23,0.7)' }}>
            <div style={{ padding: '24px 28px', borderBottom: `1px solid rgba(12,64,68,0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: '#0C4044', fontWeight: 800, fontSize: '15px' }}>MY SHOP PROFILE</div>
                <div style={{ color: subtext, fontSize: '11px', marginTop: '3px', fontFamily: 'monospace' }}>{shop?.shop_id || '—'}</div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={openEdit} style={{ background: 'rgba(12,64,68,0.12)', border: '1px solid rgba(12,64,68,0.35)', color: '#0C4044', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: 800 }}>✎ Edit</button>
                <button onClick={() => setShowProfile(false)} style={{ background: 'rgba(201,32,53,0.1)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px' }}>✕ Close</button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {[
                ['Shop Name', shop?.shop_name], ['Owner Name', shop?.owner_name],
                ['Shop Type', shop?.shop_type === 'live' ? 'Physical Shop' : 'Virtual Shop'],
                ['Email', shop?.email], ['Mobile', shop?.mobile_number], ['WhatsApp', shop?.whatsapp_number],
                ['Address', shop?.shop_address], ['Pincode', shop?.pincode], ['Street', shop?.street_name],
                ['City', shop?.city], ['District', shop?.district], ['State', shop?.state],
                ['PAN', shop?.pan_no], ['GST', shop?.gst_no], ['MSME', shop?.msme_no],
              ].map(([label, value]) => (
                <div key={label}>
                  <div style={{ color: subtext, fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
                  <div style={{ color: text, fontSize: '13px' }}>{value || '—'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PROFILE EDIT MODAL ── */}
      {showEdit && (
        <div onClick={() => setShowEdit(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.88)', backdropFilter: 'blur(12px)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <form onSubmit={submitEdit} onClick={e => e.stopPropagation()} style={{ background: '#FDFDFC', border: '1px solid rgba(12,64,68,0.35)', borderRadius: '24px', width: '96%', maxWidth: '760px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', boxShadow: '0 32px 90px rgba(17,24,23,0.8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ color: '#0C4044', fontWeight: 900, fontSize: '15px' }}>✎ EDIT SHOP PROFILE</div>
              <button type="button" onClick={() => setShowEdit(false)} style={{ background: 'rgba(201,32,53,0.1)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer' }}>✕ Close</button>
            </div>

            {saveMsg && (
              <div style={{ background: saveMsg.includes('successfully') ? 'rgba(12,64,68,0.1)' : 'rgba(201,32,53,0.1)', border: `1px solid ${saveMsg.includes('successfully') ? 'rgba(12,64,68,0.3)' : 'rgba(201,32,53,0.3)'}`, color: saveMsg.includes('successfully') ? '#0C4044' : '#C92035', borderRadius: '12px', padding: '12px 16px', fontSize: '13px', marginBottom: '18px' }}>
                {saveMsg}
              </div>
            )}

            <div style={sectionCard}>
              <SectionHeader icon="shop" label="Shop Info" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div><label style={lbl}>Shop Name</label><input name="shop_name" value={editForm.shop_name || ''} onChange={handleEditChange} style={inp} /></div>
                <div><label style={lbl}>Owner Name</label><input name="owner_name" value={editForm.owner_name || ''} onChange={handleEditChange} style={inp} /></div>
                <div>
                  <label style={lbl}>Shop Type</label>
                  <select name="shop_type" value={editForm.shop_type || 'live'} onChange={handleEditChange} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="live">Physical Shop</option>
                    <option value="virtual">Virtual Shop</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ ...sectionCard, marginTop: '16px' }}>
              <SectionHeader icon="lock" label="Contact" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div><label style={lbl}>Mobile Number</label><input name="mobile_number" maxLength={10} value={editForm.mobile_number || ''} onChange={handleEditChange} style={inp} /></div>
                <div><label style={lbl}>WhatsApp Number</label><input name="whatsapp_number" maxLength={10} value={editForm.whatsapp_number || ''} onChange={handleEditChange} style={inp} /></div>
              </div>
            </div>

            <div style={{ ...sectionCard, marginTop: '16px' }}>
              <SectionHeader icon="pin" label="Address" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: 'span 2' }}><label style={lbl}>Shop Address</label><input name="shop_address" value={editForm.shop_address || ''} onChange={handleEditChange} style={inp} /></div>
                <div><label style={lbl}>Pincode</label><input name="pincode" maxLength={6} value={editForm.pincode || ''} onChange={handleEditChange} style={inp} /></div>
                <div><label style={lbl}>Street Name</label><input name="street_name" value={editForm.street_name || ''} onChange={handleEditChange} style={inp} /></div>
                <div><label style={lbl}>City</label><input name="city" value={editForm.city || ''} onChange={handleEditChange} style={inp} /></div>
                <div><label style={lbl}>District</label><input name="district" value={editForm.district || ''} onChange={handleEditChange} style={inp} /></div>
                <div><label style={lbl}>State</label><input name="state" value={editForm.state || ''} onChange={handleEditChange} style={inp} /></div>
              </div>
            </div>

            <div style={{ ...sectionCard, marginTop: '16px' }}>
              <SectionHeader icon="briefcase" label="Identity (Optional)" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div><label style={lbl}>PAN</label><input name="pan_no" maxLength={10} value={editForm.pan_no || ''} onChange={handleEditChange} style={inp} /></div>
                <div><label style={lbl}>GST</label><input name="gst_no" maxLength={15} value={editForm.gst_no || ''} onChange={handleEditChange} style={inp} /></div>
                <div><label style={lbl}>MSME</label><input name="msme_no" maxLength={25} value={editForm.msme_no || ''} onChange={handleEditChange} style={inp} /></div>
              </div>
            </div>

            <button type="submit" disabled={saving} style={{ marginTop: '20px', width: '100%', padding: '14px', background: saving ? 'rgba(12,64,68,0.4)' : 'linear-gradient(90deg,#0C4044,#BDCFCE)', border: 'none', borderRadius: '12px', fontWeight: 900, color: '#FDFDFC', fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* ── ANNOUNCEMENTS MODAL ── */}
      {showAnnouncements && (
        <div onClick={() => setShowAnnouncements(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.82)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#FDFDFC', border: '1px solid rgba(12,64,68,0.3)', borderRadius: '24px', width: '95%', maxWidth: '560px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(17,24,23,0.6)' }}>
            <div style={{ padding: '24px 28px', borderBottom: `1px solid rgba(12,64,68,0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ color: '#0C4044', fontWeight: 800, fontSize: '14px' }}>ANNOUNCEMENTS</div>
              <button onClick={() => setShowAnnouncements(false)} style={{ background: 'rgba(201,32,53,0.1)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px' }}>✕ Close</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {announcements.length === 0 ? (
                <div style={{ textAlign: 'center', color: subtext, padding: '60px 0' }}>No announcements yet.</div>
              ) : announcements.map((ann, idx) => (
                <div key={ann.id} style={{ background: idx === 0 ? 'rgba(12,64,68,0.05)' : '#FFFFFF', border: `1px solid ${idx === 0 ? 'rgba(12,64,68,0.3)' : border}`, borderRadius: '14px', padding: '16px 18px' }}>
                  <div style={{ color: idx === 0 ? '#0C4044' : text, fontWeight: 700, fontSize: '14px', marginBottom: '6px' }}>{ann.title}</div>
                  <div style={{ color: subtext, fontSize: '13px', lineHeight: 1.6 }}>{ann.message}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}