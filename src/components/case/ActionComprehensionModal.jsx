import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Modal from '../shared/Modal.jsx'
import FirmLogo from '../shared/FirmLogo.jsx'

function computeQuality(answersRecord) {
  if (answersRecord.length === 0) return 3
  let total = 0
  let max = 0
  for (const a of answersRecord) {
    const xp = a.xpValue || 25
    max += xp
    if (a.type === 'multiple_choice') {
      total += a.correct ? xp : 0
    } else if (a.type === 'short_answer') {
      total += a.selfScore === 'fully' ? xp : a.selfScore === 'partially' ? Math.round(xp * 0.5) : 0
    }
  }
  const pct = max > 0 ? total / max : 1
  if (pct >= 0.8) return 3
  if (pct >= 0.5) return 2
  return 1
}

function computeXPEarned(answersRecord) {
  return answersRecord.reduce((sum, a) => {
    const xp = a.xpValue || 25
    if (a.type === 'multiple_choice') return sum + (a.correct ? xp : 0)
    if (a.type === 'short_answer') {
      return sum + (a.selfScore === 'fully' ? xp : a.selfScore === 'partially' ? Math.round(xp * 0.5) : 0)
    }
    return sum
  }, 0)
}

// ── Step 0: Loading ─────────────────────────────────────
function LoadingStep() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '60px 20px', gap: '20px',
    }}>
      <FirmLogo size="sm" />
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: '40px', height: '4px', borderRadius: '2px',
          background: 'var(--accent-gold)',
        }}
      />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
          Preparing case-specific assessment...
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          This takes about 10 seconds
        </div>
      </div>
    </div>
  )
}

