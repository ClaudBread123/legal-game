import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Modal from '../shared/Modal.jsx'
import { evaluateResponse } from '../../api/evaluateResponse.js'
import ComplaintSlideOver from './ComplaintSlideOver.jsx'

const INSTRUCTIONS = {
  motion_to_dismiss: (c) =>
    `You are preparing a Motion to Dismiss in the matter of ${c.clientName} v. ${c.defendant}.\n\nReview the complaint above and provide your analysis: What grounds will you assert? Why does each ground apply to these specific facts? What is your strategic priority among the grounds?\n\nReference specific Florida statutes. Consider the incident date and applicable law. There is no single right answer — demonstrate your legal reasoning.`,
  initial_evaluation: (c) =>
    `You are preparing the initial liability evaluation for ${c.defendant} in the matter of ${c.clientName} v. ${c.defendant}.\n\nAssess: What is the realistic liability exposure? Which defenses are strongest? What are the weaknesses? What is the applicable damages cap under §768.28(5) and why? What is your recommended strategy?\n\nBe honest about exposure. Cite specific statutes. This report goes to the client and carrier.`,
}

const RATING_CONFIG = {
  EXCELLENT: { color: 'var(--accent-gold)', icon: '★', label: 'EXCELLENT' },
  GOOD: { color: '#4a9eff', icon: '✓', label: 'GOOD' },
  ADEQUATE: { color: 'var(--text-secondary)', icon: '◆', label: 'ADEQUATE' },
  POOR: { color: 'var(--accent-yellow)', icon: '⚠', label: 'POOR' },
  DEFICIENT: { color: 'var(--accent-red)', icon: '✕', label: 'DEFICIENT' },
}

// ── Step 1: Context ─────────────────────────────────────
function ContextStep({ action, checkData, caseObject, onBegin }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--text-primary)', marginBottom: '20px' }}>
        {action.label}
      </div>

      {checkData?.actionContext && (
        <div style={{
          padding: '14px 16px', marginBottom: '16px',
          background: 'rgba(201,168,76,0.08)', border: '1px solid var(--accent-gold)', borderRadius: '8px',
        }}>
          <div style={{ fontSize: '10px', color: 'var(--accent-gold)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '6px' }}>CASE CONTEXT</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{checkData.actionContext}</div>
        </div>
      )}

      {/* Fact scenario */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '6px' }}>FACT SCENARIO</div>
        <div style={{
          padding: '12px 14px', background: 'var(--bg-secondary)',
          borderLeft: '3px solid var(--accent-blue)', borderRadius: '4px',
          fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', maxHeight: '180px', overflowY: 'auto',
        }}>
          {caseObject.factScenario}
        </div>
      </div>

      {/* Claims */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '6px' }}>CLAIMS ASSERTED</div>
        <ol style={{ paddingLeft: '18px', margin: 0 }}>
          {(caseObject.claimsAsserted || []).map((c, i) => (
            <li key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>{c}</li>
          ))}
        </ol>
      </div>

      {checkData?.keyStatutes?.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '6px' }}>KEY STATUTES</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {checkData.keyStatutes.map(s => (
              <span key={s} style={{ padding: '3px 10px', borderRadius: '12px', background: 'rgba(74,158,255,0.12)', border: '1px solid rgba(74,158,255,0.3)', fontSize: '11px', color: '#4a9eff', fontFamily: 'var(--font-mono)' }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      <button onClick={onBegin} style={{
        width: '100%', height: '44px', background: 'var(--accent-gold)', color: '#0f1117',
        border: 'none', borderRadius: '6px', fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 600, cursor: 'pointer',
      }}>
        Begin Analysis →
      </button>
    </div>
  )
}

// ── Step 2: Textarea ────────────────────────────────────
function AnalysisStep({ action, caseObject, onSubmit, onViewComplaint }) {
  const [text, setText] = useState('')
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length
  const ready = wordCount >= 50
  const instruction = INSTRUCTIONS[action.id]?.(caseObject) || `Provide your analysis of this action on ${caseObject.caseId}.`

  return (
    <div>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--text-primary)', marginBottom: '14px', lineHeight: '1.4' }}>
        {action.label}
      </div>

      <div style={{
        padding: '12px 14px', marginBottom: '14px', background: 'var(--bg-secondary)',
        border: '1px solid var(--border)', borderRadius: '6px',
        fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.65', whiteSpace: 'pre-line',
        position: 'relative',
      }}>
        {onViewComplaint && (
          <button
            onClick={onViewComplaint}
            style={{
              float: 'right', marginLeft: '8px',
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              padding: '3px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              fontFamily: 'var(--font-sans)',
            }}
          >
            View Complaint
          </button>
        )}
        {instruction}
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Write your analysis here. Be specific — reference the case facts, cite statutes, explain your reasoning. Minimum 50 words."
        style={{
          width: '100%', minHeight: '200px', padding: '12px 14px',
          background: 'var(--bg-secondary)',
          border: `1px solid ${ready ? 'var(--accent-gold)' : 'var(--border)'}`,
          borderRadius: '6px', color: 'var(--text-primary)', resize: 'vertical',
          fontFamily: 'var(--font-sans)', fontSize: '15px', lineHeight: '1.7',
          boxSizing: 'border-box', marginBottom: '8px', outline: 'none',
          transition: 'border-color 200ms ease',
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '11px',
          color: ready ? 'var(--accent-gold)' : 'var(--text-muted)',
        }}>
          {wordCount} words {!ready && `(${50 - wordCount} more needed)`}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Your response will be evaluated by AI specific to this case's facts
        </span>
      </div>

      <button
        onClick={() => ready && onSubmit(text)}
        disabled={!ready}
        style={{
          width: '100%', height: '44px',
          background: ready ? 'var(--accent-gold)' : 'var(--border)',
          color: ready ? '#0f1117' : 'var(--text-muted)',
          border: 'none', borderRadius: '6px',
          fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 600,
          cursor: ready ? 'pointer' : 'not-allowed',
        }}
      >
        Submit for Evaluation →
      </button>
    </div>
  )
}

// ── Step 3: Loading ─────────────────────────────────────
function EvaluatingStep() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'rgba(201,168,76,0.15)', border: '2px solid var(--accent-gold)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--accent-gold)',
        }}
      >
        OL
      </motion.div>
      <div style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
        Onier Llopiz is reviewing your analysis...
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        This takes 20–30 seconds
      </div>
    </div>
  )
}

