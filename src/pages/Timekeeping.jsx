import { useState } from 'react'
import { useGameStore } from '../store/gameStore.js'
import { formatGameDate } from '../utils/dateUtils.js'
import { BILLING_RATE } from '../data/issueTypes.js'
import { SALARY_TARGETS } from '../data/careerLadder.js'

export default function Timekeeping() {
  const { currentDate, timekeepingEntries, timekeepingSubmitted, submitTimekeeping, monthlyBillableHours, player } = useGameStore()
  const [manualEntry, setManualEntry] = useState({ caseId: '', description: '', hours: '' })

  const todayEntries = timekeepingEntries[currentDate] || []
  const isSubmitted = timekeepingSubmitted[currentDate]

  const totalHoursToday = todayEntries.reduce((s, e) => s + (e.hours || 0), 0)
  const totalAmountToday = totalHoursToday * BILLING_RATE

  // Check for 2+ consecutive unsubmitted days (simple check)
  const delinquent = !isSubmitted && todayEntries.length === 0

  const handleSubmit = () => {
    if (isSubmitted) return
    submitTimekeeping(currentDate)
  }

  return (
    <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
      {delinquent && (
        <div style={{
          background: 'rgba(224,82,82,0.1)', border: '1px solid var(--accent-red)',
          borderRadius: '8px', padding: '12px 16px', marginBottom: '20px',
          color: 'var(--accent-red)', fontSize: '13px', fontWeight: 600,
        }}>
          TIMEKEEPING DELINQUENT — Managing Partner has been notified. Submit your entries immediately.
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', margin: '0 0 4px', color: 'var(--text-primary)' }}>
          Daily Time Entry
        </h1>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {currentDate ? formatGameDate(currentDate) : '—'}
        </div>
      </div>

      {isSubmitted ? (
        <div style={{
          background: 'rgba(76,175,130,0.1)', border: '1px solid var(--accent-green)',
          borderRadius: '8px', padding: '20px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '20px', marginBottom: '8px' }}>✓</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', color: 'var(--accent-green)' }}>
            Timesheet Submitted
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {totalHoursToday.toFixed(1)}h — ${totalAmountToday.toLocaleString()} billed today
          </div>
        </div>
      ) : (
        <>
          {/* Entries table */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Matter', 'Description', 'Hours', 'Amount'].map(h => (
                    <th key={h} style={{
                      padding: '12px 16px', textAlign: 'left',
                      fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em',
                      fontWeight: 600, fontFamily: 'var(--font-sans)',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {todayEntries.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '20px 16px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No entries yet today. Actions you take will auto-populate here.
                    </td>
                  </tr>
                ) : todayEntries.map(entry => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>{entry.caseId}</td>
                    <td style={{ padding: '10px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{entry.description}</td>
                    <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--accent-gold)' }}>{entry.hours.toFixed(1)}</td>
                    <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--accent-gold)' }}>${(entry.amount).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total today</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)', fontSize: '16px' }}>
                {totalHoursToday.toFixed(1)}h = ${totalAmountToday.toLocaleString()}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Monthly total</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: '14px' }}>
                {monthlyBillableHours.toFixed(1)}h
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              <span>Target: 165–200h/month</span>
              <span style={{ color: monthlyBillableHours >= 165 ? 'var(--accent-green)' : 'var(--accent-yellow)' }}>
                {monthlyBillableHours >= 165 ? 'On target' : 'Below target'}
              </span>
            </div>
            <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${Math.min(100, (monthlyBillableHours / 200) * 100)}%`,
                background: monthlyBillableHours >= 165 ? 'var(--accent-green)' : 'var(--accent-yellow)',
                borderRadius: '2px',
              }} />
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
