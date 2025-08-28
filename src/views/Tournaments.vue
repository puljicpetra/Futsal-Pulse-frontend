<template>
    <div class="tournaments-page">
        <div class="header-container">
            <div class="header-content-wrapper">
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
            <div class="filters-container">
                <div class="filter-group">
                    <label for="city-filter"><i class="fas fa-city"></i> Filter by City</label>
                    <input
                        type="text"
                        id="city-filter"
                        v-model="filters.city"
                        @keyup.enter="applyFilters"
                        placeholder="e.g., Zagreb"
                    />
                </div>
                <div class="filter-group">
                    <label for="surface-filter"
                        ><i class="fas fa-layer-group"></i> Filter by Surface</label
                    >
                    <select id="surface-filter" v-model="filters.surface" @change="applyFilters">
                        <option value="">All Surfaces</option>
                        <option value="parket">Parquet</option>
                        <option value="beton">Concrete</option>
                        <option value="trava">Grass</option>
                        <option value="pijesak">Sand</option>
                        <option value="tepih">Carpet</option>
                    </select>
                </div>
                <div class="filter-actions">
                    <button @click="applyFilters" class="btn-filter">
                        <i class="fas fa-search"></i> Apply
                    </button>
                    <button @click="clearFilters" class="btn-clear">Clear</button>
                </div>
            </div>

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
                <div
                    v-for="tournament in tournaments"
                    :key="tournament._id"
                    class="tournament-card"
                >
                    <router-link :to="`/tournaments/${tournament._id}`" class="card-image-link">
                        <div class="card-image-container">
                            <img
                                v-if="tournament.imageUrl"
                                :src="getImageUrl(tournament.imageUrl)"
                                alt="Tournament Image"
                                class="card-image"
                            />
                            <div v-else class="card-image-placeholder">
                                <i class="fas fa-futbol"></i>
                            </div>
                        </div>
                    </router-link>

                    <div class="card-header">
                        <h3>{{ tournament.name }}</h3>
                        <span
                            class="surface-badge"
                            :class="`surface-${normalizeSurface(tournament.surface)}`"
                        >
                            {{ tournament.surface }}
                        </span>
                    </div>
                    <div class="card-body">
                        <div class="card-info">
                            <p>
                                <i class="fas fa-map-marker-alt"></i> {{ tournament.location.city }}
                            </p>
                            <p>
                                <i class="fas fa-calendar-alt"></i>
                                {{ formatDate(tournament.startDate) }}
                            </p>
                        </div>
                        <router-link :to="`/tournaments/${tournament._id}`" class="btn-details">
                            View Details
                        </router-link>
                    </div>
                </div>
            </div>

            <div v-else class="empty-state">
                <div class="empty-state-icon"><i class="fas fa-filter"></i></div>
                <h2>No Tournaments Found</h2>
                <p>There are no tournaments matching your current filters. Try clearing them.</p>
                <button @click="clearFilters" class="btn-clear-main">Clear Filters</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import apiClient from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { getImageUrl } from '@/utils/url.js'

const authStore = useAuthStore()
const tournaments = ref([])
const isLoading = ref(true)
const error = ref('')

const filters = ref({
    city: '',
    surface: '',
})

const normalizeSurface = (s = '') => s.toString().toLowerCase().trim().replace(/\s+/g, '-')

const fetchTournaments = async () => {
    isLoading.value = true
    error.value = ''
    try {
        const params = new URLSearchParams()
        if (filters.value.city) params.append('city', filters.value.city.trim())
        if (filters.value.surface) params.append('surface', filters.value.surface)

        const qs = params.toString()
        const { data } = await apiClient.get(`/api/tournaments${qs ? `?${qs}` : ''}`)
        tournaments.value = data
    } catch (err) {
        error.value = err.response?.data?.message || 'Failed to fetch tournaments.'
    } finally {
        isLoading.value = false
    }
}

const applyFilters = () => {
    fetchTournaments()
}

const clearFilters = () => {
    filters.value.city = ''
    filters.value.surface = ''
    fetchTournaments()
}

const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const options = { year: 'numeric', month: 'long', day: 'numeric' }
    const locale = navigator.language || undefined
    return new Date(dateString).toLocaleDateString(locale, options)
}

onMounted(() => {
    fetchTournaments()
})
</script>

<style scoped>
.tournaments-page {
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
    background-color: #00aeef;
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

.filters-container {
    background-color: white;
    padding: 1.5rem;
    border-radius: 12px;
    margin: 0 auto 2rem auto;
    max-width: 1000px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: flex-end;
    gap: 1rem;
    flex-wrap: wrap;
}

.filter-group {
    flex: 1;
    min-width: 200px;
}

.filter-group label {
    font-weight: 600;
    color: #374151;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
    display: block;
}

.filter-group label i {
    margin-right: 0.5rem;
    color: #9ca3af;
}

.filter-group input,
.filter-group select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    box-sizing: border-box;
    font-size: 1rem;
    background-color: #ffffff;
    color: #1f2937;
}

.filter-group select {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 0.5rem center;
    background-repeat: no-repeat;
    background-size: 1.5em 1.5em;
    padding-right: 2.5rem;
}

.filter-actions {
    display: flex;
    gap: 0.5rem;
}

.btn-filter,
.btn-clear {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
}

.btn-filter {
    background-color: #374151;
    color: white;
}

.btn-filter:hover {
    background-color: #1f2937;
}

.btn-clear {
    background-color: #e5e7eb;
    color: #374151;
}

.btn-clear:hover {
    background-color: #d1d5db;
}

.tournaments-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
}

@media (max-width: 1024px) {
    .tournaments-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 768px) {
    .tournaments-grid {
        grid-template-columns: 1fr;
    }
    .header-content-wrapper {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
    }
}

.tournament-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.07);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: transform 0.3s, box-shadow 0.3s;
}

.tournament-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.card-image-link {
    display: block;
    text-decoration: none;
}
.card-image-container {
    width: 100%;
    height: 180px;
    background-color: #e5e7eb;
    overflow: hidden;
    position: relative;
}
.card-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}
.tournament-card:hover .card-image {
    transform: scale(1.05);
}
.card-image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #9ca3af;
    font-size: 4rem;
}

.card-header {
    background-color: #374151;
    color: white;
    padding: 1rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-radius: 0;
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
    color: #00aeef;
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

.surface-badge {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.25rem 0.6rem;
    border-radius: 12px;
    text-transform: capitalize;
    margin-left: 0.5rem;
}

.surface-parket {
    background-color: #fef3c7;
    color: #92400e;
}
.surface-beton {
    background-color: #e5e7eb;
    color: #1f2937;
}
.surface-trava {
    background-color: #d1fae5;
    color: #065f46;
}
.surface-pijesak {
    background-color: #fed7aa;
    color: #9a3412;
}
.surface-tepih {
    background-color: #fbcfe8;
    color: #9d174d;
}

.loading-state,
.error-state,
.empty-state {
    text-align: center;
    padding: 4rem 1rem;
    color: #6b7280;
}

.error-state h2,
.empty-state h2 {
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

.empty-state .create-link,
.btn-clear-main {
    font-weight: 600;
    color: #00aeef;
    text-decoration: none;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
}

.empty-state .create-link:hover,
.btn-clear-main:hover {
    text-decoration: underline;
}

.spinner {
    border: 4px solid #f3f4f6;
    border-top: 4px solid #00aeef;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
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
