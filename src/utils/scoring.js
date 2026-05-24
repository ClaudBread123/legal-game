import { CAREER_LADDER } from '../data/careerLadder.js'

export function calculateXPFromEvaluation(evaluationResult) {
  const gained = (evaluationResult.correctlyIdentified || []).reduce(
    (sum, item) => sum + (item.xpAwarded || 0),
    0
  )
  const deducted = (evaluationResult.incorrectlyFlagged || []).length * 10
  return Math.max(0, gained - deducted)
}

export function checkPromotionEligibility(player) {
  const xp = player.xp ?? 0
  const totalGameDays = player.totalGameDays ?? 0
  const casesWorked = player.casesWorked ?? 0
  const totalBillableHours = player.totalBillableHours ?? 0

  let eligibleTier = CAREER_LADDER[0]

  for (const tier of CAREER_LADDER) {
    const xpMet = xp >= tier.minXP
    const daysMet = totalGameDays >= (tier.minGameDays || 0)
    const casesMet = casesWorked >= (tier.minCasesWorked || 0)
    const hoursMet = totalBillableHours >= (tier.minBillableHours || 0)

    if (xpMet && daysMet && casesMet && hoursMet) {
      eligibleTier = tier
    }
  }

  return eligibleTier
}

export function getPromotionProgress(player) {
  const current = checkPromotionEligibility(player)
  const currentIndex = CAREER_LADDER.findIndex(t => t.title === current.title)

  if (currentIndex === CAREER_LADDER.length - 1) return null

  const next = CAREER_LADDER[currentIndex + 1]
  const xp = player.xp ?? 0
  const totalGameDays = player.totalGameDays ?? 0
  const casesWorked = player.casesWorked ?? 0
  const totalBillableHours = player.totalBillableHours ?? 0

  const requirements = [
    {
      label: 'XP',
      current: xp,
      required: next.minXP,
      met: xp >= next.minXP,
    },
    {
      label: 'Days in Practice',
      current: totalGameDays,
      required: next.minGameDays,
      met: totalGameDays >= next.minGameDays,
    },
    {
      label: 'Cases Worked',
      current: casesWorked,
      required: next.minCasesWorked,
      met: casesWorked >= next.minCasesWorked,
    },
    ...(next.minBillableHours
      ? [{
          label: 'Billable Hours',
          current: Math.round(totalBillableHours * 10) / 10,
          required: next.minBillableHours,
          met: totalBillableHours >= next.minBillableHours,
        }]
      : []),
  ].filter(r => r.required > 0)

  return {
    nextTitle: next.title,
    nextSalary: next.salary,
    nextColor: next.color,
    requirements,
  }
}

// Legacy helpers kept for any remaining callsites
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
