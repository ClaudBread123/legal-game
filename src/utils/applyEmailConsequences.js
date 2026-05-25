export function applyEmailConsequences(evaluation, store) {
  const { addXP, updatePlayer, addEmail, player } = store

  // New schema: consequences.type / consequences.gameEffect
  if (evaluation.consequences) {
    const gameEffect = evaluation.consequences?.gameEffect || ''
    const type = evaluation.consequences?.type || 'positive'

    if (type === 'positive') {
      addXP(5, 'Professional email communication')
    } else if (gameEffect === 'xp_penalty_large') {
      addXP(-25, 'Email: seriously unprofessional communication')
    } else if (gameEffect === 'xp_penalty_small' || type === 'warning') {
      addXP(-10, 'Email: professional standards issue')
    } else if (gameEffect === 'termination_warning') {
      const newWarnings = (player?.formalWarnings || 0) + 1
      const newCareerHealth = Math.max(0, (player?.careerHealth || 100) - 35)
      updatePlayer({ formalWarnings: newWarnings, careerHealth: newCareerHealth })
      addEmail({
        from: 'Onier Llopiz',
        fromEmail: 'o.llopiz@llopizwizel.com',
        subject: 'URGENT: Termination Warning — Professional Conduct Violation',
        priority: 'urgent',
        requiresResponse: false,
        body: `${player?.name || 'Associate'},

An email you sent has been flagged as a severe violation of our professional conduct standards and the Florida Bar Rules of Professional Conduct.

${evaluation.feedback || 'This conduct is unacceptable.'}

This is a final warning. Any further incident of this nature will result in immediate termination of your employment at this firm. This has been reported to the Florida Bar.

— OL`,
      })
    } else if (type === 'formal_warning' || gameEffect === 'formal_warning') {
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
    return
  }

  // Backward compat: old schema
  if (evaluation.xpEffect && evaluation.xpEffect !== 0) {
    addXP(evaluation.xpEffect, evaluation.xpEffect > 0
      ? 'Professional email communication'
      : 'Problematic email — professional standards')
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
      body: `${player?.name || 'Associate'},

An email you sent has been flagged as a violation of our professional communication standards. This is a formal warning.

— OL`,
    })
  }
}
