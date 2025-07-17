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
        <div v-if="removePlayerMessage.text" :class="`feedback-message-global ${removePlayerMessage.type}`">
          {{ removePlayerMessage.text }}
        </div>
      </header>

      <main class="team-body-grid">
        <div class="grid-left-column">
          <section class="players-section card">
            <h2><i class="fas fa-users"></i> Player Roster ({{ team.players.length }}/8)</h2>
            <ul class="players-list" :class="{ 'two-columns': team.players.length > 4 }">
              <li v-for="player in team.players" :key="player._id" class="player-item">
                <div class="player-info">
                   <img v-if="player.profile_image_url" :src="`http://localhost:3001${player.profile_image_url}`" class="avatar-sm" alt="avatar" />
                   <i v-else class="fas fa-user-circle avatar-placeholder"></i>
                   <div class="player-name-details">
                     <span class="player-full-name">{{ player.full_name || player.username }}</span>
                     <span v-if="player.full_name" class="player-username">@{{ player.username }}</span>
                   </div>
                </div>
                <div class="player-actions">
                    <i v-if="player._id === team.captain" class="fas fa-crown captain-icon" title="Team Captain"></i>
                    <button 
                      v-if="isCaptain && player._id !== team.captain" 
                      @click="removePlayer(player._id, player.username)"
                      class="btn-remove-player"
                      title="Remove player"
                    >
                      <i class="fas fa-user-times"></i>
                    </button>
                </div>
              </li>
            </ul>
          </section>
        </div>

        <div class="grid-right-column" v-if="isCaptain">
          <section v-if="team.players.length < 8" class="invite-section card">
            <h2><i class="fas fa-user-plus"></i> Invite a Player</h2>
            
              <div class="invite-form">
                <div class="search-form-container">
                  <input 
                    type="text" 
                    v-model="searchQuery"
                    @keyup.enter="searchPlayers"
                    placeholder="Search by username or name..." 
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
                      <div class="player-name-details">
                        <span class="player-full-name">{{ player.full_name || player.username }}</span>
                        <span v-if="player.full_name" class="player-username">@{{ player.username }}</span>
                      </div>
                    </div>
                    <button 
                      @click="invitePlayer(player._id, player.username)" 
                      :disabled="invitingPlayerId === player._id || player.inviteStatus === 'pending'"
                      class="btn-invite"
                      :class="{ 'pending': player.inviteStatus === 'pending' }"
                    >
                      <div v-if="invitingPlayerId === player._id" class="spinner-sm-light"></div>
                      <span v-else-if="player.inviteStatus === 'pending'">Pending</span>
                      <span v-else>Invite</span>
                    </button>
                  </li>
                </ul>
                <p v-if="!isSearching && searchResults.length === 0 && hasSearched" class="text-muted">No players found matching your search.</p>
              </div>
          </section>

          <section v-else class="invite-section card">
              <h2><i class="fas fa-user-plus"></i> Invite a Player</h2>
              <div class="team-full-message">
                  <i class="fas fa-exclamation-circle"></i>
                  <p><strong>Your team is full.</strong></p>
                  <p>The maximum number of players (8) has been reached. You cannot invite more players.</p>
              </div>
          </section>

          <div class="danger-zone-wrapper">
              <div class="danger-zone">
                  <h4>Danger Zone</h4>
                  <button @click="deleteTeam" class="btn btn-danger">
                      <i class="fas fa-trash-alt"></i> Disband Team
                  </button>
              </div>
          </div>

        </div>
      </main>

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

const removePlayerMessage = ref({ type: '', text: '' });

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
    const existingPlayerIds = team.value.players.map(p => p._id);
    searchResults.value = response.data
      .filter(player => !existingPlayerIds.includes(player._id))
      .map(player => ({ ...player, inviteStatus: 'idle' }));
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
    await apiClient.post(`/api/teams/${teamId}/invites`, {
      playerIdToInvite: playerId
    });
    inviteMessage.value = { type: 'success', text: `Successfully invited ${playerUsername}!` };
    
    const playerIndex = searchResults.value.findIndex(p => p._id === playerId);
    if (playerIndex > -1) {
      searchResults.value.splice(playerIndex, 1);
    }
    
  } catch (err) {
    const errorMessage = err.response?.data?.message || 'Failed to send invitation.';
    inviteMessage.value = { type: 'error', text: errorMessage };
    
    if (errorMessage.toLowerCase().includes('already been invited')) {
      const playerIndex = searchResults.value.findIndex(p => p._id === playerId);
      if (playerIndex > -1) {
        searchResults.value[playerIndex].inviteStatus = 'pending';
      }
    }
  } finally {
    invitingPlayerId.value = null;
  }
};

