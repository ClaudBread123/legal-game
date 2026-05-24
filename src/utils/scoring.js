import { CAREER_LADDER } from '../data/careerLadder.js'

export function calculateXPFromEvaluation(evaluationResult) {
  const gained = (evaluationResult.correctlyIdentified || []).reduce(
    (sum, item) => sum + (item.xpAwarded || 0),
    0
  )
  const deducted = (evaluationResult.incorrectlyFlagged || []).length * 5
  return Math.max(0, gained - deducted)
}

export function getTitleFromXP(xp) {
  let title = CAREER_LADDER[0].title
  for (const tier of CAREER_LADDER) {
    if (xp >= tier.minXP) title = tier.title
  }
  return title
}

export function getNextTitle(xp) {
  for (const tier of CAREER_LADDER) {
    if (xp < tier.minXP) return tier
  }
  return null
}

export function getXPProgress(xp) {
  let current = CAREER_LADDER[0]
  let next = null
  for (let i = 0; i < CAREER_LADDER.length; i++) {
    if (xp >= CAREER_LADDER[i].minXP) {
      current = CAREER_LADDER[i]
      next = CAREER_LADDER[i + 1] || null
    }
  }
  if (!next) return { current: xp, nextThreshold: null, percentage: 100 }
  const range = next.minXP - current.minXP
  const progress = xp - current.minXP
  return {
    current: xp,
    nextThreshold: next.minXP,
    percentage: Math.min(100, Math.round((progress / range) * 100)),
  }
}
