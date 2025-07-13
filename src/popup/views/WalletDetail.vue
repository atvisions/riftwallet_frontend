<template>
  <div class="wallet-detail-page">
    <PageHeader title="Wallet Details" />

    <div class="content">
      <div v-if="wallet" class="wallet-info">
        <div class="wallet-avatar">
          <img :src="wallet.avatar || defaultAvatar" :alt="wallet.name">
        </div>
        <h2>{{ wallet.name }}</h2>
        <p class="wallet-address">{{ formatAddress(wallet.address) }}</p>
        <p class="wallet-chain">{{ getChainName(wallet.chain) }}</p>
        <div v-if="wallet.chain === 'KDA' && wallet.kadena_chain_id !== null" class="kadena-chain">
          Chain ID: {{ wallet.kadena_chain_id }}
        </div>
      </div>

      <div v-else class="loading">
        <div class="loading-spinner"></div>
        <p>Loading wallet details...</p>
      </div>

      <!-- 管理按钮 -->
      <div v-if="wallet" class="management-actions">
        <button class="action-btn rename-btn" @click="goToRename">
          <i class="ri-edit-line"></i>
          Rename Wallet
        </button>

        <button class="action-btn private-key-btn" @click="goToShowPrivateKey">
          <i class="ri-key-line"></i>
          Show Private Key
        </button>

        <button class="action-btn delete-btn" @click="goToDelete">
          <i class="ri-delete-bin-line"></i>
          Delete Wallet
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWalletStore } from '@shared/stores/wallet'
import PageHeader from '@/popup/components/PageHeader.vue'
import { CHAIN_CONFIG } from '@shared/constants'
import { formatAddress } from '@shared/utils'
import type { Wallet } from '@shared/types'

const route = useRoute()
const router = useRouter()
const walletStore = useWalletStore()

const wallet = ref<Wallet | null>(null)
const defaultAvatar = '/icons/icon128.png'

// 获取链的友好名称
const getChainName = (chainCode: string) => {
  return (CHAIN_CONFIG as any)[chainCode]?.name || chainCode
}

// 导航到重命名页面
const goToRename = () => {
  router.push(`/wallet/${wallet.value?.id}/rename`)
}

// 导航到显示私钥页面
const goToShowPrivateKey = () => {
  router.push(`/wallet/${wallet.value?.id}/private-key`)
}

// 导航到删除钱包页面
const goToDelete = () => {
  router.push(`/wallet/${wallet.value?.id}/delete`)
}

onMounted(() => {
  const walletId = parseInt(route.params.id as string)
  wallet.value = walletStore.wallets.find(w => w.id === walletId) || null
})
</script>

<style lang="scss" scoped>
.wallet-detail-page {
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

.wallet-info {
  text-align: center;
  margin-bottom: 32px;

  .wallet-avatar {
    width: 80px;
    height: 80px;
    margin: 0 auto 16px;
    border-radius: 50%;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  h2 {
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 8px 0;
    color: #f1f5f9;
  }

  .wallet-address {
    color: #9ca3af;
    font-size: 14px;
    margin: 0 0 4px 0;
    font-family: 'Monaco', 'Menlo', monospace;
  }

  .wallet-chain {
    color: #6366f1;
    font-size: 14px;
    font-weight: 500;
    margin: 0 0 8px 0;
  }

  .kadena-chain {
    color: #f59e0b;
    font-size: 12px;
    font-weight: 500;
    margin: 0;
  }
}

.management-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .action-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: #f1f5f9;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
    }

    i {
      font-size: 18px;
    }

    &.rename-btn:hover {
      background: rgba(34, 197, 94, 0.1);
      border-color: #22c55e;
      color: #22c55e;
    }

    &.private-key-btn:hover {
      background: rgba(59, 130, 246, 0.1);
      border-color: #3b82f6;
      color: #3b82f6;
    }

    &.delete-btn:hover {
      background: rgba(239, 68, 68, 0.1);
      border-color: #ef4444;
      color: #ef4444;
    }
  }
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;

  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #6366f1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  p {
    color: #9ca3af;
    margin: 0;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
