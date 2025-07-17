<template>
  <div class="teams-page">
    <div class="header-container">
      <div class="header-content-wrapper">
        <h1>My Teams</h1>
        <router-link 
          v-if="authStore.userRole === 'player'"
          to="/teams/create" 
          class="btn-create"
        >
          <i class="fas fa-plus"></i> Create New Team
        </router-link>
      </div>
    </div>

    <div class="page-content">
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading your teams...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <h2><i class="fas fa-exclamation-triangle"></i> Oops!</h2>
        <p>{{ error }}</p>
        <button @click="fetchMyTeams" class="btn-retry">Try Again</button>
      </div>
      
      <div v-else-if="myTeams.length > 0" class="teams-grid">
        <div v-for="team in myTeams" :key="team._id" class="team-card">
          <div class="card-header">
            <h3><i class="fas fa-shield-alt"></i> {{ team.name }}</h3>
          </div>
          <div class="card-body">
            <div class="card-info">
              <p><strong>Players:</strong> {{ team.players.length }}</p>
              <p v-if="team.captain === authStore.userId" class="captain-badge">
                <i class="fas fa-crown"></i> You are the Captain
              </p>
            </div>
            <router-link :to="`/teams/${team._id}`" class="btn-details">
              <span v-if="team.captain === authStore.userId">
                <i class="fas fa-cog"></i> Manage Team
              </span>
              <span v-else>
                <i class="fas fa-eye"></i> View Details
              </span>
            </router-link>
          </div>
        </div>
      </div>
      
      <div v-else-if="authStore.userRole !== 'player'" class="empty-state">
        <div class="empty-state-icon"><i class="fas fa-users"></i></div>
        <h2>Team management is for players only.</h2>
      </div>

      <div v-else class="empty-state">
        <div class="empty-state-icon"><i class="fas fa-users"></i></div>
        <h2>You're Not on a Team Yet</h2>
        <p>Create a new team to start competing or wait for an invitation from a friend.</p>
        <router-link to="/teams/create" class="btn-create-main">
          Create Your First Team
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '@/services/api';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const myTeams = ref([]);
const isLoading = ref(true);
const error = ref('');

const fetchMyTeams = async () => {
  isLoading.value = true;
  error.value = '';
  try {
    const response = await apiClient.get('/api/teams');
    myTeams.value = response.data;
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to fetch your teams.';
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  if (authStore.userRole === 'player') {
    fetchMyTeams();
  } else {
    isLoading.value = false;
  }
});
</script>

<style scoped>
.teams-page {
  padding: 0;
  background-color: #f9fafb;
  min-height: calc(100vh - 60px);
}

.page-content {
  padding: 2rem;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
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
}
.btn-create:hover {
  background-color: #008fbf;
  box-shadow: 0 4px 15px #008fbf(40, 167, 69, 0.2);
  transform: translateY(-2px);
}

.teams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.team-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.07);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.card-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f0f0f0;
}

.card-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.card-header .fa-shield-alt {
  color: #00AEEF;
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
}

.captain-badge {
  color: #b45309;
  background-color: #fef3c7;
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-block;
}

.btn-details {
  background-color: #374151;
  color: white;
  text-align: center;
  padding: 0.7rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
.btn-details:hover {
  background-color: #1f2937;
}

.empty-state {
  text-align: center;
  padding: 4rem 1rem;
}
.empty-state-icon {
  font-size: 3rem;
  color: #d1d5db;
}
.empty-state h2 {
  color: #1f2937;
  margin-top: 1.5rem;
}
.empty-state p {
  color: #6b7280;
  max-width: 450px;
  margin: 0.5rem auto 1.5rem;
}
.btn-create-main {
  background-color: #008fbf;
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
}

.loading-state, .error-state {
  text-align: center;
  padding: 4rem 1rem;
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
</style>