import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore.js'
import { calculateDeadlines } from '../../utils/deadlineEngine.js'
import { daysBetween, formatShortDate } from '../../utils/dateUtils.js'
import StatusDot from '../shared/StatusDot.jsx'
import { DEADLINE_KEY_TO_EXTENSION, EXTENSION_SCENARIOS } from '../../data/extensionRequests.js'

const DEADLINE_LABELS = {
  answerDue: 'Answer / MTD Due',
  mtdHearingRecommended: 'MTD Hearing (Rec.)',
  removalDeadline: 'Removal Deadline',
  respondToPlaintiffDiscovery: "Respond to Pltf. Discovery",
  plaintiffExpertDisclosure: "Plaintiff's Expert Disc.",
  defendantExpertDisclosure: "Defendant's Expert Disc.",
  discoveryCloses: 'Discovery Closes',
  summaryJudgmentDeadline: 'Summary Judgment',
  mediationDeadline: 'Mediation',
  trialDate: 'Trial Date',
}

function ExtensionModal({ caseObject, deadlineKey, onClose }) {
  const { requestExtension } = useGameStore()
  const [result, setResult] = useState(null)

  const scenarioId = DEADLINE_KEY_TO_EXTENSION[deadlineKey]
  const scenario = scenarioId ? EXTENSION_SCENARIOS[scenarioId] : null
  if (!scenario) return null

  function handleRequest() {
    const outcome = requestExtension(caseObject.caseId, scenarioId)
    setResult(outcome)
  }

  if (result) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1300,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)',
      }} onClick={onClose}>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '10px', padding: '28px', maxWidth: '400px', width: '90%',
        }} onClick={e => e.stopPropagation()}>
          <div style={{
            fontSize: '13px', fontWeight: 700, marginBottom: '14px',
            color: result.granted ? 'var(--accent-green)' : 'var(--accent-red)',
          }}>
            {result.granted ? '✓ Extension Granted' : '✗ Extension Denied'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: '1.6' }}>
            {result.granted
              ? `The deadline has been extended by ${scenario.daysGranted} days. Check your email for confirmation.`
              : scenario.ifDenied?.note || 'The request was denied. You must meet the original deadline.'}
          </div>
          <button onClick={onClose} style={{
            width: '100%', padding: '10px', borderRadius: '6px',
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            color: 'var(--text-primary)', fontSize: '12px', cursor: 'pointer',
          }}>
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1300,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '10px', padding: '28px', maxWidth: '420px', width: '90%',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
          {scenario.label}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Request to {scenario.emailTo}
        </div>

        <div style={{
          background: 'var(--bg-secondary)', borderRadius: '7px', padding: '14px',
          marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              +{scenario.daysGranted}d
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>if granted</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-yellow)', fontFamily: 'var(--font-mono)' }}>
              {Math.round(scenario.probabilityGranted * 100)}%
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>chance granted</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-red)', fontFamily: 'var(--font-mono)' }}>
              -{scenario.healthCost}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>health cost</div>
          </div>
        </div>

        <div style={{
          fontSize: '11px', color: 'var(--accent-yellow)', background: 'rgba(255,193,7,0.08)',
          border: '1px solid rgba(255,193,7,0.2)', borderRadius: '6px', padding: '10px',
          marginBottom: '18px', lineHeight: '1.5',
        }}>
          ⚠ Health cost applies regardless of outcome. Repeated extensions may draw attention from Onier.
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '10px', borderRadius: '6px',
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer',
          }}>
            Cancel
          </button>
          <button onClick={handleRequest} style={{
            flex: 1, padding: '10px', borderRadius: '6px',
            background: 'var(--accent-blue)', border: 'none',
            color: '#fff', fontSize: '12px', cursor: 'pointer', fontWeight: 600,
          }}>
            Request Extension
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DeadlinePanel({ caseObject }) {
  const { currentDate } = useGameStore()
  const [extensionModal, setExtensionModal] = useState(null)
  const deadlines = calculateDeadlines(caseObject)

  const items = Object.entries(deadlines)
    .filter(([, date]) => date)
    .map(([key, date]) => ({
      key, label: DEADLINE_LABELS[key] || key, date,
      days: currentDate ? daysBetween(currentDate, date) : null,
      hasExtension: !!DEADLINE_KEY_TO_EXTENSION[key],
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6)

  return (
    <>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '8px', padding: '18px',
      }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '12px', fontWeight: 600 }}>
          UPCOMING DEADLINES
        </div>

        {items.map(item => {
          const overdue = item.days !== null && item.days < 0
          const imminent = item.days !== null && item.days >= 0 && item.days <= 7
          const status = overdue ? 'critical' : imminent || (item.days !== null && item.days <= 14) ? 'major' : 'info'

          const rowStyle = {
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            padding: '7px 0', borderBottom: '1px solid var(--border)',
            background: overdue ? 'rgba(224,82,82,0.06)' : 'transparent',
            borderRadius: overdue ? '4px' : 0,
            paddingLeft: overdue ? '6px' : 0,
          }

          const dateBlock = (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                {formatShortDate(item.date)}
              </div>
              {item.days !== null && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: overdue ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                  {overdue ? `${Math.abs(item.days)}d over` : `${item.days}d`}
                </div>
              )}
              {overdue && (
                <span style={{ fontSize: '9px', background: 'var(--accent-red)', color: '#fff', borderRadius: '3px', padding: '1px 4px' }}>
                  OVERDUE
                </span>
              )}
              {item.hasExtension && !overdue && (
                <button
                  onClick={() => setExtensionModal(item.key)}
                  style={{
                    display: 'block', marginTop: '3px', fontSize: '9px',
                    color: 'var(--accent-blue)', background: 'none', border: 'none',
                    cursor: 'pointer', padding: 0, textDecoration: 'underline',
                    textAlign: 'right',
                  }}
                >
                  ext. request
                </button>
              )}
            </div>
          )

          const labelBlock = (
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flex: 1 }}>
              {imminent ? (
                <motion.span
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                  style={{
                    display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                    backgroundColor: 'var(--accent-red)', flexShrink: 0,
                  }}
                />
              ) : (
                <StatusDot status={status} size={6} />
              )}
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                {item.label}
              </span>
            </div>
          )

          return overdue ? (
            <motion.div
              key={item.key}
              style={rowStyle}
              animate={{ opacity: [1, 0.55, 1] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            >
              {labelBlock}
              {dateBlock}
            </motion.div>
          ) : (
            <div key={item.key} style={rowStyle}>
              {labelBlock}
              {dateBlock}
            </div>
          )
        })}
      </div>

      {extensionModal && (
        <ExtensionModal
          caseObject={caseObject}
          deadlineKey={extensionModal}
          onClose={() => setExtensionModal(null)}
        />
      )}
    </>
  )
}
