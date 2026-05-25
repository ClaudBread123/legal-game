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

export async function evaluateResponse({
  caseObject, actionId, actionLabel, playerResponse, playerTitle, checkData,
}) {
  const screen = screenResponse(playerResponse)
  if (screen.failed) return SCREENING_RESPONSES[screen.reason]

  const systemPrompt = `You are Onier Llopiz, senior partner at Llopiz Wizel LLP, evaluating a junior associate's written legal analysis.
Rate: EXCELLENT, GOOD, ADEQUATE, POOR, or DEFICIENT.
Output ONLY valid JSON. No markdown.
Florida law: §768.28(9) bars individual govt employees in scope of employment. §768.28(6) pre-suit notice required. HB145 (Oct 1 2026) changes caps ($350k/$500k) and notice window (18 months). §1983 removable within 30 days, uncapped.
The associate represents the DEFENDANT (governmental entity) against the PLAINTIFF. Analysis must be from the defense perspective.`

  const userPrompt = `Action: ${actionLabel}
Case: ${caseObject.defendant} | Incident: ${caseObject.dateOfIncident} | HB145: ${caseObject.hb145Applicable}
Claims: ${caseObject.claimsAsserted.slice(0, 3).join('; ')}
Key issues: ${(caseObject.hiddenIssues || []).map(i => i.issueType).join(', ')}
Facts: ${caseObject.factScenario.substring(0, 200)}

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
