<template>
  <nav class="bottom-nav">
    <router-link
      v-for="item in navItems"
      :key="item.name"
      :to="item.path"
      class="nav-item"
      :class="{ active: isActive(item.path) }"
    >
      <i :class="item.icon"></i>
      <span>{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// 导航项配置
const navItems = [
  {
    name: 'home',
    path: '/',
    icon: 'ri-home-line',
    label: 'Home'
  },
  {
    name: 'markets',
    path: '/markets',
    icon: 'ri-line-chart-line',
    label: 'Markets'
  },
  {
    name: 'trade',
    path: '/trade',
    icon: 'ri-exchange-line',
    label: 'Trade'
  },
  {
    name: 'discover',
    path: '/discover',
    icon: 'ri-compass-line',
    label: 'Discover'
  },
  {
    name: 'wallet',
    path: '/settings',
    icon: 'ri-settings-line',
    label: 'Wallet'
  }
]

// 判断当前路由是否激活
const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}
</script>

<style scoped>
.bottom-nav {
  display: flex;
  background: rgba(15, 23, 42, 0.95);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  position: relative;
  z-index: 10;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 12px 8px;
  color: #64748b;
  text-decoration: none;
  transition: all 0.2s ease;
  font-size: 12px;
  font-weight: 500;
  min-height: 60px;
  position: relative;
}

.nav-item:hover {
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.05);
}

.nav-item.active {
  color: #6366f1;
  background: rgba(99, 102, 241, 0.1);
}

.nav-item.active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 32px;
  height: 3px;
  background: #6366f1;
  border-radius: 0 0 2px 2px;
}

.nav-item i {
  font-size: 20px;
  transition: all 0.2s ease;
}

.nav-item.active i {
  transform: scale(1.1);
}

.nav-item span {
  font-size: 11px;
  line-height: 1;
  white-space: nowrap;
}

/* 响应式设计 */
@media (max-width: 375px) {
  .nav-item {
    padding: 10px 6px;
    gap: 3px;
  }

  .nav-item i {
    font-size: 18px;
  }

  .nav-item span {
    font-size: 10px;
  }
}

/* 深色主题优化 */
@media (prefers-color-scheme: dark) {
  .bottom-nav {
    background: rgba(15, 23, 42, 0.98);
    border-top-color: rgba(255, 255, 255, 0.15);
  }
}

/* 毛玻璃效果增强 */
.bottom-nav::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    180deg,
    rgba(15, 23, 42, 0.8) 0%,
    rgba(15, 23, 42, 0.95) 100%
  );
  z-index: -1;
}

/* 激活状态的涟漪效果 */
.nav-item.active::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  background: rgba(99, 102, 241, 0.2);
  border-radius: 50%;
  z-index: -1;
  transition: all 0.3s ease;
}

/* 悬停效果 */
.nav-item:hover::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  z-index: -1;
  transition: all 0.3s ease;
}

.nav-item.active:hover::after {
  background: rgba(99, 102, 241, 0.3);
}
</style>
