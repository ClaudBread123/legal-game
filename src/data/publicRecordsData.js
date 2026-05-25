export const RECORDS_PRODUCED = [
  {
    id: 'prior_incident_report',
    category: 'prior_complaints',
    description: 'Incident report dated 14 months prior — same location, similar circumstances. Agency was aware of dangerous condition.',
    healthImpact: -10,
    note: 'ADVERSE: Prior notice of dangerous condition strengthens plaintiff\'s case. Evaluate impact on sovereign immunity discretionary function analysis.',
  },
  {
    id: 'maintenance_gap',
    category: 'maintenance',
    description: 'Maintenance logs show 8-month gap in required inspections at this location.',
    healthImpact: -8,
    note: 'ADVERSE: Failure to inspect per policy may constitute operational negligence (not protected by discretionary function immunity). Reassess immunity arguments.',
  },
  {
    id: 'clean_maintenance',
    category: 'maintenance',
    description: 'Complete maintenance logs — all required inspections performed on schedule.',
    healthImpact: 8,
    note: 'FAVORABLE: Regular maintenance supports no-notice defense and demonstrates reasonable care.',
  },
  {
    id: 'no_prior_incidents',
    category: 'prior_complaints',
    description: 'No prior incident reports at this location in past 5 years.',
    healthImpact: 10,
    note: 'FAVORABLE: Lack of prior similar incidents supports foreseeability defense — criminal act was not foreseeable.',
  },
  {
    id: 'training_records_complete',
    category: 'training_records',
    description: 'All personnel training records current and complete.',
    healthImpact: 5,
    note: 'FAVORABLE: Supports adequate supervision defense.',
  },
  {
    id: 'training_records_gap',
    category: 'training_records',
    description: 'Training records show involved employee had not completed required annual training.',
    healthImpact: -8,
    note: 'ADVERSE: Training gap may support negligent supervision claim. Evaluate impact on immunity analysis.',
  },
  {
    id: 'surveillance_footage',
    category: 'surveillance',
    description: "Surveillance footage from incident date produced. Footage shows plaintiff's actions immediately before incident.",
    healthImpact: 5,
    note: "Review footage immediately. Plaintiff's own conduct before incident may support comparative negligence defense.",
  },
  {
    id: 'footage_overwritten',
    category: 'surveillance',
    description: 'Agency states surveillance footage from incident date was overwritten per 30-day retention policy.',
    healthImpact: -5,
    note: 'If preservation letter was sent before footage was overwritten: potential spoliation argument. If not: this is why preservation letters must go out immediately.',
  },
  {
    id: 'policies_strong',
    category: 'policies',
    description: 'Policies and procedures in place were comprehensive, current, and followed in this instance.',
    healthImpact: 7,
    note: 'FAVORABLE: Strong policy compliance supports discretionary function immunity and reasonable care arguments.',
  },
  {
    id: 'policies_outdated',
    category: 'policies',
    description: 'Relevant policies had not been updated in 7 years and did not reflect current best practices.',
    healthImpact: -6,
    note: 'ADVERSE: Outdated policies may indicate systemic negligence. Evaluate whether this affects operational immunity analysis.',
  },
]

export function generatePublicRecordsResponse(categories, caseObject) {
  const rand = Math.random()
  const responseType = rand < 0.7 ? 'partial' : rand < 0.9 ? 'denied' : 'delay'

  if (responseType === 'denied') {
    return {
      type: 'denied',
      records: [],
      healthDelta: 0,
      summary: 'Agency claims records exempt under §119.07(1) — active investigation exemption.',
      educationalNote: 'Challenge this. The active investigation exemption is narrow and often improperly invoked. Consider a motion to compel under Chapter 119.',
    }
  }

  if (responseType === 'delay') {
    return {
      type: 'delay',
      records: [],
      healthDelta: 0,
      summary: 'Agency acknowledges request. Production will require additional time due to volume.',
      educationalNote: 'Unreasonable delay is actionable. If production not forthcoming within 30 days, consider filing a mandamus action under §119.11.',
    }
  }

  // Partial production: pick 2-3 records, favor those matching requested categories
  const relevant = RECORDS_PRODUCED.filter(r => categories.includes(r.category))
  const others = RECORDS_PRODUCED.filter(r => !categories.includes(r.category))
  const pool = [...relevant, ...others]

  // Shuffle and pick 2-3
  const shuffled = pool.sort(() => Math.random() - 0.5)
  const count = 2 + Math.floor(Math.random() * 2)
  const selected = shuffled.slice(0, count)

  // Avoid duplicate opposing results (don't pick both clean_maintenance and maintenance_gap)
  const deduplicated = []
  const categoriesSeen = new Set()
  for (const r of selected) {
    const key = `${r.category}_${r.healthImpact > 0 ? 'positive' : 'negative'}`
    if (!categoriesSeen.has(key)) {
      deduplicated.push(r)
      categoriesSeen.add(key)
    }
  }

  const healthDelta = deduplicated.reduce((s, r) => s + r.healthImpact, 0)

  return {
    type: 'partial',
    records: deduplicated,
    healthDelta,
    summary: 'Agency has produced responsive records.',
    educationalNote: null,
  }
}
