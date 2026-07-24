import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import CustomerFooter from '../collection/CustomerFooter'

export async function getCartFromDB() {
  try {
    const res = await api.get('/cart/')
    return Array.isArray(res.data) ? res.data : []
  } catch {
    return []
  }
}

export async function addToCartDB(productId, qty = 1) {
  try {
    const res = await api.post('/cart/', { product_id: productId, qty })
    window.dispatchEvent(new Event('bb_cart_update'))
    return res.data
  } catch (err) {
    console.error('Add to cart failed:', err)
    return null
  }
}

export async function removeFromCartDB(productId) {
  try {
    await api.delete('/cart/', { data: { product_id: productId } })
    window.dispatchEvent(new Event('bb_cart_update'))
  } catch (err) {
    console.error('Remove failed:', err)
  }
}

export async function updateQtyDB(cartItemId, qty) {
  try {
    const res = await api.patch(`/cart/${cartItemId}/qty/`, { qty })
    window.dispatchEvent(new Event('bb_cart_update'))
    return res.data
  } catch (err) {
    console.error('Qty update failed:', err)
    return null
  }
}

export async function getCartCountDB() {
  const items = await getCartFromDB()
  return items.reduce((acc, i) => acc + (i.qty || 1), 0)
}

export function getCart() { return [] }
export function saveCart() {}
export function addToCart() {}
export function getCartCount() { return 0 }

const money = value => {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount <= 0) return null
  return amount.toLocaleString('en-IN')
}

const itemTotal = item => (Number(item.product_price) || 0) * (item.qty || 1)

