<template>
  <div class="login-wrapper">
    <div class="glass-container">
      <div class="login-box">
        <h2>Register</h2>
        <form @submit.prevent="register">
          <input
            type="text"
            v-model="username"
            placeholder="Username"
            required
          />

          <input
            type="email"
            v-model="email"
            placeholder="Email"
            required
          />

          <input
            type="password"
            v-model="password"
            placeholder="Password"
            required
          />

          <select v-model="role" required class="role-select">
            <option disabled value="">Select role</option>
            <option value="organizer">Organizer</option>
            <option value="player">Player</option>
            <option value="fan">Fan</option>
          </select>

          <button type="submit">Register</button>

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
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const username = ref('');
const email = ref('');
const password = ref('');
const role = ref('');
const error = ref('');
const success = ref('');
const router = useRouter();

async function register() {
  try {
    await axios.post('http://localhost:3001/register', {
      username: username.value,
      email: email.value,
      password: password.value,
      role: role.value
    });

    success.value = 'Registration successful! Redirecting to login...';
    setTimeout(() => {
      router.push('/login');
    }, 1500);
  } catch (err) {
    error.value = 'Username or email already exists or error occurred.';
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
