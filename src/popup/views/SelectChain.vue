<template>
  <div class="select-chain-page">
    <div class="header">
      <button class="back-btn" @click="goBack">
        <i class="ri-arrow-left-line"></i>
      </button>
      <h1>Select Blockchain</h1>
      <div class="placeholder"></div>
    </div>
    
    <div class="content">
      <div class="description">
        <p>Choose the blockchain network for your new wallet</p>
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
      
      <div class="loading-container" v-if="loading">
        <div class="loading-spinner"></div>
        <p>Loading supported chains...</p>
      </div>
      
      <div class="error-container" v-if="error">
        <div class="error-icon">
          <i class="ri-error-warning-line"></i>
        </div>
        <p>{{ error }}</p>
        <button class="retry-btn" @click="loadSupportedChains">
          <i class="ri-refresh-line"></i>
          Retry
        </button>
      </div>
    </div>
    
    <div class="footer">
      <button 
        class="continue-btn" 
        :disabled="!selectedChain || submitting"
        @click="continueToMnemonic"
      >
        <span v-if="submitting">
          <i class="ri-loader-4-line animate-spin"></i>
          Processing...
        </span>
        <span v-else>
          Continue
          <i class="ri-arrow-right-line"></i>
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@shared/stores/auth'
import { useWalletStore } from '@shared/stores/wallet'
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

// 继续到助记词页面
const continueToMnemonic = async () => {
  if (!selectedChain.value) return
  
  try {
    submitting.value = true
    
    const response = await fetch(`${APP_CONFIG.API_BASE_URL}/wallets/select_chain/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        device_id: authStore.deviceId,
        chain: selectedChain.value.chain
      })
    })
    
    const data = await response.json()
    
    if (data.state === 'success') {
      // API 返回了助记词，需要用户验证
      console.log('Chain selected successfully:', data.data)
      console.log('Generated mnemonic:', data.data.mnemonic)

      // 将助记词和链信息存储到 sessionStorage 供验证页面使用
      sessionStorage.setItem('generated_mnemonic', data.data.mnemonic)
      sessionStorage.setItem('selected_chain', selectedChain.value.chain)

      // 跳转到助记词验证页面
      router.push('/verify-mnemonic')
    } else {
      throw new Error(data.message || 'Failed to select chain')
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to select chain'
    console.error('Failed to select chain:', err)
  } finally {
    submitting.value = false
  }
}

// 生命周期
onMounted(() => {
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
  padding: 24px 20px;
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

.chains-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chain-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: #6366f1;
  }
  
  &.active {
    background: rgba(99, 102, 241, 0.1);
    border-color: #6366f1;
  }
}

.chain-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
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
  }
  
  p {
    font-size: 14px;
    color: #94a3b8;
    margin: 0;
  }
}

.chain-selector {
  display: flex;
  align-items: center;

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

    &:not(.selected) {
      background: transparent;
    }
  }
}

.loading-container, .error-container {
  text-align: center;
  padding: 40px 20px;
  
  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(99, 102, 241, 0.3);
    border-top: 3px solid #6366f1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 16px;
  }
  
  .error-icon {
    color: #ef4444;
    font-size: 40px;
    margin-bottom: 16px;
  }
  
  p {
    color: #94a3b8;
    margin-bottom: 16px;
  }
  
  .retry-btn {
    background: #6366f1;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 auto;
    
    &:hover {
      background: #5856d6;
    }
  }
}

.footer {
  padding: 20px;
  border-top: 1px solid #334155;
  
  .continue-btn {
    width: 100%;
    background: #6366f1;
    color: white;
    border: none;
    padding: 16px;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.3s ease;
    
    &:hover:not(:disabled) {
      background: #5856d6;
    }
    
    &:disabled {
      background: #374151;
      color: #9ca3af;
      cursor: not-allowed;
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
