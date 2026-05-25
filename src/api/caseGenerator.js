import { callClaude } from './anthropicProxy.js'
import { FALLBACK_CASES, FALLBACK_CASE_QUEUE } from '../data/fallbackCases.js'
import { FL_768_28_FULL } from '../data/legalKnowledgeBase.js'
import { validateCase as validateCaseLegal } from './validateCase.js'
import { addBusinessDays } from '../utils/dateUtils.js'

const ALL_FALLBACKS = [...FALLBACK_CASES, ...FALLBACK_CASE_QUEUE]
let fallbackIndex = 0

const REQUIRED_FIELDS = [
  'caseId', 'caseType', 'clientName', 'defendant',
  'dateFiled', 'dateOfIncident', 'factScenario',
  'claimsAsserted', 'hiddenIssues', 'applicableDefenses',
  'previewFlag', 'hb145Applicable',
]

function validateCaseStructure(obj) {
  for (const field of REQUIRED_FIELDS) {
    if (obj[field] === undefined || obj[field] === null) {
      throw new Error(`Missing required field: ${field}`)
    }
  }
  if (!Array.isArray(obj.claimsAsserted) || obj.claimsAsserted.length === 0) {
    throw new Error('claimsAsserted must be non-empty array')
  }
  if (!Array.isArray(obj.hiddenIssues) || obj.hiddenIssues.length === 0) {
    throw new Error('hiddenIssues must be non-empty array')
  }
  return true
}

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

function buildVarietyPrompt(existingCases) {
  if (!existingCases || existingCases.length === 0) {
    return `Generate a completely unique case. Do not use Palmetto Shores, Marcus Delray, Riverside Park, Officer Dana Whitmore, Suncoast Charter Academy, Priya Nambiar, or any park negligent security scenario.`
  }

  const history = existingCases.map(c => ({
    caseId: c.caseId,
    defendant: c.defendant,
    defendantType: extractMunicipalityType(c.defendant),
    plaintiff: c.clientName,
    caseType: c.caseType,
    incidentType: extractIncidentType(c.factScenario),
    primaryIssue: c.hiddenIssues?.[0]?.issueType,
  }))

  const prohibitedDefendants = existingCases.map(c => c.defendant)
  const prohibitedDefendantTypes = [...new Set(existingCases.map(c => extractMunicipalityType(c.defendant)))]
  const prohibitedIncidentTypes = [...new Set(existingCases.map(c => extractIncidentType(c.factScenario)).filter(Boolean))]
  const prohibitedPlaintiffs = existingCases.map(c => c.clientName)
  const prohibitedIssues = existingCases.map(c => c.hiddenIssues?.[0]?.issueType).filter(Boolean)

  return `
EXISTING CASES — STRICT VARIETY REQUIRED:
${JSON.stringify(history, null, 2)}

YOU ARE STRICTLY PROHIBITED FROM USING:

Prohibited defendants (exact names):
${prohibitedDefendants.map(d => `- ${d}`).join('\n')}

Prohibited defendant types (use a different type):
${prohibitedDefendantTypes.map(t => `- ${t}`).join('\n')}
(If all existing cases use cities, use a county, school board, or special district instead)

Prohibited incident types (use a different incident):
${prohibitedIncidentTypes.length > 0 ? prohibitedIncidentTypes.map(t => `- ${t}`).join('\n') : '(none yet)'}
(If existing cases involve negligent security, use vehicle accident, employment, wrongful arrest, premises defect, or property taking instead)

Prohibited plaintiff names:
${prohibitedPlaintiffs.map(p => `- ${p}`).join('\n')}

Prohibited primary hidden issue types (use a different primary issue):
${prohibitedIssues.length > 0 ? prohibitedIssues.map(i => `- ${i}`).join('\n') : '(none yet)'}

Also NEVER use:
- Palmetto Shores (any variation)
- Riverside Park
- Marcus Delray
- Officer Dana Whitmore
- Any park negligent security at night scenario
- Suncoast Charter Academy
- Priya Nambiar

The new case MUST be meaningfully different from all existing cases on every dimension.`
}

