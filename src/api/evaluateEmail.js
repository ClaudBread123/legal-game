import { callClaude } from './anthropicProxy.js'

export async function evaluateEmail({ to, toEmail, subject, body, caseObject, playerName, playerTitle }) {
  const system = `You evaluate law firm associate emails for professionalism and Florida Bar Rule compliance. Output ONLY valid JSON. No markdown.`

  const userMessage = `Associate: ${playerName}, ${playerTitle || 'Associate'}
To: ${to}${toEmail ? ` (${toEmail})` : ''}
Subject: ${subject}
Body: "${body.substring(0, 400)}"
Case: ${caseObject?.caseId || 'N/A'} — ${caseObject?.defendant || 'N/A'}

Return JSON:
{
  "professionalismScore": 1-5,
  "isAppropriate": true,
  "issues": ["specific issue if any"],
  "consequences": {"type": "positive|warning|formal_warning", "description": "what this means", "gameEffect": "XP/career effect"},
  "floridaBarIssue": {"exists": false, "rule": null, "description": null},
  "feedback": "2-3 sentences on tone, strategy, content",
  "professionalVersion": null
}`

  try {
    const text = await callClaude({ system, userMessage, maxTokens: 600 })
    const clean = text.replace(/```json/g, '').replace(/```/g, '').trim()
    return JSON.parse(clean)
  } catch {
    return {
      professionalismScore: 3,
      isAppropriate: true,
      issues: [],
      consequences: { type: 'positive', description: 'Email sent.', gameEffect: '+5 XP' },
      floridaBarIssue: { exists: false, rule: null, description: null },
      feedback: 'Email reviewed. Evaluation unavailable in offline mode.',
      professionalVersion: null,
    }
  }
}
