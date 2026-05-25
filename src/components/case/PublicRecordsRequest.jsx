import { useState } from 'react'
import { useGameStore } from '../../store/gameStore.js'

const CATEGORIES = [
  { id: 'incident_reports', label: 'Incident reports related to this location/event' },
  { id: 'maintenance', label: 'Maintenance and inspection records' },
  { id: 'prior_complaints', label: 'Prior complaints or incident reports (same location, last 5 years)' },
  { id: 'internal_comms', label: 'Internal communications re: this incident' },
  { id: 'training_records', label: 'Training records for involved personnel' },
  { id: 'policies', label: 'Policies and procedures (relevant department)' },
  { id: 'code_violations', label: 'Code violation records' },
  { id: 'surveillance', label: 'Video surveillance footage' },
  { id: 'budget', label: 'Budget records for relevant department' },
]

export default function PublicRecordsRequest({ caseObject, action, onComplete, onClose }) {
  const { updateCase, completeAction, billTime, spendAction, addXP, logActivity } = useGameStore()
  const [selected, setSelected] = useState(new Set())
  const [submitted, setSubmitted] = useState(false)

  const alreadySubmitted = !!caseObject.publicRecordsRequest

  function toggleCategory(id) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSubmit() {
    if (selected.size < 2 || alreadySubmitted) return

    // Store request on case — response generated in advanceDay after 10 business days
    const today = new Date().toISOString().split('T')[0]
    updateCase(caseObject.caseId, {
      publicRecordsRequest: {
        dateSent: today,
        categories: Array.from(selected),
        status: 'pending',
      },
    })

    completeAction(caseObject.caseId, action.id)
    billTime(caseObject.caseId, action.hours, action.label)
    spendAction(action.dailyActionCost)
    addXP(action.xpReward, `${action.label} on ${caseObject.caseId}`)
    logActivity(`${action.label}: ${selected.size} categories requested (${caseObject.caseId})`, 'action')

    setSubmitted(true)
    setTimeout(onClose, 1500)
  }

  if (alreadySubmitted) {
    const req = caseObject.publicRecordsRequest
    return (
      <div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
          Public records request already submitted for this matter.
        </div>
        <div style={{
          padding: '14px', borderRadius: '6px',
          background: 'rgba(74,158,255,0.06)', border: '1px solid rgba(74,158,255,0.2)',
          marginBottom: '16px',
        }}>
          <div style={{ fontSize: '11px', color: 'var(--accent-blue)', letterSpacing: '0.08em', marginBottom: '8px' }}>
            REQUEST STATUS
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Status: <span style={{ color: req.status === 'pending' ? 'var(--accent-yellow)' : 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
              {req.status.toUpperCase()}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Sent: {req.dateSent}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Categories: {req.categories?.length || 0} requested
          </div>
          {req.status === 'pending' && (
            <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Agency has 10 business days to acknowledge. Production will follow.
            </div>
          )}
        </div>
        <button onClick={onClose} style={{
          width: '100%', height: '40px', background: 'var(--bg-secondary)',
          border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-secondary)',
          cursor: 'pointer', fontSize: '13px',
        }}>
          Close
        </button>
      </div>
    )
  }

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '24px' }}>
        <div style={{ fontSize: '24px', marginBottom: '12px' }}>✓</div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', color: 'var(--accent-green)', marginBottom: '8px' }}>
          Request Submitted
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Agency has 10 business days to acknowledge. Monitor the email inbox for the agency response.
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Educational note */}
      <div style={{
        padding: '12px 14px', marginBottom: '18px',
        background: 'rgba(201,168,76,0.08)',
        border: '1px solid rgba(201,168,76,0.3)',
        borderRadius: '6px',
      }}>
        <div style={{ fontSize: '10px', color: 'var(--accent-gold)', letterSpacing: '0.1em', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
          CHAPTER 119, FLORIDA STATUTES
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          Any person may request public records from a governmental entity. The agency must acknowledge the request within 10 business days and produce records promptly. The agency may charge reasonable copying costs but may not charge for time spent determining whether records exist.
        </div>
      </div>

      {/* Category checkboxes */}
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '10px' }}>
        SELECT RECORD CATEGORIES (minimum 2)
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
        {CATEGORIES.map(cat => {
          const isSelected = selected.has(cat.id)
          return (
            <div
              key={cat.id}
              onClick={() => toggleCategory(cat.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '6px', cursor: 'pointer',
                border: `1px solid ${isSelected ? 'var(--accent-gold)' : 'var(--border)'}`,
                background: isSelected ? 'rgba(201,168,76,0.08)' : 'var(--bg-secondary)',
                transition: 'all 150ms ease',
              }}
            >
              <div style={{
                width: '14px', height: '14px', borderRadius: '3px', flexShrink: 0,
                border: `1.5px solid ${isSelected ? 'var(--accent-gold)' : 'var(--border)'}`,
                background: isSelected ? 'var(--accent-gold)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isSelected && (
                  <span style={{ fontSize: '9px', color: '#0f1117', fontWeight: 700, lineHeight: 1 }}>✓</span>
                )}
              </div>
              <span style={{ fontSize: '13px', color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: '1.4' }}>
                {cat.label}
              </span>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '12px', color: selected.size >= 2 ? 'var(--accent-green)' : 'var(--text-muted)' }}>
          {selected.size} categor{selected.size !== 1 ? 'ies' : 'y'} selected
          {selected.size < 2 && ' (select at least 2)'}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {action.hours}h · {action.dailyActionCost} action · +{action.xpReward} XP
        </span>
      </div>

      <button
        onClick={handleSubmit}
        disabled={selected.size < 2}
        style={{
          width: '100%', height: '44px',
          background: selected.size >= 2 ? 'var(--accent-gold)' : 'var(--border)',
          color: selected.size >= 2 ? '#0f1117' : 'var(--text-muted)',
          border: 'none', borderRadius: '6px',
          fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 600,
          cursor: selected.size >= 2 ? 'pointer' : 'not-allowed',
        }}
      >
        Send Public Records Request
      </button>
    </div>
  )
}
