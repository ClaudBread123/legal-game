import { useGameStore } from '../../store/gameStore.js'
import StatusDot from '../shared/StatusDot.jsx'

const TYPE_STATUS = { action: 'info', warning: 'major', xp: 'active', mp: 'critical' }

export default function ActivityFeed() {
  const { activityFeed } = useGameStore()
  const entries = activityFeed.slice(0, 10)

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '8px', padding: '16px', marginBottom: '16px',
    }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '12px', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
        ACTIVITY LOG
      </div>
      {entries.length === 0 && (
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          No activity yet.
        </div>
      )}
      {entries.map(e => (
        <div key={e.id} style={{
          display: 'flex', gap: '8px', padding: '6px 0',
          borderBottom: '1px solid var(--border)', alignItems: 'flex-start',
        }}>
          <StatusDot status={TYPE_STATUS[e.type] || 'info'} size={7} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              {e.message}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '1px' }}>
              {e.timestamp}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
