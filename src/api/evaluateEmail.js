import { callClaude } from './anthropicProxy.js'

const HARASSMENT_PATTERNS = [
  /\bslime\b/i, /\bstupid\b/i, /\bidiot\b/i, /\bidiom\b/i,
  /racial/i, /discriminat/i, /harass/i,
  /\bn[- ]?word\b/i, /\brace\s+card\b/i,
]
const THREAT_PATTERNS = [
  /\bsue\s+you\b/i, /\bkill\b/i, /\bthreat/i, /you.ll\s+pay\b/i,
  /\bdestroy\s+you\b/i, /\bregret\s+this\b/i,
]

function preScreenEmail(body, subject) {
  const combined = (body + ' ' + subject).toLowerCase()
  const upperRatio = (body.match(/[A-Z]/g) || []).length / Math.max(body.length, 1)
  const hasHarassment = HARASSMENT_PATTERNS.some(p => p.test(combined))
  const hasThreat = THREAT_PATTERNS.some(p => p.test(combined))
  const isShouting = upperRatio > 0.5 && body.length > 20

  if (hasHarassment) {
    const msg = 'This communication contains language that constitutes harassment and/or discrimination. This is a severe violation of Florida Bar Rules, firm policy, and basic professional conduct. Immediate disciplinary action is required.'
    return {
      screened: true,
      professionalismScore: 1,
      isAppropriate: false,
      issues: [msg],
      consequences: { type: 'formal_warning', description: msg, gameEffect: 'termination_warning' },
      floridaBarIssue: { exists: true, rule: 'Rule 4-8.4', description: 'Conduct involving discrimination or harassment' },
      feedback: msg,
      professionalVersion: 'Professional communications must be respectful, factual, and comply with Florida Bar Rules of Professional Conduct.',
    }
  }

  if (hasThreat) {
    const msg = 'This email contains threatening language. Threatening communications violate Florida Bar Rule 4-8.4 and expose the firm to sanctions.'
    return {
      screened: true,
      professionalismScore: 2,
      isAppropriate: false,
      issues: [msg],
      consequences: { type: 'formal_warning', description: msg, gameEffect: 'formal_warning' },
      floridaBarIssue: { exists: true, rule: 'Rule 4-8.4', description: 'Threatening, intimidating, or coercive conduct' },
      feedback: msg,
      professionalVersion: 'Professional communications must be firm but never threatening or coercive.',
    }
  }

  if (isShouting) {
    const msg = 'Excessive capitalization is unprofessional in legal correspondence. It reads as aggressive and undermines credibility.'
    return {
      screened: true,
      professionalismScore: 2,
      isAppropriate: false,
      issues: [msg],
      consequences: { type: 'warning', description: msg, gameEffect: 'xp_penalty_small' },
      floridaBarIssue: { exists: false, rule: null, description: null },
      feedback: msg,
      professionalVersion: null,
    }
  }

  return { screened: false }
}

export async function evaluateEmail({ to, toEmail, subject, body, caseObject, playerName, playerTitle }) {
  const preScreen = preScreenEmail(body, subject)
  if (preScreen.screened) {
    const { screened: _, ...result } = preScreen
    return result
  }

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
