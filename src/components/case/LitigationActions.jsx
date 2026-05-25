import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore.js'
import LITIGATION_PHASES, { LITIGATION_ACTIONS } from '../../data/litigationActions.js'
import ExpertPanel from './ExpertPanel.jsx'
import InvestigationResults from './InvestigationResults.jsx'
import PublicRecordsRequest from './PublicRecordsRequest.jsx'
import StatusUpdateModal from './StatusUpdateModal.jsx'
import ActionComprehensionModal from './ActionComprehensionModal.jsx'
import FreeTextActionModal from './FreeTextActionModal.jsx'
import Modal from '../shared/Modal.jsx'
import { generateActionCheck } from '../../api/generateActionCheck.js'

const EXPERT_WIZARD_ACTION_IDS = new Set(['identify_expert', 'select_expert', 'retain_expert'])
const FREE_TEXT_ACTIONS = new Set(['motion_to_dismiss', 'initial_evaluation'])

const SPECIAL_MODAL_TYPES = {
  background_check: 'investigation_background',
  social_media_search: 'investigation_social',
  public_records_request: 'public_records',
  status_update_client: 'status_update',
}

const CHECK_REQUIRED_ACTIONS = new Set([
  'check_presuit_notice',
  'check_statute_of_limitations',
  'motion_to_dismiss',
  'written_discovery',
  'notice_plaintiff_depo',
  'take_plaintiff_depo',
  'initial_evaluation',
  'motion_summary_judgment',
  'respond_to_discovery',
])

function isPhaseUnlocked(phase, completedActions) {
  if (phase.id === 'phase_1') return true
  const unlocker = LITIGATION_PHASES.find(p => p.unlocksPhase === phase.id)
  if (!unlocker) return true
  return unlocker.unlockRequires.every(id => completedActions.includes(id))
}

function isActionAvailable(action, completedActions) {
  if (action.availableWhen === 'always') return true
  if (action.availableWhen?.startsWith('after:')) {
    const prereq = action.availableWhen.replace('after:', '')
    return completedActions.includes(prereq)
  }
  return true
}

function getPrereqLabel(action) {
  if (action.availableWhen?.startsWith('after:')) {
    const prereqId = action.availableWhen.replace('after:', '')
    const found = LITIGATION_ACTIONS.find(a => a.id === prereqId)
    return found?.label || prereqId
  }
  return null
}

