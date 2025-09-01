<template>
    <div class="notification-bell dropdown" v-if="authStore.isLoggedIn">
        <button
            class="btn-bell"
            type="button"
            id="notificationDropdown"
            data-bs-toggle="dropdown"
            aria-expanded="false"
            @click="markAllAsRead"
        >
            <i class="fas fa-bell"></i>
            <span v-if="authStore.totalUnreadCount > 0" class="notification-count-bell">
                {{ authStore.totalUnreadCount }}
            </span>
        </button>

        <ul
            class="dropdown-menu dropdown-menu-end notification-dropdown-menu"
            aria-labelledby="notificationDropdown"
        >
            <li class="dropdown-header d-flex justify-content-between align-items-center">
                <span>Notifications</span>
                <button
                    v-if="authStore.allNotifications.length > 0"
                    @click.stop="clearAllNotifications"
                    class="btn-clear-all"
                >
                    Clear All
                </button>
            </li>

            <li v-if="authStore.allNotifications.length === 0">
                <span class="dropdown-item text-muted">No notifications yet.</span>
            </li>

            <li
                v-for="notif in authStore.allNotifications"
                :key="normalizeId(notif._id)"
                class="notification-item-wrapper"
            >
                <router-link
                    v-if="getNotificationLink(notif)"
                    :to="getNotificationLink(notif)"
                    class="dropdown-item notification-item"
                    :class="{ 'is-unread': !notif.isRead }"
                >
                    <div class="notification-icon">
                        <i :class="getNotificationIcon(notif.type)"></i>
                    </div>
                    <div class="notification-content">
                        <p class="mb-0">{{ notif.message }}</p>
                        <small class="text-muted">{{ timeAgo(notif.createdAt) }}</small>
                    </div>
                </router-link>

                <div
                    v-else
                    class="dropdown-item notification-item"
                    :class="{ 'is-unread': !notif.isRead }"
                >
                    <div class="notification-icon">
                        <i :class="getNotificationIcon(notif.type)"></i>
                    </div>
                    <div class="notification-content">
                        <p class="mb-0">{{ notif.message }}</p>
                        <small class="text-muted">{{ timeAgo(notif.createdAt) }}</small>
                    </div>
                </div>

                <button
                    @click.stop="deleteNotification(notif._id)"
                    class="btn-delete-single"
                    title="Dismiss"
                >
                    <i class="fas fa-times"></i>
                </button>
            </li>
        </ul>
    </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import apiClient from '@/services/api'

const authStore = useAuthStore()

const normalizeId = (id) => {
    if (!id) return null
    if (typeof id === 'string') return id
    if (typeof id === 'object' && typeof id.$oid === 'string') return id.$oid
    return String(id)
}

const getNotificationIcon = (type) => {
    switch (type) {
        case 'team_invitation':
            return 'fas fa-user-plus text-primary'
        case 'team_removal':
            return 'fas fa-user-times text-danger'
        case 'new_registration':
            return 'fas fa-clipboard-check text-success'
        case 'withdrawal_request':
            return 'fas fa-flag text-warning'
        case 'withdrawal_approved':
            return 'fas fa-flag-checkered text-info'
        case 'registration_update':
            return 'fas fa-info-circle text-info'
        case 'team_deleted':
            return 'fas fa-trash-alt text-danger'
        default:
            return 'fas fa-bell text-secondary'
    }
}

const getNotificationLink = (notification) => {
    if (notification.link && notification.link !== '#') return notification.link
    if (notification.type === 'team_invitation') return '/invitations'
    return null
}

const timeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now - date) / 1000)
    let interval = seconds / 31536000
    if (interval > 1) return Math.floor(interval) + ' years ago'
    interval = seconds / 2592000
    if (interval > 1) return Math.floor(interval) + ' months ago'
    interval = seconds / 86400
    if (interval > 1) return Math.floor(interval) + ' days ago'
    interval = seconds / 3600
    if (interval > 1) return Math.floor(interval) + ' hours ago'
    interval = seconds / 60
    if (interval > 1) return Math.floor(interval) + ' minutes ago'
    return 'just now'
}