export default function CardSection() {
  const navigate = useNavigate()
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)

  const fetchCart = async () => {
    setLoading(true)
    const items = await getCartFromDB()
    setCart(items)
    setLoading(false)
  }

  useEffect(() => {
    fetchCart()
    const handler = () => fetchCart()
    window.addEventListener('bb_cart_update', handler)
    return () => window.removeEventListener('bb_cart_update', handler)
  }, [])

  const removeItem = async productId => {
    setUpdatingId(productId)
    await removeFromCartDB(productId)
    setCart(prev => prev.filter(i => i.product !== productId))
    setUpdatingId(null)
  }

  const updateQty = async (cartItemId, productId, delta, currentQty) => {
    const newQty = currentQty + delta
    setUpdatingId(productId)
    if (newQty < 1) {
      await removeFromCartDB(productId)
      setCart(prev => prev.filter(i => i.id !== cartItemId))
      setUpdatingId(null)
      return
    }
    await updateQtyDB(cartItemId, newQty)
    setCart(prev => prev.map(i => (i.id === cartItemId ? { ...i, qty: newQty } : i)))
    setUpdatingId(null)
  }

  const clearCart = async () => {
    setUpdatingId('clear')
    for (const item of cart) await removeFromCartDB(item.product)
    setCart([])
    setUpdatingId(null)
  }

  const totalItems = cart.reduce((acc, i) => acc + (i.qty || 1), 0)
  const subtotal = cart.reduce((acc, i) => acc + itemTotal(i), 0)
  const insuredShipping = subtotal > 0 ? 0 : 0
  const finalTotal = subtotal + insuredShipping
  const categories = useMemo(() => new Set(cart.map(i => i.product_category).filter(Boolean)).size, [cart])

  const handleCheckout = () => {
    if (!cart.length) return
    const first = cart[0]
    const cartItems = cart.map(item => ({
      id: item.id,
      product_id: item.product,
      name: item.product_name || 'Jewellery Piece',
      image: item.product_image || '',
      price: Number(item.product_price) || 0,
      qty: item.qty || 1,
      metal: item.product_metal || '',
      category: item.product_category || '',
      total: itemTotal(item),
    }))

    navigate('/order-confirm', {
      state: {
        source: 'cart',
        cartItems,
        cartTotal: finalTotal,
        product: {
          id: first.product,
          name: cartItems.length > 1 ? `${cartItems.length} Selected Jewellery Pieces` : cartItems[0].name,
          metal: first.product_metal,
          category: first.product_category,
          grade: '',
          net_weight: '',
          images: first.product_image ? [first.product_image] : [],
        },
        qty: totalItems,
        displayPrice: cartItems.length > 1 ? finalTotal : Number(first.product_price) || finalTotal,
        metal: first.product_metal,
      },
    })
  }

  return (
    <div className="cart-page">
      <style>{cartStyles}</style>

      <main className="cart-shell">
        <section className="cart-hero">
          <div>
            <span className="cart-kicker">Bharathi Jewellers</span>
            <h1>My Cart</h1>
            <p>{totalItems} {totalItems === 1 ? 'piece' : 'pieces'} selected for checkout</p>
          </div>
          <div className="cart-hero-stats">
            <div><span>Items</span><strong>{totalItems}</strong></div>
            <div><span>Collections</span><strong>{categories || 0}</strong></div>
            <div><span>Shipping</span><strong>Insured</strong></div>
          </div>
        </section>

        {loading ? (
          <section className="cart-empty">
            <div className="cart-loader" />
            <h2>Preparing Your Cart</h2>
            <p>Loading the jewellery pieces you selected.</p>
          </section>
        ) : cart.length === 0 ? (
          <section className="cart-empty">
            <div className="cart-empty-mark">◇</div>
            <h2>Your Cart Is Empty</h2>
            <p>Explore the collection and add your favourite jewellery pieces to begin checkout.</p>
            <button className="cart-primary" type="button" onClick={() => navigate('/collection/all')}>
              Explore Collections
            </button>
          </section>
        ) : (
          <section className="cart-layout">
            <div className="cart-list">
              <div className="cart-list-head">
                <div>
                  <span className="cart-kicker">Selected Pieces</span>
                  <h2>Ready For Review</h2>
                </div>
                <button className="cart-clear" type="button" onClick={clearCart} disabled={updatingId === 'clear'}>
                  Clear All
                </button>
              </div>

              {cart.map((item, idx) => {
                const qty = item.qty || 1
                const total = itemTotal(item)
                const productUrl = `/product-display?category=${item.product_category || ''}&metal=${item.product_metal || ''}&id=${item.product}`

                return (
                  <article className="cart-card" key={`${item.id}-${idx}`} style={{ animationDelay: `${idx * 70}ms` }}>
                    <button className="cart-image" type="button" onClick={() => navigate(productUrl)}>
                      {item.product_image ? (
                        <img src={item.product_image} alt={item.product_name || 'Cart jewellery'} onError={e => { e.currentTarget.style.display = 'none' }} />
                      ) : (
                        <span>BJ</span>
                      )}
                    </button>

                    <div className="cart-info">
                      <div className="cart-product-top">
                        <div>
                          <span className="cart-metal">{item.product_metal || 'Jewellery'} · {item.product_category || 'Collection'}</span>
                          <h3>{item.product_name || 'Jewellery Piece'}</h3>
                        </div>
                        <button className="cart-remove" type="button" onClick={() => removeItem(item.product)} disabled={updatingId === item.product}>
                          Remove
                        </button>
                      </div>

                      <div className="cart-card-bottom">
                        <div className="cart-qty">
                          <button type="button" onClick={() => updateQty(item.id, item.product, -1, qty)} disabled={updatingId === item.product}>−</button>
                          <span>{qty}</span>
                          <button type="button" onClick={() => updateQty(item.id, item.product, 1, qty)} disabled={updatingId === item.product}>+</button>
                        </div>
                        <div className="cart-price">
                          <strong>{total > 0 ? `₹${money(total)}` : 'On Request'}</strong>
                          {qty > 1 && Number(item.product_price) > 0 && <span>₹{money(item.product_price)} each</span>}
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}

              <button className="cart-secondary" type="button" onClick={() => navigate('/collection/all')}>
                Continue Shopping
              </button>
            </div>

            <aside className="cart-summary">
              <span className="cart-kicker">Order Summary</span>
              <h2>Secure Checkout</h2>

              <div className="summary-lines">
                {cart.map(item => (
                  <div className="summary-line" key={item.id}>
                    <span>{item.product_name}{(item.qty || 1) > 1 ? ` × ${item.qty || 1}` : ''}</span>
                    <strong>{itemTotal(item) > 0 ? `₹${money(itemTotal(item))}` : '—'}</strong>
                  </div>
                ))}
              </div>

              <div className="summary-totals">
                <div><span>Subtotal</span><strong>{subtotal > 0 ? `₹${money(subtotal)}` : '—'}</strong></div>
                <div><span>Insured shipping</span><strong>Free</strong></div>
                <div className="grand"><span>Total</span><strong>{finalTotal > 0 ? `₹${money(finalTotal)}` : '—'}</strong></div>
              </div>

              <button className="cart-checkout" type="button" onClick={handleCheckout}>
                Place Order
              </button>

              <div className="cart-trust">
                <span>BIS Hallmarked</span>
                <span>Free Insured Shipping</span>
                <span>15-Day Easy Returns</span>
                <span>Secure Payments</span>
              </div>
            </aside>
          </section>
        )}
      </main>

      <CustomerFooter />
    </div>
  )
}

const cartStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Playfair+Display:wght@700&family=Montserrat:wght@400;500;600;700;800;900&display=swap');

  .cart-page {
    min-height: 100vh;
    background:
      radial-gradient(circle at 10% 8%, rgba(209,223,222,0.72), transparent 27%),
      linear-gradient(135deg, #FDFDFC 0%, #F3E8DE 48%, #E7EDEC 100%);
    color: #111817;
    font-family: "Montserrat", system-ui, sans-serif;
  }

  .cart-shell {
    width: min(1480px, calc(100% - 48px));
    margin: 0 auto;
    padding: clamp(32px, 4vw, 58px) 0 76px;
  }

  .cart-hero {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 28px;
    border: 1px solid rgba(189,207,206,0.88);
    border-radius: 34px;
    background: rgba(253,253,252,0.86);
    box-shadow: 0 26px 80px rgba(12,64,68,0.1);
    padding: clamp(26px, 4vw, 44px);
    backdrop-filter: blur(18px);
    margin-bottom: 24px;
  }

  .cart-kicker {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: #9F6130;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 2.8px;
    text-transform: uppercase;
  }

  .cart-kicker::before {
    content: "";
    width: 9px;
    height: 9px;
    border: 2px solid #BB8958;
    background: #F3E8DE;
    transform: rotate(45deg);
  }

  .cart-hero h1 {
    margin: 12px 0 10px;
    color: #073B3F;
    font: 700 clamp(44px, 5vw, 76px) "Playfair Display", Georgia, serif;
    line-height: 0.95;
    letter-spacing: 0;
  }

  .cart-hero p {
    margin: 0;
    color: #52625f;
    font-size: 15px;
    font-weight: 700;
  }

  .cart-hero-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(110px, 1fr));
    gap: 12px;
  }

  .cart-hero-stats div,
  .cart-empty,
  .cart-card,
  .cart-summary {
    border: 1px solid rgba(189,207,206,0.88);
    background: rgba(253,253,252,0.9);
    box-shadow: 0 20px 54px rgba(12,64,68,0.09);
    backdrop-filter: blur(18px);
  }

  .cart-hero-stats div {
    border-radius: 22px;
    padding: 18px;
  }

  .cart-hero-stats span,
  .cart-metal,
  .summary-totals span,
  .cart-trust span {
    display: block;
    color: #7A8987;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .cart-hero-stats strong {
    display: block;
    margin-top: 8px;
    color: #073B3F;
    font-size: 22px;
    line-height: 1;
  }

  .cart-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 390px;
    gap: 24px;
    align-items: start;
  }

  .cart-list-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 18px;
    margin: 18px 0;
  }

  .cart-list-head h2,
  .cart-summary h2,
  .cart-empty h2 {
    margin: 8px 0 0;
    color: #073B3F;
    font: 700 clamp(30px, 4vw, 46px) "Playfair Display", Georgia, serif;
    line-height: 1;
  }

  .cart-clear {
    border: 1px solid rgba(201,32,53,0.24);
    border-radius: 999px;
    background: rgba(201,32,53,0.08);
    color: #C92035;
    padding: 11px 15px;
    font-weight: 900;
    cursor: pointer;
  }

  .cart-card {
    display: grid;
    grid-template-columns: 164px minmax(0, 1fr);
    overflow: hidden;
    border-radius: 26px;
    margin-bottom: 14px;
    animation: cartFadeUp 0.45s ease both;
    transition: transform 0.24s ease, box-shadow 0.24s ease, border-color 0.24s ease;
  }

  .cart-card:hover {
    transform: translateY(-5px);
    border-color: rgba(187,137,88,0.58);
    box-shadow: 0 30px 70px rgba(12,64,68,0.15);
  }

  @keyframes cartFadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .cart-image {
    border: 0;
    padding: 0;
    min-height: 164px;
    background:
      radial-gradient(circle at center, rgba(255,255,255,0.9), rgba(243,232,222,0.45) 42%, rgba(231,237,236,0.82));
    overflow: hidden;
    cursor: pointer;
  }

  .cart-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.55s cubic-bezier(0.22,1,0.36,1);
  }

  .cart-card:hover .cart-image img {
    transform: scale(1.08);
  }

  .cart-image span {
    display: grid;
    place-items: center;
    height: 100%;
    color: #073B3F;
    font: 800 28px "Playfair Display", Georgia, serif;
  }

  .cart-info {
    padding: 22px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 18px;
  }

  .cart-product-top,
  .cart-card-bottom {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    align-items: flex-start;
  }

  .cart-product-top h3 {
    margin: 8px 0 0;
    color: #073B3F;
    font-size: 24px;
    line-height: 1.15;
  }

  .cart-remove {
    border: 0;
    background: transparent;
    color: #C92035;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    cursor: pointer;
  }

  .cart-qty {
    display: inline-flex;
    align-items: center;
    overflow: hidden;
    border: 1px solid #D1DFDE;
    border-radius: 999px;
    background: #FDFDFC;
    box-shadow: 0 12px 28px rgba(12,64,68,0.07);
  }

  .cart-qty button {
    width: 40px;
    height: 38px;
    border: 0;
    background: transparent;
    color: #073B3F;
    font-size: 18px;
    font-weight: 900;
    cursor: pointer;
  }

  .cart-qty button:hover {
    background: #E7EDEC;
  }

  .cart-qty span {
    min-width: 44px;
    text-align: center;
    color: #111817;
    font-weight: 900;
  }

  .cart-price {
    text-align: right;
  }

  .cart-price strong {
    display: block;
    color: #073B3F;
    font-size: 24px;
    font-weight: 900;
  }

  .cart-price span {
    display: block;
    margin-top: 4px;
    color: #9F6130;
    font-size: 12px;
    font-weight: 800;
  }

  .cart-secondary,
  .cart-primary {
    border: 1px solid #D1DFDE;
    border-radius: 999px;
    background: #FDFDFC;
    color: #073B3F;
    padding: 14px 22px;
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 1px;
    text-transform: uppercase;
    cursor: pointer;
    box-shadow: 0 14px 30px rgba(12,64,68,0.08);
  }

  .cart-primary,
  .cart-checkout {
    background: linear-gradient(135deg, #073B3F, #0C4044);
    color: #FDFDFC;
    border-color: #073B3F;
  }

  .cart-summary {
    position: sticky;
    top: 178px;
    border-radius: 30px;
    padding: 28px;
  }

  .summary-lines {
    display: grid;
    gap: 14px;
    margin: 24px 0;
    max-height: 310px;
    overflow: auto;
    padding-right: 4px;
  }

  .summary-line,
  .summary-totals div {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    color: #52625f;
    font-size: 13px;
    line-height: 1.5;
  }

  .summary-line strong,
  .summary-totals strong {
    color: #073B3F;
    white-space: nowrap;
  }

  .summary-totals {
    display: grid;
    gap: 12px;
    border-top: 1px solid #D1DFDE;
    padding-top: 18px;
  }

  .summary-totals .grand {
    align-items: baseline;
    padding-top: 14px;
    border-top: 1px solid #D1DFDE;
  }

  .summary-totals .grand strong {
    color: #073B3F;
    font-size: 30px;
    font-family: "Playfair Display", Georgia, serif;
  }

  .cart-checkout {
    width: 100%;
    border: 0;
    border-radius: 999px;
    padding: 17px 22px;
    margin-top: 24px;
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    cursor: pointer;
    box-shadow: 0 18px 36px rgba(12,64,68,0.18);
  }

  .cart-trust {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 9px;
    margin-top: 18px;
  }

  .cart-trust span {
    border: 1px solid #D1DFDE;
    border-radius: 14px;
    background: #F3F3F0;
    padding: 10px;
    color: #073B3F;
    text-align: center;
    line-height: 1.35;
  }

  .cart-empty {
    border-radius: 32px;
    padding: 88px 24px;
    text-align: center;
  }

  .cart-empty p {
    margin: 12px auto 26px;
    color: #52625f;
    max-width: 480px;
    line-height: 1.7;
  }

  .cart-empty-mark {
    color: #BB8958;
    font-size: 62px;
    line-height: 1;
  }

  .cart-loader {
    width: 56px;
    height: 56px;
    margin: 0 auto 20px;
    border-radius: 50%;
    border: 4px solid #D1DFDE;
    border-top-color: #073B3F;
    animation: cartSpin 0.9s linear infinite;
  }

  @keyframes cartSpin { to { transform: rotate(360deg); } }

  @media (max-width: 1100px) {
    .cart-layout { grid-template-columns: 1fr; }
    .cart-summary { position: relative; top: auto; }
  }

  @media (max-width: 760px) {
    .cart-shell { width: min(100% - 24px, 1480px); }
    .cart-hero { align-items: flex-start; flex-direction: column; }
    .cart-hero-stats { width: 100%; grid-template-columns: 1fr; }
    .cart-card { grid-template-columns: 1fr; }
    .cart-image { aspect-ratio: 1.25 / 1; }
    .cart-product-top,
    .cart-card-bottom { flex-direction: column; align-items: stretch; }
    .cart-price { text-align: left; }
    .cart-trust { grid-template-columns: 1fr; }
  }
`

