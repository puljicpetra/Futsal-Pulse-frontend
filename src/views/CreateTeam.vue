<template>
  <div class="create-team-container">
    <div class="form-card">
      
      <router-link to="/teams" class="back-link">
        <i class="fas fa-arrow-left"></i> Back to My Teams
      </router-link>

      <div class="form-header">
        <i class="fas fa-shield-alt"></i>
        <h2>Create a New Team</h2>
        <p>Give your team a name to get started. You'll be the captain.</p>
      </div>
      
      <form @submit.prevent="submitTeam">
        
        <div class="form-group">
          <label for="name">Team Name</label>
          <input type="text" id="name" v-model="teamName" placeholder="e.g., MNE Valdebek" required />
        </div>
        
        <div class="form-actions">
            <p v-if="error" class="error-message">{{ error }}</p>
            <p v-if="success" class="success-message">{{ success }}</p>

            <button type="submit" class="btn-submit" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="spinner-sm"></span>
              {{ isSubmitting ? 'Creating...' : 'Create Team' }}
            </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import apiClient from '@/services/api';
import { useRouter } from 'vue-router';

const router = useRouter();
const teamName = ref('');
const isSubmitting = ref(false);
const error = ref('');
const success = ref('');

const submitTeam = async () => {
  isSubmitting.value = true;
  error.value = '';
  success.value = '';

  try {
    const response = await apiClient.post('/api/teams', { name: teamName.value });
    
    success.value = response.data.message;
    
    setTimeout(() => {
      router.push('/teams');
    }, 1500);

  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to create team. Please try again.';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.create-team-container {
  padding: 2rem 1rem;
  background-color: #f4f7f6;
  min-height: calc(100vh - 60px);
  flex-grow: 1;
}

.form-card {
  position: relative;
  width: 100%;
  max-width: 550px;
  background: white;
  padding: 2.5rem 3rem;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  margin: 2rem auto;
}

.back-link {
  position: absolute;
  top: 25px;
  left: 25px;
  text-decoration: none;
  color: #555;
  font-weight: 600;
}

.form-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.form-header .fa-shield-alt {
  font-size: 2.5rem;
  color: #00AEEF;
}

h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  margin-top: 0.5rem;
}

.form-header p {
  color: #666;
  max-width: 80%;
  margin: 0.5rem auto 0;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

input[type="text"] {
  width: 100%;
  padding: 0.9rem;
  border: 1px solid #dcdcdc;
  border-radius: 8px;
  box-sizing: border-box;
  font-size: 1rem;
}

.form-actions {
  margin-top: 2rem;
  text-align: center;
}

.btn-submit {
  width: 100%;
  padding: 1rem;
  background-color: #00AEEF;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.error-message, .success-message {
  margin-bottom: 1rem;
  padding: 0.8rem;
  border-radius: 6px;
  font-size: 0.9rem;
}

.error-message {
  color: #721c24;
  background-color: #f8d7da;
}

.success-message {
  color: #155724;
  background-color: #d4edda;
}

.spinner-sm {
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid #fff;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>