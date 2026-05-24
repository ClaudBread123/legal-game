import MoneyDisplay from '../shared/MoneyDisplay.jsx'
import StatusDot from '../shared/StatusDot.jsx'
import { CONSEQUENCES } from '../../utils/consequencesEngine.js'
import LITIGATION_PHASES from '../../data/litigationActions.js'

function isPhaseUnlocked(phase, completedActions) {
  if (phase.id === 'phase_1') return true
  const unlocker = LITIGATION_PHASES.find(p => p.unlocksPhase === phase.id)
  if (!unlocker) return true
  return unlocker.unlockRequires.every(id => completedActions.includes(id))
}

const TYPE_LABELS = {
  state_tort: 'State Tort',
  charter_school: 'Charter School',
  civil_rights: 'Civil Rights',
  employment: 'Employment',
}

function healthColor(h) {
  if (h >= 80) return '#4ade80'
  if (h >= 50) return 'var(--accent-yellow)'
  return 'var(--accent-red)'
}

function healthLabel(h) {
  if (h >= 80) return 'Case Positioned Well'
  if (h >= 60) return 'Case Manageable'
  if (h >= 40) return 'Case Compromised'
  if (h >= 20) return 'Case Seriously Compromised'
  return 'Case in Jeopardy'
}

const PROB_COLORS = {
  strongWin: '#4ade80',
  settleDefense: 'var(--accent-blue)',
  settleNeutral: 'var(--accent-yellow)',
  loss: 'var(--accent-red)',
}

const PROB_LABELS = {
  strongWin: 'Strong Win',
  settleDefense: 'Favorable Settlement',
  settleNeutral: 'Neutral Settlement',
  loss: 'Loss',
}

export default function CaseBudgetPanel({ caseObject }) {
  const billed = caseObject.hoursBilled || 0
  const estimated = caseObject.estimatedHours || 40
  const amount = caseObject.amountBilled || 0
  const pct = Math.min(100, (billed / estimated) * 100)
  const budgetHealth = pct < 60 ? 'active' : pct < 85 ? 'major' : 'critical'

  const health = caseObject.caseHealth ?? 100
  const prob = caseObject.caseOutcomeProbability ?? { strongWin: 40, settleDefense: 30, settleNeutral: 20, loss: 10 }
  const activeConsequences = caseObject.activeConsequences || []
  const completedActions = caseObject.completedActions || []

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '8px', padding: '18px', marginBottom: '12px',
    }}>
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
          {caseObject.caseId}
        </div>
        <span style={{
          fontSize: '10px', padding: '2px 7px', borderRadius: '4px',
          background: 'var(--accent-blue)22', color: 'var(--accent-blue)',
        }}>
          {TYPE_LABELS[caseObject.caseType] || caseObject.caseType}
        </span>
      </div>

      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>
        {caseObject.defendant}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
        Plaintiff: {caseObject.clientName}
      </div>

      {/* Budget section */}
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '10px' }}>
        BUDGET
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-secondary)' }}>
          {billed.toFixed(1)} hrs billed
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
          / {estimated}h est.
        </span>
      </div>
      <MoneyDisplay amount={amount} size="18px" />
      <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden', margin: '10px 0' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: budgetHealth === 'critical' ? 'var(--accent-red)' : budgetHealth === 'major' ? 'var(--accent-yellow)' : 'var(--accent-gold)',
          borderRadius: '2px', transition: 'width 0.3s ease',
        }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
        <StatusDot status={budgetHealth} size={7} />
        {budgetHealth === 'critical' ? 'Budget critical' : budgetHealth === 'major' ? 'Budget watch' : 'Budget healthy'}
      </div>

      {/* Case Health section */}
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '10px' }}>
        CASE HEALTH
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '28px', fontWeight: 700, color: healthColor(health), lineHeight: 1 }}>
          {health}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-muted)' }}>/100</span>
      </div>
      <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden', marginBottom: '6px' }}>
        <div style={{
          height: '100%', width: `${health}%`,
          background: healthColor(health),
          borderRadius: '3px', transition: 'width 0.4s ease',
        }} />
      </div>
      <div style={{ fontSize: '11px', color: healthColor(health), marginBottom: '16px', fontFamily: 'var(--font-sans)' }}>
        {healthLabel(health)}
      </div>

      {/* Outcome Probability */}
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '8px' }}>
        OUTCOME PROBABILITY
      </div>
      <div style={{ height: '8px', borderRadius: '4px', overflow: 'hidden', display: 'flex', marginBottom: '8px' }}>
        {['strongWin', 'settleDefense', 'settleNeutral', 'loss'].map(k => (
          prob[k] > 0 && (
            <div key={k} style={{
              width: `${prob[k]}%`, height: '100%',
              background: PROB_COLORS[k],
            }} />
          )
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 6px', marginBottom: activeConsequences.length > 0 ? '16px' : '0' }}>
        {['strongWin', 'settleDefense', 'settleNeutral', 'loss'].map(k => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '2px', background: PROB_COLORS[k], flexShrink: 0 }} />
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1.2' }}>
              {PROB_LABELS[k]}: <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{prob[k]}%</span>
            </span>
          </div>
        ))}
      </div>

      {/* Active Consequences */}
      {activeConsequences.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--accent-red)', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: 600 }}>
            ACTIVE ISSUES
          </div>
          {activeConsequences.map(id => (
            <div key={id} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--accent-red)', fontSize: '8px', marginTop: '4px', flexShrink: 0 }}>●</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                {CONSEQUENCES[id]?.label || id}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Phase progress dots */}
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '8px' }}>
        PHASES
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
        {LITIGATION_PHASES.map(phase => {
          const unlocked = isPhaseUnlocked(phase, completedActions)
          const doneCount = phase.actions.filter(a => completedActions.includes(a.id)).length
          const allDone = doneCount === phase.actions.length
          return (
            <div key={phase.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
              <div title={phase.label} style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: allDone ? phase.color : unlocked ? `${phase.color}40` : 'transparent',
                border: `1.5px solid ${unlocked ? phase.color : 'var(--border)'}`,
                transition: 'all 0.3s ease',
              }} />
              <span style={{
                fontSize: '9px', fontFamily: 'var(--font-mono)',
                color: unlocked ? 'var(--text-muted)' : 'var(--border)',
              }}>
                {doneCount}/{phase.actions.length}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
