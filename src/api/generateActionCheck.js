import { callClaude } from './anthropicProxy.js'
import { FALLBACK_CHECKS } from '../data/fallbackChecks.js'

const DIFFICULTY_BY_LEVEL = {
  'Junior Associate': 1, 'Associate': 2, 'Senior Associate': 3,
  'Junior Partner': 3, 'Partner': 4, 'Equity Shareholder': 4,
}

export async function generateActionCheck({
  caseObject, actionId, playerLevel, completedActions, activeConsequences,
}) {
  const difficulty = DIFFICULTY_BY_LEVEL[playerLevel] || 1

  const systemPrompt = `You generate multiple choice questions testing Florida governmental defense law.
Questions must reference the specific case facts.
Output ONLY valid JSON. No markdown.
Key law: §768.28(9) individual immunity, §768.28(6) pre-suit notice, HB145 caps (Oct 1 2026: $350k/$500k; before: $200k/$300k), §1983 removal within 30 days.
We represent the DEFENDANT (governmental entity). The "defendant" field is OUR CLIENT. Never refer to it as the plaintiff.
ANSWER OPTION RULES: All four options must be similar length. All must sound plausible. The correct answer must NOT be the longest. Wrong answers should reflect common misconceptions. Randomize which letter (A/B/C/D) is correct.`

  const userPrompt = `Action: ${actionId}
Case: ${caseObject.defendant} | Type: ${caseObject.caseType}
Incident: ${caseObject.dateOfIncident} | HB145: ${caseObject.hb145Applicable}
Facts: ${caseObject.factScenario.substring(0, 200)}
Claims: ${caseObject.claimsAsserted.slice(0, 2).join('; ')}
Issues: ${(caseObject.hiddenIssues || []).map(i => i.issueType).slice(0, 3).join(', ')}
Player level: ${playerLevel} (difficulty ${difficulty}/4)

Generate 2 multiple choice questions about this action on this specific case.
Reference the defendant, facts, and applicable Florida statutes.

Return JSON:
{
  "actionContext": "Why this action matters on this specific case — 2 sentences",
  "keyStatutes": ["§768.28(9)", "§768.28(6)"],
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "Question referencing ${caseObject.defendant} specifically",
      "options": {"A": "option", "B": "option", "C": "option", "D": "option"},
      "correctAnswer": "B",
      "explanation": "Why B is correct, citing specific statute",
      "statute": "§768.28(X)",
      "xpValue": 25
    }
  ],
  "qualityRubric": {
    "excellent": "what excellent looks like",
    "adequate": "what adequate looks like",
    "deficient": "what deficient looks like"
  }
}`

  try {
    const response = await callClaude({ system: systemPrompt, userMessage: userPrompt, maxTokens: 1200 })
    const clean = response.replace(/```json/g, '').replace(/```/g, '').trim()
    return JSON.parse(clean)
  } catch (err) {
    console.warn('generateActionCheck fallback:', err.message)
    return getFallbackCheck(actionId, caseObject, difficulty)
  }
}

function getFallbackCheck(actionId, caseObject, difficulty) {
  const fallbacks = FALLBACK_CHECKS[actionId]
  if (!fallbacks) return null
  const tier = fallbacks[Math.min(difficulty - 1, fallbacks.length - 1)]
  return {
    ...tier,
    questions: tier.questions.map(q => ({
      ...q,
      question: q.question
        .replace(/\[DEFENDANT\]/g, caseObject.defendant)
        .replace(/\[PLAINTIFF\]/g, caseObject.clientName)
        .replace(/\[INCIDENT_DATE\]/g, caseObject.dateOfIncident)
        .replace(/\[HB145\]/g, caseObject.hb145Applicable
          ? 'HB 145 applies (post Oct 1, 2026)' : 'Pre-HB 145 rules apply'),
    })),
  }
}
