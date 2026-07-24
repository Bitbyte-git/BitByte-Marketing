import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomerFooter from './CustomerFooter'

const TEAM369_SHOWCASE_URL = 'https://gold-showcase.vercel.app/'

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

function ShopCard({ shop }) {
  const [hovered, setHovered] = useState(false)

  const openMaps = () => {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.name)}&query_place_id=${shop.lat},${shop.lng}`,
      '_blank'
    )
  }

  const openDirections = () => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}`,
      '_blank'
    )
  }

  const callShop = () => {
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
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        border: `1.5px solid ${hovered ? '#8B1A1A' : '#f0e8e0'}`,
        borderRadius: 16, overflow: 'hidden',
        transition: 'all 0.3s ease',
        boxShadow: hovered ? '0 12px 40px rgba(139,26,26,0.15)' : '0 2px 12px rgba(0,0,0,0.06)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
    >
      {/* Image / Icon */}
      <div style={{
        height: 140, overflow: 'hidden',
        background: 'linear-gradient(135deg,#f5f0e8,#e8ddd5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <div style={{ fontSize: 56, filter: 'drop-shadow(0 4px 8px rgba(184,134,11,0.3))' }}>💍</div>

        {/* Distance badge */}
        {shop.distance !== null && shop.distance !== undefined && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            background: 'rgba(139,26,26,0.85)', color: '#fff',
            fontSize: 11, fontWeight: 700,
            padding: '3px 10px', borderRadius: 20,
            backdropFilter: 'blur(4px)',
          }}>
            📍 {shop.distance < 1
              ? `${Math.round(shop.distance * 1000)} m`
              : `${shop.distance.toFixed(1)} km`}
          </div>
        )}

        {/* Open/Closed */}
        {shop.opening_hours && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            background: shop.opening_hours === 'open' ? '#059669' : '#6b7280',
            color: '#fff', fontSize: 9, fontWeight: 800,
            padding: '3px 8px', borderRadius: 20,
          }}>
            {shop.opening_hours === 'open' ? '● OPEN' : '● HOURS N/A'}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '14px 16px' }}>
        {/* Name */}
        <div style={{
          fontSize: 14, fontWeight: 700, color: '#1a0a0a',
          fontFamily: '"Playfair Display", Georgia, serif',
          lineHeight: 1.3, marginBottom: 6,
        }}>
          {shop.name}
        </div>

        {/* Address */}
        {shop.address && (
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6, lineHeight: 1.4 }}>
            📍 {shop.address}
          </div>
        )}

        {/* Phone */}
        {shop.phone && (
          <div style={{ fontSize: 12, color: '#059669', fontWeight: 600, marginBottom: 8 }}>
            📞 {shop.phone}
          </div>
        )}

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 12,
            background: 'rgba(139,26,26,0.07)', color: '#8B1A1A',
            border: '1px solid rgba(139,26,26,0.15)',
          }}>
            💍 Jewellery Store
          </span>
          {shop.brand && (
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 12,
              background: 'rgba(184,134,11,0.08)', color: '#b8860b',
              border: '1px solid rgba(184,134,11,0.2)',
            }}>
              {shop.brand}
            </span>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={openDirections}
            style={{
              flex: 1, padding: '9px 0',
              background: 'linear-gradient(90deg,#8B1A1A,#b91c1c)',
              border: 'none', borderRadius: 10,
              color: '#fff', fontSize: 12, fontWeight: 700,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            🗺️ Get Direction
          </button>
          <button
            onClick={callShop}
            style={{
              flex: 1, padding: '9px 0',
              background: 'transparent',
              border: '1.5px solid #8B1A1A', borderRadius: 10,
              color: '#8B1A1A', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#8B1A1A'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8B1A1A' }}
          >
            {shop.phone ? '📞 Call Now' : '🔍 View on Maps'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BBLive() {
  const navigate = useNavigate()
  const [userLocation, setUserLocation] = useState(null)
  const [locationLoading, setLocationLoading] = useState(true)
  const [locationGranted, setLocationGranted] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [shops, setShops] = useState([])
  const [shopsLoading, setShopsLoading] = useState(false)
  const [shopsError, setShopsError] = useState('')
  const [searchType, setSearchType] = useState('jewelry')
  const [retryCount, setRetryCount] = useState(0)

  const SEARCH_TYPES = [
    { label: '✦ All Jewellery', value: 'jewelry' },
    { label: 'Gold', value: 'gold jewelry' },
    { label: 'Diamond', value: 'diamond jewelry' },
    { label: 'Silver', value: 'silver jewelry' },
    { label: 'Bridal', value: 'bridal jewelry' },
  ]

  // ── Fetch from OpenStreetMap Overpass API (FREE) ──
  return (
    <div style={{ minHeight: '100vh', background: '#f8f6f1', fontFamily: '"Montserrat", Inter, system-ui, sans-serif' }}>

      <main style={{ padding: '28px clamp(16px, 3vw, 40px) 44px' }}>
        <section style={{
          maxWidth: 1540,
          margin: '0 auto',
          border: '1px solid rgba(7,59,63,0.16)',
          borderRadius: 18,
          overflow: 'hidden',
          background: '#fff',
          boxShadow: '0 22px 60px rgba(7,59,63,0.12)',
        }}>
          <div style={{
            minHeight: 64,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            borderBottom: '1px solid rgba(7,59,63,0.12)',
            background: 'linear-gradient(90deg,#073B3F,#0b5257)',
            color: '#fff',
            flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', opacity: .78 }}>
                Team369 Live
              </div>
              <h1 style={{
                margin: '4px 0 0',
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: 'clamp(22px, 2vw, 32px)',
                lineHeight: 1.1,
              }}>
                Gold Showcase
              </h1>
            </div>

            <button
              type="button"
              onClick={() => window.open(TEAM369_SHOWCASE_URL, '_blank', 'noopener,noreferrer')}
              style={{
                minHeight: 38,
                padding: '0 16px',
                border: '1px solid rgba(255,255,255,.42)',
                borderRadius: 999,
                background: 'rgba(255,255,255,.12)',
                color: '#fff',
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              Open Full Website
            </button>
          </div>

          <iframe
            title="Team369 Gold Showcase"
            src={TEAM369_SHOWCASE_URL}
            style={{
              display: 'block',
              width: '100%',
              height: 'calc(100vh - 265px)',
              minHeight: 620,
              border: 0,
              background: '#fff',
            }}
            loading="eager"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </section>
      </main>

      <CustomerFooter />
    </div>
  )

  const fetchShopsOSM = async (lat, lng, type = 'jewelry') => {
    setShopsLoading(true)
    setShopsError('')

    const radius = 30000 // 30km

    // Overpass QL query
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

      // Filter nodes with lat/lng
      const shopNodes = elements
        .filter(el => el.lat && el.lng || (el.type === 'node' && el.lat && el.lon))
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
        .filter(s => s.name !== 'Jewellery Store' || s.address) // filter unnamed ones without address
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 20)

      if (shopNodes.length === 0) {
        setShopsError('No jewellery stores found within 30km in OpenStreetMap data.')
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
        fetchShopsOSM(latitude, longitude, searchType)
      },
      (err) => {
        setLocationError('Location access denied. Please allow location and retry.')
        setLocationLoading(false)
        setLocationGranted(false)
      },
      { timeout: 12000, enableHighAccuracy: false }
    )
  }

  useEffect(() => {
    requestLocation()
  }, [])

  // Re-fetch on filter change
  useEffect(() => {
    if (userLocation && locationGranted) {
      fetchShopsOSM(userLocation.lat, userLocation.lng, searchType)
    }
  }, [searchType])

  const rows = []
  for (let i = 0; i < shops.length; i += 4) {
    rows.push(shops.slice(i, i + 4))
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FDF5EE', fontFamily: '"Montserrat", Inter, system-ui, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@400;500;600;700&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .shop-row { animation: fadeUp 0.5s ease both; }
      `}</style>

      {/* ── HERO ── */}
      <div style={{
        background: 'linear-gradient(135deg,#6b0f0f,#8B1A1A,#b8860b)',
        padding: '48px 40px 40px',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.06, background: 'url("/coin_promote.png") center/cover' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%', background: '#4ade80',
              boxShadow: '0 0 12px rgba(74,222,128,0.8)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
            <span style={{ color: '#4ade80', fontSize: 12, fontWeight: 800, letterSpacing: '3px', textTransform: 'uppercase' }}>
              Live Store Locator
            </span>
          </div>

          <h1 style={{
            color: '#fff', fontSize: 36, fontWeight: 700,
            fontFamily: '"Playfair Display", Georgia, serif',
            margin: '0 0 12px', lineHeight: 1.3,
          }}>
            BJ-LIVE — Find Jewellery Stores Near You
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, margin: '0 auto 28px', maxWidth: 560 }}>
            Real jewellery stores near your location — powered by OpenStreetMap. 100% Free!
          </p>

          {/* Status */}
          {locationLoading ? (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: 'rgba(255,255,255,0.15)', borderRadius: 30,
              padding: '10px 24px', backdropFilter: 'blur(8px)',
            }}>
              <div style={{
                width: 16, height: 16,
                border: '2px solid rgba(255,255,255,0.3)',
                borderTop: '2px solid #fff',
                borderRadius: '50%', animation: 'spin 1s linear infinite',
              }} />
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>Detecting your location...</span>
            </div>
          ) : locationGranted && shopsLoading ? (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: 'rgba(255,255,255,0.15)', borderRadius: 30,
              padding: '10px 24px', backdropFilter: 'blur(8px)',
            }}>
              <div style={{
                width: 16, height: 16,
                border: '2px solid rgba(255,255,255,0.3)',
                borderTop: '2px solid #4ade80',
                borderRadius: '50%', animation: 'spin 1s linear infinite',
              }} />
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>Finding jewellery stores near you...</span>
            </div>
          ) : locationGranted && shops.length > 0 ? (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(74,222,128,0.2)', borderRadius: 30,
              padding: '10px 24px', border: '1px solid rgba(74,222,128,0.4)',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px rgba(74,222,128,0.8)' }} />
              <span style={{ color: '#4ade80', fontSize: 13, fontWeight: 700 }}>
                Found {shops.length} jewellery stores within 30km!
              </span>
            </div>
          ) : locationGranted && shopsError ? (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(251,191,36,0.2)', borderRadius: 30,
              padding: '10px 24px', border: '1px solid rgba(251,191,36,0.4)',
            }}>
              <span style={{ color: '#fbbf24', fontSize: 13, fontWeight: 700 }}>
                ⚠️ No stores found in OpenStreetMap data nearby
              </span>
            </div>
          ) : !locationGranted && !locationLoading ? (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(239,68,68,0.2)', borderRadius: 30,
              padding: '10px 24px', border: '1px solid rgba(239,68,68,0.4)',
            }}>
              <span style={{ color: '#fca5a5', fontSize: 13, fontWeight: 700 }}>
                ⚠️ Location access needed
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      {locationGranted && !shopsLoading && shops.length > 0 && (
        <div style={{
          background: '#fff', borderBottom: '1px solid #f0e8e0',
          padding: '14px 40px',
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          {SEARCH_TYPES.map(f => (
            <button
              key={f.value}
              onClick={() => setSearchType(f.value)}
              style={{
                padding: '7px 18px', borderRadius: 30, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.2s ease',
                border: searchType === f.value ? 'none' : '1.5px solid #e8ddd5',
                background: searchType === f.value ? 'linear-gradient(90deg,#8B1A1A,#b91c1c)' : '#fff',
                color: searchType === f.value ? '#fff' : '#6b5c4a',
              }}
            >
              {f.label}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 13, color: '#6b7280' }}>
            <strong style={{ color: '#8B1A1A' }}>{shops.length}</strong> stores found within 30km
          </span>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div style={{ padding: '32px 40px', maxWidth: 1400, margin: '0 auto' }}>

        {/* Location Loading */}
        {locationLoading && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16, animation: 'pulse 1s infinite' }}>📡</div>
            <p style={{ color: '#8B1A1A', fontSize: 16, fontWeight: 600 }}>Detecting your location...</p>
            <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 8 }}>Please allow location access when prompted</p>
          </div>
        )}

        {/* Location Denied */}
        {!locationLoading && !locationGranted && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: 72, marginBottom: 20 }}>📍</div>
            <h2 style={{
              fontSize: 24, fontWeight: 700, color: '#1a0a0a',
              fontFamily: '"Playfair Display", Georgia, serif', marginBottom: 14,
            }}>
              Enable Location to Find Nearby Stores
            </h2>
            <p style={{ color: '#6b7280', fontSize: 15, maxWidth: 420, margin: '0 auto 28px' }}>
              We use OpenStreetMap (free) to find real jewellery stores within <strong>30km</strong> of you.
            </p>

            <button
              onClick={requestLocation}
              style={{
                padding: '15px 44px',
                background: 'linear-gradient(90deg,#8B1A1A,#b8860b)',
                border: 'none', borderRadius: 30,
                color: '#fff', fontSize: 15, fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(139,26,26,0.35)',
                display: 'inline-flex', alignItems: 'center', gap: 10,
              }}
            >
              📍 Allow Location Access
            </button>

            {locationError && (
              <div style={{
                marginTop: 20, padding: '12px 24px',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 12, display: 'inline-block',
                color: '#dc2626', fontSize: 13, fontWeight: 600,
              }}>
                ⚠️ {locationError}
              </div>
            )}

            <p style={{ color: '#9ca3af', fontSize: 12, marginTop: 16 }}>
              Browser → 🔒 Lock icon → Location → Allow → Refresh page
            </p>
          </div>
        )}

        {/* Shops Loading */}
        {locationGranted && shopsLoading && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              width: 52, height: 52,
              border: '4px solid rgba(139,26,26,0.15)',
              borderTop: '4px solid #8B1A1A',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px',
            }} />
            <p style={{ color: '#8B1A1A', fontSize: 15, fontWeight: 600 }}>
              Searching jewellery stores near you...
            </p>
            <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 8 }}>
              Using OpenStreetMap data • 30km radius
            </p>
          </div>
        )}

        {/* No Shops Found */}
        {locationGranted && !shopsLoading && shopsError && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#1a0a0a', marginBottom: 10 }}>
              No jewellery stores found within 30km
            </div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24, maxWidth: 380, margin: '0 auto 24px' }}>
              OpenStreetMap may not have stores in your area yet. Try searching on Google Maps directly.
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => fetchShopsOSM(userLocation.lat, userLocation.lng, searchType)}
                style={{
                  padding: '11px 28px', background: '#8B1A1A',
                  color: '#fff', border: 'none', borderRadius: 24,
                  cursor: 'pointer', fontWeight: 700, fontSize: 13,
                }}
              >
                🔄 Try Again
              </button>
              <button
                onClick={() => window.open(`https://www.google.com/maps/search/jewellery+near+me/`, '_blank')}
                style={{
                  padding: '11px 28px', background: 'transparent',
                  color: '#8B1A1A', border: '1.5px solid #8B1A1A',
                  borderRadius: 24, cursor: 'pointer', fontWeight: 700, fontSize: 13,
                }}
              >
                🗺️ Search on Google Maps
              </button>
            </div>
          </div>
        )}

        {/* Shops Grid */}
        {locationGranted && !shopsLoading && shops.length > 0 && (
          <>
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg,transparent,#e8ddd5)' }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: '#8B1A1A', letterSpacing: '2px', textTransform: 'uppercase' }}>
                📍 Real Stores Near You — Within 30km
              </span>
              <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg,#e8ddd5,transparent)' }} />
            </div>

            {rows.map((row, rowIdx) => (
              <div
                key={rowIdx}
                className="shop-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(row.length, 4)}, 1fr)`,
                  gap: 20, marginBottom: 20,
                  animationDelay: `${rowIdx * 0.08}s`,
                }}
              >
                {row.map(shop => <ShopCard key={shop.id} shop={shop} />)}
              </div>
            ))}

            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#b09080' }}>
              Data powered by OpenStreetMap contributors • Free & Open Source
            </div>
          </>
        )}
      </div>

      <CustomerFooter />
    </div>
  )
}

