export const OPPOSING_ATTORNEYS = [
  {
    id: 'thornton',
    name: 'James R. Thornton, Esq.',
    firm: 'Thornton Law Group',
    email: 'j.thornton@thorntonlaw.com',
    style: 'aggressive',
    aggressiveness: 9,
    description: 'Former state AG. Files early, applies constant pressure. Never gives an inch on discovery.',
    signatureStyle: 'Regards,\nJames R. Thornton, Esq.\nThornton Law Group\nCounsel for Plaintiff',
  },
  {
    id: 'vasquez',
    name: 'Maria Elena Vasquez, Esq.',
    firm: 'Vasquez & Associates',
    email: 'm.vasquez@vasquezlaw.com',
    style: 'methodical',
    aggressiveness: 6,
    description: 'Thorough and detail-oriented. Rarely misses a deadline. Strong on brief writing.',
    signatureStyle: 'Very truly yours,\nMaria Elena Vasquez, Esq.\nVasquez & Associates',
  },
  {
    id: 'okafor',
    name: 'Chidi Okafor, Esq.',
    firm: 'Okafor Civil Rights Group',
    email: 'c.okafor@okaforlaw.com',
    style: 'civil_rights_specialist',
    aggressiveness: 8,
    description: '§1983 specialist. Extremely strong on federal issues and qualified immunity arguments. Will push removal aggressively.',
    signatureStyle: 'Respectfully,\nChidi Okafor, Esq.\nOkafor Civil Rights Group',
  },
  {
    id: 'morrison',
    name: 'Sandra Morrison, Esq.',
    firm: 'Morrison & Webb',
    email: 's.morrison@morrisonwebb.com',
    style: 'settlement_focused',
    aggressiveness: 4,
    description: 'Prefers early resolution. Files motions reluctantly. Will negotiate seriously if approached professionally.',
    signatureStyle: 'Best regards,\nSandra Morrison, Esq.\nMorrison & Webb',
  },
  {
    id: 'petrov',
    name: 'Alexander Petrov, Esq.',
    firm: 'Petrov Litigation Group',
    email: 'a.petrov@petrovlit.com',
    style: 'scorched_earth',
    aggressiveness: 10,
    description: 'Files everything. Objects to everything. Never settles early. Will set your MTD for a 5-minute slot if you blink.',
    signatureStyle: 'Alexander Petrov, Esq.\nPetrov Litigation Group',
  },
  {
    id: 'chen',
    name: 'Jennifer Chen, Esq.',
    firm: 'Chen & Partners',
    email: 'j.chen@chenpartners.com',
    style: 'strategic',
    aggressiveness: 7,
    description: 'Picks battles carefully. Very strong on discovery. Will find the weakest point in your defense and attack it.',
    signatureStyle: 'Sincerely,\nJennifer Chen, Esq.\nChen & Partners',
  },
  {
    id: 'washington',
    name: 'Marcus Washington, Esq.',
    firm: 'Washington Civil Law',
    email: 'm.washington@washingtonlaw.com',
    style: 'plaintiff_champion',
    aggressiveness: 8,
    description: 'High profile plaintiff attorney. Media-savvy and jury-focused. Expect press releases if the case is newsworthy.',
    signatureStyle: 'Respectfully submitted,\nMarcus Washington, Esq.\nWashington Civil Law',
  },
  {
    id: 'fitzgerald',
    name: 'Colleen Fitzgerald, Esq.',
    firm: 'Fitzgerald Employment Law',
    email: 'c.fitzgerald@fitzgeraldlaw.com',
    style: 'employment_specialist',
    aggressiveness: 7,
    description: 'Employment and civil rights specialist. FCHR and EEOC expert. Will know every administrative exhaustion argument.',
    signatureStyle: 'Very truly yours,\nColleen Fitzgerald, Esq.\nFitzgerald Employment Law',
  },
  {
    id: 'reyes',
    name: 'Roberto Reyes, Esq.',
    firm: 'Reyes & Morales, P.A.',
    email: 'r.reyes@reyesmorales.com',
    style: 'aggressive',
    aggressiveness: 8,
    description: "Known for aggressive discovery and early deposition notices. Will notice your client's deposition before you notice plaintiff's if you are not paying attention.",
    signatureStyle: 'Regards,\nRoberto Reyes, Esq.\nReyes & Morales, P.A.',
  },
  {
    id: 'park',
    name: 'Grace Park, Esq.',
    firm: 'Park Law Firm',
    email: 'g.park@parklaw.com',
    style: 'methodical',
    aggressiveness: 5,
    description: 'Careful and measured. Strong brief writer. Will respond to every motion with a thorough opposition.',
    signatureStyle: 'Respectfully,\nGrace Park, Esq.\nPark Law Firm',
  },
]

const CASE_TYPE_PREFERENCES = {
  section_1983: ['okafor', 'washington', 'chen'],
  employment: ['fitzgerald', 'washington', 'chen'],
  bert_harris: ['vasquez', 'park', 'chen'],
  state_tort: null,
}

export function assignOpposingAttorney(caseType) {
  const preferred = CASE_TYPE_PREFERENCES[caseType]
  if (preferred) {
    const id = preferred[Math.floor(Math.random() * preferred.length)]
    return OPPOSING_ATTORNEYS.find(a => a.id === id)
  }
  return OPPOSING_ATTORNEYS[Math.floor(Math.random() * OPPOSING_ATTORNEYS.length)]
}
