<template>
  <ResponsiveLayout
    title="Select Blockchain"
    :show-header="true"
    :show-footer="true"
    :scrollable="true"
    @back="goBack"
  >
    <!-- 自定义头部 -->
    <template #header>
      <div class="chain-select-header">
        <div class="header-left">
          <button @click="goBack" class="back-button">
            <i class="ri-arrow-left-line"></i>
          </button>
          <h1 class="header-title">Select Blockchain</h1>
        </div>
      </div>
    </template>

    <!-- 主要内容 -->
    <div class="chain-select-content">
      <div class="description">
        <p>{{ descriptionText }}</p>
      </div>
      
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner">
          <i class="ri-loader-4-line spinning"></i>
        </div>
        <p>Loading supported chains...</p>
      </div>
      
      <div class="chains-container" v-if="!loading">
        <div
          v-for="chain in supportedChains"
          :key="chain.chain"
          class="chain-card"
          :class="{ active: selectedChain?.chain === chain.chain }"
          @click="selectChain(chain)"
        >
          <div class="card-background"></div>
          <div class="card-content">
            <div class="chain-icon">
              <img v-if="chain.logo" :src="chain.logo" :alt="chain.name" />
              <div v-else class="chain-placeholder">
                {{ (chain.chain || chain.name || 'C').charAt(0).toUpperCase() }}
              </div>
              <div class="icon-glow"></div>
            </div>
            <div class="chain-info">
              <h3>{{ chain.name }}</h3>
              <p>{{ chain.chain }}</p>
            </div>
            <div class="chain-selector">
              <div class="radio-circle" :class="{ selected: selectedChain?.chain === chain.chain }">
                <i v-if="selectedChain?.chain === chain.chain" class="ri-check-line"></i>
              </div>
            </div>
          </div>
          <div class="card-decoration">
            <div class="decoration-circle"></div>
            <div class="decoration-line"></div>
          </div>
        </div>
      </div>
      
    <div v-if="error" class="error-message">
      <i class="ri-error-warning-line"></i>
      <span>{{ error }}</span>
    </div>

    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <div class="footer-actions">
        <button
          class="continue-btn"
          :disabled="!selectedChain || submitting"
          @click="handleContinue"
        >
          <i v-if="submitting" class="ri-loader-4-line spinning"></i>
          <span>{{ submitting ? 'Processing...' : 'Continue' }}</span>
        </button>
      </div>
    </template>
  </ResponsiveLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@shared/stores/auth'
import { APP_CONFIG } from '@shared/constants'
import ResponsiveLayout from '@/popup/components/ResponsiveLayout.vue'

interface SupportedChain {
  chain: string
  name: string
  logo?: string
  type: string
  is_testnet: boolean
}

const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const error = ref('')
const supportedChains = ref<SupportedChain[]>([])
const selectedChain = ref<SupportedChain | null>(null)
const importType = ref('private_key') // 默认为私钥导入

// 计算属性
const descriptionText = computed(() => {
  if (importType.value === 'mnemonic') {
    return 'Choose the blockchain network for your recovery phrase import'
  } else {
    return 'Choose the blockchain network for your private key import'
  }
})

// 返回上一页
const goBack = () => {
  router.go(-1)
}

// 加载支持的链
const loadSupportedChains = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const response = await fetch(`${APP_CONFIG.API_BASE_URL}/wallets/get_supported_chains/`)
    const data = await response.json()
    
    if (data.state === 'success') {
      supportedChains.value = data.data || []
    } else {
      throw new Error(data.message || 'Failed to load supported chains')
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load chains'
    console.error('Failed to load supported chains:', err)
  } finally {
    loading.value = false
  }
}

// 选择链
const selectChain = (chain: SupportedChain) => {
  selectedChain.value = chain
}

// 继续到输入页面
const continueToPrivateKey = async () => {
  if (!selectedChain.value) return

  try {
    submitting.value = true

    // 将选择的链信息存储到 sessionStorage
    if (importType.value === 'mnemonic') {
      sessionStorage.setItem('mnemonic_selected_chain', JSON.stringify(selectedChain.value))
      // 跳转到助记词输入页面
      router.push('/import-mnemonic-input')
    } else {
      sessionStorage.setItem('import_selected_chain', JSON.stringify(selectedChain.value))
      // 跳转到私钥输入页面
      router.push('/import-private-key-input')
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to continue'
    console.error('Failed to continue:', err)
  } finally {
    submitting.value = false
  }
}

// 生命周期
onMounted(() => {
  // 检查导入类型
  const storedImportType = sessionStorage.getItem('import_type')
  if (storedImportType === 'mnemonic') {
    importType.value = 'mnemonic'
  }

  loadSupportedChains()
})
</script>

<style lang="scss" scoped>
// 自定义头部样式
.chain-select-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  width: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateX(-2px);
  }
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: white;
}

// 主要内容容器
.chain-select-content {
  padding: 24px;
  max-width: 420px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #334155;

  .back-btn {
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 10px;
    color: #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    &:hover {
      background: rgba(255, 255, 255, 0.15);
    }
  }

  h1 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }

  .placeholder {
    width: 40px;
  }
}

