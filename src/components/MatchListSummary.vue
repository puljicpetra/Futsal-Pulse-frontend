<template>
    <section class="card matches-summary" ref="rootEl">
        <div class="header">
            <h2><i class="fas fa-stream"></i> Matches</h2>
            <button
                v-if="isOwner"
                class="btn btn-primary"
                @click="$emit('add-match')"
                title="Add a new match"
            >
                <i class="fas fa-plus"></i> Add Match
            </button>
        </div>

        <div v-if="isLoading" class="loading-state-small">Loading matches...</div>
        <p v-else-if="matches.length === 0" class="text-muted">No matches yet.</p>

        <ul v-else class="match-list">
            <li v-for="m in matches" :key="m._id" class="match-row">
                <div class="match-main">
                    <div class="teams">
                        <div class="team side-a">
                            <span class="name">{{ m.teamA?.name || 'TBD' }}</span>
                        </div>

                        <div class="score-block" :class="{ finished: m.status === 'finished' }">
                            <div class="stage-chip" :title="toStageTitle(m.stage)">
                                {{ labelForStage(m.stage) }}
                            </div>
                            <div class="score">
                                <span class="n">{{ totalScore(m).a }}</span>
                                <span class="dash">-</span>
                                <span class="n">{{ totalScore(m).b }}</span>
                                <small class="suffix">{{ resultSuffix(m) }}</small>
                            </div>
                            <div class="status">
                                {{ m.status === 'finished' ? 'FT' : prettyDateTime(m.matchDate) }}
                            </div>
                        </div>

                        <div class="team side-b">
                            <span class="name">{{ m.teamB?.name || 'TBD' }}</span>
                        </div>
                    </div>
                </div>

                <div class="row-actions" v-if="isOwner">
                    <div class="menu-wrapper" :data-id="idOf(m)">
                        <button class="menu-btn" @click.stop="toggleMenu(idOf(m))" title="More">
                            <i class="fas fa-ellipsis-h"></i>
                        </button>
                        <div v-if="openMenuId === idOf(m)" class="menu" @click.stop>
                            <button class="menu-item" @click="openEditor(m)">
                                <i class="fas fa-pen"></i> Edit events
                            </button>
                            <button class="menu-item danger" @click="confirmDelete(m)">
                                <i class="fas fa-trash"></i> Delete match
                            </button>
                        </div>
                    </div>
                </div>
            </li>
        </ul>

        <div
            v-if="showEditor"
            class="modal-overlay"
            ref="overlayEl"
            tabindex="-1"
            @click.self="closeEditor"
            @keydown.esc="closeEditor"
        >
            <div class="modal-content wide">
                <div class="modal-header">
                    <h3>
                        <i class="fas fa-pen"></i>
                        Edit Events — {{ currentMatch?.teamA?.name }} vs
                        {{ currentMatch?.teamB?.name }}
                        <span class="chip">{{ labelForStage(currentMatch?.stage) }}</span>
                        <span v-if="isFinished" class="chip ft">FT</span>
                    </h3>

                    <div class="header-actions">
                        <button
                            v-if="!isFinished"
                            class="btn btn-finish"
                            :disabled="isFinishing"
                            @click="finishCurrentMatch"
                            title="Mark match as finished"
                        >
                            <span v-if="isFinishing" class="spinner-sm"></span>
                            <span v-else>Match finished</span>
                        </button>
                        <button class="icon-btn close-btn" @click="closeEditor" title="Close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                <div class="editor-layout">
                    <div class="event-form">
                        <h4>Add Event</h4>
                        <form @submit.prevent="submitEvent">
                            <div class="form-row">
                                <label>Type</label>
                                <select v-model="newEvent.type" required>
                                    <option value="goal">Goal</option>
                                    <option value="yellow-card">Yellow card</option>
                                    <option value="red-card">Red card</option>
                                </select>
                            </div>
                            <div class="form-row">
                                <label>Team</label>
                                <select v-model="newEvent.teamId" required @change="onTeamChange">
                                    <option disabled value="">Select team</option>
                                    <option :value="idOf(currentMatch.teamA)">
                                        {{ currentMatch.teamA?.name }}
                                    </option>
                                    <option :value="idOf(currentMatch.teamB)">
                                        {{ currentMatch.teamB?.name }}
                                    </option>
                                </select>
                            </div>
                            <div class="form-row">
                                <label>Player</label>
                                <select
                                    v-model="newEvent.playerId"
                                    required
                                    :disabled="eligiblePlayers.length === 0"
                                >
                                    <option disabled value="">Select player</option>
                                    <option
                                        v-for="p in eligiblePlayers"
                                        :key="idOf(p)"
                                        :value="idOf(p)"
                                    >
                                        {{ p.name || p.full_name || 'Unnamed' }}
                                    </option>
                                </select>
                            </div>
                            <div class="form-row">
                                <label>Minute</label>
                                <input
                                    type="number"
                                    inputmode="numeric"
                                    step="1"
                                    min="1"
                                    max="120"
                                    v-model.number="newEvent.minute"
                                    required
                                    placeholder="e.g., 17"
                                />
                            </div>
                            <div class="form-actions">
                                <button class="btn btn-success" :disabled="isSubmittingEvent">
                                    <span v-if="isSubmittingEvent" class="spinner-sm"></span>
                                    {{ isSubmittingEvent ? 'Adding...' : 'Add' }}
                                </button>
                            </div>

                            <p v-if="editorError" class="error-message mt">{{ editorError }}</p>
                            <p v-if="editorSuccess" class="success-message mt">
                                {{ editorSuccess }}
                            </p>
                        </form>
                    </div>

                    <div class="timeline">
                        <h4>Timeline</h4>
                        <div v-if="!currentMatch?.events?.length" class="text-muted">
                            No events yet.
                        </div>
                        <ul v-else class="timeline-list">
                            <li
                                v-for="ev in sortedEvents"
                                :key="idOf(ev)"
                                class="timeline-row"
                                :class="{ right: isTeamB(ev) }"
                            >
                                <div class="when">
                                    <span class="minute">{{ ev.minute }}'</span>
                                </div>
                                <div class="bubble">
                                    <span class="icon" :class="ev.type">
                                        <i v-if="ev.type === 'goal'" class="fas fa-futbol"></i>
                                        <span
                                            v-else
                                            class="card-badge"
                                            :class="ev.type === 'yellow-card' ? 'yellow' : 'red'"
                                        ></span>
                                    </span>
                                    <span class="who">{{ playerName(ev) }}</span>
                                </div>
                                <button
                                    class="icon-btn tiny danger"
                                    v-if="isOwner"
                                    @click="removeEvent(ev)"
                                    title="Remove event"
                                >
                                    <i class="fas fa-times"></i>
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from 'vue'
import apiClient from '@/services/api'
import { totalScore, resultSuffix } from '@/utils/match'

