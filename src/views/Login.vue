<template>
    <div class="login-wrapper">
      <div class="glass-container">
        <div class="login-box">
          <h2>Login</h2>
          <form @submit.prevent="login">
            <input
              type="text"
              v-model="username"
              placeholder="Username"
              required
            />
  
            <input
              type="password"
              v-model="password"
              placeholder="Password"
              required
            />
  
            <div class="options">
              <input type="checkbox" id="remember" v-model="remember" />
              <label for="remember">Remember me</label>
              <a href="#">Forgot Password?</a>
            </div>
  
            <button type="submit">Login</button>
  
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
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
  
const username = ref('');
const password = ref('');
const remember = ref(false);
const error = ref('');
const router = useRouter();

onMounted(() => {
  const savedUsername = localStorage.getItem('savedUsername');
  if (savedUsername) {
    username.value = savedUsername;
    remember.value = true;
  }
});

async function login() {
    try {
      const res = await axios.post('http://localhost:3001/login', {
        username: username.value,
        password: password.value,
      });
  
      localStorage.setItem('token', res.data.jwt_token);

      if (remember.value) {
        localStorage.setItem('savedUsername', username.value);
      } else {
        localStorage.removeItem('savedUsername');
      }

      router.push('/');
    } catch (err) {
      error.value = 'Invalid login credentials';
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
  
.options {
    display: flex;
    align-items: center;
    margin-top: 15px;
    font-size: 12px;
    color: white;
}
  
.options input {
    margin-right: 5px;
    margin-top: 0px;
}
  
.options a {
    text-decoration: none;
    color: white;
    margin-left: auto;
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
  