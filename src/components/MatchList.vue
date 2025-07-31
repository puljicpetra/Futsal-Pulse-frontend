<template>
  <section class="schedule-section card">
    <div class="card-header-flex">
      <h2><i class="fas fa-clipboard-list"></i> Match Schedule</h2>
      <button v-if="isOwner" class="btn-add-match" @click="emit('add-match')">
          <i class="fas fa-plus"></i> Add Match
      </button>
    </div>
    
    <div v-if="isLoading" class="loading-state-small">Loading matches...</div>
    <div v-else-if="matches.length === 0" class="text-muted">
        No matches scheduled yet.
    </div>
    <ul v-else class="matches-list">
        <li v-for="match in matches" :key="match._id" class="match-item">
            <div class="match-info">
                <span class="team-name">{{ match.teamA?.name || 'TBD' }}</span>
                <span class="match-score" :class="{ 'clickable-score': isOwner && match.status !== 'finished' }" @click="isOwner && match.status !== 'finished' && openScoreModal(match)">
                    {{ match.score.teamA !== null ? match.score.teamA : '-' }} : {{ match.score.teamB !== null ? match.score.teamB : '-' }}
                </span>
                <span class="team-name">{{ match.teamB?.name || 'TBD' }}</span>
            </div>
            <div class="match-meta">
                <span>{{ formatMatchDate(match.matchDate) }}</span>
                <span v-if="match.status === 'finished'" class="status-badge finished">Final</span>
                <span v-else-if="match.group" class="group-badge">{{ match.group }}</span>
            </div>
            
            <div v-if="isOwner" class="owner-actions">
              <button @click.stop="toggleMenu(match._id)" class="btn-menu" title="Actions">
                <i class="fas fa-ellipsis-v"></i>
              </button>

              <div v-if="openMenuId === match._id" class="actions-dropdown">
                <a v-if="match.status !== 'finished'" @click="finishMatch(match._id)">
                  <i class="fas fa-flag-checkered"></i> Finish Match
                </a>
                <a @click="openScoreModal(match)">
                  <i class="fas fa-pencil-alt"></i> Update Score
                </a>
                <a @click="deleteMatch(match._id)" class="text-danger">
                  <i class="fas fa-trash-alt"></i> Delete Match
                </a>
              </div>
            </div>
        </li>
    </ul>
  </section>

  <div v-if="showScoreModal" class="modal-overlay" @click.self="closeScoreModal">
    <div class="modal-content">
        <h3>Update Match Score</h3>
        <p v-if="selectedMatch">{{ selectedMatch.teamA?.name }} vs {{ selectedMatch.teamB?.name }}</p>
        <form @submit.prevent="submitScoreUpdate">
            <div class="score-input-group">
                <input type="number" v-model.number="score.teamA" min="0" required />
                <span>:</span>
                <input type="number" v-model.number="score.teamB" min="0" required />
            </div>
            <div class="modal-actions">
                <button type="button" @click="closeScoreModal" class="btn-cancel">Cancel</button>
                <button type="submit" :disabled="isUpdatingScore" class="btn-submit">
                    {{ isUpdatingScore ? 'Saving...' : 'Save Score' }}
                </button>
            </div>
            <p v-if="scoreModalError" class="error-message">{{ scoreModalError }}</p>
        </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import apiClient from '@/services/api';

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

const emit = defineEmits(['feedback', 'add-match']);

const matches = ref([]);
const isLoading = ref(true);

const showScoreModal = ref(false);
const selectedMatch = ref(null);
const isUpdatingScore = ref(false);
const scoreModalError = ref('');
const score = ref({ teamA: 0, teamB: 0 });

const openMenuId = ref(null);

const fetchMatches = async () => {
  isLoading.value = true;
  try {
    const response = await apiClient.get(`/api/matches/tournament/${props.tournamentId}`);
    matches.value = response.data;
  } catch (err) {
    console.error("Failed to fetch matches:", err);
    emit('feedback', { type: 'error', text: 'Could not load match schedule.' });
  } finally {
    isLoading.value = false;
  }
};

const closeMenu = () => {
  openMenuId.value = null;
};

const toggleMenu = (matchId) => {
  if (openMenuId.value === matchId) {
    closeMenu();
  } else {
    openMenuId.value = matchId;
  }
};

