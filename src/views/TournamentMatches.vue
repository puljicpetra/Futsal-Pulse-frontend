<template>
    <div class="tournament-matches-page">
        <div v-if="isLoading" class="loading-state">
            <div class="spinner"></div>
        </div>
        <div v-else-if="error" class="error-state">
            <p>{{ error }}</p>
        </div>
        <div v-else>
            <div class="page-header">
                <h1>Match Schedule</h1>
                <router-link
                    v-if="tournament"
                    :to="`/tournaments/${tournament._id}`"
                    class="back-link"
                >
                    <i class="fas fa-arrow-left"></i> Back to Tournament
                </router-link>
            </div>

            <ul class="matches-list">
                <li v-for="match in matches" :key="match._id" class="match-item">
                    <div class="match-info">
                        <span class="team-name">{{ match.teamA.name || 'TBD' }}</span>
                        <span class="match-score">
                            {{ finalScore(match).teamA }} : {{ finalScore(match).teamB }}
                            <span
                                v-if="match.result_type === 'penalties' && match.penalty_shootout"
                                class="penalty-score"
                            >
                                ({{ match.penalty_shootout.teamA_goals }} -
                                {{ match.penalty_shootout.teamB_goals }})
                            </span>
                        </span>
                        <span class="team-name">{{ match.teamB.name || 'TBD' }}</span>
                    </div>

                    <div class="match-meta">
                        <span>{{ formatMatchDate(match.matchDate) }}</span>
                        <span v-if="match.result_type === 'penalties'" class="status-badge penalty"
                            >PSO</span
                        >
                        <span
                            v-else-if="match.result_type === 'overtime'"
                            class="status-badge overtime"
                            >AET</span
                        >
                        <span v-if="match.status === 'finished'" class="status-badge finished"
                            >Final</span
                        >
                        <span v-else-if="match.group" class="group-badge">{{ match.group }}</span>
                    </div>

                    <div
                        v-if="match.events && match.events.length > 0"
                        class="event-timeline-container"
                    >
                        <div class="timeline-team">
                            <div
                                v-for="event in sortedTeamEvents(
                                    match.events,
                                    match.teamA._id,
                                    false
                                )"
                                :key="event._id"
                                class="event-item"
                            >
                                <i :class="getEventIcon(event.type)"></i>
                                <span>{{ getPlayerName(event.playerId) }} {{ event.minute }}'</span>
                            </div>
                            <div
                                v-if="teamHasOvertimeEvents(match.events, match.teamA._id)"
                                class="period-header-timeline"
                            >
                                Overtime
                            </div>
                            <div
                                v-for="event in sortedTeamEvents(
                                    match.events,
                                    match.teamA._id,
                                    true
                                )"
                                :key="event._id"
                                class="event-item"
                            >
                                <i :class="getEventIcon(event.type)"></i>
                                <span>{{ getPlayerName(event.playerId) }} {{ event.minute }}'</span>
                            </div>
                        </div>

                        <div class="timeline-team right">
                            <div
                                v-for="event in sortedTeamEvents(
                                    match.events,
                                    match.teamB._id,
                                    false
                                )"
                                :key="event._id"
                                class="event-item"
                            >
                                <span>{{ event.minute }}' {{ getPlayerName(event.playerId) }}</span>
                                <i :class="getEventIcon(event.type)"></i>
                            </div>
                            <div
                                v-if="teamHasOvertimeEvents(match.events, match.teamB._id)"
                                class="period-header-timeline"
                            >
                                Overtime
                            </div>
                            <div
                                v-for="event in sortedTeamEvents(
                                    match.events,
                                    match.teamB._id,
                                    true
                                )"
                                :key="event._id"
                                class="event-item"
                            >
                                <span>{{ event.minute }}' {{ getPlayerName(event.playerId) }}</span>
                                <i :class="getEventIcon(event.type)"></i>
                            </div>
                        </div>
                    </div>

                    <div v-if="isOwner" class="owner-actions">
                        <button
                            @click.stop="toggleMenu(match._id)"
                            class="btn-menu"
                            title="Actions"
                        >
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <div v-if="openMenuId === match._id" class="actions-dropdown" @click.stop>
                            <a v-if="match.status !== 'finished'" @click="openEventsModal(match)">
                                <i class="fas fa-stopwatch"></i> Manage Events
                            </a>
                            <a
                                v-if="match.status !== 'finished'"
                                :class="{ disabled: !canFinish(match) }"
                                @click="canFinish(match) && finishMatch(match._id)"
                                title="Finish Match"
                            >
                                <i class="fas fa-flag-checkered"></i> Finish Match
                            </a>
                            <a @click="deleteMatch(match._id)" class="text-danger">
                                <i class="fas fa-trash-alt"></i> Delete Match
                            </a>
                        </div>
                    </div>
                </li>
            </ul>
        </div>

        <div v-if="showEventsModal" class="modal-overlay" @click.self="closeEventsModal">
            <div class="modal-content large">
                <h3>Manage Match Events</h3>
                <p v-if="selectedMatch">
                    {{ selectedMatch.teamA.name }} vs {{ selectedMatch.teamB.name }}
                </p>

                <div class="period-selector">
                    <label>Event Period:</label>
                    <select v-model="newEventPeriod">
                        <option value="regular">Regular Time</option>
                        <option
                            value="overtime"
                            :disabled="
                                selectedMatch.result_type === 'regular' && !selectedMatchFinished
                            "
                        >
                            Overtime
                        </option>
                        <option
                            value="penalties"
                            :disabled="
                                selectedMatch.result_type !== 'penalties' && !selectedMatchFinished
                            "
                        >
                            Penalties
                        </option>
                    </select>
                </div>

                <div v-if="newEventPeriod !== 'penalties'" class="event-section">
                    <form @submit.prevent="handleAddEvent" class="event-form">
                        <select v-model="newEvent.teamId" required>
                            <option :value="null" disabled>Select Team</option>
                            <option :value="selectedMatch.teamA._id">
                                {{ selectedMatch.teamA.name }}
                            </option>
                            <option :value="selectedMatch.teamB._id">
                                {{ selectedMatch.teamB.name }}
                            </option>
                        </select>

                        <select v-model="newEvent.playerId" required :disabled="!newEvent.teamId">
                            <option :value="null" disabled>Select Player</option>
                            <option
                                v-for="player in availablePlayers"
                                :key="player._id"
                                :value="player._id"
                            >
                                {{ player.name }}
                            </option>
                        </select>

                        <select v-model="newEvent.type" required>
                            <option value="goal">Goal</option>
                            <option value="yellow-card">Yellow Card</option>
                            <option value="red-card">Red Card</option>
                        </select>

                        <input
                            type="text"
                            inputmode="numeric"
                            pattern="[0-9]*"
                            v-model.number="newEvent.minute"
                            :placeholder="newEventPeriod === 'overtime' ? '41–50' : '1–40'"
                            required
                            class="minute-input"
                        />
                        <button
                            type="submit"
                            class="btn-submit small"
                            :disabled="isSubmittingEvent"
                        >
                            {{ isSubmittingEvent ? 'Adding…' : 'Add' }}
                        </button>
                    </form>
                </div>

                <div v-if="newEventPeriod === 'penalties'" class="event-section">
                    <form @submit.prevent class="penalty-form">
                        <select v-model="newPenalty.teamId" required>
                            <option :value="null" disabled>Select Team</option>
                            <option :value="selectedMatch.teamA._id">
                                {{ selectedMatch.teamA.name }}
                            </option>
                            <option :value="selectedMatch.teamB._id">
                                {{ selectedMatch.teamB.name }}
                            </option>
                        </select>

                        <select
                            v-model="newPenalty.playerId"
                            required
                            :disabled="!newPenalty.teamId"
                        >
                            <option :value="null" disabled>Select Player</option>
                            <option
                                v-for="player in availablePenaltyTakers"
                                :key="player._id"
                                :value="player._id"
                            >
                                {{ player.name }}
                            </option>
                        </select>

                        <div class="penalty-actions">
                            <button
                                type="button"
                                @click=";(newPenalty.outcome = 'scored'), handleAddPenaltyEvent()"
                                class="btn-submit small"
                                :disabled="
                                    isSubmittingEvent || !newPenalty.teamId || !newPenalty.playerId
                                "
                            >
                                Scored
                            </button>
                            <button
                                type="button"
                                @click=";(newPenalty.outcome = 'missed'), handleAddPenaltyEvent()"
                                class="btn-cancel small"
                                :disabled="
                                    isSubmittingEvent || !newPenalty.teamId || !newPenalty.playerId
                                "
                            >
                                Missed
                            </button>
                        </div>
                    </form>
                </div>

                <div
                    v-if="
                        isRegularTimeTie(selectedMatch) &&
                        selectedMatch.result_type === 'regular' &&
                        !selectedMatchFinished
                    "
                    class="proceed-section"
                >
                    <button @click="handleProceedToOvertime" class="btn-proceed">
                        Proceed to Overtime
                    </button>
                </div>
                <div
                    v-if="
                        isOvertimeTie(selectedMatch) &&
                        selectedMatch.result_type === 'overtime' &&
                        !selectedMatchFinished
                    "
                    class="proceed-section"
                >
                    <button @click="handleProceedToPenalties" class="btn-proceed">
                        Proceed to Penalties
                    </button>
                </div>

                <div class="existing-events-list">
                    <div v-if="regularTimeEvents.length > 0">
                        <div class="period-header">Regular Time</div>
                        <div
                            v-for="event in regularTimeEvents"
                            :key="event._id"
                            class="existing-event-item"
                        >
                            <span>
                                <i :class="getEventIcon(event.type)"></i>
                                {{ event.minute }}' - {{ getPlayerName(event.playerId) }} ({{
                                    getTeamName(event.teamId)
                                }})
                            </span>
                            <button
                                @click="handleDeleteEvent(selectedMatch._id, event._id)"
                                class="btn-delete-event"
                                title="Delete Event"
                            >
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>

                    <div v-if="overtimeEvents.length > 0">
                        <div class="period-header">Overtime</div>
                        <div
                            v-for="event in overtimeEvents"
                            :key="event._id"
                            class="existing-event-item overtime-event"
                        >
                            <span>
                                <i :class="getEventIcon(event.type)"></i>
                                {{ event.minute }}' - {{ getPlayerName(event.playerId) }} ({{
                                    getTeamName(event.teamId)
                                }})
                            </span>
                            <button
                                @click="handleDeleteEvent(selectedMatch._id, event._id)"
                                class="btn-delete-event"
                                title="Delete Event"
                            >
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>

                    <div v-if="penaltyEvents.length > 0">
                        <div class="period-header">Penalty Shootout</div>
                        <div
                            v-for="event in penaltyEvents"
                            :key="event._id"
                            class="existing-event-item"
                        >
                            <span>
                                <i :class="getPenaltyIcon(event.outcome)"></i>
                                {{ getPlayerName(event.playerId) }} ({{
                                    getTeamName(event.teamId)
                                }})
                            </span>
                        </div>
                    </div>
                </div>

                <div class="modal-actions">
                    <button type="button" @click="closeEventsModal" class="btn-cancel">Done</button>
                </div>
                <p v-if="eventsModalError" class="error-message">{{ eventsModalError }}</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import apiClient from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()
