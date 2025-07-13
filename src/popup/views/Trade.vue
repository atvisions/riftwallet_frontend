<template>
  <ResponsiveLayout
    title="Trade"
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
    <div class="trade-content">
      <!-- 交易类型选择 -->
      <div class="trade-types">
        <button 
          v-for="type in tradeTypes" 
          :key="type.id"
          class="trade-type-btn"
          :class="{ active: selectedType === type.id }"
          @click="selectedType = type.id"
        >
          <i :class="type.icon"></i>
          <span>{{ type.label }}</span>
        </button>
      </div>

      <!-- 交易表单 -->
      <div class="trade-form">
        <div class="form-section">
          <label class="form-label">From</label>
          <div class="token-selector">
            <div class="token-info">
              <div class="token-logo">E</div>
              <div class="token-details">
                <div class="token-name">Ethereum</div>
                <div class="token-balance">Balance: 1.2345 ETH</div>
              </div>
            </div>
            <button class="select-btn">
              <i class="ri-arrow-down-s-line"></i>
            </button>
          </div>
          <div class="amount-input">
            <input type="number" placeholder="0.0" v-model="fromAmount">
            <button class="max-btn">MAX</button>
          </div>
        </div>

        <div class="swap-icon">
          <button class="swap-btn" @click="swapTokens">
            <i class="ri-arrow-up-down-line"></i>
          </button>
        </div>

        <div class="form-section">
          <label class="form-label">To</label>
          <div class="token-selector">
            <div class="token-info">
              <div class="token-logo">U</div>
              <div class="token-details">
                <div class="token-name">USDC</div>
                <div class="token-balance">Balance: 1,234.56 USDC</div>
              </div>
            </div>
            <button class="select-btn">
              <i class="ri-arrow-down-s-line"></i>
            </button>
          </div>
          <div class="amount-input">
            <input type="number" placeholder="0.0" v-model="toAmount" readonly>
          </div>
        </div>

        <!-- 交易信息 -->
        <div class="trade-info">
          <div class="info-row">
            <span>Rate</span>
            <span>1 ETH = 2,580 USDC</span>
          </div>
          <div class="info-row">
            <span>Slippage</span>
            <span>0.5%</span>
          </div>
          <div class="info-row">
            <span>Network Fee</span>
            <span>~$12.50</span>
          </div>
        </div>

        <!-- 交易按钮 -->
        <button class="trade-btn" :disabled="!canTrade">
          {{ tradeButtonText }}
        </button>
      </div>

      <!-- 开发中提示 -->
      <div class="coming-soon">
        <i class="ri-exchange-line"></i>
        <h3>Trading Coming Soon</h3>
        <p>Decentralized trading features are under development.</p>
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

// 交易类型
const tradeTypes = [
  { id: 'swap', label: 'Swap', icon: 'ri-exchange-line' },
  { id: 'limit', label: 'Limit', icon: 'ri-price-tag-line' },
  { id: 'dca', label: 'DCA', icon: 'ri-calendar-line' }
]

// 响应式数据
const selectedType = ref('swap')
const fromAmount = ref('')
const toAmount = ref('')

// 计算属性
const canTrade = computed(() => {
  return fromAmount.value && parseFloat(fromAmount.value) > 0
})

const tradeButtonText = computed(() => {
  if (!fromAmount.value) return 'Enter Amount'
  if (!canTrade.value) return 'Invalid Amount'
  return 'Swap'
})

// 头部相关方法已移至 TopHeader 组件中

const swapTokens = () => {
  console.log('Swapping tokens...')
  // 交换代币逻辑
}
</script>

<style scoped>
/* 头部样式已移至 TopHeader 组件中 */

.trade-content {
  padding: 12px;
  /* 移除 height: 100% 和 overflow-y: auto，让 ResponsiveLayout 处理滚动 */
  display: flex;
  flex-direction: column;
}

.trade-types {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.trade-type-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 8px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 500;
}

.trade-type-btn.active {
  background: #6366f1;
  color: white;
}

.trade-type-btn:hover:not(.active) {
  background: rgba(255, 255, 255, 0.1);
  color: #f1f5f9;
}

.trade-form {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
}

.form-section {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #94a3b8;
  margin-bottom: 8px;
}

.token-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.token-selector:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.token-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.token-logo {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
}

.token-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.token-name {
  font-size: 14px;
  font-weight: 600;
  color: #f1f5f9;
}

.token-balance {
  font-size: 12px;
  color: #94a3b8;
}

.select-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
}

.amount-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.amount-input input {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  color: #f1f5f9;
  font-size: 16px;
  font-weight: 600;
}

.amount-input input::placeholder {
  color: #64748b;
}

.amount-input input:focus {
  outline: none;
  border-color: #6366f1;
}

.max-btn {
  background: #6366f1;
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.max-btn:hover {
  background: #5855eb;
}

.swap-icon {
  display: flex;
  justify-content: center;
  margin: 8px 0;
}

.swap-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  color: #f1f5f9;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.swap-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(180deg);
}

.trade-info {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 14px;
}

.info-row:not(:last-child) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.info-row span:first-child {
  color: #94a3b8;
}

.info-row span:last-child {
  color: #f1f5f9;
  font-weight: 500;
}

.trade-btn {
  width: 100%;
  background: #6366f1;
  border: none;
  border-radius: 12px;
  padding: 16px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.trade-btn:hover:not(:disabled) {
  background: #5855eb;
  transform: translateY(-1px);
}

.trade-btn:disabled {
  background: #374151;
  color: #6b7280;
  cursor: not-allowed;
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
</style>