const props = defineProps({
    tournamentId: { type: String, required: true },
    isOwner: { type: Boolean, default: false },
})

const matches = ref([])
const isLoading = ref(true)

const openMenuId = ref(null)
const rootEl = ref(null)

const showEditor = ref(false)
const currentMatch = ref(null)
const overlayEl = ref(null)

const newEvent = ref({ type: 'goal', teamId: '', playerId: '', minute: '' })
const isSubmittingEvent = ref(false)
const editorError = ref('')
const editorSuccess = ref('')

const isFinishing = ref(false)
const isFinished = computed(() => currentMatch.value?.status === 'finished')

const LABELS = {
    round_of_16: 'Round of 16',
    quarter: 'Quarter-final',
    semi: 'Semi-final',
    third_place: 'Third place',
    final: 'Final',
}

const fetchMatchesSummary = async () => {
    isLoading.value = true
    try {
        const { data } = await apiClient.get(`/api/matches/tournament/${props.tournamentId}`)
        matches.value = Array.isArray(data) ? data : []
    } catch (err) {
        console.error('Failed to fetch matches summary:', err)
        matches.value = []
    } finally {
        isLoading.value = false
    }
}
defineExpose({ fetchMatchesSummary })

onMounted(() => {
    fetchMatchesSummary()
    document.addEventListener('click', handleDocClick, true)
})
onBeforeUnmount(() => {
    document.removeEventListener('click', handleDocClick, true)
})

watch(showEditor, async (v) => {
    if (v) {
        await nextTick()
        overlayEl.value?.focus()
    }
})

