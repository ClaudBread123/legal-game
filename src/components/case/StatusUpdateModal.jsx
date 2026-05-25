import { useState } from 'react'
import { useGameStore } from '../../store/gameStore.js'

const QUESTIONS = [
  {
    id: 'q1',
    label: 'LIABILITY EXPOSURE',
    question: 'Your assessment of current liability exposure:',
    options: [
      { id: 'A', text: 'Minimal — strong immunity or dismissal grounds' },
      { id: 'B', text: 'Moderate — viable defenses, factual issues remain' },
      { id: 'C', text: 'Significant — plaintiff has strong facts' },
      { id: 'D', text: 'Severe — adverse outcome likely' },
    ],
  },
  {
    id: 'q2',
    label: 'DISCOVERY STATUS',
    question: 'Current discovery posture:',
    options: [
      { id: 'A', text: 'Complete — all discovery done' },
      { id: 'B', text: 'In progress — written discovery served, depositions pending' },
      { id: 'C', text: 'Early stage — just initiated' },
      { id: 'D', text: 'Not yet started' },
    ],
  },
  {
    id: 'q3',
    label: 'RECOMMENDED NEXT ACTION',
    question: 'Primary recommended next step:',
    options: [
      { id: 'A', text: 'File or press motion to dismiss' },
      { id: 'B', text: 'Proceed to summary judgment' },
      { id: 'C', text: 'Continue aggressive discovery' },
      { id: 'D', text: 'Evaluate settlement at mediation' },
      { id: 'E', text: 'Escalate to senior partner' },
    ],
  },
  {
    id: 'q4',
    label: 'BUDGET STATUS',
    question: 'Current budget posture:',
    options: [
      { id: 'A', text: 'On track — within approved budget' },
      { id: 'B', text: 'Approaching limit — notification needed' },
      { id: 'C', text: 'Over budget — immediate conference needed' },
    ],
  },
  {
    id: 'q5',
    label: 'OVERALL RECOMMENDATION',
    question: 'Your overall recommendation to client/carrier:',
    options: [
      { id: 'A', text: 'Defend aggressively — strong position' },
      { id: 'B', text: 'Continue defense — manageable exposure' },
      { id: 'C', text: 'Evaluate early settlement — meaningful risk' },
      { id: 'D', text: 'Recommend settlement — exposure significant' },
    ],
  },
]

function letterIndex(l) {
  return 'ABCDE'.indexOf(l)
}

function computeCorrectAnswers(caseObject) {
  const health = caseObject.caseHealth ?? 100
  const completed = caseObject.completedActions || []
  const billed = caseObject.hoursBilled || 0
  const estimated = caseObject.estimatedHours || 40
  const budgetPct = estimated > 0 ? billed / estimated : 0

  const q1 = health >= 80 ? 'A' : health >= 55 ? 'B' : health >= 30 ? 'C' : 'D'

  let q2
  if (completed.includes('written_discovery') && completed.includes('take_plaintiff_depo')) q2 = 'A'
  else if (completed.includes('written_discovery')) q2 = 'B'
  else if (completed.some(a => ['ask_client_for_docs', 'esi_evaluation', 'discovery_log', 'notice_plaintiff_depo'].includes(a))) q2 = 'C'
  else q2 = 'D'

  let q3
  if (!completed.includes('motion_to_dismiss')) q3 = 'A'
  else if (completed.includes('take_plaintiff_depo')) q3 = 'B'
  else if (completed.includes('written_discovery')) q3 = 'C'
  else if (health < 50) q3 = 'D'
  else q3 = 'C'

  const q4 = budgetPct < 0.8 ? 'A' : budgetPct <= 1.0 ? 'B' : 'C'

  const q5 = health >= 70 ? ['A', 'B'] : health >= 40 ? ['B', 'C'] : ['C', 'D']

  return { q1, q2, q3, q4, q5 }
}

function scoreAnswer(questionId, playerAnswer, correct) {
  if (questionId === 'q5') {
    const acceptedArr = Array.isArray(correct) ? correct : [correct]
    if (acceptedArr.includes(playerAnswer)) return { xp: 15, status: 'correct', explanation: null }
    const minDist = Math.min(...acceptedArr.map(a => Math.abs(letterIndex(playerAnswer) - letterIndex(a))))
    if (minDist <= 1) return { xp: 5, status: 'close', explanation: null }
    return { xp: -10, status: 'wrong', explanation: `Recommended: ${acceptedArr.join(' or ')}` }
  }
  const dist = Math.abs(letterIndex(playerAnswer) - letterIndex(correct))
  if (dist === 0) return { xp: 15, status: 'correct', explanation: null }
  if (dist === 1) return { xp: 5, status: 'close', explanation: null }
  return { xp: -10, status: 'wrong', explanation: `Correct answer: ${correct}` }
}

