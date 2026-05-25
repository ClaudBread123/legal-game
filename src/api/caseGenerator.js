import { callClaude } from './anthropicProxy.js'
import { getNextFallbackCase } from '../data/fallbackCases.js'
import { validateCase } from './validateCase.js'

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

const FL_MUNICIPALITY_TYPES = [
  'City', 'Town', 'County', 'Village', 'Municipality', 'Special District',
  'Charter School District', 'School Board', 'Water Management District',
  'Transit Authority', 'Port Authority', 'Fire District',
]

const FL_INCIDENT_TYPES = [
  'slip-and-fall', 'vehicle collision', 'police use-of-force', 'property damage',
  'premises liability', 'employment discrimination', 'wrongful termination',
  'civil rights violation', 'excessive force', 'negligent supervision',
  'dangerous condition on public property', 'failure to maintain',
]

function extractMunicipalityType(defendant) {
  if (!defendant) return 'municipality'
  const d = defendant.toLowerCase()
  for (const t of FL_MUNICIPALITY_TYPES) {
    if (d.includes(t.toLowerCase())) return t.toLowerCase()
  }
  return 'municipality'
}

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

function buildVarietyPrompt(existingCases) {
  if (!existingCases || existingCases.length === 0) {
    return `VARIETY REQUIREMENT: Generate a completely unique Florida state tort case involving a city or county municipality (NOT a school board) where a plaintiff was physically injured. Do not use: Palmetto Shores, Marcus Delray, Riverside Park, Officer Dana Whitmore, Suncoast Charter Academy, Priya Nambiar, Broward County School Board, Terrence Washington, Cypress Ridge, Horizon Academy, or any employment/whistle-blower/termination scenario.`
  }

  const history = existingCases.slice(-5).map(c => ({
    caseId: c.caseId,
    defendant: c.defendant,
    defendantType: extractMunicipalityType(c.defendant),
    plaintiff: c.clientName,
    caseType: c.caseType,
    incidentType: extractIncidentType(c.factScenario),
    primaryIssue: c.hiddenIssues?.[0]?.issueType,
  }))

  const prohibitedDefendants = existingCases.map(c => c.defendant)
  const prohibitedTypes = [...new Set(existingCases.map(c => extractMunicipalityType(c.defendant)))]
  const prohibitedIncidents = [...new Set(existingCases.map(c => extractIncidentType(c.factScenario)).filter(Boolean))]
  const prohibitedPlaintiffs = existingCases.map(c => c.clientName)
  const prohibitedIssues = existingCases.map(c => c.hiddenIssues?.[0]?.issueType).filter(Boolean)

  return `EXISTING CASES — STRICT VARIETY REQUIRED:
${JSON.stringify(history, null, 2)}

STRICTLY PROHIBITED:
Defendants: ${prohibitedDefendants.join(', ')}
Defendant types: ${prohibitedTypes.join(', ')}
Incident types: ${prohibitedIncidents.join(', ')}
Plaintiff names: ${prohibitedPlaintiffs.join(', ')}
Primary issue types: ${prohibitedIssues.join(', ')}
Also never: Palmetto Shores, Marcus Delray, Broward County School Board, Terrence Washington, Cypress Ridge, Horizon Academy.
The new case MUST be meaningfully different on every dimension.`
}

function buildCaseSystemPrompt() {
  return `You are a case generation engine for a Florida governmental defense litigation training simulator at the law firm Llopiz Wizel LLP. Generate realistic, entirely fictitious Florida civil cases against governmental entities. Every name, entity, and fact must be fictional.

FLORIDA LAW — APPLY EXACTLY:

§768.28(9) Individual Immunity:
Government employees may NOT be held personally liable for acts within scope of employment unless they acted in bad faith, with malicious purpose, or with wanton disregard of human rights. The exclusive remedy for in-scope conduct is against the entity.

§768.28(6)(a) Pre-Suit Notice:
Written notice is a condition precedent to suit.
Window: 18 months if dateOfIncident >= 2026-10-01
Window: 3 years if dateOfIncident < 2026-10-01

§768.28(5) Damages Caps:
If dateOfIncident >= 2026-10-01 (HB 145): $350,000 per person / $500,000 per occurrence
If dateOfIncident < 2026-10-01: $200,000 per person / $300,000 per occurrence
§1983 federal claims are NOT subject to these caps.

§1983 Federal Claims:
If complaint includes 42 U.S.C. §1983 claims, defendant has 30 days from service to remove to federal district court — flag as critical hidden issue.

hb145Applicable: true ONLY if dateOfIncident >= "2026-10-01", else false.

OUTPUT: ONLY valid JSON. No markdown, no code blocks, no explanation. Match schema exactly.`
}

