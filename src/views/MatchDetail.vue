<template>
    <div class="match-detail-page">
        <div v-if="isLoading" class="loading-state">
            <div class="spinner"></div>
            <p>Loading match details...</p>
        </div>

        <div v-else-if="error" class="error-state">
            <h2>Oops! Something went wrong.</h2>
            <p>{{ error }}</p>
            <router-link to="/matches" class="btn-back">Back to Matches</router-link>
        </div>

        <div v-else-if="match" class="match-content">
            <div class="navigation-container">
                <router-link to="/matches" class="back-link">
                    <i class="fas fa-chevron-left"></i>
                    <span>Back to Matches</span>
                </router-link>
            </div>

            <header class="match-header">
                <div class="team-banner">
                    <span class="team-name">{{ match.teamA?.name || 'TBD' }}</span>
                </div>
                <div class="score-display">
                    <span class="final-score"
                        >{{ finalScore(match).teamA }} - {{ finalScore(match).teamB }}</span
                    >
                    <div
                        v-if="match.result_type === 'penalties' && match.penalty_shootout"
                        class="penalty-result"
                    >
                        Penalties: {{ match.penalty_shootout.teamA_goals }} -
                        {{ match.penalty_shootout.teamB_goals }}
                    </div>
                </div>
                <div class="team-banner">
                    <span class="team-name">{{ match.teamB?.name || 'TBD' }}</span>
                </div>
            </header>

            <div class="match-body">
                <h3>Match Timeline</h3>
                <div class="timeline-container">
                    <div class="period-header">1st Half</div>

                    <template
                        v-for="(event, index) in allEventsSorted"
                        :key="
                            event._id || `${event.type}-${event.playerId}-${event.minute}-${index}`
                        "
                    >
                        <div v-if="shouldShowHeader(event, index)" class="period-header">
                            {{ shouldShowHeader(event, index) }}
                        </div>

                        <div
                            class="timeline-entry"
                            :class="event.teamId === match.teamB._id ? 'right' : 'left'"
                        >
                            <div class="event-details">
                                <i :class="getEventIcon(event.type)"></i>
                                <span class="player-name">{{ getPlayerName(event.playerId) }}</span>
                            </div>
                            <div class="event-minute">{{ event.minute }}'</div>
                        </div>
                    </template>
                </div>

                <div v-if="penaltyEvents.length > 0" class="penalty-timeline">
                    <div class="period-header">Penalty Shootout</div>
                    <div class="timeline-split">
                        <div class="timeline-col">
                            <div
                                v-for="(event, i) in teamA_penalties"
                                :key="event._id || `${event.playerId}-${event.outcome}-A-${i}`"
                                class="event-row-split"
                            >
                                <span>{{ getPlayerName(event.playerId) }}</span>
                                <i :class="getPenaltyIcon(event.outcome)"></i>
                            </div>
                        </div>
                        <div class="timeline-col right-aligned">
                            <div
                                v-for="(event, i) in teamB_penalties"
                                :key="event._id || `${event.playerId}-${event.outcome}-B-${i}`"
                                class="event-row-split"
                            >
                                <i :class="getPenaltyIcon(event.outcome)"></i>
                                <span>{{ getPlayerName(event.playerId) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import apiClient from '@/services/api'

const route = useRoute()
const match = ref(null)
const isLoading = ref(true)
const error = ref('')

const allPlayers = ref(new Map())

const fetchMatchDetails = async () => {
    isLoading.value = true
    error.value = ''
    try {
        const { data } = await apiClient.get(`/api/matches/${route.params.id}`)
        match.value = data

        allPlayers.value.clear()
        match.value?.teamA?.players?.forEach((p) => allPlayers.value.set(p._id, p))
        match.value?.teamB?.players?.forEach((p) => allPlayers.value.set(p._id, p))
    } catch (err) {
        error.value = err.response?.data?.message || 'Failed to fetch match details.'
    } finally {
        isLoading.value = false
    }
}

const finalScore = (m) => {
    if (!m) return { teamA: '-', teamB: '-' }
    let final = { teamA: m.score?.teamA ?? 0, teamB: m.score?.teamB ?? 0 }
    if (m.overtime_score) {
        final.teamA += m.overtime_score.teamA
        final.teamB += m.overtime_score.teamB
    }
    return final
}

const allEventsSorted = computed(() => {
    const ev = match.value?.events ?? []
    return [...ev].sort((a, b) => a.minute - b.minute)
})

const penaltyEvents = computed(() => match.value?.penalty_shootout?.events || [])
const teamA_penalties = computed(() =>
    (match.value?.penalty_shootout?.events || []).filter(
        (e) => e.teamId === match.value?.teamA?._id
    )
)
const teamB_penalties = computed(() =>
    (match.value?.penalty_shootout?.events || []).filter(
        (e) => e.teamId === match.value?.teamB?._id
    )
)

const shouldShowHeader = (currentEvent, index) => {
    if (index === 0) return null
    const prevEvent = allEventsSorted.value[index - 1]
    if (prevEvent.minute <= 20 && currentEvent.minute > 20) return '2nd Half'
    if (prevEvent.minute <= 40 && currentEvent.minute > 40) return 'Overtime'
    return null
}

const getEventIcon = (type) =>
    ({
        goal: 'fas fa-futbol',
        'yellow-card': 'fas fa-square yellow-card',
        'red-card': 'fas fa-square red-card',
    }[type] || 'fas fa-question')
const getPenaltyIcon = (outcome) =>
    outcome === 'scored' ? 'fas fa-check-circle' : 'fas fa-times-circle'
const getPlayerName = (playerId) => allPlayers.value.get(playerId)?.name || 'Unknown'

onMounted(fetchMatchDetails)
</script>

<style scoped>
.match-detail-page {
    padding: 2rem;
    background-color: #f9fafb;
    max-width: 900px;
    margin: 0 auto;
}

.navigation-container {
    margin-bottom: 1.5rem;
}

.back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    color: #555;
    font-weight: 600;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    background-color: #f0f0f0;
    transition: all 0.2s ease-in-out;
}

.back-link:hover {
    background-color: #e0e0e0;
}

.match-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fff;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    margin-bottom: 2rem;
}

