import { callClaude } from './anthropicProxy.js'

const FALLBACK_MP_MESSAGE = (playerName, caseObject, issueEvaluation) => {
  const missed = issueEvaluation?.missed || []
  const missedStr =
    missed.length > 0
      ? missed.map(m => `${m.issueId} (${m.statute})`).join(', ')
      : 'none identified'

  return `${playerName},

I've reviewed the case file for ${caseObject.defendant}. Your initial analysis has been noted.

${
  missed.length > 0
    ? `You missed ${missed.length} threshold issue(s) on intake: ${missedStr}. In governmental defense, these issues are not optional — they are the architecture of your defense. A missed §768.28(9) argument, for example, means you are litigating a claim that the statute bars entirely. That is not a small error. That is a bill running to trial on a case that should have been dismissed.`
    : `Your issue identification was thorough on intake. That is the baseline expectation, not a distinction. The work now is building the record to support the defenses you have identified.`
}

On the procedural side: verify pre-suit notice compliance before anything else. If notice was deficient, that is your first motion. Everything else is secondary.

Review §768.28 carefully — the line between discretionary function immunity and operational negligence is where most of these cases are won or lost. I want a full analysis on my desk before we proceed to discovery.

The client is counting on us. Do not let momentum carry you past threshold issues.

— R. Llopiz`
}

export async function getMPReview({ caseObject, issueEvaluation, completedActions, playerName }) {
  const system = `You are Rafael Llopiz, founding partner of Llopiz Wizel LLP, a Florida firm specializing in governmental defense. You are conducting a case review with your associate ${playerName}. You are direct, experienced, and deeply knowledgeable about Florida governmental tort law, sovereign immunity, §768.28, and the Florida Rules of Civil Procedure. You educate through consequence — you explain not just what was missed, but what will happen because it was missed. You are not cruel, but you are unsparing. You always cite specific statutes and procedural rules. Your reviews are 4-6 paragraphs. Speak directly to the associate by name.`

  const userMessage = `Review this case with the associate.

Associate name: ${playerName}
Case: ${caseObject.caseId} — ${caseObject.defendant}
Fact scenario: ${caseObject.factScenario}
Claims: ${JSON.stringify(caseObject.claimsAsserted)}
Missed issues: ${JSON.stringify(issueEvaluation?.missed || [])}
Correctly identified: ${JSON.stringify(issueEvaluation?.correctlyIdentified || [])}
Completed actions so far: ${JSON.stringify(completedActions || [])}

Provide a direct, educational case review. Cite statutes. Explain consequences of missed issues.`

  try {
    return await callClaude({ system, userMessage, maxTokens: 800 })
  } catch {
    return FALLBACK_MP_MESSAGE(playerName, caseObject, issueEvaluation)
  }
}
