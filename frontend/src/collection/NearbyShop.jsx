import { useState, useEffect } from 'react'
import CustomerFooter from './CustomerFooter'

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const SEARCH_TYPES = [
  { label: 'All Jewellery', value: 'jewelry' },
  { label: 'Gold', value: 'gold jewelry' },
  { label: 'Diamond', value: 'diamond jewelry' },
  { label: 'Silver', value: 'silver jewelry' },
  { label: 'Bridal', value: 'bridal jewelry' },
]

function ShopCard({ shop, index, onDirections, onCall }) {
  const initials = shop.name.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase()
  return (
    <article className="shop-card">
      <div className="shop-image">
        <div className="shop-image-mark">✦</div>

        <span className="shop-rank">{String(index + 1).padStart(2, '0')}</span>
        <div className="shop-monogram"><span>{initials || 'L'}</span></div>
        <div className="shop-image-caption">Curated local jeweller</div>

        {shop.distance !== null && shop.distance !== undefined && (
          <div className="shop-ribbon">
            {shop.distance < 1 ? `${Math.round(shop.distance * 1000)} m` : `${shop.distance.toFixed(1)} km`}
          </div>
        )}

        {shop.opening_hours && (
          <div className={`shop-status ${shop.opening_hours === 'open' ? 'is-open' : ''}`}>
            {shop.opening_hours === 'open' ? 'Open Now' : 'Hours N/A'}
          </div>
        )}
      </div>

      <div className="shop-content">
        <div className="shop-eyebrow"><span /> Nearby boutique</div>
        <h2 className="shop-name">{shop.name}</h2>

        {shop.address && <p className="shop-address"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s7-6.2 7-13a7 7 0 10-14 0c0 6.8 7 13 7 13z"/><circle cx="12" cy="8" r="2.4"/></svg><span>{shop.address}</span></p>}

        <div className="shop-tags">
          <span className="shop-tag">Jewellery Store</span>
          {shop.brand && <span className="shop-tag shop-tag-gold">{shop.brand}</span>}
        </div>

        <div className="shop-actions">
          <button type="button" className="shop-btn shop-btn-primary" onClick={() => onDirections(shop)}>
            Get Directions
          </button>
          <button type="button" className="shop-btn shop-btn-outline" onClick={() => onCall(shop)}>
            {shop.phone ? 'Call Now' : 'View on Maps'}
          </button>
        </div>
      </div>
    </article>
  )
}

export default function NearbyShop() {
  const [userLocation, setUserLocation] = useState(null)
  const [locationLoading, setLocationLoading] = useState(true)
  const [locationGranted, setLocationGranted] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [shops, setShops] = useState([])
  const [shopsLoading, setShopsLoading] = useState(false)
  const [shopsError, setShopsError] = useState('')
  const [searchType, setSearchType] = useState('jewelry')

  const fetchShopsOSM = async (lat, lng) => {
    setShopsLoading(true)
    setShopsError('')

    const radius = 15000 // 15km

    const query = `
      [out:json][timeout:30];
      (
        node["shop"="jewelry"](around:${radius},${lat},${lng});
        node["shop"="jewellery"](around:${radius},${lat},${lng});
        node["craft"="jeweller"](around:${radius},${lat},${lng});
        way["shop"="jewelry"](around:${radius},${lat},${lng});
        way["shop"="jewellery"](around:${radius},${lat},${lng});
      );
      out body;
      >;
      out skel qt;
    `

    try {
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
      })

      if (!res.ok) throw new Error('Overpass API error')

      const data = await res.json()
      const elements = data.elements || []

      const shopNodes = elements
        .filter(el => (el.lat && el.lng) || (el.type === 'node' && el.lat && el.lon))
        .map(el => {
          const tags = el.tags || {}
          const shopLat = el.lat
          const shopLng = el.lon

          return {
            id: el.id,
            name: tags.name || tags['name:en'] || 'Jewellery Store',
            address: [
              tags['addr:housenumber'],
              tags['addr:street'],
              tags['addr:city'] || tags['addr:town'],
              tags['addr:state'],
            ].filter(Boolean).join(', ') || tags['addr:full'] || '',
            phone: tags.phone || tags['contact:phone'] || null,
            website: tags.website || tags['contact:website'] || null,
            brand: tags.brand || null,
            opening_hours: tags.opening_hours ? 'open' : null,
            lat: shopLat,
            lng: shopLng,
            distance: getDistance(lat, lng, shopLat, shopLng),
          }
        })
        .filter(s => s.name !== 'Jewellery Store' || s.address)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 20)

      if (shopNodes.length === 0) {
        setShopsError('No jewellery stores found within 15km in OpenStreetMap data.')
      } else {
        setShops(shopNodes)
      }
    } catch (err) {
      setShopsError('Could not load nearby stores. Please check your connection and try again.')
    }

    setShopsLoading(false)
  }

  const requestLocation = () => {
    setLocationLoading(true)
    setLocationError('')
    setShops([])

    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported by your browser.')
      setLocationLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setUserLocation({ lat: latitude, lng: longitude })
        setLocationGranted(true)
        setLocationLoading(false)
        fetchShopsOSM(latitude, longitude)
      },
      () => {
        setLocationError('Location access denied. Please allow location and retry.')
        setLocationLoading(false)
        setLocationGranted(false)
      },
      { timeout: 12000, enableHighAccuracy: false }
    )
  }

  useEffect(() => { requestLocation() }, [])

  useEffect(() => {
    if (userLocation && locationGranted) {
      fetchShopsOSM(userLocation.lat, userLocation.lng)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchType])

  const openDirections = (shop) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}`, '_blank')
  }

  const callShop = (shop) => {
    if (shop.phone) {
      window.open(`tel:${shop.phone}`)
    } else {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.name + ' ' + (shop.address || ''))}`,
        '_blank'
      )
    }
  }

  return (
    <div className="nearby-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Playfair+Display:wght@700&family=Montserrat:wght@400;500;600;700;800&display=swap');

        .nearby-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 8% 8%, rgba(209,223,222,0.72), transparent 28%),
            linear-gradient(135deg, #FDFDFC 0%, #F3E8DE 46%, #E7EDEC 100%);
          color: #111817;
          font-family: "Montserrat", system-ui, sans-serif;
        }

        .nearby-shell {
          width: 100%;
          padding: clamp(30px, 4vw, 58px) clamp(16px, 4vw, 54px) 72px;
        }

        .nearby-hero {
          width: 100%;
          border: 1px solid rgba(189,207,206,0.9);
          border-radius: 30px;
          background: rgba(253,253,252,0.82);
          box-shadow: 0 26px 80px rgba(12,64,68,0.1);
          padding: clamp(24px, 4vw, 44px);
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 28px;
          backdrop-filter: blur(18px);
          flex-wrap: wrap;
        }

        .nearby-kicker {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
          color: #9F6130;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 2.8px;
          text-transform: uppercase;
        }

        .nearby-kicker::before {
          content: "";
          width: 9px;
          height: 9px;
          border: 2px solid #BB8958;
          transform: rotate(45deg);
          background: #F3E8DE;
        }

        .nearby-hero h1 {
          margin: 0;
          color: #073B3F;
          font-family: "Playfair Display", Georgia, serif;
          font-size: clamp(36px, 4.6vw, 64px);
          line-height: 0.98;
        }

        .nearby-hero p {
          margin: 16px 0 0;
          color: #52625f;
          max-width: 620px;
          font-size: 15px;
          line-height: 1.8;
        }

        .nearby-stat {
          min-width: 220px;
          border: 1px solid rgba(204,168,129,0.48);
          border-radius: 24px;
          background: linear-gradient(135deg, #F3E8DE, #E7EDEC);
          padding: 22px 24px;
          text-align: right;
        }

        .nearby-stat strong {
          display: block;
          color: #073B3F;
          font-size: 36px;
          line-height: 1;
          font-family: "Playfair Display", Georgia, serif;
        }

        .nearby-stat span {
          display: block;
          margin-top: 7px;
          color: #7A8987;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.4px;
          text-transform: uppercase;
        }

        .nearby-filters {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 26px;
        }

        .nearby-filter-btn {
          border: 1px solid rgba(189,207,206,0.9);
          background: rgba(253,253,252,0.86);
          color: #52625f;
          padding: 10px 20px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .nearby-filter-btn.is-active {
          border-color: transparent;
          background: linear-gradient(135deg, #073B3F, #0C4044);
          color: #FDFDFC;
        }

        .nearby-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: clamp(22px, 2.2vw, 34px);
          width: 100%;
        }

        .shop-card {
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(189,207,206,0.86);
          border-radius: 24px;
          background: rgba(253,253,252,0.94);
          box-shadow: 0 18px 44px rgba(12,64,68,0.08);
          transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
        }

        .shop-card:hover {
          transform: translateY(-8px);
          border-color: rgba(187,137,88,0.55);
          box-shadow: 0 30px 70px rgba(12,64,68,0.16);
        }

        .shop-image {
          position: relative;
          height: 150px;
          overflow: hidden;
          background:
            radial-gradient(circle at 50% 35%, rgba(255,255,255,0.9), rgba(243,232,222,0.48) 44%, rgba(231,237,236,0.82));
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .shop-image-mark {
          font-size: 40px;
          color: #BB8958;
          font-family: "Playfair Display", Georgia, serif;
        }

        .shop-ribbon {
          position: absolute;
          top: 14px;
          right: 14px;
          background: #073B3F;
          color: #FDFDFC;
          padding: 5px 14px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.6px;
        }

        .shop-status {
          position: absolute;
          top: 14px;
          left: 14px;
          background: rgba(253,253,252,0.9);
          color: #7A8987;
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          border: 1px solid rgba(189,207,206,0.9);
        }

        .shop-status.is-open {
          color: #0C4044;
          border-color: rgba(12,64,68,0.3);
          background: rgba(231,237,236,0.9);
        }

        .shop-content {
          padding: 18px 18px 20px;
        }

        .shop-name {
          margin: 0;
          color: #073B3F;
          font-family: "Cormorant Garamond", Georgia, serif;
          font-size: 24px;
          font-weight: 700;
          line-height: 1.1;
          min-height: 52px;
        }

        .shop-address {
          margin: 8px 0 0;
          color: #7A8987;
          font-size: 12.5px;
          line-height: 1.6;
        }

        .shop-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin: 14px 0 16px;
        }

        .shop-tag {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.4px;
          padding: 4px 11px;
          border-radius: 999px;
          background: rgba(12,64,68,0.06);
          color: #0C4044;
          border: 1px solid rgba(12,64,68,0.14);
        }

        .shop-tag-gold {
          background: rgba(187,137,88,0.1);
          color: #9F6130;
          border-color: rgba(187,137,88,0.28);
        }

        .shop-actions {
          display: flex;
          gap: 10px;
          padding-top: 15px;
          border-top: 1px solid rgba(189,207,206,0.7);
        }

        .shop-btn {
          flex: 1;
          border: 0;
          border-radius: 999px;
          padding: 11px 0;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.4px;
          cursor: pointer;
          transition: opacity 0.2s ease, background 0.2s ease, color 0.2s ease;
        }

        .shop-btn-primary {
          background: linear-gradient(135deg, #073B3F, #0C4044);
          color: #FDFDFC;
          box-shadow: 0 14px 28px rgba(12,64,68,0.18);
        }

        .shop-btn-primary:hover { opacity: 0.9; }

        .shop-btn-outline {
          background: transparent;
          border: 1.5px solid #9F6130;
          color: #9F6130;
        }

        .shop-btn-outline:hover {
          background: #9F6130;
          color: #FDFDFC;
        }

        .nearby-empty,
        .nearby-loading,
        .nearby-denied {
          border: 1px solid rgba(189,207,206,0.85);
          border-radius: 30px;
          background: rgba(253,253,252,0.86);
          box-shadow: 0 24px 70px rgba(12,64,68,0.1);
          padding: 76px 24px;
          text-align: center;
        }

        .nearby-empty h2,
        .nearby-loading h2,
        .nearby-denied h2 {
          margin: 0 0 10px;
          color: #073B3F;
          font-family: "Playfair Display", Georgia, serif;
          font-size: clamp(30px, 3.8vw, 44px);
        }

        .nearby-empty p,
        .nearby-loading p,
        .nearby-denied p {
          margin: 0 auto 24px;
          max-width: 480px;
          color: #52625f;
          line-height: 1.7;
        }

        .nearby-btn {
          border: 0;
          border-radius: 999px;
          padding: 14px 26px;
          background: linear-gradient(135deg, #073B3F, #0C4044);
          color: #FDFDFC;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 1.1px;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 18px 36px rgba(12,64,68,0.2);
        }

        .nearby-btn-outline {
          border: 1.5px solid #073B3F;
          background: transparent;
          color: #073B3F;
          box-shadow: none;
        }

        .nearby-btn-row {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .nearby-spin {
          width: 40px;
          height: 40px;
          margin: 0 auto 18px;
          border-radius: 50%;
          border: 3px solid rgba(12,64,68,0.14);
          border-top-color: #073B3F;
          animation: nearby-spin 900ms linear infinite;
        }

        @keyframes nearby-spin {
          to { transform: rotate(360deg); }
        }

        /* Premium boutique treatment */
        .nearby-shell{width:min(1860px,100%);margin:0 auto}
        .nearby-hero{background:radial-gradient(circle at 90% 12%,rgba(204,168,129,.24),transparent 30%),linear-gradient(135deg,rgba(253,253,252,.98),rgba(243,243,240,.94));box-shadow:0 30px 90px rgba(12,64,68,.12)}
        .shop-card{border-radius:28px;background:#FDFDFC}
        .shop-image{height:220px;background:radial-gradient(circle at 50% 38%,rgba(255,255,255,.98),rgba(243,232,222,.54) 42%,rgba(219,231,229,.9))}
        .shop-image-mark{display:none}
        .shop-monogram{width:108px;height:108px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(145deg,#073B3F,#0D5458);color:#F0D29E;border:1px solid rgba(226,188,132,.58);box-shadow:0 24px 54px rgba(7,59,63,.22),inset 0 1px 0 rgba(255,255,255,.16)}
        .shop-monogram span{font-family:"Cormorant Garamond",Georgia,serif;font-size:36px;font-weight:700;letter-spacing:.08em}
        .shop-rank{position:absolute;left:18px;top:17px;color:rgba(7,59,63,.42);font-family:Georgia,serif;font-size:15px;font-weight:800}
        .shop-image-caption{position:absolute;bottom:17px;color:#8C694A;font-size:9px;font-weight:800;letter-spacing:.18em;text-transform:uppercase}
        .shop-content{padding:25px 26px 26px}
        .shop-eyebrow{display:flex;align-items:center;gap:8px;margin-bottom:9px;color:#A2764C;font-size:9px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}
        .shop-eyebrow span{width:18px;height:1px;background:#BB8958}
        .shop-name{font-size:29px}
        .shop-address{margin-top:13px;min-height:40px;display:flex;gap:9px;align-items:flex-start}
        .shop-address svg{width:16px;height:16px;flex:0 0 auto;margin-top:2px;color:#BB8958}
        .shop-btn{min-height:48px;padding-inline:12px}

        @media (max-width: 1180px) {
          .nearby-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (max-width: 860px) {
          .nearby-hero { align-items: flex-start; flex-direction: column; }
          .nearby-stat { width: 100%; text-align: left; }
          .nearby-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (max-width: 560px) {
          .nearby-shell { padding: 22px 12px 52px; }
          .nearby-grid { grid-template-columns: 1fr; }
          .shop-name { min-height: 0; }
          .shop-image{height:190px}.shop-actions{flex-direction:column}
        }
      `}</style>

      <main className="nearby-shell">
        <section className="nearby-hero">
          <div>
            <div className="nearby-kicker">Live Store Locator</div>
            <h1>Nearby Shop</h1>
            <p>
              Real jewellery stores within 15km of your location — discover trusted names near you, ready to visit or call.
            </p>
          </div>
          <div className="nearby-stat">
            <strong>{shops.length}</strong>
            <span>{shops.length === 1 ? 'Store found' : 'Stores found'}</span>
            <span>Within 15 km</span>
          </div>
        </section>

        {locationGranted && !shopsLoading && shops.length > 0 && (
          <div className="nearby-filters">
            {SEARCH_TYPES.map(f => (
              <button
                key={f.value}
                type="button"
                className={`nearby-filter-btn ${searchType === f.value ? 'is-active' : ''}`}
                onClick={() => setSearchType(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {locationLoading && (
          <section className="nearby-loading">
            <div className="nearby-spin" />
            <h2>Detecting Your Location</h2>
            <p>Please allow location access when prompted, so we can find stores near you.</p>
          </section>
        )}

        {!locationLoading && !locationGranted && (
          <section className="nearby-denied">
            <h2>Enable Location to Find Nearby Stores</h2>
            <p>
              We use OpenStreetMap to find real jewellery stores within <strong>15km</strong> of you — free, no sign-up needed.
            </p>
            <div className="nearby-btn-row">
              <button className="nearby-btn" type="button" onClick={requestLocation}>
                Allow Location Access
              </button>
            </div>
            {locationError && <p style={{ color: '#C92035', marginTop: 18 }}>{locationError}</p>}
          </section>
        )}

        {locationGranted && shopsLoading && (
          <section className="nearby-loading">
            <div className="nearby-spin" />
            <h2>Searching Nearby Stores</h2>
            <p>Using OpenStreetMap data within a 15km radius.</p>
          </section>
        )}

        {locationGranted && !shopsLoading && shopsError && (
          <section className="nearby-empty">
            <h2>No Stores Found Within 15km</h2>
            <p>OpenStreetMap may not have store data in your area yet. Try searching on Google Maps directly.</p>
            <div className="nearby-btn-row">
              <button
                className="nearby-btn"
                type="button"
                onClick={() => fetchShopsOSM(userLocation.lat, userLocation.lng)}
              >
                Try Again
              </button>
              <button
                className="nearby-btn nearby-btn-outline"
                type="button"
                onClick={() => window.open('https://www.google.com/maps/search/jewellery+near+me/', '_blank')}
              >
                Search on Google Maps
              </button>
            </div>
          </section>
        )}

        {locationGranted && !shopsLoading && shops.length > 0 && (
          <section className="nearby-grid" aria-label="Nearby jewellery stores">
            {shops.map((shop, index) => (
              <ShopCard key={shop.id} shop={shop} index={index} onDirections={openDirections} onCall={callShop} />
            ))}
          </section>
        )}
      </main>

      <CustomerFooter />
    </div>
  )
}