const recomputeCounts = () => {
    const list = authStore.allNotifications
    authStore.totalUnreadCount = list.filter((n) => !n.isRead).length
    authStore.unreadInvitationCount = list.filter(
        (n) => n.type === 'team_invitation' && !n.isRead
    ).length
}

const markAllAsRead = async () => {
    if (!authStore.isLoggedIn) return
    const unread = authStore.allNotifications.filter((n) => !n.isRead)
    if (unread.length === 0) return

    const unreadIds = unread.map((n) => normalizeId(n._id)).filter(Boolean)

    try {
        authStore.allNotifications = authStore.allNotifications.map((n) => ({ ...n, isRead: true }))
        recomputeCounts()

        await apiClient.post('/api/notifications/mark-read', { notificationIds: unreadIds })
    } catch (err) {
        console.error('Failed to mark all notifications as read', err)
        await authStore.fetchAllNotifications()
    }
}

const deleteNotification = async (notificationId) => {
    const id = normalizeId(notificationId)
    if (!id) return

    const prev = authStore.allNotifications.slice()
    authStore.allNotifications = prev.filter((n) => normalizeId(n._id) !== id)
    recomputeCounts()

    try {
        await apiClient.delete(`/api/notifications/${id}`)
    } catch (err) {
        console.error('Failed to delete notification:', err)
        authStore.allNotifications = prev
        recomputeCounts()
    }
}

const clearAllNotifications = async () => {
    if (!authStore.isLoggedIn) return
    if (window.confirm('Are you sure you want to clear all notifications?')) {
        const prev = authStore.allNotifications.slice()
        authStore.allNotifications = []
        authStore.totalUnreadCount = 0
        authStore.unreadInvitationCount = 0

        try {
            await apiClient.delete('/api/notifications')
        } catch (err) {
            console.error('Failed to clear all notifications:', err)
            authStore.allNotifications = prev
            recomputeCounts()
        }
    }
}
</script>

<style scoped>
.notification-bell {
    margin-right: 1rem;
}
.btn-bell {
    position: relative;
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #333;
    cursor: pointer;
    padding: 0.5rem;
}
.notification-count-bell {
    position: absolute;
    top: 0;
    right: 0;
    background-color: #dc3545;
    color: white;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    font-size: 0.7rem;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #f8f9fa;
}
.notification-dropdown-menu {
    width: 350px;
    max-height: 400px;
    overflow-y: auto;
    padding-top: 0;
}
.dropdown-header {
    font-weight: bold;
    padding: 0.75rem 1rem;
    background-color: #f8f9fa;
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.btn-clear-all {
    background: none;
    border: none;
    color: #007bff;
    font-size: 0.8rem;
    cursor: pointer;
    padding: 0;
}
.btn-clear-all:hover {
    text-decoration: underline;
}

.notification-item-wrapper {
    position: relative;
    display: block;
}
.btn-delete-single {
    position: absolute;
    top: 5px;
    right: 5px;
    background: none;
    border: none;
    color: #aaa;
    cursor: pointer;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    font-size: 0.8rem;
    line-height: 20px;
    text-align: center;
    display: none;
    transition: color 0.2s;
}
.notification-item-wrapper:hover .btn-delete-single {
    display: block;
}
.btn-delete-single:hover {
    color: #333;
}

.notification-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #f0f0f0;
    white-space: normal;
}
.notification-item.is-unread {
    background-color: #eef9ff;
}
.notification-item:last-child {
    border-bottom: none;
}

.notification-icon {
    font-size: 1.25rem;
    width: 25px;
    text-align: center;
    margin-top: 0.25rem;
}
.notification-content p {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 500;
    color: #333;
}
.notification-content small {
    font-size: 0.8rem;
}
</style>
