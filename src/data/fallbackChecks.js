export const FALLBACK_CHECKS = {

  motion_to_dismiss: [
    // Difficulty 1 — Junior Associate
    {
      actionContext: 'A motion to dismiss tests the legal sufficiency of the complaint. In governmental defense, this is your first and most important weapon. Assert every available ground simultaneously.',
      keyStatutes: ['§768.28, Fla. Stat.', 'Fla. R. Civ. P. 1.140'],
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          question: 'You are filing a Motion to Dismiss for [DEFENDANT]. Which of the following is the MOST IMPORTANT rule about asserting grounds for dismissal?',
          options: {
            A: 'Assert only your strongest ground to avoid confusing the judge',
            B: 'Assert all available grounds simultaneously — grounds not raised may be waived or costly to raise later',
            C: 'Wait to see how the case develops before committing to grounds',
            D: 'File grounds sequentially, one at a time, to preserve each argument',
          },
          correctAnswer: 'B',
          explanation: 'Florida courts expect all available grounds for dismissal to be raised in the initial motion. Piecemeal motions waste the court\'s time, telegraph your weaknesses, and some grounds may be deemed waived if not raised early. In governmental defense, you typically have multiple grounds — sovereign immunity, §768.28(9) individual defendant bar, pre-suit notice deficiency, statute of limitations. Assert them all.',
          statute: 'Fla. R. Civ. P. 1.140',
          xpValue: 20,
        },
        {
          id: 'q2',
          type: 'multiple_choice',
          question: '[DEFENDANT] is a Florida municipality. Under §768.28(9), when can an individual government employee be held personally liable?',
          options: {
            A: 'Never — all claims must be against the entity only',
            B: 'Always — individuals can always be named alongside the entity',
            C: 'Only when the employee acted in bad faith, with malicious purpose, or with wanton and willful disregard of human rights, safety, or property',
            D: 'Only when the entity consents to the individual being named',
          },
          correctAnswer: 'C',
          explanation: '§768.28(9) is clear: an officer, employee, or agent of the state or any of its subdivisions may not be held personally liable unless they acted in bad faith, with malicious purpose, or in a manner exhibiting wanton and willful disregard. The exclusive remedy for in-scope conduct is against the governmental entity. When you see an individual employee named in a governmental tort complaint, this is your first question.',
          statute: '§768.28(9), Fla. Stat.',
          xpValue: 25,
        },
      ],
      qualityRubric: {
        excellent: 'All grounds correctly identified, filed simultaneously, hearing set within 14 days with adequate time requested',
        adequate: 'Key grounds identified, motion filed, hearing set',
        deficient: 'Grounds missed or motion filed without setting hearing promptly',
      },
    },
    // Difficulty 2 — Associate
    {
      actionContext: 'Filing a Motion to Dismiss in a governmental defense case requires identifying all available threshold defenses specific to this case\'s facts, claims, and applicable law.',
      keyStatutes: ['§768.28, Fla. Stat.', '42 U.S.C. §1983', 'Fla. R. Civ. P. 1.140'],
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          question: 'Reviewing the complaint against [DEFENDANT], you identify an individual employee named as a defendant. The complaint alleges the employee was negligent while responding to a call — a core job duty. Under §768.28(9), the CORRECT approach is:',
          options: {
            A: 'Name the individual in the motion only if the complaint alleges bad faith',
            B: 'Move to dismiss the individual defendant — in-scope employment conduct without bad faith/malice is barred, exclusive remedy is against the entity',
            C: 'Wait for discovery to determine if bad faith existed before filing',
            D: 'File a motion for summary judgment instead — dismissal is premature',
          },
          correctAnswer: 'B',
          explanation: 'You do not wait for discovery to assert §768.28(9). The complaint itself tells you the employee was acting within scope — responding to a call is a core job function. Absent specific allegations of bad faith, malice, or wanton conduct, the motion to dismiss the individual should be filed immediately. Waiting for discovery to \'confirm\' bad faith is a costly delay that benefits only the plaintiff.',
          statute: '§768.28(9), Fla. Stat.',
          xpValue: 30,
        },
        {
          id: 'q2',
          type: 'multiple_choice',
          question: 'The incident date is [INCIDENT_DATE]. [HB145]. What is the applicable pre-suit notice window and what happens if plaintiff failed to comply?',
          options: {
            A: '4 years — failure is an affirmative defense only',
            B: '3 years for pre-Oct 1 2026 claims / 18 months for post — failure is a condition precedent to suit, grounds for dismissal',
            C: '2 years — same as the statute of limitations',
            D: 'Notice is optional for municipality defendants',
          },
          correctAnswer: 'B',
          explanation: '§768.28(6)(a) requires written pre-suit notice as a condition precedent to maintaining an action — not merely an affirmative defense. HB 145 (effective Oct 1, 2026) shortened this window from 3 years to 18 months for claims accruing on or after that date. Failure to present timely, sufficient written notice to the correct entity bars the action. Verify compliance on every governmental tort file.',
          statute: '§768.28(6)(a), Fla. Stat.',
          xpValue: 30,
        },
      ],
      qualityRubric: {
        excellent: 'Both questions correct, all applicable grounds identified for this specific case',
        adequate: 'One question correct, major grounds identified',
        deficient: 'Both wrong or critical grounds missed',
      },
    },
    // Difficulty 3 — Senior Associate and above
    {
      actionContext: 'At this level, you are expected to synthesize the case facts, the claims, the applicable statutes, and strategic timing to build the strongest possible motion.',
      keyStatutes: ['§768.28, Fla. Stat.', '§768.28(9)', '§768.28(6)(a)', '§768.28(14)', 'Fla. R. Civ. P. 1.140'],
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          question: 'You are preparing a Motion to Dismiss for [DEFENDANT] against [PLAINTIFF]. The complaint names an individual employee AND asserts what appears to be a §1983 claim in state court. Identify the MOST strategically significant threshold issue and the correct sequence of actions:',
          options: {
            A: 'File MTD on §768.28(9) grounds first, then evaluate §1983 removal after the MTD is decided',
            B: 'The §1983 removal deadline is 30 days and cannot wait — evaluate removal immediately while simultaneously preparing MTD; if removing, file Notice of Removal before MTD',
            C: 'File MTD on all state law grounds; §1983 claims cannot be removed from state court',
            D: 'Address §768.28(9) and §1983 in the same motion — they are both threshold issues',
          },
          correctAnswer: 'B',
          explanation: 'The 30-day removal deadline under 28 U.S.C. §1441 runs from service and is jurisdictional — it cannot be extended. A §1983 claim in state court creates federal question jurisdiction and the right to remove. This must be evaluated and acted on before the MTD. Filing a MTD in state court while a removal deadline runs is a serious strategic error — if you remove, the state court MTD is moot and you start fresh in federal court.',
          statute: '28 U.S.C. §1441; 42 U.S.C. §1983',
          xpValue: 50,
        },
        {
          id: 'q2',
          type: 'short_answer',
          question: 'The incident date is [INCIDENT_DATE]. [HB145]. Identify ALL threshold grounds for dismissal that should be evaluated on these facts and explain which HB 145 provisions apply.',
          rubric: [
            'Identifies §768.28(9) individual defendant bar',
            'Correctly applies HB 145 pre-suit notice window based on incident date',
            'Identifies sovereign immunity discretionary function analysis',
            'Identifies statute of limitations with correct period',
            'Notes §1983 removal trigger if applicable',
          ],
          xpValue: 50,
        },
      ],
      qualityRubric: {
        excellent: 'All grounds identified, correct sequencing, HB 145 correctly applied',
        adequate: 'Major grounds identified, minor gaps',
        deficient: 'Key grounds missed or incorrect sequencing',
      },
    },
  ],

  written_discovery: [
    {
      actionContext: 'Written discovery in governmental defense must be strategic. Requests for Admissions on key issues are your most powerful tool — unanswered RFAs are deemed admitted after 30 days.',
      keyStatutes: ['Fla. R. Civ. P. 1.370', 'Fla. R. Civ. P. 1.340', 'Fla. R. Civ. P. 1.350'],
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          question: 'You are serving Requests for Admissions on [PLAINTIFF] in a case against [DEFENDANT]. What happens if plaintiff fails to respond within 30 days?',
          options: {
            A: 'You must file a motion to compel before they are effective',
            B: 'The matters are automatically deemed admitted under Rule 1.370 — no motion required',
            C: 'You can use them as evidence but they are not binding',
            D: 'The 30-day deadline can be extended by agreement',
          },
          correctAnswer: 'B',
          explanation: 'Florida Rule of Civil Procedure 1.370 is automatic — failure to respond within 30 days means the matters are deemed admitted without any court order. This is one of the most powerful tools in civil litigation. RFAs on key liability issues, damages caps, and foundational facts can effectively limit plaintiff\'s case if unanswered. Track response deadlines carefully.',
          statute: 'Fla. R. Civ. P. 1.370',
          xpValue: 25,
        },
        {
          id: 'q2',
          type: 'multiple_choice',
          question: 'In a case against [DEFENDANT], which RFA would be MOST strategically valuable to serve early?',
          options: {
            A: 'Admit that the incident occurred on [INCIDENT_DATE]',
            B: 'Admit that [DEFENDANT] is a Florida municipality subject to §768.28',
            C: 'Admit that plaintiff received no prior written notice of the allegedly dangerous condition',
            D: 'Admit that plaintiff was present at the location',
          },
          correctAnswer: 'C',
          explanation: 'RFAs on foundational facts that plaintiff cannot truthfully deny — or that establish your defense if deemed admitted — are the most valuable. An admission that no prior notice existed goes directly to the foreseeability defense and lack-of-notice argument. RFAs on undisputed facts (date, location, entity status) waste the tool on things you can prove anyway.',
          statute: 'Fla. R. Civ. P. 1.370',
          xpValue: 25,
        },
      ],
      qualityRubric: {
        excellent: 'Strategic RFAs on key liability and damages issues, complete interrogatories and RFPs',
        adequate: 'Discovery served, basic RFAs included',
        deficient: 'Discovery served without strategic RFAs or incomplete',
      },
    },
    {
      actionContext: 'At this level you are expected to craft discovery that builds your record for summary judgment, not just gather information.',
      keyStatutes: ['Fla. R. Civ. P. 1.370', 'Fla. R. Civ. P. 1.340'],
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          question: 'You are preparing RFAs in a negligent security case against [DEFENDANT]. You want to establish lack of prior notice. Which set of RFAs is MOST strategically complete?',
          options: {
            A: 'Admit no prior incidents occurred at this location',
            B: 'Admit no prior incidents at this location; admit defendant had no written complaints about security; admit no prior police reports for this location in the prior 24 months',
            C: 'Admit the security measures were adequate',
            D: 'Admit plaintiff was contributorily negligent',
          },
          correctAnswer: 'B',
          explanation: 'A comprehensive no-notice RFA package covers all the ways plaintiff might try to establish prior notice — incidents, complaints, police reports. Getting all three deemed admitted or answered \'denied\' (which plaintiff must then prove) is far more powerful than a single admission. Option C is too broad and plaintiff will simply deny. Option D is a legal conclusion RFA that courts often strike.',
          statute: 'Fla. R. Civ. P. 1.370',
          xpValue: 35,
        },
      ],
      qualityRubric: {
        excellent: 'Targeted RFAs on specific defenses, complete discovery package',
        adequate: 'Good RFAs, some gaps',
        deficient: 'Generic or missing strategic RFAs',
      },
    },
  ],

  take_plaintiff_depo: [
    {
      actionContext: 'Plaintiff\'s deposition is the most important event in the case. Your goal: lock in testimony, expose inconsistencies, and build every element of your summary judgment record.',
      keyStatutes: ['Fla. R. Civ. P. 1.310', 'Fla. R. Civ. P. 1.351'],
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          question: 'You are about to depose [PLAINTIFF] in a case against [DEFENDANT]. You want to video record the deposition. What additional requirement applies?',
          options: {
            A: 'No additional requirements — any deposition can be recorded',
            B: 'The notice must specify that the deposition will be video recorded AND include the videographer\'s name and address',
            C: 'You need court permission to video record',
            D: 'Opposing counsel must consent to video recording',
          },
          correctAnswer: 'B',
          explanation: 'Under Florida Rule of Civil Procedure 1.310(b)(4), a party who wants to record a deposition by video must include in the notice that the deposition will be recorded by video and must state the name and address of the videographer. Failure to include this information in the notice can result in objection at the deposition. Video depositions are powerful for impeachment at trial.',
          statute: 'Fla. R. Civ. P. 1.310(b)(4)',
          xpValue: 20,
        },
        {
          id: 'q2',
          type: 'multiple_choice',
          question: 'You want [PLAINTIFF] to bring documents to the deposition. What must you do?',
          options: {
            A: 'Ask politely in the notice',
            B: 'File a motion for document production before the deposition',
            C: 'Include a Duces Tecum in the deposition notice listing the documents to be produced',
            D: 'Documents cannot be required at deposition',
          },
          correctAnswer: 'C',
          explanation: 'A deposition notice with a Duces Tecum requires the deponent to bring specified documents to the deposition. This is standard practice in plaintiff depositions — you want to review their medical records, prior lawsuit documents, insurance information, employment records, and any other relevant documents while they are under oath. Always include a Duces Tecum in plaintiff deposition notices.',
          statute: 'Fla. R. Civ. P. 1.351',
          xpValue: 25,
        },
      ],
      qualityRubric: {
        excellent: 'Video notice with videographer info, Duces Tecum included, deposition taken after written discovery responses received',
        adequate: 'Deposition noticed and taken, basic requirements met',
        deficient: 'Deposition taken without Duces Tecum or before written discovery responses received',
      },
    },
  ],

  motion_summary_judgment: [
    {
      actionContext: 'Summary judgment is the goal of the entire litigation strategy. Every action taken since day one was building toward this motion. It must be supported by the record you created.',
      keyStatutes: ['Fla. R. Civ. P. 1.510', '§768.28, Fla. Stat.'],
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          question: 'Under Florida Rule 1.510, the standard for summary judgment is:',
          options: {
            A: 'The moving party must prove their case beyond a reasonable doubt',
            B: 'There is no genuine dispute as to any material fact and the moving party is entitled to judgment as a matter of law',
            C: 'The non-moving party must affirmatively prove a genuine dispute exists',
            D: 'The court weighs the evidence and decides the most likely outcome',
          },
          correctAnswer: 'B',
          explanation: 'Florida adopted the federal summary judgment standard in 2021. Under amended Rule 1.510, summary judgment is appropriate when there is no genuine dispute as to any material fact and the moving party is entitled to judgment as a matter of law. The court does not weigh credibility — it determines whether a reasonable jury could find for the non-moving party. In governmental immunity cases, pure questions of law are particularly strong summary judgment candidates.',
          statute: 'Fla. R. Civ. P. 1.510',
          xpValue: 30,
        },
        {
          id: 'q2',
          type: 'multiple_choice',
          question: 'Your summary judgment motion in a case against [DEFENDANT] argues sovereign immunity. The strongest support for this motion comes from:',
          options: {
            A: 'Your legal argument alone — immunity is a question of law',
            B: 'Plaintiff\'s deposition testimony, deemed RFA admissions, and your expert\'s opinion establishing the record',
            C: 'The original complaint allegations only',
            D: 'Affidavits from your client\'s employees',
          },
          correctAnswer: 'B',
          explanation: 'While immunity can be a pure question of law, the strongest summary judgment record combines: deposition testimony that locks in favorable facts, deemed RFA admissions that establish key elements of your defense, expert opinion that addresses the technical standards, and your legal argument tying it all together. A motion supported only by legal argument is far weaker than one supported by a built record.',
          statute: 'Fla. R. Civ. P. 1.510',
          xpValue: 35,
        },
      ],
      qualityRubric: {
        excellent: 'Motion filed with full record support — deposition testimony, RFA admissions, expert opinion all cited',
        adequate: 'Motion filed with adequate record support',
        deficient: 'Motion filed without completing discovery record — significantly weakened',
      },
    },
  ],

  check_presuit_notice: [
    {
      actionContext: 'Pre-suit notice under §768.28(6) is a condition precedent to suit against a governmental entity. Deficient notice is grounds for dismissal. Check it on day one.',
      keyStatutes: ['§768.28(6)(a), Fla. Stat.', 'HB 145 (eff. Oct 1, 2026)'],
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          question: 'The incident in this case occurred on [INCIDENT_DATE]. [HB145]. What is the applicable pre-suit notice window?',
          options: {
            A: '4 years from incident date',
            B: '2 years from incident date — same as negligence SOL',
            C: '3 years (pre-Oct 1 2026 claims) or 18 months (post-Oct 1 2026 claims) from accrual date',
            D: '6 months from incident date',
          },
          correctAnswer: 'C',
          explanation: '§768.28(6)(a) requires written notice within 3 years of accrual for claims arising before October 1, 2026. HB 145 shortened this to 18 months for claims accruing on or after October 1, 2026. The accrual date is critical — not the filing date. Verify when the claim accrued and apply the correct window. Failure to present timely notice is a condition precedent to suit — the action is barred.',
          statute: '§768.28(6)(a), Fla. Stat.',
          xpValue: 30,
        },
      ],
      qualityRubric: {
        excellent: 'Correct window identified, notice verified as timely and sufficient, sent to correct entity',
        adequate: 'Window identified, notice reviewed',
        deficient: 'Wrong window applied or notice not reviewed',
      },
    },
  ],

  initial_evaluation: [
    {
      actionContext: 'The initial evaluation sets expectations for the client and carrier. Honest, accurate assessment at the outset prevents surprises — and surprises are what destroy client relationships.',
      keyStatutes: ['§768.28(5), Fla. Stat.', 'HB 145'],
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          question: 'You are preparing an initial liability evaluation for [DEFENDANT] in a case with an incident date of [INCIDENT_DATE]. [HB145]. What is the maximum tort exposure per person you should communicate to the client?',
          options: {
            A: '$200,000 per person / $300,000 per occurrence — always',
            B: '$350,000 per person / $500,000 per occurrence — always',
            C: '$200,000 / $300,000 for pre-Oct 1 2026 claims; $350,000 / $500,000 for post-Oct 1 2026 claims',
            D: 'No cap — exposure is unlimited for municipal defendants',
          },
          correctAnswer: 'C',
          explanation: 'HB 145 increased the sovereign immunity caps under §768.28(5) from $200,000 per person / $300,000 per occurrence to $350,000 per person / $500,000 per occurrence, effective for causes of action accruing on or after October 1, 2026. The correct cap depends entirely on when the cause of action accrued — not when it was filed. Telling a client the wrong cap is a serious error that affects their insurance coverage analysis and settlement strategy.',
          statute: '§768.28(5), Fla. Stat.',
          xpValue: 35,
        },
      ],
      qualityRubric: {
        excellent: 'Correct cap applied, complete liability analysis, realistic budget',
        adequate: 'Correct cap, basic analysis',
        deficient: 'Wrong cap applied or incomplete analysis',
      },
    },
  ],

  check_statute_of_limitations: [
    {
      actionContext: 'Verifying the statute of limitations is the second threshold check after pre-suit notice. A time-barred claim is grounds for dismissal — identify it immediately and assert it in your first motion.',
      keyStatutes: ['§95.11, Fla. Stat.', '§768.28, Fla. Stat.'],
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          question: 'Under Florida law, what is the general statute of limitations for a negligence claim against [DEFENDANT] as a governmental entity?',
          options: {
            A: '4 years from the date of the incident',
            B: '2 years from the date the cause of action accrues',
            C: '3 years from the date the cause of action accrues',
            D: '1 year from the date plaintiff learned of the injury',
          },
          correctAnswer: 'B',
          explanation: '§95.11(3)(a) establishes a 2-year statute of limitations for actions for personal injury and wrongful death. This applies to negligence claims against governmental entities under §768.28. The limitations period runs from accrual — generally the date of the incident — not the date of discovery. Calculate the limitations period from the incident date of [INCIDENT_DATE] and confirm the complaint was filed timely.',
          statute: '§95.11(3)(a), Fla. Stat.',
          xpValue: 25,
        },
        {
          id: 'q2',
          type: 'multiple_choice',
          question: 'The incident in this case occurred on [INCIDENT_DATE]. Which of the following would NOT toll the statute of limitations against [DEFENDANT]?',
          options: {
            A: 'Plaintiff was a minor at the time of the incident',
            B: 'Plaintiff filed a pre-suit notice within the applicable window',
            C: 'Defendant fraudulently concealed the cause of action',
            D: 'Plaintiff was adjudicated mentally incapacitated at the time of the incident',
          },
          correctAnswer: 'B',
          explanation: 'Pre-suit notice under §768.28(6) is a condition precedent to suit — it is NOT a tolling event for the statute of limitations. The limitations period continues to run regardless of whether notice was sent. Minority (§95.051), fraud (§95.031(2)), and mental incapacity (§95.051) can toll the period. Failure to serve timely pre-suit notice and the running of the limitations period are separate, independent bars — both must be checked.',
          statute: '§95.11(3)(a); §95.051, Fla. Stat.',
          xpValue: 30,
        },
      ],
      qualityRubric: {
        excellent: 'Correct limitations period identified, accrual date confirmed, tolling issues analyzed, if time-barred: assert in MTD',
        adequate: 'Correct period identified, accrual date confirmed',
        deficient: 'Wrong period applied or accrual date not analyzed',
      },
    },
  ],

  notice_plaintiff_depo: [
    {
      actionContext: 'Noticing plaintiff\'s deposition early establishes sequencing advantage. Taking plaintiff\'s deposition before opposing counsel deposes your witnesses locks in their account before they can adjust based on your defense themes.',
      keyStatutes: ['Fla. R. Civ. P. 1.310', 'Fla. R. Civ. P. 1.351'],
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          question: 'Why is it strategically important to notice [PLAINTIFF]\'s deposition before opposing counsel notices depositions of [DEFENDANT]\'s personnel?',
          options: {
            A: 'Florida Rules require plaintiffs to be deposed before defendants',
            B: 'Deposing plaintiff first locks in their account before they can tailor testimony to match your witnesses\' expected statements',
            C: 'Deposing plaintiff first reduces court reporter costs',
            D: 'Plaintiff\'s deposition must be completed before written discovery can be served',
          },
          correctAnswer: 'B',
          explanation: 'Sequencing depositions strategically is a critical defense tactic. Deposing plaintiff first locks in their account of events, injuries, and damages before they know what your witnesses will say. If plaintiff\'s deposition reveals weaknesses or inconsistencies, you can craft your witness preparation and defense themes around those. If plaintiff deposes your witnesses first, plaintiff\'s story may adapt around them. There is no rule requiring any particular order — the advantage is entirely strategic.',
          statute: 'Fla. R. Civ. P. 1.310',
          xpValue: 20,
        },
        {
          id: 'q2',
          type: 'multiple_choice',
          question: 'How many days\' notice is required before taking an oral deposition of a party in Florida circuit court?',
          options: {
            A: '5 days',
            B: '10 days',
            C: '20 days',
            D: '30 days',
          },
          correctAnswer: 'B',
          explanation: 'Florida Rule of Civil Procedure 1.310(b)(1) requires at least 10 days\' written notice before taking an oral deposition of a party or witness. For a non-party witness, a subpoena is required. Adequate notice allows opposing counsel to prepare and avoids objections at the deposition. Calendar the deposition with sufficient lead time to comply with the notice requirement.',
          statute: 'Fla. R. Civ. P. 1.310(b)(1)',
          xpValue: 20,
        },
      ],
      qualityRubric: {
        excellent: 'Notice includes Duces Tecum and video recording specification, filed before any defense depositions noticed, 10-day notice requirement met',
        adequate: 'Notice filed with key requirements, deposition scheduled',
        deficient: 'Notice filed after defense depositions noticed, or without Duces Tecum',
      },
    },
  ],

  respond_to_discovery: [
    {
      actionContext: 'Responding to plaintiff\'s discovery requires more than answering questions — it requires protecting your client\'s privileged communications, asserting valid objections, and providing complete responses to legitimate requests.',
      keyStatutes: ['Fla. R. Civ. P. 1.280', 'Fla. R. Civ. P. 1.340', 'Fla. R. Civ. P. 1.370'],
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          question: 'Plaintiff\'s interrogatories include a request for all communications between [DEFENDANT]\'s attorneys and the agency about this case. The correct response is:',
          options: {
            A: 'Produce all documents responsive to the request',
            B: 'Object on attorney-client privilege and work product grounds; provide a privilege log for any withheld documents',
            C: 'Refuse to respond without explanation',
            D: 'Move for a protective order before responding to any discovery',
          },
          correctAnswer: 'B',
          explanation: 'Attorney-client privilege protects confidential communications between attorney and client made for the purpose of obtaining legal advice. The work product doctrine protects materials prepared in anticipation of litigation. When asserting these privileges, you must BOTH object AND provide a privilege log identifying documents withheld (date, author, recipient, general subject matter) so the opposing party can evaluate the claim. Blanket refusals or failure to log are improper and can result in waiver.',
          statute: 'Fla. R. Civ. P. 1.280(b)(5)',
          xpValue: 30,
        },
        {
          id: 'q2',
          type: 'multiple_choice',
          question: 'Plaintiff serves 40 interrogatories on [DEFENDANT]. How many interrogatories is a party entitled to serve without leave of court under Florida Rules?',
          options: {
            A: '25, including subparts',
            B: '30, excluding subparts',
            C: 'Unlimited — no rule limits interrogatory count',
            D: 'There is no limit, but each interrogatory must be answered separately',
          },
          correctAnswer: 'A',
          explanation: 'Florida Rule of Civil Procedure 1.340(a) limits each party to 30 interrogatories including all discrete subparts without leave of court or stipulation of parties. If plaintiff has served 40, you should object to interrogatories in excess of the 30-interrogatory limit and seek a ruling on which 30 must be answered. Do not simply answer all 40 without objection — you waive the limit.',
          statute: 'Fla. R. Civ. P. 1.340(a)',
          xpValue: 25,
        },
      ],
      qualityRubric: {
        excellent: 'All objections properly asserted with privilege log, interrogatory count objection raised if applicable, substantive responses complete and accurate',
        adequate: 'Key objections asserted, substantive responses provided',
        deficient: 'Privilege not asserted, count objection waived, or responses incomplete',
      },
    },
  ],

}
