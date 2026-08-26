import { useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import logo from '../assets/logo.png'
import api from '../api'


function Icon({ name, size = 17 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  const icons = {
    home: <><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10.5V21h14V10.5" /><path d="M9 21v-6h6v6" /></>,
    box: <><path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></>,
    orders: <><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /></>,
    rate: <><path d="M4 19V5" /><path d="M4 19h16" /><path d="m7 15 4-4 3 3 5-7" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.87l-.06-.06A2 2 0 1 1 7.03 3.84l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.2.38.5.7.9.9.34.18.72.27 1.1.27H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15Z" /></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></>,
    mic: <><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v1a7 7 0 0 1-14 0v-1" /><path d="M12 18v4" /><path d="M9 22h6" /></>,
    chevron: <path d="m6 9 6 6 6-6" />,
    alert: <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>,
    menu: <><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></>,
    close: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
    stock: <><path d="M20 7 12 3 4 7" /><path d="M4 7v10l8 4 8-4V7" /><path d="M4 7l8 4 8-4" /><path d="M12 11v10" /></>,
  }
  return <svg {...common}>{icons[name]}</svg>
}

export default function SuperAdminNavbar({
  showSidebar = false,
  onGoldRate,
  onTodayRates,
  onAddCoins,
  onRequests,
  onBirthdays,
  onAnniversaries,
  onWorkAnniversaries,
  onSendAnnouncement,
  onMyAnnouncements,
  onVoiceSearch,
}) {
  const navigate = useNavigate()
  const [voiceQuery, setVoiceQuery] = useState('')
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)
  const [openMenu, setOpenMenu] = useState(null)
  const closeTimerRef = useRef(null)
  const [showMobileDrawer, setShowMobileDrawer] = useState(false)   // ── NEW: hamburger sidebar ──

  // ── Gold Rate / Today Rates (moved from Dashboard) ──
  const [showRatePopup, setShowRatePopup] = useState(false)
  const [showTodayRates, setShowTodayRates] = useState(false)
  const [metalPrices, setMetalPrices] = useState({
    gold22k: null, gold24k: null, silver: null,
    diamond18k: null, diamond22k: null, platinum92: null,
  })
  const [metalLoading, setMetalLoading] = useState(false)
  const [dbRateDate, setDbRateDate] = useState(null)
  const [rateForm, setRateForm] = useState({
    date: new Date().toISOString().split('T')[0],
    gold_22k: '', gold_24k: '', silver_999: '',
    diamond_18k: '', diamond_22k: '', platinum_92: '',
  })
 const [rateMsg, setRateMsg] = useState('')
  const [rateSaving, setRateSaving] = useState(false)

  // ── Celebrations (moved from Dashboard) ──
  const [showBirthdayList, setShowBirthdayList] = useState(false)
  const [showAnniversaryList, setShowAnniversaryList] = useState(false)
  const [showJoinDateList, setShowJoinDateList] = useState(false)
  const [birthdayList, setBirthdayList] = useState([])
  const [anniversaryList, setAnniversaryList] = useState([])
  const [joinDateList, setJoinDateList] = useState([])
  const [celebLoading, setCelebLoading] = useState(false)
  const [specialAnnForm, setSpecialAnnForm] = useState({ title: '', message: '', roles: [] })
  const [showSpecialAnn, setShowSpecialAnn] = useState(false)
  const [specialAnnMsg, setSpecialAnnMsg] = useState('')
  const [specialAnnSending, setSpecialAnnSending] = useState(false)

  // ── Announcements (moved from Dashboard) ──
 const [showAnnouncement, setShowAnnouncement] = useState(false)
  const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '', roles: [] })
  const [announcementMsg, setAnnouncementMsg] = useState('')
  const [announcingSending, setAnnouncingSending] = useState(false)
  const [showMyAnnouncements, setShowMyAnnouncements] = useState(false)
  const [myAnnouncements, setMyAnnouncements] = useState([])

  // ── Requests (moved from Dashboard) ──
  const [showRequests, setShowRequests] = useState(false)
  const [profileRequests, setProfileRequests] = useState([])
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [requestMsg, setRequestMsg] = useState('')
  const [proofModal, setProofModal] = useState(false)
  const [proofUrl, setProofUrl] = useState('')
  const [proofType, setProofType] = useState('')
  const [proofLoading, setProofLoading] = useState(false)

  const fetchProfileRequests = async () => {
    try {
      const res = await api.get('/profile-update-request/')
      setProfileRequests(res.data)
    } catch (err) {
      setRequestMsg('Failed to load requests')
    }
  }

  const approveProfileRequest = async (id) => {
    try {
      await api.post(`/profile-update-request/${id}/approve/`)
      setRequestMsg('Request approved successfully!')
      setSelectedRequest(null)
      fetchProfileRequests()
    } catch (err) {
      setRequestMsg('Approve failed: ' + JSON.stringify(err.response?.data))
    }
  }

  const fetchMyAnnouncements = async () => {
    try {
      const res = await api.get('/announcements/')
      const sorted = [...res.data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setMyAnnouncements(sorted)
    } catch { /* ignore */ }
  }

  const fetchCelebrations = async () => {
    setCelebLoading(true)
    try {
      const [adminsRes, dealerRes, sdRes, proRes, cusRes] = await Promise.allSettled([
        api.get('/admins/'),
        api.get('/dealers/list/'),
        api.get('/sub-dealers/list/'),
        api.get('/promotors/list/'),
        api.get('/customers/'),
      ])
      const admins = adminsRes.status === 'fulfilled' ? adminsRes.value.data : []
      const dealers = dealerRes.status === 'fulfilled' ? dealerRes.value.data : []
      const sds = sdRes.status === 'fulfilled' ? sdRes.value.data : []
      const pros = proRes.status === 'fulfilled' ? proRes.value.data : []
      const cuss = cusRes.status === 'fulfilled' ? cusRes.value.data : []

      const allMembers = [
        ...admins.map(m => ({ ...m, _role: 'Admin', _id: m.admin_id, _roleColor: '#BDCFCE', _dob: m.dob, _ann: m.anniversary_date, _joined: m.user?.created_at || null })),
        ...dealers.map(m => ({ ...m, _role: 'Dealer', _id: m.dealer_id, _roleColor: '#0C4044', _dob: m.dob, _ann: m.anniversary_date, _joined: m.created_at })),
        ...sds.map(m => ({ ...m, _role: 'SubDealer', _id: m.sub_dealer_id, _roleColor: '#BB8958', _dob: m.dob, _ann: m.anniversary_date, _joined: m.created_at })),
        ...pros.map(m => ({ ...m, _role: 'Promotor', _id: m.promotor_id, _roleColor: '#CCA881', _dob: m.dob, _ann: m.anniversary_date, _joined: m.created_at })),
        ...cuss.map(m => ({ ...m, _role: 'Customer', _id: m.customer_id, _roleColor: '#C92035', _dob: m.dob || null, _ann: m.anniversary_date || null, _joined: m.user?.created_at || m.created_at || null })),
      ]

      const today = new Date()
      const todayMD = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

      function parseDateLocal(str) {
        if (!str) return null
        const [y, m, d] = str.split('-').map(Number)
        return new Date(y, m - 1, d)
      }

      const bdays = allMembers.filter(m => {
        if (!m._dob) return false
        const d = parseDateLocal(m._dob)
        const md = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        return md === todayMD
      })
      setBirthdayList(bdays)

      const anns = allMembers.filter(m => {
        if (!m._ann) return false
        const d = parseDateLocal(m._ann)
        const md = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        return md === todayMD
      })
      setAnniversaryList(anns)

      const joins = allMembers.filter(m => {
        if (!m._joined) return false
        const d = new Date(m._joined)
        const md = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        return md === todayMD
      }).map(m => {
        const joinedDate = new Date(m._joined)
        const years = today.getFullYear() - joinedDate.getFullYear()
        return { ...m, _yearsCompleted: years }
      })
      setJoinDateList(joins)
        } catch (e) { console.error('fetchCelebrations error:', e) }
    setCelebLoading(false)
  }

  const fetchMetalPrices = async () => {
    setMetalLoading(true)
    try {
      const res = await api.get('/metal-rates/')
      const d = res.data
      setMetalPrices({
        gold22k: d.gold_22k ? parseFloat(d.gold_22k) : null,
        gold24k: d.gold_24k ? parseFloat(d.gold_24k) : null,
        silver: d.silver_999 ? parseFloat(d.silver_999) : null,
        diamond18k: d.diamond_18k ? parseFloat(d.diamond_18k) : null,
        diamond22k: d.diamond_22k ? parseFloat(d.diamond_22k) : null,
        platinum92: d.platinum_92 ? parseFloat(d.platinum_92) : null,
      })
      setDbRateDate(d.date)
    } catch (e) {
      setMetalPrices({ gold22k: null, gold24k: null, silver: null, diamond18k: null, diamond22k: null, platinum92: null })
      setDbRateDate(null)
    } finally {
      setMetalLoading(false)
    }
  }

  const openMenuNow = (label) => {
    clearTimeout(closeTimerRef.current)
    setOpenMenu(label)
  }
  const scheduleCloseMenu = () => {
    clearTimeout(closeTimerRef.current)
    closeTimerRef.current = setTimeout(() => setOpenMenu(null), 200)
  }

  const PAGE_ROUTES = [
    { keywords: ['inactive'], path: '/login-inactive' },
    { keywords: ['active list', 'active users', 'login active'], path: '/login-active' },
    { keywords: ['add product'], path: '/add-product' },
    { keywords: ['orders', 'admin orders'], path: '/admin-orders' },
    { keywords: ['hierarchy tree'], path: '/superadmin-hierarchy' },
    { keywords: ['hierarchy grid', 'hierarchy'], path: '/superadmin-hierarchy-grid' },
    { keywords: ['hierarchy sales report', 'sales count'], path: '/hierarchy-sales-count' },
    { keywords: ['sales report'], path: '/sales-report' },
    { keywords: ['buy coin'], path: '/buy-coin' },
    { keywords: ['stored coin'], path: '/stored-coins' },
    { keywords: ['coin requests'], path: '/coin-requests-page' },
    { keywords: ['coin transactions'], path: '/coin-transactions' },
    { keywords: ['retailer'], path: '/promotions/retailer' },
    { keywords: ['wholesale dealer'], path: '/promotions/wholesale-dealer' },
    { keywords: ['distributor'], path: '/promotions/distributor' },
    { keywords: ['super stockist'], path: '/promotions/super-stockist' },
    { keywords: ['revenue', 'payments'], path: '/superadmin-payments' },
    { keywords: ['add aug coin', 'send coin'], path: '/superadmin-send-coins' },
    { keywords: ['autopay'], path: '/superadmin-autopay-list' },
    { keywords: ['today birthday', 'birthday'], path: '/super-admin?open=birthday' },
    { keywords: ['work anniversary', 'join date', 'join anniversary'], path: '/super-admin?open=joindate' },
    { keywords: ['anniversary'], path: '/super-admin?open=anniversary' },
    { keywords: ['gold rate', 'today rate'], path: '/super-admin?open=rate' },
    { keywords: ['requests', 'profile request'], path: '/super-admin?open=requests' },
    { keywords: ['send announcement'], path: '/super-admin?open=announcement' },
    { keywords: ['my announcements'], path: '/super-admin?open=myannouncements' },
  ]

  const submitVoiceSearch = async (query) => {
    const q = (query || '').trim()
    if (!q) return
    setVoiceQuery('')

    const lower = q.toLowerCase()

    // Strip page keywords first — whatever text remains is treated as a
    // person name/ID to search for (checked BEFORE generic page routing,
    // so "BBCUS123 sales report" finds the person, not the generic page).
    const nameOnly = lower
      .replace(/sales report|sales|report|hierarchy grid|hierarchy|show|open|of/gi, '')
      .trim()

    if (nameOnly) {
      try {
        const res = await api.get('/hierarchy/search-person/', { params: { q: nameOnly } })
        const results = res.data.results || []
        if (results.length > 0) {
          const match = results[0]
          if (lower.includes('sales report')) {
            navigate(`/sales-report?role=${match.role}&id=${match.id}`)
          } else if (lower.includes('hierarchy')) {
            navigate(`/superadmin-hierarchy-grid?role=${match.role}&id=${match.id}`)
          } else {
            navigate(`/hierarchy-sales-count?role=${match.role}&id=${match.id}`)
          }
          return
        }
        // no person match found — fall through to page-keyword routing below
      } catch (err) {
        alert('Search failed bro: ' + (err.response?.data?.error || err.message))
        return
      }
    }

    // No leftover name text, or no person matched — treat as a plain page command
    for (const page of PAGE_ROUTES) {
      if (page?.keywords?.some(k => lower.includes(k))) {
        navigate(page.path)
        return
      }
    }

    alert(`"${q}" ku match edhuvum kidaikala bro. Vera mari try pannunga.`)
  }

  const toggleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      return
    }

    // ── NEW: HTTPS check — Web Speech API needs https:// or localhost ──
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost'
    if (!isSecure) {
      alert('Voice search only works on HTTPS. Please use localhost or an https:// site.')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Voice search is not supported in this browser. Please use Chrome.')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-IN'
    recognition.interimResults = true
    recognition.continuous = false
    recognition.onstart = () => { setIsListening(true); console.log('🎤 recognition started') }
    recognition.onaudiostart = () => console.log('🎤 audio capture started')
    recognition.onsoundstart = () => console.log('🎤 sound detected')
    recognition.onspeechstart = () => console.log('🎤 speech detected')
    recognition.onspeechend = () => console.log('🎤 speech ended')
    recognition.onsoundend = () => console.log('🎤 sound ended')
    recognition.onaudioend = () => console.log('🎤 audio capture ended')
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        alert('Microphone permission is blocked. Click the mic icon in the browser address bar and allow access.')
      } else if (event.error === 'no-speech') {
        alert('No speech detected. Please speak clearly.')
      } else if (event.error === 'language-not-supported') {
        alert('This language is not supported.')
      } else {
        alert('Voice error: ' + event.error)
      }
    }
    recognition.onend = () => setIsListening(false)
    recognition.onresult = (event) => {
      let transcript = ''
      for (let i = 0; i < event.results.length; i++) transcript += event.results[i][0].transcript
      setVoiceQuery(transcript)
      if (event.results[event.results.length - 1].isFinal) submitVoiceSearch(transcript)
    }
    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch (err) {
      console.error('Speech recognition start failed:', err)
      alert('Failed to start microphone: ' + err.message)
    }
  }

  const run = (handler, fallback) => {
    if (handler) {
      handler()
      return
    }
    if (fallback) navigate(fallback)
  }
  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

    const management = [
  ['Gold Rate', () => { setShowRatePopup(true); fetchMetalPrices() }],
  ['Add Product', () => navigate('/add-product')],
  ['Orders', () => navigate('/admin-orders')],
  ['Requests', () => { setShowRequests(true); setRequestMsg(''); fetchProfileRequests() }],
  ['Hierarchy Grid', () => navigate('/superadmin-hierarchy-grid')],
  ['Hierarchy Tree', () => navigate('/superadmin-hierarchy')],
  ['Super Stockists', () => navigate('/superadmin/manage-users/super-stockist')],
  ['Distributors', () => navigate('/superadmin/manage-users/distributor')],
  ['Wholesale Dealers', () => navigate('/superadmin/manage-users/wholesale-dealer')],
  ['Retailers', () => navigate('/superadmin/manage-users/retailer')],
  ['Customers', () => navigate('/superadmin/manage-users/customer')],
]
 const celebrations = [
  ["Today's Birthdays", () => { setShowBirthdayList(true); fetchCelebrations() }],
  ["Today's Anniversaries", () => { setShowAnniversaryList(true); fetchCelebrations() }],
  ['Work Anniversaries', () => { setShowJoinDateList(true); fetchCelebrations() }],
]
  const announcements = [
    ['Send Announcement', () => { setShowAnnouncement(true); setAnnouncementMsg('') }],
    ['My Announcements', () => { setShowMyAnnouncements(true); fetchMyAnnouncements() }],
  ]
  const coins = [
    ['Buy Coin', () => navigate('/buy-coin')],
    ['Stored Coin', () => navigate('/stored-coins')],
    ['Coin Requests', () => navigate('/coin-requests-page')],
    ['Coin Transactions', () => navigate('/coin-transactions')],
  ]
  const reports = [
    ['Login Reward', () => navigate('/coins-reward')],
    ['Sales Report', () => navigate('/sales-report')],
    ['Login Active', () => navigate('/login-active')],
    ['Login Inactive', () => navigate('/login-inactive')],
  ]
   const promotion = [
    ['Retailers', () => navigate('/promotions/retailer')],
    ['Wholesale Dealer', () => navigate('/promotions/wholesale-dealer')],
    ['Distributor', () => navigate('/promotions/distributor')],
    ['Super Stockist', () => navigate('/promotions/super-stockist')],
  ]
  const payment = [
    ['Revenue & Payments', () => navigate('/superadmin-payments')],
    ['Add AUG Coins', () => navigate('/superadmin-send-coins')],
    ['Autopay List', () => navigate('/superadmin-autopay-list')],
  ]
  const mobileMenuGroups = [
    ['Management', management], ['Celebrations', celebrations],
    ['Announcements', announcements], ['Coins', coins],
    ['Reports', reports], ['Promotion', promotion], ['Payment', payment],
  ]

  const MenuGroup = ({ label, items }) => (
    <div
      className={`san-menu-group ${openMenu === label ? 'is-open' : ''}`}
      onMouseEnter={() => openMenuNow(label)}
      onMouseLeave={scheduleCloseMenu}
    >
      <button className="san-menu-trigger" type="button">{label}<Icon name="chevron" size={15} /></button>
      <div className="san-menu-dropdown">
        <div className="san-menu-title"><span>D</span>{label}</div>
        {items.map(([text, action]) => (
          <button
            key={text}
            type="button"
            className="san-menu-link"
            onClick={() => {
              clearTimeout(closeTimerRef.current)
              setOpenMenu(null)
              action()
            }}
          >
            {text}<b>-&gt;</b>
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <>
      <style>{`
.san-shell * { box-sizing: border-box; }
.san-sidebar { position: fixed; inset: 0 auto 0 0; width: 286px; z-index: 70; background: rgba(253,253,252,.98); border-right: 1px solid rgba(189,207,206,.76); box-shadow: 20px 0 48px rgba(7,59,63,.07); padding: 28px 18px; display: flex; flex-direction: column; }
.san-brand { display: flex; align-items: center; gap: 13px; padding: 0 8px 26px; border-bottom: 1px solid rgba(189,207,206,.66); cursor: pointer; }
.san-brand img { width: 54px; height: 54px; object-fit: contain; }
.san-brand-name { font-family: Georgia, 'Times New Roman', serif; font-size: 31px; line-height: .95; font-weight: 800; color: #073B3F; letter-spacing: .03em; }
.san-role { margin-top: 5px; color: #BB8958; font-size: 11px; font-weight: 900; letter-spacing: .24em; text-transform: uppercase; }
.san-side-nav { display: flex; flex-direction: column; gap: 9px; margin-top: 24px; }
.san-side-link { height: 54px; border: 0; border-radius: 8px; background: transparent; color: #073B3F; display: flex; align-items: center; gap: 14px; padding: 0 18px; font-size: 15px; font-weight: 900; text-align: left; cursor: pointer; }
.san-side-link:hover, .san-side-link.is-active { background: linear-gradient(135deg, #073B3F, #0C575B); color: #FDFDFC; box-shadow: 0 18px 34px rgba(7,59,63,.16); }
.san-quick { border-top: 1px solid #E4ECEB; margin-top: 24px; padding: 22px 16px 0; }
.san-quick-title { font-size: 11px; font-weight: 900; text-transform: uppercase; color: #111817; margin-bottom: 18px; }
.san-quick-row { display: grid; grid-template-columns: 28px 1fr auto; align-items: center; gap: 10px; margin-bottom: 18px; color: #0C4044; }
.san-quick-row strong { display: block; font-size: 18px; line-height: 1.1; color: #111817; }
.san-quick-row small { display: block; font-size: 12px; color: #0C4044; font-weight: 800; }
.san-quick-row b { font-size: 11px; color: #009957; }
.san-secure { margin-top: auto; border-radius: 8px; background: linear-gradient(145deg, #073B3F, #0C4044); border: 1px solid rgba(204,168,129,.32); padding: 24px 20px; color: #FDFDFC; box-shadow: 0 18px 36px rgba(7,59,63,.14); }
.san-secure strong { display: block; font-size: 16px; margin-bottom: 8px; }
.san-secure span { display: block; color: #D1DFDE; font-size: 13px; line-height: 1.6; }
.san-top-shell { position: sticky; top: 0; z-index: 65; background: rgba(253,253,252,.98); border-bottom: 1px solid rgba(189,207,206,.74); box-shadow: 0 16px 38px rgba(7,59,63,.055); backdrop-filter: blur(16px); }
.san-top-inner { min-height: 104px; display: flex; align-items: center; gap: 12px; padding: 0 14px; flex-wrap: nowrap; }
.san-navbar-brand { width: auto; min-width: 0; flex-shrink: 0; border: 0; background: transparent; display: flex; align-items: center; gap: 8px; padding: 0 12px 0 0; cursor: pointer; }
.san-navbar-brand img { width: 54px; height: 54px; object-fit: contain; }
.san-navbar-brand strong { display: block; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; line-height: .95; font-weight: 850; letter-spacing: .02em; color: #073B3F; }
.san-navbar-brand small { display: block; margin-top: 5px; color: #BB8958; font-size: 10px; font-weight: 900; letter-spacing: .24em; text-transform: uppercase; }
.san-search-block { width: 190px; flex-shrink: 0; display: flex; align-items: center; padding: 0 10px 0 0; margin-right: 8px; }
.san-search { height: 48px; width: 100%; border: 1px solid rgba(189,207,206,.95); border-radius: 10px; background: #FDFDFC; color: #073B3F; display: flex; align-items: center; gap: 12px; padding: 0 16px; font-size: 14px; font-weight: 700; }
.san-search-input { flex: 1; min-width: 0; border: 0; outline: none; background: transparent; color: #073B3F; font-size: 14px; font-weight: 650; }
.san-search-input::placeholder { color: #7A8987; font-weight: 550; }
.san-mic-btn { flex-shrink: 0; width: 30px; height: 30px; border-radius: 50%; border: 1.5px solid #0C4044; background: transparent; color: #0C4044; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all .15s ease; }
.san-mic-btn:hover { background: #0C4044; color: #FDFDFC; }
.san-mic-btn.is-listening { background: #C92035; border-color: #C92035; color: #FDFDFC; animation: san-mic-pulse 1.1s ease-in-out infinite; }
@keyframes san-mic-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(201,32,53,.5); } 50% { box-shadow: 0 0 0 8px rgba(201,32,53,0); } }
.san-menu-center { flex: 0 0 auto; display: flex; justify-content: center; align-items: stretch; gap: 0; }
.san-menu-group { position: relative; display: flex; }
.san-menu-trigger { border: 0; background: transparent; min-width: auto; flex-shrink: 0; padding: 0 9px; color: #073B3F; font-family: Georgia, 'Times New Roman', serif; font-size: 12.5px; font-weight: 800; letter-spacing: .01em; text-transform: uppercase; display: flex; align-items: center; justify-content: center; gap: 4px; cursor: pointer; white-space: nowrap; }
.san-menu-trigger:hover { background: #F3F3F0; border-radius: 999px; }
.san-menu-dropdown { position: absolute; top: 100%; left: 50%; transform: translateX(-50%); margin-top: 0; padding: 32px 28px 24px; min-width: 286px; background: #FDFDFC; border: 1px solid rgba(189,207,206,.8); box-shadow: 0 26px 68px rgba(7,59,63,.22); border-radius: 8px; opacity: 0; visibility: hidden; pointer-events: none; transition: opacity .16s ease, visibility .16s ease; z-index: 200; }
.san-menu-group.is-open .san-menu-dropdown { opacity: 1; visibility: visible; pointer-events: auto; transform: translateX(-50%); }
.san-menu-group:first-child .san-menu-dropdown,
.san-menu-group:first-child.is-open .san-menu-dropdown { left: 0; transform: none; }
.san-menu-group:last-of-type .san-menu-dropdown,
.san-menu-group:last-of-type.is-open .san-menu-dropdown { left: auto; right: 0; transform: none; }
.san-menu-title { display: flex; align-items: center; gap: 12px; font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 900; color: #073B3F; margin-bottom: 18px; }
.san-menu-title span { font-size: 24px; color: #BB8958; }
.san-menu-link { width: 100%; border: 0; background: transparent; padding: 10px 0; text-align: left; color: #111817; font-size: 14px; font-weight: 750; display: flex; align-items: center; justify-content: space-between; cursor: pointer; }
.san-menu-link:hover { color: #0C4044; transform: translateX(3px); }
.san-menu-link b, .san-menu-foot { color: #0C4044; }
.san-menu-foot { margin-top: 22px; border: 0; background: transparent; font-size: 13px; font-weight: 900; letter-spacing: .02em; cursor: pointer; }
.san-actions { display: flex; align-items: center; border-left: 0; gap: 6px; padding-left: 4px; flex-shrink: 0; }
.san-action { min-width: auto; flex-shrink: 0; padding: 0 8px; border: 0; background: transparent; color: #0C4044; font-size: 11px; font-weight: 900; display: flex; align-items: center; justify-content: center; gap: 4px; cursor: pointer; white-space: nowrap; }
.san-action:hover { background: #F3F3F0; box-shadow: 0 12px 28px rgba(7,59,63,.08); transform: translateY(-1px); }
.san-action.logout { color: #C92035; }
.san-mobile-logo { display: none; }
.san-mobile-logo img { width: 46px; height: 46px; }
.san-mobile-logo strong { font-family: Georgia, 'Times New Roman', serif; color: #073B3F; font-size: 25px; line-height: 1; }
.san-mobile-logo small { display: block; color: #BB8958; font-size: 9px; font-weight: 900; letter-spacing: .2em; }
.san-hamburger { display: flex; background: transparent; border: none; color: #0C4044; padding: 8px; cursor: pointer; align-items: center; justify-content: center; flex-shrink: 0; }
.san-hamburger:hover { color: #073B3F; }
.san-drawer-overlay { position: fixed; inset: 0; background: rgba(17,24,23,.55); backdrop-filter: blur(4px); z-index: 1400; }
.san-drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 260px; max-width: 82vw; background: #FDFDFC; z-index: 1401; box-shadow: -18px 0 48px rgba(7,59,63,.22); display: flex; flex-direction: column; padding: 20px 16px; gap: 6px; }
.san-drawer-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding-bottom: 14px; border-bottom: 1px solid rgba(189,207,206,.7); }
.san-drawer-title { font-family: Georgia, 'Times New Roman', serif; font-size: 17px; font-weight: 800; color: #073B3F; }
.san-drawer-close { background: transparent; border: none; color: #0C4044; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 4px; }
.san-drawer-link { display: flex; align-items: center; gap: 12px; padding: 13px 12px; border-radius: 10px; border: none; background: transparent; color: #073B3F; font-size: 14px; font-weight: 800; cursor: pointer; text-align: left; }
.san-drawer-link:hover { background: #F3F3F0; }
.san-drawer-link.logout { color: #C92035; }
.san-drawer-groups { flex: 1; overflow-y: auto; padding-right: 4px; }
.san-drawer-group { padding: 14px 0; border-bottom: 1px solid rgba(189,207,206,.6); }
.san-drawer-group strong { display: block; padding: 0 12px 8px; color: #A2764C; font-size: 9px; letter-spacing: .16em; text-transform: uppercase; }

@media (max-width: 1500px) {
  .san-top-inner { min-height: 136px; display: grid; grid-template-columns: auto minmax(220px,340px) 1fr auto; grid-template-rows: 74px 48px; column-gap: 18px; padding: 0 30px 12px; }
  .san-navbar-brand { grid-column: 1; grid-row: 1; }
  .san-search-block { grid-column: 2; grid-row: 1; width: 100%; margin: 0; padding: 0; }
  .san-menu-center { grid-column: 1 / -1; grid-row: 2; width: 100%; height: 48px; justify-content: space-between; border-top: 1px solid rgba(189,207,206,.58); }
  .san-menu-trigger { height: 100%; padding: 0 clamp(8px,1.2vw,18px); font-size: 12px; }
  .san-hamburger { grid-column: 4; grid-row: 1; width: 42px; height: 42px; border: 1px solid rgba(189,207,206,.8); border-radius: 12px; background: #F7F9F8; }
}

@media (max-width: 1100px) {
  .san-sidebar { position: relative; width: 100%; min-height: 0; padding: 14px 16px; border-right: 0; border-bottom: 1px solid rgba(189,207,206,.72); }
  .san-brand { padding-bottom: 14px; }
  .san-side-nav { flex-direction: row; overflow-x: auto; margin-top: 12px; padding-bottom: 3px; }
  .san-side-link { height: 42px; flex: 0 0 auto; padding: 0 14px; }
  .san-quick, .san-secure { display: none; }
  .san-top-shell { margin-left: 0 !important; }
  .san-top-inner { min-height: 82px; display: grid; grid-template-columns: auto minmax(180px,1fr) auto; grid-template-rows: 1fr; gap: 14px; padding: 0 20px; }
  .san-navbar-brand { grid-column: 1; grid-row: 1; }
  .san-navbar-brand img { width: 46px; height: 46px; }
  .san-navbar-brand strong { font-size: 23px; }
  .san-search-block { grid-column: 2; grid-row: 1; width: 100%; padding: 0; margin: 0; }
  .san-menu-center { display: none; }
  .san-hamburger { grid-column: 3; grid-row: 1; }
  .san-mobile-logo { display: none !important; }
}

@media (max-width: 640px) {
  .san-top-inner { min-height: 128px; grid-template-columns: 1fr auto; grid-template-rows: 64px 52px; gap: 0 12px; padding: 0 14px 10px; }
  .san-navbar-brand { grid-column: 1; grid-row: 1; }
  .san-navbar-brand img { width: 40px; height: 40px; }
  .san-navbar-brand strong { font-size: 21px; }
  .san-navbar-brand small { font-size: 8px; }
  .san-hamburger { grid-column: 2; grid-row: 1; }
  .san-search-block { grid-column: 1 / -1; grid-row: 2; }
  .san-search { height: 46px; }
}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes skelShimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
      `}</style>
      <div className="san-shell">
        {showSidebar && (
          <aside className="san-sidebar">
            <div className="san-brand" onClick={() => navigate('/super-admin')} title="Go to dashboard">
              <img src={logo} alt="Luxiva" />
              <div><div className="san-brand-name">LUXIVA</div><div className="san-role">Super Admin</div></div>
            </div>
            <nav className="san-side-nav">
              <button className="san-side-link is-active" type="button" onClick={() => navigate('/super-admin')}><Icon name="home" />Dashboard</button>
              <button className="san-side-link" type="button" onClick={() => navigate('/add-product')}><Icon name="box" />Products</button>
              <button className="san-side-link" type="button" onClick={() => navigate('/admin-orders')}><Icon name="orders" />Orders</button>
<button className="san-side-link" type="button" onClick={() => { setShowTodayRates(true); fetchMetalPrices() }}><Icon name="rate" />Gold Rate</button>
              <button className="san-side-link" type="button"><Icon name="settings" />Settings</button>
            </nav>
            <div className="san-quick">
              <div className="san-quick-title">Quick Summary</div>
              {[['Total Orders', '0', '+0%'], ['Total Customers', '588', '+12.5%'], ['Total Dealers', '41', '+6.8%'], ['Total Products', '256', '+5.2%'], ['Active Users', '7', '+8.3%']].map(([label, value, growth]) => (
                <div className="san-quick-row" key={label}><Icon name="orders" size={19} /><div><small>{label}</small><strong>{value}</strong></div><b>{growth}</b></div>
              ))}
            </div>
            <div className="san-secure"><strong>Manual Control</strong><span>Reports and charts update only when you choose refresh.</span></div>
          </aside>
        )}
        <header className="san-top-shell" style={{ marginLeft: showSidebar ? 286 : 0 }}>
          <div className="san-mobile-logo" onClick={() => navigate('/super-admin')}><img src={logo} alt="Luxiva" /><div><strong>LUXIVA</strong><small>SUPER ADMIN</small></div></div>
          <div className="san-top-inner">
            <button className="san-navbar-brand" type="button" onClick={() => navigate('/super-admin')} title="Go to dashboard"><img src={logo} alt="Luxiva" /><span><strong>LUXIVA</strong><small>SUPER ADMIN</small></span></button>
            <div className="san-search-block">
              <div className="san-search">
                <input
                  value={voiceQuery}
                  onChange={e => setVoiceQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submitVoiceSearch(voiceQuery)}
                  placeholder="Search or speak..."
                  aria-label="Voice or text search"
                  className="san-search-input"
                />
                <button
                  type="button"
                  className={`san-mic-btn ${isListening ? 'is-listening' : ''}`}
                  onClick={toggleMic}
                  title={isListening ? 'Listening... click to stop' : 'Click to speak'}
                  aria-label="Voice search"
                >
                  <Icon name="mic" size={16} />
                </button>
              </div>
            </div>
            <div className="san-menu-center">
              <MenuGroup label="Management" items={management} />
              <MenuGroup label="Celebrations" items={celebrations} />
              <MenuGroup label="Announcements" items={announcements} />
              <MenuGroup label="Coins" items={coins} />
              <MenuGroup label="Reports" items={reports} />
              <MenuGroup label="Promotion" items={promotion} />
              <MenuGroup label="Payment" items={payment} />
              <button className="san-menu-trigger" type="button" onClick={() => navigate('/sold-out-products')}>
                <Icon name="stock" size={16} />Stock
              </button>
            </div>
            <button className="san-hamburger" type="button" onClick={() => setShowMobileDrawer(true)} aria-label="Open menu">
              <Icon name="menu" size={22} />
            </button>
          </div>
        </header>
      </div>

      {/* ── RATE ENTRY POPUP ── */}
      {showRatePopup && (
        <div
          onClick={() => setShowRatePopup(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(17,24,23,0.45)',
            backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
            zIndex: 1300,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'linear-gradient(165deg,#FFFFFF 0%,#FDFCFA 60%,#FBF6ED 100%)',
              border: '1px solid rgba(204,168,129,0.3)',
              borderRadius: '24px',
              width: '95%', maxWidth: '640px',
              maxHeight: '95vh',
              overflowY: 'auto',
              padding: '32px 36px',
              boxShadow: '0 40px 90px rgba(17,24,23,0.28), 0 0 0 1px rgba(204,168,129,0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '12px',
                  background: 'rgba(204,168,129,0.15)', border: '1px solid rgba(204,168,129,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0C4044" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v4M8 6h8l3 5-3 9H8l-3-9 3-5z"/>
                    <path d="M9.5 12c0-1.1.9-2 2.5-2s2.5 1 2.5 2-1.5 1.5-2.5 2-2.5.9-2.5 2 1.1 2 2.5 2 2.5-.9 2.5-2"/>
                  </svg>
                </div>
                <div>
                  <div style={{ color: '#CCA881', fontWeight: 800, fontSize: '16px' }}>ENTER METAL RATES</div>
                  <div style={{ color: '#7A8987', fontSize: '12px', marginTop: '2px' }}>
                    {dbRateDate ? `Current: ${dbRateDate}` : 'No rate entered yet'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowRatePopup(false)}
                style={{
                  background: 'rgba(201,32,53,0.12)', border: '1px solid rgba(201,32,53,0.3)',
                  color: '#C92035', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C92035" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {rateMsg && (
              <div style={{
                background: rateMsg.includes('✅') ? 'rgba(12,64,68,0.1)' : 'rgba(201,32,53,0.1)',
                border: `1px solid ${rateMsg.includes('✅') ? 'rgba(12,64,68,0.3)' : 'rgba(201,32,53,0.3)'}`,
                color: rateMsg.includes('✅') ? '#0C4044' : '#C92035',
                borderRadius: '12px', padding: '13px 16px', fontSize: '13px', marginBottom: '18px'
              }}>
                {rateMsg}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7A8987', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
                Date *
              </label>
              <input
                type="date"
                value={rateForm.date}
                onChange={e => setRateForm({ ...rateForm, date: e.target.value })}
                style={{ width: '100%', background: '#FDFDFC', border: `1px solid #BDCFCE`, borderRadius: '12px', padding: '13px 16px', color: '#111817', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', color: '#CCA881', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>Gold 22K</label>
                <input
                  type="number" placeholder="e.g. 12800"
                  value={rateForm.gold_22k}
                  onChange={e => setRateForm({ ...rateForm, gold_22k: e.target.value })}
                  style={{ width: '100%', background: '#FDFDFC', border: `1px solid rgba(204,168,129,0.4)`, borderRadius: '12px', padding: '13px 16px', color: '#CCA881', fontSize: '15px', fontWeight: 700, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#CCA881', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>Gold 24K</label>
                <input
                  type="number" placeholder="e.g. 13900"
                  value={rateForm.gold_24k}
                  onChange={e => setRateForm({ ...rateForm, gold_24k: e.target.value })}
                  style={{ width: '100%', background: '#FDFDFC', border: `1px solid rgba(204,168,129,0.4)`, borderRadius: '12px', padding: '13px 16px', color: '#CCA881', fontSize: '15px', fontWeight: 700, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#53615F', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>Silver 999</label>
                <input
                  type="number" placeholder="e.g. 225"
                  value={rateForm.silver_999}
                  onChange={e => setRateForm({ ...rateForm, silver_999: e.target.value })}
                  style={{ width: '100%', background: '#FDFDFC', border: `1px solid rgba(192,192,192,0.4)`, borderRadius: '12px', padding: '13px 16px', color: '#53615F', fontSize: '15px', fontWeight: 700, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#7A8987', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>Diamond 18K</label>
                <input
                  type="number" placeholder="e.g. 45000"
                  value={rateForm.diamond_18k}
                  onChange={e => setRateForm({ ...rateForm, diamond_18k: e.target.value })}
                  style={{ width: '100%', background: '#FFFFFF', border: `1px solid #BDCFCE`, borderRadius: '12px', padding: '13px 16px', color: '#073B3F', fontSize: '15px', fontWeight: 700, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#0C4044', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>Diamond 22K</label>
                <input
                  type="number" placeholder="e.g. 55000"
                  value={rateForm.diamond_22k}
                  onChange={e => setRateForm({ ...rateForm, diamond_22k: e.target.value })}
                  style={{ width: '100%', background: '#FDFDFC', border: `1px solid rgba(165,243,252,0.4)`, borderRadius: '12px', padding: '13px 16px', color: '#0C4044', fontSize: '15px', fontWeight: 700, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#7A8987', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>Platinum 92</label>
                <input
                  type="number" placeholder="e.g. 3200"
                  value={rateForm.platinum_92}
                  onChange={e => setRateForm({ ...rateForm, platinum_92: e.target.value })}
                  style={{ width: '100%', background: '#FFFFFF', border: `1px solid #BDCFCE`, borderRadius: '12px', padding: '13px 16px', color: '#073B3F', fontSize: '15px', fontWeight: 700, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
                />
              </div>
            </div>

            <button
              disabled={rateSaving}
              onClick={async () => {
                if (!rateForm.date || !rateForm.gold_22k || !rateForm.gold_24k || !rateForm.silver_999) {
                  setRateMsg('❌ Gold and Silver fields are required.')
                  return
                }
                setRateSaving(true)
                try {
                  await api.post('/metal-rates/', {
                    date: rateForm.date,
                    gold_22k: rateForm.gold_22k,
                    gold_24k: rateForm.gold_24k,
                    silver_999: rateForm.silver_999,
                    diamond_18k: rateForm.diamond_18k || 0,
                    diamond_22k: rateForm.diamond_22k || 0,
                    platinum_92: rateForm.platinum_92 || 0,
                  })
                  setRateMsg('✅ Rate saved successfully!')
                  fetchMetalPrices()
                  setTimeout(() => setShowRatePopup(false), 1400)
                } catch (err) {
                  setRateMsg('❌ Failed: ' + JSON.stringify(err.response?.data))
                }
                setRateSaving(false)
              }}
              style={{
                marginTop: '22px',
                width: '100%', padding: '15px',
                background: rateSaving ? 'rgba(204,168,129,0.3)' : 'linear-gradient(135deg,#CCA881,#BB8958)',
                border: 'none', borderRadius: '14px',
                fontWeight: 800, color: rateSaving ? '#CCA881' : '#FDFDFC',
                fontSize: '15px', cursor: rateSaving ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              {rateSaving ? 'Saving...' : 'Save Rate'}
            </button>
          </div>
        </div>
      )}

      {/* ── TODAY RATES MODAL ── */}
      {showTodayRates && (
        <div
          onClick={() => setShowTodayRates(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'linear-gradient(165deg,#FFFFFF 0%,#FDFCFA 60%,#FBF6ED 100%)', border: '1px solid rgba(204,168,129,0.28)', borderRadius: '24px', width: '95%', maxWidth: '480px', maxHeight: '95vh', overflowY: 'auto', padding: '26px 32px', boxShadow: '0 40px 90px rgba(17,24,23,0.28), 0 0 0 1px rgba(204,168,129,0.08)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '13px', background: 'linear-gradient(145deg,rgba(12,64,68,0.14),rgba(12,64,68,0.06))', border: '1px solid rgba(12,64,68,0.26)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0C4044" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <div style={{ color: '#0C4044', fontWeight: 900, fontSize: '15px' }}>TODAY'S METAL RATES</div>
                  <div style={{ color: '#53615F', fontSize: '12px', fontWeight: 650, marginTop: '4px' }}>
                    {dbRateDate ? new Date(dbRateDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'No rate entered yet'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowTodayRates(false)}
                style={{ background: 'rgba(201,32,53,0.12)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C92035" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {[
              { label: 'Gold 22K', color: '#8A5A25', rgb: '204,168,129', value: metalPrices.gold22k },
              { label: 'Gold 24K', color: '#8A5A25', rgb: '204,168,129', value: metalPrices.gold24k },
              { label: 'Silver 999', color: '#0C4044', rgb: '12,64,68', value: metalPrices.silver },
              { label: 'Diamond 18K', color: '#53615F', rgb: '209,223,222', value: metalPrices.diamond18k },
              { label: 'Diamond 22K', color: '#0C4044', rgb: '12,64,68', value: metalPrices.diamond22k },
              { label: 'Platinum 92', color: '#53615F', rgb: '231,237,236', value: metalPrices.platinum92 },
            ].map(item => (
              <div key={item.label} style={{ background: '#FFFFFF', border: `1px solid rgba(${item.rgb},0.3)`, borderRadius: '14px', padding: '12px 18px', marginBottom: '9px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ color: item.color, fontWeight: 800, fontSize: '13px' }}>{item.label}</div>
                  <div style={{ color: '#53615F', fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>per gram</div>
                </div>
                <div style={{ color: item.color, fontWeight: 900, fontSize: '17px', fontFamily: 'monospace' }}>
                  {item.value ? item.value.toFixed(2) : <span style={{ color: '#7A8987', fontSize: '13px' }}>Not set</span>}
                </div>
              </div>
            ))}

            <button
              onClick={() => { setShowTodayRates(false); setShowRatePopup(true); setRateMsg('') }}
              style={{ width: '100%', marginTop: '6px', padding: '14px', background: 'linear-gradient(135deg,#CCA881,#BB8958)', border: 'none', borderRadius: '14px', fontWeight: 800, color: '#FDFDFC', fontSize: '14px', cursor: 'pointer' }}
            >
              Update Rates
            </button>
          </div>
        </div>
      )}

      {/* ── BIRTHDAY LIST MODAL ── */}
      {showBirthdayList && (
        <div onClick={() => setShowBirthdayList(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.45)', backdropFilter: 'blur(6px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(165deg,#FFFFFF 0%,#FDFCFA 60%,#FDF0F1 100%)', border: '1px solid rgba(201,32,53,0.22)', borderRadius: '24px', width: '95%', maxWidth: '500px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 40px 90px rgba(17,24,23,0.24)' }}>
            <div style={{ flexShrink: 0, padding: '24px 28px', borderBottom: '1px solid rgba(201,32,53,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(145deg,rgba(201,32,53,0.16),rgba(201,32,53,0.08))', border: '1px solid rgba(201,32,53,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C92035" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 21h16v-7a4 4 0 00-4-4H8a4 4 0 00-4 4v7z"/><path d="M4 17c1 0 1.5-1 2.5-1s1.5 1 2.5 1 1.5-1 2.5-1 1.5 1 2.5 1 1.5-1 2.5-1"/><path d="M12 10V6M9 6c0-1 1-1 1-2s-1-1-1-2M15 6c0-1-1-1-1-2s1-1 1-2"/>
                  </svg>
                </div>
                <div>
                  <div style={{ color: '#C92035', fontWeight: 800, fontSize: '14px' }}>TODAY'S BIRTHDAYS</div>
                  <div style={{ color: '#53615F', fontSize: '12px', fontWeight: 650, marginTop: '4px' }}>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                </div>
              </div>
              <button onClick={() => setShowBirthdayList(false)} style={{ background: 'rgba(201,32,53,0.12)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C92035" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {celebLoading ? (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
    {[1,2,3].map(n => (
      <div key={n} style={{ height: '78px', borderRadius: '16px', background: 'linear-gradient(90deg,#F3F3F0 25%,#E7EDEC 50%,#F3F3F0 75%)', backgroundSize: '200% 100%', animation: 'skelShimmer 1.4s ease-in-out infinite' }} />
    ))}
  </div>
) : birthdayList.length === 0 ? (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textAlign: 'center', color: '#7A8987', padding: '50px 0', fontSize: '14px' }}>
    No birthdays today
  </div>
) : birthdayList.map((m, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setSpecialAnnForm({
                      title: `Happy Birthday ${m.first_name} ${m.last_name || ''} (${m._id})`,
                      message: `By BitByte Technologies — Wishing you a wonderful birthday! May this special day bring you joy, happiness, and all the success you deserve. Here's to another amazing year! 🎉🎂`,
                      roles: ['admin', 'dealer', 'sub_dealer', 'promotor', 'customer']
                    })
                    setShowBirthdayList(false)
                    setShowSpecialAnn(true)
                    setSpecialAnnMsg('')
                  }}
                  style={{ background: '#FFFFFF', border: '1px solid rgba(201,32,53,0.2)', borderRadius: '16px', padding: '16px 20px', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', background: 'rgba(201,32,53,0.1)', color: m._roleColor, border: '1px solid rgba(201,32,53,0.3)' }}>{m._role}</span>
                        <span style={{ color: '#C92035', fontFamily: 'monospace', fontSize: '10px' }}>{m._id}</span>
                      </div>
                      <div style={{ color: '#111817', fontWeight: 700, fontSize: '14px' }}>{m.first_name} {m.last_name || ''}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#7A8987', fontSize: '11px', marginTop: '3px' }}>
                        {new Date(m._dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'long' })}
                      </div>
                    </div>
                    <div style={{ color: '#C92035', fontSize: '11px', fontWeight: 700 }}>Click to Wish</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ANNIVERSARY LIST MODAL ── */}
      {showAnniversaryList && (
        <div onClick={() => setShowAnniversaryList(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.45)', backdropFilter: 'blur(6px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(165deg,#FFFFFF 0%,#FDFCFA 60%,#FBF6ED 100%)', border: '1px solid rgba(204,168,129,0.28)', borderRadius: '24px', width: '95%', maxWidth: '500px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 40px 90px rgba(17,24,23,0.24)' }}>
            <div style={{ flexShrink: 0, padding: '24px 28px', borderBottom: '1px solid rgba(204,168,129,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(145deg,rgba(204,168,129,0.2),rgba(204,168,129,0.1))', border: '1px solid rgba(204,168,129,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0C4044" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="15" r="6"/><path d="M9 9l3-6 3 6" strokeLinejoin="round"/></svg>
                </div>
                <div>
                  <div style={{ color: '#CCA881', fontWeight: 800, fontSize: '14px' }}>TODAY'S ANNIVERSARIES</div>
                  <div style={{ color: '#53615F', fontSize: '12px', fontWeight: 650, marginTop: '4px' }}>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                </div>
              </div>
              <button onClick={() => setShowAnniversaryList(false)} style={{ background: 'rgba(201,32,53,0.12)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C92035" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {celebLoading ? (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
    {[1,2,3].map(n => (
      <div key={n} style={{ height: '78px', borderRadius: '16px', background: 'linear-gradient(90deg,#F3F3F0 25%,#E7EDEC 50%,#F3F3F0 75%)', backgroundSize: '200% 100%', animation: 'skelShimmer 1.4s ease-in-out infinite' }} />
    ))}
  </div>
) : anniversaryList.length === 0 ? (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textAlign: 'center', color: '#7A8987', padding: '50px 0', fontSize: '14px' }}>
    No anniversaries today
  </div>
) : anniversaryList.map((m, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setSpecialAnnForm({
                      title: `🎉 Happy Anniversary ${m.first_name} ${m.last_name || ''} (${m._id})`,
                      message: `By BitByte Technologies — Wishing you a beautiful anniversary! May your bond grow stronger with each passing year. Here's to celebrating love and togetherness!`,
                      roles: ['admin', 'dealer', 'sub_dealer', 'promotor', 'customer']
                    })
                    setShowAnniversaryList(false)
                    setShowSpecialAnn(true)
                    setSpecialAnnMsg('')
                  }}
                  style={{ background: '#FFFFFF', border: '1px solid rgba(204,168,129,0.24)', borderRadius: '16px', padding: '16px 20px', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', background: 'rgba(204,168,129,0.15)', color: '#CCA881', border: '1px solid rgba(204,168,129,0.35)' }}>{m._role}</span>
                        <span style={{ color: '#CCA881', fontFamily: 'monospace', fontSize: '10px' }}>{m._id}</span>
                      </div>
                      <div style={{ color: '#111817', fontWeight: 700, fontSize: '14px' }}>{m.first_name} {m.last_name || ''}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#7A8987', fontSize: '11px', marginTop: '3px' }}>
                        {new Date(m._ann).toLocaleDateString('en-IN', { day: '2-digit', month: 'long' })}
                      </div>
                    </div>
                    <div style={{ color: '#CCA881', fontSize: '11px', fontWeight: 700 }}>Click to Wish</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── JOIN DATE LIST MODAL ── */}
      {showJoinDateList && (
        <div onClick={() => setShowJoinDateList(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.45)', backdropFilter: 'blur(6px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(165deg,#FFFFFF 0%,#FDFCFA 60%,#FBF3E9 100%)', border: '1px solid rgba(187,137,88,0.28)', borderRadius: '24px', width: '95%', maxWidth: '500px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 40px 90px rgba(17,24,23,0.24)' }}>
            <div style={{ flexShrink: 0, padding: '24px 28px', borderBottom: '1px solid rgba(187,137,88,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(145deg,rgba(187,137,88,0.2),rgba(187,137,88,0.1))', border: '1px solid rgba(187,137,88,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#BB8958" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 4h8v6a4 4 0 01-8 0V4z"/><path d="M8 5H5a2 2 0 002 4M16 5h3a2 2 0 01-2 4"/><path d="M12 14v3M9 21h6M9 21l1-4h4l1 4"/></svg>
                </div>
                <div>
                  <div style={{ color: '#BB8958', fontWeight: 800, fontSize: '14px' }}>WORK ANNIVERSARIES</div>
                  <div style={{ color: '#53615F', fontSize: '12px', fontWeight: 650, marginTop: '4px' }}>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                </div>
              </div>
              <button onClick={() => setShowJoinDateList(false)} style={{ background: 'rgba(201,32,53,0.12)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C92035" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {celebLoading ? (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
    {[1,2,3].map(n => (
      <div key={n} style={{ height: '78px', borderRadius: '16px', background: 'linear-gradient(90deg,#F3F3F0 25%,#E7EDEC 50%,#F3F3F0 75%)', backgroundSize: '200% 100%', animation: 'skelShimmer 1.4s ease-in-out infinite' }} />
    ))}
  </div>
) : joinDateList.length === 0 ? (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', textAlign: 'center', padding: '60px 0' }}>
    <span style={{ color: '#7A8987', fontSize: '14px', fontWeight: 600 }}>No work anniversaries today</span>
  </div>
) : joinDateList.map((m, i) => (
                <div
                  key={i}
                  onClick={() => {
                    const yrs = m._yearsCompleted
                    const ordinal = yrs === 1 ? '1st' : yrs === 2 ? '2nd' : yrs === 3 ? '3rd' : `${yrs}th`
                    setSpecialAnnForm({
                      title: `🎉 Happy ${ordinal} Work Anniversary ${m.first_name} ${m.last_name || ''} (${m._id})`,
                      message: `By BitByte Technologies — Congratulations on completing ${yrs} amazing year${yrs > 1 ? 's' : ''} with us! Your dedication and hard work are truly valued. Here's to many more years of success together!`,
                      roles: ['admin', 'dealer', 'sub_dealer', 'promotor', 'customer']
                    })
                    setShowJoinDateList(false)
                    setShowSpecialAnn(true)
                    setSpecialAnnMsg('')
                  }}
                  style={{ background: '#FFFFFF', border: '1px solid rgba(187,137,88,0.24)', borderRadius: '16px', padding: '16px 20px', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', background: 'rgba(187,137,88,0.15)', color: '#BB8958', border: '1px solid rgba(187,137,88,0.35)' }}>{m._role}</span>
                        <span style={{ color: '#BB8958', fontFamily: 'monospace', fontSize: '10px' }}>{m._id}</span>
                      </div>
                      <div style={{ color: '#111817', fontWeight: 700, fontSize: '14px' }}>{m.first_name} {m.last_name || ''}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#BB8958', fontSize: '12px', fontWeight: 700, marginTop: '3px' }}>
                        {m._yearsCompleted === 1 ? '1st' : m._yearsCompleted === 2 ? '2nd' : m._yearsCompleted === 3 ? '3rd' : `${m._yearsCompleted}th`} Year Anniversary
                      </div>
                      <div style={{ color: '#7A8987', fontSize: '11px' }}>Joined: {new Date(m._joined).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                    </div>
                    <div style={{ color: '#BB8958', fontSize: '11px', fontWeight: 700 }}>Click to Wish</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SPECIAL ANNOUNCEMENT MODAL (Birthday/Anniversary/JoinDate) ── */}
      {showSpecialAnn && (
        <div onClick={() => setShowSpecialAnn(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.85)', backdropFilter: 'blur(12px)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#FDFDFC', border: '1px solid rgba(187,137,88,0.3)', borderRadius: '24px', width: '95%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', boxShadow: '0 32px 80px rgba(17,24,23,0.7)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(187,137,88,0.15)', border: '1px solid rgba(187,137,88,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div>
                <div>
                  <div style={{ color: '#BB8958', fontWeight: 800, fontSize: '15px' }}>SEND ANNOUNCEMENT</div>
                  <div style={{ color: '#53615F', fontSize: '12px', fontWeight: 650, marginTop: '4px' }}>Review & send the wish</div>
                </div>
              </div>
              <button onClick={() => setShowSpecialAnn(false)} style={{ background: 'rgba(201,32,53,0.1)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px' }}>Close</button>
            </div>
            {specialAnnMsg && (
              <div style={{ background: specialAnnMsg.includes('✅') ? 'rgba(12,64,68,0.1)' : 'rgba(201,32,53,0.1)', border: `1px solid ${specialAnnMsg.includes('✅') ? 'rgba(12,64,68,0.3)' : 'rgba(201,32,53,0.3)'}`, color: specialAnnMsg.includes('✅') ? '#0C4044' : '#C92035', borderRadius: '12px', padding: '13px 16px', fontSize: '13px', marginBottom: '18px' }}>
                {specialAnnMsg}
              </div>
            )}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#7A8987', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Announcement Title</label>
              <input
                value={specialAnnForm.title}
                onChange={e => setSpecialAnnForm({ ...specialAnnForm, title: e.target.value })}
                style={{ width: '100%', background: '#FDFDFC', border: '1px solid #BDCFCE', borderRadius: '12px', padding: '13px 16px', color: '#111817', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#7A8987', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Message</label>
              <textarea
                value={specialAnnForm.message}
                onChange={e => setSpecialAnnForm({ ...specialAnnForm, message: e.target.value })}
                rows={4}
                style={{ width: '100%', background: '#FDFDFC', border: '1px solid #BDCFCE', borderRadius: '12px', padding: '13px 16px', color: '#111817', fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.6' }}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: '#7A8987', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>Send To</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {[
                  { key: 'admin', label: 'Admin', color: '#53615F' },
                  { key: 'dealer', label: 'Dealer', color: '#0C4044' },
                  { key: 'sub_dealer', label: 'Sub Dealer', color: '#BB8958' },
                  { key: 'promotor', label: 'Promotor', color: '#CCA881' },
                  { key: 'customer', label: 'Customer', color: '#C92035' },
                ].map(role => {
                  const checked = specialAnnForm.roles.includes(role.key)
                  return (
                    <div key={role.key}
                      onClick={() => {
                        const updated = checked ? specialAnnForm.roles.filter(x => x !== role.key) : [...specialAnnForm.roles, role.key]
                        setSpecialAnnForm({ ...specialAnnForm, roles: updated })
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', background: checked ? `${role.color}22` : `${role.color}09`, border: `1.5px solid ${checked ? `${role.color}99` : `${role.color}33`}` }}
                    >
                      <div style={{ width: '14px', height: '14px', borderRadius: '4px', border: `2px solid ${role.color}`, background: checked ? role.color : 'transparent' }} />
                      <span style={{ color: checked ? role.color : '#7A8987', fontSize: '12px', fontWeight: checked ? 700 : 500 }}>{role.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <button
              disabled={specialAnnSending}
              onClick={async () => {
                if (!specialAnnForm.title.trim() || !specialAnnForm.message.trim()) { setSpecialAnnMsg('Title and Message required.'); return }
                if (specialAnnForm.roles.length === 0) { setSpecialAnnMsg('Select at least one role.'); return }
                setSpecialAnnSending(true)
                try {
                  await api.post('/announcements/', { title: specialAnnForm.title, message: specialAnnForm.message, target_roles: specialAnnForm.roles })
                  setSpecialAnnMsg('Announcement sent successfully!')
                  fetchMyAnnouncements()
                  setTimeout(() => setShowSpecialAnn(false), 1500)
                } catch (err) {
                  setSpecialAnnMsg('Failed: ' + JSON.stringify(err.response?.data))
                }
                setSpecialAnnSending(false)
              }}
              style={{ width: '100%', padding: '14px', background: specialAnnSending ? 'rgba(187,137,88,0.3)' : 'linear-gradient(90deg,#BB8958,#BB8958)', border: 'none', borderRadius: '12px', fontWeight: 800, color: specialAnnSending ? '#BB8958' : '#111817', fontSize: '15px', cursor: specialAnnSending ? 'not-allowed' : 'pointer' }}
            >
              {specialAnnSending ? 'Sending...' : 'Send Announcement'}
            </button>
          </div>
        </div>
      )}

      {/* ── ANNOUNCEMENT SEND MODAL ── */}
      {showAnnouncement && (
        <div onClick={() => setShowAnnouncement(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.45)', backdropFilter: 'blur(6px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(165deg,#FFFFFF 0%,#FDFCFA 60%,#FBF3E9 100%)', border: '1px solid rgba(187,137,88,0.28)', borderRadius: '24px', width: '95%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto', padding: '32px 36px', boxShadow: '0 40px 90px rgba(17,24,23,0.28)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '26px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '13px', background: 'linear-gradient(145deg,rgba(187,137,88,0.22),rgba(187,137,88,0.1))', border: '1px solid rgba(187,137,88,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#BB8958" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10v4a1 1 0 001 1h2l6 4V5L6 9H4a1 1 0 00-1 1z"/><path d="M16 8a4 4 0 010 8M19 6a7 7 0 010 12"/></svg>
                </div>
                <div>
                  <div style={{ color: '#BB8958', fontWeight: 800, fontSize: '15px' }}>SEND ANNOUNCEMENT</div>
                  <div style={{ color: '#53615F', fontSize: '12px', fontWeight: 650, marginTop: '4px' }}>Notify selected roles instantly</div>
                </div>
              </div>
              <button onClick={() => setShowAnnouncement(false)} style={{ background: 'rgba(201,32,53,0.12)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C92035" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {announcementMsg && (
              <div style={{ background: announcementMsg.includes('✅') ? 'rgba(12,64,68,0.1)' : 'rgba(201,32,53,0.1)', border: `1px solid ${announcementMsg.includes('✅') ? 'rgba(12,64,68,0.3)' : 'rgba(201,32,53,0.3)'}`, color: announcementMsg.includes('✅') ? '#0C4044' : '#C92035', borderRadius: '12px', padding: '13px 16px', fontSize: '13px', marginBottom: '18px' }}>
                {announcementMsg}
              </div>
            )}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#7A8987', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Announcement Title *</label>
              <input
                value={announcementForm.title}
                onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                placeholder="e.g. Tomorrow Leave, Low Orders Alert..."
                style={{ width: '100%', background: '#FDFDFC', border: '1px solid #BDCFCE', borderRadius: '12px', padding: '13px 16px', color: '#111817', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#7A8987', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Message *</label>
              <textarea
                value={announcementForm.message}
                onChange={e => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                rows={4}
                placeholder="Type your announcement here..."
                style={{ width: '100%', background: '#FDFDFC', border: '1px solid #BDCFCE', borderRadius: '12px', padding: '13px 16px', color: '#111817', fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.6' }}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: '#7A8987', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>Send To (Select Roles) *</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {[
                  { key: 'admin', label: 'Admin', color: '#53615F' },
                  { key: 'dealer', label: 'Dealer', color: '#0C4044' },
                  { key: 'sub_dealer', label: 'Sub Dealer', color: '#BB8958' },
                  { key: 'promotor', label: 'Promotor', color: '#CCA881' },
                  { key: 'customer', label: 'Customer', color: '#C92035' },
                ].map(role => {
                  const checked = announcementForm.roles.includes(role.key)
                  return (
                    <div key={role.key}
                      onClick={() => {
                        const updated = checked ? announcementForm.roles.filter(x => x !== role.key) : [...announcementForm.roles, role.key]
                        setAnnouncementForm({ ...announcementForm, roles: updated })
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '999px', cursor: 'pointer', background: checked ? `${role.color}22` : '#FFFFFF', border: `1.5px solid ${checked ? `${role.color}88` : 'rgba(189,207,206,0.6)'}` }}
                    >
                      <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${checked ? role.color : `${role.color}55`}`, background: checked ? role.color : 'transparent' }} />
                      <span style={{ fontSize: '13px', fontWeight: checked ? 700 : 500, color: checked ? role.color : '#7A8987' }}>{role.label}</span>
                    </div>
                  )
                })}
              </div>
              <button
                onClick={() => {
                  const all = ['admin', 'dealer', 'sub_dealer', 'promotor', 'customer']
                  const allSelected = all.every(r => announcementForm.roles.includes(r))
                  setAnnouncementForm({ ...announcementForm, roles: allSelected ? [] : all })
                }}
                style={{ marginTop: '10px', padding: '6px 14px', fontSize: '11px', fontWeight: 700, background: 'rgba(187,137,88,0.1)', border: '1px solid rgba(187,137,88,0.3)', borderRadius: '8px', color: '#BB8958', cursor: 'pointer' }}
              >
                {['admin', 'dealer', 'sub_dealer', 'promotor', 'customer'].every(r => announcementForm.roles.includes(r)) ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <button
              disabled={announcingSending}
              onClick={async () => {
                if (!announcementForm.title.trim() || !announcementForm.message.trim()) { setAnnouncementMsg('❌ Title and Message are required.'); return }
                if (announcementForm.roles.length === 0) { setAnnouncementMsg('❌ Please select at least one role.'); return }
                setAnnouncingSending(true)
                try {
                  await api.post('/announcements/', { title: announcementForm.title, message: announcementForm.message, target_roles: announcementForm.roles })
                  setAnnouncementMsg('✅ Announcement sent successfully!')
                  setAnnouncementForm({ title: '', message: '', roles: [] })
                  fetchMyAnnouncements()
                } catch (err) {
                  setAnnouncementMsg('❌ Failed: ' + JSON.stringify(err.response?.data))
                }
                setAnnouncingSending(false)
              }}
              style={{ width: '100%', padding: '15px', background: announcingSending ? 'rgba(187,137,88,0.3)' : 'linear-gradient(135deg,#CCA881,#BB8958)', border: 'none', borderRadius: '14px', fontWeight: 800, color: announcingSending ? '#BB8958' : '#FDFDFC', fontSize: '15px', cursor: announcingSending ? 'not-allowed' : 'pointer' }}
            >
              {announcingSending ? 'Sending...' : 'Send Announcement'}
            </button>
          </div>
        </div>
      )}

      {/* ── MY ANNOUNCEMENTS MODAL ── */}
      {showMyAnnouncements && (
        <div onClick={() => setShowMyAnnouncements(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.45)', backdropFilter: 'blur(6px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(165deg,#FFFFFF 0%,#FDFCFA 60%,#EEF4F3 100%)', border: '1px solid rgba(12,64,68,0.16)', borderRadius: '24px', width: '95%', maxWidth: '560px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 40px 90px rgba(17,24,23,0.24)' }}>
            <div style={{ flexShrink: 0, padding: '24px 28px', borderBottom: '1px solid rgba(12,64,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(145deg,rgba(12,64,68,0.14),rgba(12,64,68,0.06))', border: '1px solid rgba(12,64,68,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0C4044" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="13" rx="2"/><path d="M2 9l10 6 10-6"/><path d="M16 3l3 3-3 3"/></svg>
                </div>
                <div>
                  <div style={{ color: '#0C4044', fontWeight: 900, fontSize: '14px' }}>MY ANNOUNCEMENTS</div>
                  <div style={{ color: '#53615F', fontSize: '12px', fontWeight: 650, marginTop: '4px' }}>{myAnnouncements.length} total sent by Super Admin</div>
                </div>
              </div>
              <button onClick={() => setShowMyAnnouncements(false)} style={{ background: 'rgba(201,32,53,0.12)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C92035" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {myAnnouncements.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#7A8987', padding: '60px 0', fontSize: '15px' }}>No announcements yet.</div>
              ) : myAnnouncements.map((ann, idx) => (
                <div key={ann.id} style={{ background: idx === 0 ? 'rgba(12,64,68,0.04)' : '#FFFFFF', border: `1px solid ${idx === 0 ? 'rgba(12,64,68,0.3)' : 'rgba(189,207,206,0.5)'}`, borderRadius: '16px', padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {idx === 0 && <span style={{ fontSize: '9px', fontWeight: 800, padding: '3px 10px', borderRadius: '20px', background: 'rgba(12,64,68,0.12)', color: '#0C4044', border: '1px solid rgba(12,64,68,0.28)' }}>● NEW</span>}
                      <span style={{ color: idx === 0 ? '#073B3F' : '#111817', fontWeight: 700, fontSize: '14px' }}>{ann.title}</span>
                    </div>
                    <span style={{ color: '#7A8987', fontSize: '10px', whiteSpace: 'nowrap' }}>{new Date(ann.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div style={{ color: '#7A8987', fontSize: '13px', lineHeight: 1.6 }}>{ann.message}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PROFILE UPDATE REQUESTS MODAL ── */}
      {showRequests && (
        <div
          onClick={() => { setShowRequests(false); setSelectedRequest(null) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.45)', backdropFilter: 'blur(6px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#FDFDFC', border: '1px solid rgba(204,168,129,0.3)', borderRadius: '24px', width: '95%', maxWidth: selectedRequest ? '900px' : '560px', maxHeight: '88vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(17,24,23,0.6)' }}
          >
            <div style={{ padding: '22px 28px', borderBottom: '1px solid rgba(204,168,129,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#CCA881', fontWeight: 800, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                  PROFILE UPDATE REQUESTS
                </div>
                <div style={{ color: '#7A8987', fontSize: '11px', marginTop: '3px' }}>{profileRequests.length} pending requests</div>
              </div>
              <button
                onClick={() => { setShowRequests(false); setSelectedRequest(null) }}
                style={{ background: 'rgba(201,32,53,0.12)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C92035" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {requestMsg && (
              <div style={{ margin: '14px 28px 0', background: requestMsg.includes('successfully') ? 'rgba(12,64,68,0.1)' : 'rgba(201,32,53,0.1)', border: `1px solid ${requestMsg.includes('successfully') ? 'rgba(12,64,68,0.3)' : 'rgba(201,32,53,0.3)'}`, color: requestMsg.includes('successfully') ? '#0C4044' : '#C92035', borderRadius: '10px', padding: '10px 14px', fontSize: '13px' }}>
                {requestMsg}
              </div>
            )}

            {!selectedRequest ? (
              <div style={{ padding: '20px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {profileRequests.length === 0 ? (
                  <div style={{ color: '#7A8987', textAlign: 'center', padding: '50px 0' }}>No pending profile requests.</div>
                ) : profileRequests.map(req => (
                  <div
                    key={req.id}
                    onClick={() => setSelectedRequest(req)}
                    style={{ background: 'rgba(17,24,23,0.03)', border: '1px solid rgba(204,168,129,0.22)', borderRadius: '14px', padding: '16px 18px', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                      <div>
                        <div style={{ color: '#CCA881', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase' }}>{req.role}</div>
                        <div style={{ color: '#111817', fontWeight: 700, fontSize: '15px', marginTop: '4px' }}>{req.first_name} {req.last_name}</div>
                        <div style={{ color: '#7A8987', fontSize: '12px', marginTop: '4px' }}>{req.email}</div>
                      </div>
                      <div style={{ color: '#7A8987', fontSize: '11px', whiteSpace: 'nowrap' }}>{new Date(req.created_at).toLocaleDateString('en-IN')}</div>
                    </div>
                    {req.message && (
                      <div style={{ color: '#7A8987', fontSize: '13px', marginTop: '10px', lineHeight: 1.5 }}>{req.message}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '20px 28px', overflowY: 'auto' }}>
                <button
                  onClick={() => setSelectedRequest(null)}
                  style={{ marginBottom: '14px', background: 'rgba(204,168,129,0.1)', border: '1px solid rgba(204,168,129,0.3)', color: '#CCA881', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', fontSize: '12px' }}
                >
                  Back to Requests
                </button>
                <div style={{ color: '#CCA881', fontWeight: 800, marginBottom: '14px' }}>REQUEST DETAILS</div>

                {selectedRequest.message && (
                  <div style={{ background: 'rgba(189,207,206,0.06)', border: '1px solid rgba(189,207,206,0.2)', borderRadius: '12px', padding: '14px 16px', color: '#111817', fontSize: '14px', marginBottom: '16px', lineHeight: 1.6 }}>
                    {selectedRequest.message}
                  </div>
                )}

                {selectedRequest.proof_document && (
                  <button
                    onClick={async () => {
                      const url = selectedRequest.proof_document
                      const fullUrl = url.startsWith('http') ? url : `https://bitbyte-e-commerce.onrender.com/${url.replace(/^\//, '')}`
                      setProofUrl(''); setProofType(''); setProofLoading(true); setProofModal(true)
                      try {
                        const token = localStorage.getItem('token')
                        const response = await fetch(fullUrl, { headers: { Authorization: `Bearer ${token}` } })
                        if (!response.ok) throw new Error('fetch failed')
                        const contentType = response.headers.get('content-type') || ''
                        const blob = await response.blob()
                        const objectUrl = URL.createObjectURL(blob)
                        const isPdf = contentType.includes('pdf') || fullUrl.toLowerCase().includes('.pdf')
                        setProofType(isPdf ? 'pdf' : 'image')
                        setProofUrl(objectUrl)
                      } catch {
                        const isPdf = fullUrl.toLowerCase().includes('.pdf')
                        setProofType(isPdf ? 'pdf' : 'image')
                        setProofUrl(fullUrl)
                      } finally {
                        setProofLoading(false)
                      }
                    }}
                    style={{ marginBottom: '16px', background: 'rgba(187,137,88,0.1)', border: '1px solid rgba(187,137,88,0.35)', color: '#BB8958', borderRadius: '10px', padding: '10px 16px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}
                  >
                    View Proof Document
                  </button>
                )}

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', color: '#CCA881', padding: '10px', borderBottom: '1px solid rgba(189,207,206,0.78)' }}>Field</th>
                        <th style={{ textAlign: 'left', color: '#CCA881', padding: '10px', borderBottom: '1px solid rgba(189,207,206,0.78)' }}>Details To Update</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['initial', 'Initial'], ['first_name', 'First Name'], ['last_name', 'Last Name'],
                        ['mobile_number', 'Mobile Number'], ['gender', 'Gender'], ['dob', 'DOB'],
                        ['married_status', 'Married Status'], ['anniversary_date', 'Anniversary Date'],
                        ['door_no', 'Door No'], ['street_name', 'Street Name'], ['town_name', 'Town Name'],
                        ['city_name', 'City Name'], ['district', 'District'], ['state', 'State'],
                        ['aadhaar_no', 'Aadhaar No'], ['pan_no', 'PAN No'], ['occupation', 'Occupation'],
                        ['occupation_detail', 'Occupation Detail'], ['annual_salary', 'Annual Salary'],
                      ].map(([key, label]) => (
                        selectedRequest[key] ? (
                          <tr key={key}>
                            <td style={{ padding: '10px', color: '#7A8987', borderBottom: '1px solid rgba(189,207,206,0.78)' }}>{label}</td>
                            <td style={{ padding: '10px', color: '#111817', borderBottom: '1px solid rgba(189,207,206,0.78)' }}>{selectedRequest[key]}</td>
                          </tr>
                        ) : null
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={() => approveProfileRequest(selectedRequest.id)}
                  style={{ width: '100%', marginTop: '20px', padding: '13px', background: 'linear-gradient(90deg,#CCA881,#BDCFCE)', border: 'none', borderRadius: '12px', color: '#FDFDFC', fontWeight: 900, cursor: 'pointer' }}
                >
                  Approve Request
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MOBILE HAMBURGER DRAWER ── */}
      {showMobileDrawer && (
        <>
          <div className="san-drawer-overlay" onClick={() => setShowMobileDrawer(false)} />
          <div className="san-drawer">
            <div className="san-drawer-head">
              <span className="san-drawer-title">Command Menu</span>
              <button className="san-drawer-close" onClick={() => setShowMobileDrawer(false)} aria-label="Close menu">
                <Icon name="close" size={20} />
              </button>
            </div>
            <div className="san-drawer-groups">
              {mobileMenuGroups.map(([label, items]) => (
                <section className="san-drawer-group" key={label}>
                  <strong>{label}</strong>
                  {items.map(([text, action]) => (
                    <button className="san-drawer-link" type="button" key={text} onClick={() => { setShowMobileDrawer(false); action() }}>
                      <span>{text}</span><span>↗</span>
                    </button>
                  ))}
                </section>
              ))}
              <section className="san-drawer-group">
                <strong>Inventory</strong>
                <button className="san-drawer-link" type="button" onClick={() => { setShowMobileDrawer(false); navigate('/sold-out-products') }}><span>Stock</span><span>↗</span></button>
              </section>
            </div>
            <button className="san-drawer-link logout" onClick={() => { setShowMobileDrawer(false); logout() }}>
              <Icon name="logout" size={18} />Logout
            </button>
          </div>
        </>
      )}

      {/* ── PROOF DOCUMENT PREVIEW MODAL ── */}
      {proofModal && (
        <div
          onClick={() => {
            if (proofUrl?.startsWith('blob:')) URL.revokeObjectURL(proofUrl)
            setProofModal(false); setProofUrl(''); setProofType('')
          }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,23,0.92)', backdropFilter: 'blur(14px)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#FDFDFC', border: '1px solid rgba(187,137,88,0.35)', borderRadius: '20px', width: '95%', maxWidth: '780px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(17,24,23,0.7)' }}
          >
            <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(187,137,88,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: '#BB8958', fontWeight: 800, fontSize: '13px' }}>PROOF DOCUMENT</div>
                <div style={{ color: '#7A8987', fontSize: '10px', marginTop: '2px' }}>
                  {selectedRequest?.first_name} {selectedRequest?.last_name} {selectedRequest?.role?.toUpperCase()}
                </div>
              </div>
              <button
                onClick={() => { setProofModal(false); setProofUrl('') }}
                style={{ background: 'rgba(201,32,53,0.1)', border: '1px solid rgba(201,32,53,0.3)', color: '#C92035', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px' }}
              >
                Close
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', flexDirection: 'column' }}>
              {proofLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: 40, height: 40, border: '3px solid rgba(187,137,88,0.2)', borderTop: '3px solid #BB8958', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <span style={{ color: '#7A8987', fontSize: '14px' }}>Loading document...</span>
                </div>
              )}
              {!proofLoading && proofType === 'image' && proofUrl && (
                <img src={proofUrl} alt="Proof" style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: '12px', border: '1px solid rgba(187,137,88,0.2)' }} onError={() => setProofType('error')} />
              )}
              {!proofLoading && proofType === 'pdf' && proofUrl && (
                <iframe src={proofUrl} style={{ width: '100%', height: '65vh', borderRadius: '10px', border: 'none' }} title="Proof Document" />
              )}
              {!proofLoading && proofType === 'error' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '40px' }}>
                  <div style={{ color: '#7A8987', fontSize: '14px', textAlign: 'center' }}>Document load failed</div>
                  <a href={proofUrl} target="_blank" rel="noreferrer" style={{ padding: '10px 20px', background: 'rgba(187,137,88,0.15)', border: '1px solid rgba(187,137,88,0.4)', borderRadius: '10px', color: '#BB8958', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
                    Open in New Tab
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}




