<template>
    <div class="teams-page">
        <div class="header-container">
            <div class="header-content-wrapper">
                <h1>Teams</h1>

                <router-link v-if="isPlayer" to="/teams/create" class="btn-create">
                    <i class="fas fa-plus"></i> Create Team
                </router-link>
            </div>
        </div>

        <div class="page-content">
            <div class="filters-container">
                <div class="filter-group">
                    <label for="search"><i class="fas fa-search"></i> Search by name</label>
                    <input
                        id="search"
                        type="text"
                        v-model.trim="search"
                        @keyup.enter="applyFilters"
                        placeholder="e.g., Hajduk"
                    />
                </div>

                <label class="filter-group checkbox" title="Show only my team">
                    <input type="checkbox" v-model="onlyMine" />
                    <span>Only my team</span>
                </label>

                <div class="filter-actions">
                    <button @click="applyFilters" class="btn-filter">
                        <i class="fas fa-filter"></i> Apply
                    </button>
                    <button @click="clearFilters" class="btn-clear">Clear</button>
                </div>
            </div>

            <div v-if="isLoading" class="loading-state">
                <div class="spinner"></div>
                <p>Loading teams...</p>
            </div>

            <div v-else-if="error" class="error-state">
                <h2><i class="fas fa-exclamation-triangle"></i> Oops!</h2>
                <p>{{ error }}</p>
                <button @click="reload" class="btn-retry">Try Again</button>
            </div>

            <div v-else-if="filteredAndSorted.length > 0" class="teams-grid">
                <div v-for="team in filteredAndSorted" :key="idOf(team)" class="team-card">
                    <router-link :to="`/teams/${idOf(team)}`" class="card-body-link">
                        <div class="card-header">
                            <h3 class="team-name">
                                {{ team.name }}
                                <span v-if="myTeamIds.has(idOf(team))" class="badge-your-team"
                                    >Your team</span
                                >
                            </h3>
                        </div>
                        <div class="card-body">
                            <p class="muted">
                                <i class="fas fa-user-shield"></i>
                                Captain:
                                <strong>{{ displayCaptain(team) }}</strong>
                            </p>
                            <p class="muted">
                                <i class="fas fa-users"></i>
                                Players:
                                <strong>{{ playersCount(team) ?? '—' }}</strong>
                            </p>
                            <div class="btn-details">Open details</div>
                        </div>
                    </router-link>
                </div>
            </div>

            <div v-else class="empty-state">
                <div class="empty-state-icon"><i class="fas fa-inbox"></i></div>
                <h2>No teams found</h2>
                <p>Try a different search.</p>

                <div v-if="isPlayer && myTeams.length === 0" class="cta">
                    <router-link to="/teams/create" class="create-link">
                        Create your first team
                    </router-link>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import apiClient from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const isPlayer = computed(() => authStore.userRole === 'player')

const allTeams = ref([])
const myTeams = ref([])
const isLoading = ref(true)
const error = ref('')

const search = ref('')
const onlyMine = ref(false)

const oidString = (v) => {
    if (!v) return ''
    if (typeof v === 'string') return v
    if (typeof v === 'object' && typeof v.$oid === 'string') return v.$oid
    if (typeof v.toString === 'function') return v.toString()
    return ''
}
const idOf = (obj) => oidString(obj?._id ?? obj?.id ?? obj)

const fetchAllTeams = async () => {
    const { data } = await apiClient.get('/api/teams')
    allTeams.value = Array.isArray(data) ? data : []
}

const fetchMyTeams = async () => {
    if (!authStore.isLoggedIn) {
        myTeams.value = []
        return
    }
    try {
        const { data } = await apiClient.get('/api/teams/me')
        myTeams.value = Array.isArray(data) ? data : []
    } catch {
        myTeams.value = []
    }
}

const reload = async () => {
    isLoading.value = true
    error.value = ''
    try {
        await Promise.all([fetchAllTeams(), fetchMyTeams()])
    } catch (e) {
        error.value = e.response?.data?.message || 'Failed to load teams.'
    } finally {
        isLoading.value = false
    }
}

const myTeamIds = computed(() => new Set(myTeams.value.map((t) => idOf(t))))
const myTeamsMap = computed(() => {
    const m = new Map()
    for (const t of myTeams.value) m.set(idOf(t), t)
    return m
})

const enrichedTeams = computed(() => {
    return allTeams.value.map((t) => {
        const id = idOf(t)
        const mine = myTeamsMap.value.get(id)
        return mine ? { ...t, ...mine } : t
    })
})

const displayCaptain = (team) => {
    const cap =
        team.captainInfo ||
        team.captain_user ||
        team.captainUser ||
        team.captain_obj ||
        team.captain

    if (!cap) return '—'
    if (typeof cap === 'object') {
        return cap.full_name || cap.fullName || cap.username || '—'
    }
    return '—'
}

const playersCount = (team) => {
    if (Array.isArray(team.players)) return team.players.length
    if (typeof team.playersCount === 'number') return team.playersCount
    if (typeof team.playerCount === 'number') return team.playerCount
    if (typeof team.membersCount === 'number') return team.membersCount
    if (typeof team.players_len === 'number') return team.players_len
    return null
}

