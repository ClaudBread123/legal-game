import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore.js'
import CaseCard from '../components/dashboard/CaseCard.jsx'
import PriorityAlerts from '../components/dashboard/PriorityAlerts.jsx'
import ActivityFeed from '../components/dashboard/ActivityFeed.jsx'
import PerformanceMeter from '../components/dashboard/PerformanceMeter.jsx'
import { formatGameDate, advanceBusinessDay } from '../utils/dateUtils.js'

export default function Dashboard() {
  const { cases, currentDate, advanceDay } = useGameStore()
  const activeCases = cases.filter(c => c.status !== 'closed')
  const nextDate = currentDate ? advanceBusinessDay(currentDate) : null

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
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
            activeCases.map(c => <CaseCard key={c.caseId} caseObject={c} />)
          )}
        </div>

        {/* Right: Sidebar */}
        <div style={{ position: 'sticky', top: '88px', alignSelf: 'flex-start' }}>
          <PriorityAlerts />
          <PerformanceMeter />
          <ActivityFeed />

          {/* Advance Day button */}
          <motion.div whileTap={{ scale: 0.98 }}>
            <button
              onClick={advanceDay}
              style={{
                width: '100%', height: '56px',
                background: 'linear-gradient(135deg, var(--bg-card) 0%, #252d42 100%)',
                border: '1px solid var(--accent-gold)',
                color: 'var(--accent-gold)',
                borderRadius: '8px',
                fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 600,
                cursor: 'pointer', transition: 'all 150ms ease',
                marginBottom: '6px',
              }}
            >
              Advance to Next Business Day →
            </button>
          </motion.div>
          {nextDate && (
            <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {formatGameDate(nextDate)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
