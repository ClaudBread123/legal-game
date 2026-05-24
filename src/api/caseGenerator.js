import { callClaude } from './anthropicProxy.js'
import { FALLBACK_CASES } from '../data/fallbackCases.js'

export async function generateCase({ caseType = 'state_tort', playerLevel = 1, currentDate }) {
  const system = `You are a case generation engine for a Florida governmental litigation training simulator at the law firm Llopiz Wizel LLP. Generate realistic but entirely fictitious civil cases against Florida municipalities or charter schools. All names, entities, and facts are fictional. Output ONLY valid JSON with no markdown formatting, no code blocks, no explanation. The JSON must match the schema exactly.`

  const userMessage = `Generate a case of type: ${caseType} for a player at level ${playerLevel}. Today's simulated date is ${currentDate}.

Required JSON schema:
{
  "caseId": "string (format LW-YYYY-NNNN)",
  "caseType": "string",
  "clientName": "string",
  "defendant": "string (Florida municipality or charter school, fictitious)",
  "dateFiled": "string (ISO date, 3-7 days before today)",
  "dateOfIncident": "string (ISO date, 6-18 months before dateFiled)",
  "factScenario": "string (3-5 sentences)",
  "claimsAsserted": ["string"],
  "hiddenIssues": [{"issueType": "string", "description": "string", "severity": "string", "statute": "string", "deadline": "string or null"}],
  "applicableDefenses": ["string"],
  "previewFlag": "string (one vague hint about threshold issue)",
  "hb145Applicable": "boolean (true if dateOfIncident is on or after 2026-10-01)"
}

At level 1: include at minimum one of: barred_individual_defendant, insufficient_presuit_notice, sovereign_immunity_bar.
At level 2+: also include statute_of_limitations or hb145 issues.
At level 3+: may include federal_removal_1983 or admin_exhaustion.
Always make the fact scenario realistic to Florida governmental defense practice.`

  try {
    const text = await callClaude({ system, userMessage, maxTokens: 1500 })
    const parsed = JSON.parse(text)
    return {
      ...parsed,
      completedActions: [],
      hoursBilled: 0,
      amountBilled: 0,
      estimatedHours: 40,
      status: 'active',
    }
  } catch {
    const idx = Math.floor(Math.random() * FALLBACK_CASES.length)
    return { ...FALLBACK_CASES[idx] }
  }
}
