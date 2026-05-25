import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore.js'

const TYPE_CONFIG = {
  success: { border: 'var(--accent-green)', icon: '✓', color: 'var(--accent-green)' },
  warning: { border: 'var(--accent-yellow)', icon: '⚠', color: 'var(--accent-yellow)' },
  error: { border: 'var(--accent-red)', icon: '✕', color: 'var(--accent-red)' },
  info: { border: '#4a9eff', icon: 'ℹ', color: '#4a9eff' },
  promotion: { border: 'var(--accent-gold)', icon: '★', color: 'var(--accent-gold)' },
}

function ToastItem({ toast }) {
  const { dismissToast } = useGameStore()
  const cfg = TYPE_CONFIG[toast.type] || TYPE_CONFIG.info

  useEffect(() => {
    const timer = setTimeout(() => dismissToast(toast.id), toast.duration || 4000)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '10px',
        padding: '12px 14px', marginBottom: '8px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${cfg.border}`,
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        maxWidth: '320px', minWidth: '260px',
        pointerEvents: 'all',
      }}
    >
      <span style={{ color: cfg.color, fontSize: '14px', flexShrink: 0, lineHeight: 1.2 }}>
        {cfg.icon}
      </span>
      <div style={{
        flex: 1, fontSize: '12px', color: 'var(--text-secondary)',
        lineHeight: '1.4', fontFamily: 'var(--font-sans)',
      }}>
        {toast.message}
      </div>
      <button
        onClick={() => dismissToast(toast.id)}
        style={{
          background: 'none', border: 'none', color: 'var(--text-muted)',
          fontSize: '14px', cursor: 'pointer', padding: '0', lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </motion.div>
  )
}

export default function ToastContainer() {
  const { toasts } = useGameStore()

  return (
    <div style={{
      position: 'fixed', top: '80px', right: '16px', zIndex: 9999,
      pointerEvents: 'none',
    }}>
      <AnimatePresence mode="popLayout">
        {(toasts || []).map(toast => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  )
}
