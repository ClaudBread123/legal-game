import { LITIGATION_ACTIONS } from '../../data/litigationActions.js'
import { formatShortDate } from '../../utils/dateUtils.js'

const ACTION_LABEL = Object.fromEntries(LITIGATION_ACTIONS.map(a => [a.id, a.label]))

function buildLogEntries(caseObject) {
  const entries = []

  // Completed actions
  const timestamps = caseObject.actionTimestamps || {}
  for (const actionId of caseObject.completedActions || []) {
    entries.push({
      key: `action-${actionId}`,
      date: timestamps[actionId] || caseObject.dateFiled,
      type: 'action',
      icon: '✓',
      iconColor: '#4ade80',
      description: ACTION_LABEL[actionId] || actionId,
      impact: null,
    })
  }

  // Consequence / health events
  for (const ev of caseObject.caseHealthEvents || []) {
    entries.push({
      key: `health-${ev.event}-${ev.date}`,
      date: ev.date,
      type: 'consequence',
      icon: '✗',
      iconColor: 'var(--accent-red)',
      description: ev.event,
      detail: ev.description,
      impact: ev.impact,
    })
  }

  // Sort descending by date
  entries.sort((a, b) => {
    if (a.date > b.date) return -1
    if (a.date < b.date) return 1
    // actions before consequences on same day
    if (a.type === 'action' && b.type !== 'action') return -1
    return 0
  })

  return entries
}

export default function CaseLog({ caseObject }) {
  const entries = buildLogEntries(caseObject)
  const actionsCount = (caseObject.completedActions || []).length
  const consequencesCount = (caseObject.consequencesTriggered || []).length
  const health = caseObject.caseHealth ?? 100
  const healthDelta = health - 100
  const daysFiled = caseObject.dateFiled
    ? Math.max(0, Math.round((Date.now() - new Date(caseObject.dateFiled + 'T12:00:00')) / 86400000))
    : 0

  return (
    <div>
      {/* Summary bar */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '8px', padding: '14px 20px', marginBottom: '20px',
      }}>
        {[
          { label: 'Actions Taken', value: actionsCount, color: '#4ade80' },
          { label: 'Consequences', value: consequencesCount, color: consequencesCount > 0 ? 'var(--accent-red)' : 'var(--text-muted)' },
          {
            label: 'Health Change',
            value: healthDelta === 0 ? '—' : `100 → ${health}`,
            color: healthDelta < -30 ? 'var(--accent-red)' : healthDelta < 0 ? 'var(--accent-yellow)' : '#4ade80',
          },
          { label: 'Days Elapsed', value: daysFiled, color: 'var(--text-secondary)' },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: '4px' }}>
              {s.value}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
              {s.label.toUpperCase()}
            </div>
          </div>
        ))}
      </div>

      {/* Log entries */}
      {entries.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          No activity recorded yet. Take actions to begin building your case record.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {entries.map(entry => (
            <div key={entry.key} style={{
              display: 'flex', gap: '14px', padding: '12px 16px',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderLeft: `3px solid ${entry.iconColor}`,
              borderRadius: '6px', alignItems: 'flex-start',
            }}>
              {/* Icon */}
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700,
                color: entry.iconColor, flexShrink: 0, minWidth: '16px', lineHeight: '1.4',
              }}>
                {entry.icon}
              </span>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '13px', color: 'var(--text-primary)', fontWeight: entry.type === 'consequence' ? 600 : 400,
                  marginBottom: entry.detail ? '4px' : '0',
                }}>
                  {entry.description}
                </div>
                {entry.detail && (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                    {entry.detail}
                  </div>
                )}
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                  {entry.date ? formatShortDate(entry.date) : '—'}
                </div>
              </div>

              {/* Health impact */}
              {entry.impact !== null && entry.impact !== undefined && (
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700,
                  color: entry.impact < 0 ? 'var(--accent-red)' : '#4ade80',
                  flexShrink: 0, whiteSpace: 'nowrap',
                }}>
                  {entry.impact > 0 ? '+' : ''}{entry.impact} health
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
