import { motion, AnimatePresence } from 'framer-motion'

export default function ComplaintModal({ caseObject, isOpen, onClose }) {
  if (!isOpen) return null

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
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.75)',
              zIndex: 1200,
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
              zIndex: 1201,
              width: 'min(816px, 95vw)',
              height: '90vh',
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
              padding: '10px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0,
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
                  background: '#d4c9a8',
                  border: '1px solid #b8a880',
                  color: '#4a3f2a',
                  padding: '5px 14px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontFamily: 'Georgia, serif',
                  fontSize: '12px',
                }}
              >
                Close ✕
              </button>
            </div>

            {/* Document */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '64px 96px',
              background: '#fafaf7',
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
    </AnimatePresence>
  )
}
