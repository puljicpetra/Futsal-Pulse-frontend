<template>
  <section class="schedule-section card">
    <div class="card-header-flex">
      <h2><i class="fas fa-clipboard-list"></i> Match Schedule</h2>
      <button v-if="isOwner" class="btn-add-match" @click="emit('add-match')">
          <i class="fas fa-plus"></i> Add Match
      </button>
    </div>
    
    <div v-if="isLoading" class="loading-state-small">Loading matches...</div>
    <div v-else-if="matches.length === 0" class="text-muted">No matches scheduled yet.</div>
    
    <ul v-else class="matches-list">
        <li v-for="match in matches" :key="match._id" class="match-item">
            <div class="match-info">
                <span class="team-name">{{ match.teamA.name || 'TBD' }}</span>
                <span class="match-score">{{ match.score.teamA ?? '-' }} : {{ match.score.teamB ?? '-' }}</span>
                <span class="team-name">{{ match.teamB.name || 'TBD' }}</span>
            </div>
            <div class="match-meta">
                <span>{{ formatMatchDate(match.matchDate) }}</span>
                <span v-if="match.status === 'finished'" class="status-badge finished">Final</span>
                <span v-else-if="match.group" class="group-badge">{{ match.group }}</span>
            </div>

            <div v-if="match.events && match.events.length > 0" class="event-timeline">
                <div v-for="event in sortedEvents(match.events)" :key="event._id" class="event-item">
                    <i :class="getEventIcon(event.type)"></i>
                    <span>{{ event.minute }}'</span>
                    <span>{{ getPlayerName(event.playerId) }}</span> 
                </div>
            </div>
            
            <div v-if="isOwner" class="owner-actions">
                <button @click.stop="toggleMenu(match._id)" class="btn-menu" title="Actions"><i class="fas fa-ellipsis-v"></i></button>
                <div v-if="openMenuId === match._id" class="actions-dropdown">
                    <a v-if="match.status !== 'finished'" @click="openEventsModal(match)"><i class="fas fa-stopwatch"></i> Manage Events</a>
                    <a v-if="match.status !== 'finished'" @click="finishMatch(match._id)"><i class="fas fa-flag-checkered"></i> Finish Match</a>
                    <a @click="deleteMatch(match._id)" class="text-danger"><i class="fas fa-trash-alt"></i> Delete Match</a>
                </div>
            </div>
        </li>
    </ul>
  </section>

  <div v-if="showEventsModal" class="modal-overlay" @click.self="closeEventsModal">
    <div class="modal-content large">
        <h3>Manage Match Events</h3>
        <p v-if="selectedMatch">{{ selectedMatch.teamA.name }} vs {{ selectedMatch.teamB.name }}</p>
        
        <form @submit.prevent="handleAddEvent" class="event-form">
            <select v-model="newEvent.teamId" required>
                <option :value="null" disabled>Select Team</option>
                <option :value="selectedMatch.teamA._id">{{ selectedMatch.teamA.name }}</option>
                <option :value="selectedMatch.teamB._id">{{ selectedMatch.teamB.name }}</option>
            </select>
            <select v-model="newEvent.playerId" required :disabled="!newEvent.teamId">
                <option :value="null" disabled>Select Player</option>
                <option v-for="player in availablePlayers" :key="player._id" :value="player._id">{{ player.name }}</option>
            </select>
            <select v-model="newEvent.type" required>
                <option value="goal">Goal</option>
                <option value="yellow-card">Yellow Card</option>
                <option value="red-card">Red Card</option>
            </select>
            <input type="number" v-model.number="newEvent.minute" placeholder="Min" min="1" required />
            <button type="submit" class="btn-submit small" :disabled="isSubmittingEvent">Add</button>
        </form>

        <div class="existing-events-list">
            <div v-if="!sortedEvents(selectedMatch.events).length" class="text-muted">No events recorded.</div>
            <div v-else v-for="event in sortedEvents(selectedMatch.events)" :key="event._id" class="existing-event-item">
                <span><i :class="getEventIcon(event.type)"></i> {{ event.minute }}' - {{ getPlayerName(event.playerId) }} ({{ getTeamName(event.teamId) }})</span>
                <button @click="handleDeleteEvent(selectedMatch._id, event._id)" class="btn-delete-event" title="Delete Event"><i class="fas fa-times"></i></button>
            </div>
        </div>

        <div class="modal-actions"><button type="button" @click="closeEventsModal" class="btn-cancel">Done</button></div>
        <p v-if="eventsModalError" class="error-message">{{ eventsModalError }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import apiClient from '@/services/api';

const props = defineProps({
  tournamentId: { type: String, required: true },
  isOwner: { type: Boolean, default: false }
});
const emit = defineEmits(['feedback', 'add-match']);

const matches = ref([]);
const isLoading = ref(true);
const openMenuId = ref(null);
const allPlayers = ref(new Map());

const showEventsModal = ref(false);
const selectedMatch = ref(null);
const isSubmittingEvent = ref(false);
const eventsModalError = ref('');
const newEvent = ref({ type: 'goal', teamId: null, playerId: null, minute: '' });

const fetchMatches = async () => {
  isLoading.value = true;
  allPlayers.value.clear();
  try {
    const response = await apiClient.get(`/api/matches/tournament/${props.tournamentId}`);
    const fetchedMatches = response.data;
    
    for (const match of fetchedMatches) {
      if (match.teamA && match.teamA.players) {
        match.teamA.players.forEach(p => allPlayers.value.set(p._id, p));
      }
      if (match.teamB && match.teamB.players) {
        match.teamB.players.forEach(p => allPlayers.value.set(p._id, p));
      }
    }
    
    matches.value = fetchedMatches;
  } catch (err) {
    console.error("Failed to fetch matches:", err);
    emit('feedback', { type: 'error', text: 'Could not load match schedule.' });
  } finally {
    isLoading.value = false;
  }
};

const availablePlayers = computed(() => {
    if (!newEvent.value.teamId || !selectedMatch.value) return [];
    
    return newEvent.value.teamId === selectedMatch.value.teamA._id 
        ? selectedMatch.value.teamA.players
        : selectedMatch.value.teamB.players;
});

const formatMatchDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false };
  return new Date(dateString).toLocaleString('en-US', options);
};
const sortedEvents = (events) => {
    if (!events) return [];
    return [...events].sort((a, b) => a.minute - b.minute);
};
const getEventIcon = (type) => ({
    'goal': 'fas fa-futbol',
    'yellow-card': 'fas fa-square yellow-card',
    'red-card': 'fas fa-square red-card'
}[type] || 'fas fa-question');

