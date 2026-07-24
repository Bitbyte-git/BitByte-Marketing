import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomerFooter from '../collection/CustomerFooter'

const API_BASE = 'https://bitbyte-backend-f66f.onrender.com'

const STATUS_META = {
  pending: { label: 'Pending', tone: '#BB8958', bg: 'rgba(187,137,88,0.12)', border: 'rgba(187,137,88,0.32)', step: 1 },
  confirmed: { label: 'Confirmed', tone: '#0C4044', bg: 'rgba(12,64,68,0.12)', border: 'rgba(12,64,68,0.30)', step: 2 },
  processing: { label: 'Processing', tone: '#9F6130', bg: 'rgba(159,97,48,0.12)', border: 'rgba(159,97,48,0.28)', step: 3 },
  shipped: { label: 'Shipped', tone: '#0C4044', bg: 'rgba(12,64,68,0.14)', border: 'rgba(12,64,68,0.32)', step: 4 },
  delivered: { label: 'Delivered', tone: '#16764F', bg: 'rgba(22,118,79,0.12)', border: 'rgba(22,118,79,0.30)', step: 5 },
  cancelled: { label: 'Cancelled', tone: '#C92035', bg: 'rgba(201,32,53,0.10)', border: 'rgba(201,32,53,0.30)', step: 0 },
}

const PAYMENT_LABELS = {
  upi: 'UPI',
  debit_card: 'Debit card',
  credit_card: 'Credit card',
  net_banking: 'Net banking',
  emi: 'EMI',
  cash_on_delivery: 'Cash on delivery',
  razorpay: 'Razorpay',
}

const STATUS_FILTERS = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

function Icon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }

  const paths = {
    bag: <><path d="M6 8h12l-1 13H7L6 8Z" /><path d="M9 8a3 3 0 0 1 6 0" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.8-3.8" /></>,
    box: <><path d="m3 7 9-4 9 4-9 4-9-4Z" /><path d="M3 7v10l9 4 9-4V7" /><path d="M12 11v10" /></>,
    card: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /></>,
    truck: <><path d="M3 7h11v10H3z" /><path d="M14 11h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.7" /><circle cx="17" cy="18" r="1.7" /></>,
    shield: <path d="M12 3 20 6v5c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V6l8-3Z" />,
    chevron: <path d="m6 9 6 6 6-6" />,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  }

  return <svg {...common}>{paths[name]}</svg>
}

