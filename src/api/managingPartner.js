import { callClaude } from './anthropicProxy.js'

const MP_RESPONSES = {
  barred_individual_defendant: playerName => `${playerName},

Let me be direct with you. When you see an individual officer or employee named as a defendant in a governmental tort case, your first question must always be: was this person acting within the scope of their employment?

Section 768.28(9) of the Florida Statutes is unambiguous — an officer, employee, or agent of the state or any of its subdivisions may not be held personally liable in tort for acts within the scope of their employment, unless they acted in bad faith, with malicious purpose, or in a manner exhibiting wanton and willful disregard of human rights, safety, or property. The exclusive remedy is against the governmental entity itself.

In this case, the individual defendant must be dismissed. Filing a motion to dismiss on this ground immediately is not optional — it is the first thing you do. Failing to assert it early does not mean you waived it forever, but raising it late costs the client money and costs you credibility.

In governmental defense practice, §768.28(9) is as automatic as checking for a statute of limitations. It must be in your muscle memory. I do not want to have this conversation again.

— OL`,

  federal_removal_1983: playerName => `${playerName},

Stop. Before you do anything else on this file, I need you to look at the §1983 claims. Those are civil rights claims under federal law — 42 U.S.C. §1983. The moment you see a §1983 claim in a state court complaint, a clock starts running.

Under 28 U.S.C. §1441, this case is removable to federal district court, and you have thirty days from service of the complaint to file a notice of removal. Thirty days. Not sixty, not ninety — thirty. If that window closes, you have waived removal and you are litigating a federal civil rights case in state court, which is almost never where you want to be.

Federal court gives us qualified immunity arguments, Eleventh Amendment considerations, and a federal judge who handles these cases regularly. The §1983 exposure — unlike state tort claims — is not capped by §768.28(5). Federal civil rights liability is uncapped. That changes the entire calculus.

Evaluate removal immediately on every §1983 case. Count the days from service. It is the first call you make.

— OL`,

  insufficient_presuit_notice: playerName => `${playerName},

The pre-suit notice requirement under §768.28(6) is a condition precedent to maintaining a lawsuit against a governmental entity — not an element of the cause of action, but a gate that must be opened before the plaintiff can walk through the courthouse door.

Under HB 145, effective October 1, 2026, the window for presenting that written notice has been shortened from three years to eighteen months for claims accruing on or after that date. You need to know two things immediately on any governmental tort file: when did the claim accrue, and was proper written notice presented within the applicable window?

If the notice was insufficient — wrong entity, wrong form, untimely — that is grounds for dismissal. The agency must also have denied the claim or allowed six months (now four months under HB 145 for newer claims) to lapse before suit can be filed.

Check it on day one. Every time. This is not optional research — it is the threshold you walk through before you open the case file.

— OL`,

  sovereign_immunity_bar: playerName => `${playerName},

The discretionary function doctrine under §768.28 is where governmental defense cases are actually won or lost, and I want you to understand it precisely.

Florida has waived sovereign immunity for operational-level negligence — the execution of ministerial duties. It has not waived immunity for discretionary, planning-level decisions: the policymaking, the resource allocation, the strategic choices that governments make at the planning level. Those decisions remain immune.

The line is not always obvious. A decision to operate a single park ranger over a large area — that may be a planning-level resource decision, which is immune. The ranger's failure to respond once dispatched — that is operational conduct, potentially not immune. Your job is to find that line and argue it aggressively.

Do not assume that because a governmental entity is named, all its conduct is exposed. Analyze each act alleged and place it on the discretionary/operational spectrum. The ones that fall on the discretionary side belong in your motion to dismiss.

— OL`,

  statute_of_limitations: playerName => `${playerName},

The statute of limitations under §768.28(14) — as codified by HB 145 — is two years for negligence claims against governmental entities, and four years for most other civil actions. This is the threshold you check before you spend a single hour on the merits.

Determine the accrual date. Accrual is typically when the plaintiff knew or should have known of the injury and its cause — not necessarily when the incident occurred. Calculate the deadline from there. If the complaint was filed after the limitations period, that is your motion.

A limitations defense raised late — or not raised at all — is malpractice. It is one of the few defenses that, if waived, cannot be revived. Get it right on intake, every time.

— OL`,

  hb145_cap_applicability: playerName => `${playerName},

HB 145 changed the landscape for governmental tort claims accruing on or after October 1, 2026. The per-person cap under §768.28(5) increased from $200,000 to $350,000, and the per-occurrence cap increased from $300,000 to $500,000.

This affects how we value cases, how we approach mediation, and how we counsel our clients on exposure. But here is the critical nuance: the new caps only apply to causes of action that accrue on or after October 1, 2026. For older claims, the old caps still apply.

You must determine the accrual date on every governmental tort file and apply the correct cap. Getting this wrong — telling a client their maximum exposure is $350,000 when it is actually $200,000, or vice versa — is a serious error that affects settlement strategy, insurance coverage positions, and client counseling.

Also note: §1983 claims are not subject to the sovereign immunity caps at all. Federal civil rights exposure is uncapped. If there is a federal claim in the complaint, the cap analysis only applies to the state tort claims.

— OL`,

  hb145_notice_window: playerName => `${playerName},

HB 145 shortened the pre-suit notice window from three years to eighteen months for claims accruing on or after October 1, 2026. This is a significant change and one that creates a real trap for plaintiff's counsel — and a real defense opportunity for us.

If the plaintiff presented notice outside the eighteen-month window, or failed to present it at all, that is a condition precedent failure. The claim cannot proceed. That is not an affirmative defense to be raised at trial — it is a basis for dismissal at the pleading stage.

Verify the notice on every file: was it presented in writing, to the correct governmental entity, within the applicable window? Was the claim denied, or did the statutory period for agency response expire? If any of these conditions are not met, you have a motion.

Do not skip this step because the complaint looks otherwise solid on the merits. A procedurally barred claim does not get to the merits.

— OL`,

  wrong_venue: playerName => `${playerName},

Venue in actions against governmental entities is governed by §768.28(1). The action must be brought in the county where the cause of action accrued, where the property in litigation is located, or where the agency maintains an office for customary transaction of business.

If the plaintiff filed in the wrong county, that is grounds for a motion to transfer — not dismissal, but transfer. The distinction matters. Evaluate immediately. Venue errors can sometimes be waived if not raised promptly.

— OL`,

  admin_exhaustion: playerName => `${playerName},

Failure to exhaust administrative remedies is a jurisdictional bar in several categories of cases. Employment discrimination claims must be exhausted before the FCHR or EEOC before the circuit court has jurisdiction. Education-related claims under IDEA require administrative hearings first. Some civil rights claims require agency exhaustion as well.

Check whether exhaustion was required for each claim in this complaint. If the plaintiff filed in circuit court without completing the required administrative process, you have a motion to dismiss for lack of subject matter jurisdiction. Jurisdiction defects cannot be waived and can be raised at any time.

— OL`,

  duplicative_counts: playerName => `${playerName},

Duplicative counts asserting the same legal theory against the same defendant are subject to a motion to dismiss or strike under Fla. R. Civ. P. 1.110. This is a housekeeping motion, not a dispositive one — but it matters. Unnecessary counts increase the cost of defense, complicate the jury charge, and give plaintiff's counsel more angles to argue.

Identify and move to strike the redundant counts. Keep the complaint to what plaintiff can actually prove.

— OL`,

  _general: playerName => `${playerName},

I've reviewed the case file. Your issue identification on intake was incomplete. In governmental defense, threshold analysis is not optional work — it is the first work. Every missed issue is a missed opportunity to dismiss a claim, cap exposure, or establish a procedural defense before the case costs the client significant money.

Review §768.28 carefully. Identify every named defendant and evaluate their status under subsection (9). Verify pre-suit notice compliance. Determine whether the applicable HB 145 amendments affect the cap and notice window. If there are federal claims, assess removal immediately.

These are not advanced techniques. They are the baseline. I expect them on every file.

— OL`,
}

