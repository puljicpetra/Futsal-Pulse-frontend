import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

// --- BOOTSTRAP ---
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// --- VUETIFY ---
import { createVuetify } from 'vuetify';
import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';


import './style.css';

const vuetify = createVuetify({
});

const app = createApp(App);

app.use(router);
app.use(vuetify);

app.mount('#app');