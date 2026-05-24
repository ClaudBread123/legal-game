import { Link, useNavigate } from 'react-router-dom'
import { useGameStore } from '../../store/gameStore.js'
import FirmLogo from '../shared/FirmLogo.jsx'
import { formatGameDate } from '../../utils/dateUtils.js'

export default function TopBar() {
  const navigate = useNavigate()
  const { player, currentDate, dailyActionsRemaining, emails } = useGameStore()
  const unread = (emails || []).filter(e => !e.read).length

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: '64px',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px',
    }}>
      {/* Left: Logo */}
      <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
        <FirmLogo size="sm" />
      </Link>

      {/* Center: Date + Actions + Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)',
        }}>
          {currentDate ? formatGameDate(currentDate) : '—'}
        </span>

        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '12px',
          color: dailyActionsRemaining === 0
            ? 'var(--accent-red)'
            : dailyActionsRemaining <= 2
              ? 'var(--accent-red)'
              : 'var(--text-secondary)',
          display: 'flex', alignItems: 'center', gap: '5px',
        }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M7 1.5a5.5 5.5 0 1 0 0 11A5.5 5.5 0 0 0 7 1.5z" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M7 4v3l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          {dailyActionsRemaining === 0 ? 'No actions remaining' : `${dailyActionsRemaining} actions today`}
        </span>

        {/* Nav links */}
        <Link
          to="/timekeeping"
          style={{
            fontSize: '12px', color: 'var(--text-secondary)', textDecoration: 'none',
            fontFamily: 'var(--font-sans)', transition: 'color 150ms ease',
          }}
          onMouseEnter={e => e.target.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
        >
          Timekeeping
        </Link>
      </div>

      {/* Right: XP, Bell, Player */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: 'var(--accent-gold)', fontFamily: 'var(--font-serif)' }}>
            {player.title}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {player.xp} XP
          </div>
        </div>

        {/* Notification bell → /email */}
        <div
          onClick={() => navigate('/email')}
          style={{
            position: 'relative', cursor: 'pointer', padding: '4px',
            color: unread > 0 ? 'var(--accent-gold)' : 'var(--text-muted)',
            transition: 'color 150ms ease',
          }}
          title="Email Inbox"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M3 5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5z" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M3 5l6 5 6-5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          {unread > 0 && (
            <div style={{
              position: 'absolute', top: '-2px', right: '-2px',
              width: '14px', height: '14px', borderRadius: '50%',
              background: 'var(--accent-red)', color: '#fff',
              fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-mono)',
            }}>
              {unread}
            </div>
          )}
        </div>

        {/* Player name → /career */}
        <Link
          to="/career"
          style={{
            fontSize: '13px', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
            textDecoration: 'none', transition: 'color 150ms ease',
          }}
          onMouseEnter={e => e.target.style.color = 'var(--accent-gold)'}
          onMouseLeave={e => e.target.style.color = 'var(--text-primary)'}
        >
          {player.name}
        </Link>
      </div>
    </div>
  )
}
