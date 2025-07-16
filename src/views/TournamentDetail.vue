<template>
  <div class="tournament-detail-page">
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading tournament details...</p>
    </div>
    
    <div v-else-if="error" class="error-state">
      <h2>Oops! Something went wrong.</h2>
      <p>{{ error }}</p>
      <router-link to="/tournaments" class="btn-back">Back to Tournaments</router-link>
    </div>

    <div v-else-if="tournament" class="tournament-content">
      
      <div class="navigation-container">
        <router-link to="/tournaments" class="back-link">
          <i class="fas fa-chevron-left"></i>
          <span>Back to All Tournaments</span>
        </router-link>
      </div>

      <header class="tournament-header">
        <h1>{{ tournament.name }}</h1>
        <div class="header-meta">
          <span><i class="fas fa-map-marker-alt"></i> {{ tournament.location.city }}, {{ tournament.location.venue }}</span>
          <span><i class="fas fa-calendar-alt"></i> Starts: {{ formatDate(tournament.startDate) }}</span>
          <span v-if="tournament.endDate"><i class="fas fa-flag-checkered"></i> Ends: {{ formatDate(tournament.endDate) }}</span>
        </div>

        <div class="actions-container">
            <div class="organizer-actions" v-if="isOwner">
                <button @click="goToEdit" class="btn btn-edit">
                    <i class="fas fa-edit"></i> Edit Tournament
                </button>
                <button @click="confirmDelete" class="btn btn-delete">
                    <i class="fas fa-trash-alt"></i> Delete Tournament
                </button>
            </div>
            <div class="player-actions" v-if="authStore.userRole === 'player' && !isAlreadyRegistered">
                <button @click="openRegisterModal" class="btn btn-register-team">
                    <i class="fas fa-user-plus"></i> Register a Team
                </button>
            </div>
        </div>

      </header>

      <main class="tournament-body">
        <div class="main-content">
          <section class="rules-section card">
            <h2><i class="fas fa-gavel"></i> Tournament Rules</h2>
            <p v-if="tournament.rules" class="rules-text">{{ tournament.rules }}</p>
            <p v-else class="text-muted">No specific rules have been provided by the organizer.</p>
          </section>

          <section class="teams-section card">
            <h2><i class="fas fa-users"></i> Registered Teams ({{ registrations.length }})</h2>
            <div v-if="isLoadingTeams" class="loading-state-small">Loading teams...</div>
            <ul v-else-if="registrations.length > 0" class="teams-list">
              <li v-for="reg in registrations" :key="reg._id" class="team-item">
                <i class="fas fa-shield-alt"></i>
                <div class="team-info">
                  <span class="team-name">{{ reg.team.name }}</span>
                  <span class="captain-info">Captain: {{ reg.captain.fullName || reg.captain.username }}</span>
                </div>
                <span class="status-badge" :class="`status-${reg.status}`">{{ reg.status }}</span>
              </li>
            </ul>
            <p v-else class="text-muted">No teams have registered for this tournament yet.</p>
          </section>
        </div>
        
        <aside class="sidebar-content">
           <section class="schedule-section card">
            <h2><i class="fas fa-clipboard-list"></i> Match Schedule</h2>
            <p class="text-muted">Match schedule will be available here.</p>
           </section>
        </aside>
      </main>
    </div>

    <div v-if="showRegisterModal" class="modal-overlay" @click.self="closeRegisterModal">
        <div class="modal-content">
            <h3>Register Your Team</h3>
            <p>Select one of your teams to register for "{{ tournament.name }}".</p>
            <form @submit.prevent="submitRegistration">
                <div class="form-group">
                    <label for="teamSelect">Your Teams</label>
                    <select id="teamSelect" v-model="selectedTeamId" required>
                      <option disabled value="">Select a team...</option>
                      <option v-for="team in myTeams" :key="team._id" :value="team._id">
                        {{ team.name }}
                      </option>
                    </select>
                    <p v-if="myTeams.length === 0" class="text-muted small-text">
                      You don't have any teams. <router-link to="/teams/create">Create one first!</router-link>
                    </p>
                </div>
                <div class="modal-actions">
                    <button type="button" @click="closeRegisterModal" class="btn btn-cancel">Cancel</button>
                    <button type="submit" :disabled="isRegisteringTeam || !selectedTeamId" class="btn-submit">
                        {{ isRegisteringTeam ? 'Registering...' : 'Submit Registration' }}
                    </button>
                </div>
                <p v-if="modalError" class="error-message">{{ modalError }}</p>
            </form>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import apiClient from '@/services/api';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const tournament = ref(null);
const registrations = ref([]);
const myTeams = ref([]);
const isLoading = ref(true);
const isLoadingTeams = ref(false);
const error = ref('');

const showRegisterModal = ref(false);
const selectedTeamId = ref('');
const isRegisteringTeam = ref(false);
const modalError = ref('');

const isOwner = computed(() => {
  if (!authStore.isLoggedIn || !tournament.value) return false;
  return authStore.userId === tournament.value.organizer;
});

const isAlreadyRegistered = computed(() => {
  if (!authStore.isLoggedIn || registrations.value.length === 0 || myTeams.value.length === 0) return false;
  const myTeamIds = myTeams.value.map(t => t._id);
  return registrations.value.some(reg => myTeamIds.includes(reg.team._id));
});

