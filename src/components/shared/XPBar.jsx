import { getXPProgress, getTitleFromXP, getNextTitle } from '../../utils/scoring.js'

export default function XPBar({ xp, showLabels = true }) {
  const { percentage, nextThreshold } = getXPProgress(xp)
  const title = getTitleFromXP(xp)
  const next = getNextTitle(xp)

  return (
    <div style={{ width: '100%' }}>
      {showLabels && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
          <span style={{ color: 'var(--accent-gold)', fontFamily: 'var(--font-serif)' }}>{title}</span>
          {next && (
            <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {xp} / {nextThreshold} XP
            </span>
          )}
        </div>
      )}
      <div style={{
        height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${percentage}%`,
          background: 'var(--accent-gold)',
          borderRadius: '2px',
          transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  )
}
