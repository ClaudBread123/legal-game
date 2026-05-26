export const EXTENSION_SCENARIOS = {

  respond_to_discovery: {
    label: 'Request Extension — Discovery Responses',
    deadlineKey: 'respondToPlaintiffDiscovery',
    emailTo: 'opposing counsel',
    daysGranted: 14,
    healthCost: 5,
    probabilityGranted: 0.85,
    emailTemplate: (attorney, caseId) => `Counsel,

Due to the volume of responsive documents and our client's scheduling constraints, we respectfully request a 14-day extension to respond to Plaintiff's discovery requests in the above-referenced matter.

Please advise if you are agreeable to this accommodation.

Defense Counsel`,
    deniedTemplate: (attorney, caseId) => `Counsel,

We are unwilling to agree to an extension of the discovery response deadline in ${caseId}. You must respond by the original deadline.

${attorney?.signatureStyle || "Plaintiff's Counsel"}`,
    ifDenied: {
      healthCost: 0,
      note: 'Opposing counsel has denied the extension request. You must respond by the original deadline.',
    },
  },

  notice_mtd_hearing: {
    label: 'Request Additional Time — MTD Hearing',
    deadlineKey: 'mtdHearingRecommended',
    emailTo: 'court',
    daysGranted: 21,
    healthCost: 8,
    probabilityGranted: 0.70,
    emailTemplate: (attorney, caseId) => `Your Honor,

Defendant respectfully requests additional time to set the pending Motion to Dismiss for hearing in ${caseId}. Counsel requires time to coordinate scheduling with the client and identify available hearing dates consistent with the Court's calendar.

Defendant requests a 21-day extension of the recommended hearing deadline.

Respectfully submitted,
Defense Counsel`,
    deniedTemplate: (attorney, caseId) => `Re: ${caseId} — Extension Denied

Counsel,

The Court has denied your request for additional time to set the Motion to Dismiss hearing. The hearing must be set within the original timeframe.

Clerk of Court`,
    ifDenied: {
      healthCost: 0,
      note: 'Extension denied. You must set the MTD hearing within the original timeline.',
    },
  },

  file_mtd_reply: {
    label: 'Request Extension — Reply to Opposition',
    deadlineKey: null,
    emailTo: 'opposing counsel',
    daysGranted: 7,
    healthCost: 3,
    probabilityGranted: 0.90,
    emailTemplate: (attorney, caseId) => `Counsel,

We are in receipt of Plaintiff's Opposition to our Motion to Dismiss in ${caseId}. Due to competing trial obligations, we request a brief 7-day extension to file our Reply Memorandum.

Please confirm your agreement.

Defense Counsel`,
    deniedTemplate: (attorney, caseId) => `Counsel,

We are unwilling to agree to an extension of the reply deadline in ${caseId}. Please file your reply by the original deadline.

${attorney?.signatureStyle || "Plaintiff's Counsel"}`,
    ifDenied: {
      healthCost: 0,
      note: 'Opposing counsel denied the extension. File the reply by the original deadline.',
    },
  },
}

export const DEADLINE_KEY_TO_EXTENSION = {
  respondToPlaintiffDiscovery: 'respond_to_discovery',
  mtdHearingRecommended: 'notice_mtd_hearing',
}
