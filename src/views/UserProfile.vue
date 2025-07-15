<template>
  <div class="user-profile-container">
    <div v-if="isLoading" class="loading-message">Loading profile...</div>
    <div v-if="fetchError" class="error-message">{{ fetchError }}</div>

    <div v-if="user && !isLoading" class="profile-card">
      <h2>My Profile</h2>

      <div v-if="!isEditing" class="profile-view">
        <div class="profile-field">
          <strong>Username:</strong> {{ user.username }}
        </div>
        <div class="profile-field">
          <strong>Email:</strong> {{ user.email }}
        </div>
        <div class="profile-field">
          <strong>Role:</strong> {{ formattedRole }}
        </div>
        <div class="profile-field">
          <strong>Full Name:</strong> {{ user.full_name || 'Not set' }}
        </div>
        <div class="profile-field">
          <strong>Bio:</strong> {{ user.bio || 'Not set' }}
        </div>
        <div class="profile-field">
          <strong>Contact Phone:</strong> {{ user.contact_phone || 'Not set' }}
        </div>
        <button @click="enableEditMode" class="btn btn-primary mt-3">Edit Profile</button>
      </div>

      <form v-if="isEditing" @submit.prevent="saveProfile" class="profile-edit-form">
        <div class="form-group mb-3">
          <label for="fullName">Full Name:</label>
          <input type="text" id="fullName" v-model="editableUser.full_name" class="form-control" />
        </div>
        <div class="form-group mb-3">
          <label for="bio">Bio:</label>
          <textarea id="bio" v-model="editableUser.bio" class="form-control" rows="3"></textarea>
        </div>
        <div class="form-group mb-3">
          <label for="contactPhone">Contact Phone:</label>
          <input type="tel" id="contactPhone" v-model="editableUser.contact_phone" class="form-control" />
        </div>
        
        <div class="form-actions">
          <button type="submit" :disabled="isSaving" class="btn btn-success me-2">
            {{ isSaving ? 'Saving...' : 'Save Changes' }}
          </button>
          <button type="button" @click="cancelEdit" class="btn btn-secondary">Cancel</button>
        </div>
        <p v-if="saveError" class="error-message mt-2">{{ saveError }}</p>
        <p v-if="saveSuccess" class="success-message mt-2">{{ saveSuccess }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import apiClient from '@/services/api';

const user = ref(null);
const editableUser = ref({});
const isLoading = ref(true);
const fetchError = ref('');
const isEditing = ref(false);
const isSaving = ref(false);
const saveError = ref('');
const saveSuccess = ref('');

const formattedRole = computed(() => {
  if (user.value && user.value.role) {
    return user.value.role.charAt(0).toUpperCase() + user.value.role.slice(1);
  }
  return '';
});


const fetchUserProfile = async () => {
  isLoading.value = true;
  fetchError.value = '';
  
  try {
    const response = await apiClient.get('/api/users/me');
    user.value = response.data;
  } catch (err) {
    console.error('Failed to fetch user profile:', err);
    if (err.response && err.response.status !== 401) {
      fetchError.value = err.response.data.message || 'Failed to load profile data.';
    } else if (!err.response) {
      fetchError.value = 'An error occurred. Please check your connection.';
    }
  } finally {
    isLoading.value = false;
  }
};

const enableEditMode = () => {
  isEditing.value = true;
  editableUser.value = { ...user.value }; 
  saveError.value = '';
  saveSuccess.value = '';
};

const cancelEdit = () => {
  isEditing.value = false;
  saveError.value = '';
  saveSuccess.value = '';
};

const saveProfile = async () => {
  isSaving.value = true;
  saveError.value = '';
  saveSuccess.value = '';
  
  try {
    const dataToUpdate = {
      full_name: editableUser.value.full_name,
      bio: editableUser.value.bio,
      contact_phone: editableUser.value.contact_phone,
    };

    const response = await apiClient.put('/api/users/me', dataToUpdate);

    user.value = response.data;
    isEditing.value = false;
    saveSuccess.value = 'Profile updated successfully!';
    setTimeout(() => saveSuccess.value = '', 3000);

  } catch (err) {
    console.error('Failed to save profile:', err);
    if (err.response && err.response.data) {
        if (Array.isArray(err.response.data.errors)) {
             saveError.value = err.response.data.errors.map(e => e.msg).join(' ');
        } else if (err.response.data.message) {
            saveError.value = err.response.data.message;
        } else {
            saveError.value = 'An unknown error occurred while saving.';
        }
    } else {
      saveError.value = 'Failed to save profile. Please try again.';
    }
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => {
  fetchUserProfile();
});
</script>

<style scoped>
.user-profile-container {
  max-width: 700px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.profile-card h2 {
  text-align: center;
  color: #333;
  margin-bottom: 1.5rem;
}

.profile-view .profile-field {
  margin-bottom: 1rem;
  font-size: 1.1rem;
  color: #555;
}
.profile-view .profile-field strong {
  color: #333;
  margin-right: 0.5em;
  display: inline-block;
  min-width: 120px;
}

.profile-edit-form .form-group label {
  font-weight: bold;
  color: #333;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.loading-message, .error-message, .success-message {
  text-align: center;
  padding: 1rem;
  margin: 1rem auto;
  border-radius: 4px;
  max-width: 90%;
}
.loading-message {
  color: #007bff;
  background-color: #e7f3ff;
  border: 1px solid #b3d7ff;
}
.error-message {
  color: #721c24;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
}
.success-message {
  color: #155724;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
}
</style>