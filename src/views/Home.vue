<template>
  <div class="home">
    <div class="background-image"></div>

    <div class="content">
      <h1>Welcome to Futsal Pulse</h1>
    </div>
  </div>
</template>

<style scoped>
.home {
  width: 100vw;
  height: 100vh;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden; 
}

.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('@/assets/FutsalHome.jpg') no-repeat center center;
  background-size: cover;
  background-attachment: fixed;
  opacity: 0.4;
  z-index: 1;
}

.content {
  position: relative;
  z-index: 2; 
  text-align: center;
  color: #000;
}
</style>