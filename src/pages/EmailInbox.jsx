import { useState } from 'react'
import { useGameStore } from '../store/gameStore.js'
import { formatShortDate } from '../utils/dateUtils.js'

const PRIORITY_BORDER = {
  urgent: 'var(--accent-red)',
  high: 'var(--accent-gold)',
  normal: 'transparent',
}

function priorityPill(priority) {
  if (priority === 'urgent') {
    return (
      <span style={{
        fontSize: '9px', background: 'var(--accent-red)', color: '#fff',
        borderRadius: '4px', padding: '1px 5px', fontFamily: 'var(--font-mono)',
        fontWeight: 700, letterSpacing: '0.05em', flexShrink: 0,
      }}>
        URGENT
      </span>
    )
  }
  if (priority === 'high') {
    return (
      <span style={{
        fontSize: '9px', background: 'rgba(201,168,76,0.2)', color: 'var(--accent-gold)',
        borderRadius: '4px', padding: '1px 5px', fontFamily: 'var(--font-mono)',
        fontWeight: 700, letterSpacing: '0.05em', flexShrink: 0,
      }}>
        HIGH
      </span>
    )
  }
  return null
}

export default function EmailInbox() {
  const { emails: storeEmails, markEmailRead } = useGameStore()
  const [selected, setSelected] = useState(null)
  const [folder, setFolder] = useState('Inbox')

  const emails = [...(storeEmails || [])].sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1
    return new Date(b.timestamp) - new Date(a.timestamp)
  })

  const unreadCount = emails.filter(e => !e.read).length

  const handleSelect = email => {
    setSelected(email)
    if (!email.read) markEmailRead(email.id)
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
          {folder}{folder === 'Inbox' && unreadCount > 0 ? ` (${unreadCount})` : ''}
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {folder === 'Inbox' && emails.length === 0 && (
            <div style={{ padding: '24px 16px', fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
              No messages.
            </div>
          )}
          {(folder === 'Inbox' ? emails : []).map(email => {
            const isSelected = selected?.id === email.id
            const borderColor = PRIORITY_BORDER[email.priority] || 'transparent'
            return (
              <div
                key={email.id}
                onClick={() => handleSelect(email)}
                style={{
                  padding: '12px 14px', borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  background: isSelected
                    ? 'rgba(201,168,76,0.08)'
                    : email.read ? 'transparent' : 'rgba(74,158,255,0.04)',
                  borderLeft: isSelected
                    ? `3px solid var(--accent-gold)`
                    : `3px solid ${borderColor}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                    {!email.read && (
                      <span style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: 'var(--accent-gold)', flexShrink: 0,
                      }} />
                    )}
                    <span style={{
                      fontSize: '13px', fontWeight: email.read ? 400 : 700,
                      color: email.read ? 'var(--text-secondary)' : 'var(--text-primary)',
                      fontFamily: 'var(--font-sans)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {(email.from || '').split('—')[0].trim()}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
                    {email.timestamp ? formatShortDate(email.timestamp) : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                  <span style={{
                    fontSize: '12px', fontWeight: email.read ? 400 : 600,
                    color: email.read ? 'var(--text-muted)' : 'var(--text-secondary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                  }}>
                    {email.subject}
                  </span>
                  {priorityPill(email.priority)}
                </div>
                <div style={{
                  fontSize: '11px', color: 'var(--text-muted)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {(email.body || '').slice(0, 60)}…
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <h2 style={{
                  fontFamily: 'var(--font-serif)', fontSize: '22px', margin: 0,
                  color: 'var(--text-primary)', flex: 1,
                }}>
                  {selected.subject}
                </h2>
                {priorityPill(selected.priority)}
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px',
                fontSize: '13px', lineHeight: '1.8',
              }}>
                <span style={{ color: 'var(--text-muted)' }}>From:</span>
                <span style={{ color: 'var(--accent-gold)', fontFamily: 'var(--font-sans)' }}>
                  {selected.from}{selected.fromEmail && (
                    <span style={{ color: 'var(--text-muted)' }}> &lt;{selected.fromEmail}&gt;</span>
                  )}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>To:</span>
                <span style={{ color: 'var(--text-secondary)' }}>{selected.to}</span>
                <span style={{ color: 'var(--text-muted)' }}>Date:</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {selected.timestamp ? formatShortDate(selected.timestamp) : '—'}
                </span>
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
