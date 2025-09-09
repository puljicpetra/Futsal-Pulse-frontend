<template>
    <section class="ann-section">
        <header class="ann-header">
            <h2><i class="fas fa-bullhorn"></i> Announcements</h2>

            <div class="right" v-if="authStore.isLoggedIn">
                <button
                    v-if="(isFan || (isPlayer && !isCaptainApproved)) && !subscribed"
                    class="btn sub"
                    @click="subscribe"
                    :disabled="busy"
                    title="Get notifications about this tournament"
                >
                    <i class="fas fa-bell"></i> Subscribe
                </button>
                <button
                    v-if="(isFan || (isPlayer && !isCaptainApproved)) && subscribed"
                    class="btn unsub"
                    @click="unsubscribe"
                    :disabled="busy"
                    title="Stop getting notifications"
                >
                    <i class="fas fa-bell-slash"></i> Unsubscribe
                </button>
            </div>
        </header>

        <p v-if="error" class="error">{{ error }}</p>

        <div v-if="isOrganizer" class="compose card">
            <h3 class="c-title">Post a new announcement</h3>
            <input
                v-model.trim="form.title"
                type="text"
                maxlength="160"
                placeholder="Optional title (max 160)"
            />
            <textarea
                v-model.trim="form.text"
                rows="4"
                maxlength="4000"
                placeholder="Write an update for captains and subscribed users…"
            ></textarea>
            <div class="actions">
                <button class="btn send" :disabled="busy || !form.text" @click="createAnnouncement">
                    <span v-if="busy" class="spinner-sm"></span>
                    <template v-else><i class="fas fa-paper-plane"></i> Send</template>
                </button>
            </div>
            <p v-if="composeMsg.text" :class="`msg ${composeMsg.type}`">{{ composeMsg.text }}</p>
        </div>

        <div v-if="loading" class="loading"><div class="spinner"></div></div>

        <p v-else-if="(isFan || (isPlayer && !isCaptainApproved)) && !subscribed" class="hint">
            Subscribe to receive this tournament’s announcements.
        </p>
        <p v-else-if="!authStore.isLoggedIn" class="hint">
            Log in to view announcements or subscribe.
        </p>

        <ul v-else class="list">
            <li v-for="a in announcements" :key="idOf(a._id)" class="item card">
                <div class="top">
                    <strong class="title">{{ a.title || 'Announcement' }}</strong>
                    <span class="date">{{ fmt(a.createdAt) }}</span>
                </div>
                <p class="text">{{ a.text }}</p>
            </li>
            <li v-if="announcements.length === 0" class="empty">No announcements yet.</li>
        </ul>
    </section>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import apiClient from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
    tournamentId: { type: String, required: true },
    tournament: { type: Object, default: null },
})

const authStore = useAuthStore()
const error = ref('')
const loading = ref(true)

const announcements = ref([])
const form = ref({ title: '', text: '' })
const busy = ref(false)
const composeMsg = ref({ type: '', text: '' })
const subscribed = ref(false)
const isCaptainApproved = ref(false)

const idOf = (v) => (typeof v === 'string' ? v : v?.$oid || v?.toString?.() || '')
const idEq = (a, b) => {
    const sa = idOf(a),
        sb = idOf(b)
    return !!sa && !!sb && String(sa) === String(sb)
}

const isFan = computed(() => authStore.userRole === 'fan')
const isPlayer = computed(() => authStore.userRole === 'player')

const isOrganizer = computed(() => {
    if (!authStore.isLoggedIn || !props.tournament) return false
    const org =
        props.tournament.organizer?._id ||
        props.tournament.organizer ||
        props.tournament.organizerInfo?._id
    const me = String(authStore.userId || '')
    const orgStr = typeof org === 'string' ? org : org?.$oid || org?.toString?.() || ''
    return me && orgStr && me === orgStr
})

const fmt = (v) => {
    try {
        return new Date(v).toLocaleString(navigator.language || undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        })
    } catch {
        return ''
    }
}

async function fetchCaptainApproved() {
    if (!authStore.isLoggedIn || !isPlayer.value) {
        isCaptainApproved.value = false
        return
    }
    try {
        const { data } = await apiClient.get('/api/registrations', {
            params: { tournamentId: props.tournamentId },
        })
        const list = Array.isArray(data) ? data : []
        isCaptainApproved.value = list.some(
            (r) => r.status === 'approved' && idEq(r.captain?._id ?? r.captain, authStore.userId)
        )
    } catch {
        isCaptainApproved.value = false
    }
}

