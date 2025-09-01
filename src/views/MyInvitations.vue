<template>
    <div class="invitations-page">
        <div class="header-container">
            <h1><i class="fas fa-envelope-open-text"></i> My Team Invitations</h1>
        </div>

        <div class="page-content">
            <div v-if="isLoading" class="loading-state">
                <div class="spinner"></div>
                <p>Loading your invitations...</p>
            </div>

            <div v-else-if="error" class="error-state">
                <h2><i class="fas fa-exclamation-triangle"></i> Oops!</h2>
                <p>{{ error }}</p>
                <button @click="fetchInvitations" class="btn-retry">Try Again</button>
            </div>

            <div v-else>
                <div v-if="feedback.text" :class="`feedback-message ${feedback.type}`">
                    {{ feedback.text }}
                </div>

                <div v-if="invitations.length > 0" class="invitations-list">
                    <div
                        v-for="invitation in invitations"
                        :key="normalizeId(invitation._id)"
                        class="invitation-card"
                    >
                        <div class="card-header">
                            <i class="fas fa-shield-alt team-icon"></i>
                            <div class="team-name-container">
                                <p>Invitation to join the team:</p>
                                <span class="team-name">{{ invitation.data?.team?.name }}</span>
                            </div>
                        </div>

                        <div class="card-body">
                            <div v-if="invitation.data?.captain" class="captain-info">
                                <strong>Invited by (Captain):</strong>
                                <span>{{
                                    invitation.data.captain.full_name ||
                                    invitation.data.captain.username
                                }}</span>
                                <span class="username-muted"
                                    >(@{{ invitation.data.captain.username }})</span
                                >
                            </div>

                            <div v-if="invitation.data?.team?.players?.length" class="players-info">
                                <strong>
                                    Current Roster ({{ invitation.data.team.players.length }}
                                    players):
                                </strong>
                                <div class="players-tags">
                                    <span
                                        v-for="player in invitation.data.team.players"
                                        :key="normalizeId(player._id)"
                                        class="player-tag"
                                    >
                                        {{ player.full_name || player.username }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="invitation-actions">
                            <button
                                @click="respondToInvitation(invitation, 'accepted')"
                                :disabled="respondingId === normalizeId(invitation._id)"
                                class="btn-accept"
                            >
                                <template v-if="respondingId === normalizeId(invitation._id)">
                                    <span class="spinner-xs"></span> Processing…
                                </template>
                                <template v-else> <i class="fas fa-check"></i> Accept </template>
                            </button>

                            <button
                                @click="respondToInvitation(invitation, 'rejected')"
                                :disabled="respondingId === normalizeId(invitation._id)"
                                class="btn-reject"
                            >
                                <template v-if="respondingId === normalizeId(invitation._id)">
                                    <span class="spinner-xs"></span> Processing…
                                </template>
                                <template v-else> <i class="fas fa-times"></i> Reject </template>
                            </button>
                        </div>
                    </div>
                </div>

                <div v-else class="empty-state">
                    <div class="empty-state-icon"><i class="fas fa-inbox"></i></div>
                    <h2>No Pending Invitations</h2>
                    <p>Your invitations from other teams will appear here.</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const invitations = ref([])
const isLoading = ref(true)
const error = ref('')
const respondingId = ref(null)
const feedback = ref({ type: '', text: '' })

const normalizeId = (id) => {
    if (!id) return null
    if (typeof id === 'string') return id
    if (typeof id === 'object' && typeof id.$oid === 'string') return id.$oid
    return String(id)
}

const fetchInvitations = async () => {
    isLoading.value = true
    error.value = ''
    try {
        const { data } = await apiClient.get('/api/notifications')
        invitations.value = (data || [])
            .filter((n) => n?.type === 'team_invitation' && n?.data?.team)
            .filter((n) => {
                const uid = normalizeId(authStore.userId)
                const to = normalizeId(n.userId)
                const to2 = normalizeId(n.to)
                return (to && uid && to === uid) || (to2 && uid && to2 === uid)
            })
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    } catch (err) {
        console.error('Error fetching notifications:', err)
        error.value = err?.response?.data?.message || 'Failed to fetch invitations.'
    } finally {
        isLoading.value = false
    }
}

const respondToInvitation = async (invitation, response) => {
    const id = normalizeId(invitation._id)
    respondingId.value = id
    feedback.value = { type: '', text: '' }

    const prev = invitations.value.slice()
    invitations.value = prev.filter((inv) => normalizeId(inv._id) !== id)

    try {
        const result = await apiClient.post(`/api/invitations/${id}/respond`, { response })
        feedback.value = { type: 'success', text: result?.data?.message || 'Response sent.' }
        authStore.fetchAllNotifications?.()
        if (response === 'accepted') {
            setTimeout(() => router.push('/teams'), 1200)
        }
    } catch (err) {
        feedback.value = {
            type: 'error',
            text: err?.response?.data?.message || 'Failed to respond to invitation.',
        }
        invitations.value = prev
    } finally {
        respondingId.value = null
    }
}

onMounted(fetchInvitations)
</script>

<style scoped>
.invitations-page {
    padding: 0;
    background-color: #f9fafb;
    min-height: calc(100vh - 60px);
}
.page-content {
    padding: 2rem;
    max-width: 800px;
    margin: 0 auto;
}
.header-container {
    width: 100%;
    background-color: white;
    border-bottom: 1px solid #e5e7eb;
    padding: 1.5rem 2rem;
    box-sizing: border-box;
    text-align: center;
}
h1 {
    color: #111827;
    font-weight: 700;
    font-size: 2.25rem;
    margin: 0;
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
}
h1 i {
    color: #00aeef;
}

.invitations-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}
.invitation-card {
    background-color: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.07);
    transition: all 0.2s ease-in-out;
    overflow: hidden;
}
.invitation-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.card-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    background-color: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
}
.team-icon {
    font-size: 2.5rem;
    color: #00aeef;
}
.team-name-container p {
    margin: 0;
    color: #6b7280;
    font-size: 0.9rem;
}
.team-name {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
}

