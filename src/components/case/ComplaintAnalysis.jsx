import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore.js'
import { ISSUE_TYPES } from '../../data/issueTypes.js'
import { evaluateIssueAnalysis } from '../../api/evaluateIssues.js'

export default function ComplaintAnalysis({ caseObject }) {
  const { player, addXP, logActivity, addMPMessage, addNotification } = useGameStore()
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [tooltip, setTooltip] = useState(null)

  const toggle = id => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const submit = async () => {
    if (selected.length === 0 || loading) return
    setLoading(true)
    try {
      const eval_ = await evaluateIssueAnalysis({
        caseObject, selectedIssueIds: selected, playerLevel: player.level,
      })
      setResult(eval_)
      if (eval_.totalXP > 0) {
        addXP(eval_.totalXP, `Issue analysis on ${caseObject.caseId}`)
      }
      logActivity(`Completed issue analysis for ${caseObject.caseId}`, 'action')
      if (eval_.requiresMPReview) {
        addNotification(
          `Managing Partner review required on ${caseObject.caseId} — critical issues were missed.`,
          'warning', caseObject.caseId
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Fact Scenario */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
          FACT SCENARIO
        </div>
        <div style={{
          background: 'var(--bg-secondary)', borderLeft: '3px solid var(--accent-blue)',
          padding: '16px', borderRadius: '0 6px 6px 0', fontSize: '15px',
          color: 'var(--text-secondary)', lineHeight: '1.7', fontFamily: 'var(--font-sans)',
        }}>
          {caseObject.factScenario}
        </div>
      </div>

      {/* Claims */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
          CLAIMS ASSERTED
        </div>
        <ol style={{ paddingLeft: '20px', margin: 0 }}>
          {(caseObject.claimsAsserted || []).map((c, i) => (
            <li key={i} style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.8', fontFamily: 'var(--font-sans)' }}>
              {c}
            </li>
          ))}
        </ol>
      </div>

      {/* Preview flag */}
      {caseObject.previewFlag && (
        <div style={{
          borderLeft: '3px solid var(--accent-yellow)', padding: '12px 16px',
          background: 'rgba(240,180,41,0.07)', borderRadius: '0 6px 6px 0',
          marginBottom: '24px',
        }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.1em', color: 'var(--accent-yellow)', marginBottom: '4px', fontWeight: 600 }}>
            INTAKE NOTICE
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.5' }}>
            {caseObject.previewFlag}
          </div>
        </div>
      )}

      {/* Issue checklist */}
      {!result && (
        <div>
          <div style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 600 }}>
            ISSUE IDENTIFICATION — Select all issues present in this complaint
          </div>
          <div style={{ marginBottom: '20px' }}>
            {ISSUE_TYPES.map(issue => (
              <div
                key={issue.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '10px', borderRadius: '6px', cursor: 'pointer',
                  background: selected.includes(issue.id) ? 'rgba(201,168,76,0.1)' : 'transparent',
                  border: `1px solid ${selected.includes(issue.id) ? 'var(--accent-gold)' : 'transparent'}`,
                  marginBottom: '4px', transition: 'all 150ms ease',
                  position: 'relative',
                }}
                onClick={() => toggle(issue.id)}
              >
                <div style={{
                  width: '16px', height: '16px', borderRadius: '3px', flexShrink: 0, marginTop: '1px',
                  border: `2px solid ${selected.includes(issue.id) ? 'var(--accent-gold)' : 'var(--border)'}`,
                  background: selected.includes(issue.id) ? 'var(--accent-gold)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {selected.includes(issue.id) && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="#0f1117" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', marginBottom: '2px' }}>
                    {issue.label}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                    {issue.statute}
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setTooltip(tooltip === issue.id ? null : issue.id) }}
                  style={{
                    background: 'none', border: '1px solid var(--border)', borderRadius: '50%',
                    width: '18px', height: '18px', fontSize: '10px', color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  i
                </button>
                {tooltip === issue.id && (
                  <div style={{
                    position: 'absolute', right: '30px', top: '0', zIndex: 10, width: '280px',
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    borderRadius: '6px', padding: '12px', fontSize: '12px',
                    color: 'var(--text-secondary)', lineHeight: '1.5',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                  }}>
                    {issue.description}
                  </div>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={submit}
            disabled={selected.length === 0 || loading}
            style={{
              width: '100%', height: '48px',
              background: selected.length > 0 ? 'var(--accent-gold)' : 'var(--border)',
              color: selected.length > 0 ? '#0f1117' : 'var(--text-muted)',
              border: 'none', borderRadius: '6px',
              fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 600,
              cursor: selected.length > 0 ? 'pointer' : 'not-allowed',
              transition: 'all 150ms ease',
            }}
          >
            {loading ? 'Analyzing…' : 'Submit Issue Analysis'}
          </button>
        </div>
      )}

      {/* Results memo */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '24px', marginTop: '16px',
            }}>
              <div style={{ textAlign: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', letterSpacing: '0.1em', color: 'var(--text-primary)' }}>
                  MEMORANDUM
                </div>
                <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', lineHeight: '1.8' }}>
                  <div>TO: {player.name}</div>
                  <div>FROM: Senior Partner Review</div>
                  <div>RE: Issue Analysis — {caseObject.caseId}</div>
                </div>
              </div>

              {result.correctlyIdentified?.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--accent-green)', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: 600 }}>
                    CORRECTLY IDENTIFIED ({result.correctlyIdentified.length})
                  </div>
                  {result.correctlyIdentified.map(item => (
                    <div key={item.issueId} style={{ padding: '8px', background: 'rgba(76,175,130,0.08)', borderRadius: '6px', marginBottom: '6px' }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{item.issueId}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>{item.feedback}</div>
                      <div style={{ fontSize: '11px', color: 'var(--accent-green)', marginTop: '3px', fontFamily: 'var(--font-mono)' }}>+{item.xpAwarded} XP</div>
                    </div>
                  ))}
                </div>
              )}

              {result.missed?.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--accent-red)', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: 600 }}>
                    MISSED ISSUES ({result.missed.length})
                  </div>
                  {result.missed.map(item => (
                    <div key={item.issueId} style={{ padding: '8px', background: 'rgba(224,82,82,0.08)', borderLeft: '3px solid var(--accent-red)', borderRadius: '0 6px 6px 0', marginBottom: '6px' }}>
                      <div style={{ fontSize: '13px', color: 'var(--accent-red)', fontWeight: 500 }}>{item.issueId}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', margin: '2px 0' }}>{item.statute}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>{item.description}</div>
                      <div style={{ fontSize: '12px', color: 'var(--accent-red)', marginTop: '3px', fontStyle: 'italic' }}>{item.consequence}</div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: '6px', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  {result.overallAssessment}
                </div>
              </div>

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={{ textAlign: 'center', padding: '12px', background: 'rgba(201,168,76,0.1)', borderRadius: '6px' }}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', color: 'var(--accent-gold)' }}>
                  +{result.totalXP} XP
                </div>
              </motion.div>

              {result.requiresMPReview && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ repeat: 3, duration: 0.6, delay: 0.5 }}
                  style={{
                    marginTop: '12px', padding: '10px', background: 'rgba(224,82,82,0.12)',
                    border: '1px solid var(--accent-red)', borderRadius: '6px',
                    textAlign: 'center', fontSize: '13px', color: 'var(--accent-red)', fontWeight: 600,
                  }}
                >
                  ⚠ Managing Partner Review Triggered — critical issues were missed
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
