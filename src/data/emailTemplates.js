export const EMAIL_TEMPLATES = {
  case_assigned: ctx => ({
    from: 'Onier Llopiz',
    fromEmail: 'o.llopiz@llopizwizel.com',
    subject: `New Matter Assigned: ${ctx.caseId} — ${ctx.defendant}`,
    body: `${ctx.playerName},

A new matter has been assigned to you: ${ctx.caseId}.

Matter: ${ctx.defendant} (Defense)
Adverse Party: ${ctx.clientName} (Plaintiff)
Case Type: ${ctx.caseType}

I have reviewed the intake file. There are threshold issues that require your immediate attention. Review the complaint carefully before taking any action — the first 30 days on a governmental defense file are critical.

I expect your initial issue analysis on my desk within 48 hours.

— OL`,
    priority: 'high',
  }),

  mtd_hearing_warning: ctx => ({
    from: 'Onier Llopiz',
    fromEmail: 'o.llopiz@llopizwizel.com',
    subject: `URGENT: Set MTD Hearing — ${ctx.caseId}`,
    body: `${ctx.playerName},

I see the motion to dismiss has been filed in ${ctx.caseId} but no hearing has been set. This is a serious problem.

Opposing counsel is watching. If you do not set this hearing immediately with adequate time — at minimum 30 minutes — they will set it for a 5-minute slot. At a 5-minute hearing, your motion will almost certainly be denied regardless of merit.

Set the hearing today. Request a date at least 3 weeks out and no less than 30 minutes. Do not let this slip.

— OL`,
    priority: 'urgent',
  }),

  opposing_sets_hearing: ctx => ({
    from: ctx.opposingCounsel || "Plaintiff's Counsel",
    fromEmail: ctx.opposingEmail || 'counsel@plaintifflaw.com',
    subject: `Re: ${ctx.caseId} — Motion to Dismiss Hearing`,
    body: `Counsel,

Please be advised that I have set the above-referenced Motion to Dismiss for a 5-minute hearing on ${ctx.hearingDate} at 9:00 AM before the Honorable ${ctx.judgeName}.

Please confirm your availability.

${ctx.opposingCounsel || "Plaintiff's Counsel"}`,
    priority: 'urgent',
    requiresResponse: true,
    responseDeadlineGameDays: 2,
    responseOptions: [
      {
        id: 'confirm',
        label: 'Confirm availability',
        text: `Thank you for the notice. We confirm availability for the hearing on ${ctx.hearingDate}.`,
        consequence: null,
        xp: 5,
      },
      {
        id: 'object_time',
        label: 'Object — insufficient hearing time',
        text: 'We object to the 5-minute hearing allocation. The pending Motion to Dismiss raises substantial Florida governmental immunity issues requiring adequate argument time. We will be filing a motion for continuance and requesting a 30-minute hearing slot.',
        consequence: 'mtd_hearing_recovered',
        xp: 25,
        note: 'Correct response. Objecting to inadequate hearing time and seeking 30 minutes is the right move.',
      },
      {
        id: 'ignore',
        label: 'Do not respond',
        text: null,
        consequence: 'mtd_5min_confirmed',
        xp: -15,
        note: 'Failing to respond confirms the 5-minute slot by default.',
      },
    ],
  }),

  depo_sequencing_warning: ctx => ({
    from: 'Onier Llopiz',
    fromEmail: 'o.llopiz@llopizwizel.com',
    subject: `Deposition Sequencing — ${ctx.caseId}`,
    body: `${ctx.playerName},

It has been ${ctx.daysSinceFiling} days since ${ctx.caseId} was filed and you have not yet noticed the plaintiff's deposition. This is a significant strategic error.

We always depose the plaintiff before opposing counsel deposes our client. Always. This is not a preference — it is firm policy and sound litigation strategy.

Notice the plaintiff's deposition immediately.

— OL`,
    priority: 'high',
  }),

  opposing_notices_client_depo: ctx => ({
    from: ctx.opposingCounsel,
    fromEmail: 'counsel@plaintifflaw.com',
    subject: `Notice of Taking Deposition — ${ctx.caseId}`,
    body: `Counsel,

Please take notice that I will take the deposition of your client's representative, ${ctx.clientRepName}, on ${ctx.depoDate} at 10:00 AM at my office.

Please confirm or contact me to reschedule within 5 days.

Regards,
${ctx.opposingCounsel}`,
    priority: 'urgent',
    requiresResponse: true,
    responseDeadlineGameDays: 3,
    responseOptions: [
      {
        id: 'confirm_date',
        label: 'Confirm deposition date',
        text: `We confirm availability for the deposition of our client's representative on ${ctx.depoDate}.`,
        consequence: null,
        xp: 5,
      },
      {
        id: 'reschedule',
        label: 'Request reschedule — conflict',
        text: `We have a scheduling conflict on ${ctx.depoDate}. Please provide three alternative dates and we will confirm promptly.`,
        consequence: null,
        xp: 5,
      },
      {
        id: 'counter_with_plaintiff_depo',
        label: 'Counter — notice plaintiff depo first',
        text: "Before proceeding with the deposition of our client, we intend to complete the deposition of your client. Please provide available dates for plaintiff's deposition. We will coordinate both depositions simultaneously.",
        consequence: 'depo_sequencing_recovered',
        xp: 20,
        note: "Good instinct. Attempting to recover deposition sequencing is the right move, though opposing counsel may not agree.",
      },
    ],
  }),

  discovery_overdue: ctx => ({
    from: 'Onier Llopiz',
    fromEmail: 'o.llopiz@llopizwizel.com',
    subject: `Discovery Status — ${ctx.caseId}`,
    body: `${ctx.playerName},

Where are we on written discovery for ${ctx.caseId}? It has been ${ctx.daysSinceFiling} days since filing and I see no discovery has been served.

Interrogatories, requests for production, and requests for admissions should have gone out within the first 30 days. Requests for admissions in particular are powerful tools in governmental defense — unanswered RFAs are deemed admitted after 30 days, which can significantly limit plaintiff's damages claims.

Get this done.

— OL`,
    priority: 'high',
  }),

  expert_deadline_warning: ctx => ({
    from: 'Onier Llopiz',
    fromEmail: 'o.llopiz@llopizwizel.com',
    subject: `Expert Disclosure Deadline Approaching — ${ctx.caseId}`,
    body: `${ctx.playerName},

The expert disclosure deadline in ${ctx.caseId} is ${ctx.daysUntilDeadline} days away. I do not see a retained expert on file.

Missing expert disclosure is frequently case-dispositive. A motion to exclude a late-disclosed expert is almost always granted. Without an expert, depending on the case type, we may be unable to defend effectively.

Identify and retain an appropriate expert immediately. The retention process takes time — do not wait.

— OL`,
    priority: 'urgent',
  }),

  rfa_deadline_warning: ctx => ({
    from: 'Onier Llopiz',
    fromEmail: 'o.llopiz@llopizwizel.com',
    subject: `RFA Response Deadline — ${ctx.caseId}`,
    body: `${ctx.playerName},

Plaintiff served requests for admissions in ${ctx.caseId}. The 30-day response deadline is ${ctx.daysRemaining} days away.

I cannot stress this enough: do not miss this deadline. Under Florida Rule of Civil Procedure 1.370, unanswered requests for admissions are automatically deemed admitted. Deemed admissions against our client can devastate the defense and are extremely difficult to undo.

Respond immediately.

— OL`,
    priority: 'urgent',
  }),

  promotion: ctx => ({
    from: 'Maria Santos — Firm Administrator',
    fromEmail: 'admin@llopizwizel.com',
    subject: `Congratulations — Promotion to ${ctx.newTitle}`,
    body: `Dear ${ctx.playerName},

On behalf of Llopiz Wizel LLP, I am pleased to confirm your promotion to ${ctx.newTitle}, effective ${ctx.effectiveDate}.

Your new base salary is $${ctx.newSalary.toLocaleString()} per year.

Your performance on threshold issue identification and aggressive litigation management has been noted. The firm expects continued excellence at your new level.

Please see me regarding updated billing rate and assignment protocols.

Congratulations.

Maria Santos
Firm Administrator
Llopiz Wizel LLP`,
    priority: 'normal',
  }),

  timekeeping_delinquent: ctx => ({
    from: 'Maria Santos — Firm Administrator',
    fromEmail: 'admin@llopizwizel.com',
    subject: 'Timekeeping Delinquency Notice',
    body: `${ctx.playerName},

Your timekeeping has not been submitted for ${ctx.daysDelinquent} consecutive business days. This is a firm policy violation.

All associates are required to submit daily timekeeping by 6:00 PM each business day. Delinquency affects client billing, firm cash flow, and your quarterly performance review.

Please submit all outstanding time entries immediately.

This has been noted in your file.

Maria Santos
Firm Administrator`,
    priority: 'high',
  }),

  monthly_performance_low: ctx => ({
    from: 'Onier Llopiz',
    fromEmail: 'o.llopiz@llopizwizel.com',
    subject: `Monthly Billable Hours — ${ctx.month}`,
    body: `${ctx.playerName},

Your billable hours for ${ctx.month} came in at ${ctx.hours} hours — below the firm minimum of 165.

The target range is 165–200 hours per month. Falling below 165 hours consistently will affect your standing at the firm and your eligibility for merit increases.

I want to see improvement next month.

— OL`,
    priority: 'high',
  }),

  monthly_performance_good: ctx => ({
    from: 'Onier Llopiz',
    fromEmail: 'o.llopiz@llopizwizel.com',
    subject: `Monthly Performance — ${ctx.month}`,
    body: `${ctx.playerName},

${ctx.hours} billable hours for ${ctx.month}. That is within our target range. Keep it up.

— OL`,
    priority: 'normal',
  }),

  mtd_denied_consequence: ctx => ({
    from: 'Onier Llopiz',
    fromEmail: 'o.llopiz@llopizwizel.com',
    subject: `Motion to Dismiss Denied — ${ctx.caseId}`,
    body: `${ctx.playerName},

The Motion to Dismiss in ${ctx.caseId} was denied. I have reviewed the hearing record.

The motion was set for a 5-minute hearing slot — that is not enough time to argue threshold governmental immunity issues. This case needed at minimum 30 minutes before the judge. A 5-minute slot on a motion to dismiss in a governmental tort case is essentially a denial waiting to happen.

The grounds we raised are not gone entirely — some can be renewed at summary judgment. But we have lost the early exit opportunity, and the client will pay for full discovery as a result.

Case health is now significantly compromised. I want a revised litigation plan on my desk immediately.

— OL`,
    priority: 'urgent',
  }),

  expert_excluded_consequence: ctx => ({
    from: 'Onier Llopiz',
    fromEmail: 'o.llopiz@llopizwizel.com',
    subject: `URGENT: Expert Excluded — ${ctx.caseId}`,
    body: `${ctx.playerName},

Plaintiff's motion to exclude our expert in ${ctx.caseId} was granted. The expert disclosure deadline passed without a timely disclosure. The court had no choice but to grant the motion.

This is a serious, potentially case-dispositive error. Proceeding to summary judgment or trial without expert testimony in this type of case is extremely difficult.

I need to meet with you today. This needs to be reported to the client immediately.

— OL`,
    priority: 'urgent',
  }),

  rfa_deemed_consequence: ctx => ({
    from: 'Onier Llopiz',
    fromEmail: 'o.llopiz@llopizwizel.com',
    subject: `RFAs Deemed Admitted — ${ctx.caseId}`,
    body: `${ctx.playerName},

I have just been informed that plaintiff's Requests for Admissions in ${ctx.caseId} were not answered within 30 days. They are now deemed admitted under Rule 1.370.

Do you understand what this means? Plaintiff has now established — by our own silence — facts that support their case. We can file a motion for relief from the admissions but courts grant those sparingly and only on a showing of good cause.

This is the kind of error that ends careers. I am scheduling an immediate case review.

— OL`,
    priority: 'urgent',
  }),

  removal_waived_consequence: ctx => ({
    from: 'Onier Llopiz',
    fromEmail: 'o.llopiz@llopizwizel.com',
    subject: `Federal Removal Deadline Passed — ${ctx.caseId}`,
    body: `${ctx.playerName},

The 30-day window to remove ${ctx.caseId} to federal district court has closed. I see no Notice of Removal in the file.

This case contains claims under 42 U.S.C. §1983. Federal court was the correct venue — qualified immunity arguments, Eleventh Amendment considerations, and a more favorable procedural environment are now unavailable to us.

We are now committed to state court. Adjust the litigation strategy accordingly. I want to discuss this at your earliest availability.

— OL`,
    priority: 'high',
  }),

  initial_eval_overdue: ctx => ({
    from: 'Maria Wizel',
    fromEmail: 'm.wizel@llopizwizel.com',
    subject: `Initial Evaluation Overdue — ${ctx.caseId}`,
    body: `${ctx.playerName},

I am following up on ${ctx.caseId}. The client and carrier have not received an initial liability evaluation and litigation budget. We are past 30 days on this file.

The initial evaluation is not optional — it is a standard deliverable on every new matter. The carrier needs it to set reserves. The client needs it to understand their exposure.

Please submit your evaluation today. If you have questions on the format, see the office litigation manual.

— MW`,
    priority: 'high',
  }),

  preservation_missed: ctx => ({
    from: 'Onier Llopiz',
    fromEmail: 'o.llopiz@llopizwizel.com',
    subject: `No Preservation Letter Sent — ${ctx.caseId}`,
    body: `${ctx.playerName},

I reviewed the file in ${ctx.caseId} and I do not see a preservation letter sent to plaintiff's counsel.

We are now three weeks into this matter. Every day without a preservation demand is a day where plaintiff can delete text messages, post and remove social media, discard clothing and shoes, and allow surveillance footage to be overwritten — all without consequence to them.

A spoliation argument requires a prior preservation demand. We no longer have a clean record on that.

Send the preservation letter today. Document everything you have already found before anything else disappears.

— OL`,
    priority: 'high',
  }),
}
