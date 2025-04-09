import { createRouter, createWebHistory } from 'vue-router';
import Home from '@/views/Home.vue';
import Login from '@/views/Login.vue';
import Register from '@/views/Register.vue';
import Tournaments from '@/views/Tournaments.vue';
import Matches from '@/views/Matches.vue';
import Teams from '@/views/Teams.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/tournaments',
    name: 'Tournaments',
    component: Tournaments,
    meta: { requiresAuth: true }
  },
  {
    path: '/matches',
    name: 'Matches',
    component: Matches,
    meta: { requiresAuth: true }
  },
  {
    path: '/teams',
    name: 'Teams',
    component: Teams,
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');

  if (to.meta.requiresAuth && !token) {
    next('/login');
  }

  else if ((to.path === '/login' || to.path === '/register') && token) {
    next('/');
  }

  else {
    next();
  }
});

export default router;