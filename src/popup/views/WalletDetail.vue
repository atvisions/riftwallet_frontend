<template>
  <PageContainer
    title="Wallet Details"
    :show-header="true"
    :show-footer="false"
    :show-back-button="true"
    :custom-back-action="() => $router.go(-1)"
    max-width="420px"
    padding="24px"
    :centered="true"
  >
    <div v-if="wallet" class="wallet-info">
      <div class="wallet-avatar">
        <img :src="wallet.avatar || defaultAvatar" :alt="wallet.name">
      </div>
      <h2>{{ wallet.name }}</h2>
      <p class="wallet-address">{{ formatAddress(wallet.address) }}</p>
      <p class="wallet-chain">{{ getChainName(wallet.chain) }}</p>
    </div>

    <div v-else class="loading">
      <div class="loading-spinner"></div>
      <p>Loading wallet details...</p>
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useWalletStore } from '@shared/stores/wallet'
import PageContainer from '@/popup/components/PageContainer.vue'
import { CHAIN_CONFIG } from '@shared/constants'
import { formatAddress } from '@shared/utils'

const route = useRoute()
const walletStore = useWalletStore()

const wallet = ref(null)
const defaultAvatar = 'https://readdy.ai/api/search-image?query=abstract%20modern%20avatar%20icon%2C%20gradient%20colors%2C%20professional%20looking&width=64&height=64&seq=1&orientation=squarish'

// 获取链的友好名称
const getChainName = (chainCode: string) => {
  return (CHAIN_CONFIG as any)[chainCode]?.name || chainCode
}

onMounted(() => {
  const walletId = parseInt(route.params.id as string)
  wallet.value = walletStore.wallets.find(w => w.id === walletId) || null
})
</script>

<style lang="scss" scoped>
.wallet-detail {
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
}

.wallet-info {
  text-align: center;
  
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
  }
  
  .wallet-address {
    color: #9ca3af;
    font-size: 14px;
    margin: 0 0 4px 0;
  }
  
  .wallet-chain {
    color: #6366f1;
    font-size: 14px;
    font-weight: 500;
    margin: 0;
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
