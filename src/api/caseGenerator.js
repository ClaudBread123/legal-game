import { callClaude } from './anthropicProxy.js'
import { getNextFallbackCase } from '../data/fallbackCases.js'

// Module-level debug logger — set externally for on-screen diagnostics
let _debugLog = null
export function setDebugLogger(fn) { _debugLog = fn }
function log(msg) {
  if (_debugLog) _debugLog(msg)
  console.log('[gen]', msg)
}

const PROHIBITED_DEFENDANTS = [
  'broward county school board',
  'suncoast charter academy',
  'palmetto shores',
  'horizon academy',
]

const FL_INCIDENT_TYPES = [
  'slip-and-fall', 'vehicle collision', 'police use-of-force', 'property damage',
  'premises liability', 'employment discrimination', 'wrongful termination',
  'civil rights violation', 'excessive force', 'negligent supervision',
  'dangerous condition on public property', 'failure to maintain',
]

function extractIncidentType(factScenario) {
  if (!factScenario) return null
  const fs = factScenario.toLowerCase()
  for (const t of FL_INCIDENT_TYPES) {
    if (fs.includes(t.replace(/-/g, ' '))) return t
  }
  return null
}

function extractJSON(response) {
  if (!response) return null
  let text = response.trim()
  text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  if (text.startsWith('{')) return text
  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.substring(firstBrace, lastBrace + 1)
  }
  return text
}

function normalizeCase(raw) {
  return {
    caseId: raw.caseId || raw.case_id || raw.id ||
      'LW-2026-' + Math.floor(Math.random() * 9000 + 1000),
    caseType: raw.caseType || raw.case_type || raw.type || 'state_tort',
    clientName: raw.clientName || raw.client_name || raw.plaintiff ||
      raw.plaintiffName || 'Unknown Plaintiff',
    defendant: raw.defendant || raw.defendantName || raw.defendant_name || 'Unknown Defendant',
    dateFiled: raw.dateFiled || raw.date_filed || new Date().toISOString().split('T')[0],
    dateOfIncident: raw.dateOfIncident || raw.date_of_incident ||
      raw.incidentDate || raw.dateFiled,
    factScenario: raw.factScenario || raw.fact_scenario || raw.facts || raw.scenario || '',
    claimsAsserted: Array.isArray(raw.claimsAsserted) ? raw.claimsAsserted
      : Array.isArray(raw.claims) ? raw.claims
      : Array.isArray(raw.counts) ? raw.counts : [],
    hiddenIssues: Array.isArray(raw.hiddenIssues) ? raw.hiddenIssues
      : Array.isArray(raw.hidden_issues) ? raw.hidden_issues
      : Array.isArray(raw.issues) ? raw.issues : [],
    applicableDefenses: Array.isArray(raw.applicableDefenses) ? raw.applicableDefenses
      : Array.isArray(raw.defenses) ? raw.defenses : [],
    previewFlag: raw.previewFlag || raw.preview_flag || raw.hint || raw.preview || '',
    hb145Applicable: raw.hb145Applicable !== undefined
      ? raw.hb145Applicable : (raw.hb145 || false),
  }
}

function buildCaseSystemPrompt() {
  return `You generate Florida governmental defense cases for a law firm training game.
Output ONLY valid JSON. No markdown. No text before or after the JSON object.

Florida law rules:
- §768.28(9): govt employees immune individually unless bad faith or malice
- §768.28(6): pre-suit notice required. 18 months if incident >= 2026-10-01, else 3 years
- §768.28(5): caps $350k/$500k if >= 2026-10-01, else $200k/$300k. Not applicable to §1983 claims
- §1983: removable to federal court within 30 days
- hb145Applicable: true only if dateOfIncident >= "2026-10-01"`
}

