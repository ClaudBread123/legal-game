import { persist } from '../helpers.js'

export function createUiSlice(set, get) {
  return {
    addNotification(message, type = 'info', caseId = null) {
      const state = get()
      const updated = {
        notifications: [
          { id: `notif-${Date.now()}`, message, read: false, type, caseId },
          ...(state.notifications || []),
        ],
      }
      set(updated)
      persist({ ...state, ...updated })
    },

    markNotificationRead(id) {
      const state = get()
      const updated = {
        notifications: state.notifications.map(n => (n.id === id ? { ...n, read: true } : n)),
      }
      set(updated)
      persist({ ...state, ...updated })
    },

    logActivity(message, type = 'action') {
      const state = get()
      const entry = { id: Date.now().toString(), timestamp: state.currentDate, message, type }
      const updated = { activityFeed: [entry, ...state.activityFeed].slice(0, 50) }
      set(updated)
      persist({ ...state, ...updated })
    },

    addToast(message, type = 'info', duration = 4000) {
      const state = get()
      const toast = { id: `toast-${Date.now()}-${Math.random()}`, message, type, duration, createdAt: Date.now() }
      const updated = { toasts: [...(state.toasts || []), toast] }
      set(updated)
      persist({ ...state, ...updated })
    },

    dismissToast(toastId) {
      const state = get()
      const updated = { toasts: (state.toasts || []).filter(t => t.id !== toastId) }
      set(updated)
      persist({ ...state, ...updated })
    },

    spendAction(amount = 1) {
      const state = get()
      const updated = { dailyActionsRemaining: Math.max(0, state.dailyActionsRemaining - amount) }
      set(updated)
      persist({ ...state, ...updated })
    },
  }
}
