import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore.js'
import { CAREER_LADDER } from '../data/careerLadder.js'
import { BILLING_RATE } from '../data/issueTypes.js'
import { getPromotionProgress, getXPProgress } from '../utils/scoring.js'

export default function Career() {
  const { player, cases, monthlyBillableHours } = useGameStore()
  const currentTier = CAREER_LADDER.find(t => t.title === player.title) || CAREER_LADDER[0]
  const progress = getPromotionProgress(player)
  const xpProgress = getXPProgress(player.xp || 0)

  const totalHours = cases.reduce((s, c) => s + (c.hoursBilled || 0), 0)
  const totalBilled = totalHours * BILLING_RATE

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', margin: '0 0 4px', color: 'var(--text-primary)' }}>
          {player.name}
        </h1>
        <div style={{ fontSize: '18px', color: 'var(--accent-gold)', fontFamily: 'var(--font-serif)', marginBottom: '4px' }}>
          {player.title}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '12px' }}>
          {player.xp.toLocaleString()} XP · Day {player.totalGameDays || 0} · {player.casesWorked || 0} cases worked · {Math.round((player.totalBillableHours || 0) * 10) / 10}h billed
        </div>

        {/* XP progress bar within current tier */}
        {xpProgress.nextThreshold && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              <span>XP: {xpProgress.current.toLocaleString()}</span>
              <span>{xpProgress.percentage}% to next tier</span>
              <span>Next: {xpProgress.nextThreshold.toLocaleString()}</span>
            </div>
            <div style={{ height: '5px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${xpProgress.percentage}%`,
                background: xpProgress.percentage >= 75 ? '#4ade80' : xpProgress.percentage >= 40 ? 'var(--accent-gold)' : 'var(--text-muted)',
                borderRadius: '3px', transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        )}

        {/* PATH TO PROMOTION */}
        {progress ? (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '20px', marginBottom: '24px',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '4px', fontWeight: 600 }}>
              PATH TO PROMOTION
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: progress.nextColor || 'var(--accent-gold)', marginBottom: '18px' }}>
              {progress.nextTitle}
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginLeft: '10px' }}>
                ${(progress.nextSalary || 0).toLocaleString()}/yr
              </span>
            </div>

            {progress.requirements.map(req => {
              const pct = Math.min(100, req.required > 0 ? Math.round((req.current / req.required) * 100) : 100)
              const color = req.met ? '#4ade80' : pct >= 80 ? 'var(--accent-gold)' : 'var(--text-muted)'
              return (
                <div key={req.label} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', color: req.met ? '#4ade80' : 'var(--text-secondary)' }}>
                        {req.met ? '✓' : '○'}
                      </span>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>
                        {req.label}
                      </span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color }}>
                      {typeof req.current === 'number' && req.current % 1 !== 0
                        ? req.current.toFixed(1)
                        : req.current.toLocaleString()} / {req.required.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ height: '5px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`,
                      background: color,
                      borderRadius: '3px', transition: 'width 0.4s ease',
                    }} />
                  </div>
                </div>
              )
            })}

            {(() => {
              const dayReq = progress.requirements.find(r => r.label === 'Days in Practice')
              if (dayReq && !dayReq.met) {
                const daysLeft = dayReq.required - dayReq.current
                return (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', fontStyle: 'italic' }}>
                    ~{daysLeft} more days of practice required
                  </div>
                )
              }
              const unmetCount = progress.requirements.filter(r => !r.met).length
              if (unmetCount === 0) {
                return (
                  <div style={{ fontSize: '12px', color: '#4ade80', marginTop: '8px', fontWeight: 600 }}>
                    All requirements met — promotion will trigger on next XP award or day advance.
                  </div>
                )
              }
              return null
            })()}
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--accent-gold)44',
            borderRadius: '8px', padding: '20px', marginBottom: '24px', textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--accent-gold)', marginBottom: '8px' }}>
              Equity Shareholder
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Maximum rank achieved.</div>
          </div>
        )}
      </div>

      {/* Career ladder */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '16px', fontWeight: 600 }}>
          CAREER LADDER
        </div>
        {CAREER_LADDER.map(tier => {
          const isCurrent = tier.title === player.title
          const isUnlocked = player.xp >= tier.minXP
          return (
            <div key={tier.title} style={{
              padding: '12px 14px', borderRadius: '6px',
              background: isCurrent ? 'rgba(201,168,76,0.08)' : 'transparent',
              borderLeft: isCurrent
                ? '3px solid var(--accent-gold)'
                : `3px solid ${isUnlocked ? tier.color + '55' : 'var(--border)'}`,
              marginBottom: '4px',
              opacity: isUnlocked ? 1 : 0.45,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: isUnlocked ? tier.color : 'var(--border)', flexShrink: 0 }} />
                  <span style={{ fontSize: '14px', color: isCurrent ? 'var(--accent-gold)' : 'var(--text-secondary)', fontFamily: 'var(--font-serif)', fontWeight: isCurrent ? 600 : 400 }}>
                    {tier.title} {isCurrent && '← Current'}
                  </span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--accent-gold)', flexShrink: 0 }}>
                  ${tier.salary.toLocaleString()}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', paddingLeft: '18px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
                  {tier.minXP.toLocaleString()} XP
                </span>
                {tier.minGameDays > 0 && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
                    {tier.minGameDays}d practice
                  </span>
                )}
                {tier.minCasesWorked > 0 && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
                    {tier.minCasesWorked} cases
                  </span>
                )}
                {tier.minBillableHours > 0 && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
                    {tier.minBillableHours.toLocaleString()}h billed
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Annual Salary', value: `$${currentTier.salary.toLocaleString()}`, mono: true, gold: true },
          { label: 'Active Cases', value: cases.length, mono: false },
          { label: 'Total Hours', value: `${totalHours.toFixed(1)}h`, mono: true },
          { label: 'Amount Billed', value: `$${totalBilled.toLocaleString()}`, mono: true, gold: true },
          { label: 'Cases Worked', value: player.casesWorked || 0, mono: false },
          { label: 'Days in Practice', value: player.totalGameDays || 0, mono: true },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.05em' }}>
              {stat.label}
            </div>
            <div style={{ fontFamily: stat.mono ? 'var(--font-mono)' : 'var(--font-serif)', fontSize: '20px', color: stat.gold ? 'var(--accent-gold)' : 'var(--text-primary)' }}>
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
          <span style={{ fontFamily: 'var(--font-mono)', color: monthlyBillableHours >= 165 ? '#4ade80' : 'var(--accent-yellow)' }}>
            {monthlyBillableHours.toFixed(1)}h / 165–200h target
          </span>
        </div>
        <div style={{ height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${Math.min(100, (monthlyBillableHours / 200) * 100)}%`,
            background: monthlyBillableHours >= 165 ? '#4ade80' : 'var(--accent-yellow)',
            borderRadius: '4px', transition: 'width 0.4s ease',
          }} />
        </div>
        <div style={{ marginTop: '8px', fontSize: '12px', color: monthlyBillableHours >= 165 ? '#4ade80' : 'var(--accent-yellow)' }}>
          {monthlyBillableHours >= 165 ? '✓ On target' : `${(165 - monthlyBillableHours).toFixed(1)}h below minimum target`}
        </div>
      </div>
    </motion.div>
  )
}
