import { EMAIL_TEMPLATES } from '../data/emailTemplates.js'
import { calculateDeadlines } from './deadlineEngine.js'
import { daysBetween } from './dateUtils.js'

function makeEmailId() {
  return `email-${Date.now()}-${Math.floor(Math.random() * 100000)}`
}

function has1983Claim(c) {
  return (c.claimsAsserted || []).some(cl => cl.includes('1983'))
}

function normalizeProbability(prob, shift) {
  const keys = ['strongWin', 'settleDefense', 'settleNeutral', 'loss']
  const next = {}
  for (const k of keys) {
    next[k] = Math.max(0, (prob[k] ?? 0) + (shift[k] ?? 0))
  }
  const total = Object.values(next).reduce((a, b) => a + b, 0)
  if (total === 0) return next
  const factor = 100 / total
  const normalized = {}
  for (const k of keys) {
    normalized[k] = Math.round(next[k] * factor)
  }
  const roundedTotal = Object.values(normalized).reduce((a, b) => a + b, 0)
  const diff = 100 - roundedTotal
  if (diff !== 0) {
    const maxKey = keys.reduce((a, b) => normalized[a] >= normalized[b] ? a : b)
    normalized[maxKey] += diff
  }
  return normalized
}

export const DEFAULT_PROBABILITY = {
  strongWin: 40,
  settleDefense: 30,
  settleNeutral: 20,
  loss: 10,
}

export const CONSEQUENCES = {
  mtd_hearing_missed: {
    id: 'mtd_hearing_missed',
    label: 'MTD Set for 5-Minute Hearing',
    healthImpact: -20,
    probabilityShift: { strongWin: -15, loss: 10, settleNeutral: 5 },
    description: 'Motion to Dismiss was set by opposing counsel for a 5-minute hearing slot. The motion will almost certainly be denied. Grounds not raised now may be waived or expensive to revive.',
    emailTemplate: 'mtd_hearing_warning',
    locksActions: [],
    complicatesActions: ['notice_mtd_hearing'],
  },
  mtd_denied: {
    id: 'mtd_denied',
    label: 'Motion to Dismiss Denied',
    healthImpact: -25,
    probabilityShift: { strongWin: -20, loss: 15, settleNeutral: 5 },
    description: 'The Motion to Dismiss was denied. Defendant must now proceed through full discovery. Grounds that could have ended the case early are now lost or must be re-raised at summary judgment at greater cost.',
    emailTemplate: 'mtd_denied_consequence',
    locksActions: [],
    complicatesActions: ['motion_summary_judgment'],
  },
  depo_sequencing_lost: {
    id: 'depo_sequencing_lost',
    label: 'Client Deposed First',
    healthImpact: -20,
    probabilityShift: { strongWin: -10, settleDefense: -10, loss: 15, settleNeutral: 5 },
    description: "Opposing counsel deposed your client before you deposed the plaintiff. Plaintiff's counsel now has sworn testimony from your client to use against them. You have lost tactical control of the deposition record.",
    emailTemplate: 'depo_sequencing_warning',
    locksActions: [],
    complicatesActions: ['take_plaintiff_depo', 'motion_summary_judgment'],
  },
  discovery_default: {
    id: 'discovery_default',
    label: 'Discovery Served Late',
    healthImpact: -15,
    probabilityShift: { strongWin: -10, loss: 8, settleNeutral: 2 },
    description: 'Written discovery was served late. Plaintiff has had time to prepare their witnesses and gather documents without the pressure of your requests. RFA timing advantage is lost.',
    emailTemplate: 'discovery_overdue',
    locksActions: [],
    complicatesActions: ['motion_summary_judgment'],
  },
  rfa_deemed_admitted: {
    id: 'rfa_deemed_admitted',
    label: 'RFAs Deemed Admitted Against Client',
    healthImpact: -30,
    probabilityShift: { strongWin: -20, settleDefense: -15, loss: 25, settleNeutral: 10 },
    description: "Plaintiff served Requests for Admissions and your client failed to respond within 30 days. Under Florida Rule of Civil Procedure 1.370, those matters are now deemed admitted. This is extremely difficult to undo and may establish key elements of plaintiff's case.",
    emailTemplate: 'rfa_deemed_consequence',
    locksActions: [],
    complicatesActions: ['motion_summary_judgment', 'request_mediation'],
  },
  expert_excluded: {
    id: 'expert_excluded',
    label: 'Expert Witness Excluded',
    healthImpact: -35,
    probabilityShift: { strongWin: -25, settleDefense: -15, loss: 30, settleNeutral: 10 },
    description: 'Expert disclosure deadline passed without disclosure. Plaintiff has moved to exclude your expert. Motion granted. You are now proceeding to trial or summary judgment without expert testimony.',
    emailTemplate: 'expert_excluded_consequence',
    locksActions: ['disclose_expert'],
    complicatesActions: ['motion_summary_judgment'],
  },
  removal_waived: {
    id: 'removal_waived',
    label: 'Federal Removal Right Waived',
    healthImpact: -25,
    probabilityShift: { strongWin: -15, loss: 10, settleNeutral: 5 },
    description: 'The 30-day removal window for §1983 claims has expired without filing a Notice of Removal. The case must now be litigated in state court. Qualified immunity arguments are significantly harder to raise in state court. Eleventh Amendment arguments are unavailable.',
    emailTemplate: 'removal_waived_consequence',
    locksActions: [],
    complicatesActions: ['motion_to_dismiss', 'motion_summary_judgment'],
  },
  timekeeping_chronic: {
    id: 'timekeeping_chronic',
    label: 'Chronic Timekeeping Delinquency',
    healthImpact: 0,
    probabilityShift: {},
    description: 'Repeated timekeeping failures have been noted in your personnel file. This will affect your next performance review and promotion eligibility.',
    emailTemplate: 'timekeeping_delinquent',
    locksActions: [],
    complicatesActions: [],
  },
}

