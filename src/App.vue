<script setup>
import { useRoute, useRouter } from 'vue-router';
import { computed } from 'vue';

const route = useRoute();
const router = useRouter();

const authPages = ['/login', '/register'];
const isAuthPage = computed(() => authPages.includes(route.path));

const logout = () => {
  localStorage.removeItem('token');
  router.push('/login');
};
</script>

<template>
  <div id="app">
    <div v-if="!isAuthPage">
      <nav class="navbar navbar-expand-lg navbar-light bg-light">
        <div class="container-fluid">
          <a class="navbar-brand" href="#">
            <img
              src="@/assets/FutsalPulseLogo.jpg"
              alt="Futsal Pulse Logo"
              class="navbar-logo"
            />
          </a>
          <button
            class="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse d-flex justify-content-between" id="navbarNav">
            <ul class="navbar-nav">
              <li class="nav-item">
                <router-link to="/" class="nav-link">Početna</router-link>
              </li>
              <li class="nav-item">
                <router-link to="/tournaments" class="nav-link">Turniri</router-link>
              </li>
              <li class="nav-item">
                <router-link to="/matches" class="nav-link">Utakmice</router-link>
              </li>
              <li class="nav-item">
                <router-link to="/teams" class="nav-link">Timovi</router-link>
              </li>
            </ul>
            <button class="logout-button" @click="logout">Logout</button>
          </div>
        </div>
      </nav>
    </div>

    <router-view />
  </div>
</template>

<style scoped>
#app {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  position: relative;
}

nav.navbar {
  position: relative;
  overflow: visible;
  padding: 0;
  height: 60px;
}

.navbar-logo {
  height: 120px;
  width: auto;
  position: absolute;
  left: 50%;
  top: -30px;
  transform: translateX(-50%);
  z-index: 1000;
  border: 2px solid #fff;
  border-radius: 20px;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease-in-out;
}

.navbar-logo:hover {
  transform: translateX(-50%) scale(1.2);
}

.nav-link {
  color: #000;
  font-weight: bold;
  transition: color 0.3s ease-in-out;
}

.nav-link:hover {
  color: #FF0133;
}

.logout-button {
  background-color: #000;
  color: #fff;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
  margin-right: 10px;
}

.logout-button:hover {
  background-color: #FF0133;
  color: #fff;
}
</style>
