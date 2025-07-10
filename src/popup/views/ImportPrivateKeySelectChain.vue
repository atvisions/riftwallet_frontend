<template>
  <div class="select-chain-page">
    <div class="header">
      <button @click="goBack" class="back-btn">
        <i class="ri-arrow-left-line"></i>
      </button>
      <h1>Select Blockchain</h1>
    </div>

    <div class="content">
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
          <div class="chain-icon">
            <img v-if="chain.logo" :src="chain.logo" :alt="chain.name" />
            <div v-else class="chain-placeholder">
              {{ (chain.chain || chain.name || 'C').charAt(0).toUpperCase() }}
            </div>
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
      </div>
      
      <div v-if="error" class="error-message">
        <i class="ri-error-warning-line"></i>
        <span>{{ error }}</span>
      </div>
    </div>

    <!-- 固定在底部的按钮 -->
    <div class="bottom-actions">
      <button
        class="continue-btn"
        :disabled="!selectedChain || submitting"
        @click="continueToPrivateKey"
      >
        <i v-if="submitting" class="ri-loader-4-line spinning"></i>
        <span>{{ submitting ? 'Processing...' : 'Continue' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@shared/stores/auth'
import { APP_CONFIG } from '@shared/constants'

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
.select-chain-page {
  width: 375px;
  height: 762px;
  background: #0F172A;
  color: #f1f5f9;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #1E293B;
  flex-shrink: 0;

  .back-btn {
    background: none;
    border: none;
    color: #6366f1;
    font-size: 20px;
    margin-right: 16px;
    cursor: pointer;

    &:hover {
      color: #8b5cf6;
    }
  }

  h1 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }
}

.content {
  flex: 1;
  padding: 20px 16px 100px; // 为底部按钮留出空间
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.description {
  margin-bottom: 24px;

  p {
    color: #94a3b8;
    font-size: 14px;
    margin: 0;
    line-height: 1.5;
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
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.chain-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
  }

  &.active {
    background: rgba(99, 102, 241, 0.1);
    border-color: #6366f1;
  }
}

.chain-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .chain-placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 600;
    color: white;
  }
}

.chain-info {
  flex: 1;

  h3 {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 4px 0;
    color: #f1f5f9;
  }

  p {
    font-size: 14px;
    color: #94a3b8;
    margin: 0;
  }
}

.chain-selector {
  .radio-circle {
    width: 20px;
    height: 20px;
    border: 2px solid #64748b;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;

    &.selected {
      border-color: #6366f1;
      background: #6366f1;

      i {
        color: white;
        font-size: 12px;
      }
    }
  }
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
  width: 375px;
  padding: 16px 20px 20px;
  background: linear-gradient(180deg, transparent 0%, #0F172A 20%, #0F172A 100%);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  z-index: 10;
}

.continue-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  border-radius: 8px;
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
</style>
