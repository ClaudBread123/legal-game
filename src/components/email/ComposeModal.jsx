import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Modal from '../shared/Modal.jsx'
import { useGameStore } from '../../store/gameStore.js'
import { evaluateEmail } from '../../api/evaluateEmail.js'
import { applyEmailConsequences } from '../../utils/applyEmailConsequences.js'

const TO_OPTIONS = [
  { value: 'opposing_counsel', label: 'Opposing Counsel' },
  { value: 'client', label: 'Client / Risk Manager' },
  { value: 'court', label: 'Court (Clerk of Court)' },
  { value: 'managing_partner', label: 'Onier Llopiz (Internal)' },
]

const RATING_CONFIG = {
  PROFESSIONAL: { color: '#4ade80', label: 'Professional' },
  ACCEPTABLE: { color: '#4a9eff', label: 'Acceptable' },
  CONCERNING: { color: 'var(--accent-yellow)', label: 'Concerning' },
  INAPPROPRIATE: { color: 'var(--accent-red)', label: 'Inappropriate' },
}

export default function ComposeModal({ isOpen, onClose, defaultCaseId }) {
  const store = useGameStore()
  const { cases, player, addEmail } = store

  const [to, setTo] = useState('opposing_counsel')
  const [caseId, setCaseId] = useState(defaultCaseId || '')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [step, setStep] = useState('compose') // compose | evaluating | result
  const [evaluation, setEvaluation] = useState(null)

  const activeCases = (cases || []).filter(c => c.status !== 'closed')
  const selectedCase = activeCases.find(c => c.caseId === caseId) || null
  const wordCount = body.trim().split(/\s+/).filter(Boolean).length
  const canSend = to && subject.trim() && wordCount >= 10

  const handleClose = () => {
    setTo('opposing_counsel')
    setCaseId(defaultCaseId || '')
    setSubject('')
    setBody('')
    setStep('compose')
    setEvaluation(null)
    onClose()
  }

  const handleSend = async () => {
    if (!canSend) return
    setStep('evaluating')

    const toLabel = TO_OPTIONS.find(o => o.value === to)?.label || to

    try {
      const result = await evaluateEmail({
        to: toLabel,
        subject,
        body,
        caseObject: selectedCase,
        playerName: player?.name || 'Associate',
      })
      setEvaluation(result)
      setStep('result')

      // Record the sent email
      addEmail({
        from: player?.name || 'Associate',
        fromEmail: `${(player?.name || 'associate').toLowerCase().replace(/\s/g, '.')}@llopizwizel.com`,
        to: toLabel,
        subject,
        priority: 'normal',
        body,
        caseId: caseId || null,
        isSent: true,
      })

      // Apply consequences
      applyEmailConsequences(result, store)
    } catch {
      setEvaluation({
        appropriate: true,
        rating: 'ACCEPTABLE',
        feedback: 'Email sent. Evaluation unavailable.',
        concerns: [],
        xpEffect: 5,
        formalWarning: false,
        oniersNote: 'Keep communications professional.',
      })
      setStep('result')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={step === 'evaluating' ? undefined : handleClose}
      title={step === 'result' ? 'Email Sent — Review' : step === 'evaluating' ? 'Sending…' : 'Compose Email'}
      wide
    >
      <AnimatePresence mode="wait">
        {step === 'compose' && (
          <motion.div key="compose" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* To */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: '5px' }}>TO</label>
              <select
                value={to}
                onChange={e => setTo(e.target.value)}
                style={{
                  width: '100%', height: '38px', padding: '0 10px',
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {TO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Case */}
            {activeCases.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: '5px' }}>CASE (OPTIONAL)</label>
                <select
                  value={caseId}
                  onChange={e => setCaseId(e.target.value)}
                  style={{
                    width: '100%', height: '38px', padding: '0 10px',
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <option value="">— No specific case —</option>
                  {activeCases.map(c => (
                    <option key={c.caseId} value={c.caseId}>{c.caseId} — {c.defendant}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Subject */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: '5px' }}>SUBJECT</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Re: Matter of…"
                style={{
                  width: '100%', height: '38px', padding: '0 10px',
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px',
                  fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Body */}
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: '5px' }}>MESSAGE</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Write your message here…"
                style={{
                  width: '100%', minHeight: '160px', padding: '10px 12px',
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  borderRadius: '6px', color: 'var(--text-primary)', resize: 'vertical',
                  fontFamily: 'var(--font-sans)', fontSize: '14px', lineHeight: '1.7',
                  boxSizing: 'border-box', outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {wordCount} word{wordCount !== 1 ? 's' : ''}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Your email will be evaluated for professional standards
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleSend}
                disabled={!canSend}
                style={{
                  flex: 1, height: '42px',
                  background: canSend ? 'var(--accent-gold)' : 'var(--border)',
                  color: canSend ? '#0f1117' : 'var(--text-muted)',
                  border: 'none', borderRadius: '6px',
                  fontFamily: 'var(--font-serif)', fontSize: '14px', fontWeight: 600,
                  cursor: canSend ? 'pointer' : 'not-allowed',
                }}
              >
                Send Email →
              </button>
              <button
                onClick={handleClose}
                style={{
                  height: '42px', padding: '0 16px',
                  background: 'none', color: 'var(--text-muted)',
                  border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {step === 'evaluating' && (
          <motion.div key="evaluating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ textAlign: 'center', padding: '48px 20px' }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              style={{
                width: '52px', height: '52px', borderRadius: '50%',
                background: 'rgba(201,168,76,0.15)', border: '2px solid var(--accent-gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
                fontFamily: 'var(--font-serif)', fontSize: '16px', color: 'var(--accent-gold)',
              }}
            >OL</motion.div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Reviewing your email…</div>
          </motion.div>
        )}

        {step === 'result' && evaluation && (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {(() => {
              const cfg = RATING_CONFIG[evaluation.rating] || RATING_CONFIG.ACCEPTABLE
              return (
                <>
                  <div style={{
                    textAlign: 'center', padding: '20px',
                    background: `${cfg.color}10`, border: `1px solid ${cfg.color}44`,
                    borderRadius: '8px', marginBottom: '16px',
                  }}>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: cfg.color, marginBottom: '4px' }}>
                      {cfg.label}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Email sent</div>
                  </div>

                  <div style={{ marginBottom: '14px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    {evaluation.feedback}
                  </div>

                  {evaluation.concerns?.length > 0 && (
                    <div style={{ marginBottom: '14px' }}>
                      {evaluation.concerns.map((c, i) => (
                        <div key={i} style={{
                          padding: '8px 10px', marginBottom: '4px',
                          background: 'rgba(239,68,68,0.05)', border: '1px solid var(--accent-red)22',
                          borderRadius: '5px', fontSize: '12px', color: 'var(--text-secondary)',
                        }}>⚠ {c}</div>
                      ))}
                    </div>
                  )}

                  {evaluation.oniersNote && (
                    <div style={{
                      padding: '10px 12px', marginBottom: '14px',
                      background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border)',
                      fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic',
                    }}>
                      "{evaluation.oniersNote}" <span style={{ color: 'var(--accent-gold)', fontStyle: 'normal' }}>— OL</span>
                    </div>
                  )}

                  {evaluation.xpEffect !== 0 && (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: '8px', marginBottom: '16px',
                      fontFamily: 'var(--font-mono)', fontSize: '16px',
                      color: evaluation.xpEffect > 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                    }}>
                      {evaluation.xpEffect > 0 ? '+' : ''}{evaluation.xpEffect} XP
                    </div>
                  )}

                  <button
                    onClick={handleClose}
                    style={{
                      width: '100%', height: '42px',
                      background: 'var(--accent-gold)', color: '#0f1117',
                      border: 'none', borderRadius: '6px',
                      fontFamily: 'var(--font-serif)', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    Done
                  </button>
                </>
              )
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  )
}
