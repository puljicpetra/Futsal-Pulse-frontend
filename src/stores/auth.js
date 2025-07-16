import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '@/services/api';

export const useAuthStore = defineStore('auth', () => {
    const token = ref(localStorage.getItem('token'));
    const userRole = ref(localStorage.getItem('userRole'));
    const router = useRouter();

    const isLoggedIn = computed(() => !!token.value);

    function setAuthData(newToken, newRole) {
        token.value = newToken;
        userRole.value = newRole;
        localStorage.setItem('token', newToken);
        localStorage.setItem('userRole', newRole);
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
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        router.push('/login');
    }

    return { token, userRole, isLoggedIn, login, logout };
});