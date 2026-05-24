import { callClaude } from './anthropicProxy.js'
import { ISSUE_TYPES } from '../data/issueTypes.js'

const XP_MAP = { critical: 50, major: 25, minor: 10 }

function localEvaluate(caseObject, selectedIssueIds) {
  const correctlyIdentified = []
  const missed = []
  const incorrectlyFlagged = []

  const hiddenIds = (caseObject.hiddenIssues || []).map(i => i.issueType)

  for (const issue of caseObject.hiddenIssues || []) {
    if (selectedIssueIds.includes(issue.issueType)) {
      const xpAwarded = XP_MAP[issue.severity] || 10
      correctlyIdentified.push({
        issueId: issue.issueType,
        feedback: `Correct. ${issue.description}`,
        xpAwarded,
      })
    } else {
      missed.push({
        issueId: issue.issueType,
        description: issue.description,
        severity: issue.severity,
        consequence: `Failing to identify this ${issue.severity} issue may result in missed deadlines or waived defenses.`,
        statute: issue.statute,
      })
    }
  }

  for (const id of selectedIssueIds) {
    if (!hiddenIds.includes(id)) {
      incorrectlyFlagged.push({ issueId: id, reason: 'This issue is not present on the face of the complaint.' })
    }
  }

  const totalXP =
    correctlyIdentified.reduce((s, i) => s + i.xpAwarded, 0) - incorrectlyFlagged.length * 5
  const requiresMPReview = missed.some(m => m.severity === 'critical')

  return {
    correctlyIdentified,
    missed,
    incorrectlyFlagged,
    totalXP: Math.max(0, totalXP),
    overallAssessment:
      missed.length === 0
        ? 'Excellent work. All threshold issues identified correctly.'
        : `You missed ${missed.length} issue(s). Review the statutes carefully before proceeding.`,
    requiresMPReview,
  }
}

export async function evaluateIssueAnalysis({ caseObject, selectedIssueIds, playerLevel }) {
  const system = `You are a senior partner at Llopiz Wizel LLP evaluating a junior associate's issue analysis on a Florida governmental defense case. Be direct, educational, and specific. Always cite Florida statutes and explain the practical consequences of missed issues. Output valid JSON only, no markdown.`

  const userMessage = `Evaluate this issue analysis.

Fact scenario: ${caseObject.factScenario}
Claims asserted: ${JSON.stringify(caseObject.claimsAsserted)}
Actual hidden issues: ${JSON.stringify(caseObject.hiddenIssues)}
Player selected issue IDs: ${JSON.stringify(selectedIssueIds)}

Return JSON:
{
  "correctlyIdentified": [{"issueId": "string", "feedback": "string", "xpAwarded": number}],
  "missed": [{"issueId": "string", "description": "string", "severity": "string", "consequence": "string", "statute": "string"}],
  "incorrectlyFlagged": [{"issueId": "string", "reason": "string"}],
  "totalXP": number,
  "overallAssessment": "string (2-3 sentences)",
  "requiresMPReview": boolean
}

XP awards: critical issue identified = 50, major = 25, minor = 10. XP deductions: incorrectly flagged = -5 each.`

  try {
    const text = await callClaude({ system, userMessage, maxTokens: 1200 })
    return JSON.parse(text)
  } catch {
    return localEvaluate(caseObject, selectedIssueIds)
  }
}
