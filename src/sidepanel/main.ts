import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import routes from './router'
import '@/assets/styles/sidepanel.scss'

// 创建路由实例
const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 创建 Pinia 实例
const pinia = createPinia()

// 创建 Vue 应用
const app = createApp(App)

// 使用插件
app.use(pinia)
app.use(router)
app.use(ElementPlus)

// 挂载应用
app.mount('#app')

// 侧边栏特定的初始化逻辑
console.log('Riftwallet Side Panel initialized')

// 监听来自 background script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_SIDEPANEL') {
    // 处理打开侧边栏的逻辑
    console.log('Side panel opened')
  }
  
  if (message.type === 'NAVIGATE_TO') {
    // 处理导航逻辑
    router.push(message.path)
  }
})
