import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore.js'
import { ISSUE_TYPES } from '../../data/issueTypes.js'
import { evaluateIssueAnalysis } from '../../api/evaluateIssues.js'
import { getMPReview } from '../../api/managingPartner.js'
import Modal from '../shared/Modal.jsx'
import ComplaintModal from './ComplaintModal.jsx'

function getIssueRelevance(issueId, caseObject) {
  const facts = (caseObject.factScenario || '').toLowerCase()
  const claims = (caseObject.claimsAsserted || []).join(' ').toLowerCase()
  const caseType = caseObject.caseType || ''

  const relevanceMap = {
    barred_individual_defendant: () => {
      const hasIndividual = facts.includes('officer') || facts.includes('employee') || facts.includes('agent') || facts.includes('deputy') || facts.includes('detective') || claims.includes('individual')
      return hasIndividual ? { hint: `Individual employee or officer named — §768.28(9) analysis required`, relevant: true } : null
    },
    insufficient_presuit_notice: () => {
      return { hint: `Pre-suit notice under §768.28(6) is required on every governmental tort claim`, relevant: true }
    },
    federal_removal_1983: () => {
      const has1983 = caseType === 'section_1983' || claims.includes('1983') || claims.includes('civil rights') || facts.includes('constitutional')
      return has1983 ? { hint: `§1983 claim detected — 30-day removal window to federal court`, relevant: true } : null
    },
    sovereign_immunity_bar: () => {
      const hasDiscretionary = facts.includes('polic') || facts.includes('decision') || facts.includes('plan') || facts.includes('allocat') || facts.includes('budget')
      return hasDiscretionary ? { hint: `Potential discretionary function — §768.28 immunity may bar this claim`, relevant: true } : null
    },
    statute_of_limitations: () => {
      return { hint: `Check accrual date — §768.28(14) 2-year limitations period runs from injury`, relevant: true }
    },
    hb145_cap_applicability: () => {
      const incidentDate = caseObject.dateOfIncident || ''
      const isPostHB145 = incidentDate >= '2026-10-01'
      return isPostHB145
        ? { hint: `Incident on/after Oct 1, 2026 — HB 145 caps ($350k/$500k) apply`, relevant: true }
        : { hint: `Pre-Oct 2026 incident — old §768.28(5) caps ($200k/$300k) apply`, relevant: false }
    },
    wrong_venue: () => {
      const defendant = (caseObject.defendant || '').toLowerCase()
      return { hint: `Verify filing county — §768.28(1) requires venue where claim accrued`, relevant: true }
    },
    admin_exhaustion: () => {
      const isEmployment = caseType === 'employment' || claims.includes('discriminat') || claims.includes('retaliat') || claims.includes('fchr')
      return isEmployment ? { hint: `Employment claims require FCHR/EEOC exhaustion before circuit court`, relevant: true } : null
    },
    duplicative_counts: () => {
      const countCount = (caseObject.claimsAsserted || []).length
      return countCount >= 3 ? { hint: `${countCount} counts asserted — check for duplicative theories under Fla. R. Civ. P. 1.110`, relevant: true } : null
    },
  }

  const fn = relevanceMap[issueId]
  return fn ? fn() : null
}