const removePlayer = async (playerId, playerUsername) => {
  if (window.confirm(`Are you sure you want to remove ${playerUsername} from the team?`)) {
    removePlayerMessage.value = { type: '', text: '' };
    try {
      await apiClient.delete(`/api/teams/${teamId}/players/${playerId}`);
      
      if (team.value) {
        team.value.players = team.value.players.filter(p => p._id !== playerId);
      }

      removePlayerMessage.value = { type: 'success', text: `${playerUsername} has been removed.` };

    } catch (err) {
      removePlayerMessage.value = { type: 'error', text: err.response?.data?.message || 'Failed to remove player.' };
    } finally {
        setTimeout(() => {
            removePlayerMessage.value = { type: '', text: '' };
        }, 3000);
    }
  }
};

const deleteTeam = async () => {
    const teamName = team.value.name;
    if (window.confirm(`Are you sure you want to permanently delete the team "${teamName}"? This action cannot be undone.`)) {
        try {
            await apiClient.delete(`/api/teams/${teamId}`);
            alert(`Team "${teamName}" has been deleted.`);
            router.push('/teams');
        } catch(err) {
             removePlayerMessage.value = { type: 'error', text: err.response?.data?.message || 'Failed to delete the team.' };
             setTimeout(() => {
                removePlayerMessage.value = { type: '', text: '' };
            }, 4000);
        }
    }
}


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
  max-width: 1100px; 
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

.team-body-grid {
  display: grid;
  grid-template-columns: 3fr 2fr; 
  gap: 2rem;
  align-items: start;
}

@media (max-width: 992px) {
  .team-body-grid {
    grid-template-columns: 1fr;
  }
}

.card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  height: 100%; 
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
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

.players-list.two-columns {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
}


.player-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #f8f9fa;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  color: #343a40;
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
  max-height: 250px;
  overflow-y: auto;
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
}

.player-name-details {
  display: flex;
  flex-direction: column;
}

.player-full-name {
  font-weight: 600;
  color: #343a40;
}

.player-username {
  font-size: 0.85rem;
  color: #6c757d;
}

.avatar-sm {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}
.avatar-placeholder {
  font-size: 40px;
  color: #adb5bd;
}

.captain-icon {
  color: #f59e0b;
  font-size: 1.1rem;
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
  transition: background-color 0.2s ease-in-out;
}
.btn-invite.pending {
  background-color: #6c757d;
  cursor: not-allowed;
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

.player-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-remove-player {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s, color 0.2s;
}

.btn-remove-player:hover {
  background-color: #fee2e2;
  color: #b91c1c;
}

.feedback-message-global {
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 500;
  margin-top: 1.5rem;
  font-size: 0.95rem;
  text-align: center;
}
.feedback-message-global.success {
  background-color: #d4edda;
  color: #155724;
}
.feedback-message-global.error {
  background-color: #f8d7da;
  color: #721c24;
}

.danger-zone-wrapper {
    margin-top: auto;
}

.danger-zone {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 2px solid #fee2e2;
}

.danger-zone h4 {
    color: #b91c1c;
    font-size: 1.2rem;
    margin-bottom: 1rem;
}

.btn-danger {
    background-color: #dc3545;
    color: white;
    width: 100%;
    border: none;
    padding: 0.75rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
}
.btn-danger:hover {
    background-color: #c82333;
}

.team-full-message {
    text-align: center;
    padding: 2rem 1rem;
    background-color: #f8f9fa;
    border-radius: 8px;
}
.team-full-message .fa-exclamation-circle {
    font-size: 2rem;
    color: #00AEEF;
    margin-bottom: 1rem;
}
</style>