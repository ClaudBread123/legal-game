import { motion, AnimatePresence } from 'framer-motion'

export default function ComplaintSlideOver({ isOpen, onClose, caseObject }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 1100,
              background: 'rgba(0,0,0,0.5)',
            }}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={{
              position: 'fixed',
              right: 0,
              top: 0,
              bottom: 0,
              width: '600px',
              maxWidth: '95vw',
              background: 'var(--bg-secondary)',
              borderLeft: '1px solid var(--border)',
              zIndex: 1200,
              overflowY: 'auto',
              padding: '32px',
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid var(--border)',
            }}>
              <span style={{
                color: 'var(--accent-gold)',
                fontFamily: 'var(--font-serif)',
                fontSize: '16px',
              }}>
                {caseObject?.caseId} — Full Complaint
              </span>
              <button
                onClick={onClose}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--text-muted)', fontSize: '22px',
                  padding: '4px 8px', cursor: 'pointer', lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {caseObject?.complaintDocument ? (
              <pre style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                lineHeight: '1.9',
                color: 'var(--text-secondary)',
                whiteSpace: 'pre-wrap',
                margin: 0,
              }}>
                {caseObject.complaintDocument}
              </pre>
            ) : (
              <div style={{
                textAlign: 'center', padding: '40px',
                color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '13px',
              }}>
                Complaint document is being prepared...
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
