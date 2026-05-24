import { useGameStore } from '../../store/gameStore.js'
import { SALARY_TARGETS } from '../../data/careerLadder.js'

export default function PerformanceMeter() {
  const { monthlyBillableHours } = useGameStore()
  const { MIN_BILLABLE_HOURS_MONTHLY: min, MAX_BILLABLE_HOURS_MONTHLY: max, BILLING_RATE: rate } = SALARY_TARGETS
  const pct = Math.min(100, (monthlyBillableHours / max) * 100)
  const status = monthlyBillableHours >= min ? 'on-target' : 'below'

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '8px', padding: '16px', marginBottom: '16px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
          MONTHLY PERFORMANCE
        </div>
        <span style={{ fontSize: '11px', color: status === 'on-target' ? 'var(--accent-green)' : 'var(--accent-yellow)', fontFamily: 'var(--font-mono)' }}>
          {monthlyBillableHours.toFixed(1)}h / {min}–{max}h target
        </span>
      </div>
      <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: status === 'on-target' ? 'var(--accent-green)' : 'var(--accent-yellow)',
          borderRadius: '3px', transition: 'width 0.4s ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        <span>$0</span>
        <span>${(monthlyBillableHours * rate).toLocaleString()}</span>
      </div>
    </div>
  )
}