function getMissedIssueConsequence(issueId, caseObject) {
  const defendant = caseObject.defendant || 'the governmental entity'
  const plaintiff = caseObject.clientName || 'plaintiff'
  const consequences = {
    barred_individual_defendant: `Without a §768.28(9) motion, the individual defendant remains in this case, creating personal exposure and complicating the immunity defense for ${defendant}.`,
    insufficient_presuit_notice: `If pre-suit notice was defective, ${plaintiff}'s claim against ${defendant} may be subject to dismissal — a ground that could have ended this case at the pleading stage.`,
    federal_removal_1983: `The 30-day removal window to federal court has now passed. ${defendant} is committed to state court, losing access to qualified immunity arguments, Eleventh Amendment protections, and the federal procedural environment.`,
    sovereign_immunity_bar: `Discretionary function immunity for ${defendant} was not raised at threshold. This defense becomes harder to assert as costs mount and discovery proceeds.`,
    statute_of_limitations: `If ${plaintiff}'s claim against ${defendant} is time-barred, proceeding without raising this defense wastes client resources and may constitute malpractice if the limitations period has run.`,
    hb145_cap_applicability: `Incorrect cap analysis affects the entire valuation of ${defendant}'s exposure — settlement authority, reserve setting, and case strategy all depend on applying the correct statutory cap.`,
    wrong_venue: `A venue defect, if not raised promptly, is waived. ${defendant} may be litigating in an unfavorable county when transfer was available.`,
    admin_exhaustion: `If ${plaintiff} failed to exhaust administrative remedies, the circuit court lacks jurisdiction. This threshold defect, if real, could end the case before any merits argument.`,
    duplicative_counts: `Redundant counts multiply the cost of defense for ${defendant} and give ${plaintiff}'s counsel additional angles at trial. Early dismissal of duplicative theories is cost-effective.`,
  }
  return consequences[issueId] || null
}

function useCountUp(target, duration = 1500) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!target) return
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      // ease-out
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return value
}

function XPCountUp({ total }) {
  const displayed = useCountUp(total)
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
      style={{
        textAlign: 'center', padding: '16px',
        background: 'rgba(201,168,76,0.1)', borderRadius: '6px', marginBottom: '12px',
      }}
    >
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '4px' }}>
        TOTAL XP EARNED
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '32px', color: 'var(--accent-gold)', fontWeight: 700 }}>
        +{displayed}
      </div>
    </motion.div>
  )
}

