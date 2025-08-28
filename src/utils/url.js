import apiClient from '@/services/api'

const ABSOLUTE_RE = /^(https?:)?\/\//i

export function getImageUrl(relativePath) {
    if (!relativePath) return null

    if (
        ABSOLUTE_RE.test(relativePath) ||
        relativePath.startsWith('data:') ||
        relativePath.startsWith('blob:')
    ) {
        return relativePath
    }

    const base = (apiClient.defaults.baseURL || '').replace(/\/+$/, '')
    const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`
    return `${base}${path}`
}
