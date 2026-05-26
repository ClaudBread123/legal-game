import { daysBetween } from './dateUtils.js'
import { calculateDeadlines } from './deadlineEngine.js'

function buildWhatWentRight(caseObject, completed) {
  const items = []
  if (completed.includes('motion_to_dismiss')) items.push('Motion to Dismiss filed asserting all available immunity grounds')
  if (completed.includes('notice_mtd_hearing')) items.push('Hearing noticed with adequate time for full argument')
  const mtdQ = caseObject.actionQualityScores?.motion_to_dismiss || 0
  if (mtdQ === 3) items.push('Excellent threshold issue analysis demonstrated clear immunity grounds')
  else if (mtdQ >= 2) items.push('Adequate immunity grounds asserted and argued')
  if (completed.includes('written_discovery')) items.push('Written discovery served to build the defense record')
  if (completed.includes('take_plaintiff_depo')) items.push('Plaintiff deposition taken — sworn record established')
  return items.length > 0 ? items : ['Case management maintained adequate health for viable defense']
}

function buildWhatWentWrong(caseObject, completed) {
  const issues = []
  if (!completed.includes('motion_to_dismiss'))
    issues.push('Motion to Dismiss never filed — threshold immunity defenses never asserted')
  if (!completed.includes('written_discovery'))
    issues.push('Written discovery never served — no control of the discovery record')
  if (!completed.includes('take_plaintiff_depo'))
    issues.push('Plaintiff never deposed — no sworn testimony to support summary judgment')
  if (!completed.includes('motion_summary_judgment'))
    issues.push('Summary judgment never filed — case allowed to proceed to trial without attempting dispositive resolution')
  if (!completed.includes('identify_expert'))
    issues.push('Expert witness never disclosed — no expert support for defense')
  if ((caseObject.activeConsequences || []).length > 2)
    issues.push(`${caseObject.activeConsequences.length} active case management failures — compound damage to case health`)
  return issues.length > 0 ? issues : ['Case health deteriorated below viable defense threshold']
}

function buildLossNote(caseObject, completed) {
  if (!completed.includes('motion_to_dismiss'))
    return `The motion to dismiss was never filed. That is where governmental defense begins. Every case — every single case — requires immediate threshold analysis and a motion to dismiss on all available grounds. This cannot happen again. — OL`
  if (!completed.includes('take_plaintiff_depo'))
    return `We never deposed the plaintiff. The entire summary judgment strategy depends on building a deposition record. Without it, we had nothing to work with at the dispositive motion stage. — OL`
  return `The case health deteriorated beyond the point of recovery. Review every consequence that triggered and understand why each one happened. This is how you learn. — OL`
}

function buildAdverseJudgment(caseObject) {
  const completed = caseObject.completedActions || []
  const cap = caseObject.hb145Applicable ? 350000 : 200000
  const damages = Math.round(cap * (0.6 + Math.random() * 0.4))
  return {
    id: 'adverse_outcome',
    outcome: 'loss',
    color: 'var(--accent-red)',
    label: 'Adverse Judgment — Plaintiff Prevails',
    subtitle: 'Judgment Entered Against Client',
    icon: '⚠',
    xpReward: 10,
    damages,
    description: `The court granted plaintiff's Motion for Summary Judgment. Judgment has been entered against ${caseObject.defendant} in the amount of $${damages.toLocaleString()}.`,
    whatWentRight: null,
    whatWentWrong: buildWhatWentWrong(caseObject, completed),
    oniersNote: buildLossNote(caseObject, completed),
    notAResolution: false,
  }
}