function handleDocClick(e) {
    const wrapper = e.target.closest('.menu-wrapper')
    if (!wrapper) {
        openMenuId.value = null
        return
    }
    const clickedId = wrapper?.dataset?.id
    if (clickedId !== openMenuId.value) {
        openMenuId.value = null
    }
}

const idOf = (obj) => {
    if (!obj) return ''
    if (typeof obj === 'string') return obj
    const raw = obj._id ?? obj.id
    if (!raw) return ''
    return typeof raw === 'string' ? raw : raw?.$oid ?? String(raw)
}
const labelForStage = (s) => LABELS[s] || '—'
const toStageTitle = (s) => labelForStage(s)
const prettyDateTime = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    const locale = navigator.language || undefined
    return d.toLocaleString(locale, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

const toggleMenu = (id) => {
    openMenuId.value = openMenuId.value === id ? null : id
}

const openEditor = async (m) => {
    openMenuId.value = null
    try {
        const { data } = await apiClient.get(`/api/matches/${idOf(m)}`)
        currentMatch.value = data
        resetEventForm()
        showEditor.value = true
    } catch (e) {
        console.error('Failed to load match details:', e)
    }
}
const closeEditor = () => {
    showEditor.value = false
    currentMatch.value = null
    editorError.value = ''
    editorSuccess.value = ''
}

const eligiblePlayers = computed(() => {
    if (!currentMatch.value || !newEvent.value.teamId) return []
    const isA = idOf(currentMatch.value.teamA) === newEvent.value.teamId
    const team = isA ? currentMatch.value.teamA : currentMatch.value.teamB
    return team?.players || []
})
const sortedEvents = computed(() => {
    const evs = (currentMatch.value?.events || []).slice()
    evs.sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0))
    return evs
})
const isTeamB = (ev) => idOf(ev.teamId) === idOf(currentMatch.value?.teamB)
const playerName = (ev) => {
    const team = isTeamB(ev) ? currentMatch.value?.teamB : currentMatch.value?.teamA
    const p = (team?.players || []).find((p) => idOf(p) === idOf(ev.playerId))
    return p?.name || p?.full_name || 'Unknown player'
}
const onTeamChange = () => {
    newEvent.value.playerId = ''
}
const resetEventForm = () => {
    newEvent.value = { type: 'goal', teamId: '', playerId: '', minute: '' }
}

const submitEvent = async () => {
    editorError.value = ''
    editorSuccess.value = ''
    const minuteNum = Number(newEvent.value.minute)
    if (
        !newEvent.value.type ||
        !newEvent.value.teamId ||
        !newEvent.value.playerId ||
        !minuteNum ||
        minuteNum < 1
    ) {
        editorError.value = 'Please fill type, team, player and a valid minute (≥ 1).'
        return
    }
    isSubmittingEvent.value = true
    try {
        const { data } = await apiClient.post(`/api/matches/${idOf(currentMatch.value)}/events`, {
            type: newEvent.value.type,
            minute: minuteNum,
            teamId: newEvent.value.teamId,
            playerId: newEvent.value.playerId,
        })
        currentMatch.value = data.match
        const idx = matches.value.findIndex((mm) => idOf(mm) === idOf(currentMatch.value))
        if (idx !== -1) {
            matches.value[idx] = {
                ...matches.value[idx],
                score: currentMatch.value.score,
                overtime_score: currentMatch.value.overtime_score,
                penalty_shootout: currentMatch.value.penalty_shootout,
                status: currentMatch.value.status,
                result_type: currentMatch.value.result_type,
            }
        }
        editorSuccess.value = 'Event added.'
        resetEventForm()
    } catch (e) {
        console.error('add event error:', e)
        editorError.value = e.response?.data?.message || 'Failed to add event.'
    } finally {
        isSubmittingEvent.value = false
    }
}

const removeEvent = async (ev) => {
    if (!confirm('Remove this event?')) return
    try {
        const { data } = await apiClient.delete(
            `/api/matches/${idOf(currentMatch.value)}/events/${idOf(ev)}`
        )
        currentMatch.value = data.match
        const idx = matches.value.findIndex((mm) => idOf(mm) === idOf(currentMatch.value))
        if (idx !== -1) {
            matches.value[idx] = {
                ...matches.value[idx],
                score: currentMatch.value.score,
                overtime_score: currentMatch.value.overtime_score,
                penalty_shootout: currentMatch.value.penalty_shootout,
                status: currentMatch.value.status,
                result_type: currentMatch.value.result_type,
            }
        }
    } catch (e) {
        console.error('delete event error:', e)
        alert(e.response?.data?.message || 'Failed to remove event.')
    }
}

