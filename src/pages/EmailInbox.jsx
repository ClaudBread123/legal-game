import { useState } from 'react'
import { useGameStore } from '../store/gameStore.js'
import { formatShortDate, addBusinessDays } from '../utils/dateUtils.js'

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

function ResponseRequiredBadge() {
  return (
    <span style={{
      fontSize: '9px', background: 'var(--accent-red)', color: '#fff',
      borderRadius: '4px', padding: '1px 5px', fontFamily: 'var(--font-mono)',
      fontWeight: 700, letterSpacing: '0.05em', flexShrink: 0,
    }}>
      RESPOND
    </span>
  )
}

export default function EmailInbox() {
  const { emails: storeEmails, markEmailRead, respondToEmail } = useGameStore()
  const [selected, setSelected] = useState(null)
  const [folder, setFolder] = useState('Inbox')
  const [selectedResponseOption, setSelectedResponseOption] = useState(null)

  const emails = [...(storeEmails || [])].sort((a, b) => {
    // Response-required unread first
    const aUrgent = a.requiresResponse && !a.responded && !a.responseOverdue
    const bUrgent = b.requiresResponse && !b.responded && !b.responseOverdue
    if (aUrgent !== bUrgent) return aUrgent ? -1 : 1
    if (a.read !== b.read) return a.read ? 1 : -1
    return new Date(b.timestamp) - new Date(a.timestamp)
  })

  const unreadCount = emails.filter(e => !e.read).length
  const responseRequired = emails.filter(e => e.requiresResponse && !e.responded && !e.responseOverdue).length

  const handleSelect = email => {
    setSelected(email)
    setSelectedResponseOption(null)
    if (!email.read) markEmailRead(email.id)
  }

  const handleSendResponse = () => {
    if (!selected || !selectedResponseOption) return
    const option = (selected.responseOptions || []).find(o => o.id === selectedResponseOption)
    if (!option) return

    respondToEmail(selected.id, option.id, option.xp || 0, option.consequence || null)
    // Refresh selected with updated data
    setSelected(prev => ({ ...prev, responded: true, responseOptionId: option.id }))
    setSelectedResponseOption(null)
  }

  const selectedEmail = selected
    ? (storeEmails || []).find(e => e.id === selected.id) || selected
    : null

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
          { name: 'Inbox', count: unreadCount + responseRequired },
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

        {responseRequired > 0 && (
          <div style={{
            marginTop: '16px', padding: '8px 10px', borderRadius: '6px',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          }}>
            <div style={{ fontSize: '10px', color: 'var(--accent-red)', fontWeight: 700, marginBottom: '2px' }}>
              ⚠ RESPONSES DUE
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {responseRequired} email{responseRequired !== 1 ? 's' : ''} require a response
            </div>
          </div>
        )}
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
          {folder}{folder === 'Inbox' && (unreadCount + responseRequired) > 0 ? ` (${unreadCount + responseRequired})` : ''}
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {folder === 'Inbox' && emails.length === 0 && (
            <div style={{ padding: '24px 16px', fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
              No messages.
            </div>
          )}
          {(folder === 'Inbox' ? emails : []).map(email => {
            const isSelected = selectedEmail?.id === email.id
            const borderColor = PRIORITY_BORDER[email.priority] || 'transparent'
            const needsResponse = email.requiresResponse && !email.responded && !email.responseOverdue
            return (
              <div
                key={email.id}
                onClick={() => handleSelect(email)}
                style={{
                  padding: '12px 14px', borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  background: isSelected
                    ? 'rgba(201,168,76,0.08)'
                    : needsResponse ? 'rgba(239,68,68,0.04)'
                    : email.read ? 'transparent' : 'rgba(74,158,255,0.04)',
                  borderLeft: isSelected
                    ? '3px solid var(--accent-gold)'
                    : needsResponse ? '3px solid var(--accent-red)'
                    : `3px solid ${borderColor}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                    {!email.read && (
                      <span style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: needsResponse ? 'var(--accent-red)' : 'var(--accent-gold)', flexShrink: 0,
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
                  {needsResponse ? <ResponseRequiredBadge /> : priorityPill(email.priority)}
                </div>
                {needsResponse && (
                  <div style={{ fontSize: '10px', color: 'var(--accent-red)', marginTop: '2px' }}>
                    Response required within {email.responseDeadlineGameDays || 2} business day{(email.responseDeadlineGameDays || 2) !== 1 ? 's' : ''}
                  </div>
                )}
                {!needsResponse && (
                  <div style={{
                    fontSize: '11px', color: 'var(--text-muted)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {(email.body || '').slice(0, 60)}…
                  </div>
                )}
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
        {selectedEmail ? (
          <>
            <div style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <h2 style={{
                  fontFamily: 'var(--font-serif)', fontSize: '22px', margin: 0,
                  color: 'var(--text-primary)', flex: 1,
                }}>
                  {selectedEmail.subject}
                </h2>
                {priorityPill(selectedEmail.priority)}
                {selectedEmail.requiresResponse && !selectedEmail.responded && !selectedEmail.responseOverdue && (
                  <ResponseRequiredBadge />
                )}
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px',
                fontSize: '13px', lineHeight: '1.8',
              }}>
                <span style={{ color: 'var(--text-muted)' }}>From:</span>
                <span style={{ color: 'var(--accent-gold)', fontFamily: 'var(--font-sans)' }}>
                  {selectedEmail.from}{selectedEmail.fromEmail && (
                    <span style={{ color: 'var(--text-muted)' }}> &lt;{selectedEmail.fromEmail}&gt;</span>
                  )}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>To:</span>
                <span style={{ color: 'var(--text-secondary)' }}>{selectedEmail.to}</span>
                <span style={{ color: 'var(--text-muted)' }}>Date:</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {selectedEmail.timestamp ? formatShortDate(selectedEmail.timestamp) : '—'}
                </span>
              </div>
            </div>

            <div style={{
              fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.9',
              whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)',
              marginBottom: selectedEmail.requiresResponse ? '28px' : '0',
            }}>
              {selectedEmail.body}
            </div>

            {/* Response panel */}
            {selectedEmail.requiresResponse && !selectedEmail.responseOverdue && (
              <div style={{
                borderTop: '1px solid var(--border)', paddingTop: '24px',
              }}>
                {selectedEmail.responded ? (
                  <div style={{
                    padding: '12px 14px', borderRadius: '6px',
                    background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)',
                  }}>
                    <div style={{ fontSize: '11px', color: '#4ade80', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                      RESPONSE SENT
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {(selectedEmail.responseOptions || []).find(o => o.id === selectedEmail.responseOptionId)?.label || 'Response recorded.'}
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{
                      fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em',
                      marginBottom: '14px', fontFamily: 'var(--font-mono)',
                    }}>
                      YOUR RESPONSE
                    </div>

                    {(selectedEmail.responseOptions || []).length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                        {(selectedEmail.responseOptions || []).filter(o => o.id !== 'ignore').map(option => {
                          const isSelected = selectedResponseOption === option.id
                          return (
                            <div
                              key={option.id}
                              onClick={() => setSelectedResponseOption(option.id)}
                              style={{
                                padding: '12px 14px', borderRadius: '6px', cursor: 'pointer',
                                border: `1.5px solid ${isSelected ? 'var(--accent-gold)' : 'var(--border)'}`,
                                background: isSelected ? 'rgba(201,168,76,0.08)' : 'var(--bg-secondary)',
                                transition: 'all 150ms ease',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <span style={{
                                  fontSize: '13px', fontWeight: 600,
                                  color: isSelected ? 'var(--accent-gold)' : 'var(--text-primary)',
                                }}>
                                  {option.label}
                                </span>
                                {option.xp !== 0 && (
                                  <span style={{
                                    fontSize: '10px', fontFamily: 'var(--font-mono)',
                                    color: option.xp > 0 ? '#4ade80' : 'var(--accent-red)',
                                  }}>
                                    {option.xp > 0 ? '+' : ''}{option.xp} XP
                                  </span>
                                )}
                              </div>
                              {option.text && (
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', fontStyle: 'italic' }}>
                                  "{option.text}"
                                </div>
                              )}
                              {option.note && (
                                <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--accent-green)' }}>
                                  ✓ {option.note}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <button
                        onClick={handleSendResponse}
                        disabled={!selectedResponseOption}
                        style={{
                          height: '40px', padding: '0 20px',
                          background: selectedResponseOption ? 'var(--accent-gold)' : 'var(--border)',
                          color: selectedResponseOption ? '#0f1117' : 'var(--text-muted)',
                          border: 'none', borderRadius: '6px',
                          fontFamily: 'var(--font-serif)', fontSize: '14px', fontWeight: 600,
                          cursor: selectedResponseOption ? 'pointer' : 'not-allowed',
                        }}
                      >
                        Send Response
                      </button>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Due within {selectedEmail.responseDeadlineGameDays || 2} business day{(selectedEmail.responseDeadlineGameDays || 2) !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
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
