<template>
  <div class="team-detail-page">
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading team details...</p>
    </div>
    
    <div v-else-if="error" class="error-state">
      <h2><i class="fas fa-exclamation-triangle"></i> Oops! Something went wrong.</h2>
      <p>{{ error }}</p>
      <router-link to="/teams" class="btn-back">Back to My Teams</router-link>
    </div>

    <div v-else-if="team" class="team-content">
      
      <div class="navigation-container">
        <router-link to="/teams" class="back-link">
          <i class="fas fa-arrow-left"></i>
          <span>Back to My Teams</span>
        </router-link>
      </div>

      <header class="team-header">
        <h1><i class="fas fa-shield-alt"></i> {{ team.name }}</h1>
        <div v-if="isCaptain" class="captain-badge">
          <i class="fas fa-crown"></i> You are the Captain
        </div>
      </header>

      <main class="team-body">
        <section class="players-section card">
          <h2><i class="fas fa-users"></i> Player Roster ({{ team.players.length }})</h2>
          <ul class="players-list">
            <li v-for="player in team.players" :key="player" class="player-item">
              <i class="fas fa-user-circle"></i> {{ player }}
            </li>
          </ul>
        </section>

        <section v-if="isCaptain" class="invite-section card">
           <h2><i class="fas fa-user-plus"></i> Invite a Player</h2>
           
            <div class="invite-form">
              <div class="search-form-container">
                <input 
                  type="text" 
                  v-model="searchQuery"
                  @keyup.enter="searchPlayers"
                  placeholder="Search by username..." 
                  class="search-input"
                />
                <button @click="searchPlayers" :disabled="isSearching || searchQuery.length < 2" class="btn-search">
                  <i v-if="!isSearching" class="fas fa-search"></i>
                  <div v-else class="spinner-sm-dark"></div>
                </button>
              </div>
               <small class="form-text text-muted">Enter at least 2 characters to search.</small>
            </div>

            <div v-if="inviteMessage.text" :class="`invite-feedback ${inviteMessage.type}`">
              {{ inviteMessage.text }}
            </div>

            <div class="search-results">
              <p v-if="searchError" class="error-text">{{ searchError }}</p>
              <ul v-if="searchResults.length > 0" class="search-results-list">
                <li v-for="player in searchResults" :key="player._id" class="search-result-item">
                  <div class="player-info">
                    <img v-if="player.profile_image_url" :src="`http://localhost:3001${player.profile_image_url}`" class="avatar-sm" alt="avatar" />
                    <i v-else class="fas fa-user-circle avatar-placeholder"></i>
                    <span>{{ player.username }}</span>
                  </div>
                  <button @click="invitePlayer(player._id, player.username)" :disabled="invitingPlayerId === player._id" class="btn-invite">
                     <div v-if="invitingPlayerId === player._id" class="spinner-sm-light"></div>
                     <span v-else>Invite</span>
                  </button>
                </li>
              </ul>
              <p v-if="!isSearching && searchResults.length === 0 && hasSearched" class="text-muted">No players found matching your search.</p>
            </div>
        </section>
      </main>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import apiClient from '@/services/api';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const authStore = useAuthStore();

const team = ref(null);
const isLoading = ref(true);
const error = ref('');
const teamId = route.params.id;

const searchQuery = ref('');
const searchResults = ref([]);
const isSearching = ref(false);
const hasSearched = ref(false);
const searchError = ref('');
const invitingPlayerId = ref(null);
const inviteMessage = ref({ type: '', text: '' });

const isCaptain = computed(() => {
  if (!authStore.isLoggedIn || !team.value) return false;
  return authStore.userId === team.value.captain;
});

const fetchTeamDetails = async () => {
  isLoading.value = true;
  error.value = '';
  try {
    const response = await apiClient.get(`/api/teams/${teamId}`);
    team.value = response.data;
  } catch (err) {
    console.error('Error fetching team details:', err);
    error.value = err.response?.data?.message || 'Failed to fetch team details.';
  } finally {
    isLoading.value = false;
  }
};

