import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore.js'
import { calculateDeadlines } from '../../utils/deadlineEngine.js'
import { daysBetween, formatShortDate } from '../../utils/dateUtils.js'
import StatusDot from '../shared/StatusDot.jsx'

const DEADLINE_LABELS = {
  answerDue: 'Answer / MTD Due',
  mtdHearingRecommended: 'MTD Hearing (Rec.)',
  removalDeadline: 'Removal Deadline',
  respondToPlaintiffDiscovery: "Respond to Pltf. Discovery",
  plaintiffExpertDisclosure: "Plaintiff's Expert Disc.",
  defendantExpertDisclosure: "Defendant's Expert Disc.",
  discoveryCloses: 'Discovery Closes',
  summaryJudgmentDeadline: 'Summary Judgment',
  mediationDeadline: 'Mediation',
  trialDate: 'Trial Date',
}

export default function DeadlinePanel({ caseObject }) {
  const { currentDate } = useGameStore()
  const deadlines = calculateDeadlines(caseObject)

  const items = Object.entries(deadlines)
    .filter(([, date]) => date)
    .map(([key, date]) => ({
      key, label: DEADLINE_LABELS[key] || key, date,
      days: currentDate ? daysBetween(currentDate, date) : null,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6)

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '8px', padding: '18px',
    }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '12px', fontWeight: 600 }}>
        UPCOMING DEADLINES
      </div>

      {items.map(item => {
        const overdue = item.days !== null && item.days < 0
        const imminent = item.days !== null && item.days >= 0 && item.days <= 7
        const status = overdue ? 'critical' : imminent || (item.days !== null && item.days <= 14) ? 'major' : 'info'

        const rowStyle = {
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '7px 0', borderBottom: '1px solid var(--border)',
          background: overdue ? 'rgba(224,82,82,0.06)' : 'transparent',
          borderRadius: overdue ? '4px' : 0,
          paddingLeft: overdue ? '6px' : 0,
        }

        return overdue ? (
          <motion.div
            key={item.key}
            style={rowStyle}
            animate={{ opacity: [1, 0.55, 1] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flex: 1 }}>
              <StatusDot status={status} size={6} />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                {item.label}
              </span>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                {formatShortDate(item.date)}
              </div>
              {item.days !== null && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--accent-red)' }}>
                  {Math.abs(item.days)}d over
                </div>
              )}
              <span style={{ fontSize: '9px', background: 'var(--accent-red)', color: '#fff', borderRadius: '3px', padding: '1px 4px' }}>
                OVERDUE
              </span>
            </div>
          </motion.div>
        ) : (
          <div key={item.key} style={rowStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flex: 1 }}>
              {imminent ? (
                <motion.span
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                  style={{
                    display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                    backgroundColor: 'var(--accent-red)', flexShrink: 0,
                  }}
                />
              ) : (
                <StatusDot status={status} size={6} />
              )}
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                {item.label}
              </span>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                {formatShortDate(item.date)}
              </div>
              {item.days !== null && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
                  {item.days}d
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
