import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '@/services/api';
import { jwtDecode } from 'jwt-decode';

export const useAuthStore = defineStore('auth', () => {
    const token = ref(localStorage.getItem('token'));
    const userRole = ref(localStorage.getItem('userRole'));
    const userId = ref(token.value ? jwtDecode(token.value).id : null); 
    
    const unreadInvitationCount = ref(0);

    const allNotifications = ref([]);
    const totalUnreadCount = ref(0);
    
    const router = useRouter();

    const isLoggedIn = computed(() => !!token.value);

    async function fetchUnreadInvitationCount() {
        if (!token.value) return;
        try {
            const response = await apiClient.get('/api/notifications/count');
            unreadInvitationCount.value = response.data.count;
        } catch (error) {
            console.error("Failed to fetch invitation count:", error);
            unreadInvitationCount.value = 0; 
        }
    }
    
    async function fetchAllNotifications() {
        if (!token.value) return;
        try {
            const response = await apiClient.get('/api/notifications');
            allNotifications.value = response.data;
            totalUnreadCount.value = response.data.filter(n => !n.isRead).length;
            unreadInvitationCount.value = response.data.filter(n => n.type === 'team_invitation' && !n.isRead).length;
        } catch (error) {
            console.error("Failed to fetch all notifications:", error);
        }
    }

    function setAuthData(newToken, newRole) {
        const decodedToken = jwtDecode(newToken);
        
        token.value = newToken;
        userRole.value = newRole;
        userId.value = decodedToken.id;
        
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
            console.error('Login failed:', error);
            throw error;
        }
    }

    function logout() {
        token.value = null;
        userRole.value = null;
        userId.value = null;
        unreadInvitationCount.value = 0;
        allNotifications.value = [];
        totalUnreadCount.value = 0;
        
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        router.push('/login');
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
        unreadInvitationCount,
        fetchUnreadInvitationCount,
        allNotifications,
        totalUnreadCount,
        fetchAllNotifications
    }; 
});