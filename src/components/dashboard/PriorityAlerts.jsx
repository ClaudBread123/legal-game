import { useGameStore } from '../../store/gameStore.js'
import StatusDot from '../shared/StatusDot.jsx'

export default function PriorityAlerts() {
  const { notifications, markNotificationRead } = useGameStore()
  const unread = notifications.filter(n => !n.read).slice(0, 5)

  if (unread.length === 0) return null

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderLeft: '3px solid var(--accent-red)', borderRadius: '8px',
      padding: '16px', marginBottom: '16px',
    }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '10px', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
        PRIORITY ALERTS
      </div>
      {unread.map(n => (
        <div key={n.id} style={{
          display: 'flex', gap: '10px', padding: '8px 0',
          borderBottom: '1px solid var(--border)',
          alignItems: 'flex-start',
        }}>
          <StatusDot status={n.type === 'warning' || n.type === 'critical' ? 'critical' : 'major'} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
              {n.message}
            </div>
            {n.caseId && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                {n.caseId}
              </div>
            )}
          </div>
          <button
            onClick={() => markNotificationRead(n.id)}
            style={{
              background: 'none', border: 'none', color: 'var(--text-muted)',
              fontSize: '16px', padding: '0', lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
