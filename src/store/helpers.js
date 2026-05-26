import { CAREER_LADDER } from '../data/careerLadder.js'
import { checkPromotionEligibility } from '../utils/scoring.js'
import { DEFAULT_PROBABILITY } from '../utils/consequencesEngine.js'
import { isApiAvailable } from '../api/anthropicProxy.js'
import { EMAIL_TEMPLATES } from '../data/emailTemplates.js'

export const SAVE_KEY = 'llw_save_v3'
export const OLD_SAVE_KEY = 'llw_save_v2'

export function getDailyActionsForTitle(title) {
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

export function persist(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state))
  } catch {}
}

export function loadSaved() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

export function checkAndClearStale() {
  try {
    const old = localStorage.getItem(OLD_SAVE_KEY)
    if (old) {
      localStorage.removeItem(OLD_SAVE_KEY)
      return true
    }
  } catch {}
  return false
}

export function makeEmailId() {
  return `email-${Date.now()}-${Math.floor(Math.random() * 100000)}`
}

export function buildWelcomeEmails(playerName, startDate) {
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

export function makeCaseObject(c) {
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

export function buildCaseAssignedEmail(c, playerName, date) {
  const data = EMAIL_TEMPLATES.case_assigned({
    playerName,
    caseId: c.caseId,
    defendant: c.defendant,
    clientName: c.clientName,
    caseType: c.caseType,
  })
  return { id: makeEmailId(), timestamp: date, read: false, to: playerName, ...data }
}

// Returns promotion payload or null if no promotion due
export function buildPromotionUpdate(player, currentDate) {
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

export const defaultPlayer = {
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

export const CASE_GENERATION_SCHEDULE = [
  { day: 20, caseType: 'state_tort' },
  { day: 35, caseType: 'section_1983' },
  { day: 50, caseType: 'employment' },
  { day: 70, caseType: 'state_tort' },
  { day: 90, caseType: 'section_1983' },
]

export const defaultState = {
  authenticated: typeof localStorage !== 'undefined' && localStorage.getItem('llw_auth') === 'true',
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
  pendingEmails: [],
  staleGameCleared: false,
  toasts: [],
  pendingCaseGeneration: null,
  isGeneratingCase: false,
  lastRealPlayedDate: null,
}
