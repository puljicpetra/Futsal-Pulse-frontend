import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '@/services/api';
import { jwtDecode } from 'jwt-decode';

const safeJwtDecode = (token) => {
    if (!token) return null;
    try {
        return jwtDecode(token);
    } catch (error) {
        console.error("Failed to decode token:", error);
        return null;
    }
};

export const useAuthStore = defineStore('auth', () => {
    const token = ref(localStorage.getItem('token'));
    const userRole = ref(localStorage.getItem('userRole'));
    const decodedTokenData = computed(() => safeJwtDecode(token.value));
    const userId = computed(() => decodedTokenData.value?.id || null);

    const unreadInvitationCount = ref(0);
    const allNotifications = ref([]);
    const totalUnreadCount = ref(0);
    
    const router = useRouter();

    const isLoggedIn = computed(() => !!token.value);

    async function fetchAllNotifications() {
        if (!isLoggedIn.value) return;
        try {
            const { default: api } = await import('@/services/api');
            const { data } = await api.get('/api/notifications');
            allNotifications.value = data;
            totalUnreadCount.value = data.filter(n => !n.isRead).length;
            unreadInvitationCount.value = data.filter(n => n.type === 'team_invitation' && !n.isRead).length;
        } catch (e) {
            console.error('Failed to fetch all notifications:', e);
        }
    }

    function setAuthData(newToken, newRole) {
        token.value = newToken;
        userRole.value = newRole;
        
        localStorage.setItem('token', newToken);
        localStorage.setItem('userRole', newRole);
        
        fetchAllNotifications();
    }

    async function login(username, password) {
        try {
            const res = await apiClient.post('/auth/login', { username, password });
            setAuthData(res.data.jwt_token, res.data.role);
            router.push('/');
        } catch (error) {
            console.error('Login failed in authStore:', error);
            throw error;
        }
    }

    async function register(userData) {
        try {
            const response = await apiClient.post('/auth/register', userData);
            return response;
        } catch (error) {
            console.error('Registration failed in authStore:', error);
            throw error;
        }
    }

    function logout() {
        token.value = null;
        userRole.value = null;
        unreadInvitationCount.value = 0;
        allNotifications.value = [];
        totalUnreadCount.value = 0;
        
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        
        try {
            router.push('/login');
        } catch(e) {
            console.error("Router error on logout:", e)
            window.location.pathname = '/login';
        }
    }

    if(token.value) {
        fetchAllNotifications();
    }

    return { 
        token, 
        userRole, 
        userId, 
        isLoggedIn, 
        login, 
        logout,
        register,
        unreadInvitationCount,
        allNotifications,
        totalUnreadCount,
        fetchAllNotifications
    }; 
});