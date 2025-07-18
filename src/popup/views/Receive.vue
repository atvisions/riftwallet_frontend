<template>
  <ResponsiveLayout
    title="Receive"
    :show-header="true"
    :show-footer="false"
    :scrollable="true"
    @back="$router.go(-1)"
  >
    <!-- 自定义头部 -->
    <template #header>
      <div class="page-header">
        <div class="header-left">
          <button @click="$router.go(-1)" class="back-button">
            <i class="ri-arrow-left-line"></i>
          </button>
          <h1 class="header-title">Receive</h1>
        </div>
      </div>
    </template>

    <!-- 主要内容 -->
    <div class="page-content">
      <!-- 钱包信息卡片 -->
      <div class="wallet-card">
        <div class="wallet-info">
          <div class="wallet-avatar">
            <img
              v-if="currentWallet?.avatar"
              :src="currentWallet.avatar"
              :alt="currentWallet.name"
              class="avatar-image"
            >
            <div v-else class="avatar-fallback">
              <i class="ri-wallet-3-line"></i>
            </div>
          </div>
          <div class="wallet-details">
            <h2 class="wallet-name">{{ currentWallet?.name || 'My Wallet' }}</h2>
            <div class="wallet-chain">{{ getChainName(currentWallet?.chain) }}</div>
          </div>
        </div>
      </div>

      <!-- QR码区域 -->
      <div class="qr-section">
        <div class="qr-container">
          <div class="qr-code">
            <canvas ref="qrCanvas"></canvas>
          </div>
          <div class="qr-overlay">
            <div class="qr-logo">
              <i class="ri-qr-code-line"></i>
            </div>
          </div>
        </div>

        <!-- 地址信息 -->
        <div class="address-section">
          <div class="address-label">Your {{ getChainName(currentWallet?.chain) }} Address</div>
          <div class="address-container">
            <div class="address-text">{{ formatAddress(currentWallet?.address) }}</div>
            <button @click="copyAddress" class="copy-icon-btn" :class="{ 'copied': copied }">
              <i :class="copied ? 'ri-check-line' : 'ri-file-copy-line'"></i>
            </button>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <button @click="copyAddress" class="primary-btn" :class="{ 'copied': copied }">
            <i :class="copied ? 'ri-check-line' : 'ri-file-copy-line'"></i>
            <span>{{ copied ? 'Copied!' : 'Copy Address' }}</span>
          </button>
          <button @click="shareAddress" class="secondary-btn">
            <i class="ri-share-line"></i>
            <span>Share</span>
          </button>
        </div>

        <!-- 提示信息 -->
        <div class="info-card">
          <div class="info-icon">
            <i class="ri-information-line"></i>
          </div>
          <div class="info-content">
            <div class="info-title">Send only {{ getChainName(currentWallet?.chain) }} assets</div>
            <div class="info-text">
              Sending other assets may result in permanent loss.
            </div>
          </div>
        </div>
      </div>
    </div>
  </ResponsiveLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useWalletStore } from '@shared/stores/wallet'
import { copyToClipboard, formatAddress } from '@shared/utils'
import { CHAIN_CONFIG } from '@shared/constants'
import ResponsiveLayout from '@/popup/components/ResponsiveLayout.vue'
import QRCode from 'qrcode'

const walletStore = useWalletStore()
const qrCanvas = ref<HTMLCanvasElement>()
const copied = ref(false)

const currentWallet = computed(() => walletStore.currentWallet)

// 获取链的友好名称
const getChainName = (chainCode?: string) => {
  if (!chainCode) return 'Unknown'
  return (CHAIN_CONFIG as any)[chainCode]?.name || chainCode
}

