<template>
  <PageContainer
    title="Receive"
    :show-header="true"
    :show-footer="false"
    :show-back-button="true"
    :custom-back-action="() => $router.go(-1)"
    max-width="420px"
    padding="0"
    :centered="true"
  >
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
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useWalletStore } from '@shared/stores/wallet'
import { copyToClipboard } from '@shared/utils'
import PageContainer from '@/popup/components/PageContainer.vue'

const walletStore = useWalletStore()
const qrCanvas = ref<HTMLCanvasElement>()

const currentWallet = computed(() => walletStore.currentWallet)

const copyAddress = async () => {
  if (currentWallet.value?.address) {
    await copyToClipboard(currentWallet.value.address)
  }
}

onMounted(() => {
  // TODO: Generate QR code
})
</script>

<style lang="scss" scoped>
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
