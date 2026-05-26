import { useState } from 'react'
import { useGameStore } from '../store/gameStore.js'
import { formatShortDate, addBusinessDays } from '../utils/dateUtils.js'
import { callClaude } from '../api/anthropicProxy.js'
import ComposeModal from '../components/email/ComposeModal.jsx'

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

function scheduleOpposingReply(email, replyText, attorney, deliveryDate) {
  const style = attorney?.style || 'aggressive'
  const name = attorney?.name || "Plaintiff's Counsel"
  const sig = attorney?.signatureStyle || "Plaintiff's Counsel"
  const emailAddr = attorney?.email || 'counsel@plaintifflaw.com'

  const STYLE_REPLIES = {
    aggressive: `Counsel,\n\nWe acknowledge your letter. We find your position without merit and will proceed accordingly.\n\nDo not expect us to stand down on this.\n\n${sig}`,
    scorched_earth: `Counsel,\n\nWe have reviewed your correspondence. We reject the position set forth therein and reserve all rights. Expect further motions practice.\n\n${sig}`,
    methodical: `Counsel,\n\nThank you for your correspondence. We will review the matter and respond substantively in due course.\n\n${sig}`,
    settlement_focused: `Counsel,\n\nThank you for your letter. We remain open to discussing a resolution of this matter at an appropriate time.\n\n${sig}`,
    civil_rights_specialist: `Counsel,\n\nWe have reviewed your letter. Our client's constitutional claims remain fully viable and we intend to pursue them vigorously.\n\n${sig}`,
    strategic: `Counsel,\n\nWe acknowledge receipt of your correspondence and will advise accordingly.\n\n${sig}`,
    plaintiff_champion: `Counsel,\n\nWe have reviewed your response. Our client deserves justice and we will not rest until they receive it.\n\n${sig}`,
    employment_specialist: `Counsel,\n\nThank you for your letter. We note your position and will respond as appropriate under the applicable administrative and litigation framework.\n\n${sig}`,
  }

  const body = STYLE_REPLIES[style] || STYLE_REPLIES.methodical

  return {
    id: `email-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    timestamp: deliveryDate,
    read: false,
    responded: false,
    caseId: email.caseId || null,
    from: name,
    fromEmail: emailAddr,
    subject: `Re: ${email.subject}`,
    priority: attorney?.aggressiveness >= 8 ? 'high' : 'normal',
    body,
  }
}

function AdversarialImpactPanel({ impact }) {
  if (!impact) return null
  const isPositive = impact.healthChange > 0
  const isNeutral = impact.healthChange === 0
  const borderColor = isPositive ? 'rgba(74,222,128,0.3)' : impact.severity === 'critical' ? 'rgba(239,68,68,0.35)' : 'rgba(201,168,76,0.35)'
  const bgColor = isPositive ? 'rgba(74,222,128,0.06)' : impact.severity === 'critical' ? 'rgba(239,68,68,0.06)' : 'rgba(201,168,76,0.06)'
  const labelColor = isPositive ? '#4ade80' : impact.severity === 'critical' ? 'var(--accent-red)' : 'var(--accent-yellow)'
  return (
    <div style={{
      marginTop: '16px', padding: '12px 16px', borderRadius: '6px',
      background: bgColor, border: `1px solid ${borderColor}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', fontWeight: 700, color: labelColor }}>
          {isPositive ? 'CASE IMPACT — POSITIVE' : impact.severity === 'critical' ? 'CASE IMPACT — CRITICAL' : 'CASE IMPACT — ACTION REQUIRED'}
        </div>
        {impact.healthChange !== 0 && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: labelColor }}>
            {isPositive ? '+' : ''}{impact.healthChange} Case Health
          </div>
        )}
      </div>
      {impact.actionRequired && (
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          <span style={{ color: labelColor, fontWeight: 600 }}>Action required: </span>
          {impact.actionRequired}
        </div>
      )}
    </div>
  )
}

