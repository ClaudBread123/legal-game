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

  return (
    <Modal isOpen={true} onClose={null} title="Case Resolved">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>
            {isWin ? '⚖' : isLoss ? '⚠' : '🤝'}
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

        <div style={{
          padding: '14px 16px', marginBottom: '20px',
          background: 'var(--bg-secondary)', borderRadius: '8px',
          border: `1px solid ${path.color}33`,
        }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '8px' }}>RESOLUTION SUMMARY</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            {path.description}
          </div>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1px 1fr',
          gap: '12px', marginBottom: '20px', textAlign: 'center',
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
