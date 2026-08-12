import { defineStore } from 'pinia'
import { AuthAPI } from '@/services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('ams_token') || null,
    user: JSON.parse(localStorage.getItem('ams_user') || 'null')
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    role: (state) => state.user?.role || null,
    isAdmin: (state) => state.user?.role === 'Admin',
    isTeacher: (state) => state.user?.role === 'Teacher',
    isStudent: (state) => state.user?.role === 'Student',
    initials: (state) => {
      const name = state.user?.name || ''
      return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?'
    }
  },
  actions: {
    async login(email, password) {
      const res = await AuthAPI.login({ email, password })
      const { accessToken, user } = res.data.data
      this.token = accessToken
      this.user = user
      localStorage.setItem('ams_token', accessToken)
      localStorage.setItem('ams_user', JSON.stringify(user))
      return user
    },
    async register(name, email, password) {
      const res = await AuthAPI.register({ name, email, password })
      return res.data.data
    },
    async fetchMe() {
      const res = await AuthAPI.me()
      this.user = res.data.data
      localStorage.setItem('ams_user', JSON.stringify(this.user))
      return this.user
    },
    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('ams_token')
      localStorage.removeItem('ams_user')
    }
  }
})
