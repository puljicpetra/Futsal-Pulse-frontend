<template>
    <section class="reviews-card">
        <header class="reviews-header">
            <h3><i class="fas fa-star"></i> Reviews</h3>

            <div class="stats" v-if="statsLoaded">
                <StarRating :model-value="stats.average || 0" :readonly="true" size="sm" />
                <span class="avg">{{ stats.average?.toFixed(1) ?? '0.0' }}</span>
                <span class="count">({{ stats.count }} reviews)</span>
            </div>
        </header>

        <div class="my-review" v-if="isLoggedIn">
            <div class="form-row">
                <label>Your rating</label>
                <StarRating v-model="myRating" :max="5" />
            </div>
            <div class="form-row">
                <label>Your comment <small class="muted">(optional)</small></label>
                <textarea
                    v-model="myComment"
                    rows="3"
                    maxlength="1000"
                    placeholder="Share your experience..."
                />
            </div>
            <div class="actions">
                <button class="btn primary" :disabled="isSaving || !myRating" @click="save">
                    <span v-if="isSaving" class="spinner-sm"></span>
                    <span v-else>Save review</span>
                </button>
                <button
                    v-if="myExistingId"
                    class="btn subtle"
                    :disabled="isSaving || isDeleting"
                    @click="remove(myExistingId)"
                    title="Delete your review"
                >
                    Delete
                </button>
                <span v-if="saveError" class="error">{{ saveError }}</span>
                <span v-if="saveOk" class="ok">Saved.</span>
            </div>
        </div>

        <div v-else class="login-hint">
            <i class="fas fa-info-circle"></i>
            <span>Log in to leave a review.</span>
        </div>

        <hr class="sep" />

        <ul class="review-list" v-if="items.length">
            <li v-for="r in items" :key="idOf(r)">
                <div class="avatar">
                    <img
                        v-if="r.author?.avatar && !r.__imgErr"
                        :src="avatarUrl(r)"
                        alt=""
                        @error="onImgError(r, $event)"
                    />
                    <div v-else class="placeholder">
                        <i class="fas fa-user"></i>
                    </div>
                </div>

                <div class="content">
                    <div class="meta">
                        <span class="author">{{ r.author?.name || 'User' }}</span>
                        <StarRating :model-value="r.rating" :readonly="true" size="sm" />
                        <span class="time">{{ prettyDate(r.updatedAt || r.createdAt) }}</span>

                        <button
                            v-if="canDelete(r)"
                            class="icon-btn tiny danger"
                            title="Delete review"
                            @click="remove(idOf(r))"
                        >
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>

                    <p v-if="r.comment" class="comment">{{ r.comment }}</p>
                </div>
            </li>
        </ul>

        <p v-else class="muted">No reviews yet. Be the first to write one!</p>

        <div class="load-more" v-if="hasMore">
            <button class="btn" :disabled="isLoading" @click="load(page + 1)">
                <span v-if="isLoading" class="spinner-sm"></span>
                <span v-else>Load more</span>
            </button>
        </div>
    </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import apiClient from '@/services/api'
import StarRating from './StarRating.vue'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
    tournamentId: { type: String, required: true },
    isOwner: { type: Boolean, default: false },
})

const auth = useAuthStore?.() || {}
const meId = computed(() => auth.user?._id || auth.user?.id || auth.userId || null)
const isLoggedIn = computed(() => !!(auth.token || localStorage.getItem('token')))

const items = ref([])
const page = ref(1)
const limit = 10
const total = ref(0)
const stats = ref({ average: 0, count: 0 })
const isLoading = ref(false)
const statsLoaded = computed(() => stats.value && typeof stats.value.count === 'number')

const myRating = ref(0)
const myComment = ref('')
const myExistingId = ref(null)
const isSaving = ref(false)
const isDeleting = ref(false)
const saveError = ref('')
const saveOk = ref(false)

const idOf = (obj) => (typeof obj === 'object' ? obj._id || obj.id || obj.$oid : obj)
const hasMore = computed(() => items.value.length < total.value)

// ---- DEBUG helpers for avatar URL ----
const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '')
const normalizePath = (p) => {
    if (!p) return ''
    let s = String(p).trim()
    // Windows backslashes -> forward slashes
    s = s.replace(/\\/g, '/')
    // Ako dobijemo apsolutnu lokalnu putanju, odreži sve prije uploads/
    s = s.replace(/^.*(?=\/uploads\/)/, '')
    // Ako i dalje ne sadrži uploads, vrati original (možda je već full URL)
    return s || String(p)
}
const avatarUrl = (r) => {
    const raw = r?.author?.avatar
    const norm = normalizePath(raw)
    let url = norm
    if (!/^https?:\/\//i.test(norm)) {
        url = `${API_BASE}/${norm.replace(/^\//, '')}`
    }
    console.debug('[reviews] avatar build', {
        reviewId: idOf(r),
        raw,
        normalized: norm,
        finalUrl: url,
    })
    return url
}
const onImgError = (r, e) => {
    r.__imgErr = true
    console.warn('[reviews] avatar image error', {
        reviewId: idOf(r),
        src: e?.target?.src,
        author: r?.author,
    })
}
// -------------------------------------

function prettyDate(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    const locale = navigator.language || undefined
    return d.toLocaleString(locale, { year: 'numeric', month: 'short', day: 'numeric' })
}

function canDelete(r) {
    const mine = meId.value && (r.user_id === meId.value || r.author?._id === meId.value)
    return !!(props.isOwner || mine)
}

