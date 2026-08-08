import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import logo from "../assets/logo.png";

const PARTICLES = Array.from({ length: 15 }, (_, i) => ({
  id: i, size: Math.random() * 60 + 10, x: Math.random() * 100,
  delay: Math.random() * 8, duration: Math.random() * 12 + 15, opacity: Math.random() * 0.2 + 0.05,
}))

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [dark, setDark] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const canvasRef = useRef(null)

  // Elite Color Palette
  const bg      = dark ? '#020617' : '#f8fafc'
  const text    = dark ? '#f8fafc' : '#020617'
  const subtext = dark ? '#6b7280' : '#64748b'
  const accent  = dark ? '#22d3ee' : '#2563eb'
  const border  = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  const glass   = dark ? 'rgba(15,23,42,0.7)' : 'rgba(255,255,255,0.8)'
  const inpBg   = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
  const inpBorder = dark ? '#374151' : '#d1d5db'

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animationFrameId
    let particlesArray = []
    const mouse = { x: null, y: null, radius: 150 }
    const handleResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    const handleMouseMove = (e) => { mouse.x = e.x; mouse.y = e.y }
    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)
    handleResize()
 class Particle {
  constructor() {
    this.x = Math.random() * canvas.width
    this.y = Math.random() * canvas.height
    this.size = Math.random() * 4 + 2 
    this.speedX = (Math.random() - 0.5) * 0.3
    this.speedY = (Math.random() - 0.5) * 0.3
  }

  update() {
    this.x += this.speedX
    this.y += this.speedY
    if (this.x > canvas.width || this.x < 0) this.speedX *= -1
    if (this.y > canvas.height || this.y < 0) this.speedY *= -1

    if (mouse.x !== null && mouse.y !== null) {
      let dx = mouse.x - this.x
      let dy = mouse.y - this.y
      let distance = Math.sqrt(dx * dx + dy * dy)
      if (distance < mouse.radius) {
        const forceDirectionX = dx / distance
        const forceDirectionY = dy / distance
        const force = (mouse.radius - distance) / mouse.radius
        this.x += forceDirectionX * force * 2
        this.y += forceDirectionY * force * 2
      }
    }
  }                          // ← update() ends here

draw() {
  ctx.fillStyle = dark ? 'rgba(34, 211, 238, 0.9)' : 'rgba(37, 99, 235, 0.8)'
  ctx.save()
  ctx.translate(this.x, this.y)
  ctx.beginPath()
  
  const spikes = 5
  const outerRadius = this.size * 1
  const innerRadius = this.size * 0.4
  
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius
    const angle = (i * Math.PI) / spikes - Math.PI / 2
    if (i === 0) ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
    else ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
  }
  
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

}   
    function init() { particlesArray = []; for (let i=0;i<60;i++) particlesArray.push(new Particle()) }
    function connect() {
      for (let a=0;a<particlesArray.length;a++) for (let b=a;b<particlesArray.length;b++) {
        let dx=particlesArray[a].x-particlesArray[b].x, dy=particlesArray[a].y-particlesArray[b].y, d=Math.sqrt(dx*dx+dy*dy)
        if (d<150) { ctx.strokeStyle= dark ? `rgba(34,211,238,${1-d/150})` : `rgba(37,99,235,${0.5-d/300})`; ctx.lineWidth=0.5; ctx.beginPath(); ctx.moveTo(particlesArray[a].x,particlesArray[a].y); ctx.lineTo(particlesArray[b].x,particlesArray[b].y); ctx.stroke() }
      }
    }
    function animate() { ctx.clearRect(0,0,canvas.width,canvas.height); particlesArray.forEach(p=>{p.update();p.draw()}); connect(); animationFrameId=requestAnimationFrame(animate) }
    init(); animate()
    return () => { window.removeEventListener('resize',handleResize); window.removeEventListener('mousemove',handleMouseMove); cancelAnimationFrame(animationFrameId) }
  }, [dark])

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
    <div style={{ minHeight:'100vh', background: bg, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', position:'relative', overflow:'hidden', fontFamily:'"Inter",system-ui,sans-serif', transition:'background 0.8s ease' }}>
      <style>{`
        @keyframes float-orb { 0%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-50px) scale(1.1)} 66%{transform:translate(-20px,20px) scale(0.9)} 100%{transform:translate(0,0) scale(1)} }
        @keyframes antigravity { 0%{transform:translateY(110vh) rotate(0deg);opacity:0} 10%{opacity:var(--op)} 90%{opacity:var(--op)} 100%{transform:translateY(-20vh) rotate(360deg);opacity:0} }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .liquid-orb { position:absolute; border-radius:50%; filter:blur(80px); animation:float-orb 20s infinite ease-in-out; z-index:0; }
        .btn-shimmer { position:relative; overflow:hidden; }
        .btn-shimmer::after { content:""; position:absolute; top:0;left:0;width:100%;height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent); transform:translateX(-100%); }
        .btn-shimmer:hover::after { animation:shimmer 1s infinite; }
      `}</style>

      <canvas ref={canvasRef} style={{ position:'fixed', top:0, left:0, pointerEvents:'none', zIndex:1, opacity:0.5 }} />
      <div className="liquid-orb" style={{ top:'5%', left:'5%', width:'400px', height:'400px', background: dark ? 'rgba(34,211,238,0.08)' : 'rgba(37,99,235,0.08)' }} />
      <div className="liquid-orb" style={{ bottom:'5%', right:'5%', width:'500px', height:'500px', background: dark ? 'rgba(236,72,153,0.06)' : 'rgba(219,39,119,0.06)', animationDelay:'-5s' }} />

      {PARTICLES.map(p => (
        <div key={p.id} style={{ position:'absolute', left:`${p.x}%`, bottom:'-100px', width:p.size, height:p.size, borderRadius:'40% 60% 60% 40% / 40% 40% 60% 60%', border:`1px solid ${accent}44`, opacity:p.opacity, animation:`antigravity ${p.duration}s ${p.delay}s infinite linear`, '--op':p.opacity, pointerEvents:'none', zIndex:0 }} />
      ))}

      {/* ── DARK / LIGHT TOGGLE (top-right) ── */}
      <button onClick={() => setDark(!dark)} className="btn-shimmer"
        style={{ position:'fixed', top:'20px', right:'24px', zIndex:100, padding:'8px 16px', borderRadius:'16px', border:`1px solid ${border}`, background: glass, backdropFilter:'blur(16px)', color: text, cursor:'pointer', fontWeight:600, fontSize:'13px', transition:'all 0.3s ease' }}>
        {dark ? '☀️ Light' : '🌙 Dark'}
      </button>

      <div style={{ position:'relative', zIndex:10, width:'100%', maxWidth:'420px', background: glass, border:`1px solid ${dark ? 'rgba(103,232,249,0.15)' : 'rgba(0,0,0,0.1)'}`, borderRadius:'28px', padding:'40px 36px', backdropFilter:'blur(20px)', boxShadow:'0 32px 64px rgba(0,0,0,0.4)', transition:'background 0.8s ease' }}>
        <div style={{ textAlign:'center', marginBottom:'28px' }}>
<div
  style={{
    width: 100,
    height: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 14px',
  }}
>
  <img
    src={logo}
    alt="LUXIVA"
    style={{
      width: '100%',
      height: '100%',
      objectFit: 'contain',
    }}
  />
</div>

          <h2 style={{ fontSize:'1.6rem', fontWeight:900, color: dark ? '#a5f3fc' : accent, margin:'0 0 6px' }}>LUXIVA</h2>
          <p style={{ color: subtext, fontSize:'13px', margin:0 }}>E-commerce Portal</p>
        </div>

        {error && (
          <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171', borderRadius:'12px', padding:'12px', fontSize:'13px', textAlign:'center', marginBottom:'16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          <div>
            <label style={{ display:'block', color: subtext, fontSize:'12px', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.06em' }}>Email / Phone / ID</label>
            <input type="text" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Email, phone number or ID"
              style={{ width:'100%', background: inpBg, border:`1px solid ${inpBorder}`, borderRadius:'12px', padding:'13px 16px', color: text, fontSize:'14px', outline:'none', transition:'border .2s', boxSizing:'border-box' }}
              onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = inpBorder} />
          </div>
          <div>
            <label style={{ display:'block', color: subtext, fontSize:'12px', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.06em' }}>Password</label>
            <div style={{ position:'relative' }}>
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Enter your password"
                style={{ width:'100%', background: inpBg, border:`1px solid ${inpBorder}`, borderRadius:'12px', padding:'13px 44px 13px 16px', color: text, fontSize:'14px', outline:'none', transition:'border .2s', boxSizing:'border-box' }}
                onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = inpBorder} />
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
  style={{ padding:'14px', background:'linear-gradient(90deg,#22d3ee,#4ade80)', border:'none', borderRadius:'14px', fontWeight:800, color:'#006165', fontSize:'14px', textTransform:'uppercase', letterSpacing:'0.1em', cursor: loading ? 'not-allowed' : 'pointer', marginTop:'4px', opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
  {loading ? (
    <>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#006165" strokeWidth="3" style={{ animation: 'spin 0.8s linear infinite' }}>
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