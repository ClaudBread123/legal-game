export const LITIGATION_ACTIONS = [
  {
    id: 'motion_to_dismiss',
    label: 'Draft Motion to Dismiss',
    description:
      'Prepare and file motion to dismiss asserting all available grounds. This is the foundational defensive move. Assert every viable ground now — waived grounds are expensive to revive later.',
    strategicNote:
      'CRITICAL: File on all available grounds simultaneously. Piecemeal motions are a costly mistake.',
    hours: 3.0,
    dailyActionCost: 1,
    availableWhen: 'always',
    unlocksAction: 'notice_mtd_hearing',
    deadlineTrigger: null,
    xpReward: 50,
  },
  {
    id: 'notice_mtd_hearing',
    label: 'Notice Hearing on Motion to Dismiss',
    description:
      'Set the motion to dismiss for hearing before the judge. Time is critical — if you delay, opposing counsel will set it for a 5-minute hearing slot and your motion will almost certainly be denied.',
    strategicNote:
      'URGENT: Set immediately after filing. Request no less than 30 minutes. Judges fill calendars fast.',
    hours: 0.5,
    dailyActionCost: 1,
    availableWhen: 'after:motion_to_dismiss',
    deadlineTrigger: {
      daysAfterAction: 14,
      warningIfMissed:
        'Opposing counsel has set your motion for a 5-minute hearing. Likelihood of denial is now very high.',
    },
    xpReward: 35,
  },
  {
    id: 'written_discovery',
    label: 'Serve Initial Written Discovery',
    description:
      'Serve interrogatories, requests for production, and requests for admissions on plaintiff. Requests for admissions are powerful — unanswered RFAs are deemed admitted after 30 days.',
    strategicNote: 'Serve RFAs strategically. Deemed admissions can gut a plaintiff\'s case.',
    hours: 2.0,
    dailyActionCost: 1,
    availableWhen: 'always',
    xpReward: 40,
  },
  {
    id: 'notice_plaintiff_depo',
    label: 'Notice Plaintiff\'s Deposition',
    description:
      'Notice the plaintiff\'s deposition as early as possible. If plaintiff\'s counsel notices your client first, you lose tactical control of the deposition sequence.',
    strategicNote:
      'CRITICAL: Take plaintiff\'s deposition before opposing counsel takes your client\'s. This is non-negotiable strategy.',
    hours: 0.5,
    dailyActionCost: 1,
    availableWhen: 'always',
    deadlineTrigger: {
      daysFromCaseStart: 45,
      warningIfMissed:
        'Plaintiff\'s counsel has noticed your client\'s deposition. You have lost deposition sequencing advantage.',
    },
    xpReward: 40,
  },
  {
    id: 'take_plaintiff_depo',
    label: 'Take Plaintiff\'s Deposition',
    description:
      'Conduct the deposition of the plaintiff. Lock in testimony, expose inconsistencies, and build the record for summary judgment.',
    strategicNote: 'Aggressive, thorough deposition testimony is the foundation of summary judgment.',
    hours: 4.0,
    dailyActionCost: 1,
    availableWhen: 'after:notice_plaintiff_depo',
    xpReward: 75,
  },
  {
    id: 'identify_expert',
    label: 'Identify and Retain Expert Witness',
    description:
      'Identify an appropriate expert witness for the case and initiate retention. Expert disclosure deadline is 90 days before trial — missing it is frequently case-dispositive.',
    strategicNote: 'Do not wait. Expert retention takes time. Missing disclosure = likely loss.',
    hours: 1.5,
    dailyActionCost: 1,
    availableWhen: 'always',
    deadlineTrigger: {
      daysBeforeTrial: 90,
      warningIfMissed:
        'Expert disclosure deadline has passed. Motion to exclude your expert is likely. Case is severely compromised.',
    },
    xpReward: 35,
  },
  {
    id: 'disclose_expert',
    label: 'Disclose Expert Witness',
    description:
      'File formal expert witness disclosure with the court. Must occur by deadline in the trial order.',
    strategicNote: 'Late disclosure is almost always fatal. File on time.',
    hours: 1.0,
    dailyActionCost: 1,
    availableWhen: 'after:identify_expert',
    xpReward: 40,
  },
  {
    id: 'respond_to_discovery',
    label: 'Respond to Plaintiff\'s Discovery',
    description:
      'Prepare and serve responses to plaintiff\'s interrogatories, requests for production, and requests for admissions. RFAs not responded to within 30 days are deemed admitted.',
    strategicNote:
      'NEVER miss an RFA deadline. Deemed admissions against your client are extremely difficult to undo.',
    hours: 2.5,
    dailyActionCost: 1,
    availableWhen: 'always',
    xpReward: 30,
  },
  {
    id: 'motion_summary_judgment',
    label: 'Draft Motion for Summary Judgment',
    description:
      'Prepare motion for summary judgment based on the record built through discovery. The entire litigation strategy is designed to build toward this moment.',
    strategicNote:
      'If the case has been litigated correctly, this motion should be supported by strong deposition testimony and admitted facts.',
    hours: 5.0,
    dailyActionCost: 1,
    availableWhen: 'after:take_plaintiff_depo',
    xpReward: 150,
  },
  {
    id: 'request_mediation',
    label: 'Request Mediation',
    description:
      'Request court-ordered mediation. Required in most Florida civil cases. Strategically, timing matters — mediate from a position of strength after building your record.',
    strategicNote: 'Mediation is required. Request it on your timeline, not plaintiff\'s.',
    hours: 1.0,
    dailyActionCost: 1,
    availableWhen: 'always',
    xpReward: 20,
  },
]
