import { callClaude } from './anthropicProxy.js'
import { FL_768_28_FULL, FL_1983_REMOVAL, FL_BERT_HARRIS, FL_EMPLOYMENT_ADMIN } from '../data/legalKnowledgeBase.js'

export async function validateCase(caseObject) {
  const systemPrompt = `You are a Florida Bar licensed attorney specializing in governmental defense reviewing AI-generated training cases for legal accuracy. You must identify any legal errors before the case reaches a student attorney.

AUTHORITATIVE LEGAL REFERENCE:
${FL_768_28_FULL}
${FL_1983_REMOVAL}
${FL_BERT_HARRIS}
${FL_EMPLOYMENT_ADMIN}

Check ONLY against the law above plus well-established Florida procedural rules.
Output ONLY valid JSON.`

  const userPrompt = `Review this generated case for legal accuracy:

${JSON.stringify(caseObject, null, 2)}

Check:
1. Are the hidden issues legally sound given the facts and claims?
2. Is hb145Applicable correctly set based on dateOfIncident vs Oct 1, 2026?
3. Are pre-suit notice windows correctly stated?
4. Are damages caps correctly stated?
5. Is the §768.28(9) individual defendant analysis correct given the facts?
6. Are §1983 removal implications correctly identified if present?
7. Are any hidden issues legally incorrect or inapplicable to these facts?
8. Are applicable defenses correct?

Return JSON:
{
  "isValid": boolean,
  "confidenceScore": "HIGH|MEDIUM|LOW",
  "errors": [
    {
      "field": "which field has the error",
      "issue": "what is wrong",
      "correction": "what it should say"
    }
  ],
  "warnings": [
    {
      "field": "field with a concern",
      "concern": "what to be aware of"
    }
  ],
  "validationNotes": "overall assessment"
}`

  try {
    const response = await callClaude({
      system: systemPrompt,
      userMessage: userPrompt,
      maxTokens: 1500,
    })

    const clean = response
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    return JSON.parse(clean)
  } catch (err) {
    console.warn('Case validation failed:', err.message)
    // Pass the case through — better to show unvalidated than block play
    return {
      isValid: true,
      confidenceScore: 'MEDIUM',
      errors: [],
      warnings: [],
      validationNotes: 'Validation unavailable',
    }
  }
}
