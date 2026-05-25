import { callClaude } from './anthropicProxy.js'
import { ISSUE_TYPES } from '../data/issueTypes.js'

const XP_MAP = { critical: 100, major: 50, minor: 20 }
const INCORRECT_FLAG_PENALTY = { critical: 60, major: 30, minor: 15 }
const ISSUE_SEVERITY_MAP = Object.fromEntries(ISSUE_TYPES.map(i => [i.id, i.severity_hint || 'minor']))
const TOTAL_ISSUE_COUNT = ISSUE_TYPES.length

function has1983Claim(caseObject) {
  return (caseObject.claimsAsserted || []).some(c => c.includes('1983'))
}

function validateIssueApplicability(issueId, caseObject) {
  switch (issueId) {
    case 'hb145_cap_applicability':
      if (has1983Claim(caseObject)) {
        return {
          applicable: false,
          note: 'Thoughtful flag. HB 145 caps apply to state tort claims — §1983 exposure is uncapped. No XP deduction.',
        }
      }
      if (!caseObject.hb145Applicable) {
        return { applicable: false, note: 'HB 145 effective Oct 1, 2026. Old caps apply ($200k/$300k) for this incident date.' }
      }
      return { applicable: true, note: null }
    case 'federal_removal_1983':
      if (!has1983Claim(caseObject)) {
        return { applicable: false, note: 'No §1983 claims present. Removal trigger does not apply.' }
      }
      return { applicable: true, note: null }
    case 'admin_exhaustion':
      if (caseObject.caseType !== 'employment' && caseObject.caseType !== 'administrative_education') {
        return { applicable: false, note: 'Admin exhaustion applies to employment/admin education claims only.' }
      }
      return { applicable: true, note: null }
    default:
      return { applicable: true, note: null }
  }
}

function localEvaluate(caseObject, selectedIssueIds) {
  const correctlyIdentified = []
  const missed = []
  const incorrectlyFlagged = []
  const legallyNuanced = []
  const hiddenIds = (caseObject.hiddenIssues || []).map(i => i.issueType)
  const isSprayAndPray = selectedIssueIds.length === TOTAL_ISSUE_COUNT

  for (const id of selectedIssueIds) {
    if (hiddenIds.includes(id)) {
      const issue = caseObject.hiddenIssues.find(h => h.issueType === id)
      correctlyIdentified.push({ issueId: id, feedback: `Correct. ${issue.description}`, xpAwarded: XP_MAP[issue.severity] || 10 })
    } else {
      const v = validateIssueApplicability(id, caseObject)
      if (!v.applicable && v.note) legallyNuanced.push({ issueId: id, reason: v.note })
      else incorrectlyFlagged.push({ issueId: id, reason: 'This issue is not present on the face of the complaint.' })
    }
  }

  for (const issue of caseObject.hiddenIssues || []) {
    if (selectedIssueIds.includes(issue.issueType)) continue
    const v = validateIssueApplicability(issue.issueType, caseObject)
    if (!v.applicable) continue
    missed.push({
      issueId: issue.issueType, description: issue.description, severity: issue.severity,
      consequence: `Failing to identify this ${issue.severity} issue may result in missed deadlines or waived defenses.`,
      statute: issue.statute,
    })
  }

  const gained = correctlyIdentified.reduce((s, i) => s + i.xpAwarded, 0)
  const perItemPenalty = incorrectlyFlagged.reduce((sum, item) => {
    return sum + (INCORRECT_FLAG_PENALTY[ISSUE_SEVERITY_MAP[item.issueId] || 'minor'] || 15)
  }, 0)
  const sprayPenalty = isSprayAndPray ? 50 : 0
  const rawXP = gained - perItemPenalty - sprayPenalty
  const totalXP = Math.max(0, rawXP)
  const requiresMPReview = missed.some(m => m.severity === 'critical')

  let overallAssessment = missed.length === 0
    ? 'Excellent work. All threshold issues identified correctly.'
    : `You missed ${missed.length} issue(s). Review the applicable statutes carefully before proceeding.`
  if (isSprayAndPray) overallAssessment = 'Flagging every possible issue without analysis is not legal reasoning.'

  const penaltyBreakdown = rawXP < 0 || (perItemPenalty + sprayPenalty) > 0 ? {
    gained, deducted: perItemPenalty + sprayPenalty, sprayPenalty, rawXP, totalXP, isSprayAndPray,
    oniersNote: isSprayAndPray
      ? `Your issue analysis on ${caseObject.caseId} was unfocused.`
      : rawXP < 0 ? `Your issue analysis on ${caseObject.caseId} produced more penalties than XP.` : null,
  } : null

  return { correctlyIdentified, missed, incorrectlyFlagged, legallyNuanced, totalXP, overallAssessment, requiresMPReview, penaltyBreakdown }
}

export async function evaluateIssueAnalysis({ caseObject, selectedIssueIds, playerLevel }) {
  const hiddenIssues = caseObject.hiddenIssues || []
  const correctIds = hiddenIssues.map(i => i.issueType)

  const system = `You evaluate a law student's issue spotting on a Florida governmental defense complaint.
Output ONLY valid JSON. No markdown.
Rules: §768.28(9) bars individual govt employees sued in scope of employment. §768.28(6) requires pre-suit notice. HB145 (Oct 1 2026) changes caps and notice window. §1983 is removable within 30 days and not subject to caps.`

  const userMessage = `Case: ${caseObject.defendant}
Facts: ${caseObject.factScenario.substring(0, 300)}
Claims: ${caseObject.claimsAsserted.join('; ')}
Hidden issues: ${JSON.stringify(correctIds)}
Player selected: ${JSON.stringify(selectedIssueIds)}
HB145 applicable: ${caseObject.hb145Applicable}

Return JSON:
{
  "correctlyIdentified": [{"issueId": "id", "feedback": "why correct", "xpAwarded": 50}],
  "missed": [{"issueId": "id", "description": "what was missed", "severity": "critical|major|minor", "consequence": "real consequence", "statute": "citation"}],
  "incorrectlyFlagged": [{"issueId": "id", "reason": "why wrong"}],
  "legallyNuanced": [{"issueId": "id", "reason": "nuanced explanation"}],
  "totalXP": 0,
  "overallAssessment": "2-3 sentences",
  "requiresMPReview": false,
  "penaltyBreakdown": null
}

XP: critical=100, major=50, minor=20. Wrong flags: critical=-60, major=-30, minor=-15. All issues flagged: -50 spray penalty. totalXP = Math.max(0, gained - deducted).
Do not penalize legallyNuanced flags. requiresMPReview true if any critical issue missed.`

  try {
    const text = await callClaude({ system, userMessage, maxTokens: 1200 })
    const clean = text.replace(/```json/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(clean)
    if (!parsed.legallyNuanced) parsed.legallyNuanced = []
    return parsed
  } catch {
    return localEvaluate(caseObject, selectedIssueIds)
  }
}