const tournamentId = route.params.id

const matches = ref([])
const tournament = ref(null)
const isLoading = ref(true)
const error = ref('')
const openMenuId = ref(null)

const allPlayers = ref(new Map())

const showEventsModal = ref(false)
const selectedMatch = ref(null)
const isSubmittingEvent = ref(false)
const eventsModalError = ref('')
const newEventPeriod = ref('regular')
const newEvent = ref({ type: 'goal', teamId: null, playerId: null, minute: null })
const newPenalty = ref({ teamId: null, playerId: null, outcome: null })

const MAX_PENALTY_SERIES = 5
const MAX_REGULAR_MINUTE = 40

const oidString = (v) =>
    typeof v === 'string' ? v : v?.$oid ?? (typeof v?.toString === 'function' ? v.toString() : null)
const idKey = (v) => String(oidString(v) ?? v ?? '')
const idEq = (a, b) => {
    const sa = oidString(a),
        sb = oidString(b)
    return !!sa && !!sb && sa === sb
}

const isOwner = computed(() => {
    if (!authStore.isLoggedIn || !tournament.value) return false
    const orgId =
        oidString(tournament.value.organizer) || oidString(tournament.value.organizerInfo?._id)
    return idEq(orgId, authStore.userId)
})

const fetchTournamentData = async () => {
    try {
        const { data } = await apiClient.get(`/api/tournaments/${tournamentId}`)
        tournament.value = data
    } catch (err) {
        console.error('Failed to fetch tournament data for header:', err)
    }
}