function buildCaseHistory(existingCases) {
  if (!existingCases || existingCases.length === 0) return ''
  const summaries = existingCases.slice(-5).map(c =>
    `- ${c.caseId}: ${c.defendant} (${c.caseType}), incident: ${extractIncidentType(c.factScenario) || 'unspecified'}, plaintiff: ${c.clientName}`
  )
  return `\n\nEXISTING CASES (avoid repeating defendant names, municipality types, or incident types):\n${summaries.join('\n')}`
}

function getFallbackCase(currentDate) {
  const base = ALL_FALLBACKS[fallbackIndex % ALL_FALLBACKS.length]
  fallbackIndex++
  const dateFiled = currentDate
    ? addBusinessDays(currentDate, -Math.floor(Math.random() * 5 + 3))
    : base.dateFiled
  return {
    ...base,
    caseId: `LW-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0')}`,
    dateFiled,
  }
}

export async function generateCase({ caseType = 'state_tort', playerLevel = 1, currentDate, constraints, existingCases }) {
  const system = `You are a case generation engine for a Florida governmental litigation training simulator at the law firm Llopiz Wizel LLP. Generate realistic but entirely fictitious civil cases against Florida municipalities or charter schools. All names, entities, and facts are fictional. Output ONLY valid JSON with no markdown formatting, no code blocks, no explanation. The JSON must match the schema exactly.

LEGAL ACCURACY REQUIREMENTS:
${FL_768_28_FULL}

When embedding hidden issues:
- Apply correct HB 145 provisions based on dateOfIncident vs October 1, 2026
- Set hb145Applicable: true if dateOfIncident is on or after 2026-10-01, else false
- Pre-suit notice window: 18 months if dateOfIncident >= 2026-10-01, else 3 years
- Damages caps: $350k/$500k if dateOfIncident >= 2026-10-01, else $200k/$300k
- SOL: 2 years for negligence, 4 years for other civil actions
- §1983 claims are UNCAPPED — do not apply §768.28(5) caps to federal civil rights claims`

  const varietyPrompt = buildVarietyPrompt(existingCases)

  const constraintsText = constraints ? `

CONSTRAINTS FOR THIS CASE:
${constraints.mustInclude?.length ? `- Must include hidden issues of these types: ${constraints.mustInclude.join(', ')}` : ''}
${constraints.difficulty ? `- Difficulty level: ${constraints.difficulty}/4` : ''}
${constraints.instruction ? `- Specific instruction: ${constraints.instruction}` : ''}` : ''

  const userMessage = `Generate a case of type: ${caseType} for a player at level ${playerLevel}. Today's simulated date is ${currentDate}.

${varietyPrompt}
${constraintsText}

Required JSON schema:
{
  "caseId": "string (format LW-YYYY-NNNN)",
  "caseType": "string",
  "clientName": "string",
  "defendant": "string (Florida municipality or charter school, fictitious)",
  "dateFiled": "string (ISO date, 3-7 days before today)",
  "dateOfIncident": "string (ISO date, 6-18 months before dateFiled)",
  "factScenario": "string (3-5 sentences)",
  "claimsAsserted": ["string"],
  "hiddenIssues": [{"issueType": "string", "description": "string", "severity": "string", "statute": "string", "deadline": "string or null"}],
  "applicableDefenses": ["string"],
  "previewFlag": "string (one vague hint about threshold issue)",
  "hb145Applicable": "boolean (true if dateOfIncident is on or after 2026-10-01)"
}

At level 1: include at minimum one of: barred_individual_defendant, insufficient_presuit_notice, sovereign_immunity_bar.
At level 2+: also include statute_of_limitations or hb145 issues.
At level 3+: may include federal_removal_1983 or admin_exhaustion.
Always make the fact scenario realistic to Florida governmental defense practice.`

  const maxAttempts = 3

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const text = await callClaude({ system, userMessage, maxTokens: 1500 })
      const clean = text.replace(/```json/g, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(clean)
      validateCaseStructure(parsed)

      // Legal accuracy validation
      const validation = await validateCaseLegal(parsed)

      if (validation.isValid && validation.confidenceScore !== 'LOW') {
        return parsed
      }

      if (validation.errors.length === 0 && attempt >= 2) {
        // No hard errors — accept with only warnings
        return parsed
      }

      console.warn(`Case validation attempt ${attempt} failed:`, validation.errors)
    } catch (err) {
      if (attempt >= maxAttempts) {
        return getFallbackCase(currentDate)
      }
    }
  }

  return getFallbackCase(currentDate)
}
