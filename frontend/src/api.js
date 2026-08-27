import axios from 'axios'

const BASE_URL_RAW = import.meta.env.VITE_BASE_URL || 'https://bitbyte-backend-f66f.onrender.com/api/'
const BASE_URL = BASE_URL_RAW.replace(/\/+$/, '')

const api = axios.create({
  baseURL: BASE_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const hasAccessToken = Boolean(localStorage.getItem('token'))

    if (error.response?.status === 401 && !hasAccessToken) {
      return Promise.reject(error)
    }

    // Skip refresh for login and refresh endpoints — no retry
    if (
      original.url?.includes('/login/') ||
      original.url?.includes('/login/refresh/')
    ) {
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh')

        // Refresh token இல்லன்னா — direct logout, no API call
        if (!refresh || refresh === 'null' || refresh === 'undefined') {
          localStorage.clear()
          window.location.href = '/login'
          return Promise.reject(error)
        }

        const res = await axios.post(
          `${BASE_URL}/login/refresh/`,
          { refresh }
        )
        localStorage.setItem('token', res.data.access)
        original.headers.Authorization = `Bearer ${res.data.access}`
        return api(original)

      } catch {
        // Refresh failed → force logout
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }

    // If still 401 after retry → force logout
    if (error.response?.status === 401 && original._retry) {
      localStorage.clear()
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

export default api