// ── Step 1: Action Context ──────────────────────────────
function ContextStep({ action, checkData, onBegin }) {
  return (
    <div style={{ padding: '4px 0' }}>
      <div style={{
        fontFamily: 'var(--font-serif)', fontSize: '22px',
        color: 'var(--text-primary)', marginBottom: '20px', lineHeight: '1.3',
      }}>
        {action.label}
      </div>

      {/* AI-generated strategic context */}
      <div style={{
        padding: '14px 16px', marginBottom: '16px',
        background: 'rgba(201,168,76,0.08)',
        border: '1px solid var(--accent-gold)',
        borderRadius: '8px',
      }}>
        <div style={{
          fontSize: '10px', color: 'var(--accent-gold)', letterSpacing: '0.1em',
          fontWeight: 700, marginBottom: '8px', fontFamily: 'var(--font-sans)',
        }}>
          CASE CONTEXT
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          {checkData.actionContext}
        </div>
      </div>

      {/* Key statutes */}
      {checkData.keyStatutes?.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em',
            fontWeight: 700, marginBottom: '8px', fontFamily: 'var(--font-sans)',
          }}>
            KEY STATUTES
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {checkData.keyStatutes.map(s => (
              <span key={s} style={{
                padding: '3px 10px', borderRadius: '12px',
                background: 'rgba(74,158,255,0.12)',
                border: '1px solid rgba(74,158,255,0.3)',
                fontSize: '11px', color: '#4a9eff',
                fontFamily: 'var(--font-mono)',
              }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Strategic note from action data */}
      {action.strategicNote && (
        <div style={{
          padding: '12px 14px', marginBottom: '20px',
          background: 'rgba(201,168,76,0.05)',
          borderLeft: '3px solid var(--accent-gold)',
          borderRadius: '4px',
        }}>
          <div style={{
            fontSize: '12px', color: 'var(--accent-gold)',
            fontStyle: 'italic', lineHeight: '1.5',
          }}>
            {action.strategicNote}
          </div>
        </div>
      )}

      <button
        onClick={onBegin}
        style={{
          width: '100%', height: '44px',
          background: 'var(--accent-gold)', color: '#0f1117',
          border: 'none', borderRadius: '6px',
          fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 600,
          cursor: 'pointer', marginBottom: '8px',
        }}
      >
        Begin Assessment →
      </button>
      <div style={{
        textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)',
        fontStyle: 'italic',
      }}>
        You must answer correctly to complete this action at full quality.
      </div>
    </div>
  )
}

// ── MC Question Card ────────────────────────────────────
function MCQuestion({ question, onAnswerComplete }) {
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  const isCorrect = submitted && selected === question.correctAnswer

  const optionBorder = (key) => {
    if (!submitted) return selected === key ? 'var(--accent-gold)' : 'var(--border)'
    if (key === question.correctAnswer) return '#4caf82'
    if (key === selected && !isCorrect) return 'var(--accent-red)'
    return 'var(--border)'
  }

  const optionBg = (key) => {
    if (!submitted) return selected === key ? 'rgba(201,168,76,0.08)' : 'var(--bg-card)'
    if (key === question.correctAnswer) return 'rgba(76,175,130,0.08)'
    if (key === selected && !isCorrect) return 'rgba(239,68,68,0.06)'
    return 'var(--bg-card)'
  }

  const handleSubmit = () => {
    if (!selected) return
    setSubmitted(true)
  }

  const handleNext = () => {
    onAnswerComplete({
      type: 'multiple_choice',
      correct: selected === question.correctAnswer,
      xpValue: question.xpValue || 25,
    })
  }

  return (
    <div>
      <div style={{
        fontFamily: 'var(--font-serif)', fontSize: '17px',
        color: 'var(--text-primary)', lineHeight: '1.6',
        marginBottom: '18px',
      }}>
        {question.question}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        {Object.entries(question.options).map(([key, text]) => (
          <div
            key={key}
            onClick={() => !submitted && setSelected(key)}
            style={{
              padding: '12px 14px', borderRadius: '8px',
              border: `1.5px solid ${optionBorder(key)}`,
              background: optionBg(key),
              cursor: submitted ? 'default' : 'pointer',
              transition: 'all 150ms ease',
              display: 'flex', alignItems: 'flex-start', gap: '10px',
            }}
          >
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700,
              color: submitted && key === question.correctAnswer ? '#4caf82'
                : submitted && key === selected && !isCorrect ? 'var(--accent-red)'
                : selected === key && !submitted ? 'var(--accent-gold)'
                : 'var(--text-muted)',
              flexShrink: 0, marginTop: '1px',
            }}>
              {key}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              {text}
            </span>
            {submitted && key === question.correctAnswer && (
              <span style={{
                marginLeft: 'auto', flexShrink: 0,
                fontSize: '11px', color: '#4caf82', fontWeight: 700,
                fontFamily: 'var(--font-mono)',
              }}>
                ✓ Correct
              </span>
            )}
            {submitted && key === selected && !isCorrect && (
              <span style={{
                marginLeft: 'auto', flexShrink: 0,
                fontSize: '11px', color: 'var(--accent-red)', fontWeight: 700,
                fontFamily: 'var(--font-mono)',
              }}>
                ✗ Incorrect
              </span>
            )}
          </div>
        ))}
      </div>

      {/* XP indicator */}
      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            textAlign: 'right', marginBottom: '6px',
            fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700,
            color: isCorrect ? 'var(--accent-green)' : 'var(--accent-red)',
          }}
        >
          {isCorrect ? `+${question.xpValue || 25} XP` : '-5 XP'}
        </motion.div>
      )}

      {/* Explanation */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', marginBottom: '16px' }}
          >
            <div style={{
              padding: '12px 14px',
              borderLeft: `3px solid ${isCorrect ? '#4caf82' : 'var(--accent-red)'}`,
              background: isCorrect ? 'rgba(76,175,130,0.06)' : 'rgba(239,68,68,0.06)',
              borderRadius: '4px',
            }}>
              <div style={{
                fontSize: '10px', letterSpacing: '0.1em', fontWeight: 700,
                color: isCorrect ? '#4caf82' : 'var(--accent-red)',
                marginBottom: '6px', fontFamily: 'var(--font-sans)',
              }}>
                {isCorrect ? 'WHY THIS IS CORRECT' : 'EXPLANATION'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '6px' }}>
                {question.explanation}
              </div>
              {question.statute && (
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '11px',
                  color: 'var(--text-muted)',
                }}>
                  {question.statute}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={!selected}
          style={{
            width: '100%', height: '40px',
            background: selected ? 'var(--accent-gold)' : 'var(--border)',
            color: selected ? '#0f1117' : 'var(--text-muted)',
            border: 'none', borderRadius: '6px',
            fontFamily: 'var(--font-serif)', fontSize: '14px', fontWeight: 600,
            cursor: selected ? 'pointer' : 'not-allowed',
          }}
        >
          Submit Answer
        </button>
      ) : (
        <button
          onClick={handleNext}
          style={{
            width: '100%', height: '40px',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)', borderRadius: '6px',
            fontFamily: 'var(--font-serif)', fontSize: '14px', fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Next Question →
        </button>
      )}
    </div>
  )
}

