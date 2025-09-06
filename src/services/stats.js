import apiClient from '@/services/api'

export async function searchPlayers(q, { page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    params.set('page', page)
    params.set('limit', limit)
    const { data } = await apiClient.get(`/api/players/search?${params.toString()}`)
    return data
}

export async function getPlayerStats(playerId) {
    if (!playerId) throw new Error('playerId is required')
    const { data } = await apiClient.get(`/api/players/${playerId}/stats`)
    return data
}

export async function getPlayerMatchLog(playerId, { limit = 10 } = {}) {
    if (!playerId) throw new Error('playerId is required')
    const params = new URLSearchParams()
    params.set('limit', String(limit))
    const { data } = await apiClient.get(`/api/players/${playerId}/matches?${params.toString()}`)
    return data
}
