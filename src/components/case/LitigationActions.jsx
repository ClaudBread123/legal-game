import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore.js'
import { LITIGATION_ACTIONS } from '../../data/litigationActions.js'
import Modal from '../shared/Modal.jsx'

function isActionAvailable(action, completedActions) {
  if (action.availableWhen === 'always') return true
  if (action.availableWhen?.startsWith('after:')) {
    const prereq = action.availableWhen.replace('after:', '')
    return completedActions.includes(prereq)
  }
  return true
}

export default function LitigationActions({ caseObject }) {
  const { player, dailyActionsRemaining, completeAction, billTime, spendAction, addXP, logActivity } = useGameStore()
  const [modalAction, setModalAction] = useState(null)
  const [celebrateId, setCelebrateId] = useState(null)

  const completed = caseObject.completedActions || []
  const timestamps = caseObject.actionTimestamps || {}

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

  if (dailyActionsRemaining === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚖️</div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Day Complete
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '320px', margin: '0 auto 20px' }}>
          You have reached your daily capacity. Advance to the next business day to continue.
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '12px' }}>
        {LITIGATION_ACTIONS.map(action => {
          const done = completed.includes(action.id)
          const available = isActionAvailable(action, completed)
          const canAct = available && !done && dailyActionsRemaining >= action.dailyActionCost

          return (
            <div key={action.id} style={{
              background: 'var(--bg-card)', border: `1px solid ${done ? 'var(--accent-green)' : 'var(--border)'}`,
              borderRadius: '8px', padding: '16px',
              opacity: (!available || (done)) ? 0.6 : 1,
              position: 'relative', overflow: 'hidden',
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

              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '14px', color: done ? 'var(--accent-green)' : 'var(--text-primary)', marginBottom: '4px' }}>
                  {done && '✓ '}{action.label}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', fontStyle: 'italic' }}>
                  {action.strategicNote}
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.5' }}>
                {action.description}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent-gold)', background: 'rgba(201,168,76,0.1)', padding: '2px 7px', borderRadius: '4px' }}>
                  {action.hours}h
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '2px 7px', borderRadius: '4px' }}>
                  {action.dailyActionCost} action{action.dailyActionCost > 1 ? 's' : ''}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent-green)', background: 'rgba(76,175,130,0.1)', padding: '2px 7px', borderRadius: '4px' }}>
                  +{action.xpReward} XP
                </span>
              </div>

              {done ? (
                <div style={{ fontSize: '12px', color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
                  Completed {timestamps[action.id] || ''}
                </div>
              ) : !available ? (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Requires: {action.availableWhen?.replace('after:', '')}
                </div>
              ) : (
                <button
                  onClick={() => setModalAction(action)}
                  disabled={!canAct}
                  style={{
                    background: canAct ? 'var(--accent-gold)' : 'var(--border)',
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
          )
        })}
      </div>

      <Modal isOpen={!!modalAction} onClose={() => setModalAction(null)} title={modalAction?.label}>
        {modalAction && (
          <div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '16px' }}>
              {modalAction.description}
            </div>
            <div style={{ padding: '12px', background: 'rgba(201,168,76,0.1)', border: '1px solid var(--accent-gold)', borderRadius: '6px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--accent-gold)', fontWeight: 600, marginBottom: '4px' }}>STRATEGIC NOTE</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{modalAction.strategicNote}</div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
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
