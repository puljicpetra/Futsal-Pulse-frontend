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

        <div class="organizer-actions" v-if="isOwner">
            <button @click="goToEdit" class="btn btn-edit">
                <i class="fas fa-edit"></i> Edit Tournament
            </button>
            <button @click="confirmDelete" class="btn btn-delete">
                <i class="fas fa-trash-alt"></i> Delete Tournament
            </button>
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
            <h2><i class="fas fa-users"></i> Registered Teams</h2>
            <p class="text-muted">Team registration functionality is coming soon.</p>
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
const isLoading = ref(true);
const error = ref('');

const isOwner = computed(() => {
  if (!authStore.isLoggedIn || !tournament.value) return false;
  return authStore.userId === tournament.value.organizer;
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

onMounted(() => {
  fetchTournamentDetails();
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

.organizer-actions {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
  gap: 1rem;
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

@media (max-width: 992px) {
  .tournament-body {
    grid-template-columns: 1fr;
  }
}
</style>