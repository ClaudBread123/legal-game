import { useGameStore } from '../../store/gameStore.js'
import { calculateDeadlines } from '../../utils/deadlineEngine.js'
import { daysBetween, formatShortDate, formatGameDate } from '../../utils/dateUtils.js'
import StatusDot from '../shared/StatusDot.jsx'

const DEADLINE_LABELS = {
  answerDue: 'Answer / MTD Due',
  mtdHearingRecommended: 'MTD Hearing (Rec.)',
  removalDeadline: 'Removal Deadline',
  plaintiffExpertDisclosure: "Plaintiff's Expert Disclosure",
  defendantExpertDisclosure: "Defendant's Expert Disclosure",
  discoveryCloses: 'Discovery Closes',
  summaryJudgmentDeadline: 'Summary Judgment',
  mediationDeadline: 'Mediation Deadline',
  trialDate: 'Trial Date',
}

const ACTION_DEADLINE_MAP = {
  motion_to_dismiss: 'answerDue',
  disclose_expert: 'defendantExpertDisclosure',
  motion_summary_judgment: 'summaryJudgmentDeadline',
  request_mediation: 'mediationDeadline',
}

export default function TimelineView({ caseObject }) {
  const { currentDate } = useGameStore()
  const deadlines = calculateDeadlines(caseObject)
  const completed = caseObject.completedActions || []

  const items = Object.entries(deadlines)
    .filter(([, date]) => date)
    .map(([key, date]) => {
      const actionId = Object.entries(ACTION_DEADLINE_MAP).find(([, dk]) => dk === key)?.[0]
      const isDone = actionId && completed.includes(actionId)
      const days = currentDate ? daysBetween(currentDate, date) : null
      let status = 'info'
      if (isDone) status = 'complete'
      else if (days !== null && days < 0) status = 'critical'
      else if (days !== null && days <= 30) status = 'major'
      return { key, label: DEADLINE_LABELS[key] || key, date, days, status, isDone }
    })
    .sort((a, b) => a.date.localeCompare(b.date))

  // Build SVG timeline
  const svgWidth = 700
  const svgHeight = 80
  const minDate = items[0]?.date || caseObject.dateFiled
  const maxDate = items[items.length - 1]?.date || items[0]?.date
  const totalRange = daysBetween(minDate, maxDate) || 1
  const pad = 40

  function xPos(date) {
    const d = daysBetween(minDate, date)
    return pad + ((d / totalRange) * (svgWidth - pad * 2))
  }

  const STATUS_COLORS = {
    complete: '#4caf82',
    critical: '#e05252',
    major: '#f0b429',
    info: '#4a5568',
  }

  return (
    <div>
      <div style={{ marginBottom: '24px', overflowX: 'auto' }}>
        <svg width={svgWidth} height={svgHeight} style={{ display: 'block', minWidth: '400px' }}>
          {/* Baseline */}
          <line x1={pad} y1={40} x2={svgWidth - pad} y2={40} stroke="#2a3347" strokeWidth="2" />
          {/* Today marker */}
          {currentDate && currentDate >= minDate && currentDate <= maxDate && (
            <>
              <line x1={xPos(currentDate)} y1={20} x2={xPos(currentDate)} y2={60} stroke="#c9a84c" strokeWidth="1.5" strokeDasharray="4,3" />
              <text x={xPos(currentDate)} y={14} fill="#c9a84c" fontSize="10" textAnchor="middle" fontFamily="JetBrains Mono, monospace">TODAY</text>
            </>
          )}
          {/* Deadline markers */}
          {items.map((item, i) => {
            const x = xPos(item.date)
            const color = STATUS_COLORS[item.status] || '#4a5568'
            const yLabel = i % 2 === 0 ? 65 : 18
            return (
              <g key={item.key}>
                <circle cx={x} cy={40} r={5} fill={color} />
                <line x1={x} y1={40} x2={x} y2={yLabel < 40 ? yLabel + 8 : yLabel - 4} stroke={color} strokeWidth="1" />
                <text x={x} y={yLabel} fill={color} fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono, monospace">
                  {formatShortDate(item.date)}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* List view */}
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '12px', fontWeight: 600 }}>
        ALL DEADLINES
      </div>
      {items.map(item => (
        <div key={item.key} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 10px',
          borderBottom: '1px solid var(--border)',
          background: item.status === 'critical' ? 'rgba(224,82,82,0.05)' : 'transparent',
          borderRadius: '4px', marginBottom: '2px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StatusDot status={item.status} size={7} />
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.label}</span>
            {item.isDone && <span style={{ fontSize: '10px', color: 'var(--accent-green)', background: 'rgba(76,175,130,0.1)', padding: '1px 5px', borderRadius: '3px' }}>DONE</span>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
              {formatShortDate(item.date)}
            </div>
            {item.days !== null && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: item.status === 'critical' ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                {item.days < 0 ? `${Math.abs(item.days)}d overdue` : item.days === 0 ? 'Today' : `${item.days}d`}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
