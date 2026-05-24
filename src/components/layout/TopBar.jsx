import { Link } from 'react-router-dom'
import { useGameStore } from '../../store/gameStore.js'
import FirmLogo from '../shared/FirmLogo.jsx'
import { formatGameDate } from '../../utils/dateUtils.js'

export default function TopBar() {
  const { player, currentDate, dailyActionsRemaining, notifications } = useGameStore()
  const unread = notifications.filter(n => !n.read).length

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: '64px',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px',
    }}>
      <Link to="/" style={{ textDecoration: 'none' }}>
        <FirmLogo size="sm" />
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-secondary)',
        }}>
          {currentDate ? formatGameDate(currentDate) : '—'}
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '13px',
          color: dailyActionsRemaining <= 1 ? 'var(--accent-red)' : 'var(--text-secondary)',
          display: 'flex', alignItems: 'center', gap: '5px',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1.5a5.5 5.5 0 1 0 0 11A5.5 5.5 0 0 0 7 1.5z" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M7 4v3l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          {dailyActionsRemaining} actions today
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '13px', color: 'var(--accent-gold)', fontFamily: 'var(--font-serif)' }}>
            {player.title}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {player.xp} XP
          </div>
        </div>

        {unread > 0 && (
          <div style={{
            width: '20px', height: '20px', borderRadius: '50%',
            background: 'var(--accent-red)', color: '#fff',
            fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-mono)',
          }}>
            {unread}
          </div>
        )}

        <span style={{
          fontSize: '13px', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
        }}>
          {player.name}
        </span>
      </div>
    </div>
  )
}
