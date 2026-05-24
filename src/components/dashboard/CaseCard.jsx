import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore.js'
import StatusDot from '../shared/StatusDot.jsx'
import MoneyDisplay from '../shared/MoneyDisplay.jsx'
import { daysBetween } from '../../utils/dateUtils.js'
import { calculateDeadlines } from '../../utils/deadlineEngine.js'

const TYPE_LABELS = {
  state_tort: 'State Tort',
  charter_school: 'Charter School',
  civil_rights: 'Civil Rights',
  employment: 'Employment',
}

const TYPE_COLORS = {
  state_tort: 'var(--accent-blue)',
  charter_school: 'var(--accent-yellow)',
  civil_rights: 'var(--accent-red)',
  employment: 'var(--accent-green)',
}

export default function CaseCard({ caseObject }) {
  const navigate = useNavigate()
  const { currentDate } = useGameStore()

  const deadlines = calculateDeadlines(caseObject)
  const deadlineValues = Object.values(deadlines).filter(Boolean)
  const futureDates = deadlineValues.filter(d => d > (currentDate || ''))
  const soonest = futureDates.sort()[0]
  const daysToSoonest = soonest && currentDate ? daysBetween(currentDate, soonest) : null

  let urgency = 'active'
  if (daysToSoonest !== null) {
    if (daysToSoonest < 0) urgency = 'critical'
    else if (daysToSoonest <= 14) urgency = 'critical'
    else if (daysToSoonest <= 30) urgency = 'major'
  }

  const preview = caseObject.factScenario?.slice(0, 100) + (caseObject.factScenario?.length > 100 ? '…' : '')
  const typeColor = TYPE_COLORS[caseObject.caseType] || 'var(--accent-blue)'

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      onClick={() => navigate(`/case/${caseObject.caseId}`)}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${urgency === 'critical' ? 'var(--accent-red)' : urgency === 'major' ? 'var(--accent-yellow)' : 'var(--accent-green)'}`,
        borderRadius: '8px',
        padding: '20px',
        cursor: 'pointer',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        marginBottom: '12px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
            {caseObject.caseId}
          </span>
          <span style={{
            fontSize: '10px', padding: '2px 7px', borderRadius: '4px',
            background: typeColor + '22', color: typeColor,
            fontFamily: 'var(--font-sans)', fontWeight: 500,
          }}>
            {TYPE_LABELS[caseObject.caseType] || caseObject.caseType}
          </span>
          {caseObject.hb145Applicable && (
            <span style={{
              fontSize: '10px', padding: '2px 7px', borderRadius: '4px',
              background: 'var(--accent-yellow)22', color: 'var(--accent-yellow)',
              fontFamily: 'var(--font-sans)', fontWeight: 500,
            }}>HB 145</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <StatusDot status={urgency} size={7} />
          {daysToSoonest !== null && (
            <span style={{ fontFamily: 'var(--font-mono)' }}>
              {daysToSoonest < 0 ? `${Math.abs(daysToSoonest)}d overdue` : `${daysToSoonest}d`}
            </span>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>
          {caseObject.defendant}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          {preview}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
            {(caseObject.hoursBilled || 0).toFixed(1)}h
          </span>
          <span style={{ margin: '0 4px' }}>/</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>
            {caseObject.estimatedHours || 40}h est.
          </span>
          <span style={{ marginLeft: '10px' }}>
            <MoneyDisplay amount={caseObject.amountBilled || 0} size="12px" />
          </span>
        </div>
        <span style={{ fontSize: '13px', color: 'var(--accent-blue)', fontFamily: 'var(--font-sans)' }}>
          View Case →
        </span>
      </div>

      {/* Case Health Bar */}
      {(() => {
        const health = caseObject.caseHealth ?? 100
        const hColor = health >= 80 ? '#4ade80' : health >= 50 ? 'var(--accent-yellow)' : 'var(--accent-red)'
        const activeCount = (caseObject.activeConsequences || []).length
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>CASE HEALTH</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {activeCount > 0 && (
                  <span style={{
                    fontSize: '10px', background: 'var(--accent-red)22', color: 'var(--accent-red)',
                    borderRadius: '4px', padding: '1px 5px', fontFamily: 'var(--font-mono)',
                  }}>
                    {activeCount} issue{activeCount > 1 ? 's' : ''}
                  </span>
                )}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: hColor }}>
                  {health}/100
                </span>
              </div>
            </div>
            <div style={{ height: '3px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${health}%`,
                background: hColor, borderRadius: '2px', transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        )
      })()}
    </motion.div>
  )
}
