import { persist, makeCaseObject, buildCaseAssignedEmail, makeEmailId, buildPromotionUpdate } from '../helpers.js'
import { addBusinessDays } from '../../utils/dateUtils.js'
import { DEFAULT_PROBABILITY } from '../../utils/consequencesEngine.js'

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
  }
}