function buildCaseUserPrompt({ caseType, playerLevel, currentDate, existingCases, constraints }) {
  const usedDefendants = existingCases.map(c => c.defendant).join(', ')
  const usedTypes = [...new Set(
    existingCases.map(c => extractIncidentType(c.factScenario))
  )].filter(Boolean).join(', ')

  const varietyLine = existingCases.length > 0
    ? `Avoid these defendants: ${usedDefendants}. Avoid these incident types: ${usedTypes}.`
    : 'Do not use Palmetto Shores or Broward County School Board.'

  const constraintLine = constraints?.instruction
    ? constraints.instruction.substring(0, 300)
    : ''

  return `Generate a ${caseType || 'state_tort'} case for a ${playerLevel || 'Junior Associate'}.
Date: ${currentDate}
${varietyLine}
${constraintLine}

Use a real Florida city, county, charter school, or special district as defendant.
Include 2-3 hidden issues. At least one must be critical (§768.28(9) individual defendant or pre-suit notice deficiency).

Return this JSON schema:
{
  "caseId": "LW-2026-XXXX",
  "caseType": "${caseType || 'state_tort'}",
  "clientName": "Fictional plaintiff name",
  "defendant": "Florida governmental entity",
  "dateFiled": "ISO date near ${currentDate}",
  "dateOfIncident": "ISO date 6-18 months earlier",
  "factScenario": "3-5 sentences describing the incident, parties, injuries, and governmental entity role",
  "claimsAsserted": ["Count I — Type (Party)", "Count II — Type (Party)"],
  "hiddenIssues": [{"issueType": "barred_individual_defendant|insufficient_presuit_notice|sovereign_immunity_bar|statute_of_limitations|federal_removal_1983|hb145_cap_applicability", "description": "Legal explanation", "severity": "critical|major|minor", "statute": "Citation", "deadline": null}],
  "applicableDefenses": ["Defense with statute"],
  "previewFlag": "Vague hint about main issue",
  "hb145Applicable": true or false
}`
}

export async function generateCase({
  caseType,
  playerLevel,
  currentDate,
  existingCases = [],
  constraints = {},
}) {
  log('generateCase: starting')
  log('type: ' + caseType + ' | level: ' + playerLevel)

  const TIMEOUT_MS = 45000
  const ATTEMPT_TIMEOUT_MS = 20000
  const startTime = Date.now()
  let attempts = 0
  const maxAttempts = 3

  const systemPrompt = buildCaseSystemPrompt()
  const userPrompt = buildCaseUserPrompt({ caseType, playerLevel, currentDate, existingCases, constraints })
  const promptSize = systemPrompt.length + userPrompt.length
  log('Prompt chars: ' + promptSize)
  console.log('Prompt size:', promptSize, 'chars')

  while (attempts < maxAttempts && Date.now() - startTime < TIMEOUT_MS) {
    attempts++
    const elapsed = Date.now() - startTime
    log('Attempt ' + attempts + ' (' + Math.round(elapsed / 1000) + 's elapsed)')

    try {
      const response = await Promise.race([
        callClaude({ system: systemPrompt, userMessage: userPrompt, maxTokens: 3000 }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('ATTEMPT_TIMEOUT')), ATTEMPT_TIMEOUT_MS)
        ),
      ])

      log('✓ API responded, length: ' + response?.length)

      const clean = extractJSON(response)
      let caseObject
      try {
        const parsed = JSON.parse(clean)
        caseObject = normalizeCase(parsed)
        log('✓ JSON parsed OK')
      } catch (parseErr) {
        log('✗ JSON parse failed: ' + parseErr.message)
        log('First 80: ' + (clean || '').substring(0, 80))
        continue
      }

      const isValid = (
        caseObject.defendant &&
        caseObject.defendant !== 'Unknown Defendant' &&
        caseObject.factScenario &&
        caseObject.factScenario.length > 50
      )
      if (!isValid) {
        log('✗ Critical fields missing — defendant: "' + caseObject.defendant +
          '" scenario len: ' + caseObject.factScenario?.length)
        continue
      }

      const defendantLower = caseObject.defendant.toLowerCase()
      const isProhibited = PROHIBITED_DEFENDANTS.some(p =>
        defendantLower === p || defendantLower.includes(p)
      )
      if (isProhibited) {
        log('✗ Prohibited defendant: ' + caseObject.defendant)
        continue
      }

      // First valid case — return immediately
      log('✓ Using AI case: ' + caseObject.defendant)
      console.log('Case accepted:', caseObject.defendant)
      return caseObject

    } catch (err) {
      log('✗ Attempt ' + attempts + ' error: ' + err.message)
      if (err.message === 'API_UNAVAILABLE') {
        log('✗ API unavailable — stopping')
        break
      }
    }
  }

  const fallback = getNextFallbackCase(existingCases.map(c => c.caseId))
  log('✗ Using fallback: ' + fallback.defendant)
  return fallback
}
