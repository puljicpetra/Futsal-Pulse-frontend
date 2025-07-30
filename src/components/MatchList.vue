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
                <span class="match-score" :class="{ 'clickable-score': isOwner }" @click="isOwner && openScoreModal(match)">
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
                <button 
                  v-if="match.status !== 'finished'"
                  @click="finishMatch(match._id)" 
                  class="btn-finish-match" 
                  title="Mark as Finished"
                >
                    <i class="fas fa-flag-checkered"></i>
                </button>
                <button @click="openScoreModal(match)" class="btn-edit-score" title="Update Score">
                    <i class="fas fa-pencil-alt"></i>
                </button>
                <button @click="deleteMatch(match._id)" class="btn-delete-match" title="Delete Match">
                    <i class="fas fa-trash-alt"></i>
                </button>
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
import { ref, onMounted } from 'vue';
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

const deleteMatch = async (matchId) => {
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
        await apiClient.put(`/api/matches/${selectedMatch.value._id}`, {
            scoreA: score.value.teamA,
            scoreB: score.value.teamB
        });
        
        closeScoreModal();
        emit('feedback', { type: 'success', text: 'Score updated successfully!' });
        await fetchMatches();

    } catch (err) {
        console.error("Failed to update score:", err);
        scoreModalError.value = err.response?.data?.message || 'Failed to update score.';
    } finally {
        isUpdatingScore.value = false;
    }
};

const finishMatch = async (matchId) => {
    try {
        const response = await apiClient.patch(`/api/matches/${matchId}/finish`);

        const index = matches.value.findIndex(m => m._id === matchId);
        if (index !== -1) {
            matches.value[index] = response.data.match;
        }
        
        emit('feedback', { type: 'success', text: 'Match marked as finished!' });

    } catch (err) {
        console.error("Failed to finish match:", err);
        emit('feedback', { type: 'error', text: err.response?.data?.message || 'Could not finish match.' });
    }
};

onMounted(fetchMatches);

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
  margin-bottom: 0;
  border-bottom: none;
  padding-bottom: 0;
  font-size: 1.5rem;
  color: #333;
  display: flex;
  align-items: center;
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
  position: relative;
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
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
    right: 0.5rem;
    transform: translateY(-50%);
    display: flex;
    gap: 0.5rem;
}

.btn-finish-match, .btn-edit-score, .btn-delete-match {
  background: none;
  border: none;
  color: #aaa;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.5rem;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-finish-match:hover {
    color: #198754;
    background-color: #d1e7dd;
}

.btn-edit-score:hover {
    color: #ffc107;
    background-color: #fff3cd;
}

.btn-delete-match:hover {
  color: #dc3545;
  background-color: #fee2e2;
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

.modal-content h3 { margin-top: 0; }
.modal-content p { color: #666; }

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
.btn-cancel { background-color: #f0f0f0; }
.btn-submit { background-color: #28a745; color: white; }
.btn-submit:disabled { background-color: #a0a0a0; }
.error-message { color: #dc3545; text-align: center; margin-top: 1rem; }
</style>