const getPlayerName = (playerId) => allPlayers.value.get(playerId)?.name || 'Unknown'; 
const getTeamName = (teamId) => {
    if (!selectedMatch.value) return '';
    if (selectedMatch.value.teamA?._id === teamId) return selectedMatch.value.teamA.name;
    if (selectedMatch.value.teamB?._id === teamId) return selectedMatch.value.teamB.name;
    return 'Unknown';
};

const closeMenu = () => { openMenuId.value = null; };
const toggleMenu = (matchId) => { openMenuId.value = openMenuId.value === matchId ? null : matchId; };
const closeEventsModal = () => { showEventsModal.value = false; selectedMatch.value = null; };

const openEventsModal = (match) => {
    closeMenu();
    selectedMatch.value = match;
    eventsModalError.value = '';
    newEvent.value = { type: 'goal', teamId: null, playerId: null, minute: '' };
    showEventsModal.value = true;
};

const handleAddEvent = async () => {
    isSubmittingEvent.value = true;
    eventsModalError.value = '';
    try {
        const response = await apiClient.post(`/api/matches/${selectedMatch.value._id}/events`, newEvent.value);
        const updatedMatch = response.data.match;
        
        updatedMatch.teamA.players.forEach(p => allPlayers.value.set(p._id, p));
        updatedMatch.teamB.players.forEach(p => allPlayers.value.set(p._id, p));
        
        const index = matches.value.findIndex(m => m._id === updatedMatch._id);
        if (index !== -1) {
            matches.value[index] = updatedMatch;
        }
        selectedMatch.value = updatedMatch;
        newEvent.value = { type: 'goal', teamId: null, playerId: null, minute: '' };
    } catch (err) {
        eventsModalError.value = err.response?.data?.message || 'Failed to add event.';
    } finally {
        isSubmittingEvent.value = false;
    }
};

const handleDeleteEvent = async (matchId, eventId) => {
    try {
        const response = await apiClient.delete(`/api/matches/${matchId}/events/${eventId}`);
        const updatedMatch = response.data.match;
        
        const index = matches.value.findIndex(m => m._id === updatedMatch._id);
        if (index !== -1) {
            matches.value[index] = updatedMatch;
        }
        selectedMatch.value = updatedMatch;
    } catch (err) {
        eventsModalError.value = err.response?.data?.message || 'Failed to delete event.';
    }
};

const deleteMatch = async (matchId) => {
  closeMenu();
  if (window.confirm('Are you sure you want to delete this match?')) {
    try {
      await apiClient.delete(`/api/matches/${matchId}`);
      matches.value = matches.value.filter(m => m._id !== matchId);
      emit('feedback', { type: 'success', text: 'Match deleted successfully.' });
    } catch (err) {
      console.error("Failed to delete match:", err);
      emit('feedback', { type: 'error', text: err.response?.data?.message || 'Could not delete match.' });
    }
  }
};

