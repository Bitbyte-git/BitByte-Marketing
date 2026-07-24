import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import CustomerFooter from './CustomerFooter'

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function capitalize(str) {
  if (!str) return '-'
  return String(str).charAt(0).toUpperCase() + String(str).slice(1)
}

function money(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount <= 0) return '-'
  return `Rs. ${amount.toLocaleString('en-IN')}`
}

const PROFILE_FIELDS = [
  ['initial', 'Initial'],
  ['first_name', 'First Name'],
  ['last_name', 'Last Name'],
  ['mobile_number', 'Mobile Number'],
  ['gender', 'Gender'],
  ['dob', 'DOB'],
  ['married_status', 'Marital Status'],
  ['anniversary_date', 'Anniversary Date'],
  ['door_no', 'Door No'],
  ['street_name', 'Street'],
  ['town_name', 'Town'],
  ['city_name', 'City'],
  ['district', 'District'],
  ['state', 'State'],
  ['aadhaar_no', 'Aadhaar No'],
  ['pan_no', 'PAN No'],
  ['occupation', 'Occupation'],
  ['occupation_detail', 'Occupation Detail'],
  ['annual_salary', 'Annual Salary'],
]

const TABS = [
  { id: 'personal', label: 'Personal' },
  { id: 'address', label: 'Address' },
  { id: 'identity', label: 'Identity' },
  { id: 'account', label: 'Account' },
]

