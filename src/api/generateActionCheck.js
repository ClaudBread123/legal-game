import { callClaude } from './anthropicProxy.js'
import { FALLBACK_CHECKS } from '../data/fallbackChecks.js'

const DIFFICULTY_BY_LEVEL = {
  'Junior Associate': 1,
  'Associate': 2,
  'Senior Associate': 3,
  'Junior Partner': 3,
  'Partner': 4,
  'Equity Shareholder': 4,
}

export async function generateActionCheck({
  caseObject,
  actionId,
  playerLevel,
  completedActions,
  activeConsequences,
}) {
  const difficulty = DIFFICULTY_BY_LEVEL[playerLevel] || 1

  const systemPrompt = `You are an expert Florida governmental defense attorney and legal educator at Llopiz Wizel LLP. You generate case-specific comprehension check questions for litigation training simulations.

Your questions must:
1. Be hyper-specific to the exact case facts, claims, parties, and statutes provided
2. Test genuine legal understanding, not just memory
3. Scale in difficulty based on the player's career level (1=easiest, 4=hardest)
4. Reference specific Florida statutes, rules, and case law where applicable
5. Have exactly one correct answer
6. Include a thorough explanation of why the correct answer is right and others are wrong — cite specific statutes
7. Be answerable by a competent attorney — not trick questions

At difficulty 1: 4 options, one clearly correct, educational and guiding tone
At difficulty 2: 4 options, all plausible, requires genuine analysis
At difficulty 3: 4 options, subtle distinctions, requires synthesis of facts and law
At difficulty 4: may include open analysis questions with detailed rubric

Output ONLY valid JSON matching the schema exactly. No markdown, no explanation outside the JSON.`

  const userPrompt = `Generate comprehension check questions for this action on this specific case.

ACTION BEING TAKEN: ${actionId}

CASE FACTS:
- Case ID: ${caseObject.caseId}
- Case Type: ${caseObject.caseType}
- Defendant: ${caseObject.defendant}
- Plaintiff: ${caseObject.clientName}
- Date of Incident: ${caseObject.dateOfIncident}
- HB 145 Applicable: ${caseObject.hb145Applicable}
- Fact Scenario: ${caseObject.factScenario}
- Claims Asserted: ${JSON.stringify(caseObject.claimsAsserted)}
- Hidden Issues: ${JSON.stringify(caseObject.hiddenIssues)}
- Applicable Defenses: ${JSON.stringify(caseObject.applicableDefenses)}

CASE STATUS:
- Completed Actions: ${JSON.stringify(completedActions)}
- Active Consequences: ${JSON.stringify(activeConsequences)}

PLAYER LEVEL: ${playerLevel} (difficulty ${difficulty}/4)

Generate 2-3 questions for difficulty ${difficulty}.
For difficulty 1-2: multiple choice only.
For difficulty 3: multiple choice with one short-answer follow-up.
For difficulty 4: one multiple choice + one detailed analysis question with rubric.

Required JSON schema:
{
  "actionContext": "2-3 sentence explanation of what this action means strategically on this specific case",
  "keyStatutes": ["list of statutes directly relevant to this action on this case"],
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "question text — must reference specific case facts",
      "options": {
        "A": "option text",
        "B": "option text",
        "C": "option text",
        "D": "option text"
      },
      "correctAnswer": "B",
      "explanation": "detailed explanation of why B is correct and why A, C, D are wrong — cite specific statutes",
      "statute": "primary statute cited",
      "xpValue": 25
    }
  ],
  "qualityRubric": {
    "excellent": "what excellent performance looks like on this action",
    "adequate": "what adequate performance looks like",
    "deficient": "what deficient performance looks like and its consequences"
  }
}`

  try {
    const response = await callClaude({
      system: systemPrompt,
      userMessage: userPrompt,
      maxTokens: 2000,
    })

    const clean = response
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

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
          ? 'HB 145 applies (post Oct 1, 2026)'
          : 'Pre-HB 145 rules apply'),
    })),
  }
}