const fetchMatches = async () => {
    isLoading.value = true
    allPlayers.value.clear()
    try {
        const { data } = await apiClient.get(`/api/matches/tournament/${tournamentId}`)
        for (const match of data) {
            match.teamA?.players?.forEach((p) => allPlayers.value.set(idKey(p._id), p))
            match.teamB?.players?.forEach((p) => allPlayers.value.set(idKey(p._id), p))
        }
        matches.value = data
    } catch (err) {
        console.error('Failed to fetch matches:', err)
        error.value = 'Failed to load match schedule.'
    } finally {
        isLoading.value = false
    }
}

const selectedMatchFinished = computed(() => selectedMatch.value?.status === 'finished')

const ejectionMap = (match) => {
    const map = new Map()
    const yellowCounts = new Map()
    const evts = (match?.events || []).slice().sort((a, b) => (a.minute || 0) - (b.minute || 0))
    for (const e of evts) {
        const pid = idKey(e.playerId)
        if (!pid) continue
        if (map.has(pid)) continue
        if (e.type === 'red-card') {
            map.set(pid, e.minute || 0)
        } else if (e.type === 'yellow-card') {
            yellowCounts.set(pid, (yellowCounts.get(pid) || 0) + 1)
            if (yellowCounts.get(pid) >= 2) {
                map.set(pid, e.minute || 0)
            }
        }
    }
    return map
}
const isEjected = (playerId) => {
    if (!selectedMatch.value) return false
    return ejectionMap(selectedMatch.value).has(idKey(playerId))
}
const ejectedBeforeMinute = (playerId, minute) => {
    if (!selectedMatch.value) return false
    const m = ejectionMap(selectedMatch.value).get(idKey(playerId))
    if (m == null) return false
    return Number(minute) > Number(m)
}

