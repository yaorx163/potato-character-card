// ═══════════════════════════════════════════════════════════════
// main.ts
// ═══════════════════════════════════════════════════════════════
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

// 导入全局样式
import './styles/dark-fantasy.scss';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.mount('#app');
