// ── Common reusable Skeleton Loading components ──
// Use in any page like this:
// import { SkeletonCard, SkeletonRow, SkeletonText } from '../components/Skeleton'

export function SkeletonCard({ color = '#0284C7' }) {
  return (
    <div className="gcard gcard-skeleton" style={{ '--sc': color, borderStyle: 'dashed' }}>
      <div className="skel-badge" />
      <div className="skel-line" style={{ width: '70%' }} />
      <div className="skel-line" style={{ width: '90%', height: '16px', marginBottom: '10px' }} />
      <div className="skel-line" style={{ width: '60%' }} />
      <div className="skel-line" style={{ width: '50%' }} />
      <div className="skel-actions">
        <div className="skel-btn" />
        <div className="skel-btn" />
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