function FieldCard({ label, value, wide = false, onCopy }) {
  return (
    <button className={`profile-field${wide ? ' wide' : ''}`} type="button" onClick={onCopy}>
      <span>{label}</span>
      <strong>{value || '-'}</strong>
      {onCopy && <small>Click to copy</small>}
    </button>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [slow, setSlow] = useState(false)
  const [activeTab, setActiveTab] = useState('personal')
  const [copied, setCopied] = useState('')

  const [showEdit, setShowEdit] = useState(false)
  const [updateForm, setUpdateForm] = useState({})
  const [updateMessage, setUpdateMessage] = useState('')
  const [proofDocument, setProofDocument] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState('')

  const fetchProfile = async () => {
    setLoading(true)
    setError('')
    setSlow(false)
    const slowTimer = setTimeout(() => setSlow(true), 5000)
    try {
      const res = await api.get('/dashboard/', { timeout: 25000 })
      setProfile(res.data)
    } catch (err) {
      if (err.response?.status === 401) navigate('/login')
      else setError('Profile could not be loaded. Please retry after the server wakes up.')
    } finally {
      clearTimeout(slowTimer)
      setLoading(false)
    }
  }

  useEffect(() => { fetchProfile() }, [navigate])

  const fullName = useMemo(() => {
    if (!profile) return ''
    return `${profile.initial ? profile.initial + ' ' : ''}${profile.first_name || ''} ${profile.last_name || ''}`.trim()
  }, [profile])

  const initials = useMemo(() => {
    if (!profile) return ''
    return `${(profile.first_name || ' ')[0] || ''}${(profile.last_name || ' ')[0] || ''}`.toUpperCase()
  }, [profile])

  const completion = useMemo(() => {
    if (!profile) return 0
    const required = ['first_name', 'last_name', 'email', 'mobile_number', 'gender', 'dob', 'door_no', 'street_name', 'city_name', 'state', 'aadhaar_no', 'pan_no']
    const filled = required.filter(key => profile[key]).length
    return Math.round((filled / required.length) * 100)
  }, [profile])

  const openEdit = () => {
    const next = {}
    PROFILE_FIELDS.forEach(([key]) => { next[key] = profile?.[key] || '' })
    setUpdateForm(next)
    setUpdateMessage('')
    setProofDocument(null)
    setSubmitMsg('')
    setShowEdit(true)
  }

  const handleUpdateChange = e => {
    const { name, value } = e.target
    if (name === 'married_status' && value !== 'married') {
      setUpdateForm({ ...updateForm, married_status: value, anniversary_date: '' })
      return
    }
    setUpdateForm({ ...updateForm, [name]: value })
  }

  const copyValue = async (label, value) => {
    if (!value || value === '-') return
    try {
      await navigator.clipboard.writeText(String(value))
      setCopied(label)
      setTimeout(() => setCopied(''), 1300)
    } catch {}
  }

  const submitProfileUpdate = async e => {
    e.preventDefault()
    if (!updateMessage.trim()) {
      setSubmitMsg('Please enter message / reason')
      return
    }
    if (!proofDocument) {
      setSubmitMsg('Please upload document proof')
      return
    }

    const fd = new FormData()
    PROFILE_FIELDS.forEach(([key]) => {
      if (updateForm[key] !== null && updateForm[key] !== undefined) fd.append(key, updateForm[key])
    })
    fd.append('message', updateMessage)
    fd.append('proof_document', proofDocument)

    setSubmitting(true)
    try {
      await api.post('/profile-update-request/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setSubmitMsg('Request submitted. Super Admin approval will update your profile.')
      setTimeout(() => setShowEdit(false), 1800)
    } catch (err) {
      setSubmitMsg('Error: ' + JSON.stringify(err.response?.data || err.message))
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle = {
    width: '100%',
    background: '#FDFDFC',
    border: '1px solid #D1DFDE',
    borderRadius: 12,
    padding: '11px 12px',
    color: '#111817',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: '"Montserrat", sans-serif',
    fontSize: 13,
  }

  if (loading) {
    return (
      <div className="profile-page">
        <style>{profileStyles}</style>
        <main className="profile-center">
          <div className="profile-loader" />
          <h2>Loading profile</h2>
          {slow && <p>Server is waking up. This may take a few seconds.</p>}
        </main>
        <CustomerFooter />
      </div>
    )
  }

  if (error) {
    return (
      <div className="profile-page">
        <style>{profileStyles}</style>
        <main className="profile-center">
          <h2>Profile Not Available</h2>
          <p>{error}</p>
          <button className="profile-primary-btn" type="button" onClick={fetchProfile}>Retry</button>
        </main>
        <CustomerFooter />
      </div>
    )
  }

  if (!profile) return null

  const fieldGroups = {
    personal: [
      ['Mobile Number', profile.mobile_number],
      ['Gender', capitalize(profile.gender)],
      ['Date of Birth', formatDate(profile.dob)],
      ['Marital Status', capitalize(profile.married_status)],
      ...(profile.married_status === 'married' ? [['Anniversary Date', formatDate(profile.anniversary_date)]] : []),
    ],
    address: [
      ['Door No', profile.door_no],
      ['Street', profile.street_name, true],
      ['Town', profile.town_name],
      ['City', profile.city_name],
      ['District', profile.district],
      ['State', profile.state],
    ],
    identity: [
      ['Aadhaar No', profile.aadhaar_no],
      ['PAN No', profile.pan_no],
      ['Occupation', capitalize(profile.occupation)],
      ['Occupation Detail', profile.occupation_detail, true],
      ['Annual Salary', money(profile.annual_salary)],
    ],
    account: [
      ['Customer ID', profile.customer_id],
      ['Member Since', formatDate(profile.created_at)],
      ['Role', capitalize(profile.role)],
      ...(profile.promotor_name ? [
        ['Promotor Name', profile.promotor_name],
        ['Promotor ID', profile.promotor_id],
        ['Promotor Contact', profile.promotor_contact_no],
      ] : []),
    ],
  }

  return (
    <div className="profile-page">
      <style>{profileStyles}</style>

      <main className="profile-shell">
        <section className="profile-hero">
          <div className="profile-avatar">{initials || 'U'}</div>
          <div className="profile-hero-copy">
            <span className="profile-kicker">Customer Profile</span>
            <h1>{fullName || 'Customer'}</h1>
            <p>{profile.email || 'Email not added'}</p>
            <div className="profile-chip-row">
              {profile.customer_id && <button type="button" onClick={() => copyValue('Customer ID', profile.customer_id)}>ID: {profile.customer_id}</button>}
              <button type="button">Profile {completion}% complete</button>
              {copied && <button type="button" className="copied-chip">{copied} copied</button>}
            </div>
          </div>
          <div className="profile-actions">
            <button className="profile-primary-btn" type="button" onClick={openEdit}>Edit Profile</button>
            <button className="profile-secondary-btn" type="button" onClick={() => navigate('/customer')}>Dashboard</button>
          </div>
        </section>

        <section className="profile-overview">
          {[
            ['Mobile', profile.mobile_number || '-'],
            ['Location', [profile.city_name, profile.state].filter(Boolean).join(', ') || '-'],
            ['Occupation', capitalize(profile.occupation)],
            ['Member Since', formatDate(profile.created_at)],
          ].map(([label, value]) => (
            <div className="profile-stat" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </section>

        <section className="profile-content">
          <aside className="profile-sidebar">
            <div className="profile-progress">
              <span>Profile completion</span>
              <strong>{completion}%</strong>
              <div><i style={{ width: `${completion}%` }} /></div>
            </div>
            <nav className="profile-tabs">
              {TABS.map(tab => (
                <button
                  type="button"
                  key={tab.id}
                  className={activeTab === tab.id ? 'active' : ''}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          <section className="profile-card">
            <div className="profile-card-head">
              <div>
                <span>{TABS.find(tab => tab.id === activeTab)?.label}</span>
                <h2>{activeTab === 'identity' ? 'Identity & Occupation' : `${TABS.find(tab => tab.id === activeTab)?.label} Details`}</h2>
              </div>
              <button type="button" onClick={openEdit}>Request Update</button>
            </div>
            <div className="profile-field-grid">
              {fieldGroups[activeTab].map(([label, value, wide]) => (
                <FieldCard key={label} label={label} value={value} wide={wide} onCopy={() => copyValue(label, value)} />
              ))}
            </div>
          </section>
        </section>
      </main>

      {showEdit && (
        <div className="profile-modal-backdrop" onClick={() => setShowEdit(false)}>
          <form className="profile-modal" onSubmit={submitProfileUpdate} onClick={e => e.stopPropagation()}>
            <div className="profile-modal-head">
              <div>
                <span>Approval Request</span>
                <h2>Profile Update Request</h2>
                <p>Update the fields below and attach proof. Changes apply after admin approval.</p>
              </div>
              <button type="button" onClick={() => setShowEdit(false)}>Close</button>
            </div>

            <div className="profile-modal-body">
              <div className="profile-edit-grid">
                {PROFILE_FIELDS.map(([key, label]) => (
                  <label className="profile-edit-field" key={key}>
                    <span>{label}</span>
                    {key === 'gender' ? (
                      <select name={key} value={updateForm[key] || 'male'} onChange={handleUpdateChange} style={inputStyle}>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    ) : key === 'married_status' ? (
                      <select name={key} value={updateForm[key] || 'single'} onChange={handleUpdateChange} style={inputStyle}>
                        <option value="single">Single</option>
                        <option value="married">Married</option>
                        <option value="other">Other</option>
                      </select>
                    ) : key === 'dob' || key === 'anniversary_date' ? (
                      <input
                        type="date"
                        name={key}
                        value={updateForm[key] || ''}
                        onChange={handleUpdateChange}
                        style={inputStyle}
                        disabled={key === 'anniversary_date' && updateForm.married_status !== 'married'}
                      />
                    ) : (
                      <input name={key} value={updateForm[key] || ''} onChange={handleUpdateChange} style={inputStyle} />
                    )}
                  </label>
                ))}
              </div>

              <label className="profile-edit-field wide">
                <span>Message / Reason</span>
                <textarea
                  value={updateMessage}
                  onChange={e => setUpdateMessage(e.target.value)}
                  placeholder="Example: My mobile number is wrong, please update it..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </label>

              <label className="profile-upload">
                <span>Upload Proof Document</span>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setProofDocument(e.target.files[0])} />
                <strong>{proofDocument ? proofDocument.name : 'PDF, JPG or PNG accepted'}</strong>
              </label>

              {submitMsg && <div className={`profile-message${submitMsg.startsWith('Error') || submitMsg.startsWith('Please') ? ' error' : ''}`}>{submitMsg}</div>}
            </div>

            <div className="profile-modal-actions">
              <button type="button" onClick={() => setShowEdit(false)}>Cancel</button>
              <button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Request'}</button>
            </div>
          </form>
        </div>
      )}
      <CustomerFooter />
    </div>
  )
}

const profileStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Playfair+Display:wght@700&family=Montserrat:wght@400;500;600;700;800;900&display=swap');

  .profile-page {
    min-height: 100vh;
    background:
      linear-gradient(180deg, rgba(231,237,236,0.88) 0%, rgba(253,253,252,0.98) 28%, #F3F3F0 100%);
    color: #111817;
    font-family: "Montserrat", system-ui, sans-serif;
  }

  .profile-shell {
    width: min(1440px, calc(100% - 48px));
    margin: 0 auto;
    padding: clamp(34px, 4.5vw, 66px) 0 78px;
  }

  .profile-hero {
    position: relative;
    overflow: hidden;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 26px;
    min-height: 230px;
    border: 1px solid rgba(189,207,206,0.88);
    border-radius: 34px;
    background:
      linear-gradient(130deg, rgba(7,59,63,0.98), rgba(12,64,68,0.9) 48%, rgba(187,137,88,0.9));
    box-shadow: 0 32px 90px rgba(12,64,68,0.18);
    color: #FDFDFC;
    padding: clamp(26px, 4vw, 46px);
  }

  .profile-hero::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      linear-gradient(90deg, transparent 0%, rgba(253,253,252,0.08) 48%, transparent 100%),
      repeating-linear-gradient(135deg, rgba(253,253,252,0.08) 0 1px, transparent 1px 18px);
    opacity: 0.55;
    pointer-events: none;
  }

  .profile-avatar {
    width: clamp(96px, 10vw, 132px);
    height: clamp(96px, 10vw, 132px);
    border-radius: 50%;
    display: grid;
    place-items: center;
    border: 2px solid rgba(253,253,252,0.56);
    background: rgba(253,253,252,0.14);
    color: #FDFDFC;
    font: 800 clamp(34px, 4vw, 48px) "Playfair Display", Georgia, serif;
    box-shadow: inset 0 0 0 10px rgba(253,253,252,0.08), 0 20px 45px rgba(17,24,23,0.22);
    z-index: 1;
  }

  .profile-hero-copy,
  .profile-actions {
    position: relative;
    z-index: 1;
  }

  .profile-kicker,
  .profile-card-head span,
  .profile-modal-head span {
    color: #CCA881;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 2.5px;
    text-transform: uppercase;
  }

  .profile-hero h1 {
    margin: 8px 0 8px;
    color: #FDFDFC;
    font: 700 clamp(38px, 5vw, 68px) "Playfair Display", Georgia, serif;
    line-height: 0.98;
    letter-spacing: 0;
  }

  .profile-hero p {
    margin: 0;
    color: rgba(253,253,252,0.84);
    font-size: 15px;
    font-weight: 600;
  }

  .profile-chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 18px;
  }

  .profile-chip-row button {
    border: 1px solid rgba(253,253,252,0.22);
    border-radius: 999px;
    background: rgba(253,253,252,0.12);
    color: #FDFDFC;
    padding: 9px 13px;
    font-size: 12px;
    font-weight: 900;
    cursor: pointer;
  }

  .profile-chip-row .copied-chip {
    background: rgba(243,232,222,0.92);
    color: #073B3F;
  }

  .profile-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 170px;
  }

  .profile-primary-btn,
  .profile-secondary-btn,
  .profile-card-head button,
  .profile-modal-actions button {
    border: 0;
    border-radius: 999px;
    padding: 14px 22px;
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    cursor: pointer;
  }

  .profile-primary-btn {
    background: #FDFDFC;
    color: #073B3F;
    box-shadow: 0 16px 34px rgba(17,24,23,0.2);
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }

  .profile-secondary-btn {
    border: 1px solid rgba(253,253,252,0.28);
    background: rgba(253,253,252,0.12);
    color: #FDFDFC;
    transition: transform 0.18s ease, background 0.18s ease;
  }

  .profile-primary-btn:hover,
  .profile-secondary-btn:hover,
  .profile-card-head button:hover,
  .profile-modal-actions button:hover {
    transform: translateY(-2px);
  }

  .profile-overview {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    margin: 22px 0;
  }

  .profile-stat,
  .profile-sidebar,
  .profile-card {
    border: 1px solid rgba(189,207,206,0.88);
    background: rgba(253,253,252,0.88);
    box-shadow: 0 20px 54px rgba(12,64,68,0.09);
    backdrop-filter: blur(18px);
  }

  .profile-stat {
    border-radius: 22px;
    padding: 18px;
    transition: transform 0.2s ease, border-color 0.2s ease;
  }

  .profile-stat:hover {
    transform: translateY(-3px);
    border-color: rgba(187,137,88,0.48);
  }

  .profile-stat span,
  .profile-field span,
  .profile-edit-field span,
  .profile-upload span,
  .profile-progress span {
    display: block;
    color: #7A8987;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .profile-stat strong {
    display: block;
    margin-top: 8px;
    color: #073B3F;
    font-size: 18px;
    line-height: 1.3;
  }

  .profile-content {
    display: grid;
    grid-template-columns: 300px minmax(0, 1fr);
    gap: 22px;
  }

  .profile-sidebar {
    border-radius: 28px;
    padding: 20px;
    align-self: start;
    position: sticky;
    top: 24px;
  }

  .profile-progress strong {
    display: block;
    margin-top: 6px;
    color: #073B3F;
    font-size: 34px;
    font-family: "Playfair Display", Georgia, serif;
  }

  .profile-progress div {
    height: 9px;
    border-radius: 999px;
    background: #E7EDEC;
    overflow: hidden;
    margin: 14px 0 18px;
  }

  .profile-progress i {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #0C4044, #BB8958);
  }

  .profile-tabs {
    display: grid;
    gap: 10px;
  }

  .profile-tabs button {
    border: 1px solid #D1DFDE;
    border-radius: 16px;
    background: #FDFDFC;
    color: #073B3F;
    padding: 14px 16px;
    text-align: left;
    font-weight: 900;
    cursor: pointer;
  }

  .profile-tabs button.active {
    background: #073B3F;
    border-color: #073B3F;
    color: #FDFDFC;
  }

  .profile-card {
    border-radius: 30px;
    padding: clamp(22px, 3vw, 34px);
  }

  .profile-card-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 24px;
  }

  .profile-card-head h2,
  .profile-modal-head h2,
  .profile-center h2 {
    margin: 7px 0 0;
    color: #073B3F;
    font: 700 clamp(30px, 4vw, 48px) "Playfair Display", Georgia, serif;
    line-height: 1;
  }

  .profile-card-head button {
    background: #E7EDEC;
    color: #073B3F;
    border: 1px solid #D1DFDE;
  }

  .profile-field-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }

  .profile-field {
    border: 1px solid rgba(189,207,206,0.88);
    border-radius: 20px;
    background: #FDFDFC;
    padding: 18px;
    text-align: left;
    min-height: 116px;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  }

  .profile-field:hover {
    transform: translateY(-4px);
    border-color: rgba(187,137,88,0.62);
    box-shadow: 0 20px 40px rgba(12,64,68,0.11);
  }

  .profile-field.wide {
    grid-column: span 2;
  }

  .profile-field strong {
    display: block;
    color: #111817;
    font-size: 18px;
    line-height: 1.35;
    margin-top: 10px;
    word-break: break-word;
  }

  .profile-field small {
    display: block;
    margin-top: 10px;
    color: #9F6130;
    font-size: 11px;
    font-weight: 800;
  }

  .profile-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1300;
    background: rgba(17,24,23,0.62);
    backdrop-filter: blur(10px);
    display: grid;
    place-items: center;
    padding: 20px;
  }

  .profile-modal {
    width: min(1080px, 100%);
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    border-radius: 30px;
    background: #FDFDFC;
    border: 1px solid #D1DFDE;
    box-shadow: 0 34px 100px rgba(17,24,23,0.36);
  }

  .profile-modal-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
    padding: 26px;
    background: linear-gradient(135deg, #E7EDEC, #F3E8DE);
    border-bottom: 1px solid #D1DFDE;
  }

  .profile-modal-head p {
    margin: 9px 0 0;
    color: #52625f;
    font-size: 13px;
    line-height: 1.6;
  }

  .profile-modal-head button {
    border: 1px solid rgba(201,32,53,0.24);
    background: rgba(201,32,53,0.08);
    color: #C92035;
    border-radius: 999px;
    padding: 10px 16px;
    font-weight: 900;
    cursor: pointer;
  }

  .profile-modal-body {
    overflow: auto;
    padding: 24px 26px;
  }

  .profile-edit-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }

  .profile-edit-field {
    display: grid;
    gap: 8px;
  }

  .profile-edit-field.wide {
    margin-top: 16px;
  }

  .profile-upload {
    display: grid;
    gap: 8px;
    margin-top: 16px;
    border: 1px dashed #BDCFCE;
    border-radius: 18px;
    padding: 18px;
    background: #F3F3F0;
  }

  .profile-upload input {
    color: #52625f;
  }

  .profile-upload strong {
    color: #073B3F;
    font-size: 13px;
  }

  .profile-message {
    margin-top: 16px;
    border: 1px solid rgba(12,64,68,0.18);
    border-radius: 16px;
    background: rgba(231,237,236,0.86);
    color: #073B3F;
    padding: 13px 15px;
    font-size: 13px;
    font-weight: 800;
  }

  .profile-message.error {
    border-color: rgba(201,32,53,0.28);
    background: rgba(201,32,53,0.08);
    color: #C92035;
  }

  .profile-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 18px 26px;
    border-top: 1px solid #D1DFDE;
    background: #F3F3F0;
  }

  .profile-modal-actions button:first-child {
    background: #FDFDFC;
    color: #073B3F;
    border: 1px solid #D1DFDE;
  }

  .profile-modal-actions button:last-child {
    background: linear-gradient(135deg, #073B3F, #0C4044);
    color: #FDFDFC;
  }

  .profile-modal-actions button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .profile-center {
    min-height: 58vh;
    display: grid;
    place-items: center;
    align-content: center;
    text-align: center;
    padding: clamp(54px, 7vw, 96px) 20px;
  }

  .profile-center p {
    color: #7A8987;
    max-width: 460px;
  }

  .profile-loader {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: 4px solid #D1DFDE;
    border-top-color: #073B3F;
    animation: profileSpin 0.9s linear infinite;
  }

  @keyframes profileSpin { to { transform: rotate(360deg); } }

  @media (max-width: 980px) {
    .profile-hero { grid-template-columns: 1fr; }
    .profile-actions { flex-direction: row; }
    .profile-overview { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .profile-content { grid-template-columns: 1fr; }
    .profile-sidebar { position: relative; top: auto; }
    .profile-tabs { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .profile-field-grid,
    .profile-edit-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }

  @media (max-width: 620px) {
    .profile-shell { width: min(100% - 24px, 1440px); }
    .profile-overview,
    .profile-field-grid,
    .profile-edit-grid,
    .profile-tabs { grid-template-columns: 1fr; }
    .profile-field.wide { grid-column: span 1; }
    .profile-card-head,
    .profile-modal-head,
    .profile-modal-actions { flex-direction: column; align-items: stretch; }
    .profile-actions { flex-direction: column; }
  }
`