const applyFilters = () => {}
const clearFilters = () => {
    search.value = ''
    onlyMine.value = false
}

const filteredAndSorted = computed(() => {
    let list = enrichedTeams.value.slice()

    if (onlyMine.value && myTeamIds.value.size > 0) {
        list = list.filter((t) => myTeamIds.value.has(idOf(t)))
    }

    if (search.value.trim()) {
        const q = search.value.trim().toLowerCase()
        list = list.filter((t) => (t.name || '').toLowerCase().includes(q))
    }

    list.sort((a, b) => {
        const aMine = myTeamIds.value.has(idOf(a)) ? 0 : 1
        const bMine = myTeamIds.value.has(idOf(b)) ? 0 : 1
        if (aMine !== bMine) return aMine - bMine
        return (a.name || '').localeCompare(b.name || '')
    })

    return list
})

onMounted(reload)
</script>

<style scoped>
.teams-page {
    padding: 0;
    background-color: #f9fafb;
    min-height: calc(100vh - 60px);
}
.page-content {
    padding: 2rem;
}

.header-container {
    width: 100%;
    background-color: white;
    border-bottom: 1px solid #e5e7eb;
    padding: 1.5rem 2rem;
    box-sizing: border-box;
}
.header-content-wrapper {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
h1 {
    color: #111827;
    font-weight: 700;
    font-size: 2.25rem;
    margin: 0;
}

.btn-create {
    background-color: #00aeef;
    color: white;
    padding: 0.7rem 1.2rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.btn-create:hover {
    background-color: #008fbf;
    box-shadow: 0 4px 15px rgba(0, 174, 239, 0.2);
    transform: translateY(-2px);
}

.filters-container {
    background-color: white;
    padding: 1.5rem;
    border-radius: 12px;
    margin: 0 auto 2rem auto;
    max-width: 1000px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: flex-end;
    gap: 1rem;
    flex-wrap: wrap;
}
.filter-group {
    flex: 1;
    min-width: 220px;
}
.filter-group label {
    font-weight: 600;
    color: #374151;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
    display: block;
}
.filter-group label i {
    margin-right: 0.5rem;
    color: #9ca3af;
}
.filter-group input,
.filter-group select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    box-sizing: border-box;
    font-size: 1rem;
    background-color: #ffffff;
    color: #1f2937;
}

.filter-group.checkbox {
    flex: 0;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 0.35rem 0;
    user-select: none;
}
.filter-group.checkbox input {
    width: 18px;
    height: 18px;
}

.filter-actions {
    display: flex;
    gap: 0.5rem;
}
.btn-filter,
.btn-clear {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
}
.btn-filter {
    background-color: #374151;
    color: white;
}
.btn-filter:hover {
    background-color: #1f2937;
}
.btn-clear {
    background-color: #e5e7eb;
    color: #374151;
}
.btn-clear:hover {
    background-color: #d1d5db;
}

.teams-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
}
@media (max-width: 1024px) {
    .teams-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}
@media (max-width: 768px) {
    .teams-grid {
        grid-template-columns: 1fr;
    }
    .header-content-wrapper {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
    }
}

.team-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.07);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: transform 0.3s, box-shadow 0.3s;
}
.team-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}
.card-body-link {
    text-decoration: none;
    color: inherit;
    display: block;
}
.card-header {
    background-color: #374151;
    color: white;
    padding: 1rem 1.5rem;
}
.team-name {
    margin: 0;
    font-size: 1.15rem;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}
.badge-your-team {
    background: #d1fae5;
    color: #065f46;
    border-radius: 999px;
    padding: 0.15rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 700;
}

.card-body {
    padding: 1.25rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}
.muted {
    color: #4b5563;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.btn-details {
    margin-top: 0.6rem;
    background: #1f2937;
    color: #fff;
    text-align: center;
    padding: 0.6rem;
    border-radius: 8px;
    font-weight: 600;
}

.loading-state,
.error-state,
.empty-state {
    text-align: center;
    padding: 4rem 1rem;
    color: #6b7280;
}
.error-state h2,
.empty-state h2 {
    color: #1f2937;
    margin: 1rem 0 0.5rem;
}
.empty-state {
    margin-top: 2rem;
    background-color: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
}
.empty-state-icon {
    font-size: 3rem;
    color: #d1d5db;
    margin-bottom: 1rem;
}
.create-link {
    font-weight: 600;
    color: #00aeef;
    text-decoration: none;
}
.create-link:hover {
    text-decoration: underline;
}

.spinner {
    border: 4px solid #f3f4f6;
    border-top: 4px solid #00aeef;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
}
@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}
.btn-retry {
    margin-top: 1rem;
    padding: 0.6rem 1.2rem;
    font-weight: 600;
    border-radius: 8px;
    background-color: #e5e7eb;
    color: #1f2937;
    border: none;
    cursor: pointer;
}
.btn-retry:hover {
    background-color: #d1d5db;
}
</style>
