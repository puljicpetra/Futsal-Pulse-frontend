import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
    headers: {
        'Content-Type': 'application/json',
    },
})

apiClient.interceptors.request.use(
    (config) => {
        const authStore = useAuthStore()

        if (authStore?.token) {
            if (config.headers && typeof config.headers.set === 'function') {
                config.headers.set('Authorization', `Bearer ${authStore.token}`)
            } else {
                config.headers = config.headers || {}
                config.headers['Authorization'] = `Bearer ${authStore.token}`
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
    (error) => {
        if (error?.response?.status === 401) {
            const authStore = useAuthStore()
            try {
                authStore.logout?.()
            } catch (_) {}
        }
        return Promise.reject(error)
    }
)

export default apiClient
