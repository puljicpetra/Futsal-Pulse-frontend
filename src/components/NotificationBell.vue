<template>
  <div class="notification-bell dropdown">
    <button 
      class="btn-bell" 
      type="button" 
      id="notificationDropdown" 
      data-bs-toggle="dropdown" 
      aria-expanded="false"
      @click="markAllAsRead"
    >
      <i class="fas fa-bell"></i>
      <span v-if="authStore.totalUnreadCount > 0" class="notification-count-bell">{{ authStore.totalUnreadCount }}</span>
    </button>
    <ul class="dropdown-menu dropdown-menu-end notification-dropdown-menu" aria-labelledby="notificationDropdown">
      <li class="dropdown-header">
        Notifications
      </li>
      <li v-if="authStore.allNotifications.length === 0">
        <span class="dropdown-item text-muted">No notifications yet.</span>
      </li>
      <li v-for="notif in authStore.allNotifications" :key="notif._id">
        <router-link :to="getNotificationLink(notif)" class="dropdown-item notification-item" :class="{ 'is-unread': !notif.isRead }">
          <div class="notification-icon">
            <i :class="getNotificationIcon(notif.type)"></i>
          </div>
          <div class="notification-content">
            <p class="mb-0">{{ notif.message }}</p>
            <small class="text-muted">{{ timeAgo(notif.createdAt) }}</small>
          </div>
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth';
import apiClient from '@/services/api';

const authStore = useAuthStore();

const getNotificationIcon = (type) => {
  switch (type) {
    case 'team_invitation':
      return 'fas fa-user-plus text-primary';
    case 'team_removal':
      return 'fas fa-user-times text-danger';
    default:
      return 'fas fa-info-circle text-secondary';
  }
};

const getNotificationLink = (notification) => {
    if (notification.type === 'team_invitation') {
        return '/invitations';
    }
    return notification.link || '#';
};

const timeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return "just now";
};

const markAllAsRead = async () => {
    const unreadIds = authStore.allNotifications
        .filter(n => !n.isRead)
        .map(n => n._id);

    if (unreadIds.length === 0) return;

    try {
        await apiClient.post('/api/notifications/mark-read', { notificationIds: unreadIds });
        authStore.fetchAllNotifications();
    } catch (err) {
        console.error("Failed to mark all notifications as read", err);
    }
};
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
</style>