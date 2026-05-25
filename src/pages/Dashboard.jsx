import { useEffect, useState } from 'react'
import { callClaude } from '../api/anthropicProxy.js'
import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore.js'
import CaseCard from '../components/dashboard/CaseCard.jsx'
import PriorityAlerts from '../components/dashboard/PriorityAlerts.jsx'
import ActivityFeed from '../components/dashboard/ActivityFeed.jsx'
import PerformanceMeter from '../components/dashboard/PerformanceMeter.jsx'
import CaseResolutionModal from '../components/case/CaseResolutionModal.jsx'
import { formatGameDate, advanceBusinessDay } from '../utils/dateUtils.js'
import { generateCase } from '../api/caseGenerator.js'

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

export default function Dashboard() {
  const { cases, currentDate, advanceDay, pendingCaseGeneration, addGeneratedCase, addToast, player, resolutionQueue, resolveCase } = useGameStore()
  const [advancing, setAdvancing] = useState(false)
  const [testResults, setTestResults] = useState(null)
  const [testRunning, setTestRunning] = useState(false)
  const activeCases = cases.filter(c => c.status !== 'closed')

  const pendingResolution = resolutionQueue?.[0] || null
  const resolutionCase = pendingResolution ? cases.find(c => c.caseId === pendingResolution.caseId) : null
  const nextDate = currentDate ? advanceBusinessDay(currentDate) : null

  // Handle pending case generation (async, triggered by advanceDay)
  useEffect(() => {
    if (!pendingCaseGeneration) return
    let cancelled = false

    async function doGenerate() {
      try {
        const newCase = await generateCase({
          caseType: pendingCaseGeneration.caseType,
          playerLevel: player?.level || 1,
          currentDate,
        })
        if (!cancelled) {
          addGeneratedCase(newCase)
          addToast(`New matter assigned — ${newCase.caseId}`, 'info', 5000)
        }
      } catch {
        if (!cancelled) {
          addToast('Case generation failed — check your email for assignment', 'warning', 4000)
        }
      }
    }

    doGenerate()
    return () => { cancelled = true }
  }, [pendingCaseGeneration?.day])

  const handleAdvanceDay = async () => {
    if (advancing) return
    setAdvancing(true)
    advanceDay()
    setTimeout(() => setAdvancing(false), 600)
  }

  return (
    <>
    {/* API TEST PANEL - temporary diagnostic */}
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      width: '340px',
      background: '#1e2535',
      border: '1px solid #2a3347',
      borderRadius: '8px',
      padding: '16px',
      fontFamily: 'monospace',
      fontSize: '12px',
    }}>
      <div style={{
        color: '#c9a84c',
        fontWeight: 'bold',
        marginBottom: '12px',
        fontFamily: 'var(--font-sans)',
      }}>
        API Diagnostic
      </div>

      <button
        onClick={async () => {
          setTestRunning(true)
          setTestResults(null)
          const results = []

          results.push('TEST 1: Health check...')
          setTestResults([...results])
          try {
            const res = await fetch('https://llw-api-proxy.ollopiz.workers.dev', { method: 'GET' })
            const data = await res.json()
            results.push('✓ Worker: ' + data.status)
            results.push('✓ Has key: ' + data.hasApiKey)
          } catch (err) {
            results.push('✗ Health check: ' + err.message)
          }
          setTestResults([...results])

          results.push('')
          results.push('TEST 2: Direct POST...')
          setTestResults([...results])
          try {
            const res = await fetch('https://llw-api-proxy.ollopiz.workers.dev', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                system: 'Reply with one word only.',
                userMessage: 'Say: WORKING',
                maxTokens: 10,
              }),
            })
            results.push('Status: ' + res.status)
            const text = await res.text()
            results.push('Response: ' + text.substring(0, 150))
          } catch (err) {
            results.push('✗ POST failed: ' + err.message)
          }
          setTestResults([...results])

          results.push('')
          results.push('TEST 3: callClaude...')
          setTestResults([...results])
          try {
            const proxyUrl = import.meta.env.VITE_API_PROXY_URL
            results.push('URL: ' + (proxyUrl || 'NOT SET'))
            setTestResults([...results])
            const res = await fetch(proxyUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                system: 'Reply with one word only.',
                userMessage: 'Say: WORKING',
                maxTokens: 10,
              }),
            })
            results.push('Status: ' + res.status)
            const text = await res.text()
            results.push('Response: ' + text.substring(0, 150))
          } catch (err) {
            results.push('✗ callClaude: ' + err.message)
          }

          results.push('')
          results.push('DONE')
          setTestResults([...results])
          setTestRunning(false)
        }}
        disabled={testRunning}
        style={{
          background: testRunning ? '#4a5568' : '#c9a84c',
          color: '#000',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: testRunning ? 'wait' : 'pointer',
          fontWeight: '600',
          width: '100%',
          marginBottom: '12px',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {testRunning ? 'Testing...' : 'Run API Test'}
      </button>

      {testResults && (
        <div style={{
          background: '#0f1117',
          padding: '10px',
          borderRadius: '4px',
          maxHeight: '300px',
          overflowY: 'auto',
        }}>
          {testResults.map((line, i) => (
            <div key={i} style={{
              color: line.startsWith('✓') ? '#4caf82'
                : line.startsWith('✗') ? '#e05252'
                : line.startsWith('TEST') ? '#c9a84c'
                : '#e8ecf4',
              marginBottom: '2px',
              wordBreak: 'break-all',
            }}>
              {line || ' '}
            </div>
          ))}
        </div>
      )}
    </div>
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
        {/* Left: Cases */}
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', margin: '0 0 4px', color: 'var(--text-primary)' }}>
              Active Cases
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {activeCases.length} matter{activeCases.length !== 1 ? 's' : ''} requiring attention
            </div>
          </div>

          {activeCases.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '48px 24px',
              background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px',
              color: 'var(--text-muted)', fontSize: '14px', fontStyle: 'italic',
            }}>
              No active matters. The firm will assign cases shortly.
            </div>
          ) : (
            activeCases.map((c, i) => <CaseCard key={c.caseId} caseObject={c} index={i} />)
          )}
        </div>

        {/* Right: Sidebar */}
        <div style={{ position: 'sticky', top: '88px', alignSelf: 'flex-start' }}>
          <PriorityAlerts />
          <PerformanceMeter />
          <ActivityFeed />

          {/* Advance Day button */}
          <motion.button
            onClick={handleAdvanceDay}
            disabled={advancing}
            whileTap={{ scale: 0.96 }}
            animate={advancing ? { scale: [0.96, 1.02, 1] } : {}}
            transition={{ duration: 0.35 }}
            style={{
              width: '100%', height: '56px',
              background: 'linear-gradient(135deg, var(--bg-card) 0%, #252d42 100%)',
              border: '1px solid var(--accent-gold)',
              color: advancing ? 'var(--text-muted)' : 'var(--accent-gold)',
              borderRadius: '8px',
              fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 600,
              cursor: advancing ? 'not-allowed' : 'pointer',
              transition: 'color 150ms ease',
              marginBottom: '6px',
            }}
          >
            {advancing ? 'Advancing…' : 'Advance to Next Business Day →'}
          </motion.button>
          {nextDate && (
            <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {formatGameDate(nextDate)}
            </div>
          )}
        </div>
      </div>
    </motion.div>

    {pendingResolution && resolutionCase && (
      <CaseResolutionModal
        resolution={pendingResolution}
        caseObject={resolutionCase}
        onResolve={() => resolveCase(pendingResolution.caseId)}
      />
    )}
    </>
  )
}
