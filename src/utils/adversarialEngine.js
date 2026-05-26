import { daysBetween } from './dateUtils.js'

function makeId() {
  return `adv-${Date.now()}-${Math.floor(Math.random() * 100000)}`
}

function attyName(attorney) {
  return attorney?.name || "Plaintiff's Counsel"
}

function attyEmail(attorney) {
  return attorney?.email || 'counsel@plaintifflaw.com'
}

function attySignature(attorney) {
  return attorney?.signatureStyle || "Plaintiff's Counsel"
}

// Aggressiveness (1-10) shortens event delays
function aggressiveDelay(attorney, baseDays) {
  const agg = attorney?.aggressiveness ?? 5
  const factor = 1 - (agg - 5) * 0.05
  return Math.max(7, Math.round(baseDays * factor))
}

export function runAdversarialEvents(state) {
  const results = {
    newEmails: [],
    caseUpdates: {},
    newNotifications: [],
    newActivityEntries: [],
    newResolutionItems: [],
    newEventKeys: [],
  }

  const currentDate = state.currentDate
  if (!currentDate) return results

  const fired = new Set(state.generatedEmailEvents || [])

  for (const c of state.cases || []) {
    if (c.status === 'closed' || c.resolutionTriggered) continue

    const attorney = c.opposingAttorney
    const completed = c.completedActions || []
    const timestamps = c.actionTimestamps || {}
    const qualityScores = c.actionQualityScores || {}
    const daysSinceFiling = daysBetween(c.dateFiled, currentDate)
    const health = c.caseHealth ?? 100

    // ── 1. MTD Court Ruling ──────────────────────────────
    if (completed.includes('motion_to_dismiss')) {
      const mtdDate = timestamps.motion_to_dismiss
      if (mtdDate) {
        const daysSinceMTD = daysBetween(mtdDate, currentDate)
        const hearingSet = completed.includes('notice_mtd_hearing')
        const mtdQuality = qualityScores.motion_to_dismiss || 1
        const grantKey = `mtd_granted_${c.caseId}`
        const denyKey = `mtd_denied_${c.caseId}`

        // Grant: hearing set, quality ≥ 2, 35+ days
        if (hearingSet && mtdQuality >= 2 && daysSinceMTD >= 35 && !fired.has(grantKey)) {
          results.newEmails.push({
            key: grantKey,
            caseId: c.caseId,
            email: {
              id: makeId(),
              timestamp: currentDate,
              read: false,
              responded: false,
              caseId: c.caseId,
              from: 'Onier Llopiz',
              fromEmail: 'o.llopiz@llopizwizel.com',
              subject: `Motion to Dismiss GRANTED — ${c.caseId}`,
              priority: 'urgent',
              body: `${state.player?.name || 'Associate'},

The court has granted our Motion to Dismiss in ${c.caseId}. Your argument was well-prepared and properly set for hearing.

${mtdQuality === 3 ? 'The court found all threshold grounds meritorious. This is an exceptional result.' : 'The court found the primary immunity grounds meritorious.'}

The case will be dismissed with prejudice. Onier Llopiz will contact the client directly to confirm.

Well done.

— OL`,
              adversarialImpact: {
                healthChange: 25,
                severity: 'positive',
                actionRequired: null,
              },
            },
          })
          results.caseUpdates[c.caseId] = {
            ...results.caseUpdates[c.caseId],
            caseHealth: Math.min(100, health + 25),
            mtdGranted: true,
          }
          results.newNotifications.push({
            id: `mtd-granted-${Date.now()}`,
            message: `${c.caseId}: Motion to Dismiss GRANTED — case resolved!`,
            read: false,
            type: 'info',
            caseId: c.caseId,
          })
          results.newEventKeys.push(grantKey)
        }

        // Deny: no hearing after aggressiveness-adjusted delay
        const denyDelay = aggressiveDelay(attorney, 21)
        if (!hearingSet && daysSinceMTD >= denyDelay && !fired.has(grantKey) && !fired.has(denyKey)) {
          results.newEmails.push({
            key: denyKey,
            caseId: c.caseId,
            email: {
              id: makeId(),
              timestamp: currentDate,
              read: false,
              responded: false,
              caseId: c.caseId,
              from: 'Onier Llopiz',
              fromEmail: 'o.llopiz@llopizwizel.com',
              subject: `Motion to Dismiss Denied — ${c.caseId}`,
              priority: 'urgent',
              body: `${state.player?.name || 'Associate'},

The Motion to Dismiss in ${c.caseId} was denied. I have reviewed the record.

The motion was never set for hearing. A motion to dismiss in a governmental immunity case must be set for adequate hearing time — 30 minutes minimum. Without a hearing, this motion was denied on the papers.

The grounds are not entirely lost — some can be raised at summary judgment. But we have lost the early exit, and the client is now committed to full discovery.

Case health is compromised. I need a revised litigation plan immediately.

— OL`,
              adversarialImpact: {
                healthChange: -20,
                severity: 'critical',
                actionRequired: 'Immunity grounds can still be raised at summary judgment — begin discovery immediately.',
              },
            },
          })
          results.caseUpdates[c.caseId] = {
            ...results.caseUpdates[c.caseId],
            caseHealth: Math.max(0, health - 20),
            mtdDenied: true,
          }
          results.newEventKeys.push(denyKey)
        }
      }
    }

    // ── 2. RFAs Deemed Admitted ──────────────────────────
    if (c.rfaDeadline && currentDate > c.rfaDeadline && !completed.includes('respond_to_discovery')) {
      const rfaKey = `rfa_deemed_${c.caseId}`
      if (!fired.has(rfaKey)) {
        results.newEmails.push({
          key: rfaKey,
          caseId: c.caseId,
          email: {
            id: makeId(),
            timestamp: currentDate,
            read: false,
            responded: false,
            caseId: c.caseId,
            from: 'Onier Llopiz',
            fromEmail: 'o.llopiz@llopizwizel.com',
            subject: `RFAs Deemed Admitted — ${c.caseId}`,
            priority: 'urgent',
            body: `${state.player?.name || 'Associate'},

I have just been informed that plaintiff's Requests for Admissions in ${c.caseId} were not answered within 30 days. They are now deemed admitted under Rule 1.370.

Do you understand what this means? Plaintiff has now established — by our own silence — facts that support their case. We can file a motion for relief from the admissions but courts grant those sparingly and only on a showing of good cause.

This is the kind of error that ends careers. I am scheduling an immediate case review.

— OL`,
            adversarialImpact: {
              healthChange: -30,
              severity: 'critical',
              actionRequired: 'File motion for relief from admissions under Rule 1.370 — requires showing of good cause.',
            },
          },
        })
        results.caseUpdates[c.caseId] = {
          ...results.caseUpdates[c.caseId],
          caseHealth: Math.max(0, health - 30),
          rfaDeemedAdmitted: true,
        }
        results.newNotifications.push({
          id: `rfa-deemed-${Date.now()}`,
          message: `${c.caseId}: RFAs deemed admitted — case seriously compromised.`,
          read: false,
          type: 'warning',
          caseId: c.caseId,
        })
        results.newEventKeys.push(rfaKey)
      }
    }

    // ── 3. Plaintiff Files MSJ (health < 40, 60+ days) ──
    if (health < 40 && daysSinceFiling >= 60) {
      const msjKey = `plaintiff_msj_${c.caseId}`
      if (!fired.has(msjKey)) {
        const attackDelay = aggressiveDelay(attorney, 0)
        if (daysSinceFiling >= 60 + attackDelay) {
          results.newEmails.push({
            key: msjKey,
            caseId: c.caseId,
            email: {
              id: makeId(),
              timestamp: currentDate,
              read: false,
              responded: false,
              caseId: c.caseId,
              from: attyName(attorney),
              fromEmail: attyEmail(attorney),
              subject: `Notice of Filing Motion for Summary Judgment — ${c.caseId}`,
              priority: 'urgent',
              body: `Counsel,

Please be advised that Plaintiff has this date filed a Motion for Summary Judgment in the above-referenced matter, arguing that there are no genuine issues of material fact in dispute and that judgment should be entered in Plaintiff's favor as a matter of law.

Your response is due pursuant to the deadline established in the Court's Trial Order. Under Florida Rule of Civil Procedure 1.510 (as amended May 1, 2021 adopting the federal Celotex standard), summary judgment shall be granted if the movant shows there is no genuine dispute as to any material fact and the movant is entitled to judgment as a matter of law.

${attySignature(attorney)}`,
              requiresResponse: true,
              responseDeadlineGameDays: 5,
              responseOptions: [
                {
                  id: 'oppose_msj',
                  label: 'File opposition to MSJ',
                  text: 'Defendant will timely file a response in opposition to Plaintiff\'s Motion for Summary Judgment demonstrating that genuine issues of material fact remain in dispute.',
                  consequence: null,
                  xp: 20,
                },
                {
                  id: 'seek_extension',
                  label: 'Request 30-day extension',
                  text: 'Defendant requests a 30-day extension to respond to Plaintiff\'s Motion for Summary Judgment in order to complete necessary discovery.',
                  consequence: null,
                  xp: 10,
                },
              ],
              adversarialImpact: {
                healthChange: 0,
                severity: 'urgent',
                actionRequired: 'File opposition to plaintiff\'s MSJ within 20 days under Fla. R. Civ. P. 1.510.',
              },
            },
          })
          results.caseUpdates[c.caseId] = {
            ...results.caseUpdates[c.caseId],
            plaintiffMSJFiled: true,
          }
          results.newNotifications.push({
            id: `plaintiff-msj-${Date.now()}`,
            message: `${c.caseId}: Plaintiff has filed MSJ — immediate response required.`,
            read: false,
            type: 'warning',
            caseId: c.caseId,
          })
          results.newEventKeys.push(msjKey)
        }
      }
    }

    // ── 4. Expert Excluded (180+ days, no identify_expert) ─
    if (daysSinceFiling >= 180 && !completed.includes('identify_expert')) {
      const expertKey = `expert_excluded_${c.caseId}`
      if (!fired.has(expertKey)) {
        results.newEmails.push({
          key: expertKey,
          caseId: c.caseId,
          email: {
            id: makeId(),
            timestamp: currentDate,
            read: false,
            responded: false,
            caseId: c.caseId,
            from: 'Onier Llopiz',
            fromEmail: 'o.llopiz@llopizwizel.com',
            subject: `URGENT: Expert Disclosure Deadline Passed — ${c.caseId}`,
            priority: 'urgent',
            body: `${state.player?.name || 'Associate'},

The defendant expert disclosure deadline in ${c.caseId} has passed. No expert has been identified or retained on this file.

Plaintiff's counsel has filed a motion to exclude any expert witnesses defendant may attempt to call. That motion will likely be granted.

Without expert testimony, proceeding to summary judgment or trial in this type of case is extremely difficult.

I need to meet with you today. This must be reported to the client immediately.

— OL`,
            adversarialImpact: {
              healthChange: -25,
              severity: 'critical',
              actionRequired: 'Explore late expert retention — court must grant leave; show excusable neglect.',
            },
          },
        })
        results.caseUpdates[c.caseId] = {
          ...results.caseUpdates[c.caseId],
          caseHealth: Math.max(0, health - 25),
          expertExcluded: true,
        }
        results.newEventKeys.push(expertKey)
      }
    }

    // ── 5. Federal Removal Waived (§1983, 30+ days, no action) ─
    if (c.caseType === 'section_1983' && daysSinceFiling >= 30) {
      const removalKey = `removal_waived_${c.caseId}`
      if (!fired.has(removalKey) && !completed.includes('file_notice_removal')) {
        results.newEmails.push({
          key: removalKey,
          caseId: c.caseId,
          email: {
            id: makeId(),
            timestamp: currentDate,
            read: false,
            responded: false,
            caseId: c.caseId,
            from: 'Onier Llopiz',
            fromEmail: 'o.llopiz@llopizwizel.com',
            subject: `Federal Removal Deadline Passed — ${c.caseId}`,
            priority: 'high',
            body: `${state.player?.name || 'Associate'},

The 30-day window to remove ${c.caseId} to federal district court has closed. I see no Notice of Removal in the file.

This case contains claims under 42 U.S.C. §1983. Federal court was the correct venue — qualified immunity arguments, Eleventh Amendment considerations, and a more favorable procedural environment are now unavailable to us.

We are now committed to state court. Adjust the litigation strategy accordingly. I want to discuss this at your earliest availability.

— OL`,
          },
        })
        results.newEventKeys.push(removalKey)
      }
    }

    // ── 6. Settlement Demand (aggressive attorneys, 90+ days) ─
    const settlementDelay = aggressiveDelay(attorney, 90)
    if (daysSinceFiling >= settlementDelay && (attorney?.style === 'settlement_focused' || daysSinceFiling >= 110)) {
      const settleKey = `settlement_demand_${c.caseId}`
      if (!fired.has(settleKey)) {
        const demandAmount = health >= 60 ? '$50,000' : health >= 40 ? '$150,000' : '$250,000'
        results.newEmails.push({
          key: settleKey,
          caseId: c.caseId,
          email: {
            id: makeId(),
            timestamp: currentDate,
            read: false,
            responded: false,
            caseId: c.caseId,
            from: attyName(attorney),
            fromEmail: attyEmail(attorney),
            subject: `Settlement Demand — ${c.caseId}`,
            priority: 'high',
            body: `Counsel,

On behalf of my client in the above-referenced matter, I am authorized to convey a settlement demand of ${demandAmount} inclusive of attorneys' fees and costs. This offer is open for 30 days.

Please convey this demand to your client and carrier for consideration.

${attySignature(attorney)}`,
            requiresResponse: true,
            responseDeadlineGameDays: 7,
            responseOptions: [
              {
                id: 'convey_to_client',
                label: 'Convey to client — no position yet',
                text: 'We acknowledge receipt of your settlement demand and will convey it to our client and carrier for evaluation. We will respond within 30 days.',
                consequence: null,
                xp: 10,
              },
              {
                id: 'counter_offer',
                label: 'Counter with lower offer',
                text: 'While we have conveyed your demand to our client, the current offer significantly exceeds our client\'s assessed exposure in light of the applicable statutory caps and immunity arguments. We will propose a counter.',
                consequence: null,
                xp: 15,
              },
              {
                id: 'reject',
                label: 'Reject — no basis for liability',
                text: "Our client rejects plaintiff's settlement demand. We continue to maintain that there is no basis for liability in this matter.",
                consequence: null,
                xp: 5,
              },
            ],
          },
        })
        results.newEventKeys.push(settleKey)
      }
    }
  }

  return results
}
