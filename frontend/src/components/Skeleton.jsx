// ── Common reusable Skeleton Loading components ──
// Use in any page like this:
// import { SkeletonCard, SkeletonRow, SkeletonText } from '../components/Skeleton'

export function SkeletonCard({ color = '#0284C7' }) {
  return (
    <div className="gcard gcard-skeleton" style={{ '--sc': color, borderStyle: 'dashed', minHeight: 0 }}>
      <div className="skel-badge" style={{ marginBottom: '8px' }} />
      <div className="skel-line" style={{ width: '65%', height: '10px', marginBottom: '6px' }} />
      <div className="skel-line" style={{ width: '85%', height: '14px', marginBottom: '3px' }} />
      <div className="skel-line" style={{ width: '60%', height: '14px', marginBottom: '8px' }} />
      <div className="skel-line" style={{ width: '55%', height: '10px', marginBottom: '4px' }} />
      <div className="skel-line" style={{ width: '45%', height: '10px', marginBottom: '10px' }} />
      <div className="skel-actions" style={{ marginTop: '4px', marginBottom: '10px' }}>
        <div className="skel-btn" style={{ height: '22px' }} />
        <div className="skel-btn" style={{ height: '22px' }} />
      </div>
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
        {[0,1,2,3].map(i => (
          <div key={i} className="skel-line" style={{ width: '20px', height: '20px', borderRadius: '50%', marginBottom: 0 }} />
        ))}
      </div>
    </div>
  )
}

// ── Simple row skeleton — table/list loading ku (Sales Report, Coin Requests etc.) ──
export function SkeletonRow() {
  return (
    <div className="skel-row">
      <div className="skel-line" style={{ width: '20%', height: '14px' }} />
      <div className="skel-line" style={{ width: '30%', height: '14px' }} />
      <div className="skel-line" style={{ width: '15%', height: '14px' }} />
      <div className="skel-line" style={{ width: '15%', height: '14px' }} />
    </div>
  )
}

// ── Simple text line skeleton — any small loading spot ku ──
export function SkeletonText({ width = '100%', height = '12px' }) {
  return <div className="skel-line" style={{ width, height }} />
}   

