import { create } from 'zustand'
import { getNextFallbackCase } from '../data/fallbackCases.js'
import { generateCase, generateComplaintDocument } from '../api/caseGenerator.js'
import { shouldTriggerResolution, determineResolutionPath } from '../utils/caseResolution.js'
import { getSimulatedStartDate, advanceBusinessDay, daysBetween } from '../utils/dateUtils.js'
import { checkAndGenerateEmails } from '../utils/emailEngine.js'
import { evaluateConsequences } from '../utils/consequencesEngine.js'
import { runAdversarialEvents } from '../utils/adversarialEngine.js'
import { isApiAvailable, testApiConnection } from '../api/anthropicProxy.js'
import { generatePublicRecordsResponse } from '../data/publicRecordsData.js'
import { createPlayerSlice } from './slices/playerSlice.js'
import { createCaseSlice } from './slices/caseSlice.js'
import { createEmailSlice } from './slices/emailSlice.js'
import { createUiSlice } from './slices/uiSlice.js'
import { createTimekeepingSlice } from './slices/timekeepingSlice.js'
import {
  SAVE_KEY,
  loadSaved,
  checkAndClearStale,
  defaultState,
  defaultPlayer,
  CASE_GENERATION_SCHEDULE,
  persist,
  makeEmailId,
  buildWelcomeEmails,
  makeCaseObject,
  buildCaseAssignedEmail,
  buildPromotionUpdate,
  getDailyActionsForTitle,
} from './helpers.js'

export function getCaseParties(caseObject) {
  return {
    ourClient: caseObject?.defendant,
    adverseParty: caseObject?.clientName,
    ourRole: 'Defense Counsel',
    adverseRole: 'Plaintiff',
  }
}

const saved = loadSaved()
const staleGameCleared = !saved && checkAndClearStale()
const initialState = saved
  ? { ...defaultState, ...saved, staleGameCleared: false }
  : { ...defaultState, staleGameCleared }

