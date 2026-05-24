import { useState } from 'react'
import { useGameStore } from '../store/gameStore.js'
import { formatShortDate } from '../utils/dateUtils.js'

function buildEmails(playerName, currentDate) {
  const dateStr = currentDate ? formatShortDate(currentDate) : 'Today'
  return [
    {
      id: 1,
      from: 'Rafael Llopiz',
      email: 'r.llopiz@llopizwizel.com',
      to: playerName,
      subject: 'Welcome to the Practice Group',
      date: dateStr,
      read: false,
      body: `${playerName},

Welcome to the governmental defense group. Your first cases have been assigned.

Review the complaints carefully — threshold issues on governmental claims must be identified immediately. Do not let deadlines pass without action.

A missed §768.28(9) argument, a deficient pre-suit notice, an unrecognized federal removal hook — these are the issues that define careers here, in both directions.

My door is open.

— RL`,
    },
    {
      id: 2,
      from: 'Maria Santos — Firm Administrator',
      email: 'admin@llopizwizel.com',
      to: playerName,
      subject: 'Timekeeping Policy Reminder',
      date: dateStr,
      read: true,
      body: `All associates are required to submit timekeeping daily by 6:00 PM.

The target is 165–200 billable hours per month. Timekeeping delinquency is noted in quarterly reviews and affects year-end evaluations.

Please ensure all time entries are complete and properly described before submission. Vague entries such as "research" or "review" will be returned for revision.

Thank you,
Maria Santos
Firm Administrator`,
    },
  ]
}

export default function EmailInbox() {
  const { player, currentDate } = useGameStore()
  const emails = buildEmails(player.name, currentDate)

  const [selected, setSelected] = useState(emails[0])
  const [folder, setFolder] = useState('Inbox')
  const [readIds, setReadIds] = useState(new Set(emails.filter(e => e.read).map(e => e.id)))

  const unreadCount = emails.filter(e => !readIds.has(e.id)).length

  const handleSelect = email => {
    setSelected(email)
    setReadIds(prev => new Set([...prev, email.id]))
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      {/* Folder sidebar */}
      <div style={{
        width: '200px', flexShrink: 0, background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)', padding: '20px 12px',
      }}>
        <div style={{
          fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em',
          marginBottom: '12px', fontWeight: 600, fontFamily: 'var(--font-sans)',
        }}>
          FOLDERS
        </div>
        {[
          { name: 'Inbox', count: unreadCount },
          { name: 'Sent', count: 0 },
          { name: 'Firm Announcements', count: 0 },
        ].map(f => (
          <button
            key={f.name}
            onClick={() => setFolder(f.name)}
            style={{
              width: '100%', textAlign: 'left',
              background: folder === f.name ? 'rgba(201,168,76,0.1)' : 'none',
              border: 'none',
              color: folder === f.name ? 'var(--accent-gold)' : 'var(--text-secondary)',
              fontSize: '13px', padding: '8px 10px', borderRadius: '6px',
              cursor: 'pointer', marginBottom: '2px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <span>{f.name}</span>
            {f.count > 0 && (
              <span style={{
                fontSize: '10px', background: 'var(--accent-red)', color: '#fff',
                borderRadius: '10px', padding: '1px 5px', fontFamily: 'var(--font-mono)',
              }}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Email list */}
      <div style={{
        width: '320px', flexShrink: 0, borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          padding: '16px 16px 12px', borderBottom: '1px solid var(--border)',
          fontFamily: 'var(--font-serif)', fontSize: '16px', color: 'var(--text-primary)',
        }}>
          {folder}
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {(folder === 'Inbox' ? emails : []).map(email => {
            const isRead = readIds.has(email.id)
            const isSelected = selected?.id === email.id
            return (
              <div
                key={email.id}
                onClick={() => handleSelect(email)}
                style={{
                  padding: '14px 16px', borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  background: isSelected
                    ? 'rgba(201,168,76,0.08)'
                    : isRead ? 'transparent' : 'rgba(74,158,255,0.04)',
                  borderLeft: isSelected ? '3px solid var(--accent-gold)' : '3px solid transparent',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', alignItems: 'flex-start' }}>
                  <span style={{
                    fontSize: '13px', fontWeight: isRead ? 400 : 600,
                    color: isRead ? 'var(--text-secondary)' : 'var(--text-primary)',
                    fontFamily: 'var(--font-sans)',
                  }}>
                    {email.from.split('—')[0].trim()}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0, marginLeft: '8px' }}>
                    {email.date}
                  </span>
                </div>
                <div style={{
                  fontSize: '12px', fontWeight: isRead ? 400 : 600,
                  color: isRead ? 'var(--text-muted)' : 'var(--text-secondary)',
                  marginBottom: '3px',
                }}>
                  {email.subject}
                </div>
                <div style={{
                  fontSize: '11px', color: 'var(--text-muted)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {email.body.slice(0, 60)}…
                </div>
              </div>
            )
          })}
          {folder !== 'Inbox' && (
            <div style={{ padding: '24px 16px', fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
              No messages in {folder}.
            </div>
          )}
        </div>
      </div>

      {/* Email preview */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        {selected ? (
          <>
            <div style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{
                fontFamily: 'var(--font-serif)', fontSize: '22px', margin: '0 0 16px',
                color: 'var(--text-primary)',
              }}>
                {selected.subject}
              </h2>
              <div style={{
                display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px',
                fontSize: '13px', lineHeight: '1.8',
              }}>
                <span style={{ color: 'var(--text-muted)' }}>From:</span>
                <span style={{ color: 'var(--accent-gold)', fontFamily: 'var(--font-sans)' }}>
                  {selected.from} <span style={{ color: 'var(--text-muted)' }}>&lt;{selected.email}&gt;</span>
                </span>
                <span style={{ color: 'var(--text-muted)' }}>To:</span>
                <span style={{ color: 'var(--text-secondary)' }}>{selected.to}</span>
                <span style={{ color: 'var(--text-muted)' }}>Date:</span>
                <span style={{ color: 'var(--text-secondary)' }}>{selected.date}</span>
              </div>
            </div>
            <div style={{
              fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.9',
              whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)',
            }}>
              {selected.body}
            </div>
          </>
        ) : (
          <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', marginTop: '40px' }}>
            Select an email to read.
          </div>
        )}
      </div>
    </div>
  )
}
