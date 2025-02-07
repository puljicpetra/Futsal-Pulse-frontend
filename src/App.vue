<script setup>
</script>

<template>
  <div class="fullscreen-background">
    <img src="/src/assets/FutsalHome.jpg" alt="Futsal Home" class="fullscreen-image" />
  </div>
</template>

<style scoped>
.fullscreen-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
}

.fullscreen-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.4;
}
</style>