const fetchTournamentDetails = async () => {
  const tournamentId = route.params.id;
  isLoading.value = true;
  error.value = '';
  try {
    const response = await apiClient.get(`/api/tournaments/${tournamentId}`);
    tournament.value = response.data;
  } catch (err) {
    console.error('Error fetching tournament details:', err.response);
    error.value = err.response?.data?.message || 'Failed to fetch tournament details.';
  } finally {
    isLoading.value = false;
  }
};

const fetchRegistrations = async () => {
  isLoadingTeams.value = true;
  try {
    const response = await apiClient.get(`/api/registrations?tournamentId=${route.params.id}`);
    registrations.value = response.data;
  } catch(err) {
    console.error("Failed to fetch registrations:", err);
  } finally {
    isLoadingTeams.value = false;
  }
};

const fetchMyTeams = async () => {
  if (authStore.userRole !== 'player') return;
  try {
    const response = await apiClient.get('/api/teams');
    myTeams.value = response.data.filter(team => team.captain === authStore.userId);
  } catch (err) {
    console.error("Failed to fetch user's teams:", err);
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

const goToEdit = () => {
  router.push(`/tournaments/${tournament.value._id}/edit`);
};

const confirmDelete = async () => {
  if (window.confirm('Are you sure you want to permanently delete this tournament? This action cannot be undone.')) {
    try {
      await apiClient.delete(`/api/tournaments/${tournament.value._id}`);
      alert('Tournament deleted successfully.');
      router.push('/tournaments');
    } catch (err) {
      console.error('Failed to delete tournament:', err);
      error.value = err.response?.data?.message || 'Failed to delete tournament.';
    }
  }
};

const openRegisterModal = async () => {
  await fetchMyTeams();
  showRegisterModal.value = true;
  modalError.value = '';
  selectedTeamId.value = '';
};

const closeRegisterModal = () => {
  showRegisterModal.value = false;
};

const submitRegistration = async () => {
  isRegisteringTeam.value = true;
  modalError.value = '';
  try {
    await apiClient.post('/api/registrations', {
      teamId: selectedTeamId.value,
      tournamentId: tournament.value._id
    });
    closeRegisterModal();
    fetchRegistrations();
  } catch (err) {
    modalError.value = err.response?.data?.message || "Failed to register team.";
  } finally {
    isRegisteringTeam.value = false;
  }
};

onMounted(async () => {
  await fetchTournamentDetails();
  if (tournament.value) {
    fetchRegistrations();
    if(authStore.userRole === 'player'){
      fetchMyTeams();
    }
  }
});
</script>

<style scoped>
.tournament-detail-page {
  padding: 2rem;
  background-color: #f9f9f9;
  min-height: calc(100vh - 60px);
}

.tournament-content {
  max-width: 1200px;
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

.back-link i {
  transition: transform 0.2s ease-in-out;
}

.back-link:hover {
  background-color: #e0e0e0;
  color: #111;
}

.back-link:hover i {
  transform: translateX(-3px);
}

.tournament-header {
  position: relative;
  text-align: center;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 2rem;
}

.actions-container {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-edit {
  background-color: #ffc107;
  color: #212529;
}

.btn-edit:hover {
  background-color: #e0a800;
  transform: translateY(-2px);
}

.btn-delete {
  background-color: #dc3545;
  color: white;
}

.btn-delete:hover {
  background-color: #c82333;
  transform: translateY(-2px);
}

.btn-register-team {
  background-color: #00AEEF;
  color: white;
}

.btn-register-team:hover {
  background-color: #008fbf;
  transform: translateY(-2px);
}

.tournament-header h1 {
  font-size: 3rem;
  color: #333;
  margin: 0;
  font-weight: 700;
}

.header-meta {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1.5rem;
  color: #777;
  margin-top: 1rem;
}

.header-meta span {
  display: flex;
  align-items: center;
}

.header-meta i {
  margin-right: 0.5rem;
  color: #00AEEF;
}

.tournament-body {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

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
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.75rem;
  display: flex;
  align-items: center;
}

.card h2 i {
  margin-right: 0.75rem;
  color: #00AEEF;
}

.rules-text {
  line-height: 1.7;
  white-space: pre-wrap;
}

.text-muted {
  color: #888;
  font-style: italic;
}

.loading-state, .error-state {
  text-align: center;
  padding: 5rem 1rem;
}

.error-state h2 {
  color: #d9534f;
}

.btn-back {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.7rem 1.5rem;
  background-color: #00AEEF;
  color: white;
  text-decoration: none;
  border-radius: 5px;
  font-weight: bold;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #00AEEF;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.teams-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.team-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.team-item:last-child {
  border-bottom: none;
}

.team-item .fa-shield-alt {
  color: #00AEEF;
  margin-right: 1rem;
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

.status-badge {
  margin-left: auto;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
  text-transform: capitalize;
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
}

.modal-content h3 {
  margin-top: 0;
}

.modal-content p {
  color: #666;
  margin-bottom: 1.5rem;
}

.modal-content .form-group {
  margin-top: 1.5rem;
}

.modal-content label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  display: block;
}

.modal-content select {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-sizing: border-box;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
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
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  color: #333;
}

.btn-submit {
  background-color: #28a745;
  color: white;
}

.btn-submit:disabled {
  background-color: #a0a0a0;
  cursor: not-allowed;
}

.modal-content .error-message {
  color: #dc3545;
  margin-top: 1rem;
  text-align: center;
}

.small-text {
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.small-text a {
  color: #00AEEF;
  text-decoration: none;
}

.small-text a:hover {
  text-decoration: underline;
}

@media (max-width: 992px) {
  .tournament-body {
    grid-template-columns: 1fr;
  }
}
</style>