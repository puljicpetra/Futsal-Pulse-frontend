<template>
  <section class="teams-section card">
    <h2><i class="fas fa-users"></i> Registered Teams ({{ registrations.length }})</h2>
    <div v-if="isLoading" class="loading-state-small">Loading teams...</div>
    <ul v-else-if="registrations.length > 0" class="teams-list">
      <li v-for="reg in registrations" :key="reg._id" class="team-item">
        <div class="team-item-main">
            <i class="fas fa-shield-alt"></i>
            <div class="team-info">
              <span class="team-name">{{ reg.team.name }}</span>
              <span class="captain-info">Captain: {{ reg.captain.fullName || reg.captain.username }}</span>
            </div>
        </div>
        <div class="team-item-actions">
            <span class="status-badge" :class="`status-${reg.status}`">{{ formatStatus(reg.status) }}</span>
            
            <div v-if="isCaptainOf(reg.team._id)" class="captain-team-actions">
                <button v-if="reg.status === 'approved'" @click="requestTeamWithdrawal(reg._id)" class="btn-sm btn-withdraw" title="Request Withdrawal">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            </div>

            <div v-if="isOwner" class="organizer-team-actions">
                <div v-if="reg.status === 'pending'">
                  <button @click="updateRegistrationStatus(reg._id, 'approved')" class="btn-sm btn-approve" title="Approve Team">
                      <i class="fas fa-check"></i>
                  </button>
                  <button @click="updateRegistrationStatus(reg._id, 'rejected')" class="btn-sm btn-reject" title="Reject Team">
                      <i class="fas fa-times"></i>
                  </button>
                </div>
                <div v-if="reg.status === 'pending_withdrawal'">
                  <button @click="updateRegistrationStatus(reg._id, 'withdrawal_approved')" class="btn-sm btn-approve" title="Approve Withdrawal">
                      <i class="fas fa-check"></i> Approve
                  </button>
                </div>
            </div>
        </div>
      </li>
    </ul>
    <p v-else class="text-muted">No teams have registered for this tournament yet.</p>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '@/services/api';
import { useAuthStore } from '@/stores/auth';

const props = defineProps({
  tournamentId: {
    type: String,
    required: true
  },
  isOwner: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['feedback', 'registrations-loaded']);

const authStore = useAuthStore();
const registrations = ref([]);
const myTeams = ref([]);
const isLoading = ref(true);

const isCaptainOf = (teamId) => {
  if (authStore.userRole !== 'player') return false;
  return myTeams.value && myTeams.value.some(team => team._id === teamId && team.captain === authStore.userId);
};

const fetchRegistrations = async () => {
  isLoading.value = true;
  try {
    const response = await apiClient.get(`/api/registrations?tournamentId=${props.tournamentId}`);
    registrations.value = response.data;
    emit('registrations-loaded', response.data);
  } catch(err) {
    console.error("Failed to fetch registrations:", err);
    emit('feedback', { type: 'error', text: 'Could not load registered teams.' });
  } finally {
    isLoading.value = false;
  }
};

const fetchMyTeams = async () => {
  if (authStore.userRole !== 'player') return;
  try {
    const response = await apiClient.get('/api/teams');
    myTeams.value = response.data;
  } catch (err) {
    console.error("Failed to fetch user's teams:", err);
  }
};

const updateRegistrationStatus = async (registrationId, newStatus) => {
  try {
    await apiClient.patch(`/api/registrations/${registrationId}`, { status: newStatus });
    fetchRegistrations();
    emit('feedback', { type: 'success', text: `Registration status updated to ${newStatus}.` });
  } catch (err) {
    console.error("Failed to update registration status:", err);
    emit('feedback', { type: 'error', text: err.response?.data?.message || 'Could not update status.' });
  }
};

const requestTeamWithdrawal = async (registrationId) => {
  if (window.confirm('Are you sure you want to request withdrawal? The organizer will have to approve it.')) {
    emit('feedback', {type: '', text: ''});
    try {
      const res = await apiClient.post(`/api/registrations/${registrationId}/request-withdrawal`);
      emit('feedback', { type: 'success', text: res.data.message });
      fetchRegistrations();
    } catch(err) {
      console.error("Failed to request withdrawal:", err);
      emit('feedback', { type: 'error', text: err.response?.data?.message || 'Could not request withdrawal.' });
    }
  }
};

const formatStatus = (status) => {
  if (status === 'pending_withdrawal') return 'Pending Withdrawal';
  return status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1);
};

onMounted(() => {
  fetchRegistrations();
  if (authStore.userRole === 'player') {
    fetchMyTeams();
  }
});
</script>

<style scoped>
.card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.card h2 {
  font-size: 1.5rem;
  color: #333;
  margin-top: 0;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.75rem;
  display: flex;
  align-items: center;
}

.card h2 i {
  margin-right: 0.75rem;
  color: #00AEEF;
}

.text-muted {
  color: #888;
  font-style: italic;
}

.loading-state-small {
  text-align: center;
  color: #888;
  padding: 1rem;
}

.teams-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.team-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid #f0f0f0;
}

.team-item:last-child {
  border-bottom: none;
}

.team-item-main {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.team-item .fa-shield-alt {
  color: #00AEEF;
  font-size: 1.2rem;
}

.team-info {
  display: flex;
  flex-direction: column;
}

.team-name {
  font-weight: 600;
  color: #333;
}

.captain-info {
  font-size: 0.85rem;
  color: #888;
}

.team-item-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.captain-team-actions, .organizer-team-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-sm {
  display: flex;
  align-items: center;
  justify-content: center;
  width: auto;
  height: 32px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
  padding: 0 0.75rem;
  font-size: 0.85rem;
}

.btn-approve {
  background-color: #d4edda;
  color: #155724;
}

.btn-approve:hover {
  background-color: #c3e6cb;
}

.btn-reject {
  background-color: #f8d7da;
  color: #721c24;
}

.btn-reject:hover {
  background-color: #f5c6cb;
}

.btn-withdraw {
  background-color: #f8d7da;
  color: #721c24;
}

.btn-withdraw:hover {
  background-color: #f5c6cb;
}

.status-badge {
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
  text-transform: capitalize;
  white-space: nowrap;
}

.status-pending {
  background-color: #fef3c7;
  color: #92400e;
}

.status-approved {
  background-color: #d1fae5;
  color: #065f46;
}

.status-rejected {
  background-color: #fee2e2;
  color: #991b1b;
}

.status-pending_withdrawal {
  background-color: #ffedd5;
  color: #9a3412;
}
</style>