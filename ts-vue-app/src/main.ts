import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// 创建Vue应用实例
const app = createApp(App)

// 挂载到DOM
app.mount('#app')

// 导出app实例（可选，用于测试或模块联邦等）
export { app }