const finishCurrentMatch = async () => {
    if (!currentMatch.value) return
    if (!confirm('Mark this match as finished?')) return
    isFinishing.value = true
    try {
        const { data } = await apiClient.patch(`/api/matches/${idOf(currentMatch.value)}/finish`)
        currentMatch.value = data.match
        const idx = matches.value.findIndex((mm) => idOf(mm) === idOf(currentMatch.value))
        if (idx !== -1) {
            matches.value[idx] = { ...matches.value[idx], status: 'finished' }
        }
        editorSuccess.value = 'Match marked as finished.'
        editorError.value = ''
    } catch (e) {
        console.error('finish match error:', e)
        editorError.value = e.response?.data?.message || 'Failed to finish match.'
    } finally {
        isFinishing.value = false
    }
}

const confirmDelete = async (m) => {
    openMenuId.value = null
    if (!confirm('Delete this match permanently?')) return
    try {
        await apiClient.delete(`/api/matches/${idOf(m)}`)
        matches.value = matches.value.filter((x) => idOf(x) !== idOf(m))
    } catch (e) {
        console.error('delete match error:', e)
        alert(e.response?.data?.message || 'Failed to delete match.')
    }
}
</script>

<style scoped>
.matches-summary .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.btn-primary {
    background: #00aeef;
    color: #fff;
    border: none;
    padding: 0.55rem 0.9rem;
    border-radius: 8px;
    font-weight: 700;
    cursor: pointer;
}
.btn-primary:hover {
    background: #008fbf;
}

.loading-state-small {
    text-align: center;
    color: #888;
    padding: 0.75rem;
}

.match-list {
    list-style: none;
    padding: 0;
    margin: 0;
}
.match-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.9rem 0;
    border-bottom: 1px solid #f0f0f0;
}
.match-row:last-child {
    border-bottom: none;
}

.teams {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 1rem;
}
.team {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.team .name {
    font-weight: 600;
    color: #333;
}
.side-b {
    justify-content: flex-end;
}

.score-block {
    display: grid;
    justify-items: center;
    gap: 0.2rem;
    min-width: 190px;
}
.score-block .score {
    font-size: 1.2rem;
    font-weight: 800;
    color: #111;
    display: inline-flex;
    align-items: baseline;
    gap: 4px;
}
.score-block .score .suffix {
    font-size: 0.8rem;
    font-weight: 600;
    color: #666;
}
.score-block .status {
    font-size: 0.8rem;
    color: #666;
}
.score-block.finished .status {
    color: #111;
    font-weight: 700;
}

.stage-chip {
    font-size: 0.73rem;
    background: #eef9ff;
    color: #0078a3;
    border: 1px solid #cbeefe;
    padding: 0.15rem 0.45rem;
    border-radius: 999px;
    white-space: nowrap;
}

.row-actions {
    position: relative;
}
.menu-wrapper {
    position: relative;
}
.menu-btn {
    background: #fff;
    color: #111;
    border: 1px solid #e6e6e6;
    border-radius: 10px;
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}
.menu-btn:hover {
    background: #f6f8fa;
}

.menu {
    position: absolute;
    right: 0;
    top: 42px;
    z-index: 2000;
    background: #fff;
    border: 1px solid #e6e6e6;
    border-radius: 12px;
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
    min-width: 170px;
    padding: 0.3rem;
}
.menu-item {
    width: 100%;
    text-align: left;
    border: none;
    background: transparent;
    padding: 0.6rem 0.7rem;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    gap: 0.5rem;
    align-items: center;
    color: #1f2937;
}
.menu-item:hover {
    background: #f3f4f6;
}
.menu-item.danger {
    color: #c82333;
}

.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: grid;
    place-items: center;
    z-index: 1000;
    outline: none;
}
.modal-content {
    background: #fff;
    border-radius: 16px;
    padding: 1rem 1rem 1.25rem;
    width: 95%;
    max-width: 960px;
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.25);
}
.modal-content.wide {
    max-width: 1000px;
}
.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.modal-header h3 {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.6rem;
}
.chip {
    font-size: 0.72rem;
    background: #eef9ff;
    color: #0078a3;
    padding: 0.15rem 0.45rem;
    border-radius: 999px;
}
.chip.ft {
    background: #e5e7eb;
    color: #111;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.icon-btn.close-btn {
    background: #fff;
    border: 1px solid #dcdcdc;
    color: #111;
}
.icon-btn.close-btn:hover {
    background: #f3f4f6;
}

