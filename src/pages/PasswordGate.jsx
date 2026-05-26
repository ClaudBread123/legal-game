import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore.js'
import FirmLogo from '../components/shared/FirmLogo.jsx'

export default function PasswordGate() {
  const { authenticate } = useGameStore()
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const [shaking, setShaking] = useState(false)
  const [success, setSuccess] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = e => {
    e.preventDefault()
    if (!value.trim() || success) return

    const ok = authenticate(value)
    if (ok) {
      setSuccess(true)
    } else {
      setShaking(true)
      setError(true)
      setValue('')
      setTimeout(() => setShaking(false), 500)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={success ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.5, delay: success ? 0.3 : 0 }}
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: 'center', maxWidth: '320px', width: '100%' }}
      >
        <FirmLogo size="lg" />

        <div style={{
          marginTop: '28px',
          fontSize: '11px',
          color: 'var(--text-muted)',
          letterSpacing: '0.15em',
          fontFamily: 'var(--font-sans)',
          fontWeight: 600,
          textTransform: 'uppercase',
          marginBottom: '28px',
        }}>
          Associate Access
        </div>

        <form onSubmit={handleSubmit}>
          <motion.div
            animate={shaking ? {
              x: [-8, 8, -6, 6, -4, 4, 0],
              transition: { duration: 0.45, ease: 'easeOut' },
            } : {}}
          >
            <input
              ref={inputRef}
              type="password"
              value={value}
              onChange={e => { setValue(e.target.value); setError(false) }}
              placeholder="Enter access code"
              autoComplete="current-password"
              style={{
                width: '100%',
                height: '44px',
                background: 'var(--bg-secondary)',
                border: `1px solid ${error ? 'var(--accent-red)' : success ? 'var(--accent-gold)' : 'var(--border)'}`,
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '15px',
                textAlign: 'center',
                letterSpacing: '0.15em',
                padding: '0 16px',
                marginBottom: '10px',
                outline: 'none',
                transition: 'border-color 200ms ease',
                boxSizing: 'border-box',
              }}
              onFocus={e => {
                if (!error && !success) e.target.style.borderColor = 'var(--accent-gold)'
              }}
              onBlur={e => {
                if (!error && !success) e.target.style.borderColor = 'var(--border)'
              }}
            />
          </motion.div>

          <button
            type="submit"
            disabled={!value.trim() || success}
            style={{
              width: '100%',
              height: '44px',
              background: success ? 'rgba(201,168,76,0.3)' : value.trim() ? 'var(--accent-gold)' : 'var(--border)',
              color: value.trim() ? '#0f1117' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '6px',
              fontFamily: 'var(--font-serif)',
              fontSize: '15px',
              fontWeight: 600,
              cursor: value.trim() && !success ? 'pointer' : 'not-allowed',
              transition: 'all 200ms ease',
            }}
          >
            {success ? '✓' : 'Enter →'}
          </button>
        </form>

        <AnimatePresence>
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                marginTop: '12px',
                fontSize: '12px',
                color: 'var(--accent-red)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Incorrect access code.
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