export function checkCaseResolution(caseObject, currentDate) {
  if (caseObject.resolved || caseObject.resolutionTriggered) return null

  const completed = caseObject.completedActions || []
  const health = caseObject.caseHealth ?? 100
  const deadlines = calculateDeadlines(caseObject)
  const daysSinceFiling = daysBetween(caseObject.dateFiled, currentDate)

  // Minimum case duration — no resolution before day 30
  if (daysSinceFiling < 30) return null

  const mtdQuality = caseObject.actionQualityScores?.motion_to_dismiss ?? 2
  const hearingDone = completed.includes('notice_mtd_hearing')
  const mtdDone = completed.includes('motion_to_dismiss')

  // PATH 1 — MTD PROBABILISTIC RESOLUTION
  const mtdReadyForRoll = mtdDone && hearingDone && mtdQuality >= 2 && daysSinceFiling >= 60 && !caseObject.mtdDenied

  if (mtdReadyForRoll || caseObject.mtdRolled) {
    // Already rolled — return stored result
    if (caseObject.mtdRolled) {
      if (caseObject.mtdResult === 'granted') {
        const xpReward = mtdQuality === 3 ? 300 : 200
        return {
          path: 'MTD_GRANTED',
          id: 'dismissal_win',
          outcome: 'strongWin',
          color: '#4ade80',
          label: 'Motion to Dismiss Granted',
          subtitle: 'Case Dismissed With Prejudice',
          icon: '⚖',
          xpReward,
          description: `The court granted the Motion to Dismiss in ${caseObject.clientName} v. ${caseObject.defendant}. The complaint was dismissed as legally insufficient. ${mtdQuality === 3 ? 'Excellent threshold issue analysis and proper hearing preparation led to this result.' : 'The motion was adequate. Stronger analysis could have accelerated this outcome.'}`,
          whatWentRight: buildWhatWentRight(caseObject, completed),
          whatWentWrong: null,
          oniersNote: mtdQuality === 3
            ? `Well done. This is exactly how threshold governmental defense works on a case like ${caseObject.defendant}. Identify the immunity grounds early, assert them all, and set the hearing properly. — OL`
            : `The motion worked. We got the right result for ${caseObject.defendant} — review the order and understand why the court agreed. Sharper analysis would have made this more certain. — OL`,
          notAResolution: false,
        }
      }
      return null // mtdResult === 'denied' — setback already applied, case continues
    }

    // First time reaching conditions — do the probabilistic roll
    if (mtdReadyForRoll) {
      const winProb = mtdQuality === 3 && health >= 65 ? 0.75
        : mtdQuality >= 2 && health >= 55 ? 0.50
        : 0.25
      return { path: 'MTD_ROLL', won: Math.random() < winProb }
    }
  }

  // PATH 2 — MTD DENIED SETBACK (no hearing set — procedural failure)
  if (mtdDone && !hearingDone && daysSinceFiling >= 45 && !caseObject.mtdDenied) {
    return {
      path: 'MTD_DENIED',
      id: 'mtd_denied',
      outcome: 'setback',
      color: 'var(--accent-red)',
      label: 'Motion to Dismiss Denied',
      subtitle: 'Hearing Not Set — Case Continues',
      icon: '⚠',
      xpReward: 0,
      healthPenalty: -15,
      description: 'The Motion to Dismiss was denied for failure to set an adequate hearing. The case proceeds to full discovery.',
      notAResolution: true,
    }
  }

  // PATH 3 — SUMMARY JUDGMENT → WIN (probabilistic based on health)
  const msjQuality = caseObject.actionQualityScores?.motion_summary_judgment || 0
  const msjDone = completed.includes('motion_summary_judgment')
  const deposDone = completed.includes('take_plaintiff_depo')
  const discoveryDone = completed.includes('written_discovery')

  if (msjDone && deposDone && discoveryDone && msjQuality >= 2 && daysSinceFiling >= 120) {
    const winProb = health >= 70 ? 0.80 : health >= 55 ? 0.55 : health >= 40 ? 0.30 : 0.10
    if (Math.random() < winProb) {
      return {
        id: 'summary_judgment_win',
        outcome: 'strongWin',
        color: '#4ade80',
        label: 'Summary Judgment Granted',
        subtitle: 'No Genuine Issue of Material Fact',
        icon: '⚖',
        xpReward: 350,
        description: `The court granted Defendant's Motion for Summary Judgment in ${caseObject.clientName} v. ${caseObject.defendant}. The court found no genuine dispute of material fact and that Defendant is entitled to judgment as a matter of law.`,
        whatWentRight: [
          'Written discovery served strategically',
          'Plaintiff deposition taken and record built',
          msjQuality === 3 ? 'Excellent summary judgment analysis citing deposition testimony' : 'Adequate summary judgment record built',
          health >= 70 ? 'Case health maintained throughout — strong overall defense posture' : null,
        ].filter(Boolean),
        whatWentWrong: null,
        oniersNote: `This is what we build toward from day one. Every deposition question, every RFA, every piece of discovery — all designed to create this record. Outstanding work. — OL`,
        notAResolution: false,
      }
    }
  }

  // PATH 4 — ADVERSE JUDGMENT (plaintiff MSJ + time gate)
  if (caseObject.plaintiffMSJFiled) {
    const daysSinceMSJ = caseObject.plaintiffMSJDate
      ? daysBetween(caseObject.plaintiffMSJDate, currentDate)
      : 0
    if (daysSinceMSJ >= 20) {
      const filedOpposition = completed.includes('oppose_plaintiff_msj')
      if (!filedOpposition) {
        return buildAdverseJudgment(caseObject)
      } else {
        if (health < 30) return buildAdverseJudgment(caseObject)
        return null
      }
    }
    return null
  }

  // PATH 5 — TRIAL VERDICT (trial date passed with no resolution)
  const trialPassed = currentDate >= deadlines.trialDate
  if (trialPassed && !msjDone && !caseObject.settled) {
    const cap = caseObject.hb145Applicable ? 350000 : 200000
    const isWin = health >= 60
    const damages = isWin ? 0 : Math.round(cap * (
      health < 40 ? 0.7 + Math.random() * 0.3
      : 0.4 + Math.random() * 0.3
    ))
    const trialDays = 3 + Math.floor(Math.random() * 3)
    return {
      id: isWin ? 'favorable_settlement' : 'adverse_outcome',
      outcome: isWin ? 'strongWin' : 'loss',
      color: isWin ? '#4ade80' : 'var(--accent-red)',
      label: isWin ? 'Defense Verdict — Trial Won' : 'Plaintiff Verdict — Trial Lost',
      subtitle: `After ${trialDays}-day trial`,
      icon: isWin ? '⚖' : '⚠',
      xpReward: isWin ? 200 : 10,
      damages,
      description: isWin
        ? `After a ${trialDays}-day trial, the jury returned a defense verdict in favor of ${caseObject.defendant}. The aggressive litigation strategy and strong discovery record paid off.`
        : `After a ${trialDays}-day trial, the jury returned a verdict for plaintiff in the amount of $${damages.toLocaleString()}.`,
      whatWentRight: isWin ? ['Maintained case health throughout litigation', 'Strong defense record at trial'] : null,
      whatWentWrong: !isWin ? buildWhatWentWrong(caseObject, completed) : null,
      oniersNote: isWin
        ? `A trial win on a governmental defense matter is never easy. You earned this. — OL`
        : buildLossNote(caseObject, completed),
      notAResolution: false,
    }
  }

  // PATH 6 — SETTLEMENT AT MEDIATION
  const mediationDone = completed.includes('request_mediation')
  const preMediationDone = completed.includes('pre_mediation_report')
  if (mediationDone && preMediationDone && daysSinceFiling >= 90 && !caseObject.settled) {
    const cap = caseObject.hb145Applicable ? 350000 : 200000
    const settlementPct = health >= 80 ? 0.15 : health >= 65 ? 0.30 : health >= 50 ? 0.50 : 0.70
    const amount = Math.round(cap * (settlementPct + Math.random() * 0.10))
    const rating = settlementPct <= 0.20 ? 'EXCELLENT' : settlementPct <= 0.35 ? 'REASONABLE' : settlementPct <= 0.55 ? 'ACCEPTABLE' : 'UNFAVORABLE'
    return {
      id: 'favorable_settlement',
      outcome: rating === 'EXCELLENT' || rating === 'REASONABLE' ? 'settleDefense' : 'settleNeutral',
      color: rating === 'EXCELLENT' || rating === 'REASONABLE' ? '#4a9eff' : 'var(--accent-yellow)',
      label: `Case Settled — ${rating}`,
      subtitle: `$${amount.toLocaleString()} (${Math.round(settlementPct * 100)}% of cap)`,
      icon: '🤝',
      xpReward: rating === 'EXCELLENT' ? 150 : rating === 'REASONABLE' ? 100 : rating === 'ACCEPTABLE' ? 60 : 25,
      settlementAmount: amount,
      settlementPct: Math.round(settlementPct * 100),
      settlementRating: rating,
      cap,
      description: `The matter settled at mediation for $${amount.toLocaleString()} (${Math.round(settlementPct * 100)}% of the applicable §768.28(5) cap of $${cap.toLocaleString()}).`,
      whatWentRight: null,
      whatWentWrong: null,
      oniersNote: rating === 'EXCELLENT'
        ? `Excellent settlement. Strong case management drove this result. — OL`
        : rating === 'UNFAVORABLE'
        ? `This settlement is higher than it should have been. Better case management earlier would have produced a better number. — OL`
        : `Reasonable resolution. — OL`,
      notAResolution: false,
    }
  }

  return null
}

// Legacy exports kept for any remaining consumers
export const RESOLUTION_PATHS = {
  dismissal_win: { id: 'dismissal_win', label: 'Dismissed With Prejudice', outcome: 'strongWin', color: '#4ade80', xpReward: 300 },
  summary_judgment_win: { id: 'summary_judgment_win', label: 'Summary Judgment Granted', outcome: 'strongWin', color: '#4ade80', xpReward: 250 },
  favorable_settlement: { id: 'favorable_settlement', label: 'Favorable Settlement', outcome: 'settleDefense', color: '#4a9eff', xpReward: 200 },
  neutral_settlement: { id: 'neutral_settlement', label: 'Case Settled', outcome: 'settleNeutral', color: 'var(--accent-yellow)', xpReward: 100 },
  adverse_outcome: { id: 'adverse_outcome', label: 'Adverse Outcome', outcome: 'loss', color: 'var(--accent-red)', xpReward: 25 },
}

export function shouldTriggerResolution() { return false }
export function determineResolutionPath() { return RESOLUTION_PATHS.neutral_settlement }
