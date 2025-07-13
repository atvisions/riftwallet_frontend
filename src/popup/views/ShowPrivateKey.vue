<template>
  <div class="show-private-key-page">
    <PageHeader title="Show Private Key" />
    
    <div class="content">
      <div v-if="wallet" class="wallet-preview">
        <div class="wallet-avatar">
          <img :src="wallet.avatar || defaultAvatar" :alt="wallet.name">
        </div>
        <div class="wallet-info">
          <h3>{{ wallet.name }}</h3>
          <p class="wallet-address">{{ formatAddress(wallet.address) }}</p>
          <p class="wallet-chain">{{ getChainName(wallet.chain) }}</p>
        </div>
      </div>

      <!-- 安全警告 -->
      <div class="security-warning">
        <div class="warning-icon">
          <i class="ri-shield-check-line"></i>
        </div>
        <div class="warning-content">
          <h4>Security Warning</h4>
          <p>Never share your private key with anyone. Anyone with your private key can access your wallet and steal your funds.</p>
        </div>
      </div>

      <!-- 密码验证表单 -->
      <form v-if="!privateKeyRevealed" @submit.prevent="handleShowPrivateKey" class="password-form">
        <div class="form-group">
          <label for="password">Payment Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Enter your payment password"
            :disabled="loading"
            required
          >
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button 
          type="submit" 
          class="show-btn"
          :disabled="loading || !password.trim()"
        >
          <div v-if="loading" class="loading-spinner"></div>
          <i v-else class="ri-key-line"></i>
          {{ loading ? 'Verifying...' : 'Show Private Key' }}
        </button>
      </form>

      <!-- 调试信息 -->
      <div v-if="isDevelopment" class="debug-info" style="background: rgba(255,255,255,0.1); padding: 10px; margin: 10px 0; border-radius: 5px; font-size: 12px;">
        <p>Debug Info:</p>
        <p>privateKeyRevealed: {{ privateKeyRevealed }}</p>
        <p>privateKey length: {{ privateKey.length }}</p>
        <p>loading: {{ loading }}</p>
        <p>error: {{ error }}</p>
      </div>

      <!-- 私钥显示 -->
      <div v-if="privateKeyRevealed && privateKey" class="private-key-section">
        <div class="private-key-container">
          <label>Private Key</label>
          <div class="private-key-display">
            <div class="private-key-text" :class="{ 'blurred': !showPrivateKey }">
              {{ privateKey }}
            </div>
            <div class="private-key-actions">
              <button 
                class="toggle-visibility-btn"
                @click="togglePrivateKeyVisibility"
                :title="showPrivateKey ? 'Hide Private Key' : 'Show Private Key'"
              >
                <i :class="showPrivateKey ? 'ri-eye-off-line' : 'ri-eye-line'"></i>
              </button>
              <button 
                class="copy-btn"
                @click="copyPrivateKey"
                :title="copied ? 'Copied!' : 'Copy Private Key'"
              >
                <i :class="copied ? 'ri-check-line' : 'ri-file-copy-line'"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWalletStore } from '@shared/stores/wallet'
import { useAuthStore } from '@shared/stores/auth'
import PageHeader from '@/popup/components/PageHeader.vue'
import { CHAIN_CONFIG, APP_CONFIG, API_ENDPOINTS } from '@shared/constants'
import { formatAddress, copyToClipboard } from '@shared/utils'
import type { Wallet } from '@shared/types'

const route = useRoute()
const router = useRouter()
const walletStore = useWalletStore()
const authStore = useAuthStore()

const wallet = ref<Wallet | null>(null)
const password = ref('')
const privateKey = ref('')
const loading = ref(false)
const error = ref('')
const privateKeyRevealed = ref(false)
const showPrivateKey = ref(false)
const copied = ref(false)
const defaultAvatar = '/icons/icon128.png'

// 开发环境检测
const isDevelopment = import.meta.env.DEV

// 获取链的友好名称
const getChainName = (chainCode: string) => {
  return (CHAIN_CONFIG as any)[chainCode]?.name || chainCode
}