function getImageUrl(url) {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${API_BASE}/${url.replace(/^\/+/, '')}`
}

function money(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 'Rs. 0'
  return `Rs. ${Math.round(n).toLocaleString('en-IN')}`
}

function formatDate(value) {
  if (!value) return 'Recently'
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
}

function titleCase(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase())
}

function OrderTimeline({ status }) {
  const meta = STATUS_META[status] || STATUS_META.pending
  const steps = ['Placed', 'Confirmed', 'Processing', 'Shipped', 'Delivered']

  if (status === 'cancelled') {
    return (
      <div className="os-cancelled">
        This order has been cancelled. Our support team can help if you need more details.
      </div>
    )
  }

  return (
    <div className="os-timeline">
      {steps.map((step, index) => {
        const done = index + 1 <= meta.step
        return (
          <div className={`os-step ${done ? 'done' : ''}`} key={step}>
            <span>{index + 1}</span>
            <small>{step}</small>
          </div>
        )
      })}
    </div>
  )
}

export default function OrderSummary() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [query, setQuery] = useState('')

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { default: api } = await import('../api')
        const res = await api.get('/orders/')
        const list = Array.isArray(res.data) ? res.data : []
        setOrders(list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)))
      } catch {
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const stats = useMemo(() => {
    const totalSpend = orders.reduce((sum, order) => sum + (Number(order.total_price) || 0), 0)
    return {
      total: orders.length,
      active: orders.filter(order => !['delivered', 'cancelled'].includes(order.status)).length,
      delivered: orders.filter(order => order.status === 'delivered').length,
      spend: totalSpend,
    }
  }, [orders])

  const filteredOrders = useMemo(() => {
    const term = query.trim().toLowerCase()
    return orders.filter(order => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter
      const haystack = [
        order.order_id,
        order.product_name,
        order.product_category,
        order.product_metal,
        order.product_grade,
        order.payment_method,
      ].join(' ').toLowerCase()
      return matchesStatus && (!term || haystack.includes(term))
    })
  }, [orders, query, statusFilter])

  const selectedOrder = orders.find(order => order.id === selectedOrderId)

  return (
    <div className="order-summary-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700;800&display=swap');

        .order-summary-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 8% 2%, rgba(189,207,206,0.46), transparent 26%),
            radial-gradient(circle at 92% 10%, rgba(243,232,222,0.95), transparent 28%),
            linear-gradient(180deg, #FDFDFC 0%, #F3F3F0 48%, #FDFDFC 100%);
          color: #111817;
          font-family: Inter, system-ui, sans-serif;
        }

        .os-shell {
          width: min(1380px, 100%);
          margin: 0 auto;
          padding: 52px clamp(18px, 4vw, 72px) 86px;
        }

        .os-hero {
          position: relative;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(280px, 0.56fr);
          gap: 28px;
          align-items: stretch;
          margin-bottom: 28px;
        }

        .os-hero-card,
        .os-trust-card,
        .os-panel,
        .os-order-card {
          border: 1px solid rgba(12,64,68,0.13);
          box-shadow: 0 24px 70px rgba(7,59,63,0.10);
        }

        .os-hero-card {
          position: relative;
          overflow: hidden;
          min-height: 280px;
          border-radius: 8px;
          padding: clamp(28px, 4vw, 54px);
          background:
            linear-gradient(115deg, rgba(253,253,252,0.96) 0%, rgba(231,237,236,0.90) 54%, rgba(243,232,222,0.88) 100%);
        }

        .os-hero-card:after {
          content: "";
          position: absolute;
          right: -80px;
          top: -100px;
          width: 310px;
          height: 310px;
          border-radius: 50%;
          border: 42px solid rgba(204,168,129,0.22);
        }

        .os-kicker {
          margin: 0 0 12px;
          color: #BB8958;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.28em;
          text-transform: uppercase;
        }

        .os-hero h1 {
          max-width: 720px;
          margin: 0;
          color: #073B3F;
          font-family: "Playfair Display", Georgia, serif;
          font-size: clamp(40px, 5.2vw, 76px);
          line-height: 0.96;
          letter-spacing: 0;
        }

        .os-hero-copy {
          max-width: 630px;
          margin: 20px 0 0;
          color: #5f6c69;
          font-size: 16px;
          line-height: 1.8;
        }

        .os-hero-actions {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          margin-top: 30px;
        }

        .os-primary-btn,
        .os-ghost-btn {
          height: 48px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border-radius: 999px;
          padding: 0 22px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
        }

        .os-primary-btn {
          border: 1px solid #073B3F;
          background: #073B3F;
          color: #FDFDFC;
          box-shadow: 0 16px 38px rgba(7,59,63,0.24);
        }

        .os-ghost-btn {
          border: 1px solid rgba(12,64,68,0.22);
          background: rgba(253,253,252,0.72);
          color: #073B3F;
        }

        .os-primary-btn:hover,
        .os-ghost-btn:hover {
          transform: translateY(-2px);
        }

        .os-trust-card {
          border-radius: 8px;
          padding: 24px;
          background: #073B3F;
          color: #FDFDFC;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          position: relative;
        }

        .os-trust-card:before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(135deg, rgba(204,168,129,0.20), transparent 42%),
            radial-gradient(circle at 92% 10%, rgba(209,223,222,0.24), transparent 36%);
          pointer-events: none;
        }

        .os-trust-card > * {
          position: relative;
        }

        .os-trust-icon {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: rgba(253,253,252,0.10);
          border: 1px solid rgba(253,253,252,0.22);
          color: #D1DFDE;
        }

        .os-trust-card h2 {
          margin: 30px 0 10px;
          font-family: "Playfair Display", Georgia, serif;
          font-size: 32px;
          line-height: 1.05;
        }

        .os-trust-card p {
          margin: 0;
          color: rgba(253,253,252,0.72);
          line-height: 1.7;
          font-size: 14px;
        }

        .os-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin: -48px clamp(18px, 3vw, 42px) 30px;
          position: relative;
          z-index: 2;
        }

        .os-stat {
          border-radius: 8px;
          border: 1px solid rgba(12,64,68,0.13);
          background: rgba(253,253,252,0.92);
          backdrop-filter: blur(16px);
          padding: 18px;
          box-shadow: 0 18px 48px rgba(7,59,63,0.08);
        }

        .os-stat span {
          display: block;
          color: #7A8987;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .os-stat strong {
          color: #073B3F;
          font-size: clamp(22px, 2.6vw, 34px);
          line-height: 1;
        }

        .os-panel {
          border-radius: 8px;
          background: rgba(253,253,252,0.90);
          overflow: hidden;
        }

        .os-toolbar {
          display: grid;
          grid-template-columns: minmax(260px, 1fr) auto;
          gap: 18px;
          padding: 20px;
          border-bottom: 1px solid rgba(12,64,68,0.10);
          background: linear-gradient(90deg, rgba(231,237,236,0.78), rgba(243,232,222,0.62));
        }

        .os-search {
          height: 48px;
          border-radius: 999px;
          border: 1px solid rgba(12,64,68,0.16);
          background: #FDFDFC;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 18px;
          color: #0C4044;
        }

        .os-search input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: #111817;
          font-size: 14px;
        }

        .os-filters {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .os-filter {
          height: 38px;
          border-radius: 999px;
          border: 1px solid rgba(12,64,68,0.16);
          background: rgba(253,253,252,0.76);
          color: #073B3F;
          padding: 0 14px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: capitalize;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .os-filter.active,
        .os-filter:hover {
          background: #073B3F;
          border-color: #073B3F;
          color: #FDFDFC;
          box-shadow: 0 12px 28px rgba(7,59,63,0.16);
        }

        .os-list {
          display: grid;
          gap: 16px;
          padding: 20px;
        }

        .os-order-card {
          overflow: hidden;
          border-radius: 8px;
          background: #FDFDFC;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          animation: osFadeUp 0.45s ease both;
        }

        .os-order-card:hover,
        .os-order-card.open {
          transform: translateY(-3px);
          border-color: rgba(187,137,88,0.42);
          box-shadow: 0 28px 72px rgba(7,59,63,0.14);
        }

        .os-order-main {
          display: grid;
          grid-template-columns: 118px minmax(0, 1fr) minmax(170px, auto) 30px;
          gap: 22px;
          align-items: center;
          padding: 20px;
        }

        .os-product-media {
          width: 118px;
          height: 118px;
          border-radius: 8px;
          overflow: hidden;
          background:
            radial-gradient(circle at 48% 46%, rgba(204,168,129,0.28), transparent 38%),
            linear-gradient(135deg, #E7EDEC, #F3E8DE);
          border: 1px solid rgba(12,64,68,0.12);
          display: grid;
          place-items: center;
          color: #0C4044;
        }

        .os-product-media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.25s ease;
        }

        .os-order-card:hover .os-product-media img {
          transform: scale(1.06);
        }

        .os-tag-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          margin-bottom: 10px;
        }

        .os-tag {
          border: 1px solid rgba(204,168,129,0.44);
          background: rgba(243,232,222,0.58);
          color: #9F6130;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .os-date {
          color: #7A8987;
          font-size: 12px;
          font-weight: 600;
        }

        .os-order-title {
          margin: 0 0 10px;
          color: #111817;
          font-family: "Playfair Display", Georgia, serif;
          font-size: clamp(22px, 2.1vw, 34px);
          line-height: 1.05;
        }

        .os-order-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          color: #5f6c69;
          font-size: 13px;
          font-weight: 600;
        }

        .os-order-meta span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          background: rgba(231,237,236,0.70);
          padding: 7px 10px;
        }

        .os-price-block {
          text-align: right;
        }

        .os-price-block strong {
          display: block;
          color: #073B3F;
          font-size: clamp(24px, 2.5vw, 38px);
          line-height: 1;
          margin-bottom: 12px;
        }

        .os-status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .os-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: currentColor;
          box-shadow: 0 0 0 5px rgba(12,64,68,0.08);
        }

        .os-chevron {
          color: #7A8987;
          transition: transform 0.2s ease;
        }

        .os-order-card.open .os-chevron {
          transform: rotate(180deg);
        }

        .os-order-strip {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          padding: 12px 20px;
          border-top: 1px solid rgba(12,64,68,0.08);
          background: rgba(231,237,236,0.42);
          color: #7A8987;
          font-size: 11px;
          font-weight: 700;
        }

        .os-order-strip strong {
          color: #0C4044;
          font-family: Consolas, monospace;
        }

        .os-expanded {
          border-top: 1px solid rgba(12,64,68,0.10);
          background:
            radial-gradient(circle at 95% 10%, rgba(204,168,129,0.16), transparent 26%),
            linear-gradient(135deg, rgba(243,243,240,0.72), rgba(253,253,252,0.96));
          padding: 22px;
          animation: osFadeUp 0.26s ease both;
        }

        .os-expanded-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          margin-top: 18px;
        }

        .os-detail-card {
          border-radius: 8px;
          border: 1px solid rgba(12,64,68,0.12);
          background: rgba(253,253,252,0.88);
          padding: 18px;
        }

        .os-detail-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
          color: #BB8958;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .os-address-name {
          color: #073B3F;
          font-weight: 900;
          margin-bottom: 8px;
        }

        .os-muted-lines {
          color: #5f6c69;
          font-size: 13px;
          line-height: 1.85;
        }

        .os-price-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 8px 0;
          color: #5f6c69;
          font-size: 13px;
        }

        .os-price-row b {
          color: #111817;
        }

        .os-total-row {
          border-top: 1px dashed rgba(12,64,68,0.18);
          margin-top: 8px;
          padding-top: 14px;
        }

        .os-total-row b:last-child {
          color: #073B3F;
          font-size: 20px;
        }

        .os-timeline {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
        }

        .os-step {
          position: relative;
          display: grid;
          gap: 8px;
          justify-items: center;
          color: #7A8987;
          font-size: 11px;
          font-weight: 800;
          text-align: center;
        }

        .os-step:before {
          content: "";
          position: absolute;
          top: 15px;
          left: -50%;
          width: 100%;
          height: 2px;
          background: rgba(122,137,135,0.20);
        }

        .os-step:first-child:before {
          display: none;
        }

        .os-step span {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #F3F3F0;
          border: 1px solid rgba(12,64,68,0.16);
          position: relative;
          z-index: 1;
        }

        .os-step.done {
          color: #073B3F;
        }

        .os-step.done:before,
        .os-step.done span {
          background: #D1DFDE;
          border-color: rgba(12,64,68,0.30);
        }

        .os-cancelled {
          border-radius: 8px;
          border: 1px solid rgba(201,32,53,0.24);
          background: rgba(201,32,53,0.06);
          color: #C92035;
          padding: 16px;
          font-size: 13px;
          font-weight: 700;
        }

        .os-empty,
        .os-loading {
          min-height: 330px;
          display: grid;
          place-items: center;
          text-align: center;
          padding: 42px;
        }

        .os-empty-inner,
        .os-loader-card {
          width: min(440px, 100%);
          border-radius: 8px;
          border: 1px solid rgba(12,64,68,0.12);
          background: rgba(253,253,252,0.92);
          padding: 34px;
          box-shadow: 0 24px 64px rgba(7,59,63,0.10);
        }

        .os-empty-icon,
        .os-loader-mark {
          width: 72px;
          height: 72px;
          margin: 0 auto 18px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #E7EDEC;
          color: #073B3F;
        }

        .os-loader-mark {
          border: 3px solid #D1DFDE;
          border-top-color: #073B3F;
          animation: osSpin 900ms linear infinite;
        }

        .os-empty h2,
        .os-loading h2 {
          margin: 0 0 10px;
          color: #073B3F;
          font-family: "Playfair Display", Georgia, serif;
          font-size: 30px;
        }

        .os-empty p,
        .os-loading p {
          margin: 0 0 24px;
          color: #7A8987;
          line-height: 1.7;
        }

        @keyframes osFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes osSpin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1080px) {
          .os-hero,
          .os-toolbar,
          .os-expanded-grid {
            grid-template-columns: 1fr;
          }

          .os-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            margin-top: 0;
          }

          .os-filters {
            justify-content: flex-start;
          }
        }

        @media (max-width: 760px) {
          .os-shell {
            padding-left: 14px;
            padding-right: 14px;
          }

          .os-hero-card {
            min-height: auto;
            padding: 28px 20px;
          }

          .os-stats {
            grid-template-columns: 1fr;
          }

          .os-order-main {
            grid-template-columns: 86px minmax(0, 1fr);
            gap: 14px;
          }

          .os-product-media {
            width: 86px;
            height: 86px;
          }

          .os-price-block {
            grid-column: 1 / -1;
            text-align: left;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
          }

          .os-chevron {
            position: absolute;
            right: 24px;
          }

          .os-order-strip,
          .os-timeline {
            grid-template-columns: 1fr;
          }

          .os-order-strip {
            flex-direction: column;
          }

          .os-step {
            grid-template-columns: 30px 1fr;
            justify-items: start;
            text-align: left;
          }

          .os-step:before {
            display: none;
          }
        }
      `}</style>

      <main className="os-shell">
        <section className="os-hero">
          <div className="os-hero-card">
            <p className="os-kicker">My Account</p>
            <h1>Order History</h1>
            <p className="os-hero-copy">
              Track every jewellery purchase with order status, delivery details, payment summary, and premium after-sales assurance in one refined view.
            </p>
            <div className="os-hero-actions">
              <button className="os-primary-btn" type="button" onClick={() => navigate('/collection/all')}>
                Continue Shopping <Icon name="arrow" size={16} />
              </button>
              <button className="os-ghost-btn" type="button" onClick={() => navigate('/customer')}>
                Back To Home
              </button>
            </div>
          </div>

          <aside className="os-trust-card">
            <div className="os-trust-icon"><Icon name="shield" size={28} /></div>
            <div>
              <h2>Protected From Cart To Doorstep</h2>
              <p>BIS hallmark assurance, insured shipping, secure payment records, and easy return visibility for every order.</p>
            </div>
          </aside>
        </section>

        <section className="os-stats" aria-label="Order summary stats">
          <div className="os-stat"><span>Total Orders</span><strong>{stats.total}</strong></div>
          <div className="os-stat"><span>Active Orders</span><strong>{stats.active}</strong></div>
          <div className="os-stat"><span>Delivered</span><strong>{stats.delivered}</strong></div>
          <div className="os-stat"><span>Total Spend</span><strong>{money(stats.spend)}</strong></div>
        </section>

        <section className="os-panel">
          <div className="os-toolbar">
            <label className="os-search">
              <Icon name="search" />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search by order id, product, metal or payment..."
              />
            </label>
            <div className="os-filters">
              {STATUS_FILTERS.map(status => (
                <button
                  key={status}
                  type="button"
                  className={`os-filter ${statusFilter === status ? 'active' : ''}`}
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'all' ? 'All' : STATUS_META[status].label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="os-loading">
              <div className="os-loader-card">
                <div className="os-loader-mark" />
                <h2>Preparing Your Orders</h2>
                <p>We are bringing your purchase history into a polished view.</p>
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="os-empty">
              <div className="os-empty-inner">
                <div className="os-empty-icon"><Icon name="bag" size={30} /></div>
                <h2>No Orders Found</h2>
                <p>{orders.length ? 'Try a different status or search term.' : 'Your first jewellery purchase will appear here after checkout.'}</p>
                <button className="os-primary-btn" type="button" onClick={() => navigate('/collection/all')}>
                  Explore Jewellery <Icon name="arrow" size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="os-list">
              {filteredOrders.map((order, index) => {
                const meta = STATUS_META[order.status] || STATUS_META.pending
                const isOpen = selectedOrderId === order.id
                const image = getImageUrl(order.product_image_url)
                const payment = PAYMENT_LABELS[order.payment_method] || titleCase(order.payment_method || 'Payment')

                return (
                  <article
                    key={order.id}
                    className={`os-order-card ${isOpen ? 'open' : ''}`}
                    style={{ animationDelay: `${index * 0.045}s` }}
                    onClick={() => setSelectedOrderId(isOpen ? null : order.id)}
                  >
                    <div className="os-order-main">
                      <div className="os-product-media">
                        {image ? <img src={image} alt={order.product_name || 'Jewellery order'} /> : <Icon name="bag" size={34} />}
                      </div>

                      <div>
                        <div className="os-tag-row">
                          <span className="os-tag">{order.product_metal || 'Jewellery'} {order.product_grade ? `- ${order.product_grade}` : ''}</span>
                          <span className="os-date">{formatDate(order.created_at)}</span>
                        </div>
                        <h2 className="os-order-title">{order.product_name || 'Jewellery Order'}</h2>
                        <div className="os-order-meta">
                          <span><Icon name="box" size={14} /> Qty: {order.quantity || 1}</span>
                          <span><Icon name="card" size={14} /> {payment}</span>
                          <span><Icon name="truck" size={14} /> Insured shipping</span>
                        </div>
                      </div>

                      <div className="os-price-block">
                        <strong>{money(order.total_price)}</strong>
                        <span
                          className="os-status"
                          style={{ background: meta.bg, border: `1px solid ${meta.border}`, color: meta.tone }}
                        >
                          <i className="os-status-dot" /> {meta.label}
                        </span>
                      </div>

                      <div className="os-chevron"><Icon name="chevron" /></div>
                    </div>

                    <div className="os-order-strip">
                      <span>Order ID: <strong>{order.order_id || order.id}</strong></span>
                      <span>Category: <strong>{titleCase(order.product_category || 'Jewellery')}</strong></span>
                    </div>

                    {isOpen && (
                      <div className="os-expanded" onClick={event => event.stopPropagation()}>
                        <OrderTimeline status={order.status} />

                        <div className="os-expanded-grid">
                          <div className="os-detail-card">
                            <div className="os-detail-title"><Icon name="truck" size={15} /> Delivery Address</div>
                            <div className="os-address-name">{order.customer_name || 'Customer'}</div>
                            <div className="os-muted-lines">
                              Phone: {order.customer_phone || '-'}{order.customer_alt_phone ? ` / ${order.customer_alt_phone}` : ''}<br />
                              {[order.address_line1, order.address_line2].filter(Boolean).join(', ') || 'Address not available'}<br />
                              {[order.city, order.state].filter(Boolean).join(', ')} {order.pincode ? `- ${order.pincode}` : ''}
                            </div>
                          </div>

                          <div className="os-detail-card">
                            <div className="os-detail-title"><Icon name="card" size={15} /> Price Details</div>
                            <div className="os-price-row"><span>Unit price</span><b>{money(order.unit_price)}</b></div>
                            <div className="os-price-row"><span>Quantity</span><b>x {order.quantity || 1}</b></div>
                            <div className="os-price-row"><span>GST</span><b>Included</b></div>
                            <div className="os-price-row"><span>Shipping</span><b style={{ color: '#16764F' }}>Free insured</b></div>
                            <div className="os-price-row os-total-row"><b>Total paid</b><b>{money(order.total_price)}</b></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </section>

        {selectedOrder && null}
      </main>

      <CustomerFooter />
    </div>
  )
}