// ── Short Answer Question ───────────────────────────────
function ShortAnswerQuestion({ question, onAnswerComplete }) {
  const [text, setText] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [rubricChecks, setRubricChecks] = useState({})
  const [selfScore, setSelfScore] = useState(null)

  const SELF_SCORES = [
    { id: 'fully', label: 'Fully', desc: 'I addressed all key points clearly' },
    { id: 'partially', label: 'Partially', desc: 'I addressed some key points but missed others' },
    { id: 'missed', label: 'Missed', desc: 'I did not adequately address the key points' },
  ]

  const handleNext = () => {
    if (!selfScore) return
    onAnswerComplete({
      type: 'short_answer',
      selfScore,
      xpValue: question.xpValue || 50,
    })
  }

  return (
    <div>
      <div style={{
        fontFamily: 'var(--font-serif)', fontSize: '17px',
        color: 'var(--text-primary)', lineHeight: '1.6', marginBottom: '14px',
      }}>
        {question.question}
      </div>

      {!submitted && (
        <>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type your answer here (minimum 100 characters)..."
            style={{
              width: '100%', minHeight: '120px', padding: '10px 12px',
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: '6px', color: 'var(--text-primary)', resize: 'vertical',
              fontFamily: 'var(--font-sans)', fontSize: '13px', lineHeight: '1.5',
              boxSizing: 'border-box', marginBottom: '12px',
            }}
          />

          {question.rubric?.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em',
                fontWeight: 700, marginBottom: '8px', fontFamily: 'var(--font-sans)',
              }}>
                YOUR ANSWER SHOULD ADDRESS:
              </div>
              {question.rubric.map((point, i) => (
                <label key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '8px',
                  marginBottom: '6px', cursor: 'pointer',
                }}>
                  <input
                    type="checkbox"
                    checked={!!rubricChecks[i]}
                    onChange={e => setRubricChecks(prev => ({ ...prev, [i]: e.target.checked }))}
                    style={{ marginTop: '2px', flexShrink: 0 }}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {point}
                  </span>
                </label>
              ))}
            </div>
          )}

          <button
            onClick={() => setSubmitted(true)}
            disabled={text.length < 100}
            style={{
              width: '100%', height: '40px',
              background: text.length >= 100 ? 'var(--accent-gold)' : 'var(--border)',
              color: text.length >= 100 ? '#0f1117' : 'var(--text-muted)',
              border: 'none', borderRadius: '6px',
              fontFamily: 'var(--font-serif)', fontSize: '14px', fontWeight: 600,
              cursor: text.length >= 100 ? 'pointer' : 'not-allowed',
            }}
          >
            Submit Answer {text.length < 100 ? `(${100 - text.length} more chars)` : ''}
          </button>
        </>
      )}

      {submitted && (
        <div>
          {/* Model answer rubric */}
          {question.rubric?.length > 0 && (
            <div style={{
              padding: '12px 14px', marginBottom: '16px',
              background: 'rgba(74,158,255,0.06)',
              border: '1px solid rgba(74,158,255,0.2)', borderRadius: '6px',
            }}>
              <div style={{
                fontSize: '10px', color: '#4a9eff', letterSpacing: '0.1em',
                fontWeight: 700, marginBottom: '8px', fontFamily: 'var(--font-sans)',
              }}>
                MODEL ANSWER SHOULD INCLUDE
              </div>
              {question.rubric.map((point, i) => (
                <div key={i} style={{
                  fontSize: '12px', color: 'var(--text-secondary)',
                  lineHeight: '1.4', marginBottom: '4px', paddingLeft: '12px',
                  borderLeft: '2px solid rgba(74,158,255,0.3)',
                }}>
                  {point}
                </div>
              ))}
            </div>
          )}

          {/* Self-assessment */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              fontSize: '13px', color: 'var(--text-primary)', marginBottom: '10px', fontWeight: 600,
            }}>
              How well did your answer address the key points?
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {SELF_SCORES.map(s => (
                <div
                  key={s.id}
                  onClick={() => setSelfScore(s.id)}
                  style={{
                    padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                    border: `1.5px solid ${selfScore === s.id ? 'var(--accent-gold)' : 'var(--border)'}`,
                    background: selfScore === s.id ? 'rgba(201,168,76,0.08)' : 'var(--bg-card)',
                    transition: 'all 150ms ease',
                  }}
                >
                  <div style={{ fontSize: '13px', color: selfScore === s.id ? 'var(--accent-gold)' : 'var(--text-primary)', fontWeight: 600 }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {s.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleNext}
            disabled={!selfScore}
            style={{
              width: '100%', height: '40px',
              background: selfScore ? 'var(--bg-secondary)' : 'var(--border)',
              color: selfScore ? 'var(--text-primary)' : 'var(--text-muted)',
              border: selfScore ? '1px solid var(--border)' : '1px solid var(--border)',
              borderRadius: '6px',
              fontFamily: 'var(--font-serif)', fontSize: '14px', fontWeight: 600,
              cursor: selfScore ? 'pointer' : 'not-allowed',
            }}
          >
            Next Question →
          </button>
        </div>
      )}
    </div>
  )
}

// ── Step 2: Questions ───────────────────────────────────
function QuestionsStep({ checkData, onAllComplete }) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answersRecord, setAnswersRecord] = useState([])

  const questions = checkData.questions || []
  const currentQ = questions[currentIdx]

  const handleAnswerComplete = (answerData) => {
    const updated = [...answersRecord, answerData]
    setAnswersRecord(updated)

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1)
    } else {
      onAllComplete(updated)
    }
  }

  if (!currentQ) return null

  return (
    <div>
      {/* Progress */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '20px',
      }}>
        <div style={{
          fontSize: '11px', color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)', letterSpacing: '0.05em',
        }}>
          Question {currentIdx + 1} of {questions.length}
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {questions.map((_, i) => (
            <div key={i} style={{
              width: '20px', height: '3px', borderRadius: '2px',
              background: i < currentIdx ? 'var(--accent-green)'
                : i === currentIdx ? 'var(--accent-gold)' : 'var(--border)',
            }} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.2 }}
        >
          {currentQ.type === 'multiple_choice'
            ? <MCQuestion question={currentQ} onAnswerComplete={handleAnswerComplete} />
            : <ShortAnswerQuestion question={currentQ} onAnswerComplete={handleAnswerComplete} />
          }
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ── Step 3: Results ─────────────────────────────────────
function ResultsStep({ checkData, answersRecord, action, onComplete }) {
  const quality = computeQuality(answersRecord)
  const xpEarned = computeXPEarned(answersRecord)
  const xpMultiplier = quality === 3 ? 1.0 : quality === 2 ? 0.6 : 0.2
  const finalXP = Math.round(action.xpReward * xpMultiplier)

  const QUALITY_CONFIG = {
    3: {
      label: 'EXCELLENT',
      color: 'var(--accent-gold)',
      icon: '⚖',
      sub: 'Full case benefit applied.',
    },
    2: {
      label: 'ADEQUATE',
      color: '#4a9eff',
      icon: '✓',
      sub: 'Partial case benefit applied.',
    },
    1: {
      label: 'DEFICIENT',
      color: 'var(--accent-red)',
      icon: '⚠',
      sub: 'Minimal case benefit — review the explanations carefully.',
    },
  }

  const cfg = QUALITY_CONFIG[quality]
  const rubricText = checkData.qualityRubric?.[quality === 3 ? 'excellent' : quality === 2 ? 'adequate' : 'deficient']

  return (
    <div>
      <div style={{
        fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em',
        fontWeight: 700, marginBottom: '20px', fontFamily: 'var(--font-sans)',
      }}>
        ASSESSMENT COMPLETE
      </div>

      {/* Quality badge */}
      <div style={{
        textAlign: 'center', padding: '24px 20px', marginBottom: '20px',
        background: `${cfg.color}10`, border: `1px solid ${cfg.color}44`,
        borderRadius: '10px',
      }}>
        <div style={{ fontSize: '32px', marginBottom: '8px', color: cfg.color }}>{cfg.icon}</div>
        <div style={{
          fontFamily: 'var(--font-serif)', fontSize: '24px',
          color: cfg.color, marginBottom: '6px',
        }}>
          {cfg.label}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{cfg.sub}</div>
      </div>

      {/* XP earned */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px', marginBottom: '16px',
        background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)',
      }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>XP EARNED</div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '22px',
            color: 'var(--accent-green)', fontWeight: 700,
          }}>
            +{finalXP}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>MULTIPLIER</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', color: cfg.color }}>
            ×{(xpMultiplier * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Rubric reminder */}
      {rubricText && (
        <div style={{
          padding: '10px 14px', marginBottom: '16px',
          borderLeft: `3px solid ${cfg.color}`,
          background: `${cfg.color}06`, borderRadius: '4px',
        }}>
          <div style={{
            fontSize: '10px', color: cfg.color, letterSpacing: '0.1em',
            fontWeight: 700, marginBottom: '4px', fontFamily: 'var(--font-sans)',
          }}>
            {quality === 3 ? 'EXCELLENT WORK' : quality === 2 ? 'ADEQUATE WORK' : 'DEFICIENT WORK'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            {rubricText}
          </div>
        </div>
      )}

      {/* Quality 1: Onier flag notice */}
      {quality === 1 && (
        <div style={{
          padding: '10px 14px', marginBottom: '16px',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid var(--accent-red)55', borderRadius: '6px',
        }}>
          <div style={{ fontSize: '12px', color: 'var(--accent-red)', lineHeight: '1.5' }}>
            Onier Llopiz has noted the quality of this work. A case review has been flagged.
          </div>
        </div>
      )}

      <button
        onClick={() => onComplete(quality)}
        style={{
          width: '100%', height: '44px',
          background: cfg.color, color: quality === 2 ? '#fff' : '#0f1117',
          border: 'none', borderRadius: '6px',
          fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Complete Action →
      </button>
    </div>
  )
}

// ── Main Modal ──────────────────────────────────────────
export default function ActionComprehensionModal({
  isOpen,
  onClose,
  onComplete,
  action,
  caseObject,
  playerTitle,
  isLoading,
  checkData,
}) {
  const [step, setStep] = useState(0)
  const [answersRecord, setAnswersRecord] = useState([])

  useEffect(() => {
    if (isOpen) {
      setStep(isLoading ? 0 : 1)
      setAnswersRecord([])
    }
  }, [isOpen])

  useEffect(() => {
    if (!isLoading && checkData && step === 0) {
      setStep(1)
    }
  }, [isLoading, checkData])

  if (!isOpen || !action) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={step < 3 ? onClose : undefined}
      title={step === 0 ? 'Assessment Loading' : step === 3 ? 'Assessment Results' : 'Comprehension Check'}
      wide
    >
      {step === 0 && <LoadingStep />}

      {step === 1 && checkData && (
        <ContextStep
          action={action}
          checkData={checkData}
          onBegin={() => setStep(2)}
        />
      )}

      {step === 2 && checkData && (
        <QuestionsStep
          checkData={checkData}
          onAllComplete={(record) => {
            setAnswersRecord(record)
            setStep(3)
          }}
        />
      )}

      {step === 3 && checkData && (
        <ResultsStep
          checkData={checkData}
          answersRecord={answersRecord}
          action={action}
          onComplete={onComplete}
        />
      )}
    </Modal>
  )
}
