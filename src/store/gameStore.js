import { create } from 'zustand'
import { FALLBACK_CASES } from '../data/fallbackCases.js'
import { CAREER_LADDER } from '../data/careerLadder.js'
import { getTitleFromXP } from '../utils/scoring.js'
import { getSimulatedStartDate, advanceBusinessDay } from '../utils/dateUtils.js'
import { BILLING_RATE } from '../data/issueTypes.js'

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
}

const saved = loadSaved()
// Merge saved state with defaultState so new fields always have defaults
const initialState = saved ? { ...defaultState, ...saved } : defaultState

export const useGameStore = create((set, get) => ({
  ...initialState,

  initGame(playerName) {
    const startDate = getSimulatedStartDate()
    const cases = FALLBACK_CASES.map(c => ({ ...c }))
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
    }
    set(newState)
    persist(newState)
  },

  advanceDay() {
    const state = get()
    const nextDate = advanceBusinessDay(state.currentDate)
    // Check deadlines on all cases
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
      updated.notifications = [
        {
          id: `promo-${Date.now()}`,
          message: `Congratulations! You have been promoted to ${newTitle}.`,
          read: false,
          type: 'promotion',
          caseId: null,
        },
        ...state.notifications,
      ]
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
        ...state.notifications,
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

  addMPMessage(caseId, content) {
    const state = get()
    const msg = {
      id: `mp-${Date.now()}`,
      timestamp: state.currentDate,
      caseId,
      content,
      read: false,
    }
    const updated = { managingPartnerMessages: [msg, ...state.managingPartnerMessages] }
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
