<template>
  <div class="tournaments-page">
    <div class="header-container">
      <div class="header">
        <h1>Tournaments</h1>
        <router-link 
          to="/tournaments/create" 
          class="btn-create" 
          v-if="authStore.userRole === 'organizer'"
        >
          <i class="fas fa-plus"></i> Create New Tournament
        </router-link>
      </div>
    </div>

    <div class="page-content">
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading tournaments...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <h2><i class="fas fa-exclamation-triangle"></i> Oops!</h2>
        <p>{{ error }}</p>
        <button @click="fetchTournaments" class="btn-retry">Try Again</button>
      </div>

      <div v-else-if="tournaments.length > 0" class="tournaments-grid">
        <div v-for="tournament in tournaments" :key="tournament._id" class="tournament-card">
          <div class="card-header">
            <h3>{{ tournament.name }}</h3>
          </div>
          <div class="card-body">
            <div class="card-info">
              <p><i class="fas fa-map-marker-alt"></i> {{ tournament.location.city }}</p>
              <p><i class="fas fa-calendar-alt"></i> {{ formatDate(tournament.startDate) }}</p>
            </div>
            <router-link :to="`/tournaments/${tournament._id}`" class="btn-details">
              View Details
            </router-link>
          </div>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <div class="empty-state-icon"><i class="fas fa-trophy"></i></div>
        <h2>No Tournaments Found</h2>
        <p>There are currently no active or upcoming tournaments.</p>
        <p v-if="authStore.userRole === 'organizer'">
          Be the first to <router-link to="/tournaments/create" class="create-link">create one</router-link>!
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '@/services/api';
import { useAuthStore } from '@/stores/auth';
const authStore = useAuthStore();
const tournaments = ref([]);
const isLoading = ref(true);
const error = ref('');
const fetchTournaments = async () => {
  isLoading.value = true;
  error.value = '';
  try {
    const response = await apiClient.get('/api/tournaments');
    tournaments.value = response.data;
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to fetch tournaments.';
  } finally {
    isLoading.value = false;
  }
};
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};
onMounted(() => {
  fetchTournaments();
});
</script>

<style scoped>
.tournaments-page {
  padding: 0; 
  background-color: #f9fafb;
}

.header-container {
  width: 100%;
  background-color: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1.5rem 2rem;
  box-sizing: border-box;
}

.header {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  color: #111827;
  font-weight: 700;
  font-size: 2.25rem;
  margin: 0;
}

.btn-create {
  background-color: #00AEEF;
  color: white;
  padding: 0.7rem 1.2rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.btn-create:hover {
  background-color: #008fbf;
  box-shadow: 0 4px 15px rgba(0, 174, 239, 0.2);
  transform: translateY(-2px);
}

.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 4rem 1rem;
  color: #6b7280;
}

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

.error-state h2, .empty-state h2 {
  color: #1f2937;
  margin: 1rem 0 0.5rem;
}

.empty-state {
  margin-top: 2rem;
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.empty-state-icon {
  font-size: 3rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.empty-state .create-link {
  font-weight: 600;
  color: #00AEEF;
  text-decoration: none;
}
.empty-state .create-link:hover {
  text-decoration: underline;
}

.tournaments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.tournament-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.07);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s, box-shadow 0.3s;
}
.tournament-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}

.card-header {
  background-color: #374151;
  color: white;
  padding: 1rem 1.5rem;
}
.card-header h3 {
  margin: 0;
  font-size: 1.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.card-info {
  color: #4b5563;
  flex-grow: 1;
  margin-bottom: 1.5rem;
}
.card-info p {
  margin: 0.5rem 0;
  display: flex;
  align-items: center;
}
.card-info i {
  margin-right: 0.75rem;
  color: #00AEEF;
  width: 16px;
  text-align: center;
}

.btn-details {
  background-color: #1f2937;
  color: white;
  text-align: center;
  padding: 0.7rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: background-color 0.3s;
  margin-top: auto;
}
.btn-details:hover {
  background-color: #111827;
}

.btn-retry {
  margin-top: 1rem;
  padding: 0.6rem 1.2rem;
  font-weight: 600;
  border-radius: 8px;
  background-color: #e5e7eb;
  color: #1f2937;
  border: none;
  cursor: pointer;
}
.btn-retry:hover {
  background-color: #d1d5db;
}
</style>