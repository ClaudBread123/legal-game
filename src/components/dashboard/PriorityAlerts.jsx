import { useGameStore } from '../../store/gameStore.js'
import { calculateDeadlines } from '../../utils/deadlineEngine.js'
import { daysBetween } from '../../utils/dateUtils.js'
import StatusDot from '../shared/StatusDot.jsx'

const DEADLINE_LABELS = {
  answerDue: 'Answer / MTD Due',
  mtdHearingRecommended: 'MTD Hearing',
  removalDeadline: 'Removal Deadline',
  plaintiffExpertDisclosure: "Plaintiff's Expert Disclosure",
  defendantExpertDisclosure: "Defendant's Expert Disclosure",
  discoveryCloses: 'Discovery Closes',
  summaryJudgmentDeadline: 'Summary Judgment',
  mediationDeadline: 'Mediation Deadline',
  trialDate: 'Trial Date',
}

const ACTION_FOR_DEADLINE = {
  answerDue: 'motion_to_dismiss',
  removalDeadline: 'motion_to_dismiss',
  defendantExpertDisclosure: 'disclose_expert',
  summaryJudgmentDeadline: 'motion_summary_judgment',
  mediationDeadline: 'request_mediation',
}

function computeAlerts(cases, currentDate) {
  if (!currentDate) return []
  const alerts = []

  for (const c of cases) {
    if (c.status === 'closed') continue
    const deadlines = calculateDeadlines(c)
    const completed = c.completedActions || []
    const timestamps = c.actionTimestamps || {}

    // Deadline proximity alerts
    for (const [key, date] of Object.entries(deadlines)) {
      if (!date) continue
      const days = daysBetween(currentDate, date)
      const actionId = ACTION_FOR_DEADLINE[key]
      const actionDone = actionId ? completed.includes(actionId) : false
      if (actionDone) continue

      if (days >= 0 && days <= 7) {
        alerts.push({
          id: `${c.caseId}-${key}-red`,
          severity: 'critical',
          text: `${DEADLINE_LABELS[key] || key} in ${days} day${days !== 1 ? 's' : ''}`,
          caseId: c.caseId,
          days,
        })
      } else if (days > 7 && days <= 30) {
        alerts.push({
          id: `${c.caseId}-${key}-yellow`,
          severity: 'major',
          text: `${DEADLINE_LABELS[key] || key} in ${days} days`,
          caseId: c.caseId,
          days,
        })
      }
    }

    // MTD filed but hearing not noticed within 14 days
    if (completed.includes('motion_to_dismiss') && !completed.includes('notice_mtd_hearing')) {
      const mtdDate = timestamps['motion_to_dismiss']
      if (mtdDate) {
        const daysSinceMTD = daysBetween(mtdDate, currentDate)
        if (daysSinceMTD >= 14) {
          alerts.push({
            id: `${c.caseId}-mtd-hearing-warn`,
            severity: 'critical',
            text: 'Set MTD hearing immediately — risk of 5-minute slot',
            caseId: c.caseId,
            days: 0,
          })
        }
      }
    }

    // Plaintiff depo not noticed within 45 days of case start
    if (!completed.includes('notice_plaintiff_depo')) {
      const daysSinceFiled = daysBetween(c.dateFiled, currentDate)
      if (daysSinceFiled >= 30 && daysSinceFiled < 45) {
        alerts.push({
          id: `${c.caseId}-depo-warn`,
          severity: 'major',
          text: "Notice plaintiff's deposition — sequencing window closing",
          caseId: c.caseId,
          days: 45 - daysSinceFiled,
        })
      } else if (daysSinceFiled >= 45) {
        alerts.push({
          id: `${c.caseId}-depo-overdue`,
          severity: 'critical',
          text: "Notice plaintiff's deposition — sequencing advantage lost",
          caseId: c.caseId,
          days: 0,
        })
      }
    }
  }

  // Sort: critical first, then by days
  return alerts
    .sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === 'critical' ? -1 : 1
      return a.days - b.days
    })
    .slice(0, 6)
}

export default function PriorityAlerts() {
  const { cases, currentDate, notifications, markNotificationRead } = useGameStore()
  const caseAlerts = computeAlerts(cases, currentDate)
  const storeAlerts = notifications.filter(n => !n.read).slice(0, 3)

  const allEmpty = caseAlerts.length === 0 && storeAlerts.length === 0

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${allEmpty ? 'var(--border)' : 'var(--accent-red)33'}`,
      borderLeft: allEmpty ? '3px solid var(--border)' : '3px solid var(--accent-red)',
      borderRadius: '8px',
      padding: '16px', marginBottom: '16px',
    }}>
      <div style={{
        fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em',
        marginBottom: '10px', fontFamily: 'var(--font-sans)', fontWeight: 600,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span>PRIORITY ALERTS</span>
        {caseAlerts.length > 0 && (
          <span style={{
            background: 'var(--accent-red)', color: '#fff', borderRadius: '10px',
            padding: '1px 6px', fontSize: '10px', fontFamily: 'var(--font-mono)',
          }}>
            {caseAlerts.length}
          </span>
        )}
      </div>

      {allEmpty ? (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
          No urgent matters today.
        </div>
      ) : (
        <>
          {caseAlerts.map(alert => (
            <div key={alert.id} style={{
              display: 'flex', gap: '10px', padding: '8px 0',
              borderBottom: '1px solid var(--border)', alignItems: 'flex-start',
            }}>
              <StatusDot status={alert.severity} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                  {alert.text}
                </div>
                <div style={{
                  fontSize: '10px', color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)', marginTop: '2px',
                }}>
                  {alert.caseId}
                </div>
              </div>
              {alert.days > 0 && (
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '11px',
                  color: alert.severity === 'critical' ? 'var(--accent-red)' : 'var(--accent-yellow)',
                  flexShrink: 0,
                }}>
                  {alert.days}d
                </span>
              )}
            </div>
          ))}

          {storeAlerts.map(n => (
            <div key={n.id} style={{
              display: 'flex', gap: '10px', padding: '8px 0',
              borderBottom: '1px solid var(--border)', alignItems: 'flex-start',
            }}>
              <StatusDot status="major" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                  {n.message}
                </div>
                {n.caseId && (
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                    {n.caseId}
                  </div>
                )}
              </div>
              <button
                onClick={() => markNotificationRead(n.id)}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  fontSize: '16px', padding: '0', lineHeight: 1, cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
