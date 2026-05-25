export function applyEmailConsequences(evaluation, store) {
  const { addXP, updatePlayer, addEmail, player, currentDate } = store

  if (evaluation.xpEffect && evaluation.xpEffect !== 0) {
    const reason = evaluation.xpEffect > 0
      ? 'Professional email communication'
      : 'Problematic email — professional standards'
    addXP(evaluation.xpEffect, reason)
  }

  if (evaluation.formalWarning) {
    const newWarnings = (player?.formalWarnings || 0) + 1
    const newCareerHealth = Math.max(0, (player?.careerHealth || 100) - 20)
    updatePlayer({ formalWarnings: newWarnings, careerHealth: newCareerHealth })

    addEmail({
      from: 'Onier Llopiz',
      fromEmail: 'o.llopiz@llopizwizel.com',
      subject: 'Formal Warning — Professional Communication Standards',
      priority: 'urgent',
      requiresResponse: false,
      body: `${player?.name || 'Associate'},

An email you sent has been flagged as a violation of our professional communication standards. This is a formal warning.

You are representing Llopiz Wizel LLP in every communication. Improper emails — whether to opposing counsel, clients, or courts — expose the firm to sanctions, malpractice liability, and reputational harm.

This is noted in your personnel file. A second warning will result in a formal performance improvement plan.

— OL`,
    })
  }
}
