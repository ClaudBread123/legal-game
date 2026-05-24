import { useState } from 'react'

const EMAILS = [
  {
    id: 1,
    from: 'Rafael Llopiz',
    email: 'r.llopiz@llopizwizel.com',
    subject: 'Welcome to the Practice Group',
    date: 'Today',
    read: false,
    body: `Welcome to the governmental defense group. Your first cases have been assigned.

Review the complaints carefully — threshold issues on governmental claims must be identified immediately. Do not let deadlines pass without action.

A missed §768.28(9) argument, a deficient pre-suit notice, an unrecognized federal removal hook — these are the issues that define careers here, in both directions.

My door is open.

— RL`,
  },
  {
    id: 2,
    from: 'Maria Santos — Firm Administrator',
    email: 'admin@llopizwizel.com',
    subject: 'Timekeeping Policy Reminder',
    date: 'Today',
    read: true,
    body: `All associates are required to submit timekeeping daily by 6:00 PM.

The target is 165–200 billable hours per month. Timekeeping delinquency is noted in quarterly reviews and affects year-end evaluations.

Please ensure all time entries are complete and properly described before submission. Vague entries such as "research" or "review" will be returned for revision.

Thank you,
Maria Santos
Firm Administrator`,
  },
]

export default function EmailInbox() {
  const [selected, setSelected] = useState(EMAILS[0])
  const [folder, setFolder] = useState('Inbox')

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      {/* Folder list */}
      <div style={{
        width: '160px', flexShrink: 0, background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)', padding: '20px 12px',
      }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '12px', fontWeight: 600 }}>
          FOLDERS
        </div>
        {['Inbox', 'Sent', 'Firm Announcements'].map(f => (
          <button
            key={f}
            onClick={() => setFolder(f)}
            style={{
              width: '100%', textAlign: 'left', background: folder === f ? 'rgba(201,168,76,0.1)' : 'none',
              border: 'none', color: folder === f ? 'var(--accent-gold)' : 'var(--text-secondary)',
              fontSize: '13px', padding: '8px 10px', borderRadius: '6px', cursor: 'pointer',
              marginBottom: '2px',
            }}
          >
            {f}
            {f === 'Inbox' && (
              <span style={{ marginLeft: '6px', fontSize: '10px', background: 'var(--accent-red)', color: '#fff', borderRadius: '10px', padding: '1px 5px' }}>
                {EMAILS.filter(e => !e.read).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Email list */}
      <div style={{
        width: '300px', flexShrink: 0, borderRight: '1px solid var(--border)',
        overflowY: 'auto',
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', color: 'var(--text-primary)' }}>
            {folder}
          </div>
        </div>
        {EMAILS.map(email => (
          <div
            key={email.id}
            onClick={() => setSelected(email)}
            style={{
              padding: '14px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
              background: selected?.id === email.id ? 'rgba(201,168,76,0.07)' : 'transparent',
              borderLeft: selected?.id === email.id ? '3px solid var(--accent-gold)' : '3px solid transparent',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ fontSize: '13px', color: email.read ? 'var(--text-secondary)' : 'var(--text-primary)', fontWeight: email.read ? 400 : 600 }}>
                {email.from}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{email.date}</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {email.subject}
            </div>
          </div>
        ))}
      </div>

      {/* Email preview */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {selected && (
          <>
            <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', margin: '0 0 10px', color: 'var(--text-primary)' }}>
                {selected.subject}
              </h2>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                From: <span style={{ color: 'var(--accent-gold)' }}>{selected.from}</span> &lt;{selected.email}&gt;
              </div>
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.8', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)' }}>
              {selected.body}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
