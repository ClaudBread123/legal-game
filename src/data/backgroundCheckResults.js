export const BACKGROUND_FINDINGS = [
  {
    id: 'prior_lawsuit',
    type: 'favorable',
    finding: 'Plaintiff filed a prior personal injury lawsuit in 2021 (dismissed with prejudice).',
    healthImpact: 5,
    note: 'Prior litigation history affects credibility. Request complete records from prior case immediately via subpoena.',
  },
  {
    id: 'prior_similar_injury',
    type: 'favorable',
    finding: 'Workers compensation claim filed in 2022 for same body part now claimed injured.',
    healthImpact: 10,
    note: 'Prior injury to same body part is critical impeachment. Subpoena all workers comp records immediately. May limit or eliminate claimed damages.',
  },
  {
    id: 'bankruptcy',
    type: 'favorable',
    finding: 'Active Chapter 7 bankruptcy filed 8 months ago.',
    healthImpact: 5,
    note: 'Bankruptcy trustee may have a claim to any recovery. Notify client and carrier. May reduce plaintiff\'s settlement motivation.',
  },
  {
    id: 'felony_conviction',
    type: 'favorable',
    finding: 'Prior felony conviction — fraud, 2019.',
    healthImpact: 8,
    note: 'Felony conviction admissible for impeachment under §90.610, Fla. Stat. Significant credibility impact at trial.',
  },
  {
    id: 'social_security_disability',
    type: 'favorable',
    finding: 'Receiving Social Security Disability benefits since 2023.',
    healthImpact: 7,
    note: 'SSA disability records may contradict claimed injuries or establish pre-existing condition. Subpoena SSA records immediately.',
  },
  {
    id: 'prior_settlements',
    type: 'favorable',
    finding: 'Two prior personal injury settlements found — 2018 and 2020.',
    healthImpact: 8,
    note: 'Pattern of prior claims is powerful impeachment. Request details through interrogatories and subpoenas.',
  },
  {
    id: 'clean_record',
    type: 'neutral',
    finding: 'No prior criminal history found.',
    healthImpact: 0,
    note: null,
  },
  {
    id: 'stable_employment',
    type: 'neutral',
    finding: 'Stable employment history consistent with claimed occupation.',
    healthImpact: 0,
    note: null,
  },
  {
    id: 'military_veteran',
    type: 'adverse',
    finding: 'Decorated military veteran, Purple Heart recipient.',
    healthImpact: -3,
    note: 'High jury sympathy. This plaintiff presents well. Factor into settlement valuation — do not underestimate jury appeal.',
  },
  {
    id: 'community_figure',
    type: 'adverse',
    finding: 'Active community leader — youth sports coach, local charity board member.',
    healthImpact: -5,
    note: 'Strong jury sympathy profile. Adjust settlement range upward accordingly.',
  },
  {
    id: 'sympathetic_family',
    type: 'adverse',
    finding: 'Single parent, three minor children, active social media presence about the incident generating community support.',
    healthImpact: -6,
    note: 'Highly sympathetic plaintiff profile. Documented community support increases settlement pressure significantly.',
  },
]

export const SOCIAL_MEDIA_FINDINGS = [
  {
    id: 'inconsistent_physical_activity',
    type: 'favorable',
    finding: 'Instagram posts from 3 weeks after claimed injury show plaintiff hiking at Jonathan Dickinson State Park.',
    healthImpact: 15,
    note: 'Physical activity inconsistent with claimed injuries is powerful impeachment. Screenshot and preserve immediately. Request native copies in discovery — screenshots alone may be challenged.',
  },
  {
    id: 'inconsistent_statement',
    type: 'favorable',
    finding: 'Facebook post describes the incident differently than the complaint — plaintiff states they were running when they fell.',
    healthImpact: 12,
    note: 'Prior inconsistent statement. Authenticate at deposition. Use to impeach at trial.',
  },
  {
    id: 'gofundme_inconsistency',
    type: 'favorable',
    finding: 'Active GoFundMe campaign describing injuries inconsistent with medical records produced in discovery.',
    healthImpact: 10,
    note: 'Public statements about injuries are discoverable and usable for impeachment. Preserve the page immediately.',
  },
  {
    id: 'employment_posts',
    type: 'favorable',
    finding: 'LinkedIn shows plaintiff accepted new employment 6 weeks after claimed disabling injury.',
    healthImpact: 8,
    note: 'New employment may contradict lost wages and disability claims. Subpoena employment records.',
  },
  {
    id: 'private_accounts',
    type: 'neutral',
    finding: 'All social media accounts set to private.',
    healthImpact: 0,
    note: 'Request relevant content through discovery. Cannot compel production of all private posts but can request content relevant to claimed injuries and activities.',
  },
  {
    id: 'no_social_media',
    type: 'neutral',
    finding: 'No significant social media presence found.',
    healthImpact: 0,
    note: null,
  },
  {
    id: 'strong_public_sympathy',
    type: 'adverse',
    finding: 'Plaintiff has 12,000 Instagram followers and has posted extensively about the incident, generating significant public sympathy and media attention.',
    healthImpact: -8,
    note: 'High public profile increases settlement pressure and jury pool contamination risk. Monitor ongoing posts. Consider venue implications.',
  },
  {
    id: 'legal_commentary',
    type: 'adverse',
    finding: "Plaintiff's posts include commentary from attorneys praising the strength of the case.",
    healthImpact: -5,
    note: 'May indicate plaintiff has been coached on social media presentation. Monitor and preserve.',
  },
]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function selectBackgroundFindings() {
  const neutrals = BACKGROUND_FINDINGS.filter(f => f.type === 'neutral')
  const favorable = shuffle(BACKGROUND_FINDINGS.filter(f => f.type === 'favorable'))
  const adverse = shuffle(BACKGROUND_FINDINGS.filter(f => f.type === 'adverse'))

  const neutral = neutrals[Math.floor(Math.random() * neutrals.length)]
  const count = 2 + Math.floor(Math.random() * 2) // 2 or 3 additional
  const result = [neutral]

  for (let i = 0; i < count; i++) {
    const useFavorable = Math.random() < 0.7
    const pool = useFavorable ? favorable : adverse
    const picked = pool.find(f => !result.some(r => r.id === f.id))
    if (picked) result.push(picked)
  }
  return result
}

export function selectSocialMediaFindings() {
  const shuffled = shuffle(SOCIAL_MEDIA_FINDINGS)
  const count = 2 + Math.floor(Math.random() * 2) // 2 or 3
  const result = []

  for (let i = 0; i < count && shuffled.length > 0; i++) {
    const favorable = shuffled.filter(f => f.type === 'favorable' && !result.some(r => r.id === f.id))
    const other = shuffled.filter(f => f.type !== 'favorable' && !result.some(r => r.id === f.id))
    const useFavorable = Math.random() < 0.6 && favorable.length > 0
    const pool = useFavorable ? favorable : other.length > 0 ? other : favorable
    if (pool.length > 0) result.push(pool[0])
  }
  return result
}
