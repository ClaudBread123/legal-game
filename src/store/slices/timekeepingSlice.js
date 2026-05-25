import { persist, buildPromotionUpdate } from '../helpers.js'
import { BILLING_RATE } from '../../data/issueTypes.js'

export function createTimekeepingSlice(set, get) {
  return {
    billTime(caseId, hours, description) {
      const state = get()
      const amount = hours * BILLING_RATE
      const dateKey = state.currentDate
      const existingEntries = state.timekeepingEntries[dateKey] || []
      const newEntry = { id: `tk-${Date.now()}`, caseId, description, hours, amount }

      const updatedPlayer = {
        ...state.player,
        totalBillableHours: (state.player.totalBillableHours || 0) + hours,
      }
      const promo = buildPromotionUpdate(updatedPlayer, state.currentDate)

      const updated = {
        player: promo
          ? { ...updatedPlayer, title: promo.newTitle, salary: promo.newSalary, level: promo.newLevel }
          : updatedPlayer,
        cases: state.cases.map(c =>
          c.caseId === caseId
            ? { ...c, hoursBilled: (c.hoursBilled || 0) + hours, amountBilled: (c.amountBilled || 0) + amount }
            : c
        ),
        timekeepingEntries: {
          ...state.timekeepingEntries,
          [dateKey]: [...existingEntries, newEntry],
        },
        monthlyBillableHours: state.monthlyBillableHours + hours,
      }

      if (promo) {
        updated.notifications = [promo.promoNotification, ...(state.notifications || [])]
        updated.emails = [promo.promoEmail, ...(state.emails || [])]
      }

      set(updated)
      persist({ ...state, ...updated })
    },

    submitTimekeeping(date) {
      const state = get()
      const updated = {
        timekeepingSubmitted: { ...state.timekeepingSubmitted, [date]: true },
      }
      set(updated)
      persist({ ...state, ...updated })
    },
  }
}
