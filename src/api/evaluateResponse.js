import { callClaude } from './anthropicProxy.js'
import { getLegalContextForAction } from '../data/legalKnowledgeBase.js'
import { withConfidenceRetry } from './withConfidenceRetry.js'

const LEGAL_SIGNALS = ['768', '1983', 'dismiss', 'motion', 'sovereign', 'immunity', 'statute', 'notice', 'claim', 'defendant', 'plaintiff', 'court', 'florida', 'liability', 'damages', 'discovery', 'deposition', 'summary', 'judgment', 'section', '§', 'rule', 'evidence', 'witness', 'counsel', 'filing', 'complaint', 'defense', 'exposure', 'government', 'municipal', 'charter', 'employment', 'discrimination', 'tort']

const SCREENING_RESPONSES = {
  too_short: {
    rating: 'DEFICIENT',
    qualityScore: 1,
    xpMultiplier: 0.0,
    screened: true,
    summary: 'This response is too brief to constitute legal analysis. A minimum of 30 words is required to demonstrate any engagement with the legal issues.',
    strengths: [],
    gaps: [{ issue: 'Insufficient length', consequence: 'Cannot assess legal reasoning from fewer than 30 words', statute: null }],
    modelApproach: 'Identify the applicable statutes, apply them to the specific facts of this case, and explain your reasoning with sufficient detail to demonstrate legal analysis.',
    oniersNote: 'This is not a response — it is a sentence. Legal analysis requires more than this.',
  },
  repetitive: {
    rating: 'DEFICIENT',
    qualityScore: 1,
    xpMultiplier: 0.0,
    screened: true,
    summary: 'This response consists of repetitive text that does not constitute legal analysis.',
    strengths: [],
    gaps: [{ issue: 'Repetitive content', consequence: 'Submitting filler text demonstrates no legal reasoning and cannot be evaluated', statute: null }],
    modelApproach: 'Identify the applicable statutes, apply them to the facts, and explain your reasoning clearly and without repetition.',
    oniersNote: 'I do not know what this is, but it is not legal analysis.',
  },
  no_legal_content: {
    rating: 'DEFICIENT',
    qualityScore: 1,
    xpMultiplier: 0.0,
    screened: true,
    summary: 'This response contains no legal analysis. No statutes, legal concepts, or case-specific reasoning are present.',
    strengths: [],
    gaps: [{ issue: 'No legal content detected', consequence: 'Without legal analysis, no defense strategy can be built from this response', statute: null }],
    modelApproach: 'Reference §768.28 and other applicable Florida statutes. Apply them to the specific facts and claims in this case. Identify threshold issues by name.',
    oniersNote: 'You are an attorney. Write like one.',
  },
}

function screenResponse(playerResponse) {
  const text = playerResponse.trim()
  const words = text.split(/\s+/)
  const uniqueWords = new Set(words.map(w => w.toLowerCase()))
  const wordCount = words.length
  if (wordCount < 30) return { failed: true, reason: 'too_short' }
  const uniqueRatio = uniqueWords.size / wordCount
  if (uniqueRatio < 0.20 && wordCount > 20) return { failed: true, reason: 'repetitive' }
  const hasLegalContent = LEGAL_SIGNALS.some(signal => text.toLowerCase().includes(signal))
  if (!hasLegalContent) return { failed: true, reason: 'no_legal_content' }
  return { failed: false }
}

