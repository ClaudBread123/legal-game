import MoneyDisplay from '../shared/MoneyDisplay.jsx'
import StatusDot from '../shared/StatusDot.jsx'

const TYPE_LABELS = {
  state_tort: 'State Tort',
  charter_school: 'Charter School',
  civil_rights: 'Civil Rights',
  employment: 'Employment',
}

export default function CaseBudgetPanel({ caseObject }) {
  const billed = caseObject.hoursBilled || 0
  const estimated = caseObject.estimatedHours || 40
  const amount = caseObject.amountBilled || 0
  const pct = Math.min(100, (billed / estimated) * 100)
  const health = pct < 60 ? 'active' : pct < 85 ? 'major' : 'critical'

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
          background: health === 'critical' ? 'var(--accent-red)' : health === 'major' ? 'var(--accent-yellow)' : 'var(--accent-gold)',
          borderRadius: '2px', transition: 'width 0.3s ease',
        }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
        <StatusDot status={health} size={7} />
        {health === 'critical' ? 'Budget critical' : health === 'major' ? 'Budget watch' : 'Budget healthy'}
      </div>
    </div>
  )
}
