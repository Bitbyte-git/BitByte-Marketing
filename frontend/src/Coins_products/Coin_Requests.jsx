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

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#f8fafc', fontFamily: '"Inter",system-ui,sans-serif', padding: '32px 24px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#fbbf24' }}>Coin Requests</h1>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
              {pending.length} pending requests
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {pending.length > 0 && (
              <button
                disabled={approvingAll}
                onClick={approveAllCoinRequests}
                style={{ padding: '10px 20px', background: approvingAll ? 'rgba(74,222,128,0.2)' : 'linear-gradient(90deg,#4ade80,#22d3ee)', border: 'none', borderRadius: '10px', color: '#003b40', fontWeight: 800, fontSize: '13px', cursor: approvingAll ? 'not-allowed' : 'pointer' }}
              >
                {approvingAll ? 'Approving...' : 'Approve All'}
              </button>
            )}

            <div onClick={() => navigate('/coin-transactions')}
  style={{ cursor: 'pointer', padding: '6px 14px', borderRadius: '10px', border: '1px solid rgba(56,189,248,0.4)', background: 'rgba(56,189,248,0.1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
  <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>Transactions</span>
</div>

            <button
              onClick={() => navigate(-1)}
              style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#f8fafc', fontSize: '13px', cursor: 'pointer' }}
            >
              Back
            </button>
          </div>
        </div>

        {msg && (
          <div style={{
            background: msgType === 'success' ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${msgType === 'success' ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: msgType === 'success' ? '#4ade80' : '#f87171',
            borderRadius: '12px', padding: '14px 20px', fontSize: '14px', marginBottom: '20px'
          }}>
            {msg}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>Loading...</div>
        )}

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '12px', padding: '14px 20px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {!loading && !error && pending.length === 0 && (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '60px 0', fontSize: '14px' }}>
            No pending coin requests
          </div>
        )}

        {!loading && !error && pending.map(req => (
          <div key={req.id} style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: '14px', padding: '18px 20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '14px', fontFamily: 'monospace' }}>{req.requested_by_id_str || req.requested_by_email}</div>
                <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '3px' }}>
                  {new Date(req.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  disabled={approvingReqId === req.id}
                  onClick={() => approveCoinRequest(req.id)}
                  style={{ padding: '10px 20px', background: approvingReqId === req.id ? 'rgba(74,222,128,0.2)' : 'linear-gradient(90deg,#4ade80,#22d3ee)', border: 'none', borderRadius: '10px', color: '#003b40', fontWeight: 800, fontSize: '13px', cursor: approvingReqId === req.id ? 'not-allowed' : 'pointer' }}
                >
                  {approvingReqId === req.id ? 'Approving...' : 'Approve'}
                </button>
                <button
                  onClick={() => { setRejectingReqId(rejectingReqId === req.id ? null : req.id); setRejectReason('') }}
                  style={{ padding: '10px 20px', background: rejectingReqId === req.id ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '10px', color: '#f87171', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}
                >
                  Reject
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: rejectingReqId === req.id ? '14px' : '0' }}>
              {req.items.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '13px' }}>
                  <span>{COIN_METAL_LABELS_TEXT[item.metal_type]} — {item.weight_label}</span>
                  <span style={{ color: '#fbbf24', fontWeight: 700 }}>× {item.qty}</span>
                </div>
              ))}
            </div>

            {rejectingReqId === req.id && (
              <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '14px' }}>
                <label style={{ display: 'block', color: '#f87171', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>Reason for rejection</label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={2}
                  placeholder="Explain why this request is being rejected..."
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', color: '#f8fafc', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: '10px' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    disabled={rejectSubmitting}
                    onClick={() => rejectCoinRequest(req.id)}
                    style={{ flex: 1, padding: '10px', background: rejectSubmitting ? 'rgba(239,68,68,0.2)' : 'linear-gradient(90deg,#ef4444,#f87171)', border: 'none', borderRadius: '8px', color: '#3b0000', fontWeight: 800, fontSize: '13px', cursor: rejectSubmitting ? 'not-allowed' : 'pointer' }}
                  >
                    {rejectSubmitting ? 'Rejecting...' : 'Confirm Reject'}
                  </button>
                  <button
                    onClick={() => { setRejectingReqId(null); setRejectReason('') }}
                    style={{ padding: '10px 18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#94a3b8', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

      </div>
    </div>
  )
}