export async function evaluateResponse({
  caseObject,
  actionId,
  actionLabel,
  playerResponse,
  playerTitle,
  checkData,
}) {
  const screen = screenResponse(playerResponse)
  if (screen.failed) return SCREENING_RESPONSES[screen.reason]

  const legalContext = getLegalContextForAction(actionId, caseObject)

  const systemPrompt = `You are Onier Llopiz, senior partner at Llopiz Wizel LLP, evaluating a junior attorney's written legal analysis.

AUTHORITATIVE LEGAL REFERENCE:
${legalContext}

Apply only the law above. Do not drift from these provisions. The HB 145 effective date is October 1, 2026 — apply old or new provisions based on the case's incident date.

You evaluate responses on this spectrum:
- EXCELLENT: Identifies all key issues, correct legal analysis, proper statute citations, strategic thinking demonstrated
- GOOD: Identifies most key issues, sound analysis, minor gaps that do not affect the core strategy
- ADEQUATE: Identifies major issues but misses important nuances, analysis is correct but incomplete
- POOR: Misses significant issues or makes legal errors, strategy would be compromised
- DEFICIENT: Misses critical issues or contains fundamental legal errors

Law is not always black and white. Credit creative but legally sound approaches. Penalize only genuine errors and significant omissions.

CONFIDENCE SCORING:
Score your confidence in the legal accuracy of this evaluation:
HIGH: Every legal proposition is directly supported by the provided statutory text or is well-established Florida law you are certain of. No speculation.
MEDIUM: Core analysis is sound but some peripheral points involve inference or application beyond the provided text.
LOW: Significant uncertainty about one or more legal propositions. Professional verification recommended.
Be honest. If you are uncertain, say LOW.

You must output ONLY valid JSON. No markdown.`

  const userPrompt = `Evaluate this attorney's response to the following action on this case.

ACTION: ${actionLabel}
CASE: ${caseObject.caseId}
DEFENDANT: ${caseObject.defendant}
PLAINTIFF: ${caseObject.clientName}
INCIDENT DATE: ${caseObject.dateOfIncident}
HB 145 APPLICABLE: ${caseObject.hb145Applicable}
FACT SCENARIO: ${caseObject.factScenario}
CLAIMS: ${JSON.stringify(caseObject.claimsAsserted)}
HIDDEN ISSUES: ${JSON.stringify(caseObject.hiddenIssues)}
PLAYER TITLE: ${playerTitle}

ATTORNEY'S RESPONSE:
"${playerResponse}"

Evaluate this response. Credit all legally sound approaches even if different from the model answer. Only penalize genuine errors and critical omissions.

Return JSON:
{
  "rating": "EXCELLENT|GOOD|ADEQUATE|POOR|DEFICIENT",
  "qualityScore": 3,
  "xpMultiplier": 1.0,
  "summary": "2-3 sentence overall assessment addressing the specific response given",
  "strengths": ["specific strength from their actual response"],
  "gaps": [{"issue": "what was missed or wrong", "consequence": "real-world consequence", "statute": "relevant statute or null"}],
  "modelApproach": "what excellent performance looks like on this specific action for this specific case — 3-4 sentences",
  "oniersNote": "personal note from Onier — direct, specific to what they wrote, educational — 1-2 sentences",
  "confidenceScore": "HIGH|MEDIUM|LOW",
  "confidenceRationale": "brief explanation of confidence level"
}

Quality score mapping:
  EXCELLENT: qualityScore 3, xpMultiplier 1.0
  GOOD: qualityScore 3, xpMultiplier 0.85
  ADEQUATE: qualityScore 2, xpMultiplier 0.6
  POOR: qualityScore 1, xpMultiplier 0.3
  DEFICIENT: qualityScore 1, xpMultiplier 0.1`

  try {
    return await withConfidenceRetry(
      async (a) => {
        const response = await callClaude(a)
        const clean = response.replace(/```json/g, '').replace(/```/g, '').trim()
        return JSON.parse(clean)
      },
      { system: systemPrompt, userMessage: userPrompt, maxTokens: 1500 }
    )
  } catch (err) {
    return getFallbackEvaluation(playerResponse, actionId, checkData)
  }
}

function getFallbackEvaluation(playerResponse, actionId, checkData) {
  const wordCount = playerResponse.trim().split(/\s+/).filter(Boolean).length

  if (wordCount < 20) {
    return {
      rating: 'DEFICIENT',
      qualityScore: 1,
      xpMultiplier: 0.1,
      summary: 'Response is too brief to demonstrate genuine analysis.',
      strengths: [],
      gaps: [{ issue: 'Insufficient analysis provided', consequence: 'Cannot assess legal reasoning from a one-sentence response', statute: null }],
      modelApproach: checkData?.qualityRubric?.excellent || 'Thorough legal analysis with statute citations required.',
      oniersNote: 'I need more than this. Walk me through your actual reasoning.',
    }
  }

  if (wordCount < 60) {
    return {
      rating: 'ADEQUATE',
      qualityScore: 2,
      xpMultiplier: 0.6,
      summary: 'Response shows basic understanding but lacks depth and specificity.',
      strengths: ['Basic issue identification present'],
      gaps: [{ issue: 'Analysis lacks statutory specificity', consequence: 'Incomplete analysis may miss threshold issues', statute: null }],
      modelApproach: checkData?.qualityRubric?.excellent || 'Full statutory analysis with case-specific application required.',
      oniersNote: 'You have the right idea but I need more depth. Cite the statutes.',
    }
  }

  return {
    rating: 'GOOD',
    qualityScore: 3,
    xpMultiplier: 0.85,
    summary: 'Response demonstrates reasonable analysis. Full AI evaluation unavailable in offline mode.',
    strengths: ['Substantive response provided'],
    gaps: [],
    modelApproach: checkData?.qualityRubric?.excellent || 'See key statutes for complete analysis framework.',
    oniersNote: 'Solid effort. Connect with me when AI evaluation is available for detailed feedback.',
  }
}
