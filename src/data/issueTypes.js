export const HB_145_EFFECTIVE_DATE = '2026-10-01'
export const TORT_CAP_SINGLE_OLD = 200000
export const TORT_CAP_SINGLE_NEW = 350000
export const TORT_CAP_OCCURRENCE_OLD = 300000
export const TORT_CAP_OCCURRENCE_NEW = 500000
export const PRE_SUIT_WINDOW_OLD_YEARS = 3
export const PRE_SUIT_WINDOW_NEW_MONTHS = 18
export const SOL_NEGLIGENCE_YEARS = 2
export const SOL_OTHER_YEARS = 4
export const AGENCY_DISPOSITION_OLD_MONTHS = 6
export const AGENCY_DISPOSITION_NEW_MONTHS = 4
export const BILLING_RATE = 250

export const ISSUE_TYPES = [
  {
    id: 'barred_individual_defendant',
    label: 'Barred Individual Defendant',
    statute: '§768.28(9), Fla. Stat.',
    description:
      'Officer/employee named individually but acted within scope of employment without bad faith, malice, or wanton conduct. Claim against individual is barred; exclusive remedy is against the governmental entity.',
    severity_hint: 'critical',
  },
  {
    id: 'insufficient_presuit_notice',
    label: 'Insufficient Pre-Suit Notice',
    statute: '§768.28(6), Fla. Stat.',
    description:
      'Claim against state/agency requires written notice presented within 18 months of accrual (for claims accruing on/after Oct 1, 2026) or 3 years (pre-Oct 1, 2026). Failure is a condition precedent to suit.',
    severity_hint: 'critical',
  },
  {
    id: 'sovereign_immunity_bar',
    label: 'Sovereign Immunity — Discretionary Function',
    statute: '§768.28, Fla. Stat.',
    description:
      'Governmental entity retains immunity for discretionary, planning-level decisions. Operational-level negligence may waive immunity; planning-level does not.',
    severity_hint: 'major',
  },
  {
    id: 'statute_of_limitations',
    label: 'Statute of Limitations',
    statute: '§768.28(14), Fla. Stat. (HB 145)',
    description:
      'Negligence claims against governmental entities: 2 years. Other actions: 4 years. HB 145 effective Oct 1, 2026 codifies these explicitly. Check accrual date.',
    severity_hint: 'critical',
  },
  {
    id: 'wrong_venue',
    label: 'Wrong Venue',
    statute: '§768.28(1), Fla. Stat.',
    description:
      'Action must be brought where property is located or where agency has office for customary business in county where cause accrued. State university actions must be in county of main campus or accrual.',
    severity_hint: 'major',
  },
  {
    id: 'duplicative_counts',
    label: 'Duplicative / Redundant Counts',
    statute: 'Fla. R. Civ. P. 1.110',
    description:
      'Multiple counts asserting the same legal theory against the same defendant under different labels. Subject to motion to dismiss or strike as redundant.',
    severity_hint: 'minor',
  },
  {
    id: 'federal_removal_1983',
    label: 'Federal Jurisdiction / §1983 Removal Trigger',
    statute: '42 U.S.C. §1983; 28 U.S.C. §1441',
    description:
      'Claims under 42 U.S.C. §1983 (civil rights under color of state law) create federal question jurisdiction. Case may be removed to federal district court. Evaluate whether removal benefits the defense.',
    severity_hint: 'critical',
  },
  {
    id: 'admin_exhaustion',
    label: 'Failure to Exhaust Administrative Remedies',
    statute: 'Various — FCHR, DOAH, IDEA',
    description:
      'Employment discrimination, administrative education, and some civil rights claims require exhaustion before FCHR, EEOC, or DOAH before circuit court jurisdiction attaches.',
    severity_hint: 'major',
  },
  {
    id: 'hb145_cap_applicability',
    label: 'HB 145 Cap Applicability (Post Oct 1, 2026)',
    statute: '§768.28(5), Fla. Stat. as amended by HB 145',
    description:
      'For causes of action accruing on or after Oct 1, 2026: per-person cap is $350,000; per-occurrence cap is $500,000. Pre-Oct 1, 2026 accrual: $200,000/$300,000. Correct cap affects settlement valuation and defense strategy.',
    severity_hint: 'major',
  },
  {
    id: 'hb145_notice_window',
    label: 'HB 145 Pre-Suit Notice Window',
    statute: '§768.28(6)(a), Fla. Stat. as amended by HB 145',
    description:
      'HB 145 shortened the pre-suit notice window from 3 years to 18 months for claims accruing on/after Oct 1, 2026. A claim presented outside this window is untimely and bars suit.',
    severity_hint: 'critical',
  },
]
