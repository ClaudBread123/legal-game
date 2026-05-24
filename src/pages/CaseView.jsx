import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useGameStore } from '../store/gameStore.js'
import ComplaintAnalysis from '../components/case/ComplaintAnalysis.jsx'
import LitigationActions from '../components/case/LitigationActions.jsx'
import TimelineView from '../components/case/TimelineView.jsx'
import CaseLog from '../components/case/CaseLog.jsx'
import ManagingPartnerWidget from '../components/case/ManagingPartnerWidget.jsx'
import CaseBudgetPanel from '../components/case/CaseBudgetPanel.jsx'
import DeadlinePanel from '../components/case/DeadlinePanel.jsx'

const TABS = ['Complaint Analysis', 'Litigation Actions', 'Case Log', 'Timeline & Deadlines']

export default function CaseView() {
  const { caseId } = useParams()
  const { cases } = useGameStore()
  const [activeTab, setActiveTab] = useState(0)
  const [issueEvaluation, setIssueEvaluation] = useState(null)

  const caseObject = cases.find(c => c.caseId === caseId)

  if (!caseObject) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '16px', color: 'var(--text-muted)' }}>Case not found.</div>
        <Link to="/" style={{ color: 'var(--accent-blue)', fontSize: '14px', marginTop: '12px', display: 'inline-block' }}>
          ← Back to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: '16px', padding: '20px', minHeight: 'calc(100vh - 64px)' }}>
      {/* Left sidebar */}
      <div style={{ width: '260px', flexShrink: 0 }}>
        <div style={{ marginBottom: '8px' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
            ← Dashboard
          </Link>
        </div>
        <CaseBudgetPanel caseObject={caseObject} />
        <DeadlinePanel caseObject={caseObject} />
      </div>

      {/* Main panel */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Tab nav */}
        <div style={{
          display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '24px',
        }}>
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              style={{
                padding: '10px 20px', background: 'none', border: 'none',
                borderBottom: `2px solid ${activeTab === i ? 'var(--accent-gold)' : 'transparent'}`,
                color: activeTab === i ? 'var(--text-primary)' : 'var(--text-muted)',
                fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: activeTab === i ? 600 : 400,
                cursor: 'pointer', transition: 'all 150ms ease', marginBottom: '-1px',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 0 && (
          <ComplaintAnalysis caseObject={caseObject} onEvaluated={setIssueEvaluation} />
        )}
        {activeTab === 1 && <LitigationActions caseObject={caseObject} />}
        {activeTab === 2 && <CaseLog caseObject={caseObject} />}
        {activeTab === 3 && <TimelineView caseObject={caseObject} />}
      </div>

      {/* Right sidebar */}
      <div style={{ width: '220px', flexShrink: 0 }}>
        <ManagingPartnerWidget caseObject={caseObject} issueEvaluation={issueEvaluation} />
      </div>
    </div>
  )
}
