import { callClaude } from './anthropicProxy.js'

const LEGAL_SIGNALS = ['768', '1983', 'dismiss', 'motion', 'sovereign', 'immunity', 'statute', 'notice', 'claim', 'defendant', 'plaintiff', 'court', 'florida', 'liability', 'damages', 'discovery', 'deposition', 'summary', 'judgment', 'section', '§', 'rule', 'evidence', 'counsel', 'defense', 'exposure', 'government', 'municipal', 'tort']

const SCREENING_RESPONSES = {
  too_short: {
    rating: 'DEFICIENT', qualityScore: 1, xpMultiplier: 0.0, screened: true,
    summary: 'This response is too brief to constitute legal analysis. A minimum of 30 words is required.',
    strengths: [],
    gaps: [{ issue: 'Insufficient length', consequence: 'Cannot assess legal reasoning from fewer than 30 words', statute: null }],
    modelApproach: 'Identify the applicable statutes, apply them to the specific facts, and explain your reasoning.',
    oniersNote: 'This is not a response — it is a sentence. Legal analysis requires more than this.',
  },
  repetitive: {
    rating: 'DEFICIENT', qualityScore: 1, xpMultiplier: 0.0, screened: true,
    summary: 'This response consists of repetitive text that does not constitute legal analysis.',
    strengths: [],
    gaps: [{ issue: 'Repetitive content', consequence: 'Submitting filler text demonstrates no legal reasoning', statute: null }],
    modelApproach: 'Identify the applicable statutes, apply them to the facts, and explain your reasoning clearly.',
    oniersNote: 'I do not know what this is, but it is not legal analysis.',
  },
  no_legal_content: {
    rating: 'DEFICIENT', qualityScore: 1, xpMultiplier: 0.0, screened: true,
    summary: 'This response contains no legal analysis. No statutes, legal concepts, or case-specific reasoning are present.',
    strengths: [],
    gaps: [{ issue: 'No legal content detected', consequence: 'Without legal analysis, no defense strategy can be built', statute: null }],
    modelApproach: 'Reference §768.28 and other applicable Florida statutes. Apply them to the specific facts and claims.',
    oniersNote: 'You are an attorney. Write like one.',
  },
}

function screenResponse(playerResponse) {
  const text = playerResponse.trim()
  const words = text.split(/\s+/)
  const uniqueWords = new Set(words.map(w => w.toLowerCase()))
  if (words.length < 30) return { failed: true, reason: 'too_short' }
  if (uniqueWords.size / words.length < 0.20 && words.length > 20) return { failed: true, reason: 'repetitive' }
  if (!LEGAL_SIGNALS.some(s => text.toLowerCase().includes(s))) return { failed: true, reason: 'no_legal_content' }
  return { failed: false }
}

function buildEvaluationSystemPrompt(playerTitle) {
  const standards = {
    'Junior Associate': `You are grading a JUNIOR ASSOCIATE (0-2 years experience). Grade on this standard:
EXCELLENT: Correctly identifies primary immunity grounds, cites correct Florida statute by section number, applies statute to case facts, explains the legal consequence. Does not need to be perfectly written.
GOOD: Identifies main legal issues, cites at least one relevant statute, shows understanding of the defense theory.
ADEQUATE: Shows basic understanding of governmental immunity concepts even if analysis is incomplete.
POOR: Significant legal errors or misses the primary defense entirely.
DEFICIENT: No legal analysis, nonsense, or fundamentally wrong legal theory.

DO NOT penalize for: imperfect writing style, incomplete citation format, missing secondary arguments when primary argument is correct, informal tone.
DO penalize for: wrong statute, wrong legal standard, missing the single most important defense on these facts.`,

    'Associate': `You are grading an ASSOCIATE (2-4 years experience). Expect correct statute citations, application to specific facts, and identification of all major threshold issues.
EXCELLENT: All major issues identified, correct statutes, case-specific application, strategic thinking about sequencing.
GOOD: Primary issues identified correctly with adequate statutory support.
ADEQUATE: Main issue identified but secondary issues missed or analysis is thin.
POOR: Misses a major threshold issue or significant legal error.
DEFICIENT: Fundamental misunderstanding of governmental immunity framework.`,

    'Senior Associate': `You are grading a SENIOR ASSOCIATE (4-7 years). Expect comprehensive analysis, all threshold issues, strategic sequencing, and HB 145 application where relevant. Grade strictly — at this level, missing a secondary issue is ADEQUATE not GOOD.`,

    'default': `You are grading a practicing Florida attorney on governmental defense analysis. Apply professional standards appropriate to their stated experience level.`,
  }

  const standard = standards[playerTitle] || standards['default']

  return `You are Onier Llopiz, senior partner at Llopiz Wizel LLP, evaluating an associate's written legal analysis on a Florida governmental defense case.

${standard}

CRITICAL: Be fair and calibrated. Do not give DEFICIENT to an associate who correctly identified the key legal issue and cited the right statute, even if their writing is imperfect. Reserve DEFICIENT for responses that show fundamental misunderstanding or no real legal analysis.

The associate represents the DEFENDANT (governmental entity). The plaintiff is the adverse party suing our client.

Output ONLY valid JSON. No markdown.`
}