.card-body {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}
.captain-info,
.players-info {
    font-size: 0.95rem;
}
.captain-info strong,
.players-info strong {
    color: #343a40;
    margin-right: 0.5rem;
    display: block;
    margin-bottom: 0.5rem;
}
.username-muted {
    color: #6c757d;
    font-size: 0.9em;
}

.players-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}
.player-tag {
    background-color: #e9ecef;
    color: #495057;
    padding: 0.25rem 0.6rem;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 500;
}

.invitation-actions {
    display: flex;
    gap: 0.75rem;
    padding: 1.25rem;
    background-color: #f8f9fa;
    border-top: 1px solid #e9ecef;
}
.btn-accept,
.btn-reject {
    flex-grow: 1;
    padding: 0.75rem 1.2rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}
.btn-accept:disabled,
.btn-reject:disabled {
    cursor: not-allowed;
    opacity: 0.7;
}
.btn-accept {
    background-color: #28a745;
    color: white;
}
.btn-accept:hover:not(:disabled) {
    background-color: #218838;
}
.btn-reject {
    background-color: #dc3545;
    color: white;
}
.btn-reject:hover:not(:disabled) {
    background-color: #c82333;
}

.feedback-message {
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    text-align: center;
    font-weight: 500;
}
.feedback-message.success {
    background-color: #d4edda;
    color: #155724;
}
.feedback-message.error {
    background-color: #f8d7da;
    color: #721c24;
}

.empty-state,
.loading-state,
.error-state {
    text-align: center;
    padding: 4rem 1rem;
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
}
.empty-state h2 {
    color: #1f2937;
    margin-top: 1.5rem;
}
.empty-state p {
    color: #6b7280;
    max-width: 450px;
    margin: 0.5rem auto 1.5rem;
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
.spinner-xs {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.5);
    border-top: 2px solid #fff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}
</style>
