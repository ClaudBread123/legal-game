function addBusinessDaysStatic(dateStr, n) {
  const d = new Date(dateStr)
  let added = 0
  while (added < n) {
    d.setDate(d.getDate() + 1)
    const day = d.getDay()
    if (day !== 0 && day !== 6) added++
  }
  return d.toISOString().split('T')[0]
}

function subtractBusinessDays(n) {
  const d = new Date()
  let subtracted = 0
  while (subtracted < n) {
    d.setDate(d.getDate() - 1)
    const day = d.getDay()
    if (day !== 0 && day !== 6) subtracted++
  }
  return d.toISOString().split('T')[0]
}

export const FALLBACK_CASES = [
  {
    caseId: 'LW-2025-0042',
    caseType: 'state_tort',
    clientName: 'Marcus Delray',
    defendant: 'City of Palmetto Shores',
    dateFiled: subtractBusinessDays(5),
    dateOfIncident: '2024-09-15',
    factScenario:
      'Plaintiff Marcus Delray alleges he was assaulted by an unknown third party in Riverside Park, a public park owned and operated by the City of Palmetto Shores, on the evening of September 15, 2024. Plaintiff claims the City failed to maintain adequate lighting and security personnel despite prior incidents of violence at the location. Plaintiff also names Officer Dana Whitmore, the park ranger on duty, individually, alleging she negligently failed to respond to a prior disturbance call that evening. Plaintiff seeks damages for personal injuries, medical expenses, and lost wages.',
    claimsAsserted: [
      'Count I — Negligence (City of Palmetto Shores)',
      'Count II — Negligent Security (City of Palmetto Shores)',
      'Count III — Negligence (Officer Dana Whitmore, individually)',
      'Count IV — Negligent Supervision (City of Palmetto Shores)',
    ],
    hiddenIssues: [
      {
        issueType: 'barred_individual_defendant',
        description:
          'Officer Whitmore is named individually. Her alleged failure to respond was within the scope of her employment as a park ranger. Absent facts establishing bad faith, malice, or wanton conduct, the individual claim is barred under §768.28(9). Count III must be dismissed.',
        severity: 'critical',
        statute: '§768.28(9), Fla. Stat.',
        deadline: null,
      },
      {
        issueType: 'insufficient_presuit_notice',
        description:
          'The incident occurred September 15, 2024, which is before the HB 145 effective date of October 1, 2026. The old 3-year pre-suit notice window applies. Verify that proper written notice was presented to the City within 3 years of September 15, 2024, and that the City denied the claim or 6 months elapsed. Failure is a condition precedent.',
        severity: 'critical',
        statute: '§768.28(6)(a), Fla. Stat.',
        deadline: '2027-09-15',
      },
      {
        issueType: 'sovereign_immunity_bar',
        description:
          "Evaluate whether the City's decision to staff the park with a single ranger is a discretionary planning decision (immune) vs. operational negligence in executing that decision (potentially not immune). Discretionary function doctrine may bar some or all claims.",
        severity: 'major',
        statute: '§768.28, Fla. Stat.',
        deadline: null,
      },
    ],
    applicableDefenses: [
      '§768.28(9) — individual defendant immunity',
      'Discretionary function sovereign immunity',
      'Comparative negligence — plaintiff assumed risk of visiting park at night',
      'Third-party criminal act as superseding cause',
      'Lack of actual or constructive notice of dangerous condition',
    ],
    previewFlag:
      "Review the complaint carefully — not all named defendants may be properly subject to suit under Florida's governmental tort framework.",
    hb145Applicable: false,
    completedActions: [],
    hoursBilled: 0,
    amountBilled: 0,
    estimatedHours: 40,
    status: 'active',
    caseHealth: 100,
    caseHealthEvents: [],
    caseOutcomeProbability: { strongWin: 40, settleDefense: 30, settleNeutral: 20, loss: 10 },
    activeConsequences: [],
    consequencesTriggered: [],
    consequenceTimestamps: {},
  },
  {
    caseId: 'LW-2025-0043',
    caseType: 'state_tort',
    clientName: 'Priya Nambiar',
    defendant: 'Suncoast Charter Academy',
    dateFiled: subtractBusinessDays(3),
    dateOfIncident: '2026-11-03',
    factScenario:
      "Plaintiff Priya Nambiar, a former teacher at Suncoast Charter Academy, alleges she was wrongfully terminated after reporting what she believed to be grade manipulation by the school's principal, Defendant Thomas Kretch. Plaintiff claims her termination constitutes retaliation in violation of Florida's Whistle-blower Act and the First Amendment. She names both the Academy and Principal Kretch individually. The incident of termination occurred November 3, 2026. Plaintiff filed a charge with the FCHR on February 1, 2027, and received a right-to-sue letter. She filed this complaint in state circuit court.",
    claimsAsserted: [
      'Count I — Florida Whistle-blower Act Retaliation (Suncoast Charter Academy)',
      'Count II — First Amendment Retaliation, 42 U.S.C. §1983 (Suncoast Charter Academy)',
      'Count III — First Amendment Retaliation, 42 U.S.C. §1983 (Thomas Kretch, individually)',
      'Count IV — Wrongful Termination (Thomas Kretch, individually)',
    ],
    hiddenIssues: [
      {
        issueType: 'federal_removal_1983',
        description:
          'Counts II and III assert claims under 42 U.S.C. §1983, creating federal question jurisdiction. This case is removable to federal district court under 28 U.S.C. §1441. Notice of removal must be filed within 30 days of service of the complaint. This deadline is imminent and non-waivable. Evaluate whether removal is strategically advantageous — federal court provides access to qualified immunity arguments and Eleventh Amendment considerations unavailable in state court.',
        severity: 'critical',
        statute: '42 U.S.C. §1983; 28 U.S.C. §1441',
        deadline: '30 days from service',
      },
      {
        issueType: 'barred_individual_defendant',
        description:
          'Count IV names Principal Kretch individually for wrongful termination. If Kretch acted within the scope of his employment as principal and without bad faith, malice, or wanton conduct, Count IV is barred under §768.28(9). The exclusive remedy is against the Academy. Evaluate the specific facts of the termination decision — was it a personnel decision within his administrative authority, or did it involve conduct rising to bad faith or malice?',
        severity: 'critical',
        statute: '§768.28(9), Fla. Stat.',
        deadline: null,
      },
      {
        issueType: 'sovereign_immunity_bar',
        description:
          'Count I (Florida Whistle-blower Act) is a state statutory claim against the Academy. Charter schools that are instrumentalities of the state may assert sovereign immunity defenses. Evaluate whether Suncoast Charter Academy qualifies as a state agency or subdivision under §768.28(2). If so, sovereign immunity caps apply to Count I — but note that §1983 claims in Counts II and III are federal civil rights claims to which sovereign immunity caps do NOT apply. Exposure on the federal counts is uncapped.',
        severity: 'major',
        statute: '§768.28(2), Fla. Stat.',
        deadline: null,
      },
    ],
    applicableDefenses: [
      '§768.28(9) — Kretch individual immunity for in-scope employment decisions',
      '§1983 qualified immunity for Kretch (if federal court)',
      "Whistle-blower Act — employee must have reasonable basis for belief of violation",
      'First Amendment — speech on matters of private employment concern not protected',
      'After-acquired evidence doctrine re: termination',
      'Eleventh Amendment immunity (if federal court, for official capacity claims)',
    ],
    previewFlag:
      'This complaint contains claims that may belong in a different court entirely. Identify the federal hook and assess your deadline immediately.',
    hb145Applicable: true,
    completedActions: [],
    hoursBilled: 0,
    amountBilled: 0,
    estimatedHours: 55,
    status: 'active',
    caseHealth: 100,
    caseHealthEvents: [],
    caseOutcomeProbability: { strongWin: 40, settleDefense: 30, settleNeutral: 20, loss: 10 },
    activeConsequences: [],
    consequencesTriggered: [],
    consequenceTimestamps: {},
  },
]
