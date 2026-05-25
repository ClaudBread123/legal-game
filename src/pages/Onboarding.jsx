import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore.js'
import FirmLogo from '../components/shared/FirmLogo.jsx'
import { formatGameDate } from '../utils/dateUtils.js'

// ── Case generation loading screen ──────────────────────
function CaseLoadingScreen() {
  const [phase, setPhase] = useState(0)
  const [dots, setDots] = useState('.')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 500)
    const t2 = setTimeout(() => setPhase(2), 3000)
    const t3 = setTimeout(() => setPhase(3), 8000)
    const t4 = setTimeout(() => setPhase(4), 15000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [])

  useEffect(() => {
    if (phase < 1) return
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '.' : d + '.')
    }, 500)
    return () => clearInterval(interval)
  }, [phase])

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px',
    }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', maxWidth: '420px', width: '100%' }}
      >
        <FirmLogo size="lg" />

        <AnimatePresence>
          {phase >= 1 && (
            <motion.div
              key="reviewing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                marginTop: '32px',
                fontSize: '16px', color: 'var(--text-secondary)',
                fontFamily: 'var(--font-serif)', fontStyle: 'italic',
              }}
            >
              Reviewing your assignment{dots}
            </motion.div>
          )}

          {phase >= 2 && (
            <motion.div
              key="preparing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                marginTop: '20px',
                padding: '12px 20px',
                background: 'rgba(201,168,76,0.08)',
                border: '1px solid var(--accent-gold)44',
                borderRadius: '6px',
                fontSize: '13px', color: 'var(--accent-gold)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              Preparing case file{dots}
            </motion.div>
          )}

          {phase >= 3 && (
            <motion.div
              key="almost"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                marginTop: '12px',
                fontSize: '13px', color: 'var(--text-secondary)',
                fontFamily: 'var(--font-serif)', fontStyle: 'italic',
              }}
            >
              Almost ready{dots}
            </motion.div>
          )}

          {phase >= 4 && (
            <motion.div
              key="slow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              style={{
                marginTop: '16px',
                fontSize: '12px', color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              This is taking a moment — complex matter incoming...
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

// ── "Matter assigned" confirmation screen ────────────────
function MatterAssignedScreen() {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px',
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        style={{ textAlign: 'center' }}
      >
        <div style={{
          fontSize: '32px', marginBottom: '16px',
          color: '#4ade80',
        }}>
          ✓
        </div>
        <div style={{
          fontFamily: 'var(--font-serif)', fontSize: '18px',
          color: 'var(--text-primary)', marginBottom: '6px',
        }}>
          Matter assigned.
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
          Proceeding to dashboard...
        </div>
      </motion.div>
    </div>
  )
}

// ── Welcome back screen ──────────────────────────────────
function WelcomeBack({ player, currentDate, onContinue, onNewGame }) {
  const [confirming, setConfirming] = useState(false)

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: 'center', maxWidth: '420px', width: '100%' }}
      >
        <FirmLogo size="md" />
        <div style={{ width: '40px', height: '1px', background: 'var(--accent-gold)', margin: '20px auto' }} />

        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', margin: '0 0 6px', color: 'var(--text-primary)' }}>
          Welcome back, {player.name}.
        </h2>
        <div style={{ fontSize: '16px', color: 'var(--accent-gold)', fontFamily: 'var(--font-serif)', marginBottom: '4px' }}>
          {player.title}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '28px' }}>
          {player.xp} XP
        </div>

        {!confirming ? (
          <>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <button
                onClick={onContinue}
                style={{
                  flex: 1, height: '48px',
                  background: 'var(--accent-gold)', color: '#0f1117',
                  border: 'none', borderRadius: '6px',
                  fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Continue
              </button>
              <button
                onClick={() => setConfirming(true)}
                style={{
                  flex: 1, height: '48px',
                  background: 'transparent', color: 'var(--text-secondary)',
                  border: '1px solid var(--border)', borderRadius: '6px',
                  fontFamily: 'var(--font-sans)', fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                New Game
              </button>
            </div>
            {currentDate && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Last played: {formatGameDate(currentDate)}
              </div>
            )}
          </>
        ) : (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--accent-red)',
            borderRadius: '8px', padding: '20px',
          }}>
            <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '16px', lineHeight: '1.5' }}>
              Start over?{' '}
              <span style={{ color: 'var(--accent-red)' }}>All progress will be lost.</span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={onNewGame}
                style={{
                  flex: 1, height: '40px',
                  background: 'var(--accent-red)', color: '#fff',
                  border: 'none', borderRadius: '6px',
                  fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Confirm — Erase Save
              </button>
              <button
                onClick={() => setConfirming(false)}
                style={{
                  flex: 1, height: '40px',
                  background: 'none', color: 'var(--text-secondary)',
                  border: '1px solid var(--border)', borderRadius: '6px',
                  fontFamily: 'var(--font-sans)', fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

// ── Main Onboarding ──────────────────────────────────────
export default function Onboarding({ onReady }) {
  const { initGame, resetGame, player, currentDate, gameStarted, staleGameCleared } = useGameStore()
  const [name, setName] = useState('Joshy Llopiz')
  const [loadingState, setLoadingState] = useState('idle') // 'idle' | 'generating' | 'assigned'

  if (gameStarted && loadingState === 'idle') {
    return (
      <WelcomeBack
        player={player}
        currentDate={currentDate}
        onContinue={() => onReady && onReady()}
        onNewGame={() => {
          resetGame()
          window.location.reload()
        }}
      />
    )
  }

  if (loadingState === 'generating') {
    return <CaseLoadingScreen />
  }

  if (loadingState === 'assigned') {
    return <MatterAssignedScreen />
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!name.trim()) return

    setLoadingState('generating')

    try {
      await initGame(name.trim())
      setLoadingState('assigned')
      // Brief pause to show the "Matter assigned" confirmation
      await new Promise(r => setTimeout(r, 700))
    } catch {
      // initGame handles its own fallback internally; just proceed
    }

    if (onReady) onReady()
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', marginBottom: '40px' }}
      >
        <FirmLogo size="lg" />
        <div style={{
          marginTop: '12px', fontSize: '14px', color: 'var(--text-secondary)',
          fontStyle: 'italic', fontFamily: 'var(--font-sans)',
        }}>
          Florida's Premier Governmental Defense Firm
        </div>
        <div style={{ width: '60px', height: '2px', background: 'var(--accent-gold)', margin: '20px auto 0' }} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}
      >
        <h1 style={{
          fontFamily: 'var(--font-serif)', fontSize: '36px', fontWeight: 600,
          color: 'var(--text-primary)', margin: '0 0 16px',
        }}>
          Welcome, Associate.
        </h1>
        <p style={{
          fontSize: '16px', color: 'var(--text-secondary)', lineHeight: '1.7',
          fontFamily: 'var(--font-sans)', marginBottom: staleGameCleared ? '20px' : '36px',
        }}>
          You have been assigned to the governmental defense practice group at Llopiz
          Wizel LLP. Your caseload is waiting. Your reputation is unwritten. The firm
          expects excellence — particularly on threshold issues that others miss.
        </p>

        {staleGameCleared && (
          <div style={{
            background: 'rgba(201,168,76,0.08)', border: '1px solid var(--accent-gold)44',
            borderRadius: '6px', padding: '12px 16px', marginBottom: '24px',
            fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', lineHeight: '1.5',
          }}>
            Game updated with new content. Please start a new game to continue.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={{
            display: 'block', fontSize: '11px', color: 'var(--text-secondary)',
            letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px',
            fontFamily: 'var(--font-sans)',
          }}>
            What is your name?
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{
              width: '100%', height: '48px', fontSize: '16px',
              textAlign: 'center', marginBottom: '12px',
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: '6px', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
              padding: '0 16px',
            }}
          />
          <button
            type="submit"
            disabled={!name.trim()}
            style={{
              width: '100%', height: '48px',
              background: 'var(--accent-gold)', color: '#0f1117',
              border: 'none', borderRadius: '6px',
              fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 600,
              cursor: 'pointer', transition: 'all 150ms ease',
            }}
          >
            Enter the Firm →
          </button>
        </form>
      </motion.div>
    </div>
  )
}