.btn-finish {
    background: #111;
    color: #fff;
    border: none;
    padding: 0.45rem 0.75rem;
    border-radius: 8px;
    font-weight: 700;
    cursor: pointer;
}
.btn-finish:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.editor-layout {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 1.25rem;
    margin-top: 0.75rem;
}
@media (max-width: 900px) {
    .editor-layout {
        grid-template-columns: 1fr;
    }
}
.event-form,
.timeline {
    background: #fafbfc;
    border: 1px solid #eef1f3;
    border-radius: 12px;
    padding: 1rem;
}
.event-form h4,
.timeline h4 {
    margin: 0 0 0.75rem 0;
}

.form-row {
    display: grid;
    gap: 0.35rem;
    margin-bottom: 0.8rem;
}
.form-row label {
    font-weight: 600;
    color: #333;
    font-size: 0.9rem;
}
.form-row select,
.form-row input {
    width: 100%;
    padding: 0.7rem;
    border: 1px solid #dcdcdc;
    border-radius: 8px;
    font-size: 0.95rem;
}
.form-actions {
    display: flex;
    justify-content: flex-end;
}
.btn {
    border: none;
    border-radius: 8px;
    padding: 0.65rem 1rem;
    cursor: pointer;
}
.btn-success {
    background: #28a745;
    color: #fff;
}
.btn-success:disabled {
    background: #9dcaa6;
    cursor: not-allowed;
}

.mt {
    margin-top: 0.5rem;
}
.error-message {
    color: #721c24;
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 6px;
    padding: 0.55rem 0.7rem;
}
.success-message {
    color: #155724;
    background: #d4edda;
    border: 1px solid #c3e6cb;
    border-radius: 6px;
    padding: 0.55rem 0.7rem;
}
.spinner-sm {
    border: 2px solid rgba(255, 255, 255, 0.35);
    border-top: 2px solid #fff;
    border-radius: 50%;
    width: 14px;
    height: 14px;
    animation: spin 1s linear infinite;
    display: inline-block;
    vertical-align: middle;
}
@keyframes spin {
    0% {
        transform: rotate(0);
    }
    100% {
        transform: rotate(360deg);
    }
}

.timeline-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.25rem;
}
.timeline-row {
    display: grid;
    grid-template-columns: 44px 1fr auto;
    align-items: center;
}
.timeline-row.right {
    grid-template-columns: auto 1fr 44px;
    text-align: right;
}
.timeline-row.right .when {
    order: 3;
}
.timeline-row.right .bubble {
    order: 2;
    justify-self: end;
}
.timeline-row.right .icon-btn {
    order: 1;
    justify-self: start;
}

.when .minute {
    display: inline-block;
    background: #eef1f4;
    color: #374151;
    padding: 0.1rem 0.35rem;
    border-radius: 999px;
    font-weight: 700;
    font-size: 0.75rem;
}
.bubble {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    background: #fff;
    border: 1px solid #e6eaf0;
    border-radius: 999px;
    padding: 0.15rem 0.45rem;
    line-height: 1;
}
.icon {
    display: grid;
    place-items: center;
    width: 18px;
    height: 18px;
}
.icon i {
    font-size: 0.9rem;
}

.icon .card-badge {
    display: inline-block;
    width: 9px;
    height: 12px;
    border-radius: 2px;
    border: 1px solid rgba(0, 0, 0, 0.15);
}
.icon .card-badge.yellow {
    background: #facc15;
    border-color: #eab308;
}
.icon .card-badge.red {
    background: #ef4444;
    border-color: #dc2626;
}

.icon-btn {
    background: #f5f6f7;
    border: 1px solid #e6e6e6;
    border-radius: 8px;
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    cursor: pointer;
}
.icon-btn.tiny {
    width: 26px;
    height: 26px;
    border-radius: 6px;
}
.icon-btn.danger {
    color: #c82333;
    border-color: #f1d2d6;
    background: #fdebed;
}
</style>
