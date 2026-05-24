import { EMAIL_TEMPLATES } from '../data/emailTemplates.js'
import { calculateDeadlines } from './deadlineEngine.js'
import { daysBetween } from './dateUtils.js'

const JUDGES = ['Hon. Patricia Morales', 'Hon. David Chen', 'Hon. Sandra Williams']
const OPPOSING_COUNSEL = 'James R. Thornton, Esq.'

function randomJudge() {
  return JUDGES[Math.floor(Math.random() * JUDGES.length)]
}

function addCalendarDays(isoDate, n) {
  const d = new Date(isoDate + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function makeEmail(templateFn, ctx, state) {
  const id = `email-${Date.now()}-${Math.floor(Math.random() * 100000)}`
  const emailData = templateFn(ctx)
  return {
    id,
    timestamp: state.currentDate,
    read: false,
    ...emailData,
  }
}

/**
 * Runs on each advanceDay call.
 * Returns array of new email objects to add to the store.
 * Uses generatedEmailEvents (string array) to avoid duplicates.
 */
export function checkAndGenerateEmails(state) {
  const emails = []
  const fired = state.generatedEmailEvents || []
  const playerName = state.player?.name || 'Associate'
  const currentDate = state.currentDate

  if (!currentDate) return emails

  function alreadyFired(key) {
    return fired.includes(key)
  }

  for (const c of state.cases || []) {
    if (c.status === 'closed') continue
    const completed = c.completedActions || []
    const timestamps = c.actionTimestamps || {}
    const deadlines = calculateDeadlines(c)
    const daysSinceFiling = daysBetween(c.dateFiled, currentDate)

    // ── 1. MTD filed, no hearing set after 7 days ──
    if (completed.includes('motion_to_dismiss') && !completed.includes('notice_mtd_hearing')) {
      const mtdDate = timestamps['motion_to_dismiss']
      if (mtdDate) {
        const daysSinceMTD = daysBetween(mtdDate, currentDate)

        const warnKey = `mtd_hearing_warning_${c.caseId}`
        if (daysSinceMTD >= 7 && !alreadyFired(warnKey)) {
          emails.push({
            key: warnKey,
            email: makeEmail(EMAIL_TEMPLATES.mtd_hearing_warning, { playerName, caseId: c.caseId }, state),
          })
        }

        const oppKey = `opposing_sets_hearing_${c.caseId}`
        if (daysSinceMTD >= 14 && !alreadyFired(oppKey)) {
          emails.push({
            key: oppKey,
            email: makeEmail(EMAIL_TEMPLATES.opposing_sets_hearing, {
              opposingCounsel: OPPOSING_COUNSEL,
              caseId: c.caseId,
              hearingDate: addCalendarDays(currentDate, 21),
              judgeName: randomJudge(),
            }, state),
          })
        }
      }
    }

    // ── 2. Plaintiff depo not noticed after 30 days ──
    if (!completed.includes('notice_plaintiff_depo')) {
      const warnKey = `depo_sequencing_warning_${c.caseId}`
      if (daysSinceFiling >= 30 && !alreadyFired(warnKey)) {
        emails.push({
          key: warnKey,
          email: makeEmail(EMAIL_TEMPLATES.depo_sequencing_warning, {
            playerName, caseId: c.caseId, daysSinceFiling,
          }, state),
        })
      }

      const oppKey = `opposing_notices_client_depo_${c.caseId}`
      if (daysSinceFiling >= 45 && !alreadyFired(oppKey)) {
        emails.push({
          key: oppKey,
          email: makeEmail(EMAIL_TEMPLATES.opposing_notices_client_depo, {
            opposingCounsel: OPPOSING_COUNSEL,
            caseId: c.caseId,
            clientRepName: `Risk Manager, ${c.defendant}`,
            depoDate: addCalendarDays(currentDate, 14),
          }, state),
        })
      }
    }

    // ── 3. No written discovery after 30 days ──
    if (!completed.includes('written_discovery')) {
      const key = `discovery_overdue_${c.caseId}`
      if (daysSinceFiling >= 30 && !alreadyFired(key)) {
        emails.push({
          key,
          email: makeEmail(EMAIL_TEMPLATES.discovery_overdue, {
            playerName, caseId: c.caseId, daysSinceFiling,
          }, state),
        })
      }
    }

    // ── 4. Expert deadline within 30 days, no expert retained ──
    if (!completed.includes('identify_expert') && deadlines.defendantExpertDisclosure) {
      const daysUntilDeadline = daysBetween(currentDate, deadlines.defendantExpertDisclosure)
      const key = `expert_deadline_warning_${c.caseId}`
      if (daysUntilDeadline <= 30 && daysUntilDeadline >= 0 && !alreadyFired(key)) {
        emails.push({
          key,
          email: makeEmail(EMAIL_TEMPLATES.expert_deadline_warning, {
            playerName, caseId: c.caseId, daysUntilDeadline,
          }, state),
        })
      }
    }
  }

  return emails
}
