<template>
  <div class="rename-wallet-page">
    <PageHeader title="Rename Wallet" />
    
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

      <form @submit.prevent="handleRename" class="rename-form">
        <div class="form-group">
          <label for="newName">New Wallet Name</label>
          <input
            id="newName"
            v-model="newName"
            type="text"
            placeholder="Enter new wallet name"
            :disabled="loading"
            maxlength="50"
            required
          >
          <div class="char-count">{{ newName.length }}/50</div>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button 
          type="submit" 
          class="rename-btn"
          :disabled="loading || !newName.trim() || newName.trim() === wallet?.name"
        >
          <div v-if="loading" class="loading-spinner"></div>
          <i v-else class="ri-edit-line"></i>
          {{ loading ? 'Renaming...' : 'Rename Wallet' }}
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
const newName = ref('')
const loading = ref(false)
const error = ref('')
const defaultAvatar = '/icons/icon128.png'

// 获取链的友好名称
const getChainName = (chainCode: string) => {
  return (CHAIN_CONFIG as any)[chainCode]?.name || chainCode
}

// 处理重命名
const handleRename = async () => {
  if (!wallet.value || !newName.value.trim()) return
  
  loading.value = true
  error.value = ''
  
  try {
    if (!authStore.deviceId) {
      throw new Error('Device ID not found')
    }

    const response = await fetch(`${APP_CONFIG.API_BASE_URL}${API_ENDPOINTS.RENAME_WALLET(wallet.value.id)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        device_id: authStore.deviceId,
        new_name: newName.value.trim()
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to rename wallet')
    }

    // 更新本地钱包数据
    const updatedWallet = { ...wallet.value, name: newName.value.trim() }
    walletStore.updateWallet(updatedWallet)
    
    // 返回钱包详情页面
    router.push(`/wallet/${wallet.value.id}`)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to rename wallet'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const walletId = parseInt(route.params.id as string)
  wallet.value = walletStore.wallets.find(w => w.id === walletId) || null
  
  if (wallet.value) {
    newName.value = wallet.value.name
  } else {
    router.push('/')
  }
})
</script>

<style lang="scss" scoped>
.rename-wallet-page {
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
  margin-bottom: 32px;
  
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

.rename-form {
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
    
    .char-count {
      text-align: right;
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
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
  
  .rename-btn {
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

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
