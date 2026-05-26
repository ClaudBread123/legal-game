import { persist, makeCaseObject, buildCaseAssignedEmail, makeEmailId, buildPromotionUpdate } from '../helpers.js'
import { addBusinessDays } from '../../utils/dateUtils.js'
import { DEFAULT_PROBABILITY } from '../../utils/consequencesEngine.js'
import { EXTENSION_SCENARIOS } from '../../data/extensionRequests.js'

function getFederalDistrict(defendant) {
  if (!defendant) return 'Middle District of Florida'
  const d = defendant.toLowerCase()
  if (d.includes('miami') || d.includes('broward') || d.includes('palm beach') || d.includes('monroe'))
    return 'Southern District of Florida'
  if (d.includes('hillsborough') || d.includes('pinellas') || d.includes('polk') || d.includes('pasco'))
    return 'Middle District of Florida'
  if (d.includes('duval') || d.includes('leon') || d.includes('alachua') || d.includes('escambia'))
    return 'Northern District of Florida'
  return 'Middle District of Florida'
}

export function createCaseSlice(set, get) {
  return {
    addCase(caseObject) {
      const state = get()
      const updated = { cases: [...state.cases, caseObject] }
      set(updated)
      persist({ ...state, ...updated })
    },

    updateCase(caseId, updates) {
      const state = get()
      const updated = {
        cases: state.cases.map(c => (c.caseId === caseId ? { ...c, ...updates } : c)),
      }
      set(updated)
      persist({ ...state, ...updated })
    },

    completeAction(caseId, actionId, qualityScore = 3) {
      const state = get()
      const caseObj = state.cases.find(c => c.caseId === caseId)
      if (!caseObj) return
      const alreadyDone = (caseObj.completedActions || []).includes(actionId)
      if (alreadyDone) return

      const workedIds = state.player.casesWorkedIds || []
      const newCasesWorked = workedIds.includes(caseId)
        ? state.player.casesWorked
        : (state.player.casesWorked || 0) + 1
      const newWorkedIds = workedIds.includes(caseId) ? workedIds : [...workedIds, caseId]

      const updatedPlayer = {
        ...state.player,
        casesWorked: newCasesWorked,
        casesWorkedIds: newWorkedIds,
      }
      const promo = buildPromotionUpdate(updatedPlayer, state.currentDate)

      const healthDelta = qualityScore === 3 ? 3 : qualityScore === 2 ? -3 : -20
      const healthEvent = healthDelta !== 0 ? {
        date: state.currentDate,
        event: `${actionId} — ${qualityScore === 3 ? 'Excellent' : qualityScore === 1 ? 'Deficient' : 'Adequate'} work`,
        impact: healthDelta,
        description: 'Action quality assessment',
        type: healthDelta > 0 ? 'positive' : 'consequence',
      } : null

      const updated = {
        player: promo
          ? { ...updatedPlayer, title: promo.newTitle, salary: promo.newSalary, level: promo.newLevel }
          : updatedPlayer,
        cases: state.cases.map(c =>
          c.caseId === caseId
            ? {
                ...c,
                completedActions: [...(c.completedActions || []), actionId],
                actionTimestamps: {
                  ...(c.actionTimestamps || {}),
                  [actionId]: state.currentDate,
                },
                actionQualityScores: {
                  ...(c.actionQualityScores || {}),
                  [actionId]: qualityScore,
                },
                caseHealth: healthDelta !== 0
                  ? Math.max(0, Math.min(100, (c.caseHealth ?? 100) + healthDelta))
                  : (c.caseHealth ?? 100),
                caseHealthEvents: healthEvent
                  ? [...(c.caseHealthEvents || []), healthEvent]
                  : (c.caseHealthEvents || []),
              }
            : c
        ),
      }

      if (promo) {
        updated.notifications = [promo.promoNotification, ...(state.notifications || [])]
        updated.emails = [promo.promoEmail, ...(state.emails || [])]
      }

      set(updated)
      persist({ ...state, ...updated })
    },

    recordFailedAttempt(caseId, actionId, healthPenalty = -30) {
      const state = get()
      const caseObj = state.cases.find(c => c.caseId === caseId)
      if (!caseObj) return

      const currentAttempts = caseObj.actionAttempts || {}
      const currentCount = currentAttempts[actionId] || 0
      const newCount = currentCount + 1
      const isDoubleFail = newCount >= 2

      const totalHealthDelta = healthPenalty + (isDoubleFail ? -40 : 0)
      const newHealth = Math.max(0, (caseObj.caseHealth ?? 100) + totalHealthDelta)

      const healthEvents = [{
        date: state.currentDate,
        event: `${actionId.replace(/_/g, ' ')} — screened (attempt ${newCount})`,
        impact: healthPenalty,
        description: isDoubleFail ? 'Action locked after repeated failures' : 'Response screened as non-legal content',
        type: 'consequence',
      }]

      if (isDoubleFail) {
        healthEvents.push({
          date: state.currentDate,
          event: `${actionId.replace(/_/g, ' ')} — LOCKED`,
          impact: -40,
          description: 'Action locked due to repeated deficient submissions',
          type: 'consequence',
        })
      }

      const updatedCase = {
        ...caseObj,
        actionAttempts: { ...currentAttempts, [actionId]: newCount },
        lockedActions: isDoubleFail
          ? [...(caseObj.lockedActions || []), actionId]
          : (caseObj.lockedActions || []),
        caseHealth: newHealth,
        caseHealthEvents: [...(caseObj.caseHealthEvents || []), ...healthEvents],
      }

      const newEmails = []
      if (isDoubleFail) {
        newEmails.push({
          id: makeEmailId(),
          timestamp: state.currentDate,
          read: false,
          responded: false,
          from: 'Onier Llopiz',
          fromEmail: 'o.llopiz@llopizwizel.com',
          to: state.player?.name || 'Associate',
          subject: `Immediate Performance Concern — ${caseId}`,
          priority: 'urgent',
          body: `${state.player?.name || 'Associate'},

You have submitted deficient responses on "${actionId.replace(/_/g, ' ')}" for ${caseId} twice. This action has been locked.

This is not acceptable. We will be discussing this matter before you proceed further on this file.

— OL`,
        })
      }

      const updated = {
        cases: state.cases.map(c => c.caseId === caseId ? updatedCase : c),
        emails: [...newEmails, ...(state.emails || [])],
        activityFeed: [
          {
            id: `failed-${Date.now()}`,
            timestamp: state.currentDate,
            message: `${caseId}: ${actionId.replace(/_/g, ' ')} — screened${isDoubleFail ? ' (action locked)' : ''}`,
            type: 'warning',
          },
          ...(state.activityFeed || []),
        ].slice(0, 50),
      }
      set(updated)
      persist({ ...state, ...updated })
    },

    resolveCase(caseId) {
      const state = get()
      const caseObj = state.cases.find(c => c.caseId === caseId)
      const resolution = (state.resolutionQueue || []).find(r => r.caseId === caseId)
      if (!caseObj || !resolution) return

      const closedCase = {
        ...caseObj,
        status: 'closed',
        closedDate: state.currentDate,
        resolutionPath: resolution.resolutionPath,
      }

      const updated = {
        cases: state.cases.map(c => c.caseId === caseId ? closedCase : c),
        resolutionQueue: (state.resolutionQueue || []).filter(r => r.caseId !== caseId),
        closedCases: [...(state.closedCases || []), closedCase],
      }
      set(updated)
      persist({ ...state, ...updated })

      if (resolution.resolutionPath?.xpReward) {
        get().addXP(resolution.resolutionPath.xpReward, `Case resolved — ${resolution.resolutionPath.label} (${caseId})`)
      }
    },

    dismissResolutionModal(caseId) {
      const state = get()
      const updated = {
        resolutionQueue: (state.resolutionQueue || []).filter(r => r.caseId !== caseId),
      }
      set(updated)
      persist({ ...state, ...updated })
    },

    setExpertType(caseId, expertTypeId) {
      const state = get()
      const updated = {
        cases: state.cases.map(c =>
          c.caseId === caseId ? { ...c, selectedExpertType: expertTypeId } : c
        ),
      }
      set(updated)
      persist({ ...state, ...updated })
    },

    setExpertCandidate(caseId, expertId) {
      const state = get()
      const updated = {
        cases: state.cases.map(c =>
          c.caseId === caseId ? { ...c, selectedExpertId: expertId } : c
        ),
      }
      set(updated)
      persist({ ...state, ...updated })
    },

    submitPublicRecordsRequest(caseId, categories) {
      const state = get()
      const responseDate = addBusinessDays(state.currentDate, 10)
      const updated = {
        cases: state.cases.map(c =>
          c.caseId === caseId
            ? {
                ...c,
                publicRecordsRequest: {
                  dateSent: state.currentDate,
                  categories,
                  responseDate,
                  status: 'pending',
                },
              }
            : c
        ),
      }
      set(updated)
      persist({ ...state, ...updated })
    },

    addGeneratedCase(caseObject) {
      const state = get()
      const newCase = makeCaseObject({
        ...caseObject,
        completedActions: [],
        hoursBilled: 0,
        amountBilled: 0,
        estimatedHours: 40 + Math.floor(Math.random() * 20),
        status: 'active',
        caseHealth: 100,
        caseHealthEvents: [],
        caseOutcomeProbability: { ...DEFAULT_PROBABILITY },
        activeConsequences: [],
        consequencesTriggered: [],
        consequenceTimestamps: {},
      })
      const email = buildCaseAssignedEmail(newCase, state.player.name, state.currentDate)
      const updated = {
        cases: [...state.cases, newCase],
        emails: [email, ...(state.emails || [])],
        pendingCaseGeneration: null,
      }
      set(updated)
      persist({ ...state, ...updated })
    },

    clearPendingCaseGeneration() {
      const state = get()
      const updated = { pendingCaseGeneration: null }
      set(updated)
      persist({ ...state, ...updated })
    },

    requestExtension(caseId, extensionScenarioId) {
      const state = get()
      const caseObj = state.cases.find(c => c.caseId === caseId)
      if (!caseObj) return

      const scenario = EXTENSION_SCENARIOS[extensionScenarioId]
      if (!scenario) return

      const granted = Math.random() < scenario.probabilityGranted
      const newHealth = Math.max(0, (caseObj.caseHealth ?? 100) - scenario.healthCost)
      const extensionsRequested = [...(caseObj.extensionsRequested || []), extensionScenarioId]

      const newEmails = []
      let caseUpdates = {
        caseHealth: newHealth,
        extensionsRequested,
        caseHealthEvents: [
          ...(caseObj.caseHealthEvents || []),
          {
            date: state.currentDate,
            event: `Extension requested — ${scenario.label}`,
            impact: -scenario.healthCost,
            description: granted ? 'Extension granted' : 'Extension denied',
            type: 'consequence',
          },
        ],
      }

      if (granted && scenario.deadlineKey) {
        const currentDeadline = caseObj[scenario.deadlineKey] || state.currentDate
        const newDeadline = addBusinessDays(currentDeadline, scenario.daysGranted)
        caseUpdates[scenario.deadlineKey] = newDeadline

        newEmails.push({
          id: makeEmailId(),
          timestamp: state.currentDate,
          read: false,
          responded: false,
          caseId,
          from: scenario.emailTo === 'court' ? 'Clerk of Court' : (caseObj.opposingAttorney?.name || "Plaintiff's Counsel"),
          fromEmail: scenario.emailTo === 'court' ? 'clerk@court.gov' : (caseObj.opposingAttorney?.email || 'counsel@plaintifflaw.com'),
          subject: `Extension Granted — ${scenario.label} (${caseId})`,
          priority: 'normal',
          body: `We confirm that the requested extension has been granted. The deadline for ${scenario.label} has been extended by ${scenario.daysGranted} days to ${newDeadline}.

${scenario.emailTo === 'court' ? 'Clerk of Court' : (caseObj.opposingAttorney?.signatureStyle || "Plaintiff's Counsel")}`,
        })
      } else if (!granted) {
        const attorney = caseObj.opposingAttorney
        newEmails.push({
          id: makeEmailId(),
          timestamp: state.currentDate,
          read: false,
          responded: false,
          caseId,
          from: scenario.emailTo === 'court' ? 'Clerk of Court' : (attorney?.name || "Plaintiff's Counsel"),
          fromEmail: scenario.emailTo === 'court' ? 'clerk@court.gov' : (attorney?.email || 'counsel@plaintifflaw.com'),
          subject: `Extension Denied — ${scenario.label} (${caseId})`,
          priority: 'high',
          body: scenario.deniedTemplate(attorney, caseId),
        })
        caseUpdates = {
          ...caseUpdates,
          caseHealth: Math.max(0, newHealth + (scenario.ifDenied?.healthCost || 0)),
        }
      }

      // Warn after 3+ extensions
      if (extensionsRequested.length >= 3) {
        newEmails.push({
          id: makeEmailId(),
          timestamp: state.currentDate,
          read: false,
          responded: false,
          caseId,
          from: 'Onier Llopiz',
          fromEmail: 'o.llopiz@llopizwizel.com',
          subject: `Excessive Extension Requests — ${caseId}`,
          priority: 'urgent',
          body: `${state.player?.name || 'Associate'},

I have noted that you have now requested ${extensionsRequested.length} extensions on ${caseId}. This is excessive.

Opposing counsel and the court are noting our pattern. Repeated extensions signal a lack of preparation and erode our credibility. Manage your deadlines proactively going forward.

— OL`,
        })
      }

      const activityEntry = {
        id: `ext-${Date.now()}`,
        timestamp: state.currentDate,
        message: `${caseId}: Extension ${granted ? 'granted' : 'denied'} — ${scenario.label}`,
        type: granted ? 'info' : 'warning',
      }

      const updated = {
        cases: state.cases.map(c => c.caseId === caseId ? { ...c, ...caseUpdates } : c),
        emails: [...newEmails, ...(state.emails || [])],
        activityFeed: [activityEntry, ...(state.activityFeed || [])].slice(0, 50),
      }
      set(updated)
      persist({ ...state, ...updated })

      return { granted }
    },

    removeToFederalCourt(caseId) {
      const state = get()
      const caseObj = state.cases.find(c => c.caseId === caseId)
      if (!caseObj) return

      const district = getFederalDistrict(caseObj.defendant)
      const attorney = caseObj.opposingAttorney

      const removalEmail = {
        id: makeEmailId(),
        timestamp: state.currentDate,
        read: false,
        responded: false,
        caseId,
        from: attorney?.name || "Plaintiff's Counsel",
        fromEmail: attorney?.email || 'counsel@plaintifflaw.com',
        subject: `Objection to Notice of Removal — ${caseId}`,
        priority: 'high',
        body: `Counsel,

We have received Defendant's Notice of Removal to the United States District Court for the ${district}. We intend to file a Motion to Remand and contest removal on the grounds that the federal claims are insufficiently pled to establish federal question jurisdiction.

We reserve all rights.

${attorney?.signatureStyle || "Plaintiff's Counsel"}`,
      }

      const updatedProbability = {
        ...(caseObj.caseOutcomeProbability || {}),
        strongWin: Math.min(100, ((caseObj.caseOutcomeProbability?.strongWin) || 20) + 10),
      }

      const activityEntry = {
        id: `removal-${Date.now()}`,
        timestamp: state.currentDate,
        message: `${caseId}: Case removed to federal court — ${district}`,
        type: 'info',
      }

      const healthEvent = {
        date: state.currentDate,
        event: 'Removed to federal court',
        impact: 5,
        description: `Case transferred to ${district} — qualified immunity defenses now available`,
        type: 'positive',
      }

      const updated = {
        cases: state.cases.map(c =>
          c.caseId === caseId
            ? {
                ...c,
                federalCourt: true,
                removalFiled: true,
                removalDate: state.currentDate,
                federalCourtDistrict: district,
                caseOutcomeProbability: updatedProbability,
                caseHealth: Math.min(100, (c.caseHealth ?? 100) + 5),
                caseHealthEvents: [...(c.caseHealthEvents || []), healthEvent],
              }
            : c
        ),
        emails: [removalEmail, ...(state.emails || [])],
        activityFeed: [activityEntry, ...(state.activityFeed || [])].slice(0, 50),
      }
      set(updated)
      persist({ ...state, ...updated })
    },
  }
}