const penaltyShotsForTeam = (match, teamId) =>
    (match?.penalty_shootout?.events || []).filter((e) => idEq(e.teamId, teamId)).length

const computePenaltyDecision = (match) => {
    const ps = match?.penalty_shootout
    if (!ps) return { decided: false }
    const shotsA = penaltyShotsForTeam(match, match.teamA._id)
    const shotsB = penaltyShotsForTeam(match, match.teamB._id)
    const goalsA = ps.teamA_goals ?? 0
    const goalsB = ps.teamB_goals ?? 0

    if (shotsA <= MAX_PENALTY_SERIES && shotsB <= MAX_PENALTY_SERIES) {
        const remA = MAX_PENALTY_SERIES - shotsA
        const remB = MAX_PENALTY_SERIES - shotsB
        if (goalsA - goalsB > remB) return { decided: true }
        if (goalsB - goalsA > remA) return { decided: true }
    }
    if (shotsA >= MAX_PENALTY_SERIES && shotsB >= MAX_PENALTY_SERIES) {
        if (shotsA === shotsB && goalsA !== goalsB) return { decided: true }
    }
    return { decided: false }
}

const availablePlayers = computed(() => {
    if (!newEvent.value.teamId || !selectedMatch.value) return []
    const roster = idEq(newEvent.value.teamId, selectedMatch.value.teamA._id)
        ? selectedMatch.value.teamA.players
        : selectedMatch.value.teamB.players

    if (selectedMatchFinished.value) return roster

    const minute = Number(newEvent.value.minute)
    if (!minute || minute < 1) return roster

    return roster.filter((p) => !ejectedBeforeMinute(p._id, minute))
})

