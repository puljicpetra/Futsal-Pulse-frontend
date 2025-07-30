<template>
  <div class="edit-tournament-container">
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading tournament data...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <h2>Oops! Something went wrong.</h2>
      <p>{{ error }}</p>
      <router-link to="/tournaments" class="btn-back">Back to Tournaments</router-link>
    </div>

    <div v-else-if="tournament" class="form-card">
      
      <router-link :to="`/tournaments/${tournamentId}`" class="back-link">
        <i class="fas fa-arrow-left"></i> Back to Tournament
      </router-link>

      <div class="form-header">
        <i class="fas fa-edit"></i>
        <h2>Edit Tournament</h2>
        <p>Update the details for "{{ tournament.name }}"</p>
      </div>
      
      <form @submit.prevent="submitUpdate">
        
        <div class="form-group">
          <label for="name">Tournament Name</label>
          <input type="text" id="name" v-model="tournament.name" required />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="city">City</label>
            <input type="text" id="city" v-model="tournament.location.city" required />
          </div>
          <div class="form-group">
            <label for="venue">Venue / Sports Hall</label>
            <input type="text" id="venue" v-model="tournament.location.venue" />
          </div>
        </div>

        <div class="form-row">
            <div class="form-group">
              <label for="startDate">Start Date</label>
              <input type="date" id="startDate" v-model="formattedStartDate" required />
            </div>
            <div class="form-group">
              <label for="endDate">End Date (optional)</label>
              <input type="date" id="endDate" v-model="formattedEndDate" />
            </div>
        </div>

        <div class="form-group">
          <label for="surface">Playing Surface</label>
          <select id="surface" v-model="tournament.surface" required>
            <option disabled value="">Select a surface</option>
            <option value="parket">Parquet (indoor)</option>
            <option value="beton">Concrete / Asphalt</option>
            <option value="trava">Artificial Grass</option>
            <option value="pijesak">Sand</option>
            <option value="tepih">Carpet</option>
          </select>
        </div>

        <div class="form-group">
          <label for="rules">Rules & Description</label>
          <textarea id="rules" v-model="tournament.rules" rows="6"></textarea>
        </div>

        <div class="form-group">
          <label for="tournamentImage">Change Tournament Image (optional)</label>
          <div class="current-image-preview" v-if="tournament.imageUrl && !newImagePreviewUrl">
            <img :src="getImageUrl(tournament.imageUrl)" alt="Current image" />
            <span>Current Image</span>
          </div>
           <div class="current-image-preview" v-if="newImagePreviewUrl">
            <img :src="newImagePreviewUrl" alt="New image preview" />
            <span>New Image Preview</span>
          </div>
          <input type="file" id="tournamentImage" @change="handleFileChange" class="file-input" accept="image/png, image/jpeg" />
        </div>
        
        <div class="form-actions">
            <p v-if="updateError" class="error-message">{{ updateError }}</p>
            <p v-if="updateSuccess" class="success-message">{{ updateSuccess }}</p>

            <button type="submit" class="btn-submit" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="spinner-sm"></span>
              {{ isSubmitting ? 'Saving...' : 'Save Changes' }}
            </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import apiClient from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import { getImageUrl } from '@/utils/url.js';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const tournamentId = route.params.id;

const tournament = ref({ location: {} });
const newImageFile = ref(null);
const newImagePreviewUrl = ref(null);

const isLoading = ref(true);
const error = ref('');
const isSubmitting = ref(false);
const updateError = ref('');
const updateSuccess = ref('');

const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toISOString().split('T')[0];
};

const formattedStartDate = computed({
  get: () => formatDateForInput(tournament.value.startDate),
  set: (newValue) => { tournament.value.startDate = newValue; }
});
const formattedEndDate = computed({
  get: () => formatDateForInput(tournament.value.endDate),
  set: (newValue) => { tournament.value.endDate = newValue; }
});

