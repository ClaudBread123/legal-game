import { callClaude } from './anthropicProxy.js'
import { ISSUE_TYPES } from '../data/issueTypes.js'

const XP_MAP = { critical: 100, major: 50, minor: 20 }

// Penalty for INCORRECTLY flagging an issue (based on how significant that issue type is)
const INCORRECT_FLAG_PENALTY = { critical: 60, major: 30, minor: 15 }
const ISSUE_SEVERITY_MAP = Object.fromEntries(ISSUE_TYPES.map(i => [i.id, i.severity_hint || 'minor']))
const TOTAL_ISSUE_COUNT = ISSUE_TYPES.length

function has1983Claim(caseObject) {
  return (caseObject.claimsAsserted || []).some(c => c.includes('1983'))
}

function hasWhistleblowerClaim(caseObject) {
  return (caseObject.claimsAsserted || []).some(
    c => c.toLowerCase().includes('whistle-blower') || c.toLowerCase().includes('whistleblower')
  )
}

// Returns { penalize: boolean, note: string | null }
// penalize: false → don't count as incorrectly flagged, show educational note instead
// applicable: false on a hidden issue → don't count as missed
function validateIssueApplicability(issueId, caseObject) {
  switch (issueId) {
    case 'hb145_cap_applicability':
      if (has1983Claim(caseObject)) {
        return {
          applicable: false,
          note: 'Thoughtful flag. HB 145\'s increased caps ($350,000 per person / $500,000 per occurrence) apply to state tort claims accruing on or after October 1, 2026. However, on this case the dominant claims are under 42 U.S.C. §1983 — federal civil rights claims to which sovereign immunity caps do not apply. §1983 exposure is uncapped. The cap analysis matters most for Count I (whistle-blower), but that claim has its own statutory framework. No XP deduction — this shows careful thinking.',
        }
      }
      if (!caseObject.hb145Applicable) {
        return {
          applicable: false,
          note: 'HB 145 effective date is October 1, 2026. This claim accrued before that date — old caps apply ($200k per person / $300k per occurrence). Not a missed issue.',
        }
      }
      return { applicable: true, note: null }

    case 'hb145_notice_window':
      if (hasWhistleblowerClaim(caseObject)) {
        return {
          applicable: true,
          note: 'Note: The Florida Whistle-blower Act has its own notice framework distinct from §768.28(6) pre-suit notice. Verify which notice requirements apply to each specific count.',
        }
      }
      return { applicable: true, note: null }

    case 'federal_removal_1983':
      if (!has1983Claim(caseObject)) {
        return {
          applicable: false,
          note: 'No §1983 claims present in this complaint. Federal removal trigger does not apply.',
        }
      }
      return { applicable: true, note: null }

    case 'admin_exhaustion':
      if (caseObject.caseType !== 'employment' && caseObject.caseType !== 'administrative_education') {
        return {
          applicable: false,
          note: 'Administrative exhaustion requirements apply to employment discrimination and administrative education claims. This case type does not require exhaustion.',
        }
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
      const xpAwarded = XP_MAP[issue.severity] || 10
      correctlyIdentified.push({ issueId: id, feedback: `Correct. ${issue.description}`, xpAwarded })
    } else {
      const validation = validateIssueApplicability(id, caseObject)
      if (!validation.applicable && validation.note) {
        legallyNuanced.push({ issueId: id, reason: validation.note })
      } else {
        incorrectlyFlagged.push({ issueId: id, reason: 'This issue is not present on the face of the complaint.' })
      }
    }
  }

  for (const issue of caseObject.hiddenIssues || []) {
    if (selectedIssueIds.includes(issue.issueType)) continue
    const validation = validateIssueApplicability(issue.issueType, caseObject)
    if (!validation.applicable) continue
    missed.push({
      issueId: issue.issueType,
      description: issue.description,
      severity: issue.severity,
      consequence: `Failing to identify this ${issue.severity} issue may result in missed deadlines or waived defenses.`,
      statute: issue.statute,
    })
  }

  const gained = correctlyIdentified.reduce((s, i) => s + i.xpAwarded, 0)
  const perItemPenalty = incorrectlyFlagged.reduce((sum, item) => {
    const sev = ISSUE_SEVERITY_MAP[item.issueId] || 'minor'
    return sum + (INCORRECT_FLAG_PENALTY[sev] || 15)
  }, 0)
  const sprayPenalty = isSprayAndPray ? 50 : 0
  const deducted = perItemPenalty + sprayPenalty
  const rawXP = gained - deducted
  const totalXP = Math.max(0, rawXP)
  const requiresMPReview = missed.some(m => m.severity === 'critical')

  let overallAssessment = missed.length === 0
    ? 'Excellent work. All threshold issues identified correctly.'
    : `You missed ${missed.length} issue(s). Review the applicable statutes carefully before proceeding.`

  if (isSprayAndPray) {
    overallAssessment = 'Flagging every possible issue without analysis is not legal reasoning. Identify what actually applies to these facts.'
  }

  const penaltyBreakdown = rawXP < 0 || deducted > 0 ? {
    gained,
    deducted,
    sprayPenalty,
    rawXP,
    totalXP,
    isSprayAndPray,
    oniersNote: isSprayAndPray
      ? `Your issue analysis on ${caseObject.caseId} was unfocused. We need to discuss threshold issue identification.`
      : rawXP < 0
        ? `Your issue analysis on ${caseObject.caseId} produced more penalties than XP earned. Focus on what actually appears in the complaint.`
        : null,
  } : null

  return {
    correctlyIdentified,
    missed,
    incorrectlyFlagged,
    legallyNuanced,
    totalXP,
    overallAssessment,
    requiresMPReview,
    penaltyBreakdown,
  }
}

