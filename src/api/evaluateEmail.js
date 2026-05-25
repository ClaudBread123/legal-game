import { callClaude } from './anthropicProxy.js'

export async function evaluateEmail({ to, subject, body, caseObject, playerName }) {
  const system = `You are Onier Llopiz, founding partner at Llopiz Wizel LLP, reviewing an outgoing email drafted by an associate. Evaluate the email for professional tone, legal appropriateness, strategic soundness, and whether sending it would help or harm the client. Be direct. Output ONLY valid JSON.`

  const userMessage = `Review this outgoing email drafted by ${playerName}.

To: ${to}
Subject: ${subject}
Body:
"${body}"

Case context: ${caseObject?.caseId} — ${caseObject?.defendant}
Fact scenario: ${caseObject?.factScenario || 'N/A'}

Evaluate and return JSON:
{
  "appropriate": boolean,
  "rating": "PROFESSIONAL|ACCEPTABLE|CONCERNING|INAPPROPRIATE",
  "feedback": "2-3 sentences on tone, strategy, and content",
  "concerns": ["specific concern if any"],
  "xpEffect": number (positive for good emails, negative for problematic ones, range -50 to +30),
  "formalWarning": boolean (true if this email would warrant a formal warning from the managing partner),
  "oniersNote": "direct note from Onier — 1 sentence"
}`

  try {
    const text = await callClaude({ system, userMessage, maxTokens: 600 })
    const clean = text.replace(/```json/g, '').replace(/```/g, '').trim()
    return JSON.parse(clean)
  } catch {
    return {
      appropriate: true,
      rating: 'ACCEPTABLE',
      feedback: 'Email reviewed. Evaluation unavailable in offline mode.',
      concerns: [],
      xpEffect: 5,
      formalWarning: false,
      oniersNote: 'Keep communications professional.',
    }
  }
}
