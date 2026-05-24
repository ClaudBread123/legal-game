import { useState } from 'react'
import { useGameStore } from '../store/gameStore.js'
import { formatGameDate } from '../utils/dateUtils.js'
import { BILLING_RATE } from '../data/issueTypes.js'

export default function Timekeeping() {
  const {
    currentDate, timekeepingEntries, timekeepingSubmitted,
    submitTimekeeping, monthlyBillableHours,
  } = useGameStore()

  const todayEntries = (timekeepingEntries[currentDate] || []).map(e => ({ ...e }))
  const isSubmitted = !!(currentDate && timekeepingSubmitted[currentDate])

  const [manualRows, setManualRows] = useState([])

  const allRows = [...todayEntries, ...manualRows]
  const totalHoursToday = allRows.reduce((s, e) => s + (parseFloat(e.hours) || 0), 0)
  const totalAmountToday = totalHoursToday * BILLING_RATE

  const delinquent = !isSubmitted && todayEntries.length === 0

  const addManualRow = () => {
    setManualRows(prev => [...prev, { id: `manual-${Date.now()}`, caseId: '', description: '', hours: 0, amount: 0, manual: true }])
  }

  const updateManualRow = (id, field, value) => {
    setManualRows(prev => prev.map(r => {
      if (r.id !== id) return r
      const updated = { ...r, [field]: value }
      if (field === 'hours') updated.amount = (parseFloat(value) || 0) * BILLING_RATE
      return updated
    }))
  }

  const handleSubmit = () => {
    if (isSubmitted || !currentDate) return
    const allDescFilled = allRows.every(r => r.description && r.description.trim())
    if (!allDescFilled) {
      alert('Please fill in a description for all time entries before submitting.')
      return
    }
    submitTimekeeping(currentDate)
  }

  return (
    <div style={{ padding: '32px', maxWidth: '860px', margin: '0 auto' }}>
      {delinquent && !isSubmitted && (
        <div style={{
          background: 'rgba(224,82,82,0.1)', border: '1px solid var(--accent-red)',
          borderRadius: '8px', padding: '12px 16px', marginBottom: '20px',
          color: 'var(--accent-red)', fontSize: '13px', fontWeight: 600,
        }}>
          TIMEKEEPING DELINQUENT — Submit your entries immediately. Managing Partner has been notified.
        </div>
      )}

      <div style={{ marginBottom: '28px' }}>
        <h1 style={{
          fontFamily: 'var(--font-serif)', fontSize: '24px', margin: '0 0 4px',
          color: 'var(--text-primary)', letterSpacing: '0.05em',
        }}>
          DAILY TIME ENTRY
        </h1>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {currentDate ? formatGameDate(currentDate) : '—'}
        </div>
      </div>

      {isSubmitted ? (
        <div style={{
          background: 'rgba(76,175,130,0.08)', border: '1px solid var(--accent-green)',
          borderRadius: '8px', padding: '32px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>✓</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--accent-green)', marginBottom: '6px' }}>
            Timesheet Submitted
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {totalHoursToday.toFixed(1)}h — ${totalAmountToday.toLocaleString()} billed today
          </div>
        </div>
      ) : (
        <>
          {/* Entry table */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '8px', overflow: 'hidden', marginBottom: '16px',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Matter', 'Description', 'Hours', 'Amount'].map(h => (
                    <th key={h} style={{
                      padding: '11px 16px', textAlign: 'left',
                      fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em',
                      fontWeight: 600, fontFamily: 'var(--font-sans)',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{
                      padding: '28px 16px', textAlign: 'center',
                      fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic',
                    }}>
                      No time entries yet today. Take actions on your cases to generate entries,
                      or add a manual entry below.
                    </td>
                  </tr>
                ) : allRows.map(entry => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 16px' }}>
                      {entry.manual ? (
                        <input
                          value={entry.caseId}
                          onChange={e => updateManualRow(entry.id, 'caseId', e.target.value)}
                          placeholder="LW-YYYY-NNNN"
                          style={{
                            width: '130px', fontFamily: 'var(--font-mono)', fontSize: '11px',
                            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                            borderRadius: '4px', color: 'var(--text-muted)', padding: '4px 6px',
                          }}
                        />
                      ) : (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
                          {entry.caseId}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      {entry.manual ? (
                        <input
                          value={entry.description}
                          onChange={e => updateManualRow(entry.id, 'description', e.target.value)}
                          placeholder="Description of work…"
                          style={{
                            width: '100%', fontSize: '13px',
                            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                            borderRadius: '4px', color: 'var(--text-secondary)', padding: '4px 8px',
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {entry.description}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      {entry.manual ? (
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={entry.hours}
                          onChange={e => updateManualRow(entry.id, 'hours', e.target.value)}
                          style={{
                            width: '70px', fontFamily: 'var(--font-mono)', fontSize: '13px',
                            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                            borderRadius: '4px', color: 'var(--accent-gold)', padding: '4px 6px',
                            textAlign: 'right',
                          }}
                        />
                      ) : (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--accent-gold)' }}>
                          {parseFloat(entry.hours).toFixed(1)}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--accent-gold)' }}>
                        ${(parseFloat(entry.hours || 0) * BILLING_RATE).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}

                {/* Totals row */}
                {allRows.length > 0 && (
                  <tr style={{ borderTop: '2px solid var(--border)', background: 'rgba(201,168,76,0.04)' }}>
                    <td colSpan={2} style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                      TOTAL TODAY
                    </td>
                    <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--accent-gold)', fontWeight: 600 }}>
                      {totalHoursToday.toFixed(1)}h
                    </td>
                    <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--accent-gold)', fontWeight: 600 }}>
                      ${totalAmountToday.toLocaleString()}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <button
            onClick={addManualRow}
            style={{
              background: 'none', border: '1px dashed var(--border)',
              borderRadius: '6px', color: 'var(--text-muted)', fontSize: '13px',
              padding: '8px 16px', cursor: 'pointer', marginBottom: '20px',
              width: '100%', transition: 'all 150ms ease',
            }}
          >
            + Add Manual Entry
          </button>

          {/* Monthly summary */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '18px', marginBottom: '20px',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '12px', fontWeight: 600 }}>
              MONTHLY SUMMARY
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Billable hours this month</span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '14px',
                color: monthlyBillableHours >= 165 ? 'var(--accent-green)' : 'var(--accent-yellow)',
              }}>
                {monthlyBillableHours.toFixed(1)}h / 165–200h target
              </span>
            </div>
            <div style={{ height: '5px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden', marginBottom: '6px' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, (monthlyBillableHours / 200) * 100)}%`,
                background: monthlyBillableHours >= 165 ? 'var(--accent-green)' : 'var(--accent-yellow)',
                borderRadius: '3px',
              }} />
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              ${(monthlyBillableHours * BILLING_RATE).toLocaleString()} billed this month
              {monthlyBillableHours >= 165
                ? ' — On target ✓'
                : ` — ${(165 - monthlyBillableHours).toFixed(1)}h below minimum`}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            style={{
              width: '100%', height: '48px',
              background: 'var(--accent-gold)', color: '#0f1117',
              border: 'none', borderRadius: '6px',
              fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Submit Timesheet
          </button>
        </>
      )}
    </div>
  )
}
