import { useEffect, useState } from 'react'
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
  const [dismissedNewCaseBanners, setDismissedNewCaseBanners] = useState([])
  const activeCases = cases.filter(c => c.status !== 'closed')
  const newCases = activeCases.filter(c => (c.completedActions || []).length === 0 && !dismissedNewCaseBanners.includes(c.caseId))

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

    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}
    >
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
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

          {newCases.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                background: 'rgba(201,168,76,0.08)', border: '1px solid var(--accent-gold)66',
                borderLeft: '4px solid var(--accent-gold)', borderRadius: '8px',
                padding: '16px 20px', marginBottom: '16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--accent-gold)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '4px' }}>
                  NEW MATTER ASSIGNED
                </div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {newCases[0].defendant}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {newCases[0].caseId} — Begin with issue analysis and pull the docket.
                </div>
              </div>
              <button
                onClick={() => setDismissedNewCaseBanners(prev => [...prev, newCases[0].caseId])}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer', padding: '0', lineHeight: 1, flexShrink: 0 }}
              >
                ×
              </button>
            </motion.div>
          )}

          {activeCases.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '56px 32px',
              background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px',
            }}>
              <div style={{ fontSize: '28px', marginBottom: '16px', color: 'var(--accent-gold)' }}>⚖</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--text-primary)', marginBottom: '6px' }}>
                All matters resolved.
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
                Outstanding work, {player.name}.
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                New matters will be assigned shortly. Advance the day to continue.
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px',
                maxWidth: '360px', margin: '0 auto',
              }}>
                {[
                  { label: 'Cases Resolved', value: (cases.filter(c => c.status === 'closed').length) },
                  { label: 'Total XP', value: `${(player.xp || 0).toLocaleString()} XP` },
                  { label: 'Career Level', value: player.title },
                ].map(s => (
                  <div key={s.label} style={{
                    background: 'var(--bg-secondary)', borderRadius: '6px', padding: '12px',
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.05em' }}>{s.label}</div>
                    <div style={{ fontSize: '14px', color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{s.value}</div>
                  </div>
                ))}
              </div>
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
