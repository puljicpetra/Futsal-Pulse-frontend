<template>
    <div class="player-search-page">
        <div class="page-header">
            <h1>Player Directory</h1>
        </div>

        <div class="search-bar">
            <i class="fas fa-search"></i>
            <input
                name="q"
                v-model="q"
                type="search"
                placeholder="Search players by name…"
                @keyup.enter="performSearch(true)"
            />
            <button v-if="q" class="btn-clear" @click="clearQuery" aria-label="Clear">
                <i class="fas fa-times"></i>
            </button>
        </div>

        <div v-if="hintVisible" class="hint">
            Start typing to find players and view their stats.
        </div>

        <div v-if="isLoading" class="loading-state">
            <div class="spinner"></div>
        </div>

        <div v-else-if="error" class="error-state">
            <p>{{ error }}</p>
        </div>

        <div v-else class="results">
            <div v-if="items.length === 0 && q" class="empty">No players match “{{ q }}”.</div>

            <ul class="grid">
                <li
                    v-for="p in items"
                    :key="normalizeId(p._id)"
                    class="card player-card"
                    @click="goToPlayer(p._id)"
                >
                    <div class="card-header">
                        <img
                            v-if="p.avatarUrl || p.avatar_url"
                            :src="p.avatarUrl || p.avatar_url"
                            alt=""
                            class="avatar"
                            loading="lazy"
                        />
                        <div class="title">
                            <h3>{{ p.full_name || p.name || 'Unknown Player' }}</h3>
                            <p class="muted" v-if="p.teamName || p.team?.name">
                                Team: {{ p.teamName || p.team?.name }}
                            </p>
                        </div>
                    </div>

                    <button class="btn-open" @click.stop="goToPlayer(p._id)">
                        View profile <i class="fas fa-chevron-right"></i>
                    </button>
                </li>
            </ul>

            <div v-if="pages > 1" class="pagination">
                <button class="btn" :disabled="page <= 1" @click="changePage(page - 1)">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span>Page {{ page }} / {{ pages }}</span>
                <button class="btn" :disabled="page >= pages" @click="changePage(page + 1)">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { searchPlayers } from '@/services/stats'

const router = useRouter()
const route = useRoute()

const q = ref('')
const isLoading = ref(false)
const error = ref('')
const items = ref([])
const page = ref(1)
const limit = ref(20)
const total = ref(0)

const MIN_CHARS = 2

const pages = computed(() => Math.max(1, Math.ceil((total.value || 0) / limit.value)))
const hintVisible = computed(() => !q.value && items.value.length === 0 && !isLoading.value)

const normalizeId = (id) => {
    if (!id) return null
    if (typeof id === 'string') return id
    if (typeof id === 'object' && typeof id.$oid === 'string') return id.$oid
    return String(id)
}

const performSearch = async (resetPage = false) => {
    if (resetPage) page.value = 1

    const query = (q.value || '').trim()
    if (query.length < MIN_CHARS) {
        items.value = []
        total.value = 0
        error.value = ''
        return
    }

    isLoading.value = true
    error.value = ''

    try {
        const data = await searchPlayers(query, { page: page.value, limit: limit.value })
        if (Array.isArray(data)) {
            items.value = data
            total.value = data.length
        } else {
            items.value = data.items || []
            total.value = Number(data.total ?? items.value.length)
        }
    } catch (e) {
        console.error('searchPlayers failed:', e)
        error.value = e?.response?.data?.message || 'Failed to search players.'
    } finally {
        isLoading.value = false
    }
}

let t = null
watch(
    () => q.value,
    () => {
        window.clearTimeout(t)
        syncRouteQuery()
        t = window.setTimeout(() => performSearch(true), 350)
    }
)

const changePage = (p) => {
    if (p < 1 || p > pages.value) return
    page.value = p
    syncRouteQuery()
    performSearch(false)
}

const clearQuery = () => {
    q.value = ''
    items.value = []
    total.value = 0
    page.value = 1
    error.value = ''
    syncRouteQuery()
}

const goToPlayer = (id) => {
    router.push({ name: 'PlayerProfileStats', params: { id: String(normalizeId(id)) } })
}

const syncRouteQuery = () => {
    const query = {}
    if ((q.value || '').trim()) query.q = q.value.trim()
    if (page.value > 1) query.page = String(page.value)
    router.replace({ query })
}

onMounted(() => {
    const qParam = typeof route.query.q === 'string' ? route.query.q : ''
    const pageParam = Number(route.query.page || 1)

    q.value = qParam
    page.value = Number.isFinite(pageParam) && pageParam >= 1 ? pageParam : 1

    if ((q.value || '').trim().length >= MIN_CHARS) {
        performSearch(false)
    } else {
        items.value = []
        total.value = 0
        error.value = ''
    }
})

onBeforeUnmount(() => {
    window.clearTimeout(t)
})
</script>

<style scoped>
.player-search-page {
    max-width: 960px;
    margin: 2rem auto;
    padding: 1rem;
}
.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
}
.page-header h1 {
    margin: 0;
}

.search-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #fff;
    border: 1px solid #e9ecef;
    border-radius: 10px;
    padding: 0.6rem 0.8rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}
.search-bar i {
    color: #94a3b8;
}
.search-bar input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 1rem;
}
.btn-clear {
    background: transparent;
    border: none;
    cursor: pointer;
    color: #94a3b8;
}
.hint {
    color: #6b7280;
    margin: 0.8rem 0 1.2rem;
}

.loading-state {
    display: grid;
    place-items: center;
    padding: 2rem;
}
.spinner {
    width: 26px;
    height: 26px;
    border: 3px solid #e9ecef;
    border-top-color: #0d6efd;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}
@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.error-state {
    padding: 1rem;
    color: #b42318;
    background: #fde7e9;
    border-radius: 10px;
}
.results {
    margin-top: 1rem;
}
.empty {
    color: #6b7280;
    padding: 1rem;
}

.grid {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1rem;
}
.card {
    background: #fff;
    border: 1px solid #edf2f7;
    border-radius: 12px;
    padding: 0.9rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
    cursor: pointer;
    transition: transform 0.1s ease, box-shadow 0.2s ease;
}
.card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}

.player-card .card-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}
.player-card .avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    object-fit: cover;
    background: #f1f3f5;
}
.player-card .title h3 {
    margin: 0;
    font-size: 1.05rem;
    color: #111827;
}
.player-card .title .muted {
    margin: 0;
    color: #6b7280;
    font-size: 0.85rem;
}

.btn-open {
    width: 100%;
    border: 1px solid #e5e7eb;
    background: #f8fafc;
    color: #111827;
    border-radius: 8px;
    padding: 0.45rem 0.6rem;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
}
.btn-open i {
    font-size: 0.9em;
}

.pagination {
    margin: 1rem 0 0.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
}
.pagination .btn {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 0.35rem 0.6rem;
    cursor: pointer;
}
.pagination .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>
