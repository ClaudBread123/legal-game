import { daysBetween } from './dateUtils.js'

export const RESOLUTION_PATHS = {
  dismissal_win: {
    id: 'dismissal_win',
    label: 'Dismissed With Prejudice',
    subtitle: 'Motion to Dismiss Granted',
    description: 'Your motion to dismiss was granted. The court found that the complaint failed to state a claim upon which relief could be granted, and the matter has been dismissed with prejudice.',
    outcome: 'strongWin',
    icon: '⚖',
    color: '#4ade80',
    xpReward: 300,
  },
  summary_judgment_win: {
    id: 'summary_judgment_win',
    label: 'Summary Judgment Granted',
    subtitle: 'No Genuine Issue of Material Fact',
    description: 'The court granted the Motion for Summary Judgment. There being no genuine issue of material fact, judgment has been entered in favor of your client.',
    outcome: 'strongWin',
    icon: '⚖',
    color: '#4ade80',
    xpReward: 250,
  },
  favorable_settlement: {
    id: 'favorable_settlement',
    label: 'Favorable Settlement',
    subtitle: 'Settled Below Exposure',
    description: "The case has been resolved by settlement at a figure significantly below the plaintiff's demand and within the client's risk tolerance. Your early identification of threshold issues drove the settlement posture.",
    outcome: 'settleDefense',
    icon: '🤝',
    color: '#4a9eff',
    xpReward: 200,
  },
  neutral_settlement: {
    id: 'neutral_settlement',
    label: 'Case Settled',
    subtitle: 'Neutral Settlement',
    description: 'The case has been resolved by settlement. Given the procedural posture, this is an acceptable outcome for the client.',
    outcome: 'settleNeutral',
    icon: '🤝',
    color: 'var(--accent-yellow)',
    xpReward: 100,
  },
  adverse_outcome: {
    id: 'adverse_outcome',
    label: 'Adverse Outcome',
    subtitle: 'Verdict or Unfavorable Resolution',
    description: "The case resulted in an adverse outcome for the client. This matter should be reviewed to identify additional steps that could have been taken earlier in the litigation.",
    outcome: 'loss',
    icon: '⚠',
    color: 'var(--accent-red)',
    xpReward: 25,
  },
}

export function determineResolutionPath(caseObject) {
  // Adversarial engine already pushed the resolution item for MTD grants
  if (caseObject.mtdGranted) return RESOLUTION_PATHS.dismissal_win

  const health = caseObject.caseHealth ?? 100
  const completed = caseObject.completedActions || []
  const prob = caseObject.caseOutcomeProbability ?? { strongWin: 40, settleDefense: 30, settleNeutral: 20, loss: 10 }

  const hasMTD = completed.includes('motion_to_dismiss')
  const hasMSJ = completed.includes('motion_summary_judgment')

  // If plaintiff filed MSJ and case health is low, weight heavily toward adverse outcome
  if (caseObject.plaintiffMSJFiled && health < 40) {
    const adverseRoll = Math.random()
    if (adverseRoll < 0.6) return RESOLUTION_PATHS.adverse_outcome
    return RESOLUTION_PATHS.neutral_settlement
  }

  const roll = Math.random() * 100
  const strongThreshold = prob.strongWin || 40
  const defenseThreshold = strongThreshold + (prob.settleDefense || 30)
  const neutralThreshold = defenseThreshold + (prob.settleNeutral || 20)

  if (roll < strongThreshold) {
    if (hasMTD && health >= 75) return RESOLUTION_PATHS.dismissal_win
    if (hasMSJ && health >= 60) return RESOLUTION_PATHS.summary_judgment_win
    return RESOLUTION_PATHS.favorable_settlement
  }
  if (roll < defenseThreshold) return RESOLUTION_PATHS.favorable_settlement
  if (roll < neutralThreshold) return RESOLUTION_PATHS.neutral_settlement
  return RESOLUTION_PATHS.adverse_outcome
}

export function shouldTriggerResolution(caseObject, currentDate) {
  if (caseObject.status === 'closed') return false
  if (caseObject.resolutionTriggered) return false
  // MTD granted resolution is handled by adversarial engine directly
  if (caseObject.mtdGranted) return false

  const health = caseObject.caseHealth ?? 100
  const completed = caseObject.completedActions || []
  const daysSinceFiling = daysBetween(caseObject.dateFiled, currentDate)

  if (daysSinceFiling < 45 || completed.length < 2) return false

  // Early resolution: MTD filed with high health
  if (completed.includes('motion_to_dismiss') && health >= 80 && daysSinceFiling >= 45) {
    return Math.random() < 0.15
  }

  // Standard window: 75+ days
  if (daysSinceFiling >= 75) return Math.random() < 0.12

  // Forced: very low health after 60 days
  if (health <= 20 && daysSinceFiling >= 60) return true

  // Force at 120 days
  if (daysSinceFiling >= 120) return true

  return false
}
