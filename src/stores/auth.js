import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '@/services/api';
import { jwtDecode } from 'jwt-decode';

export const useAuthStore = defineStore('auth', () => {
    const token = ref(localStorage.getItem('token'));
    const userRole = ref(localStorage.getItem('userRole'));
    
    const userId = ref(token.value ? jwtDecode(token.value).id : null); 
    
    const router = useRouter();

    const isLoggedIn = computed(() => !!token.value);

    function setAuthData(newToken, newRole) {
        const decodedToken = jwtDecode(newToken);
        
        token.value = newToken;
        userRole.value = newRole;
        userId.value = decodedToken.id;
        
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
        userId.value = null;
        
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        router.push('/login');
    }

    return { token, userRole, userId, isLoggedIn, login, logout }; 
});