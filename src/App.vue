<script setup>
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import NotificationBell from '@/components/NotificationBell.vue'

const authStore = useAuthStore()
const route = useRoute()

const authPages = ['/login', '/register']
const isAuthPage = computed(() => authPages.includes(route.path))

const formattedUserRole = computed(() => {
    if (authStore.userRole) {
        return authStore.userRole.charAt(0).toUpperCase() + authStore.userRole.slice(1)
    }
    return 'N/A'
})
</script>

<template>
    <div id="app">
        <div v-if="!isAuthPage && authStore.isLoggedIn">
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
                    <div
                        class="collapse navbar-collapse d-flex justify-content-between"
                        id="navbarNav"
                    >
                        <ul class="navbar-nav">
                            <li class="nav-item">
                                <router-link to="/" class="nav-link">Home</router-link>
                            </li>
                            <li class="nav-item">
                                <router-link to="/tournaments" class="nav-link"
                                    >Tournaments</router-link
                                >
                            </li>
                            <li class="nav-item">
                                <router-link to="/matches" class="nav-link">Matches</router-link>
                            </li>
                            <li class="nav-item">
                                <router-link to="/teams" class="nav-link">Teams</router-link>
                            </li>
                            <li class="nav-item">
                                <router-link to="/players" class="nav-link">Players</router-link>
                            </li>
                        </ul>
                        <div class="d-flex align-items-center ms-auto" v-if="authStore.isLoggedIn">
                            <NotificationBell />
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
                                    <span
                                        v-if="authStore.unreadInvitationCount > 0"
                                        class="notification-badge"
                                        >{{ authStore.unreadInvitationCount }}</span
                                    >
                                </a>
                                <ul
                                    class="dropdown-menu dropdown-menu-end"
                                    aria-labelledby="navbarDropdownUserProfileMenu"
                                >
                                    <li>
                                        <span class="dropdown-item-text">
                                            <i class="fas fa-user-shield me-2"></i>Role:
                                            {{ formattedUserRole }}
                                        </span>
                                    </li>
                                    <li>
                                        <router-link to="/profile" class="dropdown-item">
                                            <i class="fas fa-edit me-2"></i>Edit my profile
                                        </router-link>
                                    </li>
                                    <li v-if="authStore.userRole === 'player'">
                                        <router-link
                                            to="/invitations"
                                            class="dropdown-item d-flex justify-content-between"
                                        >
                                            <div>
                                                <i class="fas fa-envelope me-2"></i>My Invitations
                                            </div>
                                            <span
                                                v-if="authStore.unreadInvitationCount > 0"
                                                class="notification-badge-inline"
                                                >{{ authStore.unreadInvitationCount }}</span
                                            >
                                        </router-link>
                                    </li>
                                    <li><hr class="dropdown-divider" /></li>
                                    <li>
                                        <button
                                            class="dropdown-item logout-button-dropdown"
                                            @click="authStore.logout"
                                        >
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

        <router-view class="main-content" />
    </div>
</template>

<style scoped>
nav.navbar {
    position: relative;
    overflow: visible;
    padding: 0;
    height: 60px;
    flex-shrink: 0;
}

.main-content {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
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
    color: #ff0133;
}

.user-dropdown-toggle {
    color: #000;
    font-weight: bold;
    position: relative;
    padding-right: 2rem;
}
.user-dropdown-toggle:hover {
    color: #ff0133;
}

.dropdown-menu {
    border-radius: 0.25rem;
}

.dropdown-item,
.dropdown-item-text {
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

.dropdown-item i,
.dropdown-item-text i {
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
    background-color: #ff0133;
    color: #fff;
}

.notification-badge {
    position: absolute;
    top: 2px;
    right: 2px;
    background-color: #dc3545;
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 0.75rem;
    font-weight: bold;
}

.notification-badge-inline {
    background-color: #dc3545;
    color: white;
    border-radius: 8px;
    padding: 0.1rem 0.4rem;
    font-size: 0.8rem;
    font-weight: bold;
}
</style>