function getExplanation(questionId, correct, caseObject) {
  const health = caseObject.caseHealth ?? 100
  switch (questionId) {
    case 'q1': return `Case health is ${health}/100. ${health >= 80 ? 'Strong position' : health >= 55 ? 'Moderate — defenses viable' : health >= 30 ? 'Compromised — plaintiff has momentum' : 'Seriously compromised — adverse outcome likely'}.`
    case 'q2': {
      const c = caseObject.completedActions || []
      return c.includes('take_plaintiff_depo') ? 'Plaintiff has been deposed — discovery is substantially complete.' : c.includes('written_discovery') ? 'Written discovery is out but depositions have not occurred.' : 'Discovery has not yet been substantially initiated.'
    }
    case 'q3': return `Based on case posture (health: ${health}) and completed actions.`
    case 'q4': {
      const pct = Math.round(((caseObject.hoursBilled || 0) / (caseObject.estimatedHours || 40)) * 100)
      return `${pct}% of estimated budget consumed. ${pct < 80 ? 'On track.' : pct <= 100 ? 'Approaching limit.' : 'Over budget.'}`
    }
    case 'q5': return `Overall case health (${health}/100) drives the recommendation.`
    default: return ''
  }
}

export default function StatusUpdateModal({ caseObject, action, onClose }) {
  const { completeAction, billTime, spendAction, addXP, logActivity, addEmail } = useGameStore()
  const player = useGameStore(s => s.player)
  const currentDate = useGameStore(s => s.currentDate)

  const [answers, setAnswers] = useState({})
  const [results, setResults] = useState(null)

  const allAnswered = QUESTIONS.every(q => answers[q.id])

  function handleSubmit() {
    if (!allAnswered) return
    const correct = computeCorrectAnswers(caseObject)
    const health = caseObject.caseHealth ?? 100

    const scored = QUESTIONS.map(q => {
      const playerAns = answers[q.id]
      const correctAns = correct[q.id]
      const score = scoreAnswer(q.id, playerAns, correctAns)
      const explanation = score.status !== 'correct' ? getExplanation(q.id, correctAns, caseObject) : null
      return { ...q, playerAns, correctAns: Array.isArray(correctAns) ? correctAns.join(' or ') : correctAns, score, explanation }
    })

    const totalXP = scored.reduce((s, r) => s + r.score.xp, 0)
    const positiveXP = Math.max(0, totalXP)

    // Complete action
    completeAction(caseObject.caseId, action.id)
    billTime(caseObject.caseId, action.hours, action.label)
    spendAction(action.dailyActionCost)
    addXP(positiveXP + action.xpReward, `${action.label} on ${caseObject.caseId}`)
    logActivity(`Status report submitted on ${caseObject.caseId}. Score: ${totalXP > 0 ? '+' : ''}${totalXP} XP accuracy bonus.`, 'action')

    // Trigger Onier emails based on accuracy
    const q1Result = scored.find(r => r.id === 'q1')
    if (q1Result?.playerAns === 'A' && health < 40) {
      // Inaccurately assessed minimal exposure on a troubled case
      addEmail({
        from: 'Onier Llopiz',
        fromEmail: 'o.llopiz@llopizwizel.com',
        subject: `Status Report Concern — ${caseObject.caseId}`,
        priority: 'urgent',
        body: `${player.name},

I reviewed your status report on ${caseObject.caseId}. Your assessment of minimal exposure does not reflect the current case posture. Case health is significantly compromised.

We need to discuss your understanding of where this case stands. The client and carrier are relying on your assessment to set reserves and make strategic decisions. An inaccurate assessment at this stage creates real risk.

Please schedule a case review immediately.

— OL`,
      })
    } else if ((q1Result?.playerAns === 'C' || q1Result?.playerAns === 'D') && health < 50 && q1Result?.score.status === 'correct') {
      // Accurately identified a troubled case
      addEmail({
        from: 'Onier Llopiz',
        fromEmail: 'o.llopiz@llopizwizel.com',
        subject: `Good Assessment — ${caseObject.caseId}`,
        priority: 'normal',
        body: `${player.name},

Your status report on ${caseObject.caseId} accurately reflects the current challenges. Accurate reporting to the client and carrier is as important as the litigation itself. The ability to deliver difficult news clearly is what separates good attorneys from great ones.

Keep it up.

— OL`,
      })
    }

    setResults({ scored, totalXP })
  }

  if (results) {
    const totalXP = results.totalXP
    return (
      <div>
        <div style={{
          padding: '12px 14px', borderRadius: '6px', marginBottom: '18px', textAlign: 'center',
          background: totalXP >= 0 ? 'rgba(74,222,128,0.06)' : 'rgba(239,68,68,0.06)',
          border: `1px solid ${totalXP >= 0 ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`,
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 700, color: totalXP >= 0 ? '#4ade80' : 'var(--accent-red)', marginBottom: '4px' }}>
            {totalXP > 0 ? '+' : ''}{totalXP} XP
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>accuracy bonus (plus +{action.xpReward} XP base)</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
          {results.scored.map(r => (
            <div key={r.id} style={{
              padding: '10px 12px', borderRadius: '6px',
              background: r.score.status === 'correct' ? 'rgba(74,222,128,0.05)' : r.score.status === 'close' ? 'rgba(201,168,76,0.05)' : 'rgba(239,68,68,0.05)',
              border: `1px solid ${r.score.status === 'correct' ? 'rgba(74,222,128,0.2)' : r.score.status === 'close' ? 'rgba(201,168,76,0.2)' : 'rgba(239,68,68,0.2)'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
                  {r.label}
                </span>
                <span style={{
                  fontSize: '10px', fontFamily: 'var(--font-mono)',
                  color: r.score.status === 'correct' ? '#4ade80' : r.score.status === 'close' ? 'var(--accent-gold)' : 'var(--accent-red)',
                }}>
                  {r.score.xp > 0 ? '+' : ''}{r.score.xp} XP
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: r.explanation ? '4px' : '0' }}>
                Your answer: {r.playerAns} · {r.score.status === 'correct' ? '✓ Correct' : `Correct: ${r.correctAns}`}
              </div>
              {r.explanation && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: '1.4' }}>
                  {r.explanation}
                </div>
              )}
            </div>
          ))}
        </div>

        <button onClick={onClose} style={{
          width: '100%', height: '44px',
          background: 'var(--accent-gold)', color: '#0f1117',
          border: 'none', borderRadius: '6px',
          fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 600, cursor: 'pointer',
        }}>
          Close
        </button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: '1.5' }}>
        Summarize current case posture for client and carrier. Accuracy is as important as the litigation itself.
      </div>

      {QUESTIONS.map(q => (
        <div key={q.id} style={{ marginBottom: '18px' }}>
          <div style={{ fontSize: '10px', color: 'var(--accent-gold)', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>
            {q.label}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: '1.4' }}>
            {q.question}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {q.options.map(opt => {
              const isSelected = answers[q.id] === opt.id
              return (
                <div
                  key={opt.id}
                  onClick={() => setAnswers(a => ({ ...a, [q.id]: opt.id }))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 12px', borderRadius: '6px', cursor: 'pointer',
                    border: `1px solid ${isSelected ? 'var(--accent-gold)' : 'var(--border)'}`,
                    background: isSelected ? 'rgba(201,168,76,0.08)' : 'var(--bg-secondary)',
                    transition: 'all 150ms ease',
                  }}
                >
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700,
                    color: isSelected ? 'var(--accent-gold)' : 'var(--text-muted)',
                    flexShrink: 0, width: '14px',
                  }}>
                    {opt.id}
                  </span>
                  <span style={{ fontSize: '12px', color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {opt.text}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <button
        onClick={handleSubmit}
        disabled={!allAnswered}
        style={{
          width: '100%', height: '44px',
          background: allAnswered ? 'var(--accent-gold)' : 'var(--border)',
          color: allAnswered ? '#0f1117' : 'var(--text-muted)',
          border: 'none', borderRadius: '6px',
          fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 600,
          cursor: allAnswered ? 'pointer' : 'not-allowed',
        }}
      >
        {allAnswered ? 'Submit Status Report' : 'Answer all questions to submit'}
      </button>
    </div>
  )
}
