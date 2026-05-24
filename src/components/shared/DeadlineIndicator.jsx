import StatusDot from './StatusDot.jsx'

export default function DeadlineIndicator({ daysRemaining }) {
  let status = 'active'
  let label = `${daysRemaining}d`
  if (daysRemaining < 0) { status = 'critical'; label = `${Math.abs(daysRemaining)}d overdue` }
  else if (daysRemaining <= 7) { status = 'critical'; label = `${daysRemaining}d` }
  else if (daysRemaining <= 30) { status = 'major'; label = `${daysRemaining}d` }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-secondary)' }}>
      <StatusDot status={status} size={6} />
      {label}
    </span>
  )
}
