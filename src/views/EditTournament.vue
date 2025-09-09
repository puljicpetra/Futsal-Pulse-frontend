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
                    <input
                        type="text"
                        id="name"
                        v-model.trim="tournament.name"
                        minlength="3"
                        maxlength="100"
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
                            required
                        />
                    </div>
                    <div class="form-group">
                        <label for="venue">Venue / Sports Hall</label>
                        <input type="text" id="venue" v-model.trim="tournament.location.venue" />
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="startDate">Start Date</label>
                        <input
                            type="date"
                            id="startDate"
                            v-model="formattedStartDate"
                            :max="formattedEndDate || null"
                            required
                        />
                    </div>
                    <div class="form-group">
                        <label for="endDate">End Date (optional)</label>
                        <input
                            type="date"
                            id="endDate"
                            v-model="formattedEndDate"
                            :min="formattedStartDate || null"
                        />
                    </div>
                </div>
                <p v-if="dateError" class="error-message" style="margin-top: -0.5rem">
                    {{ dateError }}
                </p>

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
                    <label for="description">Description</label>
                    <textarea
                        id="description"
                        v-model.trim="tournament.description"
                        rows="6"
                        maxlength="5000"
                    ></textarea>
                </div>

                <div class="form-group">
                    <label for="tournamentImage">Change Tournament Image (optional)</label>
                    <div
                        class="current-image-preview"
                        v-if="tournament.imageUrl && !newImagePreviewUrl"
                    >
                        <img :src="getImageUrl(tournament.imageUrl)" alt="Current image" />
                        <span>Current Image</span>
                    </div>
                    <div class="current-image-preview" v-if="newImagePreviewUrl">
                        <img :src="newImagePreviewUrl" alt="New image preview" />
                        <span>New Image Preview</span>
                    </div>
                    <input
                        type="file"
                        id="tournamentImage"
                        @change="handleFileChange"
                        class="file-input"
                        accept="image/png, image/jpeg, image/jpg, .png, .jpg, .jpeg"
                    />
                    <p v-if="fileError" class="error-message" style="margin-top: 0.5rem">
                        {{ fileError }}
                    </p>
                </div>

                <div class="form-actions">
                    <p v-if="updateError" class="error-message">{{ updateError }}</p>
                    <p v-if="updateSuccess" class="success-message">{{ updateSuccess }}</p>

                    <button
                        type="submit"
                        class="btn-submit"
                        :disabled="isSubmitting || !isFormValid"
                    >
                        <span v-if="isSubmitting" class="spinner-sm"></span>
                        {{ isSubmitting ? 'Saving...' : 'Save Changes' }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import apiClient from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { getImageUrl } from '@/utils/url.js'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const tournamentId = route.params.id

const tournament = ref({ location: {} })
const newImageFile = ref(null)
const newImagePreviewUrl = ref(null)

const isLoading = ref(true)
const error = ref('')
const isSubmitting = ref(false)
const updateError = ref('')
const updateSuccess = ref('')

const dateError = ref('')
const fileError = ref('')

const MAX_MB = 5
const DESC_MAX = 5000
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg']

const formatDateForInput = (dateString) => {
    if (!dateString) return ''
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return ''
    return d.toISOString().split('T')[0]
}

const formattedStartDate = computed({
    get: () => formatDateForInput(tournament.value.startDate),
    set: (newValue) => {
        tournament.value.startDate = newValue
    },
})
const formattedEndDate = computed({
    get: () => formatDateForInput(tournament.value.endDate),
    set: (newValue) => {
        tournament.value.endDate = newValue
    },
})

const toDate = (yyyy_mm_dd) => {
    if (!yyyy_mm_dd) return null
    const [y, m, d] = yyyy_mm_dd.split('-').map(Number)
    if (!y || !m || !d) return null
    return new Date(y, m - 1, d)
}

watch(
    () => [formattedStartDate.value, formattedEndDate.value],
    () => {
        dateError.value = ''
        const s = toDate(formattedStartDate.value)
        const e = toDate(formattedEndDate.value)
        if (s && e && e < s) dateError.value = 'End date cannot be before start date.'
    },
    { immediate: true }
)

const isFormValid = computed(() => {
    if (!tournament.value?.name?.trim()) return false
    if (!tournament.value?.location?.city?.trim()) return false
    if (!formattedStartDate.value) return false
    if (!tournament.value?.surface) return false
    if (tournament.value?.description && tournament.value.description.length > DESC_MAX)
        return false
    if (dateError.value) return false
    if (fileError.value) return false
    return true
})

const normalizeOrganizerId = (data) => {
    const raw = data?.organizer?._id || data?.organizer || data?.organizerInfo?._id || null
    return raw ? String(raw) : null
}

const fetchTournamentData = async () => {
    try {
        const response = await apiClient.get(`/api/tournaments/${tournamentId}`)

        const orgId = normalizeOrganizerId(response.data)
        if (orgId && orgId !== String(authStore.userId)) {
            error.value = 'You do not have permission to edit this tournament.'
            setTimeout(() => router.push(`/tournaments/${tournamentId}`), 2500)
            return
        }

        tournament.value = response.data
    } catch (err) {
        console.error('Failed to fetch tournament data:', err)
        error.value = 'Could not load tournament data. It may have been deleted.'
    } finally {
        isLoading.value = false
    }
}

const revokePreview = () => {
    if (newImagePreviewUrl.value) {
        URL.revokeObjectURL(newImagePreviewUrl.value)
        newImagePreviewUrl.value = null
    }
}

const handleFileChange = (event) => {
    fileError.value = ''
    const file = event.target.files?.[0]
    revokePreview()

    if (!file) {
        newImageFile.value = null
        return
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
        fileError.value = 'Only JPG and PNG files are allowed.'
        newImageFile.value = null
        event.target.value = ''
        return
    }
    const sizeMb = file.size / (1024 * 1024)
    if (sizeMb > MAX_MB) {
        fileError.value = `Image is too large (${sizeMb.toFixed(1)} MB). Max ${MAX_MB} MB.`
        newImageFile.value = null
        event.target.value = ''
        return
    }

    newImageFile.value = file
    newImagePreviewUrl.value = URL.createObjectURL(file)
}

onBeforeUnmount(() => revokePreview())

const submitUpdate = async () => {
    if (isSubmitting.value) return
    if (!isFormValid.value) return

    if (tournament.value.description && tournament.value.description.length > DESC_MAX) {
        updateError.value = `Description is too long (max ${DESC_MAX} characters).`
        return
    }

    isSubmitting.value = true
    updateError.value = ''
    updateSuccess.value = ''

    const formData = new FormData()
    formData.append('name', tournament.value.name.trim())
    formData.append(
        'location',
        JSON.stringify({
            city: (tournament.value.location.city || '').trim(),
            venue: (tournament.value.location.venue || '').trim(),
        })
    )
    formData.append('startDate', formattedStartDate.value)
    if (formattedEndDate.value) formData.append('endDate', formattedEndDate.value)
    formData.append('surface', tournament.value.surface)
    if (typeof tournament.value.description === 'string') {
        formData.append('description', tournament.value.description.trim())
    }

    if (newImageFile.value) {
        formData.append('tournamentImage', newImageFile.value)
    }

    try {
        const response = await apiClient.put(`/api/tournaments/${tournamentId}`, formData)
        updateSuccess.value = 'Tournament updated successfully!'
        tournament.value = response.data
        newImageFile.value = null
        revokePreview()
        setTimeout(() => {
            updateSuccess.value = ''
        }, 3000)
    } catch (err) {
        if (err.response?.data) {
            if (Array.isArray(err.response.data.errors)) {
                updateError.value = err.response.data.errors.map((e) => e.msg).join(' ')
            } else if (err.response.data.message) {
                updateError.value = err.response.data.message
            } else {
                updateError.value = 'An unknown error occurred while saving.'
            }
        } else {
            updateError.value = 'Failed to update tournament. Please try again.'
        }
    } finally {
        isSubmitting.value = false
    }
}

onMounted(fetchTournamentData)
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
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
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
    color: #00aeef;
}

.form-header {
    text-align: center;
    margin-bottom: 2.5rem;
}

.form-header .fa-edit {
    font-size: 2.5rem;
    color: #00aeef;
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

input[type='text'],
input[type='date'],
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
    color: #00aeef;
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
    border-color: #00aeef;
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

.error-message,
.success-message {
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

.loading-state,
.error-state {
    text-align: center;
    padding: 4rem;
}

.spinner,
.spinner-sm {
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-top-color: #00aeef;
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
