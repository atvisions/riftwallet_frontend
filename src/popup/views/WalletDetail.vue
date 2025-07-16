<template>
  <div class="wallet-detail-page">
    <PageHeader title="Wallet Details" />

    <div class="content">
      <div v-if="wallet" class="wallet-info">
        <div class="wallet-avatar">
          <img :src="wallet.avatar || defaultAvatar" :alt="wallet.name">
        </div>
        <h2>{{ wallet.name }}</h2>
        <p class="wallet-address">{{ formatAddress(wallet.address || '') }}</p>
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
        <!-- Kadena Chain ID 管理 -->
        <div v-if="wallet.chain === 'KDA' || wallet.chain === 'KDA_TESTNET'" class="action-btn kadena-chain-btn" @click="toggleChainIdEdit">
          <i class="ri-link"></i>
          <div class="action-content">
            <span>Kadena Chain ID</span>
            <span class="current-value">Current: {{ wallet.kadena_chain_id ?? 0 }}</span>
          </div>
          <i class="ri-arrow-right-s-line"></i>
        </div>

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

      <!-- Kadena Chain ID 编辑弹窗 -->
      <div v-if="showChainIdModal" class="modal-overlay" @click="closeChainIdModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>Update Kadena Chain ID</h3>
            <button class="close-btn" @click="closeChainIdModal">
              <i class="ri-close-line"></i>
            </button>
          </div>

          <div class="modal-body">
            <p class="modal-description">
              Select the Kadena chain ID for this wallet. This determines which parallel chain your wallet will interact with.
            </p>

            <div class="chain-id-selector">
              <label for="kadena-chain-id-select">Chain ID:</label>
              <select
                id="kadena-chain-id-select"
                v-model.number="editChainId"
                :disabled="loadingChainId"
                class="chain-id-select"
              >
                <option v-for="id in 20" :key="id-1" :value="id-1">Chain {{ id-1 }}</option>
              </select>
            </div>

            <div v-if="chainIdMsg" class="message" :class="chainIdMsgType">
              <i :class="chainIdMsgType === 'success' ? 'ri-check-line' : 'ri-error-warning-line'"></i>
              {{ chainIdMsg }}
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" @click="closeChainIdModal" :disabled="loadingChainId">
              Cancel
            </button>
            <button
              class="btn-primary"
              @click="updateChainId"
              :disabled="loadingChainId || editChainId === (wallet?.kadena_chain_id ?? 0)"
            >
              <i v-if="loadingChainId" class="ri-loader-4-line spinning"></i>
              {{ loadingChainId ? 'Updating...' : 'Update Chain ID' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWalletStore } from '@shared/stores/wallet'
import PageHeader from '@/popup/components/PageHeader.vue'
import { CHAIN_CONFIG, APP_CONFIG } from '@shared/constants'
import { formatAddress } from '@shared/utils'
import type { Wallet } from '@shared/types'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const walletStore = useWalletStore()

const wallet = ref<Wallet | null>(null)
const defaultAvatar = '/icons/icon128.png'

const editChainId = ref<number>(0)
const loadingChainId = ref(false)
const chainIdMsg = ref('')
const chainIdMsgType = ref<'success'|'error'>('success')
const showChainIdModal = ref(false)

watch(wallet, (w) => {
  if (w && (w.chain === 'KDA' || w.chain === 'KDA_TESTNET')) {
    editChainId.value = Number(w.kadena_chain_id ?? 0)
  }
})

// 弹窗控制方法
const toggleChainIdEdit = () => {
  showChainIdModal.value = true
  chainIdMsg.value = ''
  if (wallet.value) {
    editChainId.value = Number(wallet.value.kadena_chain_id ?? 0)
  }
}

const closeChainIdModal = () => {
  showChainIdModal.value = false
  chainIdMsg.value = ''
  loadingChainId.value = false
}

const updateChainId = async () => {
  if (!wallet.value) return
  loadingChainId.value = true
  chainIdMsg.value = ''
  try {
    const res = await axios.post(`${APP_CONFIG.API_BASE_URL}/wallets/${wallet.value.id}/update_kadena_chain_id/`, {
      kadena_chain_id: Number(editChainId.value)
    })
    if (res.data && (res.data.kadena_chain_id === editChainId.value || (res.data.data && res.data.data.kadena_chain_id === editChainId.value))) {
      wallet.value.kadena_chain_id = String(editChainId.value)
      chainIdMsg.value = 'Chain ID updated successfully!'
      chainIdMsgType.value = 'success'
      // 3秒后关闭弹窗
      setTimeout(() => {
        closeChainIdModal()
      }, 2000)
    } else {
      chainIdMsg.value = 'Update failed.'
      chainIdMsgType.value = 'error'
    }
  } catch (e: any) {
    chainIdMsg.value = e?.response?.data?.error || 'Update failed.'
    chainIdMsgType.value = 'error'
  } finally {
    loadingChainId.value = false
  }
}

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

    .action-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;

      .current-value {
        font-size: 12px;
        color: #9ca3af;
        font-weight: 400;
      }
    }

    &.kadena-chain-btn:hover {
      background: rgba(245, 158, 11, 0.1);
      border-color: #f59e0b;
      color: #f59e0b;
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

// 弹窗样式
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: #1e293b;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #f1f5f9;
  }

  .close-btn {
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #f1f5f9;
    }

    i {
      font-size: 20px;
    }
  }
}

.modal-body {
  padding: 20px 24px;

  .modal-description {
    color: #9ca3af;
    font-size: 14px;
    line-height: 1.5;
    margin: 0 0 20px 0;
  }

  .chain-id-selector {
    margin-bottom: 16px;

    label {
      display: block;
      color: #f1f5f9;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 8px;
    }

    .chain-id-select {
      width: 100%;
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: #f1f5f9;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:focus {
        outline: none;
        border-color: #f59e0b;
        background: rgba(255, 255, 255, 0.08);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      option {
        background: #1e293b;
        color: #f1f5f9;
      }
    }
  }

  .message {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;

    &.success {
      background: rgba(34, 197, 94, 0.1);
      border: 1px solid rgba(34, 197, 94, 0.2);
      color: #22c55e;
    }

    &.error {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }

    i {
      font-size: 16px;
    }
  }
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 24px 24px;

  .btn-secondary,
  .btn-primary {
    flex: 1;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #f1f5f9;

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
    }
  }

  .btn-primary {
    background: #f59e0b;
    border: 1px solid #f59e0b;
    color: #000;

    &:hover:not(:disabled) {
      background: #d97706;
      border-color: #d97706;
    }
  }
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
