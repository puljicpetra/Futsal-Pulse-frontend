<template>
    <div class="login-wrapper">
        <div class="glass-container">
            <div class="login-box">
                <h2>Register</h2>
                <form @submit.prevent="handleRegister">
                    <input type="text" v-model="username" placeholder="Username" required />

                    <input type="email" v-model="email" placeholder="Email" required />

                    <input
                        type="password"
                        v-model="password"
                        placeholder="Password (min 8)"
                        required
                    />

                    <select v-model="role" required class="role-select">
                        <option disabled value="">Select role</option>
                        <option value="organizer">Organizer</option>
                        <option value="player">Player</option>
                        <option value="fan">Fan</option>
                    </select>

                    <button type="submit" :disabled="isRegistering || !canSubmit">
                        {{ isRegistering ? 'Registering...' : 'Register' }}
                    </button>

                    <p>
                        Already have an account?
                        <router-link id="register" to="/login">Login</router-link>
                    </p>

                    <p v-if="error" class="error-message">{{ error }}</p>
                    <p v-if="success" class="success-message">{{ success }}</p>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const username = ref('')
const email = ref('')
const password = ref('')
const role = ref('')

const error = ref('')
const success = ref('')
const isRegistering = ref(false)

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const canSubmit = computed(() => {
    return (
        username.value.trim().length > 0 &&
        email.value.trim().length > 0 &&
        password.value.length >= 8 &&
        !!role.value
    )
})

function buildClientValidationError() {
    if (!username.value.trim()) return 'Please enter a username.'
    if (!email.value.trim()) return 'Please enter an email.'
    if (password.value.length < 8) return 'Password must be at least 8 characters long.'
    if (!role.value) return 'Please select a role.'
    return null
}

async function handleRegister() {
    if (isRegistering.value) return

    const clientErr = buildClientValidationError()
    if (clientErr) {
        error.value = clientErr
        return
    }

    isRegistering.value = true
    error.value = ''
    success.value = ''

    try {
        const payload = {
            username: username.value.trim(),
            email: email.value.trim().toLowerCase(),
            password: password.value,
            role: role.value,
        }

        const response = await authStore.register(payload)

        success.value =
            response?.data?.message || 'Registration successful! Redirecting to login...'

        const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
        setTimeout(() => {
            router.push(redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login')
        }, 1200)
    } catch (err) {
        if (err?.response) {
            const data = err.response.data
            if (Array.isArray(data?.errors) && data.errors.length) {
                error.value = data.errors.map((e) => e.msg || e.message).join(' ')
            } else if (data?.message) {
                error.value = data.message
            } else {
                error.value = 'An unknown error occurred during registration.'
            }
        } else if (err?.request) {
            error.value = 'No response from the server. Please check your connection.'
        } else {
            error.value = 'Error in request setup: ' + (err?.message || 'Unknown error')
        }
    } finally {
        isRegistering.value = false
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
    height: auto;
    padding-bottom: 20px;
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
input,
select {
    padding: 10px;
    margin-top: 20px;
    border: none;
    border-radius: 10px;
    background: transparent;
    border: 1px solid #fff;
    color: #fff;
    font-size: 13px;
}
select option {
    color: black;
}
input::placeholder {
    color: #fff;
}
input:focus,
select:focus {
    outline: none;
}
button {
    background: #fff;
    color: black;
    padding: 10px;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    margin-top: 20px;
}
button:hover {
    background: transparent;
    color: white;
    outline: 1px solid #fff;
}
button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
    color: #666;
}
p {
    font-size: 12px;
    color: #fff;
    margin-top: 15px;
}
.error-message {
    color: red;
    font-size: 12px;
    margin-top: 5px;
}
.success-message {
    color: #00ff90;
    font-size: 12px;
    margin-top: 5px;
}
#register {
    text-decoration: none;
    color: #fff;
    font-weight: bold;
}
</style>