const deleteMatch = async (matchId) => {
  closeMenu();
  if (window.confirm('Are you sure you want to delete this match?')) {
    try {
      await apiClient.delete(`/api/matches/${matchId}`);
      matches.value = matches.value.filter(m => m._id !== matchId);
      emit('feedback', { type: 'success', text: 'Match deleted successfully.' });
    } catch (err) {
      console.error("Failed to delete match:", err);
      emit('feedback', { type: 'error', text: err.response?.data?.message || 'Could not delete match.' });
    }
  }
};

const formatMatchDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false };
  return new Date(dateString).toLocaleString('en-US', options);
};

const openScoreModal = (match) => {
    closeMenu();
    selectedMatch.value = match;
    score.value.teamA = match.score.teamA ?? 0;
    score.value.teamB = match.score.teamB ?? 0;
    scoreModalError.value = '';
    showScoreModal.value = true;
};

const closeScoreModal = () => {
    showScoreModal.value = false;
    selectedMatch.value = null;
};

const submitScoreUpdate = async () => {
    isUpdatingScore.value = true;
    scoreModalError.value = '';
    try {
        const response = await apiClient.put(`/api/matches/${selectedMatch.value._id}`, {
            scoreA: score.value.teamA,
            scoreB: score.value.teamB
        });
        
        const index = matches.value.findIndex(m => m._id === selectedMatch.value._id);
        if (index !== -1) {
            matches.value[index] = response.data.match;
        }
        closeScoreModal();
        emit('feedback', { type: 'success', text: 'Score updated successfully!' });
    } catch (err) {
        console.error("Failed to update score:", err);
        scoreModalError.value = err.response?.data?.message || 'Failed to update score.';
    } finally {
        isUpdatingScore.value = false;
    }
};

const finishMatch = async (matchId) => {
    closeMenu();
    if (!confirm("Are you sure you want to finalize this match? The result cannot be edited after this.")) {
      return;
    }
    try {
        const response = await apiClient.patch(`/api/matches/${matchId}/finish`);
        const index = matches.value.findIndex(m => m._id === matchId);
        if (index !== -1) {
            matches.value[index] = response.data.match; // Update the whole match
        }
        emit('feedback', { type: 'success', text: 'Match marked as finished!' });
    } catch (err) {
        console.error("Failed to finish match:", err);
        emit('feedback', { type: 'error', text: err.response?.data?.message || 'Could not finish match.' });
    }
};

onMounted(() => {
  fetchMatches();
  window.addEventListener('click', closeMenu);
});

onUnmounted(() => {
  window.removeEventListener('click', closeMenu);
});

defineExpose({
    fetchMatches
});
</script>

<style scoped>
.card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
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
  color: #00AEEF;
}

.btn-add-match {
  background-color: #198754;
  color: white;
  padding: 0.4rem 0.8rem;
  font-size: 0.9rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.loading-state-small, .text-muted {
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
}

.clickable-score {
  cursor: pointer;
  border-bottom: 2px dotted #00AEEF;
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

.status-badge.finished {
  background-color: #e2e3e5;
  color: #495057;
  font-weight: bold;
  font-size: 0.8rem;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  margin-left: 0.5rem;
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
  background-color: #f0f0f0;
  color: #333;
}

.actions-dropdown {
  position: absolute;
  top: calc(100% + 5px);
  right: 0;
  background-color: white;
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
  background-color: #f5f5f5;
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
  background-color: #fee2e2;
  color: #b91c1c;
}

.actions-dropdown a.text-danger i {
  color: #dc3545;
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
  max-width: 400px;
}

.modal-content h3 {
  margin-top: 0;
}

.modal-content p {
  color: #666;
}

.score-input-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin: 2rem 0;
}

.score-input-group input {
  width: 80px;
  padding: 0.75rem;
  font-size: 1.5rem;
  text-align: center;
  border: 1px solid #ccc;
  border-radius: 8px;
}

.score-input-group span {
  font-size: 1.5rem;
  font-weight: bold;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
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
  background-color: #e9ecef;
  color: #343a40;
  border: 1px solid #ced4da;
}

.btn-cancel:hover {
  background-color: #dee2e6;
}

.btn-submit {
  background-color: #28a745;
  color: white;
}

.btn-submit:disabled {
  background-color: #a0a0a0;
}

.error-message {
  color: #dc3545;
  text-align: center;
  margin-top: 1rem;
}
</style>