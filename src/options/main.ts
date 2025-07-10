import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import '@/assets/styles/main.scss'

// 创建应用
const app = createApp(App)

// 使用插件
app.use(createPinia())
app.use(ElementPlus)

// 挂载应用
app.mount('#app')
