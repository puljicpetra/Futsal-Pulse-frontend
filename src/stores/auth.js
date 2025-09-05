import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '@/services/api'
import { jwtDecode } from 'jwt-decode'

const decodeJwt = (t) => {
    if (!t) return null
    try {
        return jwtDecode(t)
    } catch {
        return null
    }
}
const isExpired = (t) => {
    const d = decodeJwt(t)
    if (!d?.exp) return false
    const nowSec = Math.floor(Date.now() / 1000)
    return d.exp <= nowSec
}

export const useAuthStore = defineStore('auth', () => {
    const token = ref(localStorage.getItem('token'))
    const userRole = ref(localStorage.getItem('userRole'))

    const decoded = computed(() => decodeJwt(token.value))
    const userId = computed(() => decoded.value?.id || null)
    const roleFromToken = computed(() => decoded.value?.role || null)

    const isLoggedIn = computed(() => !!token.value && !isExpired(token.value))
    const isOrganizer = computed(() => (userRole.value || roleFromToken.value) === 'organizer')
    const isPlayer = computed(() => (userRole.value || roleFromToken.value) === 'player')

    const unreadInvitationCount = ref(0)
    const allNotifications = ref([])
    const totalUnreadCount = ref(0)

    const router = useRouter()

    async function fetchAllNotifications() {
        if (!isLoggedIn.value) return
        try {
            const { default: api } = await import('@/services/api')
            const { data } = await api.get('/api/notifications')
            allNotifications.value = data
            totalUnreadCount.value = data.filter((n) => !n.isRead).length
            unreadInvitationCount.value = data.filter(
                (n) => n.type === 'team_invitation' && !n.isRead
            ).length
        } catch (e) {
            console.error('Failed to fetch all notifications:', e)
        }
    }

    function setAuthData(newToken, newRole) {
        token.value = newToken
        userRole.value = newRole || roleFromToken.value || null

        localStorage.setItem('token', newToken)
        if (userRole.value) localStorage.setItem('userRole', userRole.value)

        fetchAllNotifications()
    }

    async function login(username, password) {
        const res = await apiClient.post('/auth/login', { username, password })
        setAuthData(res.data.jwt_token, res.data.role)

        const redirect = router.currentRoute.value.query.redirect || '/'
        router.push(String(redirect) || '/')
    }

    async function register(userData) {
        const response = await apiClient.post('/auth/register', userData)
        return response
    }

    function hardResetLocal() {
        token.value = null
        userRole.value = null
        unreadInvitationCount.value = 0
        allNotifications.value = []
        totalUnreadCount.value = 0
        localStorage.removeItem('token')
        localStorage.removeItem('userRole')
    }

    async function logout() {
        hardResetLocal()
        try {
            await router.push('/login')
        } catch (e) {
            console.error('Router error on logout:', e)
            window.location.pathname = '/login'
        }
    }

    if (token.value && isExpired(token.value)) {
        hardResetLocal()
    } else if (token.value) {
        fetchAllNotifications()
    }

    return {
        token,
        userRole,
        userId,
        isLoggedIn,
        isOrganizer,
        isPlayer,
        login,
        logout,
        register,
        unreadInvitationCount,
        allNotifications,
        totalUnreadCount,
        fetchAllNotifications,
    }
})