.team-banner {
    flex: 1;
    text-align: center;
}

.team-name {
    font-size: 1.5rem;
    font-weight: bold;
    color: #111827;
}

.score-display {
    text-align: center;
    padding: 0 2rem;
}

.final-score {
    font-size: 3.5rem;
    font-weight: 700;
    color: #111827;
}

.penalty-result {
    font-size: 1rem;
    color: #6b7280;
    margin-top: 0.5rem;
}

.match-body {
    background-color: #fff;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.match-body h3 {
    text-align: center;
    font-size: 1.5rem;
    margin-top: 0;
    margin-bottom: 2rem;
}

.timeline-container {
    display: flex;
    flex-direction: column;
}

.timeline-entry {
    display: flex;
    align-items: center;
    position: relative;
    min-height: 50px;
}

.timeline-entry.left {
    justify-content: flex-start;
}

.timeline-entry.right {
    justify-content: flex-end;
}

.event-details {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 45%;
}

.timeline-entry.right .event-details {
    justify-content: flex-end;
    flex-direction: row-reverse;
}

.event-minute {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    background-color: #f3f4f6;
    border-radius: 15px;
    padding: 0.2rem 0.6rem;
    font-size: 0.8rem;
    font-weight: bold;
    color: #4b5563;
}

.event-details i {
    font-size: 1.2rem;
}

.penalty-timeline {
    margin-top: 2rem;
}

.period-header {
    text-align: center;
    font-weight: bold;
    color: #6b7280;
    margin: 1.5rem 0 1rem;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 0.5rem;
}

.fa-futbol,
.fa-check-circle {
    color: #198754;
}
.yellow-card {
    color: #ffc107;
}
.red-card,
.fa-times-circle {
    color: #dc3545;
}

.loading-state,
.error-state {
    text-align: center;
    padding: 5rem 1rem;
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

.timeline-split {
    display: flex;
    justify-content: space-between;
}

.timeline-col {
    width: 48%;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.event-row-split {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1rem;
}

.timeline-col.right-aligned {
    text-align: right;
}

.timeline-col.right-aligned .event-row-split {
    justify-content: flex-end;
    flex-direction: row-reverse;
}
</style>
