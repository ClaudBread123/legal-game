import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore.js'
import EXPERT_TYPES, { getRecommendedExpertTypes } from '../../data/expertTypes.js'
import { LITIGATION_PHASES } from '../../data/litigationActions.js'

const EXPERT_ACTIONS = ['identify_expert', 'select_expert', 'retain_expert']

const phase4 = LITIGATION_PHASES.find(p => p.id === 'phase_4')
const identifyAction = phase4?.actions.find(a => a.id === 'identify_expert')
const selectAction = phase4?.actions.find(a => a.id === 'select_expert')
const retainAction = phase4?.actions.find(a => a.id === 'retain_expert')

function CredentialStars({ level }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3].map(i => (
        <span key={i} style={{
          fontSize: '11px',
          color: i <= level ? '#c9a84c' : 'var(--border)',
        }}>★</span>
      ))}
    </div>
  )
}

function MoneyFmt({ amount }) {
  return <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)' }}>${amount.toLocaleString()}</span>
}

export default function ExpertPanel({ caseObject }) {
  const {
    dailyActionsRemaining,
    completeAction, billTime, spendAction, addXP, logActivity,
    setExpertType, setExpertCandidate,
  } = useGameStore()

  const completed = caseObject.completedActions || []
  const step1Done = completed.includes('identify_expert')
  const step2Done = completed.includes('select_expert')
  const step3Done = completed.includes('retain_expert')

  const [localTypeId, setLocalTypeId] = useState(caseObject.selectedExpertType || null)
  const [localCandidateId, setLocalCandidateId] = useState(caseObject.selectedExpertId || null)
  const [celebrateStep, setCelebrateStep] = useState(null)

  const recommended = getRecommendedExpertTypes(caseObject)
  const selectedType = EXPERT_TYPES.find(et => et.id === (caseObject.selectedExpertType || localTypeId))
  const selectedCandidate = selectedType?.candidates.find(c => c.id === (caseObject.selectedExpertId || localCandidateId))

  function celebrate(step) {
    setCelebrateStep(step)
    setTimeout(() => setCelebrateStep(null), 1600)
  }

  function handleConfirmType() {
    if (!localTypeId || !identifyAction) return
    completeAction(caseObject.caseId, 'identify_expert')
    setExpertType(caseObject.caseId, localTypeId)
    billTime(caseObject.caseId, identifyAction.hours, identifyAction.label)
    spendAction(identifyAction.dailyActionCost)
    addXP(identifyAction.xpReward, `${identifyAction.label} on ${caseObject.caseId}`)
    logActivity(`Expert type identified: ${EXPERT_TYPES.find(e => e.id === localTypeId)?.label} (${caseObject.caseId})`, 'action')
    celebrate(1)
  }

  function handleSelectCandidate(candidateId) {
    setLocalCandidateId(candidateId)
    if (!step2Done && selectAction) {
      completeAction(caseObject.caseId, 'select_expert')
      billTime(caseObject.caseId, selectAction.hours, selectAction.label)
      spendAction(selectAction.dailyActionCost)
      addXP(selectAction.xpReward, `${selectAction.label} on ${caseObject.caseId}`)
      logActivity(`Expert candidate reviewed: ${selectedType?.candidates.find(c => c.id === candidateId)?.name} (${caseObject.caseId})`, 'action')
      celebrate(2)
    }
  }

  function handleRetainExpert() {
    if (!localCandidateId || !retainAction) return
    completeAction(caseObject.caseId, 'retain_expert')
    setExpertCandidate(caseObject.caseId, localCandidateId)
    billTime(caseObject.caseId, retainAction.hours, retainAction.label)
    spendAction(retainAction.dailyActionCost)
    addXP(retainAction.xpReward, `${retainAction.label} on ${caseObject.caseId}`)
    logActivity(`Expert retained: ${selectedCandidate?.name} (${caseObject.caseId})`, 'action')
    celebrate(3)
  }

  const canAct = dailyActionsRemaining > 0

  if (step3Done && selectedCandidate && selectedType) {
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--accent-green)',
        borderRadius: '8px', padding: '16px', marginBottom: '16px',
      }}>
        <div style={{ fontSize: '10px', color: 'var(--accent-green)', letterSpacing: '0.1em', marginBottom: '8px' }}>
          EXPERT WITNESS RETAINED
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', color: 'var(--text-primary)', marginBottom: '2px' }}>
              {selectedCandidate.name}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              {selectedType.label}
            </div>
            <CredentialStars level={selectedCandidate.credentialLevel} />
          </div>
          <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
            <div>Hourly: ${selectedCandidate.hourlyRate}/hr</div>
            <div>Report: ${selectedCandidate.reportRate.toLocaleString()}</div>
            <div>Depo: ${selectedCandidate.depoRate.toLocaleString()}</div>
            <div>Trial: ${selectedCandidate.trialRate.toLocaleString()}</div>
          </div>
        </div>
        <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.4' }}>
          {selectedCandidate.credentials}
        </div>
        <div style={{
          marginTop: '10px', padding: '8px 10px',
          background: 'rgba(76,175,130,0.08)', borderRadius: '6px', border: '1px solid rgba(76,175,130,0.2)',
        }}>
          <span style={{ fontSize: '11px', color: 'var(--accent-green)' }}>
            ↑ +{selectedCandidate.outcomeBonus}% strong win probability bonus applied
          </span>
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      {/* Step header */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '8px', padding: '12px 16px', marginBottom: '12px',
      }}>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '6px' }}>
          EXPERT WITNESS SUB-SYSTEM
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {[
            { n: 1, label: 'Identify Type', done: step1Done },
            { n: 2, label: 'Select Candidate', done: step2Done },
            { n: 3, label: 'Retain Expert', done: step3Done },
          ].map(({ n, label, done }, i) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {i > 0 && (
                <div style={{ width: '20px', height: '1px', background: done ? 'var(--accent-green)' : 'var(--border)' }} />
              )}
              <div style={{
                width: '22px', height: '22px', borderRadius: '50%',
                background: done ? 'var(--accent-green)' : celebrateStep === n ? '#c9a84c' : 'var(--bg-secondary)',
                border: `1.5px solid ${done ? 'var(--accent-green)' : (!step1Done && n === 1) || (step1Done && !step2Done && n === 2) || (step2Done && !step3Done && n === 3) ? '#c9a84c' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontFamily: 'var(--font-mono)',
                color: done ? '#0f1117' : 'var(--text-secondary)',
                fontWeight: 700, flexShrink: 0,
                transition: 'all 300ms ease',
              }}>
                {done ? '✓' : n}
              </div>
              <span style={{ fontSize: '11px', color: done ? 'var(--accent-green)' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Identify Expert Type */}
      {!step1Done && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid #c9a84c44',
          borderRadius: '8px', padding: '16px', marginBottom: '12px',
        }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '14px', color: '#c9a84c', marginBottom: '4px' }}>
            Step 1 — Identify Expert Type
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
            Determine what type of expert witness is required for this matter. Match the expert discipline to the primary theory of defense, not just the claim label.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px', marginBottom: '14px' }}>
            {EXPERT_TYPES.map(et => {
              const isRec = recommended.includes(et.id)
              const isSelected = localTypeId === et.id
              return (
                <div
                  key={et.id}
                  onClick={() => setLocalTypeId(et.id)}
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    border: `1.5px solid ${isSelected ? '#c9a84c' : isRec ? '#c9a84c44' : 'var(--border)'}`,
                    background: isSelected ? 'rgba(201,168,76,0.12)' : 'var(--bg-secondary)',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    position: 'relative',
                  }}
                >
                  {isRec && (
                    <div style={{
                      position: 'absolute', top: '8px', right: '8px',
                      fontSize: '9px', color: '#c9a84c', background: 'rgba(201,168,76,0.15)',
                      padding: '1px 5px', borderRadius: '4px', letterSpacing: '0.05em',
                    }}>
                      RECOMMENDED
                    </div>
                  )}
                  <div style={{
                    fontFamily: 'var(--font-serif)', fontSize: '13px',
                    color: isSelected ? '#c9a84c' : 'var(--text-primary)',
                    marginBottom: '4px', paddingRight: isRec ? '80px' : '0',
                  }}>
                    {et.label}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {et.description}
                  </div>
                </div>
              )
            })}
          </div>

          <button
            onClick={handleConfirmType}
            disabled={!localTypeId || !canAct}
            style={{
              background: localTypeId && canAct ? '#c9a84c' : 'var(--border)',
              color: localTypeId && canAct ? '#0f1117' : 'var(--text-muted)',
              border: 'none', borderRadius: '6px',
              padding: '9px 20px', fontSize: '13px',
              fontFamily: 'var(--font-serif)', fontWeight: 600,
              cursor: localTypeId && canAct ? 'pointer' : 'not-allowed',
            }}
          >
            {!localTypeId ? 'Select Expert Type to Continue' : !canAct ? 'No Actions Remaining' : `Confirm: ${EXPERT_TYPES.find(e => e.id === localTypeId)?.label}`}
          </button>
          {identifyAction && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '10px' }}>
              {identifyAction.hours}h · {identifyAction.dailyActionCost} action · +{identifyAction.xpReward} XP
            </span>
          )}
        </div>
      )}

      {/* Step 2: Select Candidate */}
      {step1Done && !step2Done && selectedType && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid #c9a84c44',
          borderRadius: '8px', padding: '16px', marginBottom: '12px',
        }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '14px', color: '#c9a84c', marginBottom: '4px' }}>
            Step 2 — Review Expert Candidates
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
            Review all candidate experts for <strong style={{ color: 'var(--text-primary)' }}>{selectedType.label}</strong>. Get the full fee schedule — report, deposition, AND trial rates. Selecting a candidate to review completes this step.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
            {selectedType.candidates.map(candidate => {
              const isSelected = localCandidateId === candidate.id
              return (
                <div
                  key={candidate.id}
                  style={{
                    padding: '14px',
                    borderRadius: '6px',
                    border: `1.5px solid ${isSelected ? '#c9a84c' : 'var(--border)'}`,
                    background: isSelected ? 'rgba(201,168,76,0.08)' : 'var(--bg-secondary)',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '13px', color: 'var(--text-primary)' }}>
                      {candidate.name}
                    </div>
                    <CredentialStars level={candidate.credentialLevel} />
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '10px' }}>
                    {candidate.credentials}
                  </div>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: '3px', marginBottom: '8px', fontSize: '11px',
                  }}>
                    <div style={{ color: 'var(--text-muted)' }}>Hourly: <MoneyFmt amount={candidate.hourlyRate} />/hr</div>
                    <div style={{ color: 'var(--text-muted)' }}>Report: <MoneyFmt amount={candidate.reportRate} /></div>
                    <div style={{ color: 'var(--text-muted)' }}>Depo: <MoneyFmt amount={candidate.depoRate} /></div>
                    <div style={{ color: 'var(--text-muted)' }}>Trial: <MoneyFmt amount={candidate.trialRate} /></div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: '1.4', marginBottom: '10px' }}>
                    {candidate.tradeoff}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--accent-green)' }}>
                      ↑ +{candidate.outcomeBonus}% win odds
                    </span>
                    <button
                      onClick={() => canAct && handleSelectCandidate(candidate.id)}
                      disabled={!canAct}
                      style={{
                        background: canAct ? '#c9a84c' : 'var(--border)',
                        color: canAct ? '#0f1117' : 'var(--text-muted)',
                        border: 'none', borderRadius: '5px',
                        padding: '5px 12px', fontSize: '12px',
                        fontFamily: 'var(--font-serif)', fontWeight: 600,
                        cursor: canAct ? 'pointer' : 'not-allowed',
                      }}
                    >
                      Review & Select
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          {selectAction && (
            <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
              Reviewing a candidate completes this step: {selectAction.hours}h · {selectAction.dailyActionCost} action · +{selectAction.xpReward} XP
            </div>
          )}
        </div>
      )}

      {/* Step 3: Retain Expert */}
      {step1Done && step2Done && !step3Done && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid #c9a84c44',
          borderRadius: '8px', padding: '16px', marginBottom: '12px',
        }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '14px', color: '#c9a84c', marginBottom: '4px' }}>
            Step 3 — Retain Expert Witness
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
            Execute engagement letter and formally retain the selected expert. Provide the complete case file and all discovery to date. The expert needs time to review before preparing their report.
          </div>

          {/* Show all candidates, allow switching selection */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px', marginBottom: '14px' }}>
            {selectedType?.candidates.map(candidate => {
              const isChosen = localCandidateId === candidate.id
              return (
                <div
                  key={candidate.id}
                  onClick={() => setLocalCandidateId(candidate.id)}
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    border: `1.5px solid ${isChosen ? '#c9a84c' : 'var(--border)'}`,
                    background: isChosen ? 'rgba(201,168,76,0.1)' : 'var(--bg-secondary)',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <div style={{
                      fontFamily: 'var(--font-serif)', fontSize: '13px',
                      color: isChosen ? '#c9a84c' : 'var(--text-primary)',
                    }}>
                      {candidate.name}
                    </div>
                    <CredentialStars level={candidate.credentialLevel} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', fontSize: '11px', marginBottom: '6px' }}>
                    <div style={{ color: 'var(--text-muted)' }}>Hourly: <MoneyFmt amount={candidate.hourlyRate} />/hr</div>
                    <div style={{ color: 'var(--text-muted)' }}>Report: <MoneyFmt amount={candidate.reportRate} /></div>
                    <div style={{ color: 'var(--text-muted)' }}>Depo: <MoneyFmt amount={candidate.depoRate} /></div>
                    <div style={{ color: 'var(--text-muted)' }}>Trial: <MoneyFmt amount={candidate.trialRate} /></div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--accent-green)' }}>↑ +{candidate.outcomeBonus}% win odds</div>
                </div>
              )
            })}
          </div>

          {localCandidateId && selectedType && (() => {
            const c = selectedType.candidates.find(x => x.id === localCandidateId)
            if (!c) return null
            return (
              <div style={{
                padding: '12px', background: 'rgba(201,168,76,0.06)',
                border: '1px solid #c9a84c33', borderRadius: '6px', marginBottom: '14px',
              }}>
                <div style={{ fontSize: '11px', color: '#c9a84c', marginBottom: '6px', letterSpacing: '0.06em' }}>
                  RETAINING: {c.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '8px' }}>
                  {c.tradeoff}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Expected outcome improvement: <span style={{ color: 'var(--accent-green)' }}>+{c.outcomeBonus}% strong win probability</span>
                </div>
              </div>
            )
          })()}

          <button
            onClick={handleRetainExpert}
            disabled={!localCandidateId || !canAct}
            style={{
              background: localCandidateId && canAct ? '#c9a84c' : 'var(--border)',
              color: localCandidateId && canAct ? '#0f1117' : 'var(--text-muted)',
              border: 'none', borderRadius: '6px',
              padding: '9px 20px', fontSize: '13px',
              fontFamily: 'var(--font-serif)', fontWeight: 600,
              cursor: localCandidateId && canAct ? 'pointer' : 'not-allowed',
            }}
          >
            {!localCandidateId ? 'Select an Expert to Retain' : !canAct ? 'No Actions Remaining' : 'Retain Expert — Execute Engagement Letter'}
          </button>
          {retainAction && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '10px' }}>
              {retainAction.hours}h · {retainAction.dailyActionCost} action · +{retainAction.xpReward} XP
            </span>
          )}
        </div>
      )}
    </div>
  )
}
