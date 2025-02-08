<template>
  <div class="home">
    <div class="background-image"></div>

    <div class="futsal-title-container">
      <h1 class="futsal-title">FUTSAL</h1>
      <h1 class="futsal-title pulse-title">PULSE</h1>
    </div>

    <v-card class="grid-card">
      <div class="grid-title-container">
        <h2 class="grid-title">Najpopularnije lokacije</h2>
      </div>

      <v-container fluid>
        <v-row dense>
          <v-col
            v-for="card in cards"
            :key="card.title"
            :cols="card.flex"
          >
            <v-card>
              <v-img
                :src="card.src"
                class="align-end"
                gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
                height="200px"
                cover
              >
                <v-card-title class="text-white">{{ card.title }}</v-card-title>
              </v-img>

              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="medium-emphasis" icon="mdi-heart" size="small"></v-btn>
                <v-btn color="medium-emphasis" icon="mdi-bookmark" size="small"></v-btn>
                <v-btn color="medium-emphasis" icon="mdi-share-variant" size="small"></v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const cards = ref([
  { title: 'Zagreb', src: 'https://i.natgeofe.com/n/a11e9ead-955f-4a4e-977c-d1b2f104ee75/zagrebgettyimages-1144074611hr_3x2.jpg', flex: 12 },
  { title: 'Split', src: 'https://travelwandergrow.com/wp-content/uploads/2019/10/Split-Header-Image-2-scaled.jpeg', flex: 6 },
  { title: 'Pula', src: 'https://visitteo.com/wp-content/uploads/2023/08/nas02.jpg', flex: 6 },
]);
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fugaz+One&display=swap');

.home {
  width: 100vw;
  height: 100vh;
  position: relative;
  display: flex;
  justify-content: space-between;
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

.futsal-title-container {
  position: absolute;
  left: 40px;
  bottom: 80px; 
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.futsal-title {
  font-family: 'Fugaz One', serif;
  font-size: 5rem;
  margin: 0 0 20px 0;
  line-height: 1;
  text-transform: uppercase;
  font-weight: bold;
  color: #000;
}

.pulse-title {
  margin-top: 0;
}

.grid-card {
  position: absolute;
  right: 40px;
  top: 45%;
  transform: translateY(-50%);
  width: 500px;
  z-index: 2;
  margin-bottom: 40px;
}

.grid-title-container {
  padding: 20px;
  text-align: center;
}

.grid-title {
  font-family: 'Fugaz One', serif;
  font-size: 2rem;
  margin: 0;
  text-transform: uppercase;
  color: #000;
}
</style>
