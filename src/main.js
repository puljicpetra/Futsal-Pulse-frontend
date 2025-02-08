import { createApp } from 'vue';
import App from './App.vue';
import { createVuetify } from 'vuetify';
import router from './router';
import 'bootstrap/dist/css/bootstrap.css';
import './style.css';
import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';

const vuetify = createVuetify();

const app = createApp(App);

app.use(router);
app.use(vuetify);

app.mount('#app');
