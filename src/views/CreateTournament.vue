<template>
  <div class="create-tournament-container">
    <div class="form-card">
      
      <router-link to="/tournaments" class="back-link">
        <i class="fas fa-arrow-left"></i> Back to Tournaments
      </router-link>

      <div class="form-header">
        <i class="fas fa-trophy"></i>
        <h2>Create a New Tournament</h2>
        <p>Fill out the details below to get your tournament up and running.</p>
      </div>
      
      <form @submit.prevent="submitTournament">
        
        <div class="form-group">
          <label for="name">Tournament Name</label>
          <input
            type="text"
            id="name"
            v-model.trim="tournament.name"
            placeholder="e.g., Moja ulica, moja ekipa"
            required
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="city">City</label>
            <input
              type="text"
              id="city"
              v-model.trim="tournament.location.city"
              placeholder="e.g., Pula"
              required
            />
          </div>
          <div class="form-group">
            <label for="venue">Venue / Sports Hall</label>
            <input
              type="text"
              id="venue"
              v-model.trim="tournament.location.venue"
              placeholder="e.g., Dom sportova Mate Parlov"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="startDate">Start Date</label>
            <input
              type="date"
              id="startDate"
              v-model="tournament.startDate"
              required
            />
          </div>
          <div class="form-group">
            <label for="endDate">End Date (optional)</label>
            <input
              type="date"
              id="endDate"
              v-model="tournament.endDate"
              :min="tournament.startDate || null"
            />
          </div>
        </div>
        <p v-if="dateError" class="error-message" style="margin-top:-0.75rem">{{ dateError }}</p>

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
          <textarea id="rules" v-model.trim="tournament.rules" rows="6" placeholder="Describe the tournament format, rules, prizes..."></textarea>
        </div>

        <div class="form-group">
          <label for="tournamentImage">Tournament Image (optional)</label>
          <input 
            type="file" 
            id="tournamentImage" 
            @change="handleFileChange" 
            class="file-input"
            accept="image/png, image/jpeg" 
          />
          <p v-if="fileError" class="error-message" style="margin-top:0.5rem">{{ fileError }}</p>
        </div>
        
        <div class="form-actions">
          <p v-if="error" class="error-message">{{ error }}</p>
          <p v-if="success" class="success-message">{{ success }}</p>

          <button type="submit" class="btn-submit" :disabled="isSubmitting || !isFormValid">
            <span v-if="isSubmitting" class="spinner-sm"></span>
            {{ isSubmitting ? 'Creating...' : 'Create Tournament' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import apiClient from '@/services/api';
import { useRouter } from 'vue-router';

const router = useRouter();

const tournament = ref({
  name: '',
  location: { city: '', venue: '' },
  startDate: '',
  endDate: '',
  rules: '',
  surface: ''
});

const tournamentImageFile = ref(null);

const isSubmitting = ref(false);
const error = ref('');
const success = ref('');
const dateError = ref('');
const fileError = ref('');

const MAX_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

const toDate = (yyyy_mm_dd) => {
  if (!yyyy_mm_dd) return null;
  const [y, m, d] = yyyy_mm_dd.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

watch(
  () => [tournament.value.startDate, tournament.value.endDate],
  () => {
    dateError.value = '';
    const s = toDate(tournament.value.startDate);
    const e = toDate(tournament.value.endDate);
    if (s && e && e < s) {
      dateError.value = 'End date cannot be before start date.';
    }
  },
  { immediate: true }
);

const isFormValid = computed(() => {
  if (!tournament.value.name.trim()) return false;
  if (!tournament.value.location.city.trim()) return false;
  if (!tournament.value.startDate) return false;
  if (!tournament.value.surface) return false;
  if (dateError.value) return false;
  if (fileError.value) return false;
  return true;
});

const handleFileChange = (event) => {
  fileError.value = '';
  const file = event.target.files?.[0];
  if (!file) {
    tournamentImageFile.value = null;
    return;
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    fileError.value = 'Only JPG and PNG files are allowed.';
    tournamentImageFile.value = null;
    event.target.value = '';
    return;
  }
  const sizeMb = file.size / (1024 * 1024);
  if (sizeMb > MAX_MB) {
    fileError.value = `Image is too large (${sizeMb.toFixed(1)} MB). Max ${MAX_MB} MB.`;
    tournamentImageFile.value = null;
    event.target.value = '';
    return;
  }
  tournamentImageFile.value = file;
};

const submitTournament = async () => {
  if (!isFormValid.value) return;

  isSubmitting.value = true;
  error.value = '';
  success.value = '';

  const formData = new FormData();
  const t = tournament.value;

  formData.append('name', t.name.trim());
  formData.append('location', JSON.stringify({ city: t.location.city.trim(), venue: t.location.venue.trim() }));
  formData.append('startDate', t.startDate);
  formData.append('surface', t.surface);
  if (t.endDate) formData.append('endDate', t.endDate);
  if (t.rules?.trim()) formData.append('rules', t.rules.trim());
  if (tournamentImageFile.value) formData.append('tournamentImage', tournamentImageFile.value);

  try {
    const response = await apiClient.post('/api/tournaments', formData);
    success.value = response.data.message || 'Tournament created!';
    setTimeout(() => {
      const id = response.data?.tournament?._id || response.data?._id;
      router.push(`/tournaments/${id}`);
    }, 1200);
  } catch (err) {
    if (err.response?.data) {
      if (Array.isArray(err.response.data.errors)) {
        error.value = err.response.data.errors.map(e => e.msg).join(' ');
      } else if (err.response.data.message) {
        error.value = err.response.data.message;
      } else {
        error.value = 'An unknown error occurred while creating the tournament.';
      }
    } else {
      error.value = 'Failed to create tournament. Please check your connection.';
    }
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.create-tournament-container {
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

.back-link:hover { color: #00AEEF; }

.form-header {
  text-align: center;
  margin-bottom: 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.form-header .fa-trophy {
  font-size: 2.5rem;
  color: #00AEEF;
  background: #eef9ff;
  border-radius: 50%;
  padding: 1rem;
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
}

h2 { font-size: 2rem; font-weight: 700; color: #333; margin: 0; }

.form-header p { color: #666; max-width: 80%; margin-top: 0.25rem; }

.form-group { margin-bottom: 1.5rem; width: 100%; }

.form-row { display: flex; gap: 1.5rem; }

.form-row .form-group { flex: 1; }

label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333; font-size: 0.9rem; }

.form-card input[type="text"],
.form-card input[type="date"],
.form-card select,
.form-card textarea,
.form-card .file-input {
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

.file-input { padding: 0.5rem; background-color: #f9f9f9; }

.file-input::file-selector-button {
  font-weight: bold;
  color: #00AEEF;
  padding: 0.5em 1em;
  border: 1px solid #00AEEF;
  border-radius: 6px;
  background-color: white;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-right: 1rem;
}

.file-input::file-selector-button:hover { background-color: #eef9ff; }

.form-card input::placeholder,
.form-card textarea::placeholder { color: #9ca3af; }

.form-card input[type="text"]:focus,
.form-card input[type="date"]:focus,
.form-card select:focus,
.form-card textarea:focus,
.form-card .file-input:focus {
  outline: none;
  border-color: #00AEEF;
  box-shadow: 0 0 0 4px rgba(0, 174, 239, 0.1);
  background-color: #fff;
}

.form-card select {
  -webkit-appearance: none; -moz-appearance: none; appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.7rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}

textarea { resize: vertical; min-height: 120px; }

.form-card input:-webkit-autofill,
.form-card input:-webkit-autofill:hover, 
.form-card input:-webkit-autofill:focus, 
.form-card input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 30px white inset !important;
  box-shadow: 0 0 0 30px white inset !important;
  -webkit-text-fill-color: #1f2937 !important;
}

.form-actions { margin-top: 2rem; text-align: center; }

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
  transition: all 0.3s;
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
}

.btn-submit:hover:not(:disabled) {
  background-color: #008fbf;
  transform: translateY(-3px);
  box-shadow: 0 4px 15px rgba(0, 174, 239, 0.2);
}

.btn-submit:disabled { background-color: #a0a0a0; cursor: not-allowed; }

.error-message, .success-message {
  margin-bottom: 1rem;
  padding: 0.8rem;
  border-radius: 6px;
  font-size: 0.9rem;
}

.error-message { color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; }
.success-message { color: #155724; background-color: #d4edda; border: 1px solid #c3e6cb; }

.spinner-sm {
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid #fff;
  border-radius: 50%;
  width: 16px; height: 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

@media (max-width: 600px) {
  .form-row { flex-direction: column; gap: 0; }
  .form-card { padding: 2rem 1.5rem; }
}
</style>