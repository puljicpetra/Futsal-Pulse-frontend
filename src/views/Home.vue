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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fugaz+One&display=swap');

.home {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.video-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  object-fit: cover;
  z-index: 0;
}

.overlay {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.text-overlay-bg {
  background: rgba(0, 0, 0, 0.5);
  padding: 40px;
  border-radius: 12px;
  max-width: 90%;
  text-align: center;
}

.title-section {
  color: white;
}

.main-title {
  font-size: 2.5rem;
  margin: 0;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.6);
}

.highlight-title {
  font-family: 'Fugaz One', sans-serif;
  font-size: 4rem;
  margin: 10px 0;
  color: #00AEEF;
  text-transform: uppercase;
  -webkit-text-stroke: 1px #002D72;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.4);
}

.subtitle {
  font-size: 1.1rem;
  margin-top: 10px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}
</style>
