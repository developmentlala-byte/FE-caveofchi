import { defineStore } from 'pinia'

const SIDEBAR_PINNED_STORAGE_KEY = 'mahalu-sidebar-pinned'

export const useSidebarStore = defineStore('sidebar', {
  state: () => ({
    isPinned: true,
  }),
  actions: {
    restorePinnedState() {
      if (typeof window === 'undefined') return

      const savedState = window.localStorage.getItem(
        SIDEBAR_PINNED_STORAGE_KEY,
      )
      if (savedState === 'true') this.isPinned = true
      if (savedState === 'false') this.isPinned = false
    },
    togglePinned() {
      this.setPinned(!this.isPinned)
    },
    setPinned(isPinned: boolean) {
      this.isPinned = isPinned
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          SIDEBAR_PINNED_STORAGE_KEY,
          String(isPinned),
        )
      }
    },
  },
})
