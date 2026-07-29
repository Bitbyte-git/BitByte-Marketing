import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const COIN_METAL_LABELS_TEXT = { gold_22k: 'Gold 22K', gold_24k: 'Gold 24K', silver_999: 'Silver 999' }

export default function CoinRequests() {
  const navigate = useNavigate()
  const [coinRequests, setCoinRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [approvingReqId, setApprovingReqId] = useState(null)
  const [approvingAll, setApprovingAll] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState('success')
  const [rejectingReqId, setRejectingReqId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectSubmitting, setRejectSubmitting] = useState(false)

  const fetchCoinRequests = async () => {
    setLoading(true)
    try {
      const res = await api.get('/coin-requests/')
      setCoinRequests(res.data)
    } catch (err) {
      setError('Failed to load coin requests')
    }
    setLoading(false)
  }

  useEffect(() => { fetchCoinRequests() }, [])

  const approveCoinRequest = async (reqId) => {
    setApprovingReqId(reqId)
    setMsg('')
    try {
      await api.post(`/coin-requests/${reqId}/approve/`)
      setMsgType('success')
      setMsg('Request approved successfully.')
      fetchCoinRequests()
    } catch (err) {
      setMsgType('error')
      setMsg(err.response?.data?.error || 'Failed to approve request. Please try again.')
    }
    setApprovingReqId(null)
  }

  const approveAllCoinRequests = async () => {
    setApprovingAll(true)
    setMsg('')
    try {
      await api.post('/coin-requests/approve-all/')
      setMsgType('success')
      setMsg('All requests approved successfully.')
      fetchCoinRequests()
    } catch (err) {
      setMsgType('error')
      setMsg(err.response?.data?.error || 'Failed to approve requests. Please try again.')
    }
    setApprovingAll(false)
  }

  const rejectCoinRequest = async (reqId) => {
    if (!rejectReason.trim()) {
      setMsgType('error')
      setMsg('Please enter a reason for rejection.')
      return
    }
    setRejectSubmitting(true)
    setMsg('')
    try {
      await api.post(`/coin-requests/${reqId}/reject/`, { message: rejectReason.trim() })
      setMsgType('success')
      setMsg('Request rejected successfully.')
      setRejectingReqId(null)
      setRejectReason('')
      fetchCoinRequests()
    } catch (err) {
      setMsgType('error')
      setMsg('Failed to reject request. Please try again.')
    }
    setRejectSubmitting(false)
  }

  const pending = coinRequests.filter(r => r.status === 'pending')
  const pendingItems = pending.reduce((sum, req) => sum + req.items.reduce((s, i) => s + Number(i.qty || 0), 0), 0)

  return (
    <main className="cr-page">
      <style>{`
        .cr-page{min-height:100vh;background:linear-gradient(135deg,#FDFDFC 0%,#F3F3F0 50%,#E7EDEC 100%);color:#111817;font-family:"Manrope","Inter",system-ui,sans-serif;padding:42px 28px 76px}.cr-wrap{max-width:1240px;margin:0 auto}.cr-hero,.cr-card,.cr-stat,.cr-empty{background:rgba(253,253,252,.95);border:1px solid rgba(189,207,206,.9);border-radius:8px;box-shadow:0 22px 58px rgba(7,59,63,.08)}.cr-hero{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;padding:34px 38px;margin-bottom:18px;position:relative;overflow:hidden}.cr-hero:after{content:"";position:absolute;right:-80px;top:-80px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(187,137,88,.26),transparent 70%)}.cr-kicker{font-size:12px;font-weight:950;letter-spacing:.18em;text-transform:uppercase;color:#BB8958}.cr-title{font-family:Georgia,'Times New Roman',serif;font-size:clamp(38px,5vw,64px);line-height:.95;margin:9px 0 0;color:#073B3F;font-weight:500}.cr-sub{margin:12px 0 0;color:#7A8987;font-weight:750}.cr-actions{position:relative;z-index:1;display:flex;gap:10px;flex-wrap:wrap}.cr-btn{height:46px;border-radius:999px;border:1px solid rgba(12,64,68,.24);background:#FDFDFC;color:#073B3F;padding:0 20px;font-weight:950;cursor:pointer}.cr-btn.primary{border:0;background:linear-gradient(135deg,#0C4044,#073B3F);color:#FDFDFC;box-shadow:0 16px 34px rgba(7,59,63,.16)}.cr-btn.gold{background:#F3E8DE;border-color:#CCA881;color:#9F6130}.cr-btn.danger{background:rgba(201,32,53,.08);border-color:rgba(201,32,53,.28);color:#C92035}.cr-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-bottom:22px}.cr-stat{padding:20px}.cr-stat small{display:block;font-size:11px;font-weight:950;text-transform:uppercase;letter-spacing:.13em;color:#7A8987}.cr-stat strong{display:block;margin-top:8px;font-size:32px;color:#073B3F}.cr-msg{border-radius:8px;padding:14px 16px;margin-bottom:16px;font-weight:850}.cr-msg.success{background:rgba(12,64,68,.09);border:1px solid rgba(12,64,68,.25);color:#0C4044}.cr-msg.error{background:rgba(201,32,53,.08);border:1px solid rgba(201,32,53,.28);color:#C92035}.cr-list{display:grid;gap:15px}.cr-card{padding:20px}.cr-card-head{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:start;margin-bottom:16px}.cr-id{font-size:15px;font-weight:950;color:#073B3F}.cr-time{font-size:12px;color:#7A8987;font-weight:800;margin-top:5px}.cr-item-list{display:grid;gap:9px}.cr-item{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:13px 14px;border-radius:8px;background:#F3F3F0;border:1px solid rgba(189,207,206,.62);font-weight:850;color:#111817}.cr-item b{color:#BB8958}.cr-reject-box{margin-top:15px;padding:16px;border-radius:8px;background:rgba(201,32,53,.06);border:1px solid rgba(201,32,53,.22)}.cr-reject-box label{display:block;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#C92035;font-weight:950;margin-bottom:8px}.cr-reject-box textarea{width:100%;min-height:76px;resize:vertical;box-sizing:border-box;border-radius:8px;border:1px solid rgba(189,207,206,.95);background:#FDFDFC;color:#111817;padding:12px 14px;font:inherit;outline:none}.cr-reject-actions{display:flex;gap:10px;margin-top:10px}.cr-empty{padding:60px 28px;text-align:center;color:#7A8987;font-weight:850}.cr-loading{display:grid;place-items:center;min-height:220px;color:#7A8987;font-weight:900}.cr-error{padding:16px 18px;border-radius:8px;background:rgba(201,32,53,.08);border:1px solid rgba(201,32,53,.24);color:#C92035;font-weight:850}@media(max-width:820px){.cr-page{padding:28px 14px 56px}.cr-hero{display:block;padding:28px 22px}.cr-actions{margin-top:18px}.cr-stats{grid-template-columns:1fr}.cr-card-head{grid-template-columns:1fr}.cr-reject-actions{display:grid}}
      `}</style>
      <div className="cr-wrap">
        <section className="cr-hero">
          <div>
            <div className="cr-kicker">Approval Desk</div>
            <h1 className="cr-title">Coin Requests</h1>
            <p className="cr-sub">Review incoming coin requests and keep the approval flow clear for every internal role.</p>
          </div>
          <div className="cr-actions">
            {pending.length > 0 && <button className="cr-btn primary" disabled={approvingAll} onClick={approveAllCoinRequests}>{approvingAll ? 'Approving...' : 'Approve All'}</button>}
            <button className="cr-btn" onClick={() => navigate('/coin-transactions')}>Transactions</button>
            <button className="cr-btn gold" onClick={() => navigate('/buy-coin')}>Buy Coin</button>
          </div>
        </section>

        <section className="cr-stats">
          <div className="cr-stat"><small>Pending Requests</small><strong>{pending.length}</strong></div>
          <div className="cr-stat"><small>Pending Pieces</small><strong>{pendingItems}</strong></div>
          <div className="cr-stat"><small>Total Loaded</small><strong>{coinRequests.length}</strong></div>
        </section>

        {msg && <div className={`cr-msg ${msgType}`}>{msg}</div>}
        {loading && <div className="cr-loading">Loading coin requests...</div>}
        {error && <div className="cr-error">{error}</div>}
        {!loading && !error && pending.length === 0 && <div className="cr-empty">No pending coin requests.</div>}

        {!loading && !error && pending.length > 0 && (
          <section className="cr-list">
            {pending.map(req => (
              <article className="cr-card" key={req.id}>
                <div className="cr-card-head">
                  <div>
                    <div className="cr-id">{req.requested_by_id_str || req.requested_by_email}</div>
                    <div className="cr-time">{new Date(req.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })}</div>
                  </div>
                  <div className="cr-actions">
                    <button className="cr-btn primary" disabled={approvingReqId === req.id} onClick={() => approveCoinRequest(req.id)}>{approvingReqId === req.id ? 'Approving...' : 'Approve'}</button>
                    <button className="cr-btn danger" onClick={() => { setRejectingReqId(rejectingReqId === req.id ? null : req.id); setRejectReason('') }}>Reject</button>
                  </div>
                </div>

                <div className="cr-item-list">
                  {req.items.map(item => (
                    <div className="cr-item" key={item.id}>
                      <span>{COIN_METAL_LABELS_TEXT[item.metal_type]} - {item.weight_label}</span>
                      <b>x {item.qty}</b>
                    </div>
                  ))}
                </div>

                {rejectingReqId === req.id && (
                  <div className="cr-reject-box">
                    <label>Reason for rejection</label>
                    <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Explain why this request is being rejected..." />
                    <div className="cr-reject-actions">
                      <button className="cr-btn danger" disabled={rejectSubmitting} onClick={() => rejectCoinRequest(req.id)}>{rejectSubmitting ? 'Rejecting...' : 'Confirm Reject'}</button>
                      <button className="cr-btn" onClick={() => { setRejectingReqId(null); setRejectReason('') }}>Cancel</button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}
