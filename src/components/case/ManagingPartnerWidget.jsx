import { useState } from 'react'
import { useGameStore } from '../../store/gameStore.js'
import { getMPReview } from '../../api/managingPartner.js'
import Modal from '../shared/Modal.jsx'

export default function ManagingPartnerWidget({ caseObject, issueEvaluation }) {
  const { player, dailyActionsRemaining, spendAction, addMPMessage, managingPartnerMessages, logActivity } = useGameStore()
  const [loading, setLoading] = useState(false)
  const [reviewModal, setReviewModal] = useState(null)

  const canRequest = dailyActionsRemaining >= 2
  const caseMessages = managingPartnerMessages.filter(m => m.caseId === caseObject.caseId).slice(0, 3)

  const handleRequest = async () => {
    if (!canRequest || loading) return
    setLoading(true)
    spendAction(2)
    try {
      const content = await getMPReview({
        caseObject,
        issueEvaluation,
        completedActions: caseObject.completedActions || [],
        playerName: player.name,
      })
      addMPMessage(caseObject.caseId, content)
      logActivity(`Managing Partner review completed for ${caseObject.caseId}`, 'mp')
      setReviewModal(content)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '8px', padding: '18px',
    }}>
      {/* Abstract avatar */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none" style={{ display: 'block', margin: '0 auto 8px' }}>
          <polygon points="28,4 52,16 52,40 28,52 4,40 4,16" stroke="#c9a84c" strokeWidth="1.5" fill="rgba(201,168,76,0.08)" />
          <polygon points="28,12 44,20 44,36 28,44 12,36 12,20" stroke="#c9a84c" strokeWidth="1" fill="rgba(201,168,76,0.05)" />
          <circle cx="28" cy="28" r="8" fill="rgba(201,168,76,0.15)" stroke="#c9a84c" strokeWidth="1.5" />
          <circle cx="28" cy="28" r="3" fill="#c9a84c" />
        </svg>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '14px', color: 'var(--text-primary)' }}>
          Onier Llopiz
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Managing Partner
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginTop: '6px', fontSize: '11px', color: 'var(--accent-green)' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent-green)', display: 'inline-block' }} />
          Available for Review
        </div>
      </div>

      <button
        onClick={handleRequest}
        disabled={!canRequest || loading}
        title={!canRequest ? 'Insufficient actions remaining today.' : ''}
        style={{
          width: '100%', height: '44px',
          background: 'var(--bg-secondary)',
          color: canRequest ? 'var(--accent-gold)' : 'var(--text-muted)',
          border: `1px solid ${canRequest ? 'var(--accent-gold)' : 'var(--border)'}`,
          borderRadius: '6px', cursor: canRequest ? 'pointer' : 'not-allowed',
          fontFamily: 'var(--font-sans)', fontSize: '13px', transition: 'all 150ms ease',
          marginBottom: '4px',
        }}
      >
        {loading ? 'Reviewing…' : 'Request Case Review'}
      </button>
      <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '16px' }}>
        — 2 daily actions —
      </div>

      {/* Previous messages */}
      {caseMessages.length > 0 && (
        <div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: 600 }}>
            RECENT REVIEWS
          </div>
          {caseMessages.map(msg => (
            <div
              key={msg.id}
              onClick={() => setReviewModal(msg.content)}
              style={{
                padding: '8px', background: 'var(--bg-secondary)', borderRadius: '6px',
                marginBottom: '6px', cursor: 'pointer', border: '1px solid var(--border)',
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '3px' }}>
                {msg.timestamp}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                {msg.content.slice(0, 80)}…
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!reviewModal} onClose={() => setReviewModal(null)} title="CASE REVIEW MEETING" wide>
        {reviewModal && (
          <div>
            <div style={{ width: '40px', height: '2px', background: 'var(--accent-gold)', margin: '0 auto 20px' }} />
            <div style={{
              fontFamily: 'var(--font-serif)', fontSize: '14px', color: 'var(--text-secondary)',
              lineHeight: '1.8', whiteSpace: 'pre-wrap',
            }}>
              {reviewModal}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
