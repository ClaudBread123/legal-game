import { useGameStore } from '../store/gameStore.js'
import { CAREER_LADDER } from '../data/careerLadder.js'
import { BILLING_RATE } from '../data/issueTypes.js'
import { getXPProgress, getNextTitle } from '../utils/scoring.js'
import XPBar from '../components/shared/XPBar.jsx'

export default function Career() {
  const { player, cases, monthlyBillableHours } = useGameStore()
  const { percentage, nextThreshold } = getXPProgress(player.xp)
  const next = getNextTitle(player.xp)
  const currentTier = CAREER_LADDER.find(t => t.title === player.title) || CAREER_LADDER[0]

  const totalHours = cases.reduce((s, c) => s + (c.hoursBilled || 0), 0)
  const totalBilled = totalHours * BILLING_RATE
  const totalCases = cases.length
  const totalCorrect = 0 // would need tracking
  const missedCritical = 0 // would need tracking

  return (
    <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', margin: '0 0 4px', color: 'var(--text-primary)' }}>
          {player.name}
        </h1>
        <div style={{ fontSize: '18px', color: 'var(--accent-gold)', fontFamily: 'var(--font-serif)', marginBottom: '24px' }}>
          {player.title}
        </div>

        {/* Large XP bar */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '14px', color: 'var(--text-secondary)' }}>
              {player.title}
            </span>
            {next && (
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '14px', color: 'var(--text-muted)' }}>
                {next.title}
              </span>
            )}
          </div>
          <div style={{ height: '10px', background: 'var(--border)', borderRadius: '5px', overflow: 'hidden', marginBottom: '8px' }}>
            <div style={{
              height: '100%', width: `${percentage}%`,
              background: 'var(--accent-gold)', borderRadius: '5px', transition: 'width 0.6s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)' }}>{player.xp} XP</span>
            {next && <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{nextThreshold} XP</span>}
            {!next && <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)' }}>MAX LEVEL</span>}
          </div>
        </div>
      </div>

      {/* Career ladder */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '16px', fontWeight: 600 }}>
          CAREER LADDER
        </div>
        {CAREER_LADDER.map((tier, i) => {
          const isCurrent = tier.title === player.title
          const isPast = player.xp >= tier.minXP
          return (
            <div key={tier.title} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px', borderRadius: '6px',
              background: isCurrent ? 'rgba(201,168,76,0.1)' : 'transparent',
              border: isCurrent ? '1px solid rgba(201,168,76,0.3)' : '1px solid transparent',
              marginBottom: '4px', opacity: isPast ? 1 : 0.5,
            }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: isPast ? tier.color : 'var(--border)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', color: isCurrent ? 'var(--accent-gold)' : 'var(--text-secondary)', fontFamily: 'var(--font-serif)', fontWeight: isCurrent ? 600 : 400 }}>
                  {tier.title} {isCurrent && '← Current'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {tier.minXP.toLocaleString()} XP minimum
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--accent-gold)' }}>
                ${tier.salary.toLocaleString()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px',
      }}>
        {[
          { label: 'Annual Salary', value: `$${currentTier.salary.toLocaleString()}`, mono: true, gold: true },
          { label: 'Total Cases', value: totalCases, mono: false },
          { label: 'Total Hours', value: `${totalHours.toFixed(1)}h`, mono: true },
          { label: 'Amount Billed', value: `$${totalBilled.toLocaleString()}`, mono: true, gold: true },
          { label: 'Issues Identified', value: totalCorrect, mono: false },
          { label: 'Critical Missed', value: missedCritical, mono: false, red: true },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '16px',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.05em' }}>
              {stat.label}
            </div>
            <div style={{
              fontFamily: stat.mono ? 'var(--font-mono)' : 'var(--font-serif)',
              fontSize: '20px',
              color: stat.red ? 'var(--accent-red)' : stat.gold ? 'var(--accent-gold)' : 'var(--text-primary)',
            }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Monthly performance */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '12px', fontWeight: 600 }}>
          MONTHLY PERFORMANCE
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Billable hours this month</span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            color: monthlyBillableHours >= 165 ? 'var(--accent-green)' : 'var(--accent-yellow)',
          }}>
            {monthlyBillableHours.toFixed(1)}h / 165–200h target
          </span>
        </div>
        <div style={{ height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, (monthlyBillableHours / 200) * 100)}%`,
            background: monthlyBillableHours >= 165 ? 'var(--accent-green)' : 'var(--accent-yellow)',
            borderRadius: '4px', transition: 'width 0.4s ease',
          }} />
        </div>
        <div style={{ marginTop: '8px', fontSize: '12px', color: monthlyBillableHours >= 165 ? 'var(--accent-green)' : 'var(--accent-yellow)' }}>
          {monthlyBillableHours >= 165 ? '✓ On target' : `${(165 - monthlyBillableHours).toFixed(1)}h below minimum target`}
        </div>
      </div>
    </div>
  )
}
