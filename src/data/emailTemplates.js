export const EMAIL_TEMPLATES = {
  case_assigned: ctx => ({
    from: 'Rafael Llopiz',
    fromEmail: 'r.llopiz@llopizwizel.com',
    subject: `New Matter Assigned: ${ctx.caseId} — ${ctx.defendant}`,
    body: `${ctx.playerName},

A new matter has been assigned to you: ${ctx.caseId}.

Client: ${ctx.clientName}
Adverse Party: ${ctx.defendant}
Case Type: ${ctx.caseType}

I have reviewed the intake file. There are threshold issues that require your immediate attention. Review the complaint carefully before taking any action — the first 30 days on a governmental defense file are critical.

I expect your initial issue analysis on my desk within 48 hours.

— RL`,
    priority: 'high',
  }),

  mtd_hearing_warning: ctx => ({
    from: 'Rafael Llopiz',
    fromEmail: 'r.llopiz@llopizwizel.com',
    subject: `URGENT: Set MTD Hearing — ${ctx.caseId}`,
    body: `${ctx.playerName},

I see the motion to dismiss has been filed in ${ctx.caseId} but no hearing has been set. This is a serious problem.

Opposing counsel is watching. If you do not set this hearing immediately with adequate time — at minimum 30 minutes — they will set it for a 5-minute slot. At a 5-minute hearing, your motion will almost certainly be denied regardless of merit.

Set the hearing today. Request a date at least 3 weeks out and no less than 30 minutes. Do not let this slip.

— RL`,
    priority: 'urgent',
  }),

  opposing_sets_hearing: ctx => ({
    from: ctx.opposingCounsel,
    fromEmail: 'counsel@plaintifflaw.com',
    subject: `Re: ${ctx.caseId} — Motion to Dismiss Hearing`,
    body: `Counsel,

Please be advised that I have set the above-referenced Motion to Dismiss for a 5-minute hearing on ${ctx.hearingDate} at 9:00 AM before the Honorable ${ctx.judgeName}.

Please confirm your availability.

Regards,
${ctx.opposingCounsel}
Plaintiff's Counsel`,
    priority: 'urgent',
  }),

  depo_sequencing_warning: ctx => ({
    from: 'Rafael Llopiz',
    fromEmail: 'r.llopiz@llopizwizel.com',
    subject: `Deposition Sequencing — ${ctx.caseId}`,
    body: `${ctx.playerName},

It has been ${ctx.daysSinceFiling} days since ${ctx.caseId} was filed and you have not yet noticed the plaintiff's deposition. This is a significant strategic error.

We always depose the plaintiff before opposing counsel deposes our client. Always. This is not a preference — it is firm policy and sound litigation strategy.

Notice the plaintiff's deposition immediately.

— RL`,
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
  }),

  discovery_overdue: ctx => ({
    from: 'Rafael Llopiz',
    fromEmail: 'r.llopiz@llopizwizel.com',
    subject: `Discovery Status — ${ctx.caseId}`,
    body: `${ctx.playerName},

Where are we on written discovery for ${ctx.caseId}? It has been ${ctx.daysSinceFiling} days since filing and I see no discovery has been served.

Interrogatories, requests for production, and requests for admissions should have gone out within the first 30 days. Requests for admissions in particular are powerful tools in governmental defense — unanswered RFAs are deemed admitted after 30 days, which can significantly limit plaintiff's damages claims.

Get this done.

— RL`,
    priority: 'high',
  }),

  expert_deadline_warning: ctx => ({
    from: 'Rafael Llopiz',
    fromEmail: 'r.llopiz@llopizwizel.com',
    subject: `Expert Disclosure Deadline Approaching — ${ctx.caseId}`,
    body: `${ctx.playerName},

The expert disclosure deadline in ${ctx.caseId} is ${ctx.daysUntilDeadline} days away. I do not see a retained expert on file.

Missing expert disclosure is frequently case-dispositive. A motion to exclude a late-disclosed expert is almost always granted. Without an expert, depending on the case type, we may be unable to defend effectively.

Identify and retain an appropriate expert immediately. The retention process takes time — do not wait.

— RL`,
    priority: 'urgent',
  }),

  rfa_deadline_warning: ctx => ({
    from: 'Rafael Llopiz',
    fromEmail: 'r.llopiz@llopizwizel.com',
    subject: `RFA Response Deadline — ${ctx.caseId}`,
    body: `${ctx.playerName},

Plaintiff served requests for admissions in ${ctx.caseId}. The 30-day response deadline is ${ctx.daysRemaining} days away.

I cannot stress this enough: do not miss this deadline. Under Florida Rule of Civil Procedure 1.370, unanswered requests for admissions are automatically deemed admitted. Deemed admissions against our client can devastate the defense and are extremely difficult to undo.

Respond immediately.

— RL`,
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
    from: 'Rafael Llopiz',
    fromEmail: 'r.llopiz@llopizwizel.com',
    subject: `Monthly Billable Hours — ${ctx.month}`,
    body: `${ctx.playerName},

Your billable hours for ${ctx.month} came in at ${ctx.hours} hours — below the firm minimum of 165.

The target range is 165–200 hours per month. Falling below 165 hours consistently will affect your standing at the firm and your eligibility for merit increases.

I want to see improvement next month.

— RL`,
    priority: 'high',
  }),

  monthly_performance_good: ctx => ({
    from: 'Rafael Llopiz',
    fromEmail: 'r.llopiz@llopizwizel.com',
    subject: `Monthly Performance — ${ctx.month}`,
    body: `${ctx.playerName},

${ctx.hours} billable hours for ${ctx.month}. That is within our target range. Keep it up.

— RL`,
    priority: 'normal',
  }),

  mtd_denied_consequence: ctx => ({
    from: 'Rafael Llopiz',
    fromEmail: 'r.llopiz@llopizwizel.com',
    subject: `Motion to Dismiss Denied — ${ctx.caseId}`,
    body: `${ctx.playerName},

The Motion to Dismiss in ${ctx.caseId} was denied. I have reviewed the hearing record.

The motion was set for a 5-minute hearing slot — that is not enough time to argue threshold governmental immunity issues. This case needed at minimum 30 minutes before the judge. A 5-minute slot on a motion to dismiss in a governmental tort case is essentially a denial waiting to happen.

The grounds we raised are not gone entirely — some can be renewed at summary judgment. But we have lost the early exit opportunity, and the client will pay for full discovery as a result.

Case health is now significantly compromised. I want a revised litigation plan on my desk immediately.

— RL`,
    priority: 'urgent',
  }),

  expert_excluded_consequence: ctx => ({
    from: 'Rafael Llopiz',
    fromEmail: 'r.llopiz@llopizwizel.com',
    subject: `URGENT: Expert Excluded — ${ctx.caseId}`,
    body: `${ctx.playerName},

Plaintiff's motion to exclude our expert in ${ctx.caseId} was granted. The expert disclosure deadline passed without a timely disclosure. The court had no choice but to grant the motion.

This is a serious, potentially case-dispositive error. Proceeding to summary judgment or trial without expert testimony in this type of case is extremely difficult.

I need to meet with you today. This needs to be reported to the client immediately.

— RL`,
    priority: 'urgent',
  }),

  rfa_deemed_consequence: ctx => ({
    from: 'Rafael Llopiz',
    fromEmail: 'r.llopiz@llopizwizel.com',
    subject: `RFAs Deemed Admitted — ${ctx.caseId}`,
    body: `${ctx.playerName},

I have just been informed that plaintiff's Requests for Admissions in ${ctx.caseId} were not answered within 30 days. They are now deemed admitted under Rule 1.370.

Do you understand what this means? Plaintiff has now established — by our own silence — facts that support their case. We can file a motion for relief from the admissions but courts grant those sparingly and only on a showing of good cause.

This is the kind of error that ends careers. I am scheduling an immediate case review.

— RL`,
    priority: 'urgent',
  }),

  removal_waived_consequence: ctx => ({
    from: 'Rafael Llopiz',
    fromEmail: 'r.llopiz@llopizwizel.com',
    subject: `Federal Removal Deadline Passed — ${ctx.caseId}`,
    body: `${ctx.playerName},

The 30-day window to remove ${ctx.caseId} to federal district court has closed. I see no Notice of Removal in the file.

This case contains claims under 42 U.S.C. §1983. Federal court was the correct venue — qualified immunity arguments, Eleventh Amendment considerations, and a more favorable procedural environment are now unavailable to us.

We are now committed to state court. Adjust the litigation strategy accordingly. I want to discuss this at your earliest availability.

— RL`,
    priority: 'high',
  }),
}