.content {
  flex: 1;
  padding: 24px 20px 100px;
  overflow-y: auto;
}

.description {
  text-align: center;
  margin-bottom: 24px;

  p {
    color: #94a3b8;
    margin: 0;
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 16px;

  .loading-spinner {
    font-size: 32px;
    color: #6366f1;
  }

  p {
    color: #94a3b8;
    margin: 0;
  }
}

.chains-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chain-card {
  position: relative;
  border-radius: 20px;
  padding: 0;
  cursor: pointer;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  height: 80px;

  &:hover {
    transform: translateY(-4px) scale(1.01);
  }

  &:active {
    transform: translateY(-2px) scale(1.005);
  }

  &.active {
    .card-background::before {
      background: linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4, #10b981);
    }

    .chain-selector .radio-circle {
      border-color: #6366f1;
      background: #6366f1;

      i {
        color: white;
      }
    }
  }
}

.card-background {
  position: absolute;
  inset: 0;
  border-radius: 20px;
  transition: all 0.5s ease;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 20px;
    padding: 2px;
    background: linear-gradient(135deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: xor;
    transition: all 0.5s ease;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 2px;
    border-radius: 18px;
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(20px);
    transition: all 0.5s ease;
  }
}

.card-content {
  position: relative;
  z-index: 2;
  padding: 16px 20px;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 16px;
}

.chain-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.4s ease;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    position: relative;
    z-index: 2;
  }

  .chain-placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    color: white;
    font-size: 18px;
    position: relative;
    z-index: 2;
  }

  .icon-glow {
    position: absolute;
    inset: -4px;
    border-radius: 18px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4);
    opacity: 0;
    filter: blur(8px);
    transition: all 0.4s ease;
    z-index: 0;
  }

  &:hover {
    transform: scale(1.05) rotate(2deg);

    .icon-glow {
      opacity: 0.6;
    }
  }
}

.chain-info {
  flex: 1;

  h3 {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 4px 0;
    color: #f1f5f9;
    transition: all 0.3s ease;
  }

  p {
    font-size: 14px;
    color: #94a3b8;
    margin: 0;
    transition: all 0.3s ease;
  }
}

.chain-selector {
  display: flex;
  align-items: center;

  .radio-circle {
    width: 24px;
    height: 24px;
    border: 2px solid #64748b;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    background: rgba(255, 255, 255, 0.05);

    &.selected {
      border-color: #6366f1;
      background: #6366f1;
      transform: scale(1.1);

      i {
        color: white;
        font-size: 14px;
      }
    }

    &:not(.selected) {
      background: rgba(255, 255, 255, 0.05);
    }
  }
}

.card-decoration {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 1;
  opacity: 0.2;
  transition: all 0.4s ease;

  .decoration-circle {
    width: 32px;
    height: 32px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 16px;
      height: 16px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
    }
  }

  .decoration-line {
    position: absolute;
    top: 50%;
    right: -16px;
    width: 24px;
    height: 1px;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.2), transparent);
  }
}

.chain-card:hover {
  .card-background::before {
    background: linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4);
  }

  .chain-info {
    h3 {
      color: #ffffff;
      transform: translateX(4px);
    }

    p {
      color: #cbd5e1;
    }
  }

  box-shadow:
    0 20px 40px rgba(99, 102, 241, 0.3),
    0 0 0 1px rgba(99, 102, 241, 0.2);
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: #ef4444;
  font-size: 14px;
  margin-bottom: 16px;
}

// 底部固定按钮区域
.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 20px 20px;
  background: linear-gradient(180deg, transparent 0%, #0F172A 20%, #0F172A 100%);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  z-index: 10;
}

.continue-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// 响应式设计
@media (max-width: 480px) {
  .select-chain-page {
    width: 100%;
  }

  .content {
    padding: 20px 16px 100px;
  }

  .chains-container {
    gap: 14px;
  }

  .chain-card {
    height: 72px;

    .card-content {
      padding: 14px 16px;
      gap: 14px;
    }
  }

  .chain-icon {
    width: 44px;
    height: 44px;

    .chain-placeholder {
      font-size: 16px;
    }
  }

  .chain-info {
    h3 {
      font-size: 15px;
    }

    p {
      font-size: 13px;
    }
  }

  .card-decoration {
    top: 14px;
    right: 14px;

    .decoration-circle {
      width: 28px;
      height: 28px;

      &::before {
        width: 14px;
        height: 14px;
      }
    }
  }
}

// 弹窗模式特殊样式
:global(.layout-popup) .select-chain-page {
  width: 375px;
  min-height: 600px;

  .content {
    padding: 20px 16px 100px;
  }

  .chains-container {
    gap: 12px;
  }

  .chain-card {
    height: 72px;

    .card-content {
      padding: 14px 16px;
    }
  }

  .chain-icon {
    width: 44px;
    height: 44px;
  }

  .bottom-actions {
    width: 375px;
  }
}
</style>
