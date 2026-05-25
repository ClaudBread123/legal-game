import { persist, makeEmailId } from '../helpers.js'

export function createEmailSlice(set, get) {
  return {
    addEmail(emailData) {
      const state = get()
      const newEmail = {
        id: makeEmailId(),
        timestamp: state.currentDate,
        read: false,
        responded: false,
        ...emailData,
      }
      const updated = { emails: [newEmail, ...(state.emails || [])] }
      set(updated)
      persist({ ...state, ...updated })
    },

    markEmailRead(emailId) {
      const state = get()
      const updated = {
        emails: (state.emails || []).map(e => e.id === emailId ? { ...e, read: true } : e),
      }
      set(updated)
      persist({ ...state, ...updated })
    },

    addMPMessage(caseId, content) {
      const state = get()
      const msg = {
        id: `mp-${Date.now()}`,
        timestamp: state.currentDate,
        caseId,
        content,
        read: false,
      }
      const updated = { managingPartnerMessages: [msg, ...(state.managingPartnerMessages || [])] }
      set(updated)
      persist({ ...state, ...updated })
    },

    respondToEmail(emailId, optionId, xpAmount, consequence) {
      const state = get()

      const CONSEQUENCE_EFFECTS = {
        mtd_hearing_recovered: 10,
        depo_sequencing_recovered: 8,
        mtd_5min_confirmed: -10,
      }

      const email = (state.emails || []).find(e => e.id === emailId)
      let updatedCases = state.cases

      if (consequence && email?.caseId) {
        const delta = CONSEQUENCE_EFFECTS[consequence]
        if (delta !== undefined) {
          updatedCases = state.cases.map(c =>
            c.caseId === email.caseId
              ? {
                  ...c,
                  caseHealth: Math.max(0, Math.min(100, (c.caseHealth ?? 100) + delta)),
                  caseHealthEvents: [
                    ...(c.caseHealthEvents || []),
                    {
                      date: state.currentDate,
                      event: `Email response: ${consequence}`,
                      impact: delta,
                      description: `Response to: ${email.subject}`,
                      type: delta >= 0 ? 'positive' : 'consequence',
                    },
                  ],
                }
              : c
          )
        }
      }

      const newXP = (state.player?.xp || 0) + (xpAmount || 0)
      const updatedPlayer = { ...state.player, xp: newXP }

      const updated = {
        emails: (state.emails || []).map(e =>
          e.id === emailId ? { ...e, responded: true, responseOptionId: optionId } : e
        ),
        cases: updatedCases,
        player: updatedPlayer,
        activityFeed: [
          {
            id: `email-response-${Date.now()}`,
            timestamp: state.currentDate,
            message: `Email response sent: "${email?.subject || emailId}"`,
            type: 'action',
          },
          ...(state.activityFeed || []),
        ].slice(0, 50),
      }
      set(updated)
      persist({ ...state, ...updated })
    },
  }
}
