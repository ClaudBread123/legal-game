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
    <button
      onClick={async () => {
        console.log('=== FULL API TEST START ===')

        console.log('Test 1: Health check GET request')
        try {
          const res = await fetch('https://llw-api-proxy.ollopiz.workers.dev', { method: 'GET' })
          const data = await res.json()
          console.log('Health check result:', data)
        } catch (err) {
          console.error('Health check failed:', err)
        }

        console.log('Test 2: Real Claude API call')
        try {
          const result = await callClaude({
            system: 'You are a helpful assistant.',
            userMessage: 'Say exactly: API_WORKING',
            maxTokens: 50,
          })
          console.log('Claude response:', result)
        } catch (err) {
          console.error('Claude call failed:', err.message)
          console.error('Full error:', err)
        }

        console.log('Test 3: Direct POST to worker')
        try {
          const res = await fetch('https://llw-api-proxy.ollopiz.workers.dev', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system: 'You are helpful.',
              userMessage: 'Say: DIRECT_TEST_WORKING',
              maxTokens: 50,
            }),
          })
          console.log('Status:', res.status)
          const text = await res.text()
          console.log('Raw response:', text)
        } catch (err) {
          console.error('Direct POST failed:', err)
        }

        console.log('=== FULL API TEST END ===')
      }}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        background: 'var(--accent-gold)',
        color: '#000',
        border: 'none',
        padding: '12px 20px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        fontWeight: '600',
      }}
    >
      Test API
    </button>
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
