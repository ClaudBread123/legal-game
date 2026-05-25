import { create } from 'zustand'
import { FALLBACK_CASES, getNextFallbackCase } from '../data/fallbackCases.js'
import { generateCase } from '../api/caseGenerator.js'
import { shouldTriggerResolution, determineResolutionPath } from '../utils/caseResolution.js'
import { CAREER_LADDER } from '../data/careerLadder.js'
import { checkPromotionEligibility } from '../utils/scoring.js'
import { getSimulatedStartDate, advanceBusinessDay, formatShortDate, addBusinessDays, daysBetween } from '../utils/dateUtils.js'
import { BILLING_RATE } from '../data/issueTypes.js'
import { EMAIL_TEMPLATES } from '../data/emailTemplates.js'
import { checkAndGenerateEmails } from '../utils/emailEngine.js'
import { evaluateConsequences, DEFAULT_PROBABILITY } from '../utils/consequencesEngine.js'
import { isApiAvailable, testApiConnection } from '../api/anthropicProxy.js'
import { generatePublicRecordsResponse } from '../data/publicRecordsData.js'

const SAVE_KEY = 'llw_save_v3'
const OLD_SAVE_KEY = 'llw_save_v2'

function getDailyActionsForTitle(title) {
  switch (title) {
    case 'Junior Associate': return 4
    case 'Associate': return 5
    case 'Senior Associate': return 5
    case 'Junior Partner': return 6
    case 'Partner': return 6
    case 'Equity Shareholder': return 7
    default: return 4
  }
}

function persist(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state))
  } catch {}
}

function loadSaved() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

function checkAndClearStale() {
  try {
    const old = localStorage.getItem(OLD_SAVE_KEY)
    if (old) {
      localStorage.removeItem(OLD_SAVE_KEY)
      return true
    }
  } catch {}
  return false
}

function makeEmailId() {
  return `email-${Date.now()}-${Math.floor(Math.random() * 100000)}`
}

function buildWelcomeEmails(playerName, startDate) {
  return [
    {
      id: makeEmailId(),
      timestamp: startDate,
      read: false,
      from: 'Onier Llopiz',
      fromEmail: 'o.llopiz@llopizwizel.com',
      to: playerName,
      subject: 'Welcome to the Practice Group',
      priority: 'high',
      body: `${playerName},

Welcome to the governmental defense group. Your first case has been assigned.

Review the complaint carefully — threshold issues on governmental claims must be identified immediately. Do not let deadlines pass without action.

A missed §768.28(9) argument, a deficient pre-suit notice, an unrecognized federal removal hook — these are the issues that define careers here, in both directions.

My door is open.

— OL`,
    },
    {
      id: makeEmailId(),
      timestamp: startDate,
      read: true,
      from: 'Maria Santos — Firm Administrator',
      fromEmail: 'admin@llopizwizel.com',
      to: playerName,
      subject: 'Timekeeping Policy Reminder',
      priority: 'normal',
      body: `All associates are required to submit timekeeping daily by 6:00 PM.

The target is 165–200 billable hours per month. Timekeeping delinquency is noted in quarterly reviews and affects year-end evaluations.

Please ensure all time entries are complete and properly described before submission. Vague entries such as "research" or "review" will be returned for revision.

Thank you,
Maria Santos
Firm Administrator`,
    },
  ]
}

function makeCaseObject(c) {
  return {
    ...c,
    caseHealth: c.caseHealth ?? 100,
    caseHealthEvents: c.caseHealthEvents ?? [],
    caseOutcomeProbability: c.caseOutcomeProbability ?? { ...DEFAULT_PROBABILITY },
    activeConsequences: c.activeConsequences ?? [],
    consequencesTriggered: c.consequencesTriggered ?? [],
    consequenceTimestamps: c.consequenceTimestamps ?? {},
    issueAnalysisSubmitted: c.issueAnalysisSubmitted ?? false,
    issueAnalysisResults: c.issueAnalysisResults ?? null,
    issueAnalysisDate: c.issueAnalysisDate ?? null,
    actionQualityScores: c.actionQualityScores ?? {},
    publicRecordsRequest: c.publicRecordsRequest ?? null,
    investigationFindings: c.investigationFindings ?? {},
    actionAttempts: c.actionAttempts ?? {},
    lockedActions: c.lockedActions ?? [],
    resolutionTriggered: c.resolutionTriggered ?? false,
    resolutionPath: c.resolutionPath ?? null,
  }
}