// 处理显示私钥
const handleShowPrivateKey = async () => {
  if (!wallet.value || !password.value.trim()) return

  loading.value = true
  error.value = ''

  console.log('Starting private key request for wallet:', wallet.value.id)
  console.log('Device ID:', authStore.deviceId)

  try {
    if (!authStore.deviceId) {
      throw new Error('Device ID not found')
    }

    const response = await fetch(`${APP_CONFIG.API_BASE_URL}${API_ENDPOINTS.SHOW_PRIVATE_KEY(wallet.value.id)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        device_id: authStore.deviceId,
        payment_password: password.value
      })
    })

    const data = await response.json()

    console.log('Show private key response:', {
      status: response.status,
      statusText: response.statusText,
      data: data
    })

    if (!response.ok) {
      throw new Error(data.message || 'Failed to show private key')
    }

    // 检查不同可能的响应格式
    let privateKeyValue = data.private_key || data.data?.private_key || data.data

    if (!privateKeyValue) {
      console.error('Private key not found in response:', data)
      throw new Error('Private key not found in response')
    }

    privateKey.value = privateKeyValue
    privateKeyRevealed.value = true
    password.value = '' // 清除密码
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to show private key'
  } finally {
    loading.value = false
  }
}

// 切换私钥可见性
const togglePrivateKeyVisibility = () => {
  showPrivateKey.value = !showPrivateKey.value
}

// 复制私钥
const copyPrivateKey = async () => {
  if (!privateKey.value) return
  
  const success = await copyToClipboard(privateKey.value)
  if (success) {
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

onMounted(() => {
  const walletId = parseInt(route.params.id as string)
  wallet.value = walletStore.wallets.find(w => w.id === walletId) || null
  
  if (!wallet.value) {
    router.push('/')
  }
})
</script>

<style lang="scss" scoped>
.show-private-key-page {
  width: 100%;
  height: 100vh;
  background: #0F172A;
  color: #f1f5f9;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.wallet-preview {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  margin-bottom: 24px;
  
  .wallet-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  
  .wallet-info {
    flex: 1;
    
    h3 {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 4px 0;
      color: #f1f5f9;
    }
    
    .wallet-address {
      font-size: 12px;
      color: #9ca3af;
      margin: 0 0 2px 0;
      font-family: 'Monaco', 'Menlo', monospace;
    }
    
    .wallet-chain {
      font-size: 12px;
      color: #6366f1;
      font-weight: 500;
      margin: 0;
    }
  }
}

.security-warning {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  margin-bottom: 24px;
  
  .warning-icon {
    color: #ef4444;
    font-size: 24px;
    flex-shrink: 0;
  }
  
  .warning-content {
    h4 {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: #ef4444;
    }
    
    p {
      font-size: 14px;
      color: #fca5a5;
      margin: 0;
      line-height: 1.5;
    }
  }
}

.password-form {
  .form-group {
    margin-bottom: 24px;
    
    label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #f1f5f9;
      margin-bottom: 8px;
    }
    
    input {
      width: 100%;
      padding: 16px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      color: #f1f5f9;
      font-size: 16px;
      transition: all 0.3s ease;
      
      &:focus {
        outline: none;
        border-color: #6366f1;
        background: rgba(255, 255, 255, 0.08);
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      &::placeholder {
        color: #64748b;
      }
    }
  }
  
  .error-message {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 8px;
    padding: 12px;
    color: #ef4444;
    font-size: 14px;
    margin-bottom: 24px;
  }
  
  .show-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px;
    background: #6366f1;
    border: none;
    border-radius: 12px;
    color: white;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover:not(:disabled) {
      background: #5855eb;
      transform: translateY(-1px);
    }
    
    &:disabled {
      background: #374151;
      cursor: not-allowed;
      transform: none;
    }
    
    .loading-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid transparent;
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    i {
      font-size: 18px;
    }
  }
}

.private-key-section {
  .private-key-container {
    label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #f1f5f9;
      margin-bottom: 8px;
    }
    
    .private-key-display {
      position: relative;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 16px;
      
      .private-key-text {
        font-family: 'Monaco', 'Menlo', monospace;
        font-size: 14px;
        color: #f1f5f9;
        word-break: break-all;
        line-height: 1.5;
        transition: all 0.3s ease;
        
        &.blurred {
          filter: blur(8px);
          user-select: none;
        }
      }
      
      .private-key-actions {
        position: absolute;
        top: 12px;
        right: 12px;
        display: flex;
        gap: 8px;
        
        button {
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 6px;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          
          &:hover {
            background: rgba(255, 255, 255, 0.2);
            color: #f1f5f9;
          }
          
          i {
            font-size: 16px;
          }
        }
        
        .copy-btn .ri-check-line {
          color: #10b981;
        }
      }
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
