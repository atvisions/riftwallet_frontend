<template>
  <div class="wallet-selector">
    <!-- 当前钱包显示 -->
    <div class="current-wallet" @click="toggleDropdown">
      <div class="wallet-info">
        <div class="wallet-avatar-container">
          <img
            v-if="currentWallet?.avatar"
            :src="currentWallet.avatar"
            :alt="currentWallet.name"
            class="wallet-avatar"
            @error="handleAvatarError"
          >
          <div v-else class="wallet-avatar-fallback">
            <i class="ri-wallet-3-line"></i>
          </div>
        </div>
        <div class="wallet-details">
          <span class="wallet-name">{{ currentWallet?.name || 'No Wallet' }}</span>
          <span class="wallet-chain">{{ currentWallet ? getChainName(currentWallet.chain) : '' }}</span>
        </div>
      </div>
      <i class="ri-arrow-down-s-line dropdown-icon" :class="{ 'rotated': showDropdown }"></i>
    </div>

    <!-- 下拉菜单 -->
    <div v-if="showDropdown" class="dropdown-menu">
      <!-- 钱包列表容器 -->
      <div class="wallet-list-container">
        <div class="section-title">MY WALLETS</div>
        <div class="wallet-list">
          <div
            v-for="wallet in wallets"
            :key="wallet.id"
            class="wallet-item"
            :class="{ 'active': currentWallet?.id === wallet.id }"
            @click="selectWallet(wallet)"
          >
            <div class="wallet-avatar-container">
              <img
                v-if="wallet.avatar"
                :src="wallet.avatar"
                :alt="wallet.name"
                class="wallet-avatar"
                @error="handleAvatarError"
              >
              <div v-else class="wallet-avatar-fallback">
                <i class="ri-wallet-3-line"></i>
              </div>
            </div>
            <div class="wallet-info">
              <div class="wallet-header">
                <span class="wallet-name">{{ wallet.name }}</span>
                <span class="wallet-chain-badge">{{ getChainName(wallet.chain) }}</span>
              </div>
              <div class="wallet-address-row">
                <span class="wallet-address">{{ formatLongAddress(wallet.address) }}</span>
                <button
                  class="copy-address-btn"
                  @click.stop="copyWalletAddress(wallet.address, wallet.id)"
                  :title="copiedWalletId === wallet.id ? 'Copied!' : 'Copy Address'"
                >
                  <i :class="copiedWalletId === wallet.id ? 'ri-check-line' : 'ri-file-copy-line'"></i>
                </button>
              </div>
              <div v-if="wallet.chain === 'KDA' && wallet.kadena_chain_id !== null" class="kadena-chain">
                Chain ID: {{ wallet.kadena_chain_id }}
              </div>
            </div>
            <button class="manage-btn" @click.stop="manageWallet(wallet)">
              <i class="ri-settings-3-line"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="actions">
        <button class="action-btn create-btn" @click="createNewWallet">
          <i class="ri-add-line"></i>
          Create New Wallet
        </button>
        <button class="action-btn import-btn" @click="importWallet">
          <i class="ri-download-line"></i>
          Import Wallet
        </button>
      </div>
    </div>

    <!-- 背景遮罩 -->
    <div v-if="showDropdown" class="backdrop" @click="closeDropdown"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWalletStore } from '@shared/stores/wallet'
import { CHAIN_CONFIG } from '@shared/constants'
import type { Wallet } from '@shared/types'

const router = useRouter()
const walletStore = useWalletStore()

// 响应式数据
const showDropdown = ref(false)
const copiedWalletId = ref<string | null>(null)

// 计算属性
const wallets = computed(() => walletStore.wallets)
const currentWallet = computed(() => walletStore.currentWallet)

// 获取链的友好名称
const getChainName = (chainCode: string) => {
  return (CHAIN_CONFIG as any)[chainCode]?.name || chainCode
}

// 方法
const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const closeDropdown = () => {
  showDropdown.value = false
}

const selectWallet = (wallet: Wallet) => {
  walletStore.setCurrentWallet(wallet)
  closeDropdown()
}

const formatAddress = (address: string) => {
  if (!address) return ''
  if (address.length <= 12) return address
  return `${address.slice(0, 6)}...${address.slice(-6)}`
}

// 格式化长地址显示
const formatLongAddress = (address: string) => {
  if (!address) return ''
  if (address.length <= 20) return address
  return `${address.slice(0, 10)}...${address.slice(-8)}`
}

