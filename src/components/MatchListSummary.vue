<template>
  <section class="schedule-summary-section card">
    <div class="card-header-flex">
      <h2><i class="fas fa-clipboard-list"></i> Match Schedule</h2>
      <button v-if="isOwner" class="btn-add-match" @click="emit('add-match')">
          <i class="fas fa-plus"></i> Add Match
      </button>
    </div>
    
    <div v-if="isLoading" class="loading-state-small">Loading matches...</div>
    <div v-else-if="matches.length === 0" class="text-muted">No matches scheduled yet.</div>
    
    <ul v-else class="matches-list-summary">
        <li v-for="match in matches" :key="match._id" class="match-item-summary">
            <div class="match-info-summary">
                <span class="team-name">{{ match.teamA.name || 'TBD' }}</span>
                <span class="match-score">
                    {{ finalScore(match).teamA }} : {{ finalScore(match).teamB }}
                </span>
                <span class="team-name">{{ match.teamB.name || 'TBD' }}</span>
            </div>
            <div class="match-meta-summary">
                <span>{{ formatMatchDate(match.matchDate) }}</span>
                <span v-if="match.status === 'finished'" class="status-badge finished">Final</span>
            </div>
        </li>
    </ul>

    <div class="footer-actions">
        <router-link :to="`/matches?tournamentId=${tournamentId}`" class="btn-see-all">
            See All Matches
        </router-link>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '@/services/api';

const props = defineProps({
  tournamentId: { type: String, required: true },
  isOwner: { type: Boolean, default: false }
});

const emit = defineEmits(['add-match']);

const matches = ref([]);
const isLoading = ref(true);

const fetchMatchesSummary = async () => {
  isLoading.value = true;
  try {
    const response = await apiClient.get(`/api/matches/tournament/${props.tournamentId}?limit=4`);
    matches.value = response.data;
  } catch (err) {
    console.error("Failed to fetch matches summary:", err);
  } finally {
    isLoading.value = false;
  }
};

const finalScore = (match) => {
    let final = { teamA: match.score.teamA ?? 0, teamB: match.score.teamB ?? 0 };
    if (match.overtime_score) {
        final.teamA += match.overtime_score.teamA;
        final.teamB += match.overtime_score.teamB;
    }
    return final;
};

const formatMatchDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false };
  return new Date(dateString).toLocaleString('en-US', options);
};

onMounted(fetchMatchesSummary);
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

.matches-list-summary {
  list-style: none;
  padding: 0;
  margin: 0;
}

.match-item-summary {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
}

.match-item-summary:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.match-info-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.match-info-summary .team-name {
  flex: 1;
  text-align: center;
}

.match-score {
  font-size: 1.25rem;
  padding: 0 1rem;
}

.match-meta-summary {
  font-size: 0.85rem;
  color: #888;
  text-align: center;
  margin-top: 0.5rem;
}

.status-badge.finished {
  display: inline-block;
  background-color: #e2e3e5;
  color: #495057;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  margin-left: 0.5rem;
  font-weight: bold;
}

.footer-actions {
    text-align: center;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #f0f0f0;
}

.btn-see-all {
    background-color: #0d6efd;
    color: white;
    padding: 0.7rem 1.5rem;
    font-size: 1rem;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    text-decoration: none;
    display: inline-block;
}
</style>