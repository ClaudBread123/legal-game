import { create } from 'zustand'
import { FALLBACK_CASES } from '../data/fallbackCases.js'
import { CAREER_LADDER } from '../data/careerLadder.js'
import { getTitleFromXP } from '../utils/scoring.js'
import { getSimulatedStartDate, advanceBusinessDay, formatShortDate } from '../utils/dateUtils.js'
import { BILLING_RATE } from '../data/issueTypes.js'
import { EMAIL_TEMPLATES } from '../data/emailTemplates.js'
import { checkAndGenerateEmails } from '../utils/emailEngine.js'

const SAVE_KEY = 'llw_save_v1'

function getSalaryFromTitle(title) {
  const tier = CAREER_LADDER.find(t => t.title === title)
  return tier ? tier.salary : 100000
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

function makeEmailId() {
  return `email-${Date.now()}-${Math.floor(Math.random() * 100000)}`
}

function buildWelcomeEmails(playerName, startDate) {
  const dateStr = formatShortDate(startDate)
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

Welcome to the governmental defense group. Your first cases have been assigned.

Review the complaints carefully — threshold issues on governmental claims must be identified immediately. Do not let deadlines pass without action.

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

function buildCaseAssignedEmails(cases, playerName, startDate) {
  return cases.map(c => {
    const data = EMAIL_TEMPLATES.case_assigned({
      playerName,
      caseId: c.caseId,
      defendant: c.defendant,
      clientName: c.clientName,
      caseType: c.caseType,
    })
    return { id: makeEmailId(), timestamp: startDate, read: false, to: playerName, ...data }
  })
}

const defaultState = {
  player: {
    name: 'Joshy Llopiz',
    title: 'Junior Associate',
    salary: 100000,
    xp: 0,
    level: 1,
  },
  cases: [],
  gameStarted: false,
  currentDate: null,
  dailyActionsRemaining: 6,
  dailyActionsTotal: 6,
  activityFeed: [],
  notifications: [],
  timekeepingEntries: {},
  timekeepingSubmitted: {},
  managingPartnerMessages: [],
  monthlyBillableHours: 0,
  apiAvailable: true,
  emails: [],
  generatedEmailEvents: [],
}

const saved = loadSaved()
// Merge saved state with defaultState so new fields always have defaults
const initialState = saved ? { ...defaultState, ...saved } : defaultState

export const useGameStore = create((set, get) => ({
  ...initialState,

  initGame(playerName) {
    const startDate = getSimulatedStartDate()
    const cases = FALLBACK_CASES.map(c => ({ ...c }))
    const welcomeEmails = buildWelcomeEmails(playerName, startDate)
    const caseEmails = buildCaseAssignedEmails(cases, playerName, startDate)
    const newState = {
      ...defaultState,
      player: {
        name: playerName || 'Joshy Llopiz',
        title: 'Junior Associate',
        salary: 100000,
        xp: 0,
        level: 1,
      },
      cases,
      gameStarted: true,
      currentDate: startDate,
      dailyActionsRemaining: 6,
      dailyActionsTotal: 6,
      activityFeed: [
        {
          id: Date.now().toString(),
          timestamp: startDate,
          message: `Welcome to Llopiz Wizel LLP, ${playerName}. Your caseload has been assigned.`,
          type: 'action',
        },
      ],
      emails: [...caseEmails, ...welcomeEmails],
      generatedEmailEvents: cases.map(c => `case_assigned_${c.caseId}`),
    }
    set(newState)
    persist(newState)
  },

  advanceDay() {
    const state = get()
    const nextDate = advanceBusinessDay(state.currentDate)

    // Run email engine against current state
    const newEmailResults = checkAndGenerateEmails(state)
    const newEmails = newEmailResults.map(r => ({ ...r.email, to: state.player.name }))
    const newEventKeys = newEmailResults.map(r => r.key)

    // Check deadline notifications on all cases
    const newNotifications = []
    state.cases.forEach(c => {
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

    const updated = {
      currentDate: nextDate,
      dailyActionsRemaining: state.dailyActionsTotal || 6,
      notifications: [...state.notifications, ...newNotifications],
      emails: [...newEmails, ...(state.emails || [])],
      generatedEmailEvents: [...(state.generatedEmailEvents || []), ...newEventKeys],
      activityFeed: [
        {
          id: Date.now().toString(),
          timestamp: nextDate,
          message: `Advanced to ${nextDate}. Daily actions reset.`,
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
    const newTitle = getTitleFromXP(newXP)
    const newSalary = getSalaryFromTitle(newTitle)
    const promoted = newTitle !== state.player.title
    const feedEntry = {
      id: Date.now().toString(),
      timestamp: state.currentDate,
      message: promoted
        ? `+${amount} XP — ${reason}. PROMOTED TO ${newTitle}!`
        : `+${amount} XP — ${reason}`,
      type: 'xp',
    }
    const updated = {
      player: {
        ...state.player,
        xp: newXP,
        title: newTitle,
        salary: newSalary,
        level: CAREER_LADDER.findIndex(t => t.title === newTitle) + 1,
      },
      activityFeed: [feedEntry, ...state.activityFeed].slice(0, 50),
    }
    if (promoted) {
      // Add promotion notification
      updated.notifications = [
        {
          id: `promo-${Date.now()}`,
          message: `Congratulations! You have been promoted to ${newTitle}.`,
          read: false,
          type: 'promotion',
          caseId: null,
        },
        ...(state.notifications || []),
      ]
      // Add promotion email
      const promoEmailData = EMAIL_TEMPLATES.promotion({
        playerName: state.player.name,
        newTitle,
        effectiveDate: state.currentDate || 'today',
        newSalary,
      })
      const promoEmail = {
        id: makeEmailId(),
        timestamp: state.currentDate,
        read: false,
        to: state.player.name,
        ...promoEmailData,
      }
      updated.emails = [promoEmail, ...(state.emails || [])]
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
    const newEntry = {
      id: `tk-${Date.now()}`,
      caseId,
      description,
      hours,
      amount,
    }
    const updated = {
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
    const updated = {
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
    set(defaultState)
  },
}))