function evaluateCaseTriggers(c, currentDate) {
  const triggered = []
  const already = c.consequencesTriggered || []
  const completed = c.completedActions || []
  const timestamps = c.actionTimestamps || {}
  const consequenceTimestamps = c.consequenceTimestamps || {}
  const deadlines = calculateDeadlines(c)
  const daysSinceFiling = daysBetween(c.dateFiled, currentDate)

  function done(id) { return already.includes(id) }

  // 1. MTD filed but hearing not noticed after 14 days
  if (!done('mtd_hearing_missed')) {
    if (completed.includes('motion_to_dismiss') && !completed.includes('notice_mtd_hearing')) {
      const mtdDate = timestamps['motion_to_dismiss']
      if (mtdDate && daysBetween(mtdDate, currentDate) >= 14) {
        triggered.push('mtd_hearing_missed')
      }
    }
  }

  // 2. MTD denied — 7 days after mtd_hearing_missed, hearing still not set
  if (!done('mtd_denied') && done('mtd_hearing_missed')) {
    if (!completed.includes('notice_mtd_hearing')) {
      const missedOn = consequenceTimestamps['mtd_hearing_missed']
      if (missedOn && daysBetween(missedOn, currentDate) >= 7) {
        triggered.push('mtd_denied')
      }
    }
  }

  // 3. Depo sequencing lost — 45 days without noticing plaintiff depo
  if (!done('depo_sequencing_lost')) {
    if (!completed.includes('notice_plaintiff_depo') && daysSinceFiling >= 45) {
      triggered.push('depo_sequencing_lost')
    }
  }

  // 4. Discovery default — 45 days without serving written discovery
  if (!done('discovery_default')) {
    if (!completed.includes('written_discovery') && daysSinceFiling >= 45) {
      triggered.push('discovery_default')
    }
  }

  // 5. RFAs deemed admitted — 60 days without responding to discovery
  if (!done('rfa_deemed_admitted')) {
    if (!completed.includes('respond_to_discovery') && daysSinceFiling >= 60) {
      triggered.push('rfa_deemed_admitted')
    }
  }

  // 6. Expert excluded — past expert disclosure deadline without disclosing
  if (!done('expert_excluded')) {
    if (!completed.includes('disclose_expert') &&
        deadlines.defendantExpertDisclosure &&
        currentDate > deadlines.defendantExpertDisclosure) {
      triggered.push('expert_excluded')
    }
  }

  // 7. Removal waived — §1983 case, 30+ days without filing MTD
  if (!done('removal_waived') && has1983Claim(c)) {
    if (!completed.includes('motion_to_dismiss') && daysSinceFiling > 30) {
      triggered.push('removal_waived')
    }
  }

  return triggered
}

export function evaluateConsequences(state) {
  const { cases, currentDate, player } = state
  const playerName = player?.name || 'Associate'

  const updatedCases = []
  const newEmails = []
  const newActivityEntries = []
  const newNotifications = []

  for (const c of cases) {
    if (c.status === 'closed') {
      updatedCases.push(c)
      continue
    }

    let updated = { ...c }
    const triggered = evaluateCaseTriggers(updated, currentDate)

    for (const id of triggered) {
      const consequence = CONSEQUENCES[id]
      if (!consequence) continue

      const currentHealth = updated.caseHealth ?? 100
      const currentProb = updated.caseOutcomeProbability ?? { ...DEFAULT_PROBABILITY }

      updated = {
        ...updated,
        caseHealth: Math.max(0, currentHealth + consequence.healthImpact),
        caseOutcomeProbability: normalizeProbability(currentProb, consequence.probabilityShift),
        consequencesTriggered: [...(updated.consequencesTriggered || []), id],
        activeConsequences: [...(updated.activeConsequences || []), id],
        consequenceTimestamps: {
          ...(updated.consequenceTimestamps || {}),
          [id]: currentDate,
        },
        caseHealthEvents: [
          ...(updated.caseHealthEvents || []),
          {
            date: currentDate,
            event: consequence.label,
            impact: consequence.healthImpact,
            description: consequence.description,
            type: 'consequence',
          },
        ],
      }

      // Email
      const templateFn = EMAIL_TEMPLATES[consequence.emailTemplate]
      if (templateFn) {
        newEmails.push({
          id: makeEmailId(),
          timestamp: currentDate,
          read: false,
          ...templateFn({ playerName, caseId: c.caseId }),
        })
      }

      // Activity feed entry
      newActivityEntries.push({
        id: `consequence-${id}-${c.caseId}-${Date.now()}`,
        timestamp: currentDate,
        message: `${c.caseId}: ${consequence.label} — case health -${Math.abs(consequence.healthImpact)}`,
        type: 'warning',
      })

      // Notification
      newNotifications.push({
        id: `cq-notif-${id}-${c.caseId}-${Date.now()}`,
        message: `${c.caseId}: ${consequence.label}`,
        read: false,
        type: 'warning',
        caseId: c.caseId,
      })
    }

    updatedCases.push(updated)
  }

  return { updatedCases, newEmails, newActivityEntries, newNotifications }
}
