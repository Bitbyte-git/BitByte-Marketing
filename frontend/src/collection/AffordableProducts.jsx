import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomerNavbar from './CustomerNavbar'
import CustomerFooter from './CustomerFooter'
import './AffordableProducts.css'

export default function AffordableProducts() {
  const [data,setData]=useState(null), [loading,setLoading]=useState(true)
  const navigate=useNavigate()
  useEffect(()=>{window.scrollTo(0,0)},[])
  useEffect(()=>{ const fetchData=async()=>{try{const {default:api}=await import('../api');setData((await api.get('/products/affordable/')).data)}catch{/* handled by empty state */}finally{setLoading(false)}};fetchData() },[])
  if(loading)return <><CustomerNavbar/><div className="coin-shop-loading"><i/><span>Preparing your private coin collection…</span></div><CustomerFooter/></>
  if(!data)return <><CustomerNavbar/><div className="coin-shop-error">We couldn’t load your coin collection. Please try again.</div><CustomerFooter/></>
  return <div className="coin-shop-page"><CustomerNavbar/><main className="coin-shop-shell">
    <section className="coin-shop-hero"><div className="coin-shop-hero-copy"><span className="coin-shop-kicker"><i/> LUXIVA REWARDS</span><h1>Turn your coins into<br/><em>something timeless.</em></h1><p>Your loyalty deserves something exceptional. Explore jewellery selected especially for your current reward balance.</p></div>
      <aside className="coin-balance-card"><span className="balance-orbit one"/><span className="balance-orbit two"/><div className="coin-medallion">₹</div><div className="coin-balance-copy"><small>AVAILABLE BALANCE</small><strong>{Number(data.wallet_coins).toLocaleString('en-IN')}</strong><span>Luxiva Coins</span></div><div className="coin-balance-value"><span>Redeemable value</span><b>₹{Number(data.max_affordable_price).toLocaleString('en-IN')}</b></div></aside>
    </section>
    <section className="coin-products-section"><header className="coin-products-heading"><div><span>CURATED FOR YOUR BALANCE</span><h2>Rewards within reach</h2></div><p>{data.products.length} exclusive {data.products.length===1?'piece':'pieces'} available</p></header>
      {data.products.length===0?<div className="coin-shop-empty">No products are available within your coin balance yet.</div>:<div className="coin-product-grid">{data.products.map(p=><article className="coin-product-card" key={p.id} onClick={()=>navigate(`/product-display?category=${p.category}&metal=${p.metal}&id=${p.id}`)}>
        <div className="coin-product-image">{p.image?<img src={p.image} alt={p.name}/>:<img className="fallback" src="/logo.png" alt={p.name}/>}<span className="coin-eligible"><i/> COIN ELIGIBLE</span><span className="coin-product-view">Discover piece <b>↗</b></span></div>
        <div className="coin-product-body"><span className="coin-product-category">{String(p.category||p.metal||'Luxiva').replaceAll('_',' ')}</span><h3>{p.name}</h3><div className="coin-product-meta"><div><small>YOUR COIN PRICE</small><strong>₹{Number(p.price).toLocaleString('en-IN')}</strong></div><button type="button" aria-label={`View ${p.name}`}>↗</button></div></div>
      </article>)}</div>}
    </section>
  </main><CustomerFooter/></div>
}