// 复制钱包地址
const copyWalletAddress = async (address: string, walletId: string) => {
  try {
    await navigator.clipboard.writeText(address)
    copiedWalletId.value = walletId

    // 2秒后重置图标状态
    setTimeout(() => {
      copiedWalletId.value = null
    }, 2000)
  } catch (error) {
    console.error('Failed to copy address:', error)
    // 如果 clipboard API 不可用，尝试使用 fallback 方法
    try {
      const textArea = document.createElement('textarea')
      textArea.value = address
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)

      copiedWalletId.value = walletId
      setTimeout(() => {
        copiedWalletId.value = null
      }, 2000)
    } catch (fallbackError) {
      console.error('Fallback copy failed:', fallbackError)
    }
  }
}

const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement
  // 隐藏错误的图片，让fallback显示
  img.style.display = 'none'
}

const manageWallet = (wallet: Wallet) => {
  console.log('Manage wallet:', wallet)
  // TODO: 实现钱包管理功能
  closeDropdown()
}

const createNewWallet = () => {
  router.push('/select-chain')
  closeDropdown()
}

const importWallet = () => {
  router.push('/import-wallet')
  closeDropdown()
}

// 点击外部关闭下拉菜单
const handleClickOutside = (event: Event) => {
  const target = event.target as Element
  if (!target.closest('.wallet-selector')) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style lang="scss" scoped>
.wallet-selector {
  position: relative;
  z-index: 1000;
}

.current-wallet {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  background: transparent;
  border: none;
  border-radius: 0;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 200px;
  max-width: 280px;

  &:hover {
    background: transparent;
  }

  .wallet-info {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;

    .wallet-avatar-container {
      position: relative;
      width: 32px;
      height: 32px;

      .wallet-avatar {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
      }

      .wallet-avatar-fallback {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 16px;
      }
    }

    .wallet-details {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .wallet-name {
        font-size: 14px;
        font-weight: 600;
        color: #f1f5f9;
        line-height: 1;
      }

      .wallet-chain {
        font-size: 11px;
        color: #94a3b8;
        line-height: 1;
      }
    }
  }

  .dropdown-icon {
    color: #94a3b8;
    font-size: 16px;
    transition: transform 0.3s ease;

    &.rotated {
      transform: rotate(180deg);
    }
  }
}

.dropdown-menu {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0;
  box-shadow: none;
  margin: 0;
  overflow-y: auto;
  z-index: 1001;
  display: flex;
  flex-direction: column;
}

.wallet-list-container {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.section-title {
  padding: 0 0 16px 0;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.wallet-list {
  display: flex;
  flex-direction: column;
  gap: 12px;



.wallet-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);

    &:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    &.active {
      background: rgba(99, 102, 241, 0.1);
      border-left: 3px solid #6366f1;
    }

    .wallet-avatar-container {
      position: relative;
      width: 40px;
      height: 40px;
      flex-shrink: 0;

      .wallet-avatar {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
      }

      .wallet-avatar-fallback {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 20px;
      }
    }

    .wallet-info {
      flex: 1;
      min-width: 0;

      .wallet-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;

        .wallet-name {
          font-size: 14px;
          font-weight: 600;
          color: #f1f5f9;
        }

        .wallet-chain-badge {
          background: rgba(99, 102, 241, 0.2);
          color: #6366f1;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }
      }

      .wallet-address-row {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-bottom: 2px;
      }

      .wallet-address {
        font-size: 12px;
        color: #94a3b8;
        font-family: 'Monaco', 'Menlo', monospace;
        flex: 1;
        min-width: 0;
      }

      .copy-address-btn {
        width: 16px;
        height: 16px;
        border-radius: 0;
        background: transparent;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
        color: #64748b;
        font-size: 12px;
        flex-shrink: 0;
        padding: 0;
      }

      .copy-address-btn:hover {
        color: #94a3b8;
        transform: scale(1.1);
      }

      .copy-address-btn:active {
        transform: scale(0.95);
      }

      .copy-address-btn .ri-check-line {
        color: #10b981;
      }

      .kadena-chain {
        font-size: 11px;
        color: #f59e0b;
        font-weight: 500;
      }
    }

    .manage-btn {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 6px;
      border-radius: 6px;
      transition: all 0.3s ease;
      flex-shrink: 0;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #f1f5f9;
      }

      i {
        font-size: 16px;
      }
    }
  }
}

.divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 8px 16px;
}

.actions {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);

  .action-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 12px;
    background: none;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #f1f5f9;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.2);
    }

    &.create-btn:hover {
      background: rgba(34, 197, 94, 0.1);
      border-color: #22c55e;
      color: #22c55e;
    }

    &.import-btn:hover {
      background: rgba(59, 130, 246, 0.1);
      border-color: #3b82f6;
      color: #3b82f6;
    }

    i {
      font-size: 16px;
    }
  }
}

.backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

/* 滚动条样式 */
.dropdown-menu::-webkit-scrollbar {
  width: 4px;
}

.dropdown-menu::-webkit-scrollbar-track {
  background: transparent;
}

.dropdown-menu::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.dropdown-menu::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
