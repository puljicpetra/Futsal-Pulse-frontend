import { createRouter, createWebHistory } from 'vue-router'

const Home = () => import('@/views/Home.vue')
const Login = () => import('@/views/Login.vue')
const Register = () => import('@/views/Register.vue')
const Tournaments = () => import('@/views/Tournaments.vue')
const CreateTournament = () => import('@/views/CreateTournament.vue')
const TournamentDetail = () => import('@/views/TournamentDetail.vue')
const TournamentMatches = () => import('@/views/TournamentMatches.vue')
const EditTournament = () => import('@/views/EditTournament.vue')
const Matches = () => import('@/views/Matches.vue')
const MatchDetail = () => import('@/views/MatchDetail.vue')
const Teams = () => import('@/views/Teams.vue')
const CreateTeam = () => import('@/views/CreateTeam.vue')
const TeamDetail = () => import('@/views/TeamDetail.vue')
const UserProfile = () => import('@/views/UserProfile.vue')
const MyInvitations = () => import('@/views/MyInvitations.vue')
const PlayerSearch = () => import('@/views/PlayerSearch.vue')
const PlayerProfileStats = () => import('@/views/PlayerProfileStats.vue')

const NotFound = () => import('@/views/NotFound.vue')

function jwtExpired(token) {
    if (!token) return true
    try {
        const base = token.split('.')[1]
        if (!base) return true
        const json = JSON.parse(
            decodeURIComponent(
                atob(base.replace(/-/g, '+').replace(/_/g, '/'))
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            )
        )
        const exp = json?.exp
        if (!exp) return false
        const now = Math.floor(Date.now() / 1000)
        return exp <= now
    } catch {
        return true
    }
}

const routes = [
    { path: '/', name: 'Home', component: Home, meta: { requiresAuth: true } },
    { path: '/login', name: 'Login', component: Login },
    { path: '/register', name: 'Register', component: Register },

    {
        path: '/tournaments',
        name: 'Tournaments',
        component: Tournaments,
        meta: { requiresAuth: true },
    },
    {
        path: '/tournaments/create',
        name: 'CreateTournament',
        component: CreateTournament,
        meta: { requiresAuth: true, roles: ['organizer'] },
    },
    {
        path: '/tournaments/:id',
        name: 'TournamentDetail',
        component: TournamentDetail,
        meta: { requiresAuth: true },
    },
    {
        path: '/tournaments/:id/matches',
        name: 'TournamentMatches',
        component: TournamentMatches,
        meta: { requiresAuth: true },
    },
    {
        path: '/tournaments/:id/edit',
        name: 'EditTournament',
        component: EditTournament,
        meta: { requiresAuth: true, roles: ['organizer'] },
    },

    { path: '/matches', name: 'Matches', component: Matches, meta: { requiresAuth: true } },
    {
        path: '/matches/:id',
        name: 'MatchDetail',
        component: MatchDetail,
        meta: { requiresAuth: true },
    },

    { path: '/teams', name: 'Teams', component: Teams, meta: { requiresAuth: true } },
    {
        path: '/teams/create',
        name: 'CreateTeam',
        component: CreateTeam,
        meta: { requiresAuth: true, roles: ['player'] },
    },
    { path: '/teams/:id', name: 'TeamDetail', component: TeamDetail, meta: { requiresAuth: true } },

    { path: '/profile', name: 'UserProfile', component: UserProfile, meta: { requiresAuth: true } },
    {
        path: '/invitations',
        name: 'MyInvitations',
        component: MyInvitations,
        meta: { requiresAuth: true, roles: ['player'] },
    },

    { path: '/players', name: 'Players', component: PlayerSearch, meta: { requiresAuth: true } },
    {
        path: '/players/:id',
        name: 'PlayerProfileStats',
        component: PlayerProfileStats,
        meta: { requiresAuth: true },
    },

    { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior() {
        return { top: 0 }
    },
})

router.beforeEach((to) => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('userRole')

    if (token && jwtExpired(token)) {
        localStorage.removeItem('token')
        localStorage.removeItem('userRole')
        if (to.path !== '/login') {
            return { path: '/login', query: { redirect: to.fullPath } }
        }
        return true
    }

    if (to.meta.requiresAuth && !token) {
        return { path: '/login', query: { redirect: to.fullPath } }
    }

    if ((to.path === '/login' || to.path === '/register') && token) {
        return '/'
    }

    if (to.meta.roles && Array.isArray(to.meta.roles) && to.meta.roles.length) {
        if (!role || !to.meta.roles.includes(role)) {
            return '/'
        }
    }

    return true
})

export default router
