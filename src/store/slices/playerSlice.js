import { persist, buildPromotionUpdate } from '../helpers.js'
import { checkPromotionEligibility } from '../../utils/scoring.js'

export function createPlayerSlice(set, get) {
  return {
    addXP(amount, reason) {
      const state = get()
      const newXP = state.player.xp + amount
      const updatedPlayer = { ...state.player, xp: newXP }
      const promo = buildPromotionUpdate(updatedPlayer, state.currentDate)

      const feedEntry = {
        id: Date.now().toString(),
        timestamp: state.currentDate,
        message: promo
          ? `+${amount} XP — ${reason}. PROMOTED TO ${promo.newTitle}!`
          : `+${amount} XP — ${reason}`,
        type: 'xp',
      }

      const finalPlayer = promo
        ? { ...updatedPlayer, title: promo.newTitle, salary: promo.newSalary, level: promo.newLevel }
        : { ...updatedPlayer, title: checkPromotionEligibility(updatedPlayer).title }

      const updated = {
        player: finalPlayer,
        activityFeed: [feedEntry, ...state.activityFeed].slice(0, 50),
      }

      if (promo) {
        updated.notifications = [promo.promoNotification, ...(state.notifications || [])]
        updated.emails = [promo.promoEmail, ...(state.emails || [])]
      }

      set(updated)
      persist({ ...state, ...updated })
    },

    updatePlayer(updates) {
      const state = get()
      const updated = { player: { ...state.player, ...updates } }
      set(updated)
      persist({ ...state, ...updated })
    },
  }
}
