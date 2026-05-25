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
    selectedExpertType: null,
    selectedExpertId: null,
    publicRecordsRequest: null,
    investigationFindings: {},
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
    selectedExpertType: null,
    selectedExpertId: null,
    publicRecordsRequest: null,
    investigationFindings: {},
  },
]

export const FALLBACK_CASE_QUEUE = [
  {
    caseId: 'LW-2025-0051',
    caseType: 'employment',
    clientName: 'Terrence Washington',
    defendant: 'Broward County School Board',
    dateOfIncident: '2026-10-15',
    hb145Applicable: true,
    factScenario: 'Plaintiff Terrence Washington, a tenured high school teacher at Cypress Ridge High School, was terminated following an internal investigation into alleged misconduct with a student. Plaintiff denies all allegations and claims the termination was pretextual — the real reason being his role as union representative and his public criticism of the principal\'s grading policies. He filed a charge with the FCHR on January 15, 2027 and received a right-to-sue letter. He now sues the School Board and Principal Andrea Moss individually.',
    claimsAsserted: [
      'Count I — Florida Whistle-blower Act Retaliation (School Board)',
      'Count II — First Amendment Retaliation, 42 U.S.C. §1983 (School Board)',
      'Count III — First Amendment Retaliation, 42 U.S.C. §1983 (Principal Moss, individually)',
      'Count IV — Tortious Interference with Employment Contract (Principal Moss, individually)',
    ],
    hiddenIssues: [
      {
        issueType: 'federal_removal_1983',
        description: 'Counts II and III are §1983 federal civil rights claims. 30-day removal window from service is running.',
        severity: 'critical',
        statute: '42 U.S.C. §1983; 28 U.S.C. §1441',
        deadline: '30 days from service',
      },
      {
        issueType: 'barred_individual_defendant',
        description: 'Count IV against Principal Moss for tortious interference. If Moss acted within scope of employment as principal, Count IV is barred under §768.28(9). Evaluate whether a principal\'s termination recommendation is within scope of employment.',
        severity: 'critical',
        statute: '§768.28(9), Fla. Stat.',
        deadline: null,
      },
      {
        issueType: 'admin_exhaustion',
        description: 'Whistle-blower and employment discrimination claims require FCHR exhaustion. Verify right-to-sue letter is valid and timely. Check whether all claims in the complaint were included in the FCHR charge.',
        severity: 'major',
        statute: '§760.11, Fla. Stat.',
        deadline: null,
      },
      {
        issueType: 'hb145_cap_applicability',
        description: 'Incident date October 15, 2026 — after HB 145 effective date. New caps apply to state tort claims: $350,000/$500,000. Note: §1983 claims are uncapped.',
        severity: 'major',
        statute: '§768.28(5), Fla. Stat.',
        deadline: null,
      },
    ],
    applicableDefenses: [
      '§768.28(9) — Moss individual immunity',
      '§1983 qualified immunity (Moss, federal)',
      'Whistleblower Act — no objectively reasonable belief of violation',
      'First Amendment — speech on private employment matters not protected',
      'FCHR exhaustion — scope of charge',
      'After-acquired evidence doctrine',
    ],
    previewFlag: 'This complaint has claims that belong in two different courts. Time is already running on the federal question.',
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
    selectedExpertType: null,
    selectedExpertId: null,
    publicRecordsRequest: null,
    investigationFindings: {},
  },
  {
    caseId: 'LW-2025-0058',
    caseType: 'bert_harris',
    clientName: 'Sunrise Coastal Development LLC',
    defendant: 'City of Manatee Bay',
    dateOfIncident: '2025-03-01',
    hb145Applicable: false,
    factScenario: 'Plaintiff Sunrise Coastal Development LLC owns a 12-acre waterfront parcel zoned for mixed-use development. On March 1, 2025, the City of Manatee Bay enacted Ordinance 2025-14, reclassifying the parcel as a conservation overlay district and prohibiting all development. Plaintiff claims the ordinance has rendered the property virtually worthless, constituting an inordinate burden under the Bert J. Harris Jr. Private Property Rights Protection Act. Plaintiff demanded compensation; the City denied the claim.',
    claimsAsserted: [
      'Count I — Bert J. Harris Act Claim (§70.001, Fla. Stat.)',
      'Count II — Inverse Condemnation (Art. X §6, Fla. Const.)',
      'Count III — Substantive Due Process (42 U.S.C. §1983)',
    ],
    hiddenIssues: [
      {
        issueType: 'admin_exhaustion',
        description: 'Bert J. Harris Act claims require a written demand to the governmental entity and a 180-day waiting period before suit. Verify that plaintiff complied with §70.001(4) pre-suit demand requirements.',
        severity: 'critical',
        statute: '§70.001(4), Fla. Stat.',
        deadline: null,
      },
      {
        issueType: 'federal_removal_1983',
        description: 'Count III asserts a §1983 claim. 30-day removal window running.',
        severity: 'critical',
        statute: '42 U.S.C. §1983; 28 U.S.C. §1441',
        deadline: '30 days from service',
      },
      {
        issueType: 'sovereign_immunity_bar',
        description: 'Legislative/regulatory actions (zoning) are typically discretionary governmental functions. Evaluate whether sovereign immunity bars the tort claims while the Harris Act claim proceeds.',
        severity: 'major',
        statute: '§768.28, Fla. Stat.',
        deadline: null,
      },
    ],
    applicableDefenses: [
      'Harris Act — no inordinate burden if substantial use remains',
      'Harris Act — pre-suit demand deficiency',
      'Police power — legitimate governmental interest in conservation',
      '§1983 — no constitutional violation if rational basis exists',
      'Sovereign immunity on tort claims',
    ],
    previewFlag: 'This is not a standard tort case. Identify the unique statutory framework that governs property rights claims against Florida municipalities.',
    completedActions: [],
    hoursBilled: 0,
    amountBilled: 0,
    estimatedHours: 50,
    status: 'active',
    caseHealth: 100,
    caseHealthEvents: [],
    caseOutcomeProbability: { strongWin: 35, settleDefense: 35, settleNeutral: 20, loss: 10 },
    activeConsequences: [],
    consequencesTriggered: [],
    consequenceTimestamps: {},
    selectedExpertType: null,
    selectedExpertId: null,
    publicRecordsRequest: null,
    investigationFindings: {},
  },
  {
    caseId: 'LW-2025-0061',
    caseType: 'state_tort',
    clientName: 'Maria Fontaine',
    defendant: 'Horizon Academy Charter School',
    dateOfIncident: '2026-11-20',
    hb145Applicable: true,
    factScenario: 'Plaintiff Maria Fontaine, mother and natural guardian of minor child D.F., alleges that her 9-year-old son was physically assaulted by another student during recess at Horizon Academy Charter School on November 20, 2026. Plaintiff claims the school had prior knowledge of the assailant\'s violent behavior — including two prior incidents in the same school year — and failed to take adequate disciplinary or supervisory action. The assailant\'s parents are also named. Plaintiff seeks damages for physical injuries, emotional distress, and future medical expenses.',
    claimsAsserted: [
      'Count I — Negligent Supervision (Horizon Academy)',
      'Count II — Negligent Retention (Horizon Academy)',
      'Count III — Negligence (Assailant\'s Parents, individually)',
      'Count IV — Intentional Tort (Assailant, through parents as guardians)',
    ],
    hiddenIssues: [
      {
        issueType: 'insufficient_presuit_notice',
        description: 'HB 145 applies — incident November 20, 2026. 18-month pre-suit notice window. Verify written notice was presented to Horizon Academy within 18 months of November 20, 2026, and that the Academy denied the claim or 4 months elapsed without disposition.',
        severity: 'critical',
        statute: '§768.28(6)(a), Fla. Stat. as amended by HB 145',
        deadline: '2028-05-20',
      },
      {
        issueType: 'sovereign_immunity_bar',
        description: 'Horizon Academy is a charter school. Determine whether it qualifies as a state agency or subdivision under §768.28(2). Charter schools that are instrumentalities of a school board may assert sovereign immunity.',
        severity: 'critical',
        statute: '§768.28(2), Fla. Stat.; §1002.33, Fla. Stat.',
        deadline: null,
      },
      {
        issueType: 'hb145_cap_applicability',
        description: 'Incident November 20, 2026 — HB 145 new caps apply: $350,000 per person, $500,000 per occurrence. Applies to state tort claims if Academy qualifies as governmental entity.',
        severity: 'major',
        statute: '§768.28(5), Fla. Stat.',
        deadline: null,
      },
      {
        issueType: 'duplicative_counts',
        description: 'Count I (Negligent Supervision) and Count II (Negligent Retention) may be duplicative if based on identical facts and theory. Evaluate whether they assert distinct legal theories.',
        severity: 'minor',
        statute: 'Fla. R. Civ. P. 1.110',
        deadline: null,
      },
    ],
    applicableDefenses: [
      'Charter school sovereign immunity — if instrumentality of school board',
      '§768.28(6) pre-suit notice deficiency',
      'Third-party criminal/intentional act as superseding cause',
      'Comparative negligence — parental supervision of assailant',
      'No prior notice of dangerous propensity',
      'Discretionary function — disciplinary decisions',
    ],
    previewFlag: 'The identity of this defendant requires threshold analysis before any other defense. What kind of entity is a charter school under Florida law?',
    completedActions: [],
    hoursBilled: 0,
    amountBilled: 0,
    estimatedHours: 45,
    status: 'active',
    caseHealth: 100,
    caseHealthEvents: [],
    caseOutcomeProbability: { strongWin: 40, settleDefense: 30, settleNeutral: 20, loss: 10 },
    activeConsequences: [],
    consequencesTriggered: [],
    consequenceTimestamps: {},
    selectedExpertType: null,
    selectedExpertId: null,
    publicRecordsRequest: null,
    investigationFindings: {},
  },
]