function buildCaseAssignedEmail(c, playerName, date) {
  const data = EMAIL_TEMPLATES.case_assigned({
    playerName,
    caseId: c.caseId,
    defendant: c.defendant,
    clientName: c.clientName,
    caseType: c.caseType,
  })
  return { id: makeEmailId(), timestamp: date, read: false, to: playerName, ...data }
}

// Returns { promoEmail, promoNotification, feedEntry, newTitle } or null if no promotion
function buildPromotionUpdate(player, currentDate, currentState) {
  const eligibleTier = checkPromotionEligibility(player)
  if (eligibleTier.title === player.title) return null

  const promoEmailData = EMAIL_TEMPLATES.promotion({
    playerName: player.name,
    newTitle: eligibleTier.title,
    effectiveDate: currentDate || 'today',
    newSalary: eligibleTier.salary,
  })

  return {
    newTitle: eligibleTier.title,
    newSalary: eligibleTier.salary,
    newLevel: CAREER_LADDER.findIndex(t => t.title === eligibleTier.title) + 1,
    promoEmail: {
      id: makeEmailId(),
      timestamp: currentDate,
      read: false,
      to: player.name,
      ...promoEmailData,
    },
    promoNotification: {
      id: `promo-${Date.now()}`,
      message: `Congratulations — promoted to ${eligibleTier.title}!`,
      read: false,
      type: 'promotion',
      caseId: null,
    },
  }
}

const defaultPlayer = {
  name: 'Joshy Llopiz',
  title: 'Junior Associate',
  salary: 100000,
  xp: 0,
  level: 1,
  totalGameDays: 0,
  casesWorked: 0,
  casesWorkedIds: [],
  totalBillableHours: 0,
  formalWarnings: 0,
  clientsLost: 0,
  careerHealth: 100,
}

const CASE_GENERATION_SCHEDULE = [
  { day: 20, caseType: 'state_tort' },
  { day: 35, caseType: 'section_1983' },
  { day: 50, caseType: 'employment' },
  { day: 70, caseType: 'state_tort' },
  { day: 90, caseType: 'section_1983' },
]

const defaultState = {
  player: { ...defaultPlayer },
  cases: [],
  pendingCases: [],
  closedCases: [],
  resolutionQueue: [],
  gameStarted: false,
  currentDate: null,
  dailyActionsRemaining: 4,
  dailyActionsTotal: 4,
  activityFeed: [],
  notifications: [],
  timekeepingEntries: {},
  timekeepingSubmitted: {},
  managingPartnerMessages: [],
  monthlyBillableHours: 0,
  apiAvailable: isApiAvailable(),
  apiStatus: 'unknown',
  emails: [],
  generatedEmailEvents: [],
  staleGameCleared: false,
  toasts: [],
  pendingCaseGeneration: null,
  isGeneratingCase: false,
}

const saved = loadSaved()
const staleGameCleared = !saved && checkAndClearStale()
const initialState = saved
  ? { ...defaultState, ...saved, staleGameCleared: false }
  : { ...defaultState, staleGameCleared }

