<script setup>
import { useRoute, useRouter } from 'vue-router';
import { computed, ref, watch } from 'vue';

const route = useRoute();
const router = useRouter();

const authPages = ['/login', '/register'];
const isAuthPage = computed(() => authPages.includes(route.path));

const token = ref(localStorage.getItem('token'));
const userRole = ref(localStorage.getItem('userRole'));
const username = ref(localStorage.getItem('username'));

const isLoggedIn = computed(() => !!token.value);

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userRole');
  localStorage.removeItem('username');
  token.value = null;
  userRole.value = null;
  username.value = null;
  router.push('/login');
};

const updateAuthDataFromStorage = () => {
  const storedToken = localStorage.getItem('token');
  token.value = storedToken;

  if (storedToken) {
    userRole.value = localStorage.getItem('userRole');
    username.value = localStorage.getItem('username');
  } else {
    userRole.value = null;
    username.value = null;
  }
};

watch(
  () => route.path,
  () => {
    updateAuthDataFromStorage();
  },
  { immediate: true }
);

const formattedUserRole = computed(() => {
  if (userRole.value) {
    return userRole.value.charAt(0).toUpperCase() + userRole.value.slice(1);
  }
  return 'N/A';
});

</script>

<template>
  <div id="app">
    <div v-if="!isAuthPage && isLoggedIn">
      <nav class="navbar navbar-expand-lg navbar-light bg-light">
        <div class="container-fluid">
          <router-link class="navbar-brand" to="/">
            <img
              src="@/assets/FutsalPulseLogo.jpg"
              alt="Futsal Pulse Logo"
              class="navbar-logo"
            />
          </router-link>
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
                <router-link to="/" class="nav-link">Home</router-link>
              </li>
              <li class="nav-item">
                <router-link to="/tournaments" class="nav-link">Tournaments</router-link>
              </li>
              <li class="nav-item">
                <router-link to="/matches" class="nav-link">Matches</router-link>
              </li>
              <li class="nav-item">
                <router-link to="/teams" class="nav-link">Teams</router-link>
              </li>
            </ul>
            <div class="d-flex align-items-center ms-auto" v-if="isLoggedIn">
              <div class="nav-item dropdown">
                <a
                  class="nav-link dropdown-toggle user-dropdown-toggle"
                  href="#"
                  id="navbarDropdownUserProfileMenu"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  My profile
                </a>
                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdownUserProfileMenu">
                  <li>
                    <span class="dropdown-item-text">
                      <i class="fas fa-user-shield me-2"></i>Role: {{ formattedUserRole }}
                    </span>
                  </li>
                  <li>
                    <router-link to="/profile" class="dropdown-item">
                      <i class="fas fa-edit me-2"></i>Edit my profile
                    </router-link>
                  </li>
                  <li><hr class="dropdown-divider" /></li>
                  <li>
                    <button class="dropdown-item logout-button-dropdown" @click="logout">
                      <i class="fas fa-sign-out-alt me-2"></i>Logout
                    </button>
                  </li>
                </ul>
              </div>
            </div>
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
  padding: 0.5rem 1rem;
}

.nav-link:hover,
.nav-link.router-link-active,
.nav-link.router-link-exact-active {
  color: #FF0133;
}

.user-dropdown-toggle {
  color: #000;
  font-weight: bold;
}
.user-dropdown-toggle:hover {
  color: #FF0133;
}

.dropdown-menu {
  border-radius: 0.25rem;
}

.dropdown-item, .dropdown-item-text {
  color: #212529;
  font-weight: 400;
  display: flex;
  align-items: center;
  padding: 0.35rem 1rem;
}
.dropdown-item-text {
    cursor: default;
}

.dropdown-item:not(.logout-button-dropdown):hover,
.dropdown-item:not(.logout-button-dropdown):focus {
  color: #1e2125;
  background-color: #e9ecef;
}


.dropdown-item i, .dropdown-item-text i {
  width: 22px;
  text-align: center;
  margin-right: 0.5rem;
}

.logout-button-dropdown {
  background-color: transparent;
  color: #212529;
  border: none;
  padding: 0.35rem 1rem;
  width: 100%;
  text-align: left;
  font-weight: 400;
  display: flex;
  align-items: center;
  transition: background-color 0.15s ease-in-out, color 0.15s ease-in-out;
}

.logout-button-dropdown:hover,
.logout-button-dropdown:focus {
  color: #fff;
  background-color: #dc3545;
}

.logout-button-dropdown:hover i,
.logout-button-dropdown:focus i {
  color: #fff;
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
  margin-left: 10px;
}
.logout-button:hover {
  background-color: #FF0133;
  color: #fff;
}
</style>