import { useEffect, useRef, useState } from 'react'

const GOLD = '#BB8958'
const DARK = '#111817'
const MUTED = '#7A8987'
const RED = '#073B3F'
const COIN_RATE = 100

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@400;500;600;700;800;900&display=swap');
  .sc-page{min-height:100vh;background:#FDFDFC;font-family:"Montserrat",system-ui,sans-serif;color:${DARK}}
  .sc-main{width:min(680px,calc(100% - 40px));margin:0 auto;padding:36px 0 90px}
  .sc-kicker{margin:0 0 6px;color:${GOLD};font-size:12px;font-weight:900;letter-spacing:2.4px;text-transform:uppercase}
  .sc-title{margin:0 0 8px;color:${RED};font-family:"Playfair Display",serif;font-size:clamp(26px,4vw,34px)}
  .sc-note{color:${MUTED};font-size:12.5px;margin:0 0 26px;line-height:1.6}
  .sc-card{border:1px solid rgba(189,207,206,.8);border-radius:14px;background:#fff;padding:26px;box-shadow:0 18px 46px rgba(12,64,68,.08);margin-bottom:20px}
  .sc-label{font-size:11px;font-weight:900;letter-spacing:.6px;text-transform:uppercase;color:${MUTED};margin-bottom:8px;display:block}
  .sc-input{width:100%;padding:14px 16px;border:1px solid #D1DFDE;border-radius:8px;font-size:15px;font-weight:700;color:${DARK};box-sizing:border-box}
  .sc-input:focus{outline:none;border-color:${RED}}
  .sc-status{font-size:12px;font-weight:700;margin-top:8px}
  .sc-status.searching{color:${MUTED}}
  .sc-status.error{color:#e53e3e}
  .sc-user-card{margin-top:16px;padding:16px;border-radius:10px;background:rgba(22,163,74,.06);border:1px solid rgba(22,163,74,.25)}
  .sc-user-row{display:flex;justify-content:space-between;padding:5px 0;font-size:13px}
  .sc-user-row span:first-child{color:${MUTED};font-weight:700}
  .sc-user-row span:last-child{color:${DARK};font-weight:800}
  .sc-coin-preview{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-radius:8px;background:rgba(187,137,88,.1);border:1px dashed ${GOLD};margin:16px 0;font-size:14px;font-weight:800;color:#9F6130}
  .sc-send-btn{width:100%;min-height:52px;border:none;border-radius:999px;background:linear-gradient(135deg,${RED},#0C4044);color:#fff;font-weight:900;font-size:13px;letter-spacing:1px;text-transform:uppercase;cursor:pointer}
  .sc-send-btn:disabled{background:#BDCFCE;cursor:not-allowed}
  .sc-send-btn:not(:disabled):hover{transform:translateY(-2px);box-shadow:0 14px 30px rgba(7,59,63,.22)}
  .sc-banner{margin-bottom:18px;padding:13px 16px;border-radius:8px;font-size:13px;font-weight:700}
  .sc-banner.success{background:rgba(22,163,74,.1);color:#16a34a;border:1px solid rgba(22,163,74,.3)}
  .sc-banner.error{background:rgba(229,62,62,.1);color:#e53e3e;border:1px solid rgba(229,62,62,.3)}
`

export default function SuperAdminSendCoins() {
  const [userId, setUserId] = useState('')
  const [amount, setAmount] = useState('')
  const [foundUser, setFoundUser] = useState(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [sending, setSending] = useState(false)
  const [banner, setBanner] = useState(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    setFoundUser(null)
    setSearchError('')
    if (!userId.trim()) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const { default: api } = await import('../api')
        const res = await api.get(`/users/lookup/?id=${encodeURIComponent(userId.trim())}`)
        setFoundUser(res.data)
      } catch (err) {
        setSearchError(err.response?.data?.error || 'No user found with this ID')
      } finally {
        setSearching(false)
      }
    }, 800)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [userId])

  const coinsPreview = amount > 0 ? Math.floor(Number(amount) * COIN_RATE) : 0

  const handleSend = async () => {
    if (!foundUser || !amount || Number(amount) <= 0) return
    setSending(true)
    setBanner(null)
    try {
      const { default: api } = await import('../api')
      const res = await api.post('/admin/send-coins/', {
        user_pk: foundUser.user_pk,
        amount: Number(amount),
      })
      setBanner({ type: 'success', text: `${res.data.coins_sent.toLocaleString('en-IN')} coins sent to ${foundUser.name}!` })
      setAmount('')
      setUserId('')
      setFoundUser(null)
    } catch (err) {
      setBanner({ type: 'error', text: err.response?.data?.error || 'Unable to send coins. Please try again.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="sc-page">
      <style>{styles}</style>
      <main className="sc-main">
        <p className="sc-kicker">Super Admin</p>
        <h1 className="sc-title">Add AUG Coins</h1>
        <p className="sc-note">
          Manually credit AUG Coin to any customer, promotor, sub dealer, dealer, or admin.
          This does not trigger commission distribution — it's a direct grant.
        </p>

        {banner && <div className={`sc-banner ${banner.type}`}>{banner.text}</div>}

        <section className="sc-card">
          <label className="sc-label">User ID</label>
          <input
            className="sc-input"
            type="text"
            placeholder="e.g. BBCUS20260001"
            value={userId}
            onChange={e => setUserId(e.target.value)}
          />
          {searching && <div className="sc-status searching">Searching...</div>}
          {searchError && <div className="sc-status error">{searchError}</div>}

          {foundUser && (
            <div className="sc-user-card">
              <div className="sc-user-row"><span>Name</span><span>{foundUser.name}</span></div>
              <div className="sc-user-row"><span>Email</span><span>{foundUser.email}</span></div>
              <div className="sc-user-row"><span>Phone</span><span>{foundUser.phone}</span></div>
              <div className="sc-user-row"><span>Role</span><span>{foundUser.role}</span></div>
              <div className="sc-user-row"><span>Current Balance</span><span>{foundUser.balance_coins.toLocaleString('en-IN')} coins</span></div>
            </div>
          )}
        </section>

        {foundUser && (
          <section className="sc-card">
            <label className="sc-label">Amount to Send (₹)</label>
            <input
              className="sc-input"
              type="number"
              min="1"
              placeholder="Enter amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />

            <div className="sc-coin-preview">
              <span>Coins to send</span>
              <span>{coinsPreview.toLocaleString('en-IN')} coins</span>
            </div>

            <button className="sc-send-btn" disabled={sending || !amount || Number(amount) <= 0} onClick={handleSend}>
              {sending ? 'Sending...' : 'Send AUG Coins'}
            </button>
          </section>
        )}
      </main>
    </div>
  )
}