export async function evaluateResponse({
  caseObject, actionId, actionLabel, playerResponse, playerTitle, checkData,
}) {
  const screen = screenResponse(playerResponse)
  if (screen.failed) return SCREENING_RESPONSES[screen.reason]

  const systemPrompt = buildEvaluationSystemPrompt(playerTitle)

  const userPrompt = `Action: ${actionLabel}
Associate career level: ${playerTitle || 'Junior Associate'}
Grade according to the standards defined for this career level.
Case: ${caseObject.defendant} | Incident: ${caseObject.dateOfIncident} | HB145: ${caseObject.hb145Applicable}
Claims: ${caseObject.claimsAsserted.slice(0, 3).join('; ')}
Key issues: ${(caseObject.hiddenIssues || []).map(i => i.issueType).join(', ')}
Facts: ${caseObject.factScenario.substring(0, 200)}
Florida law context: §768.28(9) bars individual govt employees in scope. §768.28(6) pre-suit notice required. HB145 (Oct 1 2026) changes caps ($350k/$500k) and notice window (18 months). §1983 removable within 30 days, uncapped.

Associate's response:
"${playerResponse.substring(0, 500)}"

Rate the response. Return JSON:
{
  "rating": "EXCELLENT|GOOD|ADEQUATE|POOR|DEFICIENT",
  "qualityScore": 3,
  "xpMultiplier": 1.0,
  "confidenceScore": "HIGH",
  "summary": "2-3 sentences on this specific response",
  "strengths": ["specific strength"],
  "gaps": [{"issue": "what was missed", "consequence": "real consequence", "statute": "citation or null"}],
  "modelApproach": "what excellent looks like on this specific case in 2-3 sentences",
  "oniersNote": "direct personal note to the associate — 1-2 sentences"
}

Quality/XP mapping:
EXCELLENT: score 3, multiplier 1.0 | GOOD: score 3, multiplier 0.85
ADEQUATE: score 2, multiplier 0.6 | POOR: score 1, multiplier 0.3 | DEFICIENT: score 1, multiplier 0.1`

  try {
    const response = await callClaude({ system: systemPrompt, userMessage: userPrompt, maxTokens: 1000 })
    const clean = response.replace(/```json/g, '').replace(/```/g, '').trim()
    return JSON.parse(clean)
  } catch (err) {
    return getFallbackEvaluation(playerResponse, actionId, checkData)
  }
}

function getFallbackEvaluation(playerResponse, actionId, checkData) {
  const wordCount = playerResponse.trim().split(/\s+/).filter(Boolean).length
  if (wordCount < 20) {
    return {
      rating: 'DEFICIENT', qualityScore: 1, xpMultiplier: 0.1,
      summary: 'Response is too brief to demonstrate genuine analysis.',
      strengths: [],
      gaps: [{ issue: 'Insufficient analysis provided', consequence: 'Cannot assess legal reasoning from a one-sentence response', statute: null }],
      modelApproach: checkData?.qualityRubric?.excellent || 'Thorough legal analysis with statute citations required.',
      oniersNote: 'I need more than this. Walk me through your actual reasoning.',
    }
  }
  if (wordCount < 60) {
    return {
      rating: 'ADEQUATE', qualityScore: 2, xpMultiplier: 0.6,
      summary: 'Response shows basic understanding but lacks depth and specificity.',
      strengths: ['Basic issue identification present'],
      gaps: [{ issue: 'Analysis lacks statutory specificity', consequence: 'Incomplete analysis may miss threshold issues', statute: null }],
      modelApproach: checkData?.qualityRubric?.excellent || 'Full statutory analysis with case-specific application required.',
      oniersNote: 'You have the right idea but I need more depth. Cite the statutes.',
    }
  }
  return {
    rating: 'GOOD', qualityScore: 3, xpMultiplier: 0.85,
    summary: 'Response demonstrates reasonable analysis. Full AI evaluation unavailable in offline mode.',
    strengths: ['Substantive response provided'],
    gaps: [],
    modelApproach: checkData?.qualityRubric?.excellent || 'See key statutes for complete analysis framework.',
    oniersNote: 'Solid effort. Connect with me when AI evaluation is available for detailed feedback.',
  }
}