const searchPlayers = async () => {
  if (searchQuery.value.length < 2) {
    searchError.value = 'Please enter at least 2 characters.';
    return;
  }
  isSearching.value = true;
  hasSearched.value = true;
  searchError.value = '';
  inviteMessage.value = { type: '', text: '' };
  searchResults.value = [];

  try {
    const response = await apiClient.get('/api/users/search', {
      params: { query: searchQuery.value }
    });
    searchResults.value = response.data.filter(
      player => !team.value.players.includes(player.username)
    );
  } catch (err) {
    searchError.value = err.response?.data?.message || 'Error searching for players.';
  } finally {
    isSearching.value = false;
  }
};

const invitePlayer = async (playerId, playerUsername) => {
  invitingPlayerId.value = playerId;
  inviteMessage.value = { type: '', text: '' };
  try {
    const response = await apiClient.post(`/api/teams/${teamId}/invites`, {
      playerIdToInvite: playerId
    });
    inviteMessage.value = { type: 'success', text: `Successfully invited ${playerUsername}!` };
    searchResults.value = [];
    searchQuery.value = '';
    hasSearched.value = false;
  } catch (err) {
     inviteMessage.value = { type: 'error', text: err.response?.data?.message || 'Failed to send invitation.' };
  } finally {
    invitingPlayerId.value = null;
  }
};

onMounted(() => {
  fetchTeamDetails();
});
</script>

<style scoped>
.team-detail-page {
  padding: 2rem;
  background-color: #f9fafb;
  min-height: calc(100vh - 60px);
}

.team-content {
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
  transition: color 0.2s;
}
.back-link:hover {
  color: #00AEEF;
}

.team-header {
  text-align: center;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.team-header h1 {
  font-size: 2.5rem;
  color: #333;
  margin: 0;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 1rem;
}

.team-header h1 .fa-shield-alt {
  color: #00AEEF;
}

.captain-badge {
  margin-top: 0.75rem;
  color: #b45309;
  background-color: #fef3c7;
  padding: 0.3rem 0.7rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}
.captain-badge .fa-crown {
  margin-right: 0.4rem;
}

.team-body {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

.card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
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
  gap: 0.75rem;
}
.card h2 .fa-users, .card h2 .fa-user-plus {
  color: #00AEEF;
}

.players-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.player-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: #f8f9fa;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  color: #343a40;
}

.player-item .fa-user-circle {
  color: #6c757d;
  font-size: 1.2rem;
}

.loading-state, .error-state {
  text-align: center;
  padding: 5rem 1rem;
}

.error-state h2 {
  color: #d9534f;
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

.text-muted {
  color: #888;
  font-style: italic;
}


.invite-form {
  margin-bottom: 1.5rem;
}

.search-form-container {
  display: flex;
  gap: 0.5rem;
}

.search-input {
  flex-grow: 1;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
}

.btn-search {
  padding: 0.75rem 1rem;
  border: none;
  background-color: #374151;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
}

.btn-search:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.search-results-list {
  list-style: none;
  padding: 0;
  margin-top: 1rem;
}

.search-result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid #f0f0f0;
}

.search-result-item:last-child {
  border-bottom: none;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
}

.avatar-sm {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}
.avatar-placeholder {
  font-size: 32px;
  color: #adb5bd;
}

.btn-invite {
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-weight: 600;
  cursor: pointer;
  min-width: 80px;
  text-align: center;
}
.btn-invite:disabled {
  background-color: #9ca3af;
}

.invite-feedback {
  padding: 0.75rem;
  border-radius: 6px;
  margin-top: 1rem;
  font-weight: 500;
  text-align: center;
}

.invite-feedback.success {
  background-color: #d4edda;
  color: #155724;
}
.invite-feedback.error {
  background-color: #f8d7da;
  color: #721c24;
}

.error-text {
  color: #dc3545;
  font-size: 0.9rem;
}

.spinner-sm-dark, .spinner-sm-light {
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
}

.spinner-sm-dark {
  border: 2px solid #6b7280;
  border-top-color: #f9fafb;
}
.spinner-sm-light {
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-top-color: #fff;
}

</style>