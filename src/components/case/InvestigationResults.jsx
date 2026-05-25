import { useState } from 'react'
import { useGameStore } from '../../store/gameStore.js'
import { selectBackgroundFindings, selectSocialMediaFindings } from '../../data/backgroundCheckResults.js'

const TYPE_COLORS = {
  favorable: { border: '#4ade80', badge: '#4ade80', bg: 'rgba(74,222,128,0.06)' },
  neutral: { border: 'var(--accent-yellow)', badge: 'var(--accent-yellow)', bg: 'rgba(201,168,76,0.06)' },
  adverse: { border: 'var(--accent-red)', badge: 'var(--accent-red)', bg: 'rgba(239,68,68,0.06)' },
}

const TYPE_LABELS = {
  favorable: 'FAVORABLE',
  neutral: 'NEUTRAL',
  adverse: 'ADVERSE',
}

export default function InvestigationResults({ type, caseObject, action, onComplete, onClose }) {
  const { updateCase, completeAction, billTime, spendAction, addXP, logActivity } = useGameStore()

  const [findings] = useState(() =>
    type === 'background' ? selectBackgroundFindings() : selectSocialMediaFindings()
  )

  const netHealthDelta = findings.reduce((sum, f) => sum + f.healthImpact, 0)

  function handleApply() {
    const currentHealth = caseObject.caseHealth ?? 100
    const newHealth = Math.max(0, Math.min(100, currentHealth + netHealthDelta))

    const existingFindings = caseObject.investigationFindings || {}
    updateCase(caseObject.caseId, {
      caseHealth: newHealth,
      investigationFindings: {
        ...existingFindings,
        [type]: findings.map(f => f.id),
      },
      caseHealthEvents: [
        ...(caseObject.caseHealthEvents || []),
        {
          date: new Date().toISOString().split('T')[0],
          event: type === 'background' ? 'Background Investigation' : 'Social Media Search',
          impact: netHealthDelta,
          description: `${findings.length} findings. Net health impact: ${netHealthDelta > 0 ? '+' : ''}${netHealthDelta}`,
          type: netHealthDelta >= 0 ? 'positive' : 'consequence',
        },
      ],
    })

    completeAction(caseObject.caseId, action.id)
    billTime(caseObject.caseId, action.hours, action.label)
    spendAction(action.dailyActionCost)
    addXP(action.xpReward, `${action.label} on ${caseObject.caseId}`)
    logActivity(`${action.label}: ${findings.length} findings, net health ${netHealthDelta > 0 ? '+' : ''}${netHealthDelta} (${caseObject.caseId})`, 'action')

    onClose()
  }

  const recommendedActions = findings.filter(f => f.note).map(f => f.note)

  return (
    <div>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
        {type === 'background'
          ? 'Background investigation complete. Review findings and strategic implications before proceeding.'
          : 'Social media and internet search complete. Review findings and strategic implications before proceeding.'}
      </div>

      {/* Finding cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
        {findings.map(finding => {
          const colors = TYPE_COLORS[finding.type]
          return (
            <div key={finding.id} style={{
              borderLeft: `3px solid ${colors.border}`,
              background: colors.bg,
              borderRadius: '0 6px 6px 0',
              padding: '12px 14px',
              border: `1px solid ${colors.border}22`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <span style={{ fontSize: '9px', letterSpacing: '0.1em', color: colors.badge, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  {TYPE_LABELS[finding.type]}
                </span>
                {finding.healthImpact !== 0 && (
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '10px',
                    color: finding.healthImpact > 0 ? '#4ade80' : 'var(--accent-red)',
                  }}>
                    {finding.healthImpact > 0 ? '+' : ''}{finding.healthImpact} health
                  </span>
                )}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.5', marginBottom: finding.note ? '10px' : '0' }}>
                {finding.finding}
              </div>
              {finding.note && (
                <div style={{
                  borderTop: `1px solid ${colors.border}33`,
                  paddingTop: '8px',
                }}>
                  <div style={{ fontSize: '9px', color: 'var(--accent-gold)', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', marginBottom: '3px' }}>
                    STRATEGIC NOTE
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.5' }}>
                    {finding.note}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Summary bar */}
      <div style={{
        padding: '12px 14px',
        background: netHealthDelta > 0 ? 'rgba(74,222,128,0.06)' : netHealthDelta < 0 ? 'rgba(239,68,68,0.06)' : 'var(--bg-card)',
        border: `1px solid ${netHealthDelta > 0 ? 'rgba(74,222,128,0.3)' : netHealthDelta < 0 ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
        borderRadius: '6px',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Net case health impact:</span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700,
            color: netHealthDelta > 0 ? '#4ade80' : netHealthDelta < 0 ? 'var(--accent-red)' : 'var(--text-muted)',
          }}>
            {netHealthDelta > 0 ? '+' : ''}{netHealthDelta}
          </span>
        </div>
      </div>

      <button
        onClick={handleApply}
        style={{
          width: '100%', height: '44px',
          background: 'var(--accent-gold)', color: '#0f1117',
          border: 'none', borderRadius: '6px',
          fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 600, cursor: 'pointer',
        }}
      >
        Apply Findings & Continue
      </button>
      <div style={{ marginTop: '8px', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
        {action.hours}h · {action.dailyActionCost} action · +{action.xpReward} XP
      </div>
    </div>
  )
}
