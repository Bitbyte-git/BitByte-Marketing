import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import logo from "../assets/logo.png";

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  // LUXIVA Color Palette
  const bg      = 'linear-gradient(135deg,#FDFDFC 0%,#F3F3F0 46%,#E7EDEC 100%)'
  const text    = '#111817'
  const subtext = '#7A8987'
  const accent  = '#0C4044'
  const border  = 'rgba(189,207,206,0.78)'
  const glass   = 'rgba(253,253,252,0.94)'
  const inpBg   = '#FDFDFC'
  const inpBorder = '#BDCFCE'

 const handleLogin = async (e) => {
  e.preventDefault()
  setLoading(true)
  setError('')

  // Clear stale tokens
 // Clear stale tokens before fresh login
localStorage.removeItem('token')
localStorage.removeItem('refresh')
localStorage.removeItem('role')
localStorage.removeItem('email')

  const attemptLogin = () => api.post('/login/', { email, password })

  const doNavigate = (role) => {
    if (role === 'super_admin') navigate('/super-admin', { replace: true })
    else if (role === 'admin') navigate('/admin', { replace: true })
    else if (role === 'dealer') navigate('/dealer', { replace: true })
    else if (role === 'sub_dealer') navigate('/sub-dealer', { replace: true })
    else if (role === 'promotor') navigate('/promotor', { replace: true })
    else navigate('/customer', { replace: true })
  }

  const saveAndGo = (data) => {
    localStorage.setItem('token', data.access)
    localStorage.setItem('refresh', data.refresh)
    localStorage.setItem('role', data.role)
    localStorage.setItem('email', data.email)
    doNavigate(data.role)
  }

  // Attempt 1
  try {
    const res = await attemptLogin()
    saveAndGo(res.data)
    return
  } catch (err1) {
    // If wrong credentials (400/401/403) → no retry, show error immediately
    if (err1.response && err1.response.status < 500) {
      const msg = err1.response?.data?.error || err1.response?.data?.detail || 'Invalid email or password'
      setError(msg)
      setLoading(false)
      return
    }
    // Server sleeping (no response or 5xx) → show message and retry
    setError('⏳ Server starting up... Please wait')
  }

  // Wait for server to wake up (max 20 retries × 2s = 40s)
  for (let i = 0; i < 20; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000))
    try {
      const res = await attemptLogin()
      saveAndGo(res.data)
      return
    } catch (retryErr) {
      // Wrong credentials during retry
      if (retryErr.response && retryErr.response.status < 500) {
        const msg = retryErr.response?.data?.error || retryErr.response?.data?.detail || 'Invalid email or password'
        setError(msg)
        setLoading(false)
        return
      }
      // Still sleeping, continue retry
      setError(`⏳ Server starting up... (${i + 1}/20)`)
    }
  }

  // All retries failed
  setError('❌ Server not responding. Please try again in a minute.')
  setLoading(false)
}

  return (
    <div style={{ minHeight:'100vh', background: bg, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', position:'relative', overflow:'hidden', fontFamily:'"Manrope","Inter",system-ui,sans-serif' }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .btn-shimmer { position:relative; overflow:hidden; }
        .btn-shimmer::after { content:""; position:absolute; top:0;left:0;width:100%;height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent); transform:translateX(-100%); }
        .btn-shimmer:hover::after { animation:shimmer 1s infinite; }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
      `}</style>

      <div style={{ position:'relative', zIndex:10, width:'100%', maxWidth:'420px', background: glass, border:`1px solid ${border}`, borderRadius:'28px', padding:'44px 40px', backdropFilter:'blur(20px)', boxShadow:'0 40px 90px rgba(7,59,63,0.16), 0 0 0 1px rgba(204,168,129,0.08)', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:'5px', background:'linear-gradient(90deg,#0C4044,#CCA881,#BB8958)' }} />

        <div style={{ textAlign:'center', marginBottom:'32px' }}>
          <div
            style={{
              width: 88,
              height: 88,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              borderRadius: '20px',
              background: 'linear-gradient(145deg,rgba(204,168,129,0.12),rgba(204,168,129,0.04))',
              border: '1px solid rgba(204,168,129,0.28)',
              boxShadow: '0 10px 28px rgba(204,168,129,0.18)',
            }}
          >
            <img
              src={logo}
              alt="LUXIVA"
              style={{
                width: '68%',
                height: '68%',
                objectFit: 'contain',
              }}
            />
          </div>

          <h2 style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize:'2.4rem', fontWeight:900, color: '#073B3F', margin:'0 0 8px', letterSpacing:'0.02em' }}>LUXIVA</h2>
          <p style={{ color: '#BB8958', fontSize:'11px', margin:0, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.22em' }}>E-commerce Portal</p>
        </div>

       {error && (
          <div style={{ background:'rgba(201,32,53,0.08)', border:'1px solid rgba(201,32,53,0.25)', color:'#C92035', borderRadius:'12px', padding:'13px 16px', fontSize:'13px', textAlign:'center', marginBottom:'20px', fontWeight:600 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
          <div>
            <label style={{ display:'block', color: '#7A8987', fontSize:'11px', fontWeight:800, marginBottom:'7px', textTransform:'uppercase', letterSpacing:'0.1em' }}>Email / Phone / ID</label>
            <input type="text" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Email, phone number or ID"
              style={{ width:'100%', background: inpBg, border:`1px solid ${inpBorder}`, borderRadius:'12px', padding:'14px 16px', color: text, fontSize:'14px', outline:'none', transition:'border-color .2s, box-shadow .2s', boxSizing:'border-box' }}
              onFocus={e => { e.target.style.borderColor = '#CCA881'; e.target.style.boxShadow = '0 0 0 3px rgba(204,168,129,0.14)' }}
              onBlur={e => { e.target.style.borderColor = inpBorder; e.target.style.boxShadow = 'none' }} />
          </div>
          <div>
            <label style={{ display:'block', color: '#7A8987', fontSize:'11px', fontWeight:800, marginBottom:'7px', textTransform:'uppercase', letterSpacing:'0.1em' }}>Password</label>
            <div style={{ position:'relative' }}>
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Enter your password"
                style={{ width:'100%', background: inpBg, border:`1px solid ${inpBorder}`, borderRadius:'12px', padding:'14px 44px 14px 16px', color: text, fontSize:'14px', outline:'none', transition:'border-color .2s, box-shadow .2s', boxSizing:'border-box' }}
                onFocus={e => { e.target.style.borderColor = '#CCA881'; e.target.style.boxShadow = '0 0 0 3px rgba(204,168,129,0.14)' }}
                onBlur={e => { e.target.style.borderColor = inpBorder; e.target.style.boxShadow = 'none' }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color: subtext, padding:0, lineHeight:0, display:'flex', alignItems:'center' }}
                tabIndex={-1}>
                {showPassword ? (
                  // Eye OFF icon
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  // Eye ON icon
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
<button type="submit" disabled={loading} className="btn-shimmer"
  style={{ padding:'16px', background: loading ? 'rgba(204,168,129,0.3)' : 'linear-gradient(135deg,#CCA881,#BB8958)', border:'none', borderRadius:'14px', fontWeight:800, color: loading ? '#CCA881' : '#FDFDFC', fontSize:'14px', textTransform:'uppercase', letterSpacing:'0.12em', cursor: loading ? 'not-allowed' : 'pointer', marginTop:'8px', boxShadow: loading ? 'none' : '0 16px 34px rgba(204,168,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition:'transform .2s ease, box-shadow .2s ease' }}
  onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(204,168,129,0.48)' } }}
  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = loading ? 'none' : '0 16px 34px rgba(204,168,129,0.4)' }}>
  {loading ? (
    <>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CCA881" strokeWidth="3" style={{ animation: 'spin 0.8s linear infinite' }}>
        <circle cx="12" cy="12" r="9" strokeOpacity="0.25"/>
        <path d="M21 12a9 9 0 00-9-9" strokeLinecap="round"/>
      </svg>
      Logging in...
    </>
  ) : 'Login'}
</button>
        </form>
      </div>
    </div>
  )
}