<template>
    <div class="login-wrapper">
        <div class="glass-container">
            <div class="login-box">
                <h2>Login</h2>
                <form @submit.prevent="login">
                    <input type="text" v-model="username" placeholder="Username" required />

                    <input type="password" v-model="password" placeholder="Password" required />

                    <button type="submit" :disabled="isLoggingIn">
                        {{ isLoggingIn ? 'Logging in...' : 'Login' }}
                    </button>

                    <p>
                        Don't have an account?
                        <router-link id="register" to="/register">Register</router-link>
                    </p>

                    <p v-if="error" class="error-message">{{ error }}</p>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const username = ref('')
const password = ref('')
const error = ref('')
const isLoggingIn = ref(false)

async function login() {
    if (isLoggingIn.value) return

    isLoggingIn.value = true
    error.value = ''

    try {
        await authStore.login(username.value, password.value)
    } catch (err) {
        error.value = 'Invalid login credentials. Please try again.'
    } finally {
        isLoggingIn.value = false
    }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins&display=swap');

* {
    margin: 0;
    box-sizing: border-box;
    font-family: 'Poppins', sans-serif;
}

.login-wrapper {
    height: 100vh;
    background-image: url('@/assets/LoginBackground.jpg');
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center;
    display: flex;
    justify-content: center;
    align-items: center;
}

.glass-container {
    width: 300px;
    height: 350px;
    position: relative;
    z-index: 1;
    background: rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    border-radius: 10px;
    border: 1px solid #fff;
}

.glass-container::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 10px;
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    z-index: -1;
}

.login-box {
    max-width: 250px;
    margin: 0 auto;
    text-align: center;
}

h2 {
    color: #fff;
    margin-top: 30px;
    margin-bottom: -20px;
}

form {
    display: flex;
    flex-direction: column;
    margin-top: 20px;
}

input {
    padding: 10px;
    margin-top: 25px;
    border: none;
    border-radius: 10px;
    background: transparent;
    border: 1px solid #fff;
    color: #fff;
    font-size: 13px;
}

input::placeholder {
    color: #fff;
}

input:focus {
    outline: none;
}

button {
    background: #fff;
    color: black;
    padding: 10px;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    margin-top: 15px;
}

button:hover {
    background: transparent;
    color: white;
    outline: 1px solid #fff;
}

button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

p {
    font-size: 12px;
    color: #fff;
    margin-top: 15px;
}

#error,
.error-message {
    color: red;
    font-size: 12px;
    margin-top: 5px;
}

#register {
    text-decoration: none;
    color: #fff;
    font-weight: bold;
}
</style>