const availablePenaltyTakers = computed(() => {
    if (!newPenalty.value.teamId || !selectedMatch.value) return []
    const roster = idEq(newPenalty.value.teamId, selectedMatch.value.teamA._id)
        ? selectedMatch.value.teamA.players
        : selectedMatch.value.teamB.players

    if (selectedMatchFinished.value) return roster
    const em = ejectionMap(selectedMatch.value)
    return roster.filter((p) => !em.has(idKey(p._id)))
})

const regularTimeEvents = computed(
    () =>
        selectedMatch.value?.events
            ?.filter((e) => e.minute <= 40)
            .sort((a, b) => a.minute - b.minute) || []
)
const overtimeEvents = computed(
    () =>
        selectedMatch.value?.events
            ?.filter((e) => e.minute > 40)
            .sort((a, b) => a.minute - b.minute) || []
)
const penaltyEvents = computed(() => selectedMatch.value?.penalty_shootout?.events || [])

const isRegularTimeTie = (match) => (match?.score?.teamA ?? 0) === (match?.score?.teamB ?? 0)
const isOvertimeTie = (match) => {
    if (!match || !match.overtime_score) return false
    const a = (match.score?.teamA ?? 0) + (match.overtime_score?.teamA ?? 0)
    const b = (match.score?.teamB ?? 0) + (match.overtime_score?.teamB ?? 0)
    return a === b
}

const finalScore = (match) => {
    let final = { teamA: match.score?.teamA ?? 0, teamB: match.score?.teamB ?? 0 }
    if (match.overtime_score) {
        final.teamA += match.overtime_score.teamA
        final.teamB += match.overtime_score.teamB
    }
    return final
}

const canFinish = (m) => {
    if (!m) return false
    if (m.result_type === 'penalties') {
        return computePenaltyDecision(m).decided
    }
    if (m.result_type === 'overtime') {
        return !isOvertimeTie(m)
    }
    return !isRegularTimeTie(m)
}

const teamHasOvertimeEvents = (events, teamId) => {
    if (!events) return false
    return events.some((e) => idEq(e.teamId, teamId) && e.minute > 40)
}

const formatMatchDate = (dateString) => {
    if (!dateString) return 'N/A'
    const options = {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }
    const locale = navigator.language || undefined
    return new Date(dateString).toLocaleString(locale, options)
}

const sortedTeamEvents = (events, teamId, isOvertime) => {
    if (!events) return []
    return events
        .filter((e) => {
            const inOT = e.minute > 40
            return idEq(e.teamId, teamId) && (isOvertime ? inOT : !inOT)
        })
        .sort((a, b) => a.minute - b.minute)
}

const getEventIcon = (type) =>
    ({
        goal: 'fas fa-futbol',
        'yellow-card': 'fas fa-square yellow-card',
        'red-card': 'fas fa-square red-card',
    }[type] || 'fas fa-question')

const getPenaltyIcon = (outcome) =>
    outcome === 'scored' ? 'fas fa-check-circle' : 'fas fa-times-circle'

const getPlayerName = (playerId) => allPlayers.value.get(idKey(playerId))?.name || 'Unknown'

const getTeamName = (teamId) => {
    if (!selectedMatch.value) return ''
    if (idEq(selectedMatch.value.teamA?._id, teamId)) return selectedMatch.value.teamA.name
    if (idEq(selectedMatch.value.teamB?._id, teamId)) return selectedMatch.value.teamB.name
    return 'Unknown'
}

const closeMenu = () => {
    openMenuId.value = null
}
const toggleMenu = (matchId) => {
    openMenuId.value = openMenuId.value === matchId ? null : matchId
}

const closeEventsModal = () => {
    showEventsModal.value = false
    selectedMatch.value = null
    eventsModalError.value = ''
    fetchMatches()
}

const openEventsModal = (match) => {
    closeMenu()
    selectedMatch.value = match
    newEventPeriod.value = 'regular'
    eventsModalError.value = ''
    newEvent.value = { type: 'goal', teamId: null, playerId: null, minute: null }
    newPenalty.value = { teamId: null, playerId: null, outcome: null }
    showEventsModal.value = true
}