const copyAddress = async () => {
  if (currentWallet.value?.address) {
    await copyToClipboard(currentWallet.value.address)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

const shareAddress = async () => {
  if (currentWallet.value?.address && navigator.share) {
    try {
      await navigator.share({
        title: `${currentWallet.value.name} Address`,
        text: `My ${getChainName(currentWallet.value.chain)} wallet address`,
        url: currentWallet.value.address
      })
    } catch (error) {
      // 如果分享失败，回退到复制
      copyAddress()
    }
  } else {
    // 浏览器不支持 Web Share API，回退到复制
    copyAddress()
  }
}

onMounted(() => {
  if (qrCanvas.value && currentWallet.value?.address) {
    QRCode.toCanvas(qrCanvas.value, currentWallet.value.address, {
      width: 240,
      margin: 2,
      color: {
        dark: '#1e293b',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    }, (error) => {
      if (error) console.error('QR code generation failed:', error)
    })
  }
})
</script>

<style lang="scss" scoped>
// 自定义头部样式
.page-header {
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
.page-content {
  padding: 20px;
  max-width: 420px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

// 钱包信息卡片
.wallet-card {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 20px;
  padding: 20px;
  backdrop-filter: blur(10px);
}

.wallet-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.wallet-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;

  .avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-fallback {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 24px;
  }
}

.wallet-details {
  flex: 1;
  min-width: 0;
}

.wallet-name {
  font-size: 20px;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0 0 4px 0;
}

.wallet-chain {
  font-size: 14px;
  color: #94a3b8;
  background: rgba(148, 163, 184, 0.1);
  padding: 4px 12px;
  border-radius: 12px;
  display: inline-block;
}

// QR码区域
.qr-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.qr-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-code {
  background: white;
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  position: relative;

  canvas {
    display: block;
    border-radius: 12px;
  }
}

.qr-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.qr-logo {
  width: 40px;
  height: 40px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  i {
    font-size: 20px;
    color: #6366f1;
  }
}

// 地址信息
.address-section {
  width: 100%;
  text-align: center;
}

.address-label {
  font-size: 14px;
  color: #94a3b8;
  margin-bottom: 12px;
  font-weight: 500;
}

.address-container {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.address-text {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 14px;
  color: #f1f5f9;
  font-weight: 500;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.copy-icon-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(99, 102, 241, 0.2);
  color: #6366f1;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: rgba(99, 102, 241, 0.3);
    transform: scale(1.05);
  }

  &.copied {
    background: rgba(34, 197, 94, 0.2);
    color: #22c55e;
  }

  i {
    font-size: 16px;
  }
}

// 操作按钮
.action-buttons {
  display: flex;
  gap: 12px;
  width: 100%;
}

.primary-btn, .secondary-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 20px;
  border: none;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  i {
    font-size: 18px;
  }
}

.primary-btn {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  &.copied {
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    box-shadow: 0 4px 16px rgba(34, 197, 94, 0.3);
  }
}

.secondary-btn {
  background: rgba(255, 255, 255, 0.05);
  color: #f1f5f9;
  border: 1px solid rgba(255, 255, 255, 0.1);

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
}

// 信息卡片
.info-card {
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.2);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  width: 100%;
}

.info-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(251, 191, 36, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  i {
    font-size: 14px;
    color: #fbbf24;
  }
}

.info-content {
  flex: 1;
  min-width: 0;
}

.info-title {
  font-size: 14px;
  font-weight: 600;
  color: #fbbf24;
  margin-bottom: 4px;
}

.info-text {
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.4;
}

// 响应式设计
@media (max-width: 480px) {
  .page-content {
    padding: 16px;
    gap: 20px;
  }

  .wallet-card {
    padding: 16px;
  }

  .wallet-avatar {
    width: 48px;
    height: 48px;
  }

  .wallet-name {
    font-size: 18px;
  }

  .qr-code {
    padding: 16px;
  }

  .action-buttons {
    flex-direction: column;
    gap: 8px;
  }

  .primary-btn, .secondary-btn {
    padding: 14px 16px;
    font-size: 15px;
  }
}
</style>
