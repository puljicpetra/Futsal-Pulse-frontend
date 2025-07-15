<template>
  <div class="tournaments-page">
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

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading tournaments...</p>
    </div>

    <div v-else-if="error" class="error-state">
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
      <h2>No tournaments found.</h2>
      <p v-if="authStore.userRole === 'organizer'">
        Be the first to <router-link to="/tournaments/create">create one</router-link>!
      </p>
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
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  min-height: calc(100vh - 60px);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  border-bottom: 2px solid #eee;
  padding-bottom: 1rem;
}

h1 {
  color: #333;
}

.btn-create {
  background-color: #00AEEF;
  color: white;
  padding: 0.7rem 1.2rem;
  border-radius: 5px;
  text-decoration: none;
  font-weight: bold;
  transition: background-color 0.3s;
}
.btn-create:hover {
  background-color: #007bff;
}
.btn-create i {
  margin-right: 0.5rem;
}

.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 4rem;
  color: #777;
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

.tournaments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.tournament-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s, box-shadow 0.3s;
}
.tournament-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.card-header {
  background-color: #343a40;
  color: white;
  padding: 1rem 1.5rem;
}
.card-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.card-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.card-info {
  color: #666;
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
  background-color: #00AEEF;
  color: white;
  text-align: center;
  padding: 0.7rem;
  border-radius: 5px;
  text-decoration: none;
  font-weight: bold;
  transition: background-color 0.3s;
  margin-top: auto;
}
.btn-details:hover {
  background-color: #007bff;
}

.btn-retry {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
}
</style>