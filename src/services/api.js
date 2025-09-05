import axios from 'axios'

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

let isHandlingAuthError = false

const apiClient = axios.create({
    baseURL: apiBase,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    timeout: 10000,
})

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            if (config.headers && typeof config.headers.set === 'function') {
                config.headers.set('Authorization', `Bearer ${token}`)
            } else {
                config.headers = config.headers || {}
                config.headers['Authorization'] = `Bearer ${token}`
            }
        }

        const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData
        if (isFormData) {
            if (config.headers && typeof config.headers.delete === 'function') {
                config.headers.delete('Content-Type')
            } else if (config.headers) {
                delete config.headers['Content-Type']
            }
        }

        return config
    },
    (error) => Promise.reject(error)
)

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error?.response?.status
        if ((status === 401 || status === 403) && !isHandlingAuthError) {
            isHandlingAuthError = true
            try {
                const { useAuthStore } = await import('@/stores/auth')
                const auth = useAuthStore?.()
                if (auth?.logout) {
                    await auth.logout()
                } else {
                    localStorage.removeItem('token')
                    localStorage.removeItem('userRole')
                    try {
                        const { default: router } = await import('@/router')
                        router.push('/login')
                    } catch {
                        window.location.pathname = '/login'
                    }
                }
            } finally {
                setTimeout(() => (isHandlingAuthError = false), 300)
            }
        }
        return Promise.reject(error)
    }
)

export async function listTournamentReviews(tournamentId, { page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams()
    if (page) params.set('page', String(page))
    if (limit) params.set('limit', String(limit))
    const qs = params.toString()
    const { data } = await apiClient.get(
        `/api/tournaments/${tournamentId}/reviews${qs ? `?${qs}` : ''}`
    )
    return data
}

export async function upsertTournamentReview(tournamentId, { rating, comment }) {
    const payload = { rating, comment }
    const { data } = await apiClient.post(`/api/tournaments/${tournamentId}/reviews`, payload)
    return data
}

export async function deleteTournamentReview(reviewId) {
    const { data } = await apiClient.delete(`/api/reviews/${reviewId}`)
    return data
}

export default apiClient