export default function ComplaintAnalysis({ caseObject }) {
  const { player, currentDate, addXP, logActivity, addMPMessage, addNotification, updateCase } = useGameStore()
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(caseObject.issueAnalysisResults ?? null)
  const [tooltip, setTooltip] = useState(null)
  const [mpModal, setMpModal] = useState(null)
  const [mpLoading, setMpLoading] = useState(false)
  const [complaintOpen, setComplaintOpen] = useState(false)

  const alreadySubmitted = caseObject.issueAnalysisSubmitted === true

  const toggle = id => {
    if (alreadySubmitted) return
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const submit = async () => {
    if (selected.length === 0 || loading || alreadySubmitted) return
    setLoading(true)
    try {
      const eval_ = await evaluateIssueAnalysis({
        caseObject, selectedIssueIds: selected, playerLevel: player.level,
      })
      setResult(eval_)
      // Lock permanently
      updateCase(caseObject.caseId, {
        issueAnalysisSubmitted: true,
        issueAnalysisResults: eval_,
        issueAnalysisDate: currentDate,
      })
      if (eval_.totalXP > 0) {
        addXP(eval_.totalXP, `Issue analysis — ${caseObject.caseId}`)
      }
      logActivity(`Issue analysis completed for ${caseObject.caseId}`, 'action')
      if (eval_.requiresMPReview) {
        addNotification(
          `MP review required on ${caseObject.caseId} — critical issues were missed.`,
          'warning', caseObject.caseId
        )
        addMPMessage(caseObject.caseId, `[Pending review — critical issues missed on intake analysis]`)
      }
    } finally {
      setLoading(false)
    }
  }

  const requestMPMemo = async () => {
    if (mpLoading) return
    setMpLoading(true)
    try {
      const content = await getMPReview({
        caseObject,
        issueEvaluation: result,
        completedActions: caseObject.completedActions || [],
        playerName: player.name,
      })
      setMpModal(content)
      addMPMessage(caseObject.caseId, content)
    } finally {
      setMpLoading(false)
    }
  }

  const ISSUE_LABEL_MAP = Object.fromEntries(ISSUE_TYPES.map(i => [i.id, i.label]))
  const STATUTE_MAP = Object.fromEntries(ISSUE_TYPES.map(i => [i.id, i.statute]))

  return (
    <div>
      {/* Complaint Document */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text-muted)', fontWeight: 600 }}>
            COMPLAINT — FOR REVIEW
          </div>
          {caseObject.complaintDocument && (
            <button
              onClick={() => setComplaintOpen(true)}
              style={{
                background: 'transparent', border: '1px solid var(--accent-blue)',
                color: 'var(--accent-blue)', padding: '3px 12px', borderRadius: '4px',
                fontSize: '11px', cursor: 'pointer', fontFamily: 'var(--font-sans)',
              }}
            >
              View Full Complaint →
            </button>
          )}
        </div>
        {caseObject.complaintDocument ? (
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '0 4px 4px 0',
            padding: '16px 20px',
            maxHeight: '300px',
            overflowY: 'auto',
            border: '1px solid var(--border)',
            borderLeft: '3px solid var(--accent-blue)',
          }}>
            <pre style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              lineHeight: '1.75',
              color: 'var(--text-secondary)',
              whiteSpace: 'pre-wrap',
              margin: 0,
            }}>
              {caseObject.complaintDocument.substring(0, 800)}{caseObject.complaintDocument.length > 800 ? '\n\n[…click "View Full Complaint" to read more]' : ''}
            </pre>
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '48px 40px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '13px',
            fontStyle: 'italic',
          }}>
            Preparing complaint document...
          </div>
        )}
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '8px' }}>
          Review this complaint carefully before proceeding to issue identification.
        </div>
      </div>

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

      {/* Already submitted — read-only banner */}
      {alreadySubmitted && !result && (
        <div style={{
          padding: '12px 16px', marginBottom: '20px',
          background: 'rgba(201,168,76,0.08)', border: '1px solid var(--accent-gold)',
          borderRadius: '6px', fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic',
        }}>
          Issue analysis was submitted on {caseObject.issueAnalysisDate}. Loading results...
        </div>
      )}

      {/* Issue checklist */}
      {!alreadySubmitted && !result && (
        <div>
          <div style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 600 }}>
            ISSUE IDENTIFICATION — Select all issues present in this complaint
          </div>
          <div style={{ marginBottom: '20px' }}>
            {ISSUE_TYPES.map(issue => {
              const relevance = getIssueRelevance(issue.id, caseObject)
              return (
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
                  transition: 'all 150ms ease',
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
                  {relevance && (
                    <div style={{
                      fontSize: '11px', marginTop: '3px', fontStyle: 'italic',
                      color: relevance.relevant ? 'rgba(76,175,130,0.85)' : 'var(--text-muted)',
                    }}>
                      {relevance.hint}
                    </div>
                  )}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setTooltip(tooltip === issue.id ? null : issue.id) }}
                  style={{
                    background: 'none', border: '1px solid var(--border)', borderRadius: '50%',
                    width: '18px', height: '18px', fontSize: '10px', color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    marginTop: '2px', cursor: 'pointer',
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
            )
          })}
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
              {/* Memo header */}
              <div style={{
                textAlign: 'center', marginBottom: '20px', paddingBottom: '16px',
                borderBottom: '1px solid var(--border)',
              }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', letterSpacing: '0.15em', color: 'var(--text-primary)' }}>
                  MEMORANDUM
                </div>
                <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', lineHeight: '1.9', textAlign: 'left', display: 'inline-block' }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>TO:</span> {player.name}, {player.title}</div>
                  <div><span style={{ color: 'var(--text-muted)' }}>FROM:</span> Case Analysis System</div>
                  <div><span style={{ color: 'var(--text-muted)' }}>RE:</span> Issue Analysis — {caseObject.caseId}</div>
                  {currentDate && <div><span style={{ color: 'var(--text-muted)' }}>DATE:</span> {currentDate}</div>}
                </div>
              </div>

              {/* ✓ Correctly identified */}
              {result.correctlyIdentified?.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--accent-green)', letterSpacing: '0.1em', marginBottom: '10px', fontWeight: 600 }}>
                    ✓ ISSUES CORRECTLY IDENTIFIED ({result.correctlyIdentified.length})
                  </div>
                  {result.correctlyIdentified.map(item => (
                    <div key={item.issueId} style={{
                      padding: '10px 12px', background: 'rgba(76,175,130,0.08)',
                      borderLeft: '3px solid var(--accent-green)', borderRadius: '0 6px 6px 0',
                      marginBottom: '8px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>
                          {ISSUE_LABEL_MAP[item.issueId] || item.issueId}
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent-green)', flexShrink: 0, marginLeft: '12px' }}>
                          +{item.xpAwarded} XP
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                        {STATUTE_MAP[item.issueId]}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                        {item.feedback}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ✗ Missed */}
              {result.missed?.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--accent-red)', letterSpacing: '0.1em', marginBottom: '10px', fontWeight: 600 }}>
                    ✗ ISSUES MISSED ({result.missed.length})
                  </div>
                  {result.missed.map(item => (
                    <div key={item.issueId} style={{
                      padding: '10px 12px', background: 'rgba(224,82,82,0.07)',
                      borderLeft: '3px solid var(--accent-red)', borderRadius: '0 6px 6px 0',
                      marginBottom: '8px',
                    }}>
                      <div style={{ fontSize: '13px', color: 'var(--accent-red)', fontWeight: 600, marginBottom: '3px' }}>
                        {ISSUE_LABEL_MAP[item.issueId] || item.issueId}
                        <span style={{
                          marginLeft: '8px', fontSize: '10px', background: 'var(--accent-red)',
                          color: '#fff', borderRadius: '3px', padding: '1px 5px', verticalAlign: 'middle',
                        }}>
                          {item.severity?.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>
                        {item.statute || STATUTE_MAP[item.issueId]}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '6px' }}>
                        {item.description}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--accent-red)', fontStyle: 'italic', lineHeight: '1.5' }}>
                        {getMissedIssueConsequence(item.issueId, caseObject) || item.consequence}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ⚠ Incorrectly flagged */}
              {result.incorrectlyFlagged?.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--accent-yellow)', letterSpacing: '0.1em', marginBottom: '10px', fontWeight: 600 }}>
                    ⚠ INCORRECTLY FLAGGED ({result.incorrectlyFlagged.length}) — −{result.incorrectlyFlagged.length * 5} XP
                  </div>
                  {result.incorrectlyFlagged.map(item => (
                    <div key={item.issueId} style={{
                      padding: '8px 12px', background: 'rgba(240,180,41,0.07)',
                      borderLeft: '3px solid var(--accent-yellow)', borderRadius: '0 6px 6px 0',
                      marginBottom: '6px',
                    }}>
                      <div style={{ fontSize: '13px', color: 'var(--accent-yellow)', marginBottom: '3px' }}>
                        {ISSUE_LABEL_MAP[item.issueId] || item.issueId}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.reason}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Legally nuanced flags — no penalty, educational note */}
              {result.legallyNuanced?.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--accent-blue)', letterSpacing: '0.1em', marginBottom: '10px', fontWeight: 600 }}>
                    ◆ LEGALLY NUANCED FLAGS ({result.legallyNuanced.length}) — No Penalty
                  </div>
                  {result.legallyNuanced.map(item => (
                    <div key={item.issueId} style={{
                      padding: '8px 12px', background: 'rgba(74,158,255,0.07)',
                      borderLeft: '3px solid var(--accent-blue)', borderRadius: '0 6px 6px 0',
                      marginBottom: '6px',
                    }}>
                      <div style={{ fontSize: '13px', color: 'var(--accent-blue)', marginBottom: '3px' }}>
                        {ISSUE_LABEL_MAP[item.issueId] || item.issueId}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{item.reason}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Penalty breakdown */}
              {result.penaltyBreakdown && (
                <div style={{
                  padding: '12px', background: 'rgba(239,68,68,0.06)',
                  border: '1px solid var(--accent-red)44', borderRadius: '6px', marginBottom: '16px',
                }}>
                  <div style={{ fontSize: '10px', color: 'var(--accent-red)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '8px' }}>
                    XP CALCULATION
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
                    <div>Issues identified: <span style={{ color: 'var(--accent-green)' }}>+{result.penaltyBreakdown.gained} XP</span></div>
                    {result.penaltyBreakdown.deducted > 0 && (
                      <div>Incorrect flags: <span style={{ color: 'var(--accent-red)' }}>−{result.penaltyBreakdown.deducted - (result.penaltyBreakdown.sprayPenalty || 0)} XP</span></div>
                    )}
                    {result.penaltyBreakdown.sprayPenalty > 0 && (
                      <div>Spray-and-pray penalty: <span style={{ color: 'var(--accent-red)' }}>−{result.penaltyBreakdown.sprayPenalty} XP</span></div>
                    )}
                    <div style={{ borderTop: '1px solid var(--border)', marginTop: '4px', paddingTop: '4px' }}>
                      Total earned: <span style={{ color: result.penaltyBreakdown.totalXP > 0 ? 'var(--accent-gold)' : 'var(--accent-red)' }}>
                        {result.penaltyBreakdown.totalXP} XP
                      </span>
                      {result.penaltyBreakdown.rawXP < 0 && <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>(floored at 0)</span>}
                    </div>
                  </div>
                  {result.penaltyBreakdown.oniersNote && (
                    <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--accent-red)', fontStyle: 'italic' }}>
                      {result.penaltyBreakdown.oniersNote}
                    </div>
                  )}
                </div>
              )}

              {/* Assessment */}
              <div style={{
                padding: '12px', background: 'var(--bg-card)', borderRadius: '6px',
                marginBottom: '16px',
              }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  {result.overallAssessment}
                </div>
              </div>

              {/* Submitted notice */}
              {alreadySubmitted && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '12px', textAlign: 'center' }}>
                  Issue analysis is a one-time assessment. Request a Case Review with Onier Llopiz to discuss further.
                </div>
              )}

              {/* XP count-up */}
              <XPCountUp total={result.totalXP} />

              {/* MP review trigger */}
              {result.requiresMPReview && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  style={{
                    padding: '14px 16px', background: 'rgba(224,82,82,0.1)',
                    border: '1px solid var(--accent-red)', borderRadius: '6px',
                  }}
                >
                  <motion.div
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ repeat: 3, duration: 0.8, delay: 0.6 }}
                    style={{ fontSize: '13px', color: 'var(--accent-red)', fontWeight: 700, marginBottom: '4px' }}
                  >
                    ⚠ MANAGING PARTNER REVIEW TRIGGERED
                  </motion.div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    Onier Llopiz has flagged this case for immediate review. Critical issues were missed on intake.
                  </div>
                  <button
                    onClick={requestMPMemo}
                    disabled={mpLoading}
                    style={{
                      background: 'var(--accent-red)', color: '#fff', border: 'none',
                      borderRadius: '6px', padding: '8px 16px', fontSize: '13px',
                      fontFamily: 'var(--font-serif)', fontWeight: 600,
                      cursor: mpLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {mpLoading ? 'Loading…' : 'Read Managing Partner Memo'}
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ComplaintModal
        isOpen={complaintOpen}
        onClose={() => setComplaintOpen(false)}
        caseObject={caseObject}
      />

      {/* MP Modal */}
      <Modal isOpen={!!mpModal} onClose={() => setMpModal(null)} title="CASE REVIEW" wide>
        {mpModal && (
          <div>
            <div style={{ marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {currentDate}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--accent-gold)', fontFamily: 'var(--font-serif)', marginTop: '4px' }}>
                Onier Llopiz, Managing Partner
              </div>
              <div style={{ width: '40px', height: '2px', background: 'var(--accent-gold)', marginTop: '12px' }} />
            </div>
            <div style={{
              fontFamily: 'var(--font-serif)', fontSize: '14px', color: 'var(--text-secondary)',
              lineHeight: '1.9', whiteSpace: 'pre-wrap',
            }}>
              {mpModal}
            </div>
            <div style={{
              marginTop: '20px', paddingTop: '14px', borderTop: '1px solid var(--border)',
              fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic',
            }}>
              This review has been logged to your file.
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