async function fetchSubscription() {
    if (!authStore.isLoggedIn) {
        subscribed.value = false
        return
    }
    try {
        const { data } = await apiClient.get(`/api/tournaments/${props.tournamentId}/subscription`)
        subscribed.value = !!data?.subscribed
    } catch {
        subscribed.value = false
    }
}

async function fetchAnnouncements() {
    loading.value = true
    error.value = ''
    try {
        const { data } = await apiClient.get(`/api/tournaments/${props.tournamentId}/announcements`)
        announcements.value = Array.isArray(data) ? data : []
    } catch (e) {
        if (e?.response?.status !== 403) {
            error.value = e?.response?.data?.message || 'Failed to load announcements.'
        }
        announcements.value = []
    } finally {
        loading.value = false
    }
}

async function createAnnouncement() {
    if (!form.value.text || busy.value) return
    busy.value = true
    composeMsg.value = { type: '', text: '' }
    try {
        const { data } = await apiClient.post(
            `/api/tournaments/${props.tournamentId}/announcements`,
            form.value
        )
        if (data?.announcement) announcements.value.unshift(data.announcement)
        form.value = { title: '', text: '' }
        composeMsg.value = { type: 'success', text: 'Announcement sent.' }
    } catch (e) {
        composeMsg.value = { type: 'error', text: e?.response?.data?.message || 'Failed to send.' }
    } finally {
        busy.value = false
    }
}

async function subscribe() {
    busy.value = true
    try {
        await apiClient.post(`/api/tournaments/${props.tournamentId}/subscribe`)
        subscribed.value = true
        await fetchAnnouncements()
    } catch (e) {
        error.value = e?.response?.data?.message || 'Failed to subscribe.'
    } finally {
        busy.value = false
    }
}
async function unsubscribe() {
    busy.value = true
    try {
        await apiClient.delete(`/api/tournaments/${props.tournamentId}/subscribe`)
        subscribed.value = false
        announcements.value = []
    } catch (e) {
        error.value = e?.response?.data?.message || 'Failed to unsubscribe.'
    } finally {
        busy.value = false
    }
}

onMounted(async () => {
    await fetchCaptainApproved()
    await fetchSubscription()
    if (isOrganizer.value || isCaptainApproved.value || subscribed.value) {
        await fetchAnnouncements()
    } else {
        loading.value = false
    }
})
</script>

<style scoped>
.ann-section {
    margin-top: 1.25rem;
}
.ann-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
}
.ann-header h2 {
    margin: 0;
    display: flex;
    gap: 0.6rem;
    align-items: center;
}
.right {
    display: flex;
    gap: 0.5rem;
}
.btn {
    border: none;
    border-radius: 8px;
    padding: 0.5rem 0.8rem;
    font-weight: 600;
    cursor: pointer;
}
.btn.sub {
    background: #0d6efd;
    color: #fff;
}
.btn.unsub {
    background: #e5e7eb;
    color: #1f2937;
}
.card {
    background: #fff;
    border: 1px solid #eaecef;
    border-radius: 12px;
    padding: 0.9rem;
}
.compose {
    margin: 0.6rem 0 1rem;
}
.c-title {
    margin: 0 0 0.6rem 0;
    font-size: 1rem;
}
.compose input,
.compose textarea {
    width: 100%;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 0.6rem;
    margin-bottom: 0.5rem;
}
.actions {
    display: flex;
    justify-content: flex-end;
}
.btn.send {
    background: #198754;
    color: #fff;
}
.loading {
    display: grid;
    place-items: center;
    padding: 1rem;
}
.spinner,
.spinner-sm {
    border-radius: 50%;
    animation: spin 1s linear infinite;
}
.spinner {
    width: 26px;
    height: 26px;
    border: 3px solid #e9ecef;
    border-top-color: #0d6efd;
}
.spinner-sm {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.5);
    border-top-color: #fff;
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
    padding: 0.6rem 0.7rem;
    border-radius: 8px;
    margin: 0.5rem 0;
}
.msg {
    margin: 0.5rem 0 0;
    font-size: 0.9rem;
}
.msg.success {
    color: #155724;
    background: #d4edda;
    border: 1px solid #c3e6cb;
    padding: 0.4rem 0.6rem;
    border-radius: 8px;
}
.msg.error {
    color: #721c24;
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    padding: 0.4rem 0.6rem;
    border-radius: 8px;
}

.list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
}
.item .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
}
.item .title {
    font-size: 1rem;
}
.item .date {
    color: #6b7280;
    font-size: 0.85rem;
    white-space: nowrap;
}
.item .text {
    margin: 0.4rem 0 0;
    white-space: pre-wrap;
}
.empty {
    color: #6b7280;
    padding: 0.6rem;
}
.hint {
    color: #6b7280;
    margin: 0.4rem 0 1rem;
}
</style>
