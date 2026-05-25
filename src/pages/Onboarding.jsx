import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore.js'
import FirmLogo from '../components/shared/FirmLogo.jsx'
import { formatGameDate } from '../utils/dateUtils.js'

// ── Case generation loading screen ──────────────────────
const LOADING_PHASES = [
  { at: 0,    message: 'Reviewing your assignment...' },
  { at: 4000, message: 'Analyzing Florida statutes...' },
  { at: 12000, message: 'Preparing case file...' },
  { at: 22000, message: 'Reviewing jurisdiction and threshold issues...' },
  { at: 38000, message: 'Validating legal framework...' },
  { at: 52000, message: 'This is taking a moment — complex matter incoming...' },
]

function CaseLoadingScreen() {
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timers = LOADING_PHASES.slice(1).map((p, i) =>
      setTimeout(() => setPhaseIndex(i + 1), p.at)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    const start = Date.now()
    const duration = 62000
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      setProgress(Math.min(92, Math.round((elapsed / duration) * 92)))
    }, 250)
    return () => clearInterval(interval)
  }, [])

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

        <div style={{ marginTop: '32px', minHeight: '52px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={phaseIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.4 }}
              style={{
                fontSize: phaseIndex === 0 ? '16px' : '14px',
                color: phaseIndex === 0 ? 'var(--text-secondary)' : 'var(--accent-gold)',
                fontFamily: phaseIndex === 0 ? 'var(--font-serif)' : 'var(--font-mono)',
                fontStyle: phaseIndex === 0 ? 'italic' : 'normal',
              }}
            >
              {LOADING_PHASES[phaseIndex].message}
            </motion.div>
          </AnimatePresence>
        </div>

        <div style={{
          marginTop: '28px',
          width: '100%', height: '3px',
          background: 'var(--bg-secondary)',
          borderRadius: '2px', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: '2px',
            background: 'var(--accent-gold)',
            width: `${progress}%`,
            transition: 'width 250ms linear',
          }} />
        </div>

        <div style={{
          marginTop: '8px',
          fontSize: '11px', color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
        }}>
          {progress}%
        </div>
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
