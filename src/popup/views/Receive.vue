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
      <div class="qr-section">
        <div class="qr-code">
          <canvas ref="qrCanvas"></canvas>
        </div>
        <p class="address">{{ currentWallet?.address }}</p>
        <button @click="copyAddress" class="copy-btn">
          <i class="ri-file-copy-line"></i>
          Copy Address
        </button>
      </div>
  </div>
  </ResponsiveLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useWalletStore } from '@shared/stores/wallet'
import { copyToClipboard } from '@shared/utils'
import ResponsiveLayout from '@/popup/components/ResponsiveLayout.vue'
import QRCode from 'qrcode'

const walletStore = useWalletStore()
const qrCanvas = ref<HTMLCanvasElement>()

const currentWallet = computed(() => walletStore.currentWallet)

const copyAddress = async () => {
  if (currentWallet.value?.address) {
    await copyToClipboard(currentWallet.value.address)
  }
}

onMounted(() => {
  if (qrCanvas.value && currentWallet.value?.address) {
    QRCode.toCanvas(qrCanvas.value, currentWallet.value.address, {
      width: 200,
      margin: 1
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
  padding: 24px;
  max-width: 420px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.receive-page {
  width: 375px;
  height: 600px; // 固定高度，适应插件环境
  background: #0F172A;
  color: #f1f5f9;
}

.header {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #1E293B;
  
  .back-btn {
    background: none;
    border: none;
    color: #6366f1;
    font-size: 20px;
    margin-right: 16px;
    cursor: pointer;
  }
  
  h1 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }
}

.content {
  padding: 24px;
  text-align: center;
}

.qr-section {
  .qr-code {
    width: 200px;
    height: 200px;
    margin: 0 auto 24px;
    background: white;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .address {
    word-break: break-all;
    background: #1E293B;
    padding: 12px;
    border-radius: 8px;
    margin: 0 0 16px 0;
    font-family: monospace;
    font-size: 14px;
  }
  
  .copy-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 12px;
    background: #6366f1;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    
    &:hover {
      background: #5856d6;
    }
  }
}
</style>