async function load(p = 1) {
    if (!props.tournamentId) return
    isLoading.value = true
    try {
        const { data } = await apiClient.get(
            `/api/tournaments/${props.tournamentId}/reviews?page=${p}&limit=${limit}`
        )
        const incoming = data.items || []
        // DEBUG cijeli payload
        console.debug('[reviews] load page', { page: p, count: incoming.length, data: incoming })

        if (p === 1) items.value = incoming
        else items.value = [...items.value, ...incoming]

        total.value = data.total ?? data.review_count ?? (items.value?.length || 0)
        stats.value = {
            average: data.avg_rating ?? data.stats?.average ?? 0,
            count: data.review_count ?? data.stats?.count ?? total.value,
        }

        // ispiši avatar info po stavci
        items.value.forEach((r) => {
            const raw = r?.author?.avatar
            console.debug('[reviews] item author/avatar', {
                reviewId: idOf(r),
                author: r.author,
                rawAvatar: raw,
                normalized: normalizePath(raw),
                finalUrl: raw ? avatarUrl(r) : null,
            })
        })

        if (meId.value) {
            const mine = items.value.find(
                (r) =>
                    (r.user_id && String(r.user_id) === String(meId.value)) ||
                    (r.author?._id && String(r.author._id) === String(meId.value))
            )
            if (mine) {
                myExistingId.value = idOf(mine)
                myRating.value = mine.rating || 0
                myComment.value = mine.comment || ''
            }
        }

        page.value = p
    } catch (e) {
        console.error('load reviews failed', e)
    } finally {
        isLoading.value = false
    }
}

async function save() {
    if (!props.tournamentId || !myRating.value) return
    isSaving.value = true
    saveError.value = ''
    saveOk.value = false
    try {
        await apiClient.post(`/api/tournaments/${props.tournamentId}/reviews`, {
            rating: myRating.value,
            comment: myComment.value || '',
        })
        saveOk.value = true
        await load(1)
    } catch (e) {
        console.error('save review failed', e)
        saveError.value = e.response?.data?.message || 'Failed to save review.'
    } finally {
        isSaving.value = false
        setTimeout(() => (saveOk.value = false), 1500)
    }
}

async function remove(reviewId) {
    if (!reviewId || !confirm('Delete this review?')) return
    isDeleting.value = true
    try {
        await apiClient.delete(`/api/reviews/${reviewId}`)
        if (myExistingId.value && String(myExistingId.value) === String(reviewId)) {
            myExistingId.value = null
            myRating.value = 0
            myComment.value = ''
        }
        await load(1)
    } catch (e) {
        console.error('delete review failed', e)
        alert(e.response?.data?.message || 'Failed to delete review.')
    } finally {
        isDeleting.value = false
    }
}

onMounted(() => {
    load(1)
})
</script>

<style scoped>
/* (nepromijenjeni stilovi) */
.reviews-card {
    background: #fff;
    border: 1px solid #eef1f3;
    border-radius: 12px;
    padding: 1rem;
}
.reviews-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    border-bottom: 1px solid #f0f2f4;
    padding-bottom: 0.5rem;
    margin-bottom: 0.75rem;
}
.reviews-header h3 {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.stats {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: #374151;
}
.stats .avg {
    font-weight: 700;
}
.stats .count {
    color: #6b7280;
}
.my-review {
    background: #fafbfc;
    border: 1px solid #eef1f3;
    border-radius: 10px;
    padding: 0.75rem;
}
.form-row {
    display: grid;
    gap: 0.35rem;
    margin-bottom: 0.6rem;
}
.form-row label {
    font-weight: 600;
    color: #374151;
    font-size: 0.95rem;
}
textarea {
    width: 100%;
    border: 1px solid #dcdcdc;
    border-radius: 8px;
    padding: 0.6rem 0.7rem;
    resize: vertical;
    min-height: 70px;
}
.muted {
    color: #6b7280;
}
.actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.btn {
    border: 1px solid #dcdcdc;
    background: #fff;
    color: #111;
    border-radius: 8px;
    padding: 0.5rem 0.8rem;
    cursor: pointer;
}
.btn.primary {
    background: #00aeef;
    color: #fff;
    border-color: #00aeef;
}
.btn.primary:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}
.btn.subtle {
    background: #f5f6f7;
}
.spinner-sm {
    border: 2px solid rgba(255, 255, 255, 0.35);
    border-top: 2px solid #fff;
    border-radius: 50%;
    width: 14px;
    height: 14px;
    animation: spin 1s linear infinite;
    display: inline-block;
    vertical-align: middle;
}
@keyframes spin {
    0% {
        transform: rotate(0);
    }
    100% {
        transform: rotate(360deg);
    }
}
.sep {
    margin: 0.9rem 0;
    border: 0;
    border-top: 1px solid #eef1f3;
}
.review-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.9rem;
}
.review-list li {
    display: grid;
    grid-template-columns: 42px 1fr;
    gap: 0.7rem;
}
.avatar {
    width: 42px;
    height: 42px;
    border-radius: 999px;
    overflow: hidden;
    background: #f3f4f6;
    display: grid;
    place-items: center;
}
.avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.placeholder {
    color: #9ca3af;
}
.content .meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.content .author {
    font-weight: 700;
    color: #111827;
}
.content .time {
    color: #6b7280;
    font-size: 0.9rem;
    margin-left: auto;
}
.icon-btn.tiny {
    width: 26px;
    height: 26px;
    border-radius: 6px;
    background: #fdebed;
    border: 1px solid #f1d2d6;
    color: #c82333;
    display: grid;
    place-items: center;
    margin-left: 0.35rem;
}
.comment {
    margin: 0.25rem 0 0;
    color: #1f2937;
}
.login-hint {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #6b7280;
}
.load-more {
    margin-top: 0.75rem;
    text-align: center;
}
</style>
