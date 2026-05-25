import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../../store/gameStore.js'
import TopBar from './TopBar.jsx'
import ToastContainer from '../shared/Toast.jsx'

export default function AppShell({ children }) {
  const navigate = useNavigate()
  const { emails, currentDate } = useGameStore()
  const shownUrgentIds = useRef(new Set())
  const lastInterruptDate = useRef(null)
  const [interruptEmail, setInterruptEmail] = useState(null)

  // Detect urgent Onier emails we haven't shown yet (max once per game day)
  const urgentOnier = (emails || []).find(e =>
    e.priority === 'urgent' &&
    e.from?.includes('Onier') &&
    !shownUrgentIds.current.has(e.id) &&
    !e.read &&
    lastInterruptDate.current !== currentDate
  )

  if (urgentOnier && !interruptEmail) {
    shownUrgentIds.current.add(urgentOnier.id)
    lastInterruptDate.current = currentDate
    setTimeout(() => setInterruptEmail(urgentOnier), 800)
  }

  const handleReadNow = () => {
    setInterruptEmail(null)
    navigate('/email')
  }

  const handleReadLater = () => {
    setInterruptEmail(null)
  }

  return (
    <>
      <TopBar />
      <div style={{ paddingTop: '64px', minHeight: '100vh' }}>
        {children}
      </div>
      <ToastContainer />

      {/* Urgent Onier interrupt overlay */}
      {interruptEmail && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(10,12,20,0.88)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--accent-gold)',
            borderRadius: '12px', padding: '32px', maxWidth: '440px', width: '90%',
            boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: 'rgba(201,168,76,0.15)', border: '2px solid var(--accent-gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
                fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--accent-gold)',
              }}>
                OL
              </div>
              <div style={{
                fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.12em',
                fontWeight: 700, marginBottom: '6px',
              }}>
                MESSAGE FROM ONIER LLOPIZ
              </div>
              <div style={{
                fontFamily: 'var(--font-serif)', fontSize: '17px',
                color: 'var(--text-primary)', lineHeight: '1.4',
              }}>
                {interruptEmail.subject}
              </div>
            </div>

            <div style={{
              padding: '14px 16px', background: 'var(--bg-secondary)',
              borderRadius: '8px', marginBottom: '20px',
              fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6',
              borderLeft: '3px solid var(--accent-red)',
            }}>
              {interruptEmail.body?.split('. ').slice(0, 2).join('. ')}
              {interruptEmail.body?.includes('. ') ? '.' : ''}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleReadNow}
                style={{
                  flex: 1, height: '44px',
                  background: 'var(--accent-gold)', color: '#0f1117',
                  border: 'none', borderRadius: '6px',
                  fontFamily: 'var(--font-serif)', fontSize: '14px', fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Read Now →
              </button>
              <button
                onClick={handleReadLater}
                style={{
                  height: '44px', padding: '0 16px',
                  background: 'none', color: 'var(--text-muted)',
                  border: '1px solid var(--border)', borderRadius: '6px',
                  cursor: 'pointer', fontSize: '13px',
                }}
              >
                Read Later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
