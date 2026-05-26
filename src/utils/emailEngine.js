import { EMAIL_TEMPLATES } from '../data/emailTemplates.js'
import { calculateDeadlines } from './deadlineEngine.js'
import { daysBetween } from './dateUtils.js'

function addDaysISO(isoDate, n) {
  const d = new Date(isoDate + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

const JUDGES = ['Hon. Patricia Morales', 'Hon. David Chen', 'Hon. Sandra Williams']

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
    responded: false,
    caseId: ctx.caseId || null,
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
              opposingCounsel: c.opposingAttorney?.name || "Plaintiff's Counsel",
              opposingEmail: c.opposingAttorney?.email || 'counsel@plaintifflaw.com',
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
        const depoDate = addCalendarDays(currentDate, 14)
        const oppName = c.opposingAttorney?.name || "Plaintiff's Counsel"
        const oppEmail = c.opposingAttorney?.email || 'counsel@plaintifflaw.com'
        const oppSig = c.opposingAttorney?.signatureStyle || "Plaintiff's Counsel"
        emails.push({
          key: oppKey,
          caseId: c.caseId,
          email: {
            id: `email-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
            timestamp: currentDate,
            read: false,
            responded: false,
            caseId: c.caseId,
            from: oppName,
            fromEmail: oppEmail,
            subject: `Notice of Taking Deposition — ${c.caseId}`,
            priority: 'urgent',
            body: `Counsel,

Please be advised that Plaintiff will take the deposition of Risk Manager, ${c.defendant} in the above-referenced matter on ${depoDate} at 10:00 AM at our offices.

Please confirm the witness's availability or contact us immediately to arrange an alternative date.

${oppSig}`,
            requiresResponse: true,
            responseDeadlineGameDays: 3,
            responseOptions: [
              {
                id: 'confirm',
                label: 'Confirm deposition',
                text: `We confirm availability for the deposition on ${depoDate}. Please provide a conference room address.`,
                consequence: 'depo_confirmed',
                xp: 5,
              },
              {
                id: 'reschedule',
                label: 'Request reschedule',
                text: `The witness is unavailable on ${depoDate}. Please contact us to schedule an alternative date with adequate notice.`,
                consequence: 'depo_rescheduled',
                xp: 10,
              },
              {
                id: 'object',
                label: 'Object — inadequate notice',
                text: `We object to this notice as failing to provide adequate time for preparation. We request an extension of at least 30 days.`,
                consequence: null,
                xp: 0,
              },
            ],
          },
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

    // ── 5. Opposing discovery served at day 25 ──
    const discoveryKey = `opposing_discovery_${c.caseId}`
    if (daysSinceFiling >= 25 && !alreadyFired(discoveryKey)) {
      const rfaDeadline = addDaysISO(currentDate, 30)
      const oppName2 = c.opposingAttorney?.name || "Plaintiff's Counsel"
      const oppEmail2 = c.opposingAttorney?.email || 'counsel@plaintifflaw.com'
      const oppSig2 = c.opposingAttorney?.signatureStyle || "Plaintiff's Counsel"
      emails.push({
        key: discoveryKey,
        caseId: c.caseId,
        caseUpdates: { rfaDeadline, plaintiffDiscoveryServedDate: currentDate, plaintiffDiscoveryResponseDue: rfaDeadline, plaintiffDiscoveryResponded: false },
        email: {
          id: `email-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
          timestamp: currentDate,
          read: false,
          responded: false,
          caseId: c.caseId,
          from: oppName2,
          fromEmail: oppEmail2,
          subject: `Notice of Service of Discovery — ${c.caseId}`,
          priority: 'urgent',
          body: `Counsel,

Please be advised that Plaintiff has this date served upon Defendant a Request for Admissions, Interrogatories, and Request for Production of Documents in the above-referenced matter.

Pursuant to the Florida Rules of Civil Procedure, your responses are due within thirty (30) days of service (by ${addCalendarDays(currentDate, 30)}).

Please govern yourself accordingly.

${oppSig2}`,
        },
      })
    }

    // ── 6. Motion to compel if discovery unanswered past deadline ──
    const mtcKey = `opposing_mtc_${c.caseId}`
    if (c.rfaDeadline && currentDate > c.rfaDeadline && !completed.includes('respond_to_discovery') && !alreadyFired(mtcKey)) {
      const oppName3 = c.opposingAttorney?.name || "Plaintiff's Counsel"
      const oppEmail3 = c.opposingAttorney?.email || 'counsel@plaintifflaw.com'
      const oppSig3 = c.opposingAttorney?.signatureStyle || "Plaintiff's Counsel"
      emails.push({
        key: mtcKey,
        caseId: c.caseId,
        email: {
          id: `email-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
          timestamp: currentDate,
          read: false,
          responded: false,
          caseId: c.caseId,
          from: oppName3,
          fromEmail: oppEmail3,
          subject: `Motion to Compel Discovery Responses — ${c.caseId}`,
          priority: 'urgent',
          body: `Counsel,

Plaintiff's discovery in the above-referenced matter was due on or about ${c.rfaDeadline}, and responses remain outstanding.

Plaintiff is preparing a Motion to Compel and will seek an award of attorneys' fees and costs as sanctions for the failure to respond.

Please provide complete responses within three (3) business days or we will have no choice but to seek court intervention.

${oppSig3}`,
        },
      })
    }

    // ── 7. Opposition to MSJ filed 14 days after MSJ ──
    if (completed.includes('motion_summary_judgment')) {
      const msjDate = timestamps['motion_summary_judgment']
      if (msjDate) {
        const daysSinceMSJ = daysBetween(msjDate, currentDate)
        const oppMsjKey = `opposing_opp_msj_${c.caseId}`
        if (daysSinceMSJ >= 14 && !alreadyFired(oppMsjKey)) {
          const oppName4 = c.opposingAttorney?.name || "Plaintiff's Counsel"
          const oppEmail4 = c.opposingAttorney?.email || 'counsel@plaintifflaw.com'
          const oppSig4 = c.opposingAttorney?.signatureStyle || "Plaintiff's Counsel"
          emails.push({
            key: oppMsjKey,
            caseId: c.caseId,
            email: {
              id: `email-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
              timestamp: currentDate,
              read: false,
              responded: false,
              caseId: c.caseId,
              from: oppName4,
              fromEmail: oppEmail4,
              subject: `Opposition to Motion for Summary Judgment — ${c.caseId}`,
              priority: 'high',
              body: `Counsel,

Plaintiff has filed an Opposition to Defendant's Motion for Summary Judgment in the above-referenced matter. The Opposition argues that genuine issues of material fact remain in dispute, including questions regarding scope of employment and the adequacy of pre-suit notice.

Please review and advise whether a reply memorandum will be filed.

${oppSig4}`,
            },
          })
        }
      }
    }

    // ── 8. Mediation demand at day 90 ──
    const medKey = `mediation_demand_${c.caseId}`
    if (daysSinceFiling >= 90 && !alreadyFired(medKey)) {
      const oppName5 = c.opposingAttorney?.name || "Plaintiff's Counsel"
      const oppEmail5 = c.opposingAttorney?.email || 'counsel@plaintifflaw.com'
      const oppSig5 = c.opposingAttorney?.signatureStyle || "Plaintiff's Counsel"
      emails.push({
        key: medKey,
        caseId: c.caseId,
        email: {
          id: `email-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
          timestamp: currentDate,
          read: false,
          responded: false,
          caseId: c.caseId,
          from: oppName5,
          fromEmail: oppEmail5,
          subject: `Demand for Mediation — ${c.caseId}`,
          priority: 'high',
          body: `Counsel,

Pursuant to Florida Rule of Civil Procedure 1.700 and the applicable Local Rules, Plaintiff hereby demands that the parties proceed to court-ordered mediation in the above-referenced matter.

Please advise on your client's availability for mediation within the next 60 days and your preferred mediator.

${oppSig5}`,
          requiresResponse: true,
          responseDeadlineGameDays: 5,
          responseOptions: [
            {
              id: 'agree',
              label: 'Agree to mediation',
              text: `We agree to proceed with mediation. We will coordinate availability within the next 60 days and provide a proposed mediator list.`,
              consequence: 'mediation_agreed',
              xp: 15,
            },
            {
              id: 'propose_mediator',
              label: 'Agree and propose mediator',
              text: `We agree to mediation and propose retired Judge Patricia Morales as mediator. Please confirm her availability is acceptable to your client.`,
              consequence: 'mediation_agreed',
              xp: 20,
            },
            {
              id: 'object',
              label: 'Object — discovery incomplete',
              text: `This demand is premature. Discovery has not been completed. We request that mediation be deferred until all pending discovery is resolved.`,
              consequence: 'mediation_deferred',
              xp: -5,
            },
          ],
        },
      })
    }
  }

  return emails
}