export async function evaluateIssueAnalysis({ caseObject, selectedIssueIds, playerLevel }) {
  const system = `You are a senior partner at Llopiz Wizel LLP evaluating a junior associate's issue analysis on a Florida governmental defense case. Be direct, educational, and specific. Always cite Florida statutes and explain the practical consequences of missed issues. Output valid JSON only, no markdown.`

  const userMessage = `Evaluate this issue analysis.

Fact scenario: ${caseObject.factScenario}
Claims asserted: ${JSON.stringify(caseObject.claimsAsserted)}
Actual hidden issues: ${JSON.stringify(caseObject.hiddenIssues)}
Player selected issue IDs: ${JSON.stringify(selectedIssueIds)}

IMPORTANT VALIDATION RULES:
- If the case has §1983 claims and player flags hb145_cap_applicability, do NOT penalize — it shows nuanced thinking.
- Only count federal_removal_1983 as applicable if the complaint actually contains §1983 claims.
- Only count admin_exhaustion as applicable for employment or administrative education cases.
- Do not count an issue as "missed" if it is not actually applicable to this case type.

Return JSON:
{
  "correctlyIdentified": [{"issueId": "string", "feedback": "string", "xpAwarded": number}],
  "missed": [{"issueId": "string", "description": "string", "severity": "string", "consequence": "string", "statute": "string"}],
  "incorrectlyFlagged": [{"issueId": "string", "reason": "string"}],
  "legallyNuanced": [{"issueId": "string", "reason": "string"}],
  "totalXP": number,
  "overallAssessment": "string (2-3 sentences)",
  "requiresMPReview": boolean
}

XP awards: critical issue identified = 100, major = 50, minor = 20.
XP deductions: incorrectly flagged = -60 if critical issue type, -30 if major, -15 if minor (check severity_hint in issue types).
If player selected ALL 10 issue types: apply additional -50 XP spray-and-pray penalty.
totalXP must be Math.max(0, gained - deducted).
Include penaltyBreakdown: { gained, deducted, sprayPenalty, rawXP, totalXP, isSprayAndPray, oniersNote } when deducted > 0.
legallyNuanced items get 0 XP deduction.`

  try {
    const text = await callClaude({ system, userMessage, maxTokens: 1400 })
    const parsed = JSON.parse(text)
    // Ensure legallyNuanced field exists even if API omits it
    if (!parsed.legallyNuanced) parsed.legallyNuanced = []
    return parsed
  } catch {
    return localEvaluate(caseObject, selectedIssueIds)
  }
}