export default function LitigationActions({ caseObject }) {
  const { dailyActionsRemaining, completeAction, billTime, spendAction, addXP, logActivity, addEmail, player } = useGameStore()
  const [selectedPhaseId, setSelectedPhaseId] = useState('phase_1')
  const [modalAction, setModalAction] = useState(null)
  const [specialModal, setSpecialModal] = useState(null)
  const [celebrateId, setCelebrateId] = useState(null)
  const [checkModal, setCheckModal] = useState({
    isOpen: false,
    action: null,
    checkData: null,
    isLoading: false,
  })
  const [freeTextModal, setFreeTextModal] = useState({
    isOpen: false,
    action: null,
    checkData: null,
  })

  const completed = caseObject.completedActions || []
  const timestamps = caseObject.actionTimestamps || {}

  const selectedPhase = LITIGATION_PHASES.find(p => p.id === selectedPhaseId) || LITIGATION_PHASES[0]
  const isSelectedUnlocked = isPhaseUnlocked(selectedPhase, completed)
  const phaseCompletedCount = selectedPhase.actions.filter(a => completed.includes(a.id)).length
  const nextPhase = LITIGATION_PHASES.find(p => p.id === selectedPhase.unlocksPhase)

  const handleConfirm = () => {
    if (!modalAction) return
    const action = modalAction
    setModalAction(null)

    completeAction(caseObject.caseId, action.id)
    billTime(caseObject.caseId, action.hours, action.label)
    spendAction(action.dailyActionCost)
    addXP(action.xpReward, `${action.label} on ${caseObject.caseId}`)
    logActivity(`Action taken: ${action.label} (${caseObject.caseId})`, 'action')

    setCelebrateId(action.id)
    setTimeout(() => setCelebrateId(null), 1500)
  }

  const openComprehensionCheck = async (action) => {
    if (FREE_TEXT_ACTIONS.has(action.id)) {
      // Open free-text modal — fetch context data but don't block on it
      setFreeTextModal({ isOpen: true, action, checkData: null })
      try {
        const checkData = await generateActionCheck({
          caseObject,
          actionId: action.id,
          playerLevel: player?.title || 'Junior Associate',
          completedActions: completed,
          activeConsequences: caseObject.activeConsequences || [],
        })
        setFreeTextModal(prev => ({ ...prev, checkData }))
      } catch {
        // Modal works fine without checkData — INSTRUCTIONS map provides context
      }
      return
    }

    // Open MC comprehension modal in loading state immediately
    setCheckModal({ isOpen: true, action, checkData: null, isLoading: true })

    try {
      const checkData = await generateActionCheck({
        caseObject,
        actionId: action.id,
        playerLevel: player?.title || 'Junior Associate',
        completedActions: completed,
        activeConsequences: caseObject.activeConsequences || [],
      })
      setCheckModal(prev => ({ ...prev, checkData, isLoading: false }))
    } catch {
      setCheckModal({ isOpen: false, action: null, checkData: null, isLoading: false })
      setModalAction(action)
    }
  }

  const handleComprehensionComplete = (qualityScore) => {
    const action = checkModal.action
    setCheckModal({ isOpen: false, action: null, checkData: null, isLoading: false })
    if (!action) return

    completeAction(caseObject.caseId, action.id, qualityScore)
    billTime(caseObject.caseId, action.hours, action.label)
    spendAction(action.dailyActionCost)

    const xpMultiplier = qualityScore === 3 ? 1.0 : qualityScore === 2 ? 0.6 : 0.2
    const earnedXP = Math.round(action.xpReward * xpMultiplier)
    addXP(earnedXP, `${action.label} — Quality ${qualityScore === 3 ? 'Excellent' : qualityScore === 2 ? 'Adequate' : 'Deficient'} (${caseObject.caseId})`)
    logActivity(`Action taken: ${action.label} (${caseObject.caseId}) — Quality ${qualityScore}`, 'action')

    if (qualityScore === 1) {
      addEmail({
        from: 'Onier Llopiz',
        fromEmail: 'o.llopiz@llopizwizel.com',
        subject: `Case Review Flagged — ${caseObject.caseId}`,
        priority: 'high',
        requiresResponse: false,
        caseId: caseObject.caseId,
        body: `${player?.name || 'Associate'},

I've been informed that your assessment on "${action.label}" (${caseObject.caseId}) was scored deficient.

This is not a matter of effort — it is a matter of preparation and understanding. Deficient work on a governmental defense matter has real consequences for the client.

Please review the relevant statutes and come prepared to discuss this file.

— OL`,
      })
    }

    setCelebrateId(action.id)
    setTimeout(() => setCelebrateId(null), 1500)
  }

  const handleFreeTextComplete = (qualityScore, earnedXP) => {
    const action = freeTextModal.action
    setFreeTextModal({ isOpen: false, action: null, checkData: null })
    if (!action) return

    completeAction(caseObject.caseId, action.id, qualityScore)
    billTime(caseObject.caseId, action.hours, action.label)
    spendAction(action.dailyActionCost)
    addXP(earnedXP, `${action.label} — ${qualityScore === 3 ? 'Excellent' : qualityScore === 2 ? 'Adequate' : 'Deficient'} (${caseObject.caseId})`)
    logActivity(`Action taken: ${action.label} (${caseObject.caseId}) — Quality ${qualityScore}`, 'action')

    if (qualityScore === 1) {
      addEmail({
        from: 'Onier Llopiz',
        fromEmail: 'o.llopiz@llopizwizel.com',
        subject: `Analysis Flagged — ${caseObject.caseId}`,
        priority: 'urgent',
        requiresResponse: false,
        caseId: caseObject.caseId,
        body: `${player?.name || 'Associate'},

Your written analysis on "${action.label}" (${caseObject.caseId}) has been reviewed and scored deficient.

Written analysis is not a formality — it is the foundation of strategy. If you cannot articulate the issues in writing, you cannot litigate the case.

We will discuss this file. Come prepared.

— OL`,
      })
    }

    setCelebrateId(action.id)
    setTimeout(() => setCelebrateId(null), 1500)
  }

  return (
    <div>
      {/* Phase tab pills */}
      <div style={{
        display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '14px', marginBottom: '14px',
        scrollbarWidth: 'none', msOverflowStyle: 'none',
      }}>
        {LITIGATION_PHASES.map(phase => {
          const unlocked = isPhaseUnlocked(phase, completed)
          const doneCount = phase.actions.filter(a => completed.includes(a.id)).length
          const isSelected = selectedPhaseId === phase.id
          return (
            <button
              key={phase.id}
              onClick={() => setSelectedPhaseId(phase.id)}
              style={{
                flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '5px 12px',
                borderRadius: '20px',
                border: `1.5px solid ${isSelected ? phase.color : unlocked ? `${phase.color}55` : 'var(--border)'}`,
                background: isSelected ? `${phase.color}20` : 'transparent',
                color: isSelected ? phase.color : unlocked ? 'var(--text-secondary)' : 'var(--text-muted)',
                fontSize: '12px',
                fontFamily: 'var(--font-serif)',
                cursor: 'pointer',
                opacity: unlocked ? 1 : 0.55,
                transition: 'all 150ms ease',
                whiteSpace: 'nowrap',
              }}
            >
              {!unlocked && <span style={{ fontSize: '9px', lineHeight: 1 }}>🔒</span>}
              {phase.shortLabel}
              {doneCount > 0 && (
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '10px',
                  color: isSelected ? phase.color : 'var(--text-muted)',
                  background: isSelected ? `${phase.color}18` : 'var(--bg-secondary)',
                  padding: '1px 5px', borderRadius: '8px',
                }}>
                  {doneCount}/{phase.actions.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Phase header card */}
      <div style={{
        background: 'var(--bg-card)',
        border: `1px solid ${isSelectedUnlocked ? `${selectedPhase.color}44` : 'var(--border)'}`,
        borderRadius: '8px', padding: '14px 16px', marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'var(--font-serif)', fontSize: '14px',
              color: isSelectedUnlocked ? selectedPhase.color : 'var(--text-muted)',
              marginBottom: '4px',
            }}>
              {selectedPhase.label}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              {selectedPhase.description}
            </div>
          </div>
          {isSelectedUnlocked && (
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)',
              background: 'var(--bg-secondary)', padding: '4px 10px', borderRadius: '12px',
              whiteSpace: 'nowrap', marginLeft: '12px',
            }}>
              {phaseCompletedCount} / {selectedPhase.actions.length}
            </div>
          )}
        </div>

        {/* Locked phase — show unlock requirements */}
        {!isSelectedUnlocked && (() => {
          const unlocker = LITIGATION_PHASES.find(p => p.unlocksPhase === selectedPhaseId)
          if (!unlocker) return null
          return (
            <div style={{
              marginTop: '12px', padding: '10px 12px',
              background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '8px' }}>
                UNLOCK REQUIRES — complete in {unlocker.shortLabel}
              </div>
              {unlocker.unlockRequires.map(reqId => {
                const isDone = completed.includes(reqId)
                const reqAction = LITIGATION_ACTIONS.find(a => a.id === reqId)
                return (
                  <div key={reqId} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: isDone ? 'var(--accent-green)' : 'var(--text-muted)', lineHeight: 1 }}>
                      {isDone ? '✓' : '○'}
                    </span>
                    <span style={{ fontSize: '12px', color: isDone ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                      {reqAction?.label || reqId}
                    </span>
                  </div>
                )
              })}
            </div>
          )
        })()}

        {/* Unlocked phase — show what it unlocks */}
        {isSelectedUnlocked && selectedPhase.unlockRequires.length > 0 && nextPhase && (
          <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Unlocks{' '}
            <span style={{ color: nextPhase.color }}>{nextPhase.shortLabel}</span>
            {' '}when:{' '}
            {selectedPhase.unlockRequires.map((id, i) => {
              const a = LITIGATION_ACTIONS.find(x => x.id === id)
              const done = completed.includes(id)
              return (
                <span key={id}>
                  {i > 0 && ', '}
                  <span style={{ color: done ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                    {a?.label || id}
                  </span>
                </span>
              )
            })}
            {' '}complete.
          </div>
        )}
      </div>

      {/* Day complete banner */}
      {dailyActionsRemaining === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '28px', marginBottom: '10px' }}>⚖️</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '17px', color: 'var(--text-primary)', marginBottom: '8px' }}>
            Day Complete
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '300px', margin: '0 auto' }}>
            You have reached your daily capacity. Advance to the next business day to continue.
          </div>
        </div>
      ) : (
        <>
          {/* Expert panel for Phase 4 */}
          {selectedPhaseId === 'phase_4' && isSelectedUnlocked && (
            <ExpertPanel caseObject={caseObject} />
          )}

          {/* Actions grid — in Phase 4, exclude the wizard-handled actions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
          {(selectedPhaseId === 'phase_4'
            ? selectedPhase.actions.filter(a => !EXPERT_WIZARD_ACTION_IDS.has(a.id))
            : selectedPhase.actions
          ).map(action => {
            const done = completed.includes(action.id)
            const actionAvailable = isSelectedUnlocked && isActionAvailable(action, completed)
            const canAct = actionAvailable && !done && dailyActionsRemaining >= action.dailyActionCost
            const prereqLabel = isSelectedUnlocked && !done && !actionAvailable ? getPrereqLabel(action) : null

            return (
              <div key={action.id} style={{
                background: 'var(--bg-card)',
                border: `1px solid ${done ? 'var(--accent-green)' : 'var(--border)'}`,
                borderRadius: '8px', padding: '16px',
                opacity: !isSelectedUnlocked ? 0.4 : prereqLabel ? 0.65 : 1,
                position: 'relative', overflow: 'hidden',
                transition: 'opacity 200ms ease',
              }}>
                {celebrateId === action.id && (
                  <motion.div
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 0, y: -30 }}
                    transition={{ duration: 1.5 }}
                    style={{
                      position: 'absolute', top: '8px', right: '12px', zIndex: 10,
                      fontFamily: 'var(--font-mono)', fontSize: '18px', color: 'var(--accent-gold)',
                      fontWeight: 700, pointerEvents: 'none',
                    }}
                  >
                    +{action.xpReward} XP
                  </motion.div>
                )}

                {/* Action title row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%', marginTop: '4px', flexShrink: 0,
                    background: done ? 'var(--accent-green)' : isSelectedUnlocked ? selectedPhase.color : 'var(--border)',
                    border: done ? 'none' : `1.5px solid ${isSelectedUnlocked ? selectedPhase.color : 'var(--border)'}`,
                  }} />
                  <div style={{
                    fontFamily: 'var(--font-serif)', fontSize: '14px',
                    color: done ? 'var(--accent-green)' : 'var(--text-primary)',
                    lineHeight: '1.4',
                  }}>
                    {done && '✓ '}{action.label}
                  </div>
                </div>

                {/* Strategic note */}
                <div style={{
                  fontSize: '11px', color: 'var(--accent-gold)', lineHeight: '1.5',
                  fontStyle: 'italic', marginBottom: '8px', paddingLeft: '16px',
                  opacity: 0.85,
                }}>
                  {action.strategicNote}
                </div>

                {/* Description */}
                <div style={{
                  fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5',
                  marginBottom: '12px', paddingLeft: '16px',
                }}>
                  {action.description}
                </div>

                {/* Badges */}
                <div style={{
                  display: 'flex', gap: '6px', marginBottom: '12px',
                  flexWrap: 'wrap', paddingLeft: '16px',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '11px',
                    color: 'var(--accent-gold)', background: 'rgba(201,168,76,0.1)',
                    padding: '2px 7px', borderRadius: '4px',
                  }}>
                    {action.hours}h
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '11px',
                    color: 'var(--text-secondary)', background: 'var(--bg-secondary)',
                    padding: '2px 7px', borderRadius: '4px',
                  }}>
                    {action.dailyActionCost} action{action.dailyActionCost > 1 ? 's' : ''}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '11px',
                    color: 'var(--accent-green)', background: 'rgba(76,175,130,0.1)',
                    padding: '2px 7px', borderRadius: '4px',
                  }}>
                    +{action.xpReward} XP
                  </span>
                </div>

                {/* CTA / status */}
                <div style={{ paddingLeft: '16px' }}>
                  {done ? (
                    <div style={{ fontSize: '12px', color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
                      ✓ Completed {timestamps[action.id] ? `— ${timestamps[action.id]}` : ''}
                    </div>
                  ) : !isSelectedUnlocked ? (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      🔒 Phase locked
                    </div>
                  ) : prereqLabel ? (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      🔒 Requires: {prereqLabel}
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        const specialType = SPECIAL_MODAL_TYPES[action.id]
                        if (specialType) setSpecialModal({ action, type: specialType })
                        else if (CHECK_REQUIRED_ACTIONS.has(action.id)) openComprehensionCheck(action)
                        else setModalAction(action)
                      }}
                      disabled={!canAct}
                      style={{
                        background: canAct ? selectedPhase.color : 'var(--border)',
                        color: canAct ? '#0f1117' : 'var(--text-muted)',
                        border: 'none', borderRadius: '6px',
                        padding: '8px 16px', fontSize: '13px',
                        fontFamily: 'var(--font-serif)', fontWeight: 600,
                        cursor: canAct ? 'pointer' : 'not-allowed',
                        transition: 'all 150ms ease',
                      }}
                    >
                      {dailyActionsRemaining < action.dailyActionCost ? 'Insufficient Actions' : 'Take Action'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
          </div>
        </>
      )}

      {/* Investigation results modal */}
      <Modal
        isOpen={!!specialModal && (specialModal.type === 'investigation_background' || specialModal.type === 'investigation_social')}
        onClose={() => setSpecialModal(null)}
        title={specialModal?.type === 'investigation_social' ? 'Social Media Search Results' : 'Investigation Results'}
        wide
      >
        {specialModal && (specialModal.type === 'investigation_background' || specialModal.type === 'investigation_social') && (
          <InvestigationResults
            type={specialModal.type === 'investigation_social' ? 'social_media' : 'background'}
            caseObject={caseObject}
            action={specialModal.action}
            onClose={() => setSpecialModal(null)}
          />
        )}
      </Modal>

      {/* Public records request modal */}
      <Modal
        isOpen={!!specialModal && specialModal.type === 'public_records'}
        onClose={() => setSpecialModal(null)}
        title="Florida Public Records Request"
        wide
      >
        {specialModal?.type === 'public_records' && (
          <PublicRecordsRequest
            caseObject={caseObject}
            action={specialModal.action}
            onClose={() => setSpecialModal(null)}
          />
        )}
      </Modal>

      {/* Status update modal */}
      <Modal
        isOpen={!!specialModal && specialModal.type === 'status_update'}
        onClose={() => setSpecialModal(null)}
        title="Client Status Report"
        wide
      >
        {specialModal?.type === 'status_update' && (
          <StatusUpdateModal
            caseObject={caseObject}
            action={specialModal.action}
            onClose={() => setSpecialModal(null)}
          />
        )}
      </Modal>

      {/* Free-text analysis modal (motion_to_dismiss, initial_evaluation) */}
      <FreeTextActionModal
        isOpen={freeTextModal.isOpen}
        onClose={() => setFreeTextModal({ isOpen: false, action: null, checkData: null })}
        onComplete={handleFreeTextComplete}
        action={freeTextModal.action}
        caseObject={caseObject}
        playerTitle={player?.title || 'Junior Associate'}
        checkData={freeTextModal.checkData}
      />

      {/* Comprehension check modal */}
      <ActionComprehensionModal
        isOpen={checkModal.isOpen}
        onClose={() => setCheckModal({ isOpen: false, action: null, checkData: null, isLoading: false })}
        onComplete={handleComprehensionComplete}
        action={checkModal.action}
        caseObject={caseObject}
        playerTitle={player?.title || 'Junior Associate'}
        isLoading={checkModal.isLoading}
        checkData={checkModal.checkData}
      />

      {/* Confirm modal */}
      <Modal isOpen={!!modalAction} onClose={() => setModalAction(null)} title={modalAction?.label}>
        {modalAction && (
          <div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '16px' }}>
              {modalAction.description}
            </div>
            <div style={{
              padding: '12px', background: 'rgba(201,168,76,0.1)',
              border: '1px solid var(--accent-gold)', borderRadius: '6px', marginBottom: '16px',
            }}>
              <div style={{ fontSize: '12px', color: 'var(--accent-gold)', fontWeight: 600, marginBottom: '4px' }}>
                STRATEGIC NOTE
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                {modalAction.strategicNote}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '14px', marginBottom: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span>Time: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)' }}>{modalAction.hours}h</span></span>
              <span>Actions: <span style={{ fontFamily: 'var(--font-mono)' }}>{modalAction.dailyActionCost}</span></span>
              <span>XP: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-green)' }}>+{modalAction.xpReward}</span></span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleConfirm}
                style={{
                  flex: 1, height: '44px',
                  background: 'var(--accent-gold)', color: '#0f1117',
                  border: 'none', borderRadius: '6px',
                  fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Confirm Action
              </button>
              <button
                onClick={() => setModalAction(null)}
                style={{
                  height: '44px', padding: '0 16px',
                  background: 'none', color: 'var(--text-muted)',
                  border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
