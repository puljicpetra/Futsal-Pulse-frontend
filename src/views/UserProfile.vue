<template>
    <div class="user-profile-container">
        <div v-if="isLoading" class="loading-message">Loading...</div>
        <div v-if="fetchError" class="error-message">{{ fetchError }}</div>

        <div v-if="user && !isLoading" class="profile-card">
            <div class="profile-header">
                <div class="avatar-container">
                    <img
                        v-if="user.profile_image_url"
                        :src="getImageUrl(user.profile_image_url)"
                        alt="Profile Avatar"
                        class="profile-avatar"
                    />
                    <div v-else class="profile-avatar-placeholder" aria-label="No profile image">
                        <i class="fas fa-user"></i>
                    </div>

                    <input
                        ref="fileInput"
                        type="file"
                        @change="onFileSelected"
                        style="display: none"
                        accept="image/png, image/jpeg"
                    />

                    <button
                        class="btn-change-avatar"
                        :disabled="isUploadingAvatar"
                        @click="triggerFileDialog"
                        :title="isUploadingAvatar ? 'Uploading…' : 'Change profile picture'"
                        aria-label="Change profile picture"
                    >
                        <span v-if="isUploadingAvatar" class="spinner-xs" />
                        <i v-else class="fas fa-camera"></i>
                    </button>
                </div>
                <h2>My Profile</h2>
            </div>

            <div v-if="!isEditing" class="profile-view">
                <div class="profile-field"><strong>Username:</strong> {{ user.username }}</div>
                <div class="profile-field"><strong>Email:</strong> {{ user.email }}</div>
                <div class="profile-field"><strong>Role:</strong> {{ formattedRole }}</div>
                <div class="profile-field">
                    <strong>Full Name:</strong> {{ user.full_name || 'Not set' }}
                </div>
                <div class="profile-field"><strong>Bio:</strong> {{ user.bio || 'Not set' }}</div>
                <div class="profile-field">
                    <strong>Contact Phone:</strong> {{ user.contact_phone || 'Not set' }}
                </div>
                <button @click="enableEditMode" class="btn btn-primary mt-4">
                    Edit Profile Info
                </button>
            </div>

            <form v-if="isEditing" @submit.prevent="saveProfile" class="profile-edit-form">
                <div class="form-group mb-3">
                    <label for="fullName">Full Name:</label>
                    <input
                        type="text"
                        id="fullName"
                        v-model="editableUser.full_name"
                        class="form-control"
                    />
                </div>
                <div class="form-group mb-3">
                    <label for="bio">Bio:</label>
                    <textarea
                        id="bio"
                        v-model="editableUser.bio"
                        class="form-control"
                        rows="3"
                    ></textarea>
                </div>
                <div class="form-group mb-3">
                    <label for="contactPhone">Contact Phone:</label>
                    <input
                        type="tel"
                        id="contactPhone"
                        v-model="editableUser.contact_phone"
                        class="form-control"
                    />
                </div>

                <div class="form-actions">
                    <button type="submit" :disabled="isSaving" class="btn btn-success me-2">
                        {{ isSaving ? 'Saving...' : 'Save Changes' }}
                    </button>
                    <button type="button" @click="cancelEdit" class="btn btn-secondary">
                        Cancel
                    </button>
                </div>
                <p v-if="saveError" class="error-message mt-2">{{ saveError }}</p>
                <p v-if="saveSuccess" class="success-message mt-2">{{ saveSuccess }}</p>
            </form>

            <p v-if="avatarError" class="error-message mt-2">{{ avatarError }}</p>
            <p v-if="avatarSuccess" class="success-message mt-2">{{ avatarSuccess }}</p>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import apiClient from '@/services/api'
import { getImageUrl } from '@/utils/url.js'

const user = ref(null)
const editableUser = ref({})
const isLoading = ref(true)
const fetchError = ref('')
const isEditing = ref(false)
const isSaving = ref(false)
const saveError = ref('')
const saveSuccess = ref('')

const fileInput = ref(null)
const isUploadingAvatar = ref(false)
const avatarError = ref('')
const avatarSuccess = ref('')

const MAX_AVATAR_MB = 3
const ALLOWED_TYPES = ['image/jpeg', 'image/png']

const formattedRole = computed(() => {
    if (user.value?.role) {
        return user.value.role.charAt(0).toUpperCase() + user.value.role.slice(1)
    }
    return ''
})

