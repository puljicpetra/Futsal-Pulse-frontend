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
                <span class="match-score">
                    {{ match.score.teamA !== null ? match.score.teamA : '-' }} : {{ match.score.teamB !== null ? match.score.teamB : '-' }}
                </span>
                <span class="team-name">{{ match.teamB?.name || 'TBD' }}</span>
            </div>
            <div class="match-meta">
                <span>{{ formatMatchDate(match.matchDate) }}</span>
                <span v-if="match.group" class="group-badge">{{ match.group }}</span>
            </div>
            <button v-if="isOwner" @click="deleteMatch(match._id)" class="btn-delete-match" title="Delete Match">
                <i class="fas fa-trash-alt"></i>
            </button>
        </li>
    </ul>
  </section>
</template>

<script setup>
import { ref, onMounted, defineProps, defineEmits } from 'vue';
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

const emit = defineEmits(['feedback']);

const matches = ref([]);
const isLoading = ref(true);

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

.btn-delete-match {
  position: absolute;
  top: 50%;
  right: 0.5rem;
  transform: translateY(-50%);
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
  transition: all 0.2s;
}

.btn-delete-match:hover {
  color: #dc3545;
  background-color: #fee2e2;
}
</style>