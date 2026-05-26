import { addBusinessDays } from './dateUtils.js'

export function calculateDeadlines(caseObject) {
  const { dateFiled } = caseObject
  const trialDate = addBusinessDays(dateFiled, 260)
  const deadlines = {
    answerDue: addBusinessDays(dateFiled, 30),
    mtdHearingRecommended: addBusinessDays(dateFiled, 60),
    removalDeadline: addBusinessDays(dateFiled, 30),
    plaintiffExpertDisclosure: addBusinessDays(trialDate, -90),
    defendantExpertDisclosure: addBusinessDays(trialDate, -60),
    discoveryCloses: addBusinessDays(trialDate, -45),
    summaryJudgmentDeadline: addBusinessDays(trialDate, -30),
    mediationDeadline: addBusinessDays(trialDate, -60),
    trialDate,
  }
  if (caseObject.plaintiffDiscoveryResponseDue && !caseObject.plaintiffDiscoveryResponded) {
    deadlines.respondToPlaintiffDiscovery = caseObject.plaintiffDiscoveryResponseDue
  }
  return deadlines
}
