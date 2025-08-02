import { createRouter, createWebHistory } from 'vue-router';
import Home from '@/views/Home.vue';
import Login from '@/views/Login.vue';
import Register from '@/views/Register.vue';
import Tournaments from '@/views/Tournaments.vue';
import CreateTournament from '@/views/CreateTournament.vue';
import TournamentDetail from '@/views/TournamentDetail.vue';
import Matches from '@/views/Matches.vue';
import Teams from '@/views/Teams.vue';
import UserProfile from '@/views/UserProfile.vue';
import EditTournament from '@/views/EditTournament.vue';
import CreateTeam from '@/views/CreateTeam.vue';
import TeamDetail from '@/views/TeamDetail.vue';
import MyInvitations from '@/views/MyInvitations.vue';
import TournamentMatches from '@/views/TournamentMatches.vue';

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
    path: '/tournaments/create',
    name: 'CreateTournament',
    component: CreateTournament,
    meta: { requiresAuth: true }
  },
  {
    path: '/tournaments/:id',
    name: 'TournamentDetail',
    component: TournamentDetail,
    meta: { requiresAuth: true }
  },
  {
    path: '/tournaments/:id/matches',
    name: 'TournamentMatches',
    component: TournamentMatches,
    meta: { requiresAuth: true }
  },
  {
    path: '/tournaments/:id/edit',
    name: 'EditTournament',
    component: EditTournament,
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
  },
  {
    path: '/teams/create',
    name: 'CreateTeam',
    component: CreateTeam,
    meta: { requiresAuth: true }
  },
  { 
    path: '/teams/:id',
    name: 'TeamDetail',
    component: TeamDetail,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'UserProfile', 
    component: UserProfile, 
    meta: { requiresAuth: true }
  },
  {
    path: '/invitations',
    name: 'MyInvitations',
    component: MyInvitations,
    meta: { requiresAuth: true }
  },
  { 
    path: '/:pathMatch(.*)*', 
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
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