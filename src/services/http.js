import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

export const http = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' }
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('ams_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ams_token')
      localStorage.removeItem('ams_user')
      if (!window.location.hash.includes('/login')) {
        window.location.hash = '#/login'
      }
    }
    return Promise.reject(error)
  }
)

export function apiMessage(err, fallback = 'Something went wrong. Please try again.') {
  return err?.response?.data?.message || fallback
}
