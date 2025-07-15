<template>
  <div class="home">
    <video autoplay muted loop playsinline class="video-background">
      <source src="@/assets/futsal-pulse-video.mp4" type="video/mp4" />
    </video>

    <div class="overlay">
      <div class="text-overlay-bg">
        <div class="title-section">
          <h1 class="main-title">Welcome to</h1>
          <h2 class="highlight-title">FUTSAL PULSE</h2>
          <p class="subtitle">Explore top futsal destinations and join the excitement.</p>
          
          <div class="cta-buttons">
            <router-link to="/tournaments" class="btn btn-primary">
              Browse Tournaments
            </router-link>
            <router-link 
              to="/tournaments/create" 
              class="btn btn-secondary" 
              v-if="authStore.userRole === 'organizer'"
            >
              Create a Tournament
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth';
const authStore = useAuthStore();
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fugaz+One&display=swap');

.home {
  position: relative;
  width: 100%;
  height: calc(100vh - 60px);
  overflow: hidden;
}

.video-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 2;
}

.text-overlay-bg {
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  padding: 40px 50px;
  max-width: 90%;
  text-align: center;
}

.title-section {
  color: white;
}

.main-title {
  font-size: 2.5rem;
  margin: 0;
  color: #f0f0f0;
  text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.8);
  animation: fadeInDown 1s ease-out;
}

.highlight-title {
  font-family: 'Fugaz One', sans-serif;
  font-size: 5rem;
  margin: 10px 0;
  color: #00AEEF;
  text-transform: uppercase;
  -webkit-text-stroke: 1.5px #002D72;
  text-shadow: 3px 3px 10px rgba(0, 0, 0, 0.6);
  animation: fadeInDown 1s ease-out 0.2s;
  animation-fill-mode: both;
}

.subtitle {
  font-size: 1.2rem;
  margin-top: 10px;
  color: #e0e0e0;
  text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.8);
  animation: fadeInUp 1s ease-out 0.5s;
  animation-fill-mode: both;
}

.cta-buttons {
  margin-top: 2.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  animation: fadeInUp 1s ease-out 0.8s;
  animation-fill-mode: both;
}

.btn {
  padding: 12px 28px;
  border-radius: 50px;
  font-weight: bold;
  text-decoration: none;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  letter-spacing: 0.5px;
}

.btn-primary {
  background-color: #00AEEF;
  color: white;
  box-shadow: 0 4px 15px rgba(0, 174, 239, 0.3);
}

.btn-primary:hover {
  background-color: #0099cc;
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 174, 239, 0.5);
}

.btn-secondary {
  background-color: transparent;
  color: white;
  border: 2px solid white;
}

.btn-secondary:hover {
  background-color: white;
  color: #333;
  transform: translateY(-3px);
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>