// ── Step 4: Results ─────────────────────────────────────
function ResultsStep({ evaluation, action, onComplete }) {
  const rating = evaluation.rating || 'ADEQUATE'
  const cfg = RATING_CONFIG[rating] || RATING_CONFIG.ADEQUATE
  const baseXP = action.xpReward || 50
  const multiplier = evaluation.xpMultiplier ?? 0.6
  const isScreened = evaluation.screened === true
  const earnedXP = isScreened ? -25 : Math.round(baseXP * multiplier)

  return (
    <div>
      {/* Rating */}
      <div style={{
        textAlign: 'center', padding: '24px 20px', marginBottom: '20px',
        background: `${cfg.color}10`, border: `1px solid ${cfg.color}44`, borderRadius: '10px',
      }}>
        <div style={{ fontSize: '36px', color: cfg.color, marginBottom: '6px' }}>{cfg.icon}</div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', color: cfg.color }}>{cfg.label}</div>
      </div>

      {/* Onier's assessment */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '8px' }}>ONIER'S ASSESSMENT</div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: '1.6' }}>
          {evaluation.summary}
        </div>
      </div>

      {/* Strengths */}
      {evaluation.strengths?.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '10px', color: 'var(--accent-green)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '6px' }}>WHAT YOU GOT RIGHT</div>
          {evaluation.strengths.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '4px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              <span style={{ color: 'var(--accent-green)', flexShrink: 0 }}>●</span>
              {s}
            </div>
          ))}
        </div>
      )}

      {/* Gaps */}
      {evaluation.gaps?.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '10px', color: 'var(--accent-red)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '6px' }}>WHAT YOU MISSED OR COULD IMPROVE</div>
          {evaluation.gaps.map((g, i) => (
            <div key={i} style={{
              padding: '10px 12px', marginBottom: '6px',
              background: 'rgba(239,68,68,0.05)', border: '1px solid var(--accent-red)33',
              borderRadius: '6px',
            }}>
              <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '3px' }}>{g.issue}</div>
              {g.consequence && <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '3px' }}>{g.consequence}</div>}
              {g.statute && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#4a9eff' }}>{g.statute}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Model approach */}
      {evaluation.modelApproach && (
        <div style={{
          padding: '12px 14px', marginBottom: '14px',
          borderLeft: '3px solid var(--accent-gold)', background: 'rgba(201,168,76,0.06)', borderRadius: '4px',
        }}>
          <div style={{ fontSize: '10px', color: 'var(--accent-gold)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '6px' }}>MODEL APPROACH</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{evaluation.modelApproach}</div>
        </div>
      )}

      {/* Onier's note */}
      {evaluation.oniersNote && (
        <div style={{
          padding: '12px 14px', marginBottom: '16px',
          background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.6', marginBottom: '6px' }}>
            {evaluation.oniersNote}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--accent-gold)', fontFamily: 'var(--font-serif)' }}>— OL</div>
        </div>
      )}

      {/* XP */}
      {isScreened && (
        <div style={{
          padding: '10px 12px', marginBottom: '14px',
          background: 'rgba(239,68,68,0.08)', border: '1px solid var(--accent-red)44',
          borderRadius: '6px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.5',
        }}>
          This response was screened before AI evaluation. You may attempt this action again unless this is your second failed attempt.
        </div>
      )}

      <div style={{
        padding: '12px 16px', marginBottom: '16px',
        background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          {isScreened ? (
            <>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                Screened — XP penalty
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', color: 'var(--accent-red)', fontWeight: 700 }}>
                {earnedXP} XP
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                Base: +{baseXP} XP × {Math.round(multiplier * 100)}%
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', color: 'var(--accent-green)', fontWeight: 700 }}>
                +{earnedXP} XP
              </div>
            </>
          )}
        </div>
        <div style={{ fontSize: '24px', color: cfg.color }}>{cfg.icon}</div>
      </div>

      <button
        onClick={() => onComplete(evaluation.qualityScore ?? 2, earnedXP, isScreened)}
        style={{
          width: '100%', height: '44px',
          background: cfg.color, color: rating === 'ADEQUATE' ? 'var(--text-primary)' : '#0f1117',
          border: 'none', borderRadius: '6px',
          fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 600, cursor: 'pointer',
        }}
      >
        Complete Action →
      </button>
    </div>
  )
}

// ── Main Modal ──────────────────────────────────────────
export default function FreeTextActionModal({
  isOpen, onClose, onComplete, action, caseObject, playerTitle, checkData,
}) {
  const [step, setStep] = useState(1)
  const [evaluation, setEvaluation] = useState(null)
  const [playerText, setPlayerText] = useState('')
  const [complaintOpen, setComplaintOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setEvaluation(null)
      setPlayerText('')
      setComplaintOpen(false)
    }
  }, [isOpen])

  const handleSubmitText = async (text) => {
    setPlayerText(text)
    setStep(3)
    try {
      const result = await evaluateResponse({
        caseObject,
        actionId: action?.id,
        actionLabel: action?.label,
        playerResponse: text,
        playerTitle: playerTitle || 'Junior Associate',
        checkData,
      })
      setEvaluation(result)
      setStep(4)
    } catch {
      setEvaluation({
        rating: 'ADEQUATE', qualityScore: 2, xpMultiplier: 0.6,
        summary: 'Response submitted. Evaluation unavailable.',
        strengths: [], gaps: [], modelApproach: '', oniersNote: 'Keep going.',
      })
      setStep(4)
    }
  }

  if (!isOpen || !action) return null

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={step < 4 ? onClose : undefined}
        title={step === 4 ? 'Evaluation Results' : step === 3 ? 'Evaluating…' : 'Case Analysis'}
        wide
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {step === 1 && (
              <ContextStep
                action={action}
                checkData={checkData}
                caseObject={caseObject}
                onBegin={() => setStep(2)}
              />
            )}
            {step === 2 && (
              <AnalysisStep
                action={action}
                caseObject={caseObject}
                onSubmit={handleSubmitText}
                onViewComplaint={() => setComplaintOpen(true)}
              />
            )}
            {step === 3 && <EvaluatingStep />}
            {step === 4 && evaluation && (
              <ResultsStep
                evaluation={evaluation}
                action={action}
                onComplete={onComplete}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </Modal>
      <ComplaintSlideOver
        isOpen={complaintOpen}
        onClose={() => setComplaintOpen(false)}
        caseObject={caseObject}
      />
    </>
  )
}
