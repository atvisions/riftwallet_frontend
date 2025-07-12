<template>
  <ResponsiveLayout
    title="Discover"
    :show-header="true"
    :show-footer="true"
    :mode="mode"
    :scrollable="true"
  >
    <!-- 自定义头部 -->
    <template #header>
      <TopHeader :mode="mode" />
    </template>

    <!-- 主要内容 -->
    <div class="discover-content">
      <!-- 分类标签 -->
      <div class="category-tabs">
        <button 
          v-for="category in categories" 
          :key="category.id"
          class="category-btn"
          :class="{ active: selectedCategory === category.id }"
          @click="selectedCategory = category.id"
        >
          {{ category.label }}
        </button>
      </div>

      <!-- DApps 网格 -->
      <div class="dapps-grid">
        <div 
          v-for="dapp in filteredDapps" 
          :key="dapp.id"
          class="dapp-card"
          @click="openDapp(dapp)"
        >
          <div class="dapp-logo">
            <i :class="dapp.icon"></i>
          </div>
          <div class="dapp-info">
            <h3 class="dapp-name">{{ dapp.name }}</h3>
            <p class="dapp-description">{{ dapp.description }}</p>
            <div class="dapp-stats">
              <span class="stat">
                <i class="ri-user-line"></i>
                {{ dapp.users }}
              </span>
              <span class="stat">
                <i class="ri-star-line"></i>
                {{ dapp.rating }}
              </span>
            </div>
          </div>
          <div class="dapp-category">{{ dapp.category }}</div>
        </div>
      </div>

      <!-- 开发中提示 -->
      <div class="coming-soon">
        <i class="ri-compass-line"></i>
        <h3>DApp Browser Coming Soon</h3>
        <p>Discover and interact with decentralized applications directly from your wallet.</p>
      </div>
    </div>

    <!-- 底部导航 -->
    <template #footer>
      <BottomNavigation />
    </template>
  </ResponsiveLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ResponsiveLayout from '../components/ResponsiveLayout.vue'
import TopHeader from '../components/TopHeader.vue'
import BottomNavigation from '../components/BottomNavigation.vue'

// 接收 mode 属性
const props = defineProps<{
  mode?: 'popup' | 'sidepanel'
}>()

// 自动检测模式：检查 URL 路径来判断是否在侧边栏环境中
const isInSidePanel = window.location.href.includes('sidepanel') ||
                     window.location.pathname.includes('sidepanel')
const mode = props.mode || (isInSidePanel ? 'sidepanel' : 'popup')

// 分类
const categories = [
  { id: 'all', label: 'All' },
  { id: 'defi', label: 'DeFi' },
  { id: 'nft', label: 'NFT' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'social', label: 'Social' }
]

// DApps 数据
const dapps = ref([
  {
    id: 1,
    name: 'Uniswap',
    description: 'Decentralized trading protocol',
    category: 'DeFi',
    icon: 'ri-exchange-line',
    users: '2.1M',
    rating: '4.8',
    url: 'https://app.uniswap.org'
  },
  {
    id: 2,
    name: 'OpenSea',
    description: 'NFT marketplace',
    category: 'NFT',
    icon: 'ri-image-line',
    users: '1.5M',
    rating: '4.6',
    url: 'https://opensea.io'
  },
  {
    id: 3,
    name: 'Compound',
    description: 'Lending and borrowing',
    category: 'DeFi',
    icon: 'ri-bank-line',
    users: '890K',
    rating: '4.7',
    url: 'https://compound.finance'
  },
  {
    id: 4,
    name: 'Axie Infinity',
    description: 'Play-to-earn game',
    category: 'Gaming',
    icon: 'ri-gamepad-line',
    users: '2.8M',
    rating: '4.5',
    url: 'https://axieinfinity.com'
  },
  {
    id: 5,
    name: 'Mirror',
    description: 'Decentralized publishing',
    category: 'Social',
    icon: 'ri-article-line',
    users: '120K',
    rating: '4.4',
    url: 'https://mirror.xyz'
  },
  {
    id: 6,
    name: 'Aave',
    description: 'Liquidity protocol',
    category: 'DeFi',
    icon: 'ri-funds-line',
    users: '650K',
    rating: '4.9',
    url: 'https://aave.com'
  }
])

// 响应式数据
const selectedCategory = ref('all')

// 计算属性
const filteredDapps = computed(() => {
  if (selectedCategory.value === 'all') {
    return dapps.value
  }
  return dapps.value.filter(dapp => 
    dapp.category.toLowerCase() === selectedCategory.value
  )
})

// 头部相关方法已移至 TopHeader 组件中

const openDapp = (dapp: any) => {
  console.log('Opening DApp:', dapp.name)
  // 在实际应用中，这里会打开 DApp
}
</script>

<style scoped>
/* 头部样式已移至 TopHeader 组件中 */

.discover-content {
  padding: 12px;
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.category-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.category-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.category-btn.active {
  background: #6366f1;
  border-color: #6366f1;
  color: white;
}

.category-btn:hover:not(.active) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: #f1f5f9;
}

.dapps-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-bottom: 24px;
}

.dapp-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.dapp-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.dapp-logo {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.dapp-logo i {
  font-size: 24px;
  color: white;
}

.dapp-info {
  margin-bottom: 12px;
}

.dapp-name {
  font-size: 16px;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0 0 4px 0;
}

.dapp-description {
  font-size: 14px;
  color: #94a3b8;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.dapp-stats {
  display: flex;
  gap: 16px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #64748b;
}

.stat i {
  font-size: 14px;
}

.dapp-category {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
}

.coming-soon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 40px 20px;
  color: #94a3b8;
  text-align: center;
  min-height: 400px;
}

.coming-soon i {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.coming-soon h3 {
  font-size: 18px;
  margin: 0 0 8px 0;
  color: #f1f5f9;
}

.coming-soon p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
}

/* 响应式设计 */
@media (min-width: 480px) {
  .dapps-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
