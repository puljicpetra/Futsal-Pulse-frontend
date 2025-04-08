import { createRouter, createWebHistory } from 'vue-router';
import Home from '@/views/Home.vue';
import Tournaments from '@/views/Tournaments.vue';
import Matches from '@/views/Matches.vue';
import Teams from '@/views/Teams.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/home',
    name: 'HomeRoute',
    component: Home,
  },
  { 
    path: '/tournaments', 
    name: 'Tournaments', 
    component: Tournaments 
  },
  { 
    path: '/matches', 
    name: 'Matches', 
    component: Matches 
  },
  { 
    path: '/teams', 
    name: 'Teams', 
    component: Teams 
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
