import { create } from 'zustand'
import { FALLBACK_CASES } from '../data/fallbackCases.js'
import { CAREER_LADDER } from '../data/careerLadder.js'
import { checkPromotionEligibility } from '../utils/scoring.js'
import { getSimulatedStartDate, advanceBusinessDay, formatShortDate } from '../utils/dateUtils.js'
import { BILLING_RATE } from '../data/issueTypes.js'
import { EMAIL_TEMPLATES } from '../data/emailTemplates.js'
import { checkAndGenerateEmails } from '../utils/emailEngine.js'
import { evaluateConsequences, DEFAULT_PROBABILITY } from '../utils/consequencesEngine.js'

const SAVE_KEY = 'llw_save_v2'
const OLD_SAVE_KEY = 'llw_save_v1'

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
      from: 'Rafael Llopiz',
      fromEmail: 'r.llopiz@llopizwizel.com',
      to: playerName,
      subject: 'Welcome to the Practice Group',
      priority: 'high',
      body: `${playerName},

Welcome to the governmental defense group. Your first case has been assigned.

Review the complaint carefully — threshold issues on governmental claims must be identified immediately. Do not let deadlines pass without action.

A missed §768.28(9) argument, a deficient pre-suit notice, an unrecognized federal removal hook — these are the issues that define careers here, in both directions.

My door is open.

— RL`,
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
}

const defaultState = {
  player: { ...defaultPlayer },
  cases: [],
  pendingCases: [],
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
  apiAvailable: true,
  emails: [],
  generatedEmailEvents: [],
  staleGameCleared: false,
}

const saved = loadSaved()
const staleGameCleared = !saved && checkAndClearStale()
const initialState = saved
  ? { ...defaultState, ...saved, staleGameCleared: false }
  : { ...defaultState, staleGameCleared }

export const useGameStore = create((set, get) => ({
  ...initialState,

  initGame(playerName) {
    const startDate = getSimulatedStartDate()
    const case1 = makeCaseObject(FALLBACK_CASES[0])
    const pendingCase2 = makeCaseObject(FALLBACK_CASES[1])

    const welcomeEmails = buildWelcomeEmails(playerName, startDate)
    const case1Email = buildCaseAssignedEmail(case1, playerName, startDate)

    const newState = {
      ...defaultState,
      player: {
        ...defaultPlayer,
        name: playerName || 'Joshy Llopiz',
      },
      cases: [case1],
      pendingCases: [pendingCase2],
      gameStarted: true,
      currentDate: startDate,
      dailyActionsRemaining: 4,
      dailyActionsTotal: 4,
      activityFeed: [
        {
          id: Date.now().toString(),
          timestamp: startDate,
          message: `Welcome to Llopiz Wizel LLP, ${playerName}. Your first matter has been assigned.`,
          type: 'action',
        },
      ],
      emails: [case1Email, ...welcomeEmails],
      generatedEmailEvents: [`case_assigned_${case1.caseId}`],
      staleGameCleared: false,
    }
    set(newState)
    persist(newState)
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

    const updated = {
      currentDate: nextDate,
      cases: activeCases,
      pendingCases,
      player: finalPlayer,
      dailyActionsRemaining: dailyActions,
      dailyActionsTotal: dailyActions,
      notifications: [...state.notifications, ...newNotifications],
      emails: [...assignmentEmails, ...consequenceEmails, ...newEmails, ...(state.emails || [])],
      generatedEmailEvents: [...(state.generatedEmailEvents || []), ...newEventKeys],
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

  completeAction(caseId, actionId) {
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

  setApiAvailable(bool) {
    const state = get()
    const updated = { apiAvailable: bool }
    set(updated)
    persist({ ...state, ...updated })
  },

  resetGame() {
    localStorage.removeItem(SAVE_KEY)
    set({ ...defaultState })
  },
}))
