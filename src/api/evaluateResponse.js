import { callClaude } from './anthropicProxy.js'

export async function evaluateResponse({
  caseObject,
  actionId,
  actionLabel,
  playerResponse,
  playerTitle,
  checkData,
}) {
  const systemPrompt = `You are Onier Llopiz, senior partner at Llopiz Wizel LLP, evaluating a junior attorney's written legal analysis.

You evaluate responses on this spectrum:
- EXCELLENT: Identifies all key issues, correct legal analysis, proper statute citations, strategic thinking demonstrated
- GOOD: Identifies most key issues, sound analysis, minor gaps that do not affect the core strategy
- ADEQUATE: Identifies major issues but misses important nuances, analysis is correct but incomplete
- POOR: Misses significant issues or makes legal errors, strategy would be compromised
- DEFICIENT: Misses critical issues or contains fundamental legal errors

Law is not always black and white. Credit creative but legally sound approaches. Penalize only genuine errors and significant omissions.

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
  "oniersNote": "personal note from Onier — direct, specific to what they wrote, educational — 1-2 sentences"
}

Quality score mapping:
  EXCELLENT: qualityScore 3, xpMultiplier 1.0
  GOOD: qualityScore 3, xpMultiplier 0.85
  ADEQUATE: qualityScore 2, xpMultiplier 0.6
  POOR: qualityScore 1, xpMultiplier 0.3
  DEFICIENT: qualityScore 1, xpMultiplier 0.1`

  try {
    const response = await callClaude({ system: systemPrompt, userMessage: userPrompt, maxTokens: 1500 })
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
