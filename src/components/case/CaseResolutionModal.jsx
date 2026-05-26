import { motion } from 'framer-motion'
import Modal from '../shared/Modal.jsx'

function healthColor(h) {
  if (h >= 75) return '#4ade80'
  if (h >= 45) return 'var(--accent-yellow)'
  return 'var(--accent-red)'
}

export default function CaseResolutionModal({ resolution, caseObject, onResolve }) {
  if (!resolution || !caseObject) return null

  const path = resolution.resolutionPath
  if (!path) return null

  const health = caseObject.caseHealth ?? 100
  const isWin = path.outcome === 'strongWin'
  const isLoss = path.outcome === 'loss'
  const isSettle = path.outcome === 'settleDefense' || path.outcome === 'settleNeutral'

  return (
    <Modal isOpen={true} onClose={null} title="Case Resolved">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>
            {path.icon || (isWin ? '⚖' : isLoss ? '⚠' : '🤝')}
          </div>
          <div style={{
            fontFamily: 'var(--font-serif)', fontSize: '22px',
            color: path.color, marginBottom: '4px',
          }}>
            {path.label}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {path.subtitle}
          </div>
        </div>

        <div style={{
          fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
          marginBottom: '14px', textAlign: 'center',
        }}>
          {caseObject.caseId} — {caseObject.defendant}
        </div>

        {/* Resolution summary */}
        {path.description && (
          <div style={{
            padding: '14px 16px', marginBottom: '16px',
            background: 'var(--bg-secondary)', borderRadius: '8px',
            border: `1px solid ${path.color}33`,
          }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '8px' }}>RESOLUTION SUMMARY</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              {path.description}
            </div>
          </div>
        )}

        {/* Settlement details */}
        {isSettle && path.settlementAmount != null && (
          <div style={{
            padding: '12px 16px', marginBottom: '16px',
            background: 'rgba(74,158,255,0.06)', borderRadius: '6px',
            border: '1px solid rgba(74,158,255,0.2)',
          }}>
            <div style={{ fontSize: '10px', color: '#4a9eff', letterSpacing: '0.1em', marginBottom: '8px' }}>SETTLEMENT DETAILS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px' }}>Amount</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  ${path.settlementAmount.toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px' }}>% of Cap</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {path.settlementPct}%
                </div>
              </div>
              {path.cap && (
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px' }}>Statutory Cap</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-muted)' }}>
                    ${path.cap.toLocaleString()}
                  </div>
                </div>
              )}
              {path.settlementRating && (
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px' }}>Rating</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700,
                    color: path.settlementRating === 'EXCELLENT' ? '#4ade80'
                      : path.settlementRating === 'REASONABLE' ? '#4a9eff'
                      : path.settlementRating === 'ACCEPTABLE' ? 'var(--accent-yellow)'
                      : 'var(--accent-red)'
                  }}>
                    {path.settlementRating}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Damages (loss/trial) */}
        {isLoss && path.damages > 0 && (
          <div style={{
            padding: '12px 16px', marginBottom: '16px',
            background: 'rgba(239,68,68,0.06)', borderRadius: '6px',
            border: '1px solid rgba(239,68,68,0.2)',
          }}>
            <div style={{ fontSize: '10px', color: 'var(--accent-red)', letterSpacing: '0.1em', marginBottom: '6px' }}>JUDGMENT AGAINST CLIENT</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: 'var(--accent-red)' }}>
              ${path.damages.toLocaleString()}
            </div>
          </div>
        )}

        {/* Stats row */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1px 1fr',
          gap: '12px', marginBottom: '16px', textAlign: 'center',
        }}>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>FINAL CASE HEALTH</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 700, color: healthColor(health) }}>
              {health}<span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>/100</span>
            </div>
          </div>
          <div style={{ background: 'var(--border)' }} />
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>XP AWARDED</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 700, color: 'var(--accent-green)' }}>
              +{path.xpReward}
            </div>
          </div>
        </div>

        {/* What went right */}
        {isWin && path.whatWentRight?.length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '10px', color: '#4ade80', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '8px' }}>WHAT YOU DID RIGHT</div>
            {path.whatWentRight.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '5px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                <span style={{ color: '#4ade80', flexShrink: 0 }}>✓</span>
                {item}
              </div>
            ))}
          </div>
        )}

        {/* What went wrong */}
        {isLoss && path.whatWentWrong?.length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '10px', color: 'var(--accent-red)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '8px' }}>WHAT WENT WRONG</div>
            {path.whatWentWrong.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '5px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                <span style={{ color: 'var(--accent-red)', flexShrink: 0 }}>✕</span>
                {item}
              </div>
            ))}
          </div>
        )}

        {/* Onier's note */}
        {path.oniersNote && (
          <div style={{
            padding: '12px 14px', marginBottom: '16px',
            borderLeft: '3px solid var(--accent-gold)',
            background: 'rgba(201,168,76,0.06)', borderRadius: '4px',
          }}>
            <div style={{ fontSize: '10px', color: 'var(--accent-gold)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '6px' }}>ONIER'S NOTE</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', fontStyle: 'italic' }}>
              {path.oniersNote}
            </div>
          </div>
        )}

        {/* Career impact */}
        <div style={{
          fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center',
          marginBottom: '16px', fontFamily: 'var(--font-mono)',
        }}>
          {isWin ? 'Result recorded in your career file — favorable.' : isLoss ? 'Result recorded in your career file — review required.' : 'Result recorded in your career file.'}
        </div>

        <button
          onClick={onResolve}
          style={{
            width: '100%', height: '46px',
            background: path.color,
            color: isLoss ? '#fff' : '#0f1117',
            border: 'none', borderRadius: '6px',
            fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Close Case & Continue →
        </button>
      </motion.div>
    </Modal>
  )
}