function getDifficultyNote(playerLevel) {
  const titleMap = {
    1: 'Junior Associate', 2: 'Associate', 3: 'Senior Associate',
    4: 'Junior Partner', 5: 'Partner', 6: 'Equity Shareholder',
  }
  const title = typeof playerLevel === 'number'
    ? (titleMap[playerLevel] || 'Junior Associate')
    : (playerLevel || 'Junior Associate')

  const notes = {
    'Junior Associate': '1 of 5 — 2-3 hidden issues, clear facts, one critical §768.28 issue required',
    'Associate': '2 of 5 — 3-4 hidden issues, some ambiguity',
    'Senior Associate': '3 of 5 — 4-5 issues, overlapping frameworks',
    'Junior Partner': '4 of 5 — complex multi-issue, federal overlay',
    'Partner': '5 of 5 — maximum complexity, novel facts',
    'Equity Shareholder': '5 of 5 — maximum complexity, novel facts',
  }
  return notes[title] || notes['Junior Associate']
}

function buildCaseUserPrompt({ caseType, playerLevel, currentDate, existingCases, constraints }) {
  const varietyBlock = buildVarietyPrompt(existingCases)
  const constraintBlock = constraints?.instruction
    ? `\nSPECIAL REQUIREMENTS:\n${constraints.instruction}`
    : ''
  const difficultyNote = getDifficultyNote(playerLevel)

  return `Generate a Florida governmental defense case with these parameters:

CASE TYPE: ${caseType || 'state_tort'}
PLAYER LEVEL: ${playerLevel || 'Junior Associate'}
CURRENT DATE: ${currentDate}
DIFFICULTY: ${difficultyNote}

${varietyBlock}
${constraintBlock}

REQUIRED JSON SCHEMA — output this exactly:
{
  "caseId": "LW-2026-XXXX (4 random digits)",
  "caseType": "${caseType || 'state_tort'}",
  "clientName": "Plaintiff full name (fictional)",
  "defendant": "Florida governmental entity name",
  "dateFiled": "ISO date 3-7 days before ${currentDate}",
  "dateOfIncident": "ISO date 6-18 months before dateFiled",
  "factScenario": "4-6 sentences describing the incident. Include what happened, where, who was involved, what injuries resulted, and the governmental entity's role.",
  "claimsAsserted": [
    "Count I — [Claim Type] ([Defendant])",
    "Count II — [Claim Type] ([Party])"
  ],
  "hiddenIssues": [
    {
      "issueType": "barred_individual_defendant | insufficient_presuit_notice | sovereign_immunity_bar | statute_of_limitations | wrong_venue | duplicative_counts | federal_removal_1983 | admin_exhaustion | hb145_cap_applicability | hb145_notice_window",
      "description": "Detailed explanation of the issue and its legal significance",
      "severity": "critical | major | minor",
      "statute": "Primary statute citation",
      "deadline": "Deadline string or null"
    }
  ],
  "applicableDefenses": ["Defense description with statute"],
  "previewFlag": "One vague sentence hinting at the most important threshold issue without revealing it",
  "hb145Applicable": true or false
}

FLORIDA GOVERNMENTAL ENTITIES TO USE:
Cities: Miami, Orlando, Tampa, Jacksonville, Fort Lauderdale, Hialeah, Tallahassee, St. Petersburg, Cape Coral, Pembroke Pines, Hollywood, Miramar, Gainesville, Coral Springs, Clearwater, Palm Bay, Pompano Beach, West Palm Beach, Lakeland, Davie, Miami Gardens, Sunrise, Deltona, Ocala, Port St. Lucie, Boca Raton, Deerfield Beach, Boynton Beach, Lauderhill, Weston, Delray Beach

Counties: Miami-Dade County, Broward County, Palm Beach County, Hillsborough County, Orange County, Pinellas County, Duval County, Lee County, Polk County, Brevard County, Volusia County, Seminole County, Sarasota County, Manatee County, Alachua County, Leon County, Collier County, St. Johns County, Marion County, Pasco County, Escambia County, Indian River County

Charter Schools (fictional names only): First Coast Charter Academy, Gulf Coast Preparatory Academy, Space Coast Charter School, Treasure Coast Academy, Bay Area Charter Institute, Keys Preparatory Academy, Emerald Coast Charter School, Nature Coast Academy

Special Districts: South Florida Water Management District, Central Florida Expressway Authority, fictional transit/port/hospital/community development districts

INCIDENT TYPES: Negligent security at government building or transit station, Slip and fall on government property, Government vehicle accident, Police use of force or wrongful arrest, Employment retaliation or discrimination, ADA accommodation failure, Property taking or zoning dispute, Student injury at school, Premises defect or infrastructure failure, False imprisonment or wrongful detention, Medical negligence at government facility, Excessive force during lawful encounter

Generate the case now. Output JSON only.`
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

  const TIMEOUT_MS = 60000
  const ATTEMPT_TIMEOUT_MS = 25000
  const startTime = Date.now()
  const candidates = []
  let attempts = 0
  const maxAttempts = 5

  const systemPrompt = buildCaseSystemPrompt()
  const userPrompt = buildCaseUserPrompt({ caseType, playerLevel, currentDate, existingCases, constraints })
  log('Prompt chars: ' + (systemPrompt.length + userPrompt.length))

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

      // Only reject if truly critical fields are missing after normalization
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
      log('✓ Fields OK, defendant: ' + caseObject.defendant)

      // Prohibited defendant check
      const defendantLower = caseObject.defendant.toLowerCase()
      const isProhibited = PROHIBITED_DEFENDANTS.some(p =>
        defendantLower === p || defendantLower.includes(p)
      )
      if (isProhibited) {
        log('✗ Prohibited defendant: ' + caseObject.defendant)
        continue
      }
      log('✓ Defendant OK: ' + caseObject.defendant)

      // Non-blocking validation — 8s max
      let validationScore = 1
      try {
        const validation = await Promise.race([
          validateCase(caseObject),
          new Promise(resolve =>
            setTimeout(() => resolve({ isValid: true, confidenceScore: 'MEDIUM' }), 8000)
          ),
        ])
        if (validation.isValid && validation.confidenceScore === 'HIGH') {
          validationScore = 3
        } else if (validation.isValid) {
          validationScore = 2
        }
      } catch (valErr) {
        log('⚠ Validator error: ' + valErr.message)
      }
      log('Validation score: ' + validationScore)

      candidates.push({ caseObject, validationScore, generatedAt: Date.now() - startTime })

      if (validationScore === 3) {
        log('✓ Using AI case: ' + caseObject.defendant)
        return caseObject
      }

      const timeRemaining = TIMEOUT_MS - (Date.now() - startTime)
      log('Time remaining: ' + Math.round(timeRemaining / 1000) + 's')
      if (timeRemaining < 12000 && candidates.length >= 1) {
        log('⚠ Low on time — using best available')
        break
      }

    } catch (err) {
      log('✗ Attempt ' + attempts + ' error: ' + err.message)
      if (err.message === 'API_UNAVAILABLE') {
        log('✗ API unavailable — stopping')
        break
      }
    }
  }

  if (candidates.length > 0) {
    candidates.sort((a, b) => b.validationScore - a.validationScore)
    const best = candidates[0]
    log('✓ Using AI case: ' + best.caseObject.defendant + ' (score ' + best.validationScore + ')')
    return best.caseObject
  }

  const fallback = getNextFallbackCase(existingCases.map(c => c.caseId))
  log('✗ Using fallback: ' + fallback.defendant)
  return fallback
}