const SEVERITY_ORDER = ['critical', 'major', 'minor']

function buildOfflineResponse(playerName, issueEvaluation) {
  const missed = issueEvaluation?.missed || []
  if (missed.length === 0) {
    return `${playerName},

Your issue identification was thorough on intake. That is the baseline expectation, not a distinction. The work now is building the record to support the defenses you have identified.

Push forward on discovery sequencing and get the motion to dismiss on file. I'll expect an update after the hearing is set.

— OL`
  }

  // Sort missed by severity
  const sorted = [...missed].sort((a, b) => {
    const ai = SEVERITY_ORDER.indexOf(a.severity)
    const bi = SEVERITY_ORDER.indexOf(b.severity)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  const TRANSITION = `\n\n* * *\n\n`

  const paragraphs = sorted.map(issue => {
    const fn = MP_RESPONSES[issue.issueId] || MP_RESPONSES._general
    return fn(playerName)
  })

  if (paragraphs.length === 1) return paragraphs[0]

  // For multiple issues: use first paragraph fully, then append abbreviated follow-ups
  const [first, ...rest] = paragraphs
  const restSummaries = rest.map(p => {
    // Take first two sentences of each additional response
    const sentences = p.split('\n\n').slice(1, 3).join('\n\n')
    return sentences
  })

  return [first, ...restSummaries].join(TRANSITION)
}

export async function getMPReview({ caseObject, issueEvaluation, completedActions, playerName }) {
  const system = `You are Onier Llopiz, founding partner of Llopiz Wizel LLP, a Florida firm specializing in governmental defense. You are conducting a case review with your associate ${playerName}. You are direct, experienced, and deeply knowledgeable about Florida governmental tort law, sovereign immunity, §768.28, and the Florida Rules of Civil Procedure. You educate through consequence — you explain not just what was missed, but what will happen because it was missed. You are not cruel, but you are unsparing. You always cite specific statutes and procedural rules. Your reviews are 4-6 paragraphs. Speak directly to the associate by name. Sign off as "— OL".`

  const userMessage = `Review this case with the associate.

Associate name: ${playerName}
Case: ${caseObject.caseId} — ${caseObject.defendant}
Fact scenario: ${caseObject.factScenario}
Claims: ${JSON.stringify(caseObject.claimsAsserted)}
Missed issues: ${JSON.stringify(issueEvaluation?.missed || [])}
Correctly identified: ${JSON.stringify(issueEvaluation?.correctlyIdentified || [])}
Completed actions so far: ${JSON.stringify(completedActions || [])}

Provide a direct, educational case review. Cite specific statutes. Explain the practical consequences of any missed issues.`

  try {
    return await callClaude({ system, userMessage, maxTokens: 900 })
  } catch {
    return buildOfflineResponse(playerName, issueEvaluation)
  }
}
