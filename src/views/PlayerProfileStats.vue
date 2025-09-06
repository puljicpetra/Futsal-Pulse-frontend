<template>
    <div class="player-profile-page">
        <div class="page-header">
            <router-link class="back" to="/players">
                <i class="fas fa-arrow-left"></i> Back to Players
            </router-link>
        </div>

        <div v-if="isLoading" class="loading">
            <div class="spinner"></div>
        </div>
        <div v-else-if="error" class="error">
            {{ error }}
        </div>

        <div v-else>
            <div class="profile-card card">
                <div class="identity">
                    <img
                        v-if="player.avatarUrl || player.avatar_url"
                        :src="player.avatarUrl || player.avatar_url"
                        class="avatar"
                        alt=""
                        loading="lazy"
                    />
                    <div class="who">
                        <h1>{{ player.full_name || player.name || 'Unknown Player' }}</h1>
                        <p class="muted" v-if="player.username">@{{ player.username }}</p>
                    </div>
                </div>

                <div class="totals">
                    <StatsChip type="apps" :value="stat('apps')" />
                    <StatsChip type="goals" :value="stat('goals')" />
                    <StatsChip type="yellow" :value="stat('yellowCards')" />
                    <StatsChip type="red" :value="stat('redCards')" />
                    <StatsChip type="pensScored" :value="stat('pensScored')" />
                    <StatsChip type="pensMissed" :value="stat('pensMissed')" />
                </div>
            </div>

            <div class="card">
                <div class="card-title">
                    <h2><i class="fas fa-list"></i> Recent Matches</h2>
                    <div class="filters">
                        <label>
                            Show
                            <select v-model.number="limit" @change="reloadLog">
                                <option :value="5">Last 5</option>
                                <option :value="10">Last 10</option>
                                <option :value="20">Last 20</option>
                            </select>
                        </label>
                    </div>
                </div>

                <div v-if="logLoading" class="loading small">
                    <div class="spinner"></div>
                </div>
                <div v-else-if="logError" class="error">
                    {{ logError }}
                </div>
                <div v-else>
                    <div v-if="logItems.length === 0" class="empty">
                        No matches found for this player.
                    </div>

                    <ul class="match-list">
                        <li v-for="m in logItems" :key="m.matchId || m._id" class="match-row">
                            <div class="left">
                                <div class="title-line">
                                    <strong>{{ m.teamAName || m.teamA?.name || 'Team A' }}</strong>
                                    <span class="score">
                                        {{ scoreline(m) }}
                                    </span>
                                    <strong>{{ m.teamBName || m.teamB?.name || 'Team B' }}</strong>
                                </div>
                                <div class="meta">
                                    <span>{{ formatDate(m.matchDate || m.date) }}</span>
                                    <span v-if="m.stage"> · {{ prettyStage(m.stage) }}</span>
                                    <span
                                        v-if="m.result_type === 'overtime'"
                                        class="badge badge-overtime"
                                        >AET</span
                                    >
                                    <span
                                        v-if="m.result_type === 'penalties'"
                                        class="badge badge-pen"
                                        >PSO</span
                                    >
                                </div>
                            </div>

                            <div class="right">
                                <StatsChip
                                    v-if="n(m.player?.goals) > 0"
                                    type="goals"
                                    :value="m.player.goals"
                                    size="sm"
                                />
                                <StatsChip
                                    v-if="n(m.player?.yellowCards) > 0"
                                    type="yellow"
                                    :value="m.player.yellowCards"
                                    size="sm"
                                />
                                <StatsChip
                                    v-if="n(m.player?.redCards) > 0"
                                    type="red"
                                    :value="m.player.redCards"
                                    size="sm"
                                />
                                <StatsChip
                                    v-if="n(m.player?.pensScored) > 0"
                                    type="pensScored"
                                    :value="m.player.pensScored"
                                    size="sm"
                                />
                                <StatsChip
                                    v-if="n(m.player?.pensMissed) > 0"
                                    type="pensMissed"
                                    :value="m.player.pensMissed"
                                    size="sm"
                                />
                            </div>
                        </li>
                    </ul>
                </div>
            </div>

            <div class="actions">
                <router-link class="btn" :to="{ name: 'Matches' }">
                    <i class="fas fa-futbol"></i> Browse Matches
                </router-link>
                <router-link class="btn" :to="{ name: 'Teams' }">
                    <i class="fas fa-users"></i> Browse Teams
                </router-link>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import StatsChip from '@/components/StatsChip.vue'
import { getPlayerStats, getPlayerMatchLog } from '@/services/stats'

const route = useRoute()
const playerId = computed(() => String(route.params.id || ''))

const isLoading = ref(true)
const error = ref('')
const player = ref({})
const totals = ref(null)

const logLoading = ref(false)
const logError = ref('')
const logItems = ref([])
const limit = ref(10)