const finishMatch = async (matchId) => {
    closeMenu();
    if (!confirm("Are you sure you want to finalize this match? The result cannot be edited after this.")) {
      return;
    }
    try {
        const response = await apiClient.patch(`/api/matches/${matchId}/finish`);
        const index = matches.value.findIndex(m => m._id === matchId);
        if (index !== -1) {
            matches.value[index] = response.data.match; 
        }
        emit('feedback', { type: 'success', text: 'Match marked as finished!' });
    } catch (err) {
        console.error("Failed to finish match:", err);
        emit('feedback', { type: 'error', text: err.response?.data?.message || 'Could not finish match.' });
    }
};

onMounted(() => {
  fetchMatches();
  window.addEventListener('click', closeMenu);
});

onUnmounted(() => {
  window.removeEventListener('click', closeMenu);
});

defineExpose({ fetchMatches });
</script>

<style scoped>
.card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.card-header-flex h2 {
  margin: 0;
  padding: 0;
  font-size: 1.5rem;
  color: #333;
  display: flex;
  align-items: center;
  border: none;
}

.card-header-flex h2 i {
  margin-right: 0.75rem;
  color: #00AEEF;
}

.btn-add-match {
  background-color: #198754;
  color: white;
  padding: 0.4rem 0.8rem;
  font-size: 0.9rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.loading-state-small, .text-muted {
  text-align: center;
  color: #888;
  padding: 1rem;
  font-style: italic;
}

.matches-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.match-item {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
}

.match-item:last-child {
  border-bottom: none;
}

.match-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.match-info .team-name {
  flex: 1;
  text-align: center;
}

.match-score {
  font-size: 1.25rem;
  padding: 0 1rem;
}

.match-meta {
  font-size: 0.85rem;
  color: #888;
  text-align: center;
  margin-top: 0.5rem;
}

.group-badge {
  display: inline-block;
  background-color: #e9ecef;
  color: #495057;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  margin-left: 0.5rem;
}

.status-badge.finished {
  background-color: #e2e3e5;
  color: #495057;
  font-weight: bold;
  font-size: 0.8rem;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  margin-left: 0.5rem;
}

.owner-actions {
  position: absolute;
  top: 50%;
  right: 1rem;
  transform: translateY(-50%);
}

.btn-menu {
  background: none;
  border: none;
  color: #aaa;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.5rem;
  border-radius: 50%;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.btn-menu:hover {
  background-color: #f0f0f0;
  color: #333;
}

.actions-dropdown {
  position: absolute;
  top: calc(100% + 5px);
  right: 0;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  border: 1px solid #eee;
  padding: 0.5rem 0;
  z-index: 10;
  width: 180px;
  overflow: hidden;
}

.actions-dropdown a {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  color: #333;
  font-size: 0.9rem;
  white-space: nowrap;
  text-decoration: none;
}

.actions-dropdown a:hover {
  background-color: #f5f5f5;
}

.actions-dropdown a i {
  width: 16px;
  text-align: center;
  color: #888;
}

.actions-dropdown a.text-danger {
  color: #dc3545;
}

.actions-dropdown a.text-danger:hover {
  background-color: #fee2e2;
  color: #b91c1c;
}

.actions-dropdown a.text-danger i {
  color: #dc3545;
}

.error-message {
  color: #dc3545;
  text-align: center;
  margin-top: 1rem;
}

.event-timeline {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1.5rem;
  padding: 0.75rem 0 0.25rem;
  font-size: 0.8rem;
  color: #666;
}

.event-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.event-item .fa-futbol {
  color: #28a745;
}

.event-item .yellow-card {
  color: #ffc107;
}

.event-item .red-card {
  color: #dc3545;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
}

.modal-content.large {
  max-width: 600px;
}

.modal-content h3 {
  margin-top: 0;
}

.modal-content p {
  color: #666;
  text-align: center;
  margin-bottom: 2rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn-cancel,
.btn-submit {
  padding: 0.7rem 1.2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
}

.btn-cancel {
  background-color: #e9ecef;
  color: #343a40;
  border: 1px solid #ced4da;
}

.btn-cancel:hover {
  background-color: #dee2e6;
}

.btn-submit {
  background-color: #28a745;
  color: white;
}

.btn-submit.small {
  padding: 0.5rem 1rem;
  font-weight: normal;
}

.btn-submit:disabled {
  background-color: #a0a0a0;
}

.event-form {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 80px auto;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.event-form select,
.event-form input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 6px;
}

.event-form input {
  text-align: center;
}

.existing-events-list {
  margin-top: 2rem;
  max-height: 250px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 8px;
}

.existing-event-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f0f0f0;
}

.existing-event-item:last-child {
  border-bottom: none;
}

.btn-delete-event {
  background: none;
  border: none;
  color: #aaa;
  cursor: pointer;
  padding: 0.25rem;
}

.btn-delete-event:hover {
  color: #dc3545;
}
</style>