const handleAddEvent = async () => {
    const minute = Number(newEvent.value.minute)
    const period = newEventPeriod.value

    if (!newEvent.value.teamId || !newEvent.value.playerId) {
        eventsModalError.value = 'Please select team and player.'
        return
    }
    if (!minute || minute < 1) {
        eventsModalError.value = 'Minute must be a positive number.'
        return
    }

    if (!selectedMatchFinished.value) {
        if (period === 'regular' && minute > MAX_REGULAR_MINUTE) {
            eventsModalError.value = 'Regular time minutes cannot exceed 40.'
            return
        }
        if (period === 'overtime') {
            if (minute <= MAX_REGULAR_MINUTE || minute > 50) {
                eventsModalError.value = 'Overtime minutes must be between 41 and 50.'
                return
            }
            if (!isRegularTimeTie(selectedMatch.value)) {
                eventsModalError.value =
                    'Cannot add overtime events unless regular time ended level.'
                return
            }
        }
        if (ejectedBeforeMinute(newEvent.value.playerId, minute)) {
            eventsModalError.value =
                'This player was sent off earlier and cannot have further events.'
            return
        }
    } else {
    }

    isSubmittingEvent.value = true
    eventsModalError.value = ''
    try {
        const { data } = await apiClient.post(
            `/api/matches/${selectedMatch.value._id}/events`,
            newEvent.value
        )
        const updatedMatch = data.match
        const index = matches.value.findIndex((m) => idEq(m._id, updatedMatch._id))
        if (index !== -1) matches.value[index] = updatedMatch
        selectedMatch.value = updatedMatch
        newEvent.value = { type: 'goal', teamId: null, playerId: null, minute: null }
    } catch (err) {
        eventsModalError.value = err.response?.data?.message || 'Failed to add event.'
    } finally {
        isSubmittingEvent.value = false
    }
}

const handleDeleteEvent = async (matchId, eventId) => {
    try {
        const { data } = await apiClient.delete(`/api/matches/${matchId}/events/${eventId}`)
        const updatedMatch = data.match
        const index = matches.value.findIndex((m) => idEq(m._id, matchId))
        if (index !== -1) matches.value[index] = updatedMatch
        selectedMatch.value = updatedMatch
    } catch (err) {
        console.error('Failed to delete event:', err)
        eventsModalError.value = err.response?.data?.message || 'Failed to delete event.'
    }
}

const handleProceedToOvertime = () => {
    selectedMatch.value.result_type = 'overtime'
    newEventPeriod.value = 'overtime'
}
const handleProceedToPenalties = () => {
    selectedMatch.value.result_type = 'penalties'
    newEventPeriod.value = 'penalties'
}

const handleAddPenaltyEvent = async () => {
    if (!newPenalty.value.teamId || !newPenalty.value.playerId || !newPenalty.value.outcome) return

    if (!selectedMatchFinished.value) {
        if (!isOvertimeTie(selectedMatch.value)) {
            eventsModalError.value = 'Penalties are only allowed if it is tied after overtime.'
            return
        }
        if (isEjected(newPenalty.value.playerId)) {
            eventsModalError.value = 'Sent-off players cannot take penalties.'
            return
        }
    }

    isSubmittingEvent.value = true
    eventsModalError.value = ''
    try {
        const { data } = await apiClient.post(
            `/api/matches/${selectedMatch.value._id}/penalties`,
            newPenalty.value
        )
        const updatedMatch = data.match
        const index = matches.value.findIndex((m) => idEq(m._id, updatedMatch._id))
        if (index !== -1) matches.value[index] = updatedMatch
        selectedMatch.value = updatedMatch
        newPenalty.value = { teamId: newPenalty.value.teamId, playerId: null, outcome: null }
    } catch (err) {
        eventsModalError.value = err.response?.data?.message || 'Failed to add penalty event.'
    } finally {
        isSubmittingEvent.value = false
    }
}

const deleteMatch = async (matchId) => {
    closeMenu()
    if (
        !window.confirm('Are you sure you want to delete this match? This action cannot be undone.')
    )
        return
    try {
        await apiClient.delete(`/api/matches/${matchId}`)
        matches.value = matches.value.filter((m) => !idEq(m._id, matchId))
    } catch (err) {
        console.error('Failed to delete match:', err)
        error.value = err.response?.data?.message || 'Failed to delete match.'
        setTimeout(() => (error.value = ''), 3000)
    }
}

