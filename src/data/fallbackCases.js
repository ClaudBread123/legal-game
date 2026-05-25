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
  // Case 1 — Pinellas County (vehicle collision / individual defendant / pre-suit notice)
  {
    caseId: 'LW-2026-0072',
    caseType: 'state_tort',
    clientName: 'Devon Archibald',
    defendant: 'Pinellas County',
    dateOfIncident: '2026-02-14',
    hb145Applicable: false,
    factScenario: 'Plaintiff Devon Archibald alleges he was injured when a county-owned vehicle driven by Public Works employee Raymond Castillo ran a red light and struck his vehicle on February 14, 2026 in Clearwater. Plaintiff claims Castillo was acting within the scope of his employment and that the County is liable for his injuries. Plaintiff also names Castillo individually. Plaintiff seeks damages for personal injuries, lost wages, and property damage. The incident occurred before HB 145\'s effective date of October 1, 2026.',
    claimsAsserted: [
      'Count I — Negligence (Pinellas County)',
      'Count II — Negligence (Raymond Castillo, individually)',
      'Count III — Negligent Entrustment (Pinellas County)',
    ],
    hiddenIssues: [
      {
        issueType: 'barred_individual_defendant',
        description: "Castillo is named individually. His operation of a county vehicle during working hours is within the scope of employment. Absent facts establishing bad faith, malice, or wanton conduct, Count II is barred under §768.28(9). The exclusive remedy is against Pinellas County.",
        severity: 'critical',
        statute: '§768.28(9), Fla. Stat.',
        deadline: null,
      },
      {
        issueType: 'insufficient_presuit_notice',
        description: 'Incident February 14, 2026 — before HB 145 effective date. Old 3-year pre-suit notice window applies. Verify written notice was presented to Pinellas County within 3 years of February 14, 2026 and that County denied or 6 months elapsed before suit was filed.',
        severity: 'critical',
        statute: '§768.28(6)(a), Fla. Stat.',
        deadline: '2029-02-14',
      },
      {
        issueType: 'duplicative_counts',
        description: 'Count III (Negligent Entrustment) may be duplicative of Count I (Negligence) if both are based on the same operative facts of Castillo\'s negligent driving while employed. Evaluate whether negligent entrustment states a distinct theory warranting a separate count.',
        severity: 'minor',
        statute: 'Fla. R. Civ. P. 1.110',
        deadline: null,
      },
    ],
    applicableDefenses: [
      '§768.28(9) — Castillo individual immunity',
      'Discretionary function — route selection decisions',
      'Comparative negligence — plaintiff\'s driving',
      'Sovereign immunity caps — pre-HB145 incident ($200k/$300k)',
      'Emergency vehicle exception if applicable',
    ],
    previewFlag: 'Not every defendant named in this complaint can be properly sued. Identify who belongs in this case and who does not before filing anything.',
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

  // Case 2 — City of Opa-locka (§1983 warrantless search / HB145 / individual defendant)
  {
    caseId: 'LW-2026-0079',
    caseType: 'section_1983',
    clientName: 'Antoine Beaumont',
    defendant: 'City of Opa-locka',
    dateOfIncident: '2026-11-08',
    hb145Applicable: true,
    factScenario: 'Plaintiff Antoine Beaumont alleges that on November 8, 2026, City of Opa-locka police officers forcibly entered his home without a warrant, detained him for four hours, and destroyed property during the search. Plaintiff alleges the officers acted pursuant to an informal department policy of conducting warrantless searches in a designated high-crime zone. Plaintiff names the City and Officer Marcus Webb individually. He files in state circuit court asserting both state tort claims and federal civil rights violations.',
    claimsAsserted: [
      'Count I — False Imprisonment (City of Opa-locka)',
      'Count II — Trespass to Property (City of Opa-locka)',
      'Count III — Fourth Amendment Violation, 42 U.S.C. §1983 (City of Opa-locka)',
      'Count IV — Fourth Amendment Violation, 42 U.S.C. §1983 (Officer Webb, individually)',
      'Count V — Negligence (Officer Webb, individually)',
    ],
    hiddenIssues: [
      {
        issueType: 'federal_removal_1983',
        description: 'Counts III and IV assert §1983 federal civil rights claims creating federal question jurisdiction. 30-day removal window from service is running immediately. Evaluate removal to Southern District of Florida. Federal court provides access to qualified immunity arguments unavailable in state court. Municipal §1983 Monell liability is uncapped.',
        severity: 'critical',
        statute: '42 U.S.C. §1983; 28 U.S.C. §1441',
        deadline: '30 days from service',
      },
      {
        issueType: 'barred_individual_defendant',
        description: 'Count V names Officer Webb individually for negligence. If Webb acted within the scope of employment as a police officer — even if the search was unlawful — the state law negligence claim is barred under §768.28(9). Note: the §1983 individual capacity claim (Count IV) is NOT barred by §768.28(9) but is subject to qualified immunity in federal court.',
        severity: 'critical',
        statute: '§768.28(9), Fla. Stat.',
        deadline: null,
      },
      {
        issueType: 'hb145_cap_applicability',
        description: 'Incident November 8, 2026 — after HB 145 effective date. New caps apply to state tort claims (Counts I and II): $350,000 per person, $500,000 per occurrence. Critical distinction: §1983 claims (Counts III and IV) are NOT subject to sovereign immunity caps. Municipal §1983 liability under Monell is uncapped.',
        severity: 'major',
        statute: '§768.28(5), Fla. Stat.; 42 U.S.C. §1983',
        deadline: null,
      },
    ],
    applicableDefenses: [
      '§768.28(9) — Webb negligence claim barred',
      'Qualified immunity — Webb §1983 (federal court)',
      'Monell — no official policy if informal practice',
      'Sovereign immunity caps on state tort counts (HB145 applies)',
      'Eleventh Amendment — if state agency involved',
    ],
    previewFlag: 'This complaint contains claims that belong in two different courts with completely different immunity frameworks. One deadline is already running.',
    completedActions: [],
    hoursBilled: 0,
    amountBilled: 0,
    estimatedHours: 50,
    status: 'active',
    caseHealth: 100,
    caseHealthEvents: [],
    caseOutcomeProbability: { strongWin: 35, settleDefense: 30, settleNeutral: 25, loss: 10 },
    activeConsequences: [],
    consequencesTriggered: [],
    consequenceTimestamps: {},
    selectedExpertType: null,
    selectedExpertId: null,
    publicRecordsRequest: null,
    investigationFindings: {},
  },

  // Case 3 — City of Manatee Bay (Bert Harris / inverse condemnation)
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

  // Case 4 — Horizon Academy Charter School (negligent supervision)
  {
    caseId: 'LW-2025-0061',
    caseType: 'state_tort',
    clientName: 'Maria Fontaine',
    defendant: 'Horizon Academy Charter School',
    dateOfIncident: '2026-11-20',
    hb145Applicable: true,
    factScenario: "Plaintiff Maria Fontaine, mother and natural guardian of minor child D.F., alleges that her 9-year-old son was physically assaulted by another student during recess at Horizon Academy Charter School on November 20, 2026. Plaintiff claims the school had prior knowledge of the assailant's violent behavior — including two prior incidents in the same school year — and failed to take adequate disciplinary or supervisory action. The assailant's parents are also named. Plaintiff seeks damages for physical injuries, emotional distress, and future medical expenses.",
    claimsAsserted: [
      'Count I — Negligent Supervision (Horizon Academy)',
      'Count II — Negligent Retention (Horizon Academy)',
      "Count III — Negligence (Assailant's Parents, individually)",
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

  // Case 5 — Broward County School Board (employment / §1983 / removal) — last resort fallback
  {
    caseId: 'LW-2025-0051',
    caseType: 'employment',
    clientName: 'Terrence Washington',
    defendant: 'Broward County School Board',
    dateOfIncident: '2026-10-15',
    hb145Applicable: true,
    factScenario: "Plaintiff Terrence Washington, a tenured high school teacher at Cypress Ridge High School, was terminated following an internal investigation into alleged misconduct with a student. Plaintiff denies all allegations and claims the termination was pretextual — the real reason being his role as union representative and his public criticism of the principal's grading policies. He filed a charge with the FCHR on January 15, 2027 and received a right-to-sue letter. He now sues the School Board and Principal Andrea Moss individually.",
    claimsAsserted: [
      'Count I — Florida Whistle-blower Act Retaliation (School Board)',
      'Count II — First Amendment Retaliation, 42 U.S.C. §1983 (School Board)',
      'Count III — First Amendment Retaliation, 42 U.S.C. §1983 (Principal Moss, individually)',
      'Count IV — Tortious Interference with Employment Contract (Principal Moss, individually)',
    ],
    hiddenIssues: [
      {
        issueType: 'federal_removal_1983',
        description: 'Counts II and III are §1983 federal civil rights claims. 30-day removal window from service is running. Evaluate removal to Southern District of Florida — federal court provides qualified immunity arguments unavailable in state court.',
        severity: 'critical',
        statute: '42 U.S.C. §1983; 28 U.S.C. §1441',
        deadline: '30 days from service',
      },
      {
        issueType: 'barred_individual_defendant',
        description: "Count IV against Principal Moss for tortious interference. If Moss acted within scope of employment as principal, Count IV is barred under §768.28(9). Evaluate whether a principal's termination recommendation is within scope of employment.",
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
]

// Legacy queue is now empty — cases moved to FALLBACK_CASES above
export const FALLBACK_CASE_QUEUE = []

export function getNextFallbackCase(existingCaseIds = []) {
  const available = FALLBACK_CASES.filter(c => !existingCaseIds.includes(c.caseId))

  if (available.length === 0) {
    return { ...FALLBACK_CASES[0], dateFiled: subtractBusinessDays(Math.floor(Math.random() * 5) + 3) }
  }

  // Rotate through available cases so repeated fallbacks don't always show the same case
  const key = 'llw_fallback_index'
  const current = parseInt(localStorage.getItem(key) || '0')
  const next = current % available.length
  localStorage.setItem(key, String(next + 1))

  return {
    ...available[next],
    dateFiled: subtractBusinessDays(Math.floor(Math.random() * 5) + 3),
  }
}
