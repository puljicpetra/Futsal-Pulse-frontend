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
                    <span class="final-score">
                        {{ total.a }} - {{ total.b }}
                        <small v-if="suffix" class="score-suffix">{{ suffix }}</small>
                    </span>
                    <div class="meta-line">
                        <span v-if="match.status === 'finished'">FT</span>
                        <span v-else>{{ prettyDateTime(match.matchDate) }}</span>
                        <span v-if="match.stage" class="stage-chip">{{
                            labelForStage(match.stage)
                        }}</span>
                    </div>

                    <div v-if="match.penalty_shootout && showPenLine" class="penalty-result">
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
                    <template v-if="firstHalfEvents.length">
                        <div
                            v-for="(event, i) in firstHalfEvents"
                            :key="event._id || `fh-${idOf(event.playerId)}-${event.minute}-${i}`"
                            class="timeline-entry"
                            :class="isTeamBEvent(event) ? 'right' : 'left'"
                        >
                            <div class="event-details">
                                <i :class="getEventIcon(event.type)"></i>
                                <span class="player-name">{{ getPlayerName(event.playerId) }}</span>
                            </div>
                            <div class="event-minute">{{ event.minute }}'</div>
                        </div>
                    </template>

                    <div v-if="showSecondHalfHeader" class="period-header">2nd Half</div>
                    <template v-if="secondHalfEvents.length">
                        <div
                            v-for="(event, i) in secondHalfEvents"
                            :key="event._id || `sh-${idOf(event.playerId)}-${event.minute}-${i}`"
                            class="timeline-entry"
                            :class="isTeamBEvent(event) ? 'right' : 'left'"
                        >
                            <div class="event-details">
                                <i :class="getEventIcon(event.type)"></i>
                                <span class="player-name">{{ getPlayerName(event.playerId) }}</span>
                            </div>
                            <div class="event-minute">{{ event.minute }}'</div>
                        </div>
                    </template>

                    <div v-if="overtimeEvents.length" class="period-header">Overtime</div>
                    <template v-if="overtimeEvents.length">
                        <div
                            v-for="(event, i) in overtimeEvents"
                            :key="event._id || `ot-${idOf(event.playerId)}-${event.minute}-${i}`"
                            class="timeline-entry"
                            :class="isTeamBEvent(event) ? 'right' : 'left'"
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
                                :key="
                                    event._id || `${idOf(event.playerId)}-${event.outcome}-A-${i}`
                                "
                                class="event-row-split"
                            >
                                <span>{{ getPlayerName(event.playerId) }}</span>
                                <i :class="getPenaltyIcon(event.outcome)"></i>
                            </div>
                        </div>
                        <div class="timeline-col right-aligned">
                            <div
                                v-for="(event, i) in teamB_penalties"
                                :key="
                                    event._id || `${idOf(event.playerId)}-${event.outcome}-B-${i}`
                                "
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
import { totalScore, resultSuffix } from '@/utils/match'

const route = useRoute()
const match = ref(null)
const isLoading = ref(true)
const error = ref('')

const idOf = (obj) => {
    if (!obj) return ''
    if (typeof obj === 'string') return obj
    const raw = obj._id ?? obj.id ?? obj.$oid
    return typeof raw === 'string' ? raw : raw?.$oid ?? String(raw ?? '')
}

const playerMap = ref(new Map())
const buildPlayerMap = (m) => {
    playerMap.value.clear()
    m?.teamA?.players?.forEach((p) => playerMap.value.set(idOf(p._id), p))
    m?.teamB?.players?.forEach((p) => playerMap.value.set(idOf(p._id), p))
}

const fetchMatchDetails = async () => {
    isLoading.value = true
    error.value = ''
    try {
        const { data } = await apiClient.get(`/api/matches/${route.params.id}`)
        match.value = data
        buildPlayerMap(match.value)
    } catch (err) {
        error.value = err.response?.data?.message || 'Failed to fetch match details.'
    } finally {
        isLoading.value = false
    }
}

const total = computed(() => totalScore(match.value))
const suffix = computed(() => resultSuffix(match.value))
const showPenLine = computed(
    () =>
        !!match.value?.penalty_shootout &&
        typeof match.value.penalty_shootout.teamA_goals === 'number' &&
        typeof match.value.penalty_shootout.teamB_goals === 'number'
)

const allEventsSorted = computed(() => {
    const ev = match.value?.events ?? []
    return [...ev].sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0))
})
const firstHalfEvents = computed(() => allEventsSorted.value.filter((e) => (e.minute ?? 0) <= 20))
const secondHalfEvents = computed(() =>
    allEventsSorted.value.filter((e) => (e.minute ?? 0) > 20 && (e.minute ?? 0) <= 40)
)
const overtimeEvents = computed(() => allEventsSorted.value.filter((e) => (e.minute ?? 0) > 40))

const showSecondHalfHeader = computed(
    () => secondHalfEvents.value.length > 0 || overtimeEvents.value.length > 0
)

const penaltyEvents = computed(() => match.value?.penalty_shootout?.events || [])
const teamA_penalties = computed(() =>
    (match.value?.penalty_shootout?.events || []).filter(
        (e) => idOf(e.teamId) === idOf(match.value?.teamA)
    )
)
const teamB_penalties = computed(() =>
    (match.value?.penalty_shootout?.events || []).filter(
        (e) => idOf(e.teamId) === idOf(match.value?.teamB)
    )
)

const isTeamBEvent = (event) => idOf(event.teamId) === idOf(match.value?.teamB)
const getEventIcon = (type) =>
    ({
        goal: 'fas fa-futbol',
        'yellow-card': 'fas fa-square yellow-card',
        'red-card': 'fas fa-square red-card',
    }[type] || 'fas fa-question')
const getPenaltyIcon = (outcome) =>
    outcome === 'scored' ? 'fas fa-check-circle' : 'fas fa-times-circle'
const getPlayerName = (playerId) =>
    playerMap.value.get(idOf(playerId))?.name ||
    playerMap.value.get(idOf(playerId))?.full_name ||
    'Unknown'

const LABELS = {
    round_of_16: 'Round of 16',
    quarter: 'Quarter-final',
    semi: 'Semi-final',
    third_place: 'Third place',
    final: 'Final',
}
const labelForStage = (s) => LABELS[s] || '—'
const prettyDateTime = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    const locale = navigator.language || undefined
    return d.toLocaleString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

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
    transition: 0.2s;
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
.score-suffix {
    font-size: 1.2rem;
    font-weight: 600;
    color: #6b7280;
    margin-left: 0.35rem;
}
.meta-line {
    margin-top: 0.35rem;
    color: #6b7280;
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    align-items: center;
}
.stage-chip {
    font-size: 0.75rem;
    background: #eef9ff;
    color: #0078a3;
    border: 1px solid #cbeefe;
    padding: 0.1rem 0.45rem;
    border-radius: 999px;
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
    margin: 0 0 2rem 0;
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
        transform: rotate(0);
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