const finishMatch = async (matchId) => {
    closeMenu()
    if (!window.confirm('Mark this match as finished?')) return
    try {
        const { data } = await apiClient.patch(`/api/matches/${matchId}/finish`)
        const updated = data.match
        const idx = matches.value.findIndex((m) => idEq(m._id, matchId))
        if (idx !== -1) matches.value[idx] = updated
    } catch (err) {
        console.error('Failed to finish match:', err)
        error.value = err.response?.data?.message || 'Failed to finish match.'
        setTimeout(() => (error.value = ''), 3000)
    }
}

watch(
    [() => newEvent.value.minute, () => newEvent.value.teamId, () => selectedMatch.value?.events],
    () => {
        if (!selectedMatch.value || selectedMatchFinished.value) return
        const minute = Number(newEvent.value.minute)
        if (!minute || minute < 1) return
        const pid = newEvent.value.playerId
        if (pid && ejectedBeforeMinute(pid, minute)) {
            newEvent.value.playerId = null
        }
    }
)

watch([() => newPenalty.value.teamId, () => selectedMatch.value?.events], () => {
    if (!selectedMatch.value || selectedMatchFinished.value) return
    const pid = newPenalty.value.playerId
    if (pid && isEjected(pid)) {
        newPenalty.value.playerId = null
    }
})

onMounted(() => {
    fetchMatches()
    fetchTournamentData()
    window.addEventListener('click', closeMenu)
})
onUnmounted(() => {
    window.removeEventListener('click', closeMenu)
})
</script>