export default function EmailInbox() {
  const { emails: storeEmails, cases, markEmailRead, respondToEmail, updateEmail, addPendingEmail, currentDate } = useGameStore()
  const [selected, setSelected] = useState(null)
  const [folder, setFolder] = useState('Inbox')
  const [selectedResponseOption, setSelectedResponseOption] = useState(null)
  const [composing, setComposing] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replyEval, setReplyEval] = useState(null)
  const [evaluating, setEvaluating] = useState(false)

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
    setReplyText('')
    setReplyEval(null)
    if (!email.read) markEmailRead(email.id)
  }

  const handleManualReply = async () => {
    if (!selectedEmail || !replyText.trim() || evaluating) return
    setEvaluating(true)
    setReplyEval(null)
    try {
      const system = `You evaluate email replies from a Florida governmental defense associate at a law firm. Output ONLY valid JSON. Schema: {"professionalismScore": 0-100, "isAppropriate": boolean, "feedback": "1-2 sentences", "suggestion": "improved version or null if already good", "floridaBarIssue": boolean, "floridaBarNote": "null or brief explanation if issue exists"}`
      const userMessage = `Original email subject: ${selectedEmail.subject}
From: ${selectedEmail.from}
Body: ${selectedEmail.body?.substring(0, 500)}

Associate's reply:
${replyText}

Evaluate this reply for professionalism, appropriateness for Florida legal practice, and Florida Bar compliance.`

      const response = await callClaude({ system, userMessage, maxTokens: 350 })
      const clean = response.replace(/```json/g, '').replace(/```/g, '').trim()
      const evalData = JSON.parse(clean)
      setReplyEval(evalData)

      // Store eval on the email and mark responded
      updateEmail(selectedEmail.id, {
        responded: true,
        manualReply: replyText,
        manualReplyEval: evalData,
        manualReplyDate: currentDate,
      })

      // Schedule opposing attorney reply for next day if email is from opposing counsel
      const isFromOpposing = selectedEmail.from && !selectedEmail.from.includes('Llopiz') && !selectedEmail.from.includes('Santos') && !selectedEmail.from.includes('Wizel')
      if (isFromOpposing) {
        const deliveryDate = addBusinessDays(currentDate, 1)
        // Find the opposing attorney from the email - look at from field
        const attorney = null // will use canned style from scheduleOpposingReply defaults
        const opposingReply = scheduleOpposingReply(selectedEmail, replyText, attorney, deliveryDate)
        addPendingEmail(opposingReply)
      }
    } catch {
      setReplyEval({ professionalismScore: null, isAppropriate: null, feedback: 'Reply sent. (Evaluation unavailable offline.)', suggestion: null, floridaBarIssue: false })
      updateEmail(selectedEmail.id, {
        responded: true,
        manualReply: replyText,
        manualReplyDate: currentDate,
      })
    } finally {
      setEvaluating(false)
    }
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
    <>
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      {/* Folder sidebar */}
      <div style={{
        width: '200px', flexShrink: 0, background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)', padding: '20px 12px',
      }}>
        <button
          onClick={() => setComposing(true)}
          style={{
            width: '100%', height: '34px', marginBottom: '14px',
            background: 'var(--accent-gold)', color: '#0f1117',
            border: 'none', borderRadius: '6px',
            fontFamily: 'var(--font-serif)', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + Compose
        </button>
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

            <AdversarialImpactPanel impact={selectedEmail.adversarialImpact} />

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

            {/* Manual reply section — available on all emails */}
            {selectedEmail && !selectedEmail.responded && !selectedEmail.manualReply && (
              <div style={{
                borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '20px',
              }}>
                <div style={{
                  fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em',
                  marginBottom: '10px', fontFamily: 'var(--font-mono)',
                }}>
                  {selectedEmail.requiresResponse ? 'OR — WRITE CUSTOM REPLY' : 'REPLY'}
                </div>
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  rows={5}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    borderRadius: '6px', color: 'var(--text-primary)',
                    fontFamily: 'var(--font-sans)', fontSize: '13px', lineHeight: '1.6',
                    padding: '10px 12px', resize: 'vertical',
                    outline: 'none',
                  }}
                />
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px' }}>
                  <button
                    onClick={handleManualReply}
                    disabled={!replyText.trim() || evaluating}
                    style={{
                      height: '36px', padding: '0 18px',
                      background: replyText.trim() && !evaluating ? 'var(--accent-gold)' : 'var(--border)',
                      color: replyText.trim() && !evaluating ? '#0f1117' : 'var(--text-muted)',
                      border: 'none', borderRadius: '6px',
                      fontFamily: 'var(--font-serif)', fontSize: '13px', fontWeight: 600,
                      cursor: replyText.trim() && !evaluating ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {evaluating ? 'Evaluating…' : 'Send & Evaluate'}
                  </button>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Your reply will be graded for professionalism.
                  </span>
                </div>

                {/* Evaluation result */}
                {replyEval && (
                  <div style={{
                    marginTop: '14px', padding: '14px 16px', borderRadius: '6px',
                    background: replyEval.isAppropriate === false
                      ? 'rgba(239,68,68,0.06)' : 'rgba(74,222,128,0.06)',
                    border: `1px solid ${replyEval.isAppropriate === false ? 'rgba(239,68,68,0.3)' : 'rgba(74,222,128,0.25)'}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{
                        fontSize: '11px', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em',
                        color: replyEval.isAppropriate === false ? 'var(--accent-red)' : '#4ade80',
                      }}>
                        {replyEval.isAppropriate === false ? '⚠ PROFESSIONALISM ISSUE' : '✓ REPLY EVALUATED'}
                      </div>
                      {replyEval.professionalismScore !== null && (
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: '13px',
                          color: replyEval.professionalismScore >= 70 ? '#4ade80'
                            : replyEval.professionalismScore >= 50 ? 'var(--accent-yellow)'
                            : 'var(--accent-red)',
                        }}>
                          {replyEval.professionalismScore}/100
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: replyEval.suggestion ? '10px' : '0' }}>
                      {replyEval.feedback}
                    </div>
                    {replyEval.floridaBarIssue && replyEval.floridaBarNote && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--accent-red)', lineHeight: '1.5' }}>
                        ⚠ Florida Bar: {replyEval.floridaBarNote}
                      </div>
                    )}
                    {replyEval.suggestion && (
                      <div style={{
                        marginTop: '10px', padding: '10px 12px',
                        background: 'var(--bg-card)', borderRadius: '4px',
                        borderLeft: '3px solid var(--accent-blue)',
                      }}>
                        <div style={{ fontSize: '10px', color: 'var(--accent-blue)', letterSpacing: '0.08em', marginBottom: '4px' }}>
                          SUGGESTED VERSION
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>
                          {replyEval.suggestion}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Show sent manual reply */}
            {selectedEmail?.manualReply && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '20px' }}>
                <div style={{ fontSize: '11px', color: '#4ade80', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
                  ✓ REPLY SENT
                </div>
                <div style={{
                  padding: '10px 14px', borderRadius: '6px', background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)', fontSize: '13px', color: 'var(--text-secondary)',
                  lineHeight: '1.6', whiteSpace: 'pre-wrap', fontStyle: 'italic',
                }}>
                  {selectedEmail.manualReply}
                </div>
                {selectedEmail.manualReplyEval?.professionalismScore !== undefined && (
                  <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    Professionalism: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      {selectedEmail.manualReplyEval.professionalismScore}/100
                    </span>
                    {selectedEmail.manualReplyEval.floridaBarIssue && (
                      <span style={{ marginLeft: '10px', color: 'var(--accent-red)' }}>⚠ Bar issue flagged</span>
                    )}
                  </div>
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

    <ComposeModal isOpen={composing} onClose={() => setComposing(false)} />
    </>
  )
}
