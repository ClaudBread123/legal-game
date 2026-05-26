import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

export default function ComplaintModal({ caseObject, isOpen, onClose }) {
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.75)',
              zIndex: 9998,
            }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 9999,
              width: 'min(860px, 92vw)',
              height: '88vh',
              maxHeight: '88vh',
              background: '#fafaf7',
              borderRadius: '3px',
              boxShadow: '0 25px 80px rgba(0,0,0,0.7)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Toolbar */}
            <div style={{
              background: '#ede8dc',
              borderBottom: '1px solid #cfc4a8',
              padding: '12px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0,
              minHeight: '48px',
            }}>
              <div>
                <span style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '12px',
                  color: '#4a3f2a',
                  fontStyle: 'italic',
                }}>
                  {caseObject?.caseId}
                </span>
                <span style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '12px',
                  color: '#7a6a4a',
                  marginLeft: '12px',
                }}>
                  Complaint for Damages
                </span>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: '#c9a84c',
                  border: 'none',
                  color: '#000',
                  padding: '6px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontFamily: 'Georgia, serif',
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                Close ✕
              </button>
            </div>

            {/* Document */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '48px 72px',
              background: '#fafaf7',
              WebkitOverflowScrolling: 'touch',
            }}>
              {caseObject?.complaintDocument ? (
                <pre style={{
                  fontFamily: '"Times New Roman", Georgia, serif',
                  fontSize: '13px',
                  lineHeight: '2.1',
                  color: '#111111',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: 0,
                }}>
                  {caseObject.complaintDocument}
                </pre>
              ) : (
                <div style={{
                  textAlign: 'center',
                  paddingTop: '80px',
                  color: '#888',
                  fontFamily: 'Georgia, serif',
                  fontStyle: 'italic',
                }}>
                  Complaint document being prepared...
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
