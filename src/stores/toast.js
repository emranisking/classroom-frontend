import { defineStore } from 'pinia'

let nextId = 1

export const useToastStore = defineStore('toast', {
  state: () => ({
    toasts: []
  }),
  actions: {
    push(message, type = 'info', duration = 3500) {
      const id = nextId++
      this.toasts.push({ id, message, type })
      setTimeout(() => this.dismiss(id), duration)
    },
    success(message) { this.push(message, 'success') },
    error(message) { this.push(message, 'error') },
    info(message) { this.push(message, 'info') },
    dismiss(id) {
      this.toasts = this.toasts.filter(t => t.id !== id)
    }
  }
})