export const useGameStore = create((set, get) => ({
  // Compose slices (actions; state defaults will be overridden by initialState below)
  ...createPlayerSlice(set, get),
  ...createCaseSlice(set, get),
  ...createEmailSlice(set, get),
  ...createUiSlice(set, get),
  ...createTimekeepingSlice(set, get),

  // Initial state (saved game or defaults — overrides any slice-level defaults)
  ...initialState,

  // ── Game-level actions ──────────────────────────────────

  async initGame(playerName) {
    console.log('=== initGame START ===', playerName)
    console.log('Proxy URL configured:', !!import.meta.env.VITE_API_PROXY_URL)
    const startDate = getSimulatedStartDate()
    const welcomeEmails = buildWelcomeEmails(playerName, startDate)

    const baseState = {
      ...defaultState,
      player: { ...defaultPlayer, name: playerName || 'Associate' },
      cases: [],
      pendingCases: [],
      gameStarted: false,
      isGeneratingCase: true,
      currentDate: startDate,
      dailyActionsRemaining: 4,
      dailyActionsTotal: 4,
      activityFeed: [{
        id: Date.now().toString(),
        timestamp: startDate,
        message: `Welcome to Llopiz Wizel LLP, ${playerName}. Your first matter is being prepared.`,
        type: 'action',
      }],
      emails: welcomeEmails,
      generatedEmailEvents: [],
      staleGameCleared: false,
      saveVersion: 'v3',
    }
    set(baseState)
    persist(baseState)

    const apiCheck = await get().checkApiStatus()
    console.log('API check result:', apiCheck)
    if (!apiCheck.success) {
      console.warn('API offline — will use fallback cases')
    }

    console.log('=== Starting case generation ===')
    let case1
    try {
      console.log('initGame: generating Case 1 via API')
      const rawCase1 = await generateCase({
        caseType: 'state_tort',
        playerLevel: 1,
        currentDate: startDate,
        constraints: {
          mustInclude: ['barred_individual_defendant', 'insufficient_presuit_notice'],
          difficulty: 1,
          instruction: `Generate a unique Florida governmental defense tort case for a junior associate's first assignment.

MANDATORY REQUIREMENTS:
- Defendant must be a Florida city, county, or special district
- Must include an individual employee named as a defendant whose claim is barred by §768.28(9) Florida Statutes
- Must include a pre-suit notice issue under §768.28(6)
- Fact scenario must be 3-5 sentences
- Must feel realistic to Florida practice

ABSOLUTE PROHIBITION — NEVER USE ANY OF THESE:
- Palmetto Shores or any variation
- Marcus Delray or any variation
- Riverside Park
- Officer Dana Whitmore
- Negligent security at a park
- Suncoast Charter Academy
- Priya Nambiar
- Broward County School Board
- Terrence Washington
- Cypress Ridge High School
- Horizon Academy
- Any employment case
- Any whistle-blower or retaliation case
- Any wrongful termination case
- Any school board defendant

You MUST generate a state tort case involving a Florida city or county municipality (NOT a school board) where the plaintiff was physically injured by a condition or act — a vehicle accident, slip and fall, premises defect, building failure, or similar. The plaintiff must be a private individual injured by a physical event.`,
        },
      })
      case1 = makeCaseObject({
        ...rawCase1,
        completedActions: [],
        hoursBilled: 0,
        amountBilled: 0,
        estimatedHours: 40 + Math.floor(Math.random() * 20),
        status: 'active',
      })
      console.log('=== Case 1 generated ===', 'caseId:', case1.caseId, '| Is fallback:', false)
    } catch (err) {
      console.error('initGame: Case 1 generation failed', err?.message)
      case1 = makeCaseObject(getNextFallbackCase([]))
      console.log('=== Case 1 generated ===', 'caseId:', case1.caseId, '| Is fallback:', true)
    }

    const case1Email = buildCaseAssignedEmail(case1, playerName, startDate)

    const stateWithCase = {
      cases: [case1],
      emails: [case1Email, ...welcomeEmails],
      generatedEmailEvents: [`case_assigned_${case1.caseId}`],
      gameStarted: true,
      isGeneratingCase: false,
    }
    set(stateWithCase)
    persist({ ...baseState, ...stateWithCase })

    get().logActivity(
      `Welcome to Llopiz Wizel LLP, ${playerName}. Your caseload has been assigned.`,
      'info'
    )

    generateComplaintDocument(case1).then(doc => {
      const s = get()
      const upd = { cases: s.cases.map(c => c.caseId === case1.caseId ? { ...c, complaintDocument: doc } : c) }
      set(upd)
      persist({ ...s, ...upd })
    }).catch(() => {})

    const case2Type = Math.random() > 0.5 ? 'section_1983' : 'employment'
    generateCase({
      caseType: case2Type,
      playerLevel: 1,
      currentDate: startDate,
      existingCases: [case1],
      constraints: {
        mustInclude: case2Type === 'section_1983' ? ['federal_removal_1983'] : ['admin_exhaustion'],
        difficulty: 1,
        instruction: `Generate the second case for a new associate. This case should introduce federal jurisdiction concepts. It must include a §1983 federal civil rights claim that creates a removal trigger with a 30-day deadline. The defendant should be a charter school or school board. Use a completely different incident type, defendant name, and plaintiff from case ${case1.caseId} (${case1.defendant}).`,
      },
    }).then(rawCase2 => {
      console.log('initGame: Case 2 generated', rawCase2.caseId)
      const case2 = makeCaseObject({
        ...rawCase2,
        completedActions: [],
        hoursBilled: 0,
        amountBilled: 0,
        estimatedHours: 40 + Math.floor(Math.random() * 20),
        status: 'active',
      })
      const state = get()
      const update = { pendingCases: [...(state.pendingCases || []), case2] }
      set(update)
      persist({ ...state, ...update })
    }).catch(err => {
      console.error('initGame: Case 2 generation failed', err?.message)
      const fallback2 = makeCaseObject(getNextFallbackCase([case1.caseId]))
      const state = get()
      const update = { pendingCases: [...(state.pendingCases || []), fallback2] }
      set(update)
      persist({ ...state, ...update })
    })
  },

  advanceDay() {
    const state = get()
    const nextDate = advanceBusinessDay(state.currentDate)
    const newTotalGameDays = (state.player.totalGameDays || 0) + 1
    const stateWithNextDate = { ...state, currentDate: nextDate }

    // Deliver pending emails queued from previous day (manual reply opposing responses)
    const deliveredPendingEmails = (state.pendingEmails || []).map(e => ({ ...e, to: state.player.name }))

    const newEmailResults = checkAndGenerateEmails(state)
    const newEmails = newEmailResults.filter(r => r.email).map(r => ({ ...r.email, to: state.player.name }))
    const newEventKeys = newEmailResults.map(r => r.key)

    const emailCaseUpdates = {}
    for (const r of newEmailResults) {
      if (r.caseUpdates && r.caseId) {
        emailCaseUpdates[r.caseId] = { ...(emailCaseUpdates[r.caseId] || {}), ...r.caseUpdates }
      }
    }

    const consequenceResult = evaluateConsequences(stateWithNextDate)
    const consequenceEmails = consequenceResult.newEmails.map(e => ({ ...e, to: state.player.name }))

    const newNotifications = [...consequenceResult.newNotifications]
    consequenceResult.updatedCases.forEach(c => {
      const daysSinceFiled = Math.round(
        (new Date(nextDate) - new Date(c.dateFiled)) / (1000 * 60 * 60 * 24)
      )
      if (daysSinceFiled === 30 && !c.completedActions?.includes('motion_to_dismiss')) {
        newNotifications.push({
          id: `${c.caseId}-mtd-${Date.now()}`,
          message: `${c.caseId}: Answer/MTD deadline approaching (Day 30). File your motion to dismiss immediately.`,
          read: false,
          type: 'warning',
          caseId: c.caseId,
        })
      }
    })

    let activeCases = consequenceResult.updatedCases.map(c =>
      emailCaseUpdates[c.caseId] ? { ...c, ...emailCaseUpdates[c.caseId] } : c
    )

    // Run adversarial events against the updated state
    const adversarialState = { ...stateWithNextDate, cases: activeCases }
    const adversarialResults = runAdversarialEvents(adversarialState)
    const adversarialEmails = adversarialResults.newEmails.map(r => ({ ...r.email, to: state.player.name }))
    newNotifications.push(...adversarialResults.newNotifications)
    // Apply adversarial case health updates
    activeCases = activeCases.map(c => {
      const adv = adversarialResults.caseUpdates[c.caseId]
      return adv ? { ...c, ...adv } : c
    })

    let pendingCases = state.pendingCases || []
    const assignmentEmails = []
    const assignmentActivity = []

    if (newTotalGameDays === 8 && pendingCases.length > 0) {
      const newCase = pendingCases[0]
      activeCases = [...activeCases, newCase]
      pendingCases = pendingCases.slice(1)

      assignmentEmails.push(buildCaseAssignedEmail(newCase, state.player.name, nextDate))
      newNotifications.push({
        id: `case-assigned-${Date.now()}`,
        message: `New matter assigned: ${newCase.caseId} — ${newCase.defendant}`,
        read: false,
        type: 'info',
        caseId: newCase.caseId,
      })
      assignmentActivity.push({
        id: `case-assign-${Date.now()}`,
        timestamp: nextDate,
        message: `New matter assigned: ${newCase.caseId} — ${newCase.defendant}`,
        type: 'action',
      })
    }

    const publicRecordsEmails = []
    activeCases = activeCases.map(c => {
      const req = c.publicRecordsRequest
      if (!req || req.status !== 'pending') return c
      if (nextDate < req.responseDate) return c

      const response = generatePublicRecordsResponse(req.categories || [], c)
      const newHealth = Math.max(0, Math.min(100, (c.caseHealth ?? 100) + response.healthDelta))

      const recordLines = response.records.map(r =>
        `• ${r.description}${r.note ? `\n  → ${r.note}` : ''}`
      ).join('\n')

      let body = `Re: Public Records Request — ${c.caseId}\n\n`
      body += `${response.summary}\n\n`
      if (response.type === 'partial' && response.records.length > 0) {
        body += `Records produced:\n\n${recordLines}\n\n`
      }
      if (response.educationalNote) {
        body += `Note: ${response.educationalNote}\n\n`
      }
      body += `Please review and advise on follow-up actions needed.`

      publicRecordsEmails.push({
        id: makeEmailId(),
        timestamp: nextDate,
        read: false,
        responded: false,
        caseId: c.caseId,
        from: `Records Unit, ${c.defendant}`,
        fromEmail: 'records@govt.local',
        subject: `Public Records Response — ${c.caseId}`,
        priority: response.type === 'denied' ? 'high' : 'normal',
        body,
      })

      return {
        ...c,
        caseHealth: newHealth,
        publicRecordsRequest: { ...req, status: 'responded', responseType: response.type },
        caseHealthEvents: [
          ...(c.caseHealthEvents || []),
          ...(response.healthDelta !== 0 ? [{
            date: nextDate,
            event: 'Public Records Response',
            impact: response.healthDelta,
            description: response.summary,
            type: response.healthDelta >= 0 ? 'positive' : 'consequence',
          }] : []),
        ],
      }
    })

    const pendingResolutions = []
    // Add adversarial resolution items (e.g., MTD granted by court)
    for (const item of adversarialResults.newResolutionItems || []) {
      pendingResolutions.push({ caseId: item.caseId, resolutionPath: item.resolutionPath })
      activeCases = activeCases.map(c =>
        c.caseId === item.caseId ? { ...c, resolutionTriggered: true } : c
      )
    }
    activeCases = activeCases.map(c => {
      if (c.status === 'closed' || c.resolutionTriggered) return c
      if (shouldTriggerResolution(c, nextDate)) {
        const resolutionPath = determineResolutionPath(c)
        pendingResolutions.push({ caseId: c.caseId, resolutionPath })
        return { ...c, resolutionTriggered: true }
      }
      return c
    })

    const overdueResponseEmails = []
    const currentEmails = state.emails || []
    const updatedStoredEmails = currentEmails.map(email => {
      if (!email.requiresResponse || email.responded || email.responseOverdue) return email
      const daysSince = daysBetween(email.timestamp, nextDate)
      if (daysSince < (email.responseDeadlineGameDays || 2)) return email

      const worstOption = (email.responseOptions || []).find(o => o.xp < 0)
      overdueResponseEmails.push({
        id: makeEmailId(),
        timestamp: nextDate,
        read: false,
        responded: false,
        caseId: email.caseId,
        from: 'Onier Llopiz',
        fromEmail: 'o.llopiz@llopizwizel.com',
        subject: `Response Overdue — ${email.subject}`,
        priority: 'urgent',
        body: `${state.player?.name || 'Associate'},

You failed to respond to "${email.subject}" within the required timeframe. ${worstOption ? 'The default worst outcome has been applied.' : ''}

Timely responses to opposing counsel and court notices are not optional. This has been noted in your file.

— OL`,
      })

      newNotifications.push({
        id: `email-overdue-${email.id}-${Date.now()}`,
        message: `Response overdue: "${email.subject}"`,
        read: false,
        type: 'warning',
        caseId: email.caseId,
      })

      return { ...email, responseOverdue: true }
    })

    const updatedPlayerAfterDay = { ...state.player, totalGameDays: newTotalGameDays }
    const promo = buildPromotionUpdate(updatedPlayerAfterDay, nextDate)
    if (promo) {
      newNotifications.push(promo.promoNotification)
      assignmentEmails.push(promo.promoEmail)
    }

    const finalPlayer = promo
      ? { ...updatedPlayerAfterDay, title: promo.newTitle, salary: promo.newSalary, level: promo.newLevel }
      : updatedPlayerAfterDay

    const dailyActions = getDailyActionsForTitle(finalPlayer.title)

    const scheduleEntry = CASE_GENERATION_SCHEDULE.find(s => s.day === newTotalGameDays)
    let pendingCaseGeneration = state.pendingCaseGeneration || null
    if (scheduleEntry && !pendingCaseGeneration) {
      pendingCaseGeneration = { caseType: scheduleEntry.caseType, day: newTotalGameDays }
    }

    if (!pendingCaseGeneration && newTotalGameDays >= 30) {
      const activeCount = activeCases.filter(c => c.status === 'active').length
      const allAnalyzed = activeCases.every(c => c.issueAnalysisSubmitted === true)
      if (allAnalyzed && activeCount < 3) {
        const pLevel = finalPlayer.level || 1
        const organicType = pLevel >= 3
          ? ['state_tort', 'section_1983', 'employment'][Math.floor(Math.random() * 3)]
          : ['state_tort', 'employment'][Math.floor(Math.random() * 2)]
        pendingCaseGeneration = { caseType: organicType, day: newTotalGameDays, organic: true }
      }
    }

    const dayToast = { id: `day-${nextDate}`, message: `${nextDate} — ${dailyActions} actions available`, type: 'info', duration: 2500, createdAt: Date.now() }
    const newToasts = [...(state.toasts || []).filter(t => t.type !== 'info' || !t.id?.startsWith('day-')), dayToast]

    const updated = {
      currentDate: nextDate,
      cases: activeCases,
      pendingCases,
      player: finalPlayer,
      dailyActionsRemaining: dailyActions,
      dailyActionsTotal: dailyActions,
      notifications: [...state.notifications, ...newNotifications],
      emails: [...assignmentEmails, ...consequenceEmails, ...newEmails, ...adversarialEmails, ...deliveredPendingEmails, ...publicRecordsEmails, ...overdueResponseEmails, ...updatedStoredEmails],
      generatedEmailEvents: [...(state.generatedEmailEvents || []), ...newEventKeys, ...(adversarialResults.newEventKeys || [])],
      pendingEmails: [],
      resolutionQueue: [...(state.resolutionQueue || []), ...pendingResolutions],
      activityFeed: [
        ...assignmentActivity,
        ...consequenceResult.newActivityEntries,
        {
          id: Date.now().toString(),
          timestamp: nextDate,
          message: `Advanced to ${nextDate}. ${dailyActions} actions available.`,
          type: 'action',
        },
        ...state.activityFeed,
      ].slice(0, 50),
      pendingCaseGeneration,
      toasts: newToasts,
    }
    set(updated)
    persist({ ...state, ...updated })
  },

  async checkApiStatus() {
    const result = await testApiConnection()
    if (result.success && result.hasApiKey) {
      set({ apiStatus: 'online', apiAvailable: true })
    } else if (result.success && !result.hasApiKey) {
      set({ apiStatus: 'no_key', apiAvailable: false })
    } else {
      set({ apiStatus: 'offline', apiAvailable: false })
    }
    console.log('API Status:', result)
    return result
  },

  setApiAvailable(bool) {
    const state = get()
    const updated = { apiAvailable: bool }
    set(updated)
    persist({ ...state, ...updated })
  },

  checkApiAvailability() {
    const state = get()
    const available = isApiAvailable()
    const updated = { apiAvailable: available }
    set(updated)
    persist({ ...state, ...updated })
  },

  resetGame() {
    localStorage.removeItem(SAVE_KEY)
    set({ ...defaultState })
  },
}))
