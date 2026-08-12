import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api'

const API_BASE = 'https://bitbyte-backend-f66f.onrender.com'

const getImageUrl = img => {
  if (!img) return null
  if (img.startsWith('http://') || img.startsWith('https://')) return img
  return `${API_BASE}/${img.replace(/^\/+/, '')}`
}

export default function AddBanners() {
  const navigate = useNavigate()
  const [banners, setBanners] = useState({})       // { 1: bannerObj, 2: bannerObj, ... }
  const [previews, setPreviews] = useState({})     // { 1: fileObj, 2: fileObj, ... }
  const [previewUrls, setPreviewUrls] = useState({}) // { 1: url, 2: url, ... }
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [lightbox, setLightbox] = useState(null)

  const dark = false
  const bg = 'linear-gradient(135deg,#FDFDFC 0%,#F3F3F0 52%,#E7EDEC 100%)'
  const text = '#111817'
  const subtext = '#7A8987'
  const border = 'rgba(189,207,206,0.78)'
  const glass = 'rgba(253,253,252,0.94)'
  const inpBorder = '#BDCFCE'
  const cardBg = '#FDFDFC'

  useEffect(() => { fetchBanners() }, [])

  const fetchBanners = async () => {
    try {
      const res = await api.get('/home-banners/')
      const map = {}
      res.data.forEach(b => { map[b.slot] = b })
      setBanners(map)
    } catch { }
  }

  const handleFileChange = (slot, file) => {
    if (!file) return
    setPreviews(p => ({ ...p, [slot]: file }))
    setPreviewUrls(p => ({ ...p, [slot]: URL.createObjectURL(file) }))
  }

  const handleSubmit = async () => {
    const slots = Object.keys(previews)
    if (slots.length === 0) { setMsg('❌ No images selected'); return }
    setSaving(true)
    setMsg('')
    try {
      for (const slot of slots) {
        const fd = new FormData()
        fd.append('slot', slot)
        fd.append('image', previews[slot])
        await api.post('/home-banners/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      }
      setMsg('✅ Banners saved successfully!')
      setPreviews({})
      setPreviewUrls({})
      fetchBanners()
    } catch (err) {
      setMsg('❌ ' + JSON.stringify(err.response?.data || err.message))
    }
    setSaving(false)
  }

  const handleEdit = async (slot) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async e => {
      const file = e.target.files[0]
      if (!file) return
      const banner = banners[slot]
      if (!banner) return
      const fd = new FormData()
      fd.append('image', file)
      try {
        await api.patch(`/home-banners/${banner.id}/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        setMsg(`✅ Banner ${slot} updated!`)
        fetchBanners()
      } catch { setMsg('❌ Update failed') }
    }
    input.click()
  }

  const handleDelete = async (slot) => {
    const banner = banners[slot]
    if (!banner) return
    if (!window.confirm(`Delete Banner ${slot}?`)) return
    try {
      await api.delete(`/home-banners/${banner.id}/`)
      setMsg(`✅ Banner ${slot} deleted!`)
      fetchBanners()
    } catch { setMsg('❌ Delete failed') }
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text, fontFamily: '"Inter",system-ui,sans-serif' }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Navbar */}
      <div style={{ background: glass, borderBottom: `1px solid ${border}`, padding: '14px 28px', display: 'flex', alignItems: 'center', gap: '16px', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ color: '#0C4044', fontWeight: 900, fontSize: '16px' }}>🖼️ Add Banners</div>
        <div style={{ flex: 1 }} />
        <button onClick={() => navigate('/add-product')}
          style={{ padding: '7px 14px', background: 'rgba(201,32,53,0.08)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>
          ← Back
        </button>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Message */}
        {msg && (
<div style={{ background: msg.includes('✅') ? 'rgba(12,64,68,0.1)' : 'rgba(201,32,53,0.1)', border: `1px solid ${msg.includes('✅') ? 'rgba(12,64,68,0.3)' : 'rgba(201,32,53,0.3)'}`, color: msg.includes('✅') ? '#0C4044' : '#C92035', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px', fontSize: '13px' }}>
            {msg}
          </div>
        )}

<div style={{ color: '#0C4044', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '24px' }}>
          Home Banner — 5 Slots
        </div>

        {/* 5 Banner Slots */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
          {[1, 2, 3, 4, 5].map(slot => {
            const existing = banners[slot]
            const newPreview = previewUrls[slot]
            const displayUrl = newPreview || (existing ? getImageUrl(existing.image) : null)

            return (
              <div key={slot} style={{ background: cardBg, border: `1px solid ${inpBorder}`, borderRadius: '16px', padding: '20px 24px', animation: 'fadeIn 0.3s ease', display: 'flex', gap: '24px', alignItems: 'center' }}>

                {/* Slot label */}
                <div style={{ width: '80px', flexShrink: 0 }}>
                  <div style={{ color: '#0C4044', fontWeight: 900, fontSize: '13px', marginBottom: '4px' }}>Banner {slot}</div>
                  {existing && !newPreview && (
                    <div style={{ fontSize: '9px', color: '#0C4044', fontWeight: 700, background: 'rgba(12,64,68,0.1)', border: '1px solid rgba(12,64,68,0.3)', borderRadius: '20px', padding: '2px 8px', display: 'inline-block' }}>● LIVE</div>
                  )}
                  {newPreview && (
                    <div style={{ fontSize: '9px', color: '#9F6130', fontWeight: 700, background: 'rgba(204,168,129,0.15)', border: '1px solid rgba(204,168,129,0.35)', borderRadius: '20px', padding: '2px 8px', display: 'inline-block' }}>NEW</div>
                  )}
                </div>

                {/* Image preview */}
                <div
style={{ width: '260px', height: '100px', borderRadius: '10px', overflow: 'hidden', background: '#F3F3F0', border: `1px solid ${inpBorder}`, flexShrink: 0, cursor: displayUrl ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => displayUrl && setLightbox(displayUrl)}
                >
                  {displayUrl
                    ? <img src={displayUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={`Banner ${slot}`} />
                    : <span style={{ color: subtext, fontSize: '12px' }}>No image</span>
                  }
                </div>

                {/* Upload input (for new banners) */}
                <div style={{ flex: 1 }}>
                  {!existing ? (
                    <>
                      <label htmlFor={`banner-slot-${slot}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'rgba(12,64,68,0.08)', border: '2px dashed rgba(12,64,68,0.4)', borderRadius: '10px', cursor: 'pointer', color: '#0C4044', fontWeight: 700, fontSize: '13px', width: 'fit-content' }}>
                        📷 Upload Image
                      </label>
                      <input id={`banner-slot-${slot}`} type="file" accept="image/*" style={{ display: 'none' }}
                        onChange={e => handleFileChange(slot, e.target.files[0])} />
                      {newPreview && (
                        <div style={{ color: '#0C4044', fontSize: '11px', marginTop: '8px' }}>✅ Ready to save</div>
                      )}
                    </>
                  ) : (
                    // Existing banner — show edit/delete
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => handleEdit(slot)}
                        style={{ padding: '9px 20px', background: 'linear-gradient(135deg,#0C4044,#073B3F)', border: 'none', borderRadius: '10px', color: '#FDFDFC', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}>
                        ✏️ Edit
                      </button>
                      <button onClick={() => handleDelete(slot)}
                        style={{ padding: '9px 20px', background: 'rgba(201,32,53,0.1)', border: '1px solid rgba(201,32,53,0.35)', borderRadius: '10px', color: '#C92035', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}>
                        🗑 Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Submit button — only if new previews exist */}
        {Object.keys(previews).length > 0 && (
          <button disabled={saving} onClick={handleSubmit}
            style={{ padding: '13px 40px', background: saving ? 'rgba(12,64,68,0.22)' : 'linear-gradient(135deg,#0C4044,#073B3F)', border: 'none', borderRadius: '12px', fontWeight: 900, fontSize: '14px', color: saving ? '#0C4044' : '#FDFDFC', cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? '⏳ Saving...' : `✅ Save ${Object.keys(previews).length} Banner(s)`}
          </button>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={lightbox} style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '12px' }} />
<button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(201,32,53,0.85)', border: 'none', color: '#FDFDFC', width: 36, height: 36, borderRadius: '50%', fontSize: 16, cursor: 'pointer', fontWeight: 900 }}>✕</button>
        </div>
      )}
    </div>
  )
}