export const useGameStore = create((set, get) => ({
  ...initialState,

  async initGame(playerName) {
    const startDate = getSimulatedStartDate()
    const welcomeEmails = buildWelcomeEmails(playerName, startDate)

    // Step 1: Set up player state — gameStarted: false until case is ready
    const baseState = {
      ...defaultState,
      player: { ...defaultPlayer, name: playerName || 'Associate' },
      cases: [],
      pendingCases: [],
      gameStarted: false,  // NOT true yet — set after case 1 is ready
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

    // Step 2: Check API status before attempting generation
    const apiCheck = await get().checkApiStatus()
    console.log('API check result:', apiCheck)
    if (!apiCheck.success) {
      console.warn('API offline — will use fallback cases')
    }

    // Step 3: Generate Case 1 — AWAIT fully before doing anything else
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

PROHIBITED — DO NOT USE ANY OF THESE:
- Palmetto Shores or any variation
- Marcus Delray or any variation
- Riverside Park
- Officer Dana Whitmore
- Negligent security at a park
- Suncoast Charter Academy
- Priya Nambiar

Use a completely different Florida city or county, a different type of incident, and a different plaintiff name.`,
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
      console.log('initGame: Case 1 generated successfully', case1.caseId)
    } catch (err) {
      console.error('initGame: Case 1 generation failed', err?.message)
      case1 = makeCaseObject(getNextFallbackCase([]))
      console.log('initGame: using fallback', case1.caseId)
    }

    const case1Email = buildCaseAssignedEmail(case1, playerName, startDate)

    // Step 4: Now set gameStarted: true WITH the case
    const stateWithCase = {
      cases: [case1],
      emails: [case1Email, ...welcomeEmails],
      generatedEmailEvents: [`case_assigned_${case1.caseId}`],
      gameStarted: true,
      isGeneratingCase: false,
    }
    set(stateWithCase)
    persist({ ...baseState, ...stateWithCase })

    // Step 5: Log activity
    get().logActivity(
      `Welcome to Llopiz Wizel LLP, ${playerName}. Your caseload has been assigned.`,
      'info'
    )

    // Step 6: Generate Case 2 in background (no await — can take time)
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

    // Run email engine
    const newEmailResults = checkAndGenerateEmails(state)
    const newEmails = newEmailResults.map(r => ({ ...r.email, to: state.player.name }))
    const newEventKeys = newEmailResults.map(r => r.key)

    // Run consequences engine
    const consequenceResult = evaluateConsequences(stateWithNextDate)
    const consequenceEmails = consequenceResult.newEmails.map(e => ({ ...e, to: state.player.name }))

    // Check deadline notifications
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

    // Stagger Case 2 assignment at totalGameDays === 8
    let activeCases = consequenceResult.updatedCases
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

    // Public records request responses
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

    // Case resolution check
    const pendingResolutions = []
    activeCases = activeCases.map(c => {
      if (c.status === 'closed' || c.resolutionTriggered) return c
      if (shouldTriggerResolution(c, nextDate)) {
        const resolutionPath = determineResolutionPath(c)
        pendingResolutions.push({ caseId: c.caseId, resolutionPath })
        return { ...c, resolutionTriggered: true }
      }
      return c
    })

    // Email response deadline tracking
    const overdueResponseEmails = []
    const currentEmails = state.emails || []
    const updatedStoredEmails = currentEmails.map(email => {
      if (!email.requiresResponse || email.responded || email.responseOverdue) return email
      const daysSince = daysBetween(email.timestamp, nextDate)
      if (daysSince < (email.responseDeadlineGameDays || 2)) return email

      // Apply worst consequence
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

    // Promotion check after advancing the day
    const updatedPlayerAfterDay = { ...state.player, totalGameDays: newTotalGameDays }
    const promo = buildPromotionUpdate(updatedPlayerAfterDay, nextDate, state)
    if (promo) {
      newNotifications.push(promo.promoNotification)
      assignmentEmails.push(promo.promoEmail)
    }

    const finalPlayer = promo
      ? { ...updatedPlayerAfterDay, title: promo.newTitle, salary: promo.newSalary, level: promo.newLevel }
      : updatedPlayerAfterDay

    const dailyActions = getDailyActionsForTitle(finalPlayer.title)

    // Case generation schedule check
    const scheduleEntry = CASE_GENERATION_SCHEDULE.find(s => s.day === newTotalGameDays)
    let pendingCaseGeneration = state.pendingCaseGeneration || null
    if (scheduleEntry && !pendingCaseGeneration) {
      pendingCaseGeneration = { caseType: scheduleEntry.caseType, day: newTotalGameDays }
    }

    // Organic case generation: after day 30, if all cases have analysis submitted and < 3 active
    if (!pendingCaseGeneration && newTotalGameDays >= 30) {
      const activeCount = activeCases.filter(c => c.status === 'active').length
      const allAnalyzed = activeCases.every(c => c.issueAnalysisSubmitted === true)
      if (allAnalyzed && activeCount < 3) {
        const pLevel = finalPlayer.level || 1
        const organicType = pLevel >= 3 ? ['state_tort', 'section_1983', 'employment'][Math.floor(Math.random() * 3)] : ['state_tort', 'employment'][Math.floor(Math.random() * 2)]
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
      emails: [...assignmentEmails, ...consequenceEmails, ...newEmails, ...publicRecordsEmails, ...overdueResponseEmails, ...updatedStoredEmails],
      generatedEmailEvents: [...(state.generatedEmailEvents || []), ...newEventKeys],
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

  spendAction(amount = 1) {
    const state = get()
    const updated = { dailyActionsRemaining: Math.max(0, state.dailyActionsRemaining - amount) }
    set(updated)
    persist({ ...state, ...updated })
  },

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

  addXP(amount, reason) {
    const state = get()
    const newXP = state.player.xp + amount
    const updatedPlayer = { ...state.player, xp: newXP }
    const promo = buildPromotionUpdate(updatedPlayer, state.currentDate, state)

    const feedEntry = {
      id: Date.now().toString(),
      timestamp: state.currentDate,
      message: promo
        ? `+${amount} XP — ${reason}. PROMOTED TO ${promo.newTitle}!`
        : `+${amount} XP — ${reason}`,
      type: 'xp',
    }

    const finalPlayer = promo
      ? { ...updatedPlayer, title: promo.newTitle, salary: promo.newSalary, level: promo.newLevel }
      : { ...updatedPlayer, title: checkPromotionEligibility(updatedPlayer).title }

    const updated = {
      player: finalPlayer,
      activityFeed: [feedEntry, ...state.activityFeed].slice(0, 50),
    }

    if (promo) {
      updated.notifications = [promo.promoNotification, ...(state.notifications || [])]
      updated.emails = [promo.promoEmail, ...(state.emails || [])]
    }

    set(updated)
    persist({ ...state, ...updated })
  },

  logActivity(message, type = 'action') {
    const state = get()
    const entry = { id: Date.now().toString(), timestamp: state.currentDate, message, type }
    const updated = { activityFeed: [entry, ...state.activityFeed].slice(0, 50) }
    set(updated)
    persist({ ...state, ...updated })
  },

  addNotification(message, type = 'info', caseId = null) {
    const state = get()
    const updated = {
      notifications: [
        { id: `notif-${Date.now()}`, message, read: false, type, caseId },
        ...(state.notifications || []),
      ],
    }
    set(updated)
    persist({ ...state, ...updated })
  },

  markNotificationRead(id) {
    const state = get()
    const updated = {
      notifications: state.notifications.map(n => (n.id === id ? { ...n, read: true } : n)),
    }
    set(updated)
    persist({ ...state, ...updated })
  },

  addEmail(emailObject) {
    const state = get()
    const updated = {
      emails: [{ ...emailObject, id: makeEmailId(), timestamp: state.currentDate, read: false }, ...(state.emails || [])],
    }
    set(updated)
    persist({ ...state, ...updated })
  },

  markEmailRead(emailId) {
    const state = get()
    const updated = {
      emails: (state.emails || []).map(e => e.id === emailId ? { ...e, read: true } : e),
    }
    set(updated)
    persist({ ...state, ...updated })
  },

  addMPMessage(caseId, content) {
    const state = get()
    const msg = {
      id: `mp-${Date.now()}`,
      timestamp: state.currentDate,
      caseId,
      content,
      read: false,
    }
    const updated = { managingPartnerMessages: [msg, ...(state.managingPartnerMessages || [])] }
    set(updated)
    persist({ ...state, ...updated })
  },

  billTime(caseId, hours, description) {
    const state = get()
    const amount = hours * BILLING_RATE
    const dateKey = state.currentDate
    const existingEntries = state.timekeepingEntries[dateKey] || []
    const newEntry = { id: `tk-${Date.now()}`, caseId, description, hours, amount }

    const updatedPlayer = {
      ...state.player,
      totalBillableHours: (state.player.totalBillableHours || 0) + hours,
    }
    const promo = buildPromotionUpdate(updatedPlayer, state.currentDate, state)

    const updated = {
      player: promo
        ? { ...updatedPlayer, title: promo.newTitle, salary: promo.newSalary, level: promo.newLevel }
        : updatedPlayer,
      cases: state.cases.map(c =>
        c.caseId === caseId
          ? { ...c, hoursBilled: (c.hoursBilled || 0) + hours, amountBilled: (c.amountBilled || 0) + amount }
          : c
      ),
      timekeepingEntries: {
        ...state.timekeepingEntries,
        [dateKey]: [...existingEntries, newEntry],
      },
      monthlyBillableHours: state.monthlyBillableHours + hours,
    }

    if (promo) {
      updated.notifications = [promo.promoNotification, ...(state.notifications || [])]
      updated.emails = [promo.promoEmail, ...(state.emails || [])]
    }

    set(updated)
    persist({ ...state, ...updated })
  },

  submitTimekeeping(date) {
    const state = get()
    const updated = {
      timekeepingSubmitted: { ...state.timekeepingSubmitted, [date]: true },
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

    // Track casesWorked
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
    const promo = buildPromotionUpdate(updatedPlayer, state.currentDate, state)

    // Quality-based case health adjustment
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

  updatePlayer(updates) {
    const state = get()
    const updated = { player: { ...state.player, ...updates } }
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

  addEmail(emailData) {
    const state = get()
    const newEmail = {
      id: makeEmailId(),
      timestamp: state.currentDate,
      read: false,
      responded: false,
      ...emailData,
    }
    const updated = { emails: [newEmail, ...(state.emails || [])] }
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

  respondToEmail(emailId, optionId, xpAmount, consequence) {
    const state = get()

    const CONSEQUENCE_EFFECTS = {
      mtd_hearing_recovered: 10,
      depo_sequencing_recovered: 8,
      mtd_5min_confirmed: -10,
    }

    const email = (state.emails || []).find(e => e.id === emailId)
    let updatedCases = state.cases

    if (consequence && email?.caseId) {
      const delta = CONSEQUENCE_EFFECTS[consequence]
      if (delta !== undefined) {
        updatedCases = state.cases.map(c =>
          c.caseId === email.caseId
            ? {
                ...c,
                caseHealth: Math.max(0, Math.min(100, (c.caseHealth ?? 100) + delta)),
                caseHealthEvents: [
                  ...(c.caseHealthEvents || []),
                  {
                    date: state.currentDate,
                    event: `Email response: ${consequence}`,
                    impact: delta,
                    description: `Response to: ${email.subject}`,
                    type: delta >= 0 ? 'positive' : 'consequence',
                  },
                ],
              }
            : c
        )
      }
    }

    const newXP = (state.player?.xp || 0) + (xpAmount || 0)
    const updatedPlayer = { ...state.player, xp: newXP }

    const updated = {
      emails: (state.emails || []).map(e =>
        e.id === emailId ? { ...e, responded: true, responseOptionId: optionId } : e
      ),
      cases: updatedCases,
      player: updatedPlayer,
      activityFeed: [
        {
          id: `email-response-${Date.now()}`,
          timestamp: state.currentDate,
          message: `Email response sent: "${email?.subject || emailId}"`,
          type: 'action',
        },
        ...(state.activityFeed || []),
      ].slice(0, 50),
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

  addToast(message, type = 'info', duration = 4000) {
    const state = get()
    const toast = { id: `toast-${Date.now()}-${Math.random()}`, message, type, duration, createdAt: Date.now() }
    const updated = { toasts: [...(state.toasts || []), toast] }
    set(updated)
    persist({ ...state, ...updated })
  },

  dismissToast(toastId) {
    const state = get()
    const updated = { toasts: (state.toasts || []).filter(t => t.id !== toastId) }
    set(updated)
    persist({ ...state, ...updated })
  },

  clearPendingCaseGeneration() {
    const state = get()
    const updated = { pendingCaseGeneration: null }
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

  resetGame() {
    localStorage.removeItem(SAVE_KEY)
    set({ ...defaultState })
  },
}))