const fetchPlayer = async () => {
    isLoading.value = true
    error.value = ''
    try {
        const data = await getPlayerStats(playerId.value)
        player.value = data?.player || {}
        totals.value = data?.stats || null
    } catch (e) {
        console.error('getPlayerStats failed:', e)
        error.value = e?.response?.data?.message || 'Failed to load player.'
    } finally {
        isLoading.value = false
    }
}

const fetchLog = async () => {
    logLoading.value = true
    logError.value = ''
    try {
        const data = await getPlayerMatchLog(playerId.value, { limit: limit.value })
        logItems.value = Array.isArray(data) ? data : data.items || []
    } catch (e) {
        console.error('getPlayerMatchLog failed:', e)
        logError.value = e?.response?.data?.message || 'Failed to load recent matches.'
    } finally {
        logLoading.value = false
    }
}

const reloadLog = () => fetchLog()

onMounted(async () => {
    await fetchPlayer()
    await fetchLog()
})

watch(
    () => playerId.value,
    async () => {
        await fetchPlayer()
        await fetchLog()
    }
)

const n = (v) => Number(v || 0)
const stat = (key) => {
    if (totals?.value && typeof totals.value[key] !== 'undefined') return totals.value[key]
    return 0
}

const prettyStage = (s) => {
    if (!s) return ''
    const map = {
        round_of_16: 'Round of 16',
        quarter: 'Quarter-finals',
        semi: 'Semi-finals',
        final: 'Final',
        third_place: 'Third place',
    }
    return map[s] || s
}

const scoreline = (m) => {
    const a = n(m.score?.teamA)
    const b = n(m.score?.teamB)
    const otA = n(m.overtime_score?.teamA)
    const otB = n(m.overtime_score?.teamB)
    const pa = n(m.penalty_shootout?.teamA_goals)
    const pb = n(m.penalty_shootout?.teamB_goals)

    const baseA = a + otA
    const baseB = b + otB

    if (m.result_type === 'penalties' || pa + pb > 0) {
        return `${baseA} : ${baseB} (${pa}-${pb})`
    }
    return `${baseA} : ${baseB}`
}

const formatDate = (v) => {
    if (!v) return '—'
    try {
        const options = {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }
        const locale = navigator.language || undefined
        return new Date(v).toLocaleString(locale, options)
    } catch {
        return '—'
    }
}
</script>

<style scoped>
.player-profile-page {
    max-width: 960px;
    margin: 2rem auto;
    padding: 0 1rem;
}
.page-header {
    margin-bottom: 1rem;
}
.back {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    color: #555;
    font-weight: 600;
    padding: 0.45rem 0.8rem;
    border-radius: 999px;
    background: #f3f4f6;
}
.back:hover {
    background: #e5e7eb;
}
.loading {
    display: grid;
    place-items: center;
    padding: 2rem;
}
.loading.small {
    padding: 1rem;
}
.spinner {
    width: 28px;
    height: 28px;
    border: 3px solid #e9ecef;
    border-top-color: #0d6efd;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}
@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
.error {
    color: #b42318;
    background: #fde7e9;
    border: 1px solid #f9c7cd;
    padding: 0.9rem 1rem;
    border-radius: 10px;
}
.card {
    background: #fff;
    border: 1px solid #eaecef;
    border-radius: 14px;
    padding: 1rem;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.04);
    margin-bottom: 1rem;
}
.card-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.6rem;
}
.card-title h2 {
    margin: 0;
    font-size: 1.1rem;
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
}
.filters select {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 0.35rem 0.5rem;
    background: #fff;
}
.profile-card .identity {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.6rem;
}
.avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    object-fit: cover;
    background: #f1f3f5;
}
.who h1 {
    margin: 0;
    font-size: 1.35rem;
    color: #111827;
}
.muted {
    margin: 0.15rem 0 0;
    color: #6b7280;
    font-size: 0.9rem;
}
.totals {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
}
.match-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
}
.match-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.6rem 0.4rem;
    border-bottom: 1px dashed #eef2f7;
}
.match-row:last-child {
    border-bottom: none;
}
.left {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
}
.title-line {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
}
.score {
    font-weight: 700;
    color: #111827;
}
.meta {
    color: #6b7280;
    font-size: 0.9rem;
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
}
.badge {
    display: inline-block;
    font-size: 0.75rem;
    padding: 0.1rem 0.35rem;
    border-radius: 6px;
    font-weight: 700;
}
.badge-overtime {
    background: #fff3cd;
    color: #664d03;
}
.badge-pen {
    background: #e2d9f3;
    color: #4c2a92;
}
.right {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
    justify-content: flex-end;
}
.empty {
    color: #6b7280;
    padding: 0.6rem 0;
}
.actions {
    margin-top: 1rem;
    display: flex;
    gap: 0.6rem;
    justify-content: center;
}
.btn {
    background: #f8fafc;
    color: #111827;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 0.5rem 0.8rem;
    text-decoration: none;
    display: inline-flex;
    gap: 0.5rem;
    align-items: center;
    font-weight: 600;
}
.btn:hover {
    background: #eef2f7;
}
</style>
