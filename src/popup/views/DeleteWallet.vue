<template>
  <div class="delete-wallet-page">
    <PageHeader title="Delete Wallet" />
    
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

      <!-- 危险警告 -->
      <div class="danger-warning">
        <div class="warning-icon">
          <i class="ri-error-warning-line"></i>
        </div>
        <div class="warning-content">
          <h4>Danger Zone</h4>
          <p>This action cannot be undone. Make sure you have backed up your private key or mnemonic phrase before deleting this wallet.</p>
        </div>
      </div>

      <!-- 确认删除表单 -->
      <form @submit.prevent="handleDeleteWallet" class="delete-form">
        <div class="form-group">
          <label for="confirmText">Type "DELETE" to confirm</label>
          <input
            id="confirmText"
            v-model="confirmText"
            type="text"
            placeholder="Type DELETE to confirm"
            :disabled="loading"
            required
          >
        </div>

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
          class="delete-btn"
          :disabled="loading || confirmText !== 'DELETE' || !password.trim()"
        >
          <div v-if="loading" class="loading-spinner"></div>
          <i v-else class="ri-delete-bin-line"></i>
          {{ loading ? 'Deleting...' : 'Delete Wallet' }}
        </button>
      </form>
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
import { formatAddress } from '@shared/utils'
import type { Wallet } from '@shared/types'

const route = useRoute()
const router = useRouter()
const walletStore = useWalletStore()
const authStore = useAuthStore()

const wallet = ref<Wallet | null>(null)
const confirmText = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const defaultAvatar = '/icons/icon128.png'

// 获取链的友好名称
const getChainName = (chainCode: string) => {
  return (CHAIN_CONFIG as any)[chainCode]?.name || chainCode
}

// 处理删除钱包
const handleDeleteWallet = async () => {
  if (!wallet.value || confirmText.value !== 'DELETE' || !password.value.trim()) return
  
  loading.value = true
  error.value = ''
  
  try {
    if (!authStore.deviceId) {
      throw new Error('Device ID not found')
    }

    const response = await fetch(`${APP_CONFIG.API_BASE_URL}${API_ENDPOINTS.DELETE_WALLET(wallet.value.id)}`, {
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

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete wallet')
    }

    // 从本地存储中删除钱包
    walletStore.removeWallet(wallet.value.id)
    
    // 如果删除的是当前钱包，需要切换到其他钱包或回到首页
    if (walletStore.currentWallet?.id === wallet.value.id) {
      const remainingWallets = walletStore.wallets.filter(w => w.id !== wallet.value!.id)
      if (remainingWallets.length > 0) {
        walletStore.setCurrentWallet(remainingWallets[0])
      } else {
        walletStore.setCurrentWallet(null)
      }
    }
    
    // 返回首页
    router.push('/')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete wallet'
  } finally {
    loading.value = false
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
.delete-wallet-page {
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

.danger-warning {
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

.delete-form {
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
        border-color: #ef4444;
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
  
  .delete-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px;
    background: #ef4444;
    border: none;
    border-radius: 12px;
    color: white;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover:not(:disabled) {
      background: #dc2626;
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

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
