<template>
  <div class="matches-page">
    <div class="header-container">
      <div class="header-content-wrapper">
        <h1>Matches</h1>
      </div>
    </div>

    <div class="page-content">
      <div class="filters-container">
        <div class="filter-group">
          <label for="tournament-filter"><i class="fas fa-trophy"></i> Filter by Tournament</label>
          <select id="tournament-filter" v-model="filters.tournamentId">
            <option :value="null">All Tournaments</option>
            <option v-for="t in allTournaments" :key="t._id" :value="t._id">{{ t.name }}</option>
          </select>
        </div>
        <div class="filter-group">
          <label for="team-filter"><i class="fas fa-shield-alt"></i> Filter by Team</label>
          <select id="team-filter" v-model="filters.teamId">
            <option :value="null">All Teams</option>
            <option v-for="t in allTeams" :key="t._id" :value="t._id">{{ t.name }}</option>
          </select>
        </div>
        <div class="filter-actions">
          <button @click="applyFilters" class="btn-filter">
            <i class="fas fa-search"></i> Apply
          </button>
          <button @click="clearFilters" class="btn-clear">
            Clear
          </button>
        </div>
      </div>

      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading matches...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <h2><i class="fas fa-exclamation-triangle"></i> Oops!</h2>
        <p>{{ error }}</p>
        <button @click="fetchMatches" class="btn-retry">Try Again</button>
      </div>

      <div v-else-if="groupedMatches.length > 0">
        <div v-for="group in groupedMatches" :key="group.date" class="date-group">
          <h3 class="date-header">{{ formatDateGroup(group.date) }}</h3>
          <div class="matches-list">
            <router-link v-for="match in group.matches" :key="match._id" :to="`/matches/${match._id}`" class="match-card-link">
              <div class="match-card">
                <div class="match-card-header">
                  <span class="tournament-name">{{ match.tournament.name }}</span>
                  <span v-if="match.group" class="group-badge">{{ match.group }}</span>
                </div>
                <div class="match-card-body">
                  <div class="team-info team-a">
                    <span class="team-name">{{ match.teamA.name }}</span>
                  </div>
                  <div class="score-info">
                    <span class="score">{{ match.score.teamA ?? '-' }} : {{ match.score.teamB ?? '-' }}</span>
                    <span class="match-time">{{ formatTime(match.matchDate) }}</span>
                  </div>
                  <div class="team-info team-b">
                    <span class="team-name">{{ match.teamB.name }}</span>
                  </div>
                </div>
              </div>
            </router-link>
          </div>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <div class="empty-state-icon"><i class="fas fa-calendar-times"></i></div>
        <h2>No Matches Found</h2>
        <p>There are no matches scheduled or your filters did not return any results.</p>
        <button v-if="filters.tournamentId || filters.teamId" @click="clearFilters" class="btn-clear-main">Clear Filters</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import apiClient from '@/services/api';

const route = useRoute();
const allMatches = ref([]);
const allTournaments = ref([]);
const allTeams = ref([]);
const isLoading = ref(true);
const error = ref('');

const filters = ref({
  tournamentId: null,
  teamId: null
});

const fetchMatches = async () => {
  isLoading.value = true;
  error.value = '';
  try {
    const params = new URLSearchParams();
    if (filters.value.tournamentId) {
        params.append('tournamentId', filters.value.tournamentId);
    }
    if (filters.value.teamId) {
        params.append('teamId', filters.value.teamId);
    }
    const response = await apiClient.get(`/api/matches?${params.toString()}`);
    allMatches.value = response.data;
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to fetch matches.';
  } finally {
    isLoading.value = false;
  }
};

const fetchFilterData = async () => {
    try {
        const [tournamentsRes, teamsRes] = await Promise.all([
            apiClient.get('/api/tournaments'),
            apiClient.get('/api/teams')
        ]);
        allTournaments.value = tournamentsRes.data;
        allTeams.value = teamsRes.data;
    } catch (err) {
        console.error("Failed to load filter data:", err);
    }
};

const groupedMatches = computed(() => {
  const groups = allMatches.value.reduce((acc, match) => {
    const date = match.matchDate.split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(match);
    return acc;
  }, {});

  return Object.keys(groups).map(date => ({
    date: date,
    matches: groups[date]
  }));
});

const applyFilters = () => {
    fetchMatches();
};

const clearFilters = () => {
  filters.value.tournamentId = null;
  filters.value.teamId = null;
  fetchMatches();
};

const formatDateGroup = (dateString) => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

const formatTime = (dateString) => {
  const options = { hour: '2-digit', minute: '2-digit', hour12: false };
  return new Date(dateString).toLocaleTimeString('en-US', options);
};

onMounted(() => {
    if (route.query.tournamentId) {
        filters.value.tournamentId = route.query.tournamentId;
    }
    fetchMatches();
    fetchFilterData();
});
</script>

<style scoped>
.matches-page {
  padding: 0;
  background-color: #f9fafb;
  min-height: calc(100vh - 60px);
}

.page-content {
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
}

.header-container {
  width: 100%;
  background-color: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1.5rem 2rem;
  box-sizing: border-box;
}

.header-content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  color: #111827;
  font-weight: 700;
  font-size: 2.25rem;
  margin: 0;
}

.filters-container {
  background-color: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  align-items: flex-end;
  gap: 1.5rem;
}

.filter-group {
  flex: 1;
}

.filter-group label {
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background-color: #fff;
}

.filter-actions {
  display: flex;
  gap: 0.5rem;
}

.filter-actions button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-filter {
  background-color: #374151;
  color: white;
}

.btn-clear {
  background-color: #e5e7eb;
  color: #374151;
}

.date-group {
  margin-bottom: 2.5rem;
}

.date-header {
  font-size: 1.25rem;
  color: #374151;
  border-bottom: 2px solid #00AEEF;
  padding-bottom: 0.5rem;
  margin-bottom: 1.5rem;
}

.matches-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.match-card-link {
  text-decoration: none;
  color: inherit;
}

.match-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transition: all 0.2s ease-in-out;
}

.match-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.match-card-header {
  padding: 0.75rem 1rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.tournament-name {
  color: #4b5563;
  font-weight: 600;
}

.group-badge {
  background-color: #e9ecef;
  color: #495057;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.match-card-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1rem;
}

.team-info {
  flex: 1;
  text-align: center;
}

.team-name {
  font-size: 1.2rem;
  font-weight: 600;
}

.score-info {
  text-align: center;
  padding: 0 1.5rem;
}

.score {
  font-size: 1.75rem;
  font-weight: 700;
  display: block;
}

.match-time {
  font-size: 0.9rem;
  color: #6b7280;
}

.empty-state, .loading-state, .error-state {
  text-align: center;
  padding: 4rem 1rem;
}

.empty-state-icon { font-size: 3rem; color: #d1d5db; }
.empty-state h2 { color: #1f2937; margin-top: 1.5rem; }
.empty-state p { color: #6b7280; }

.spinner {
  border: 4px solid #f3f4f6;
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
</style>