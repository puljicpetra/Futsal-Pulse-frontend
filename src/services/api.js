import axios from 'axios'

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
    headers: { 'Content-Type': 'application/json' },
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
        if (error?.response?.status === 401) {
            try {
                const { useAuthStore } = await import('@/stores/auth')
                const authStore = useAuthStore()
                authStore.logout?.()
            } catch {
                localStorage.removeItem('token')
                localStorage.removeItem('userRole')
                try {
                    const { default: router } = await import('@/router')
                    router.push('/login')
                } catch {
                    window.location.pathname = '/login'
                }
            }
        }
        return Promise.reject(error)
    }
)

export default apiClient