<style scoped>
.tournament-matches-page {
    max-width: 900px;
    margin: 2rem auto;
    padding: 2rem;
}
.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}
.page-header h1 {
    margin: 0;
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
.card {
    background: #fff;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
.card-header-flex {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}
.card-header-flex h2 {
    margin: 0;
    padding: 0;
    font-size: 1.5rem;
    color: #333;
    display: flex;
    align-items: center;
    border: none;
}
.card-header-flex h2 i {
    margin-right: 0.75rem;
    color: #00aeef;
}
.btn-add-match {
    background-color: #198754;
    color: #fff;
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.loading-state-small,
.text-muted {
    text-align: center;
    color: #888;
    padding: 1rem;
    font-style: italic;
}
.matches-list {
    list-style: none;
    padding: 0;
    margin: 0;
}
.match-item {
    padding: 1rem;
    border-bottom: 1px solid #f0f0f0;
    position: relative;
}
.match-item:last-child {
    border-bottom: none;
}
.match-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
}
.match-info .team-name {
    flex: 1;
    text-align: center;
}
.match-score {
    font-size: 1.25rem;
    padding: 0 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.penalty-score {
    font-size: 0.9rem;
    font-weight: normal;
    color: #666;
}
.match-meta {
    font-size: 0.85rem;
    color: #888;
    text-align: center;
    margin-top: 0.5rem;
}
.group-badge {
    display: inline-block;
    background-color: #e9ecef;
    color: #495057;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    margin-left: 0.5rem;
}
.status-badge {
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
    margin-left: 0.5rem;
    font-weight: 700;
}
.status-badge.finished {
    background: #e2e3e5;
    color: #495057;
}
.status-badge.overtime {
    background: #fff3cd;
    color: #664d03;
}
.status-badge.penalty {
    background: #e2d9f3;
    color: #4c2a92;
}
.owner-actions {
    position: absolute;
    top: 50%;
    right: 1rem;
    transform: translateY(-50%);
}
.btn-menu {
    background: none;
    border: none;
    color: #aaa;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.5rem;
    border-radius: 50%;
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
}
.btn-menu:hover {
    background: #f0f0f0;
    color: #333;
}
.actions-dropdown {
    position: absolute;
    top: calc(100% + 5px);
    right: 0;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    border: 1px solid #eee;
    padding: 0.5rem 0;
    z-index: 10;
    width: 180px;
    overflow: hidden;
}
.actions-dropdown a {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    cursor: pointer;
    color: #333;
    font-size: 0.9rem;
    white-space: nowrap;
    text-decoration: none;
}
.actions-dropdown a:hover {
    background: #f5f5f5;
}
.actions-dropdown a i {
    width: 16px;
    text-align: center;
    color: #888;
}
.actions-dropdown a.text-danger {
    color: #dc3545;
}
.actions-dropdown a.text-danger:hover {
    background: #fee2e2;
    color: #b91c1c;
}
.actions-dropdown a.text-danger i {
    color: #dc3545;
}

.actions-dropdown a.disabled {
    opacity: 0.5;
    pointer-events: none;
    cursor: not-allowed;
}

.error-message {
    color: #dc3545;
    text-align: center;
    margin-top: 1rem;
}
.event-timeline-container {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 0 0.25rem;
    font-size: 0.8rem;
    color: #666;
}
.timeline-team {
    width: 45%;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
}
.timeline-team.right {
    align-items: flex-end;
}
.timeline-team .event-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
}
.timeline-team.right .event-item {
    flex-direction: row-reverse;
}
.period-header-timeline {
    font-weight: 700;
    font-size: 0.75rem;
    color: #333;
    margin-top: 0.5rem;
    width: 100%;
    text-align: left;
}
.timeline-team.right .period-header-timeline {
    text-align: right;
}
.event-item .fa-futbol,
.fa-check-circle {
    color: #198754;
}
.event-item .yellow-card {
    color: #ffc107;
}
.event-item .red-card,
.fa-times-circle {
    color: #dc3545;
}
.modal-overlay {
    position: fixed;
    top: 0,
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}
.modal-content {
    background: #fff;
    padding: 2rem;
    border-radius: 12px;
    width: 90%;
}
.modal-content.large {
    max-width: 650px;
}
.modal-content h3 {
    margin-top: 0;
}
.modal-content p {
    color: #666;
    text-align: center;
    margin-bottom: 1rem;
}
.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1.5rem;
}
.btn-cancel,
.btn-submit {
    padding: 0.7rem 1.2rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    border: none;
}
.btn-cancel {
    background: #e9ecef;
    color: #343a40;
    border: 1px solid #ced4da;
}
.btn-cancel.small {
    padding: 0.5rem 1rem;
    font-weight: 400;
}
.btn-cancel:hover {
    background: #dee2e6;
}
.btn-submit {
    background: #198754;
    color: #fff;
}
.btn-submit.small {
    padding: 0.5rem 1rem;
    font-weight: 400;
}
.btn-submit:disabled {
    background: #a0a0a0;
}
.event-section {
    margin-top: 1.5rem;
}
.period-selector {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 8px;
}
.period-selector label {
    font-weight: 700;
}
.period-selector select {
    flex-grow: 1;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 6px;
}
.event-form {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 80px auto;
    gap: 1rem;
    align-items: center;
}
.penalty-form {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: 1rem;
    align-items: center;
}
.penalty-actions {
    display: flex;
    gap: 0.5rem;
}
.event-form select,
.event-form input,
.penalty-form select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 6px;
}
.minute-input {
    -moz-appearance: textfield;
    appearance: none;
    margin: 0;
}
.minute-input::-webkit-outer-spin-button,
.minute-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}
.existing-events-list {
    margin-top: 1.5rem;
    max-height: 280px;
    overflow-y: auto;
    border: 1px solid #eee;
    border-radius: 8px;
}
.period-header {
    padding: 0.5rem 1rem;
    background: #f8f9fa;
    font-weight: 700;
    color: #333;
    border-bottom: 1px solid #eee;
}
.existing-event-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #f0f0f0;
}
.existing-event-item:last-child {
    border-bottom: none;
}
.existing-event-item.overtime-event {
    color: #664d03;
    background: #fff3cd;
}
.btn-delete-event {
    background: none;
    border: none;
    color: #aaa;
    cursor: pointer;
    padding: 0.25rem;
}
.btn-delete-event:hover {
    color: #dc3545;
}
.proceed-section {
    text-align: center;
    margin: 1.5rem 0;
}
.btn-proceed {
    background: #0d6efd;
    color: #fff;
    padding: 0.6rem 1.5rem;
    font-size: 1rem;
    border-radius: 8px;
    border: none;
    cursor: pointer;
}
</style>
