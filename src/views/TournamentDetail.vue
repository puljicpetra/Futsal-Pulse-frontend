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
          <span v-if="tournament.location.city"><i class="fas fa-map-marker-alt"></i> {{ tournament.location.city }}{{ tournament.location.venue ? `, ${tournament.location.venue}` : '' }}</span>
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
            <div class="player-actions" v-if="authStore.userRole === 'player' && !userRegistration">
                <button @click="openRegisterModal" class="btn btn-register-team">
                    <i class="fas fa-user-plus"></i> Register a Team
                </button>
            </div>
            <div class="player-actions" v-if="userRegistration?.status === 'approved'">
                <p class="feedback-message success small">You are registered for this tournament!</p>
            </div>
             <div class="player-actions" v-if="userRegistration?.status === 'pending'">
                <p class="feedback-message pending small">Your registration is pending approval.</p>
            </div>
        </div>
        <div v-if="feedback.text" :class="`feedback-message ${feedback.type}`">
          {{ feedback.text }}
        </div>
      </header>

      <main class="tournament-body">
        <div class="main-content">
          <section class="rules-section card">
            <h2><i class="fas fa-gavel"></i> Tournament Rules</h2>
            <p v-if="tournament.rules" class="rules-text">{{ tournament.rules }}</p>
            <p v-else class="text-muted">No specific rules have been provided by the organizer.</p>
          </section>

          <TeamList 
            ref="teamListComp"
            :tournamentId="tournament._id" 
            :isOwner="isOwner"
            @feedback="showFeedback"
            @registrations-loaded="handleRegistrationsLoaded"
          />

        </div>
        
        <aside class="sidebar-content">
           <MatchList 
            ref="matchListComp"
            :tournamentId="tournament._id"
            :isOwner="isOwner"
            @add-match="openAddMatchModal"
            @feedback="showFeedback"
           />
        </aside>
      </main>
    </div>

    <div v-if="showRegisterModal" class="modal-overlay" @click.self="closeRegisterModal">
        <div class="modal-content">
            <h3>Register Your Team</h3>
            <p>Select one of your teams to register for "{{ tournament.name }}".</p>
            <form @submit.prevent="submitRegistration">
                <div class="form-group">
                    <label for="teamSelect">Your Teams (Captain)</label>
                    <select id="teamSelect" v-model="selectedTeamId" required>
                      <option disabled value="">Select a team...</option>
                      <option v-for="team in myCaptainTeams" :key="team._id" :value="team._id">
                        {{ team.name }}
                      </option>
                    </select>
                    <p v-if="isLoadingMyTeams" class="text-muted small-text">Loading your teams...</p>
                    <p v-else-if="myCaptainTeams.length === 0" class="text-muted small-text">
                      You are not a captain of any team. <router-link to="/teams/create">Create one first!</router-link>
                    </p>
                </div>
                <div class="modal-actions">
                    <button type="button" @click="closeRegisterModal" class="btn-cancel">Cancel</button>
                    <button type="submit" :disabled="isRegisteringTeam || !selectedTeamId" class="btn-submit">
                        {{ isRegisteringTeam ? 'Registering...' : 'Submit Registration' }}
                    </button>
                </div>
                <p v-if="modalError" class="error-message">{{ modalError }}</p>
            </form>
        </div>
    </div>

    <div v-if="showAddMatchModal" class="modal-overlay" @click.self="closeAddMatchModal">
      <div class="modal-content">
        <h3>Add a New Match</h3>
        <form @submit.prevent="submitNewMatch">
          <div class="form-group">
            <label for="teamA">Team A</label>
            <select id="teamA" v-model="newMatch.teamA_id" required>
              <option disabled value="">Select Team A</option>
              <option v-for="reg in approvedRegistrations" :key="reg.team._id" :value="reg.team._id">
                {{ reg.team.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="teamB">Team B</label>
            <select id="teamB" v-model="newMatch.teamB_id" required>
              <option disabled value="">Select Team B</option>
              <option v-for="reg in approvedRegistrations" :key="reg.team._id" :value="reg.team._id">
                {{ reg.team.name }}
              </option>
            </select>
          </div>
           <div class="form-group">
            <label for="matchDate">Match Date and Time</label>
            <input type="datetime-local" id="matchDate" v-model="newMatch.matchDate" required />
          </div>
          <div class="form-group">
            <label for="matchGroup">Group / Stage (optional)</label>
            <input type="text" id="matchGroup" v-model="newMatch.group" placeholder="e.g., Group A, Quarter-final"/>
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeAddMatchModal" class="btn-cancel">Cancel</button>
            <button type="submit" :disabled="isSubmittingMatch" class="btn-submit">
              {{ isSubmittingMatch ? 'Adding...' : 'Add Match' }}
            </button>
          </div>
          <p v-if="matchModalError" class="error-message">{{ matchModalError }}</p>
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
import TeamList from '../components/TeamList.vue';
import MatchList from '../components/MatchList.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const tournament = ref(null);
const approvedRegistrations = ref([]);
const isLoading = ref(true);
const error = ref('');
const feedback = ref({ type: '', text: '' });

const myCaptainTeams = ref([]);
const isLoadingMyTeams = ref(false);
const userRegistration = ref(null);

const showRegisterModal = ref(false);
const selectedTeamId = ref('');
const isRegisteringTeam = ref(false);
const modalError = ref('');

const showAddMatchModal = ref(false);
const isSubmittingMatch = ref(false);
const matchModalError = ref('');
const newMatch = ref({
    tournamentId: route.params.id,
    teamA_id: '',
    teamB_id: '',
    matchDate: '',
    group: ''
});

const teamListComp = ref(null);
const matchListComp = ref(null);

const isOwner = computed(() => {
  if (!authStore.isLoggedIn || !tournament.value) return false;
  return authStore.userId === tournament.value.organizer;
});

const fetchTournamentDetails = async () => {
  isLoading.value = true;
  error.value = '';
  try {
    const response = await apiClient.get(`/api/tournaments/${route.params.id}`);
    tournament.value = response.data;
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to fetch tournament details.';
  } finally {
    isLoading.value = false;
  }
};

const fetchMyCaptainTeams = async () => {
  if (authStore.userRole !== 'player') return;
  isLoadingMyTeams.value = true;
  try {
    const response = await apiClient.get('/api/teams?role=captain');
    myCaptainTeams.value = response.data;
  } catch (err) {
    console.error("Failed to fetch user's captained teams:", err);
  } finally {
    isLoadingMyTeams.value = false;
  }
};

const checkUserRegistration = async () => {
    try {
        const response = await apiClient.get(`/api/registrations/me?tournamentId=${route.params.id}`);
        userRegistration.value = response.data;
    } catch(err) {
        if(err.response?.status !== 404) console.error(err);
        userRegistration.value = null;
    }
}

const showFeedback = (feedbackData) => {
    feedback.value = feedbackData;
    setTimeout(() => {
        feedback.value = { type: '', text: '' };
    }, 4000);
};

const handleRegistrationsLoaded = (loadedRegistrations) => {
    approvedRegistrations.value = loadedRegistrations.filter(r => r.status === 'approved');
};

const goToEdit = () => router.push(`/tournaments/${tournament.value._id}/edit`);

const confirmDelete = async () => {
  if (window.confirm('Are you sure you want to permanently delete this tournament?')) {
    try {
      await apiClient.delete(`/api/tournaments/${tournament.value._id}`);
      router.push('/tournaments');
    } catch (err) {
      showFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to delete tournament.' });
    }
  }
};

const openRegisterModal = () => {
  showRegisterModal.value = true;
  modalError.value = '';
  selectedTeamId.value = '';
  if (myCaptainTeams.value.length === 0) {
    fetchMyCaptainTeams();
  }
};

const closeRegisterModal = () => showRegisterModal.value = false;

const submitRegistration = async () => {
  isRegisteringTeam.value = true;
  modalError.value = '';
  try {
    await apiClient.post('/api/registrations', {
      teamId: selectedTeamId.value,
      tournamentId: tournament.value._id
    });
    closeRegisterModal();
    showFeedback({ type: 'success', text: 'Team successfully registered! Status is pending.' });
    checkUserRegistration();
    if (teamListComp.value) {
      teamListComp.value.fetchRegistrations();
    }
  } catch (err) {
    modalError.value = err.response?.data?.message || "Failed to register team.";
  } finally {
    isRegisteringTeam.value = false;
  }
};

const openAddMatchModal = () => {
    showAddMatchModal.value = true;
    matchModalError.value = '';
    newMatch.value = {
        tournamentId: route.params.id,
        teamA_id: '',
        teamB_id: '',
        matchDate: '',
        group: ''
    };
};

const closeAddMatchModal = () => showAddMatchModal.value = false;

const submitNewMatch = async () => {
    if (newMatch.value.teamA_id && newMatch.value.teamA_id === newMatch.value.teamB_id) {
        matchModalError.value = 'A team cannot play against itself.';
        return;
    }
    isSubmittingMatch.value = true;
    matchModalError.value = '';
    try {
        await apiClient.post('/api/matches', newMatch.value);
        closeAddMatchModal();
        if (matchListComp.value) {
          matchListComp.value.fetchMatches();
        }
    } catch(err) {
        matchModalError.value = err.response?.data?.message || 'Failed to create match.';
    } finally {
        isSubmittingMatch.value = false;
    }
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

onMounted(async () => {
  await fetchTournamentDetails();
  if (tournament.value && authStore.userRole === 'player') {
    checkUserRegistration();
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
  align-items: center;
}

.btn-edit, .btn-delete, .btn-register-team {
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
  align-items: start;
}

@media (max-width: 1024px) {
  .tournament-body {
    grid-template-columns: 1fr;
  }
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

.modal-content select, .modal-content input {
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

.feedback-message {
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 500;
  margin-top: 1.5rem;
  font-size: 0.95rem;
  text-align: center;
}

.feedback-message.success {
  background-color: #d4edda;
  color: #155724;
}

.feedback-message.error {
  background-color: #f8d7da;
  color: #721c24;
}

.feedback-message.pending {
    background-color: #fff3cd;
    color: #856404;
}

.feedback-message.small {
    padding: 0.5rem 1rem;
    margin-top: 0;
}
</style>