const fetchUserProfile = async () => {
    isLoading.value = true
    fetchError.value = ''
    try {
        const { data } = await apiClient.get('/api/users/me')
        user.value = data
    } catch (err) {
        console.error('Failed to fetch user profile:', err)
        if (err.response && err.response.status !== 401) {
            fetchError.value = err.response.data?.message || 'Failed to load profile data.'
        } else if (!err.response) {
            fetchError.value = 'An error occurred. Please check your connection.'
        }
    } finally {
        isLoading.value = false
    }
}

const enableEditMode = () => {
    isEditing.value = true
    editableUser.value = { ...user.value }
    saveError.value = ''
    saveSuccess.value = ''
}

const cancelEdit = () => {
    isEditing.value = false
    saveError.value = ''
    saveSuccess.value = ''
}

const saveProfile = async () => {
    isSaving.value = true
    saveError.value = ''
    saveSuccess.value = ''
    try {
        const dataToUpdate = {
            full_name: editableUser.value.full_name,
            bio: editableUser.value.bio,
            contact_phone: editableUser.value.contact_phone,
        }
        const { data } = await apiClient.put('/api/users/me', dataToUpdate)
        user.value = data
        isEditing.value = false
        saveSuccess.value = 'Profile updated successfully!'
        setTimeout(() => (saveSuccess.value = ''), 3000)
    } catch (err) {
        console.error('Failed to save profile:', err)
        if (err.response?.data) {
            if (Array.isArray(err.response.data.errors)) {
                saveError.value = err.response.data.errors.map((e) => e.msg).join(' ')
            } else if (err.response.data.message) {
                saveError.value = err.response.data.message
            } else {
                saveError.value = 'An unknown error occurred while saving.'
            }
        } else {
            saveError.value = 'Failed to save profile. Please try again.'
        }
    } finally {
        isSaving.value = false
    }
}

const triggerFileDialog = () => {
    fileInput.value?.click()
}

const onFileSelected = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    avatarError.value = ''
    avatarSuccess.value = ''
    if (!ALLOWED_TYPES.includes(file.type)) {
        avatarError.value = 'Please select a JPG or PNG image.'
        resetFileInput()
        return
    }
    const sizeMb = file.size / (1024 * 1024)
    if (sizeMb > MAX_AVATAR_MB) {
        avatarError.value = `Image is too large (max ${MAX_AVATAR_MB} MB).`
        resetFileInput()
        return
    }

    uploadProfileImage(file)
}

const resetFileInput = () => {
    if (fileInput.value) {
        fileInput.value.value = ''
    }
}

const uploadProfileImage = async (file) => {
    isUploadingAvatar.value = true
    avatarError.value = ''
    avatarSuccess.value = ''

    const formData = new FormData()
    formData.append('avatar', file)

    try {
        const { data } = await apiClient.post('/api/users/me/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        if (user.value) {
            user.value.profile_image_url = data.profile_image_url
        }
        avatarSuccess.value = 'Profile picture updated!'
        setTimeout(() => (avatarSuccess.value = ''), 3000)
    } catch (error) {
        console.error('Image upload failed:', error)
        avatarError.value =
            error.response?.data?.message || 'Failed to upload image. Please try again.'
        setTimeout(() => (avatarError.value = ''), 4000)
    } finally {
        isUploadingAvatar.value = false
        resetFileInput()
    }
}

onMounted(fetchUserProfile)
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

.profile-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 2rem;
}

.avatar-container {
    position: relative;
    margin-bottom: 1rem;
}

.profile-avatar,
.profile-avatar-placeholder {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    object-fit: cover;
    border: 4px solid #fff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.profile-avatar-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #e9ecef;
    color: #adb5bd;
    font-size: 50px;
}

.btn-change-avatar {
    position: absolute;
    bottom: 5px;
    right: 5px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: #007bff;
    color: white;
    border: 2px solid white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.2s;
    padding: 0;
}

.btn-change-avatar:hover {
    background-color: #0056b3;
}

.btn-change-avatar:disabled {
    opacity: 0.8;
    cursor: not-allowed;
}

.profile-card h2 {
    color: #333;
    margin: 0;
}

.profile-view .profile-field {
    margin-bottom: 1rem;
    font-size: 1.1rem;
    color: #555;
    border-bottom: 1px solid #eee;
    padding-bottom: 0.75rem;
}

.profile-view .profile-field:last-of-type {
    border-bottom: none;
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

.loading-message,
.error-message,
.success-message {
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

.spinner-xs {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.5);
    border-top: 2px solid #fff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}
</style>
