<script setup>
import { ref, onMounted } from 'vue';

const message = ref('');

onMounted(async () => {
  try {
    const res = await fetch(import.meta.env.VITE_BACKEND_BASE_URL + '/');
    if (res.ok) {
      message.value = 'Backend radi!';
    } else {
      message.value = 'Greška!';
    }
  } catch (error) {
    console.error('Greška:', error);
    message.value = 'Greška!';
  }
});
</script>

<template>
  <p style="text-align: center; font-size: 1.2em; color: #333; margin-top: 20px;">{{ message }}</p>
</template>

<style scoped>
p {
  font-weight: bold;
}
</style>