const fetchTournamentData = async () => {
  try {
    const response = await apiClient.get(`/api/tournaments/${tournamentId}`);

    if (response.data.organizer !== authStore.userId) {
      error.value = "You do not have permission to edit this tournament.";
      setTimeout(() => router.push(`/tournaments/${tournamentId}`), 3000);
      return;
    }
    
    tournament.value = response.data;
  } catch (err) {
    console.error("Failed to fetch tournament data:", err);
    error.value = "Could not load tournament data. It may have been deleted.";
  } finally {
    isLoading.value = false;
  }
};

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    newImageFile.value = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      newImagePreviewUrl.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const submitUpdate = async () => {
  isSubmitting.value = true;
  updateError.value = '';
  updateSuccess.value = '';

  const formData = new FormData();
  formData.append('name', tournament.value.name);
  formData.append('location', JSON.stringify(tournament.value.location));
  formData.append('startDate', tournament.value.startDate);
  if(tournament.value.endDate) formData.append('endDate', tournament.value.endDate);
  formData.append('surface', tournament.value.surface);
  formData.append('rules', tournament.value.rules);

  if (newImageFile.value) {
    formData.append('tournamentImage', newImageFile.value);
  }

  try {
    const response = await apiClient.put(`/api/tournaments/${tournamentId}`, formData, {
      headers: { 'Content-Type': undefined }
    });
    
    updateSuccess.value = 'Tournament updated successfully!';
    tournament.value = response.data;
    newImageFile.value = null;
    newImagePreviewUrl.value = null;

    setTimeout(() => {
      updateSuccess.value = '';
    }, 3000);

  } catch (err) {
    if (err.response?.data) {
        if (Array.isArray(err.response.data.errors)) {
             updateError.value = err.response.data.errors.map(e => e.msg).join(' ');
        } else if (err.response.data.message) {
            updateError.value = err.response.data.message;
        } else {
            updateError.value = 'An unknown error occurred while saving.';
        }
    } else {
      updateError.value = 'Failed to update tournament. Please try again.';
    }
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  fetchTournamentData();
});
</script>

<style scoped>
.edit-tournament-container {
  padding: 2rem 1rem;
  background-color: #f4f7f6;
  min-height: calc(100vh - 60px);
  flex-grow: 1;
}

.form-card {
  position: relative;
  width: 100%;
  max-width: 750px;
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: color 0.3s;
}

.back-link:hover {
  color: #00AEEF;
}

.form-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.form-header .fa-edit {
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
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: flex;
  gap: 1.5rem;
}

.form-row .form-group {
  flex: 1;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

input[type="text"],
input[type="date"],
select,
textarea,
.file-input {
  width: 100%;
  padding: 0.9rem;
  border: 1px solid #dcdcdc;
  border-radius: 8px;
  box-sizing: border-box;
  font-size: 1rem;
  transition: border-color 0.3s, box-shadow 0.3s;
  background-color: #ffffff;
  color: #1f2937;
}

.file-input {
  padding: 0.5rem;
}

.file-input::file-selector-button {
  font-weight: 600;
  color: #00AEEF;
  border: none;
  background: #f0f8ff;
  padding: 0.5em 1em;
  border-radius: 6px;
  cursor: pointer;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: #00AEEF;
  box-shadow: 0 0 0 4px rgba(0, 174, 239, 0.1);
}

.form-actions {
  margin-top: 2rem;
  text-align: center;
}

.btn-submit {
  width: 100%;
  padding: 1rem;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
}

.btn-submit:hover:not(:disabled) {
  background-color: #218838;
}

.error-message, .success-message {
  margin-bottom: 1rem;
  padding: 0.8rem;
  border-radius: 6px;
}

.error-message {
  color: #721c24;
  background-color: #f8d7da;
}

.success-message {
  color: #155724;
  background-color: #d4edda;
}

.loading-state, .error-state {
  text-align: center;
  padding: 4rem;
}

.spinner, .spinner-sm {
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top-color: #00AEEF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner {
    width: 40px;
    height: 40px;
    margin: 0 auto 1rem;
}

.spinner-sm {
  width: 16px;
  height: 16px;
  border-top-color: #fff;
}

.current-image-preview {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  background-color: #f9f9f9;
  padding: 0.5rem;
  border-radius: 8px;
}

.current-image-preview img {
  width: 70px;
  height: 70px;
  object-fit: cover;
  border-radius: 6px;
}

.current-image-preview span {
  font-weight: 500;
  color: #555;
}
</style>