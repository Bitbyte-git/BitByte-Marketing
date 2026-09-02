import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomerFooter from '../collection/CustomerFooter'

export default function Contact() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [sent, setSent] = useState(false)

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = e => {
    e.preventDefault()
    // Test submit only — no backend call yet
    setSent(true)
  }

  return (
    <main style={{ minHeight: '100vh', background: '#FDFDFC' }}>
      <style>{`
        .contact-shell {
          width: calc(100% - 48px);
          max-width: 640px;
          margin: 0 auto;
          padding: 64px 0 90px;
        }
        .contact-kicker {
          color: #9F6130;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .contact-shell h1 {
          color: #073B3F;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(2rem, 4vw, 2.8rem);
          margin: 0 0 14px;
        }
        .contact-shell p.lead {
          color: #52625f;
          font-size: 15px;
          line-height: 1.7;
          margin: 0 0 34px;
        }
        .contact-form {
          display: grid;
          gap: 16px;
          background: #fff;
          border: 1px solid #D1DFDE;
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 18px 44px rgba(7,59,63,0.08);
        }
        .contact-form label {
          display: block;
          margin-bottom: 6px;
          color: #073B3F;
          font-size: 13px;
          font-weight: 700;
        }
        .contact-form input,
        .contact-form textarea {
          width: 100%;
          border: 1px solid #D1DFDE;
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 14px;
          font-family: inherit;
          color: #111817;
          box-sizing: border-box;
          outline: none;
        }
        .contact-form input:focus,
        .contact-form textarea:focus {
          border-color: #073B3F;
        }
        .contact-submit {
          margin-top: 6px;
          border: 0;
          border-radius: 999px;
          min-height: 50px;
          background: #073B3F;
          color: #fff;
          font-weight: 900;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          font-size: 13px;
          cursor: pointer;
        }
        .contact-success {
          margin-top: 18px;
          border-radius: 14px;
          background: rgba(12,64,68,0.08);
          border: 1px solid rgba(12,64,68,0.2);
          color: #073B3F;
          padding: 14px 18px;
          font-weight: 700;
          font-size: 14px;
        }
      `}</style>

      <div className="contact-shell">
        <div className="contact-kicker">Get In Touch</div>
        <h1>Talk to us before you buy</h1>
        <p className="lead">
          To purchase, add to cart or wishlist any product, please create an
          account first. Meanwhile, leave your details here and our team
          will reach out to you.
        </p>

        <form className="contact-form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name">Full Name</label>
            <input id="name" name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" name="email" value={form.email} onChange={handleChange} required />
          </div>
          <div>
            <label htmlFor="phone">Phone</label>
            <input id="phone" name="phone" value={form.phone} onChange={handleChange} required />
          </div>
          <div>
            <label htmlFor="message">Message</label>
            <textarea id="message" name="message" rows={4} value={form.message} onChange={handleChange} />
          </div>
          <button className="contact-submit" type="submit">Send Message</button>
        </form>

        {sent && (
          <div className="contact-success">
            Thanks! We received your details. You can also{' '}
            <a href="/login" style={{ color: '#073B3F', fontWeight: 900 }}>login</a>{' '}
            or{' '}
            <a href="/register" style={{ color: '#073B3F', fontWeight: 900 }}>create an account</a>{' '}
            to continue shopping.
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{ marginTop: 24, border: 0, background: 'transparent', color: '#073B3F', fontWeight: 700, cursor: 'pointer' }}
        >
          ← Back
        </button>
      </div>

      <CustomerFooter />
    </main>
  )
}