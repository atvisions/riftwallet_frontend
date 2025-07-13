<template>
  <ResponsiveLayout
    title="Create Wallet"
    :show-header="true"
    :show-footer="true"
    :scrollable="true"
    @back="goBack"
  >
    <!-- 自定义头部 -->
    <template #header>
      <div class="page-header">
        <div class="header-left">
          <button @click="goBack" class="back-button">
            <i class="ri-arrow-left-line"></i>
          </button>
          <h1 class="header-title">Create Wallet</h1>
        </div>
      </div>
    </template>

    <!-- 主要内容 -->
    <div class="page-content">
      <div class="description">
        <h2>Enter Your Password</h2>
        <p>Enter your payment password to create the wallet with the verified seed phrase.</p>
      </div>

      <div class="password-section">
      <div class="input-group">
        <label for="password">Payment Password</label>
        <div class="input-wrapper">
          <input
            id="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Enter your password"
            class="password-input"
            :class="{ 'error': passwordError }"
            @input="validatePassword"
            autofocus
          >
          <button
            type="button"
            @click="showPassword = !showPassword"
            class="toggle-password"
          >
            <i :class="showPassword ? 'ri-eye-off-line' : 'ri-eye-line'"></i>
          </button>
        </div>
        <div v-if="passwordError" class="error-message">
          {{ passwordError }}
        </div>
      </div>

      <div class="error-message" v-if="error">
        <i class="ri-error-warning-line"></i>
        {{ error }}
      </div>
      </div>
    </div>

    <template #footer>
      <div class="footer">
        <button
          class="create-btn"
          :disabled="!canCreateWallet || submitting"
          @click="createWallet"
        >
          <span v-if="submitting">
            <i class="ri-loader-4-line animate-spin"></i>
            Creating & Loading Wallet...
          </span>
          <span v-else>
            Create Wallet
            <i class="ri-check-line"></i>
          </span>
        </button>
      </div>
    </template>
  </ResponsiveLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@shared/stores/auth'
import { useWalletStore } from '@shared/stores/wallet'
import { APP_CONFIG } from '@shared/constants'
import ResponsiveLayout from '@/popup/components/ResponsiveLayout.vue'

const router = useRouter()
const authStore = useAuthStore()
const walletStore = useWalletStore()

// 响应式数据
const password = ref('')
const showPassword = ref(false)
const passwordError = ref('')
const submitting = ref(false)
const error = ref('')

// 从 sessionStorage 获取的数据
const verifiedMnemonic = ref('')
const selectedChain = ref('')

// 计算属性
const canCreateWallet = computed(() => {
  return password.value.length >= 8 && !passwordError.value
})

// 返回上一页
const goBack = () => {
  router.go(-1)
}

// 验证密码
const validatePassword = () => {
  passwordError.value = ''
  
  if (password.value.length > 0 && password.value.length < 8) {
    passwordError.value = 'Password must be at least 8 characters long'
  }
}

// 创建钱包
const createWallet = async () => {
  if (!canCreateWallet.value) return
  
  try {
    submitting.value = true
    error.value = ''
    
    // 调用验证 API，创建钱包
    const response = await fetch(`${APP_CONFIG.API_BASE_URL}/wallets/verify_mnemonic/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        device_id: authStore.deviceId,
        chain: selectedChain.value,
        mnemonic: verifiedMnemonic.value,
        payment_password: password.value
      })
    })
    
    const data = await response.json()
    
    if (data.state === 'success') {
      // 创建成功，清除临时存储的数据
      sessionStorage.removeItem('generated_mnemonic')
      sessionStorage.removeItem('selected_chain')
      sessionStorage.removeItem('verified_mnemonic')

      console.log('🎉 Wallet created successfully:', data)
      console.log('📊 API response data:', JSON.stringify(data, null, 2))

      // API 返回的钱包数据在 data.data 中
      const responseData = data.data
      console.log('🆕 Response data from API:', responseData)

      // 检查响应结构：data.data.wallet 或 data.data
      let newWalletData = null
      if (responseData && responseData.wallet) {
        newWalletData = responseData.wallet
        console.log('📦 Found wallet in responseData.wallet:', newWalletData)
      } else if (responseData && responseData.id) {
        newWalletData = responseData
        console.log('📦 Found wallet in responseData directly:', newWalletData)
      } else {
        console.warn('❌ Unexpected response structure:', responseData)
      }

      // 先清除当前钱包，避免 loadWallets 恢复旧钱包
      // 注意：不能直接赋值，应该通过 store 方法处理

      // 重新加载钱包列表以获取最新数据（禁用自动选择钱包）
      console.log('🔄 Reloading wallet list...')
      await walletStore.loadWallets(false)
      console.log('📋 Current wallet list after reload:', walletStore.wallets.map(w => ({
        id: w.id,
        name: w.name,
        chain: w.chain,
        address: w.address.substring(0, 10) + '...'
      })))

      if (newWalletData && newWalletData.id) {
        console.log('🔍 Looking for wallet with ID:', newWalletData.id)

        // 从钱包列表中找到新创建的钱包
        const createdWallet = walletStore.wallets.find(w => w.id === newWalletData.id)

        if (createdWallet) {
          console.log('✅ Found created wallet:', createdWallet)
          // 设置新创建的钱包为当前钱包
          await walletStore.setCurrentWallet(createdWallet)
          console.log('🎯 New wallet set as current:', createdWallet.id, createdWallet.chain, createdWallet.name)
        } else {
          console.warn('❌ Created wallet not found in wallet list')
          console.log('🔍 Available wallet IDs:', walletStore.wallets.map(w => w.id))

          // 如果找不到，使用最新的钱包（通常是最后一个）
          if (walletStore.wallets.length > 0) {
            const latestWallet = walletStore.wallets[walletStore.wallets.length - 1]
            console.log('📌 Using latest wallet as fallback:', latestWallet)
            await walletStore.setCurrentWallet(latestWallet)
          }
        }
      } else {
        console.warn('❌ No wallet data in response')
        console.log('📄 Full response:', data)

        // 如果没有钱包数据，使用最新的钱包
        if (walletStore.wallets.length > 0) {
          const latestWallet = walletStore.wallets[walletStore.wallets.length - 1]
          console.log('📌 Using latest wallet as fallback:', latestWallet)
          await walletStore.setCurrentWallet(latestWallet)
        }
      }

      console.log('🏠 Current wallet before loading balance:', walletStore.currentWallet)

      // 等待余额数据加载完成
      if (walletStore.currentWallet && typeof walletStore.currentWallet.id === 'number') {
        console.log('⏳ Loading wallet balance before redirect...')
        await walletStore.loadWalletBalance(walletStore.currentWallet.id)
        console.log('✅ Wallet balance loaded, redirecting to home')
      }

      // 跳转到首页
      console.log('🏠 准备跳转到首页')
      console.log('🔐 跳转前的认证状态:', {
        isAuthenticated: authStore.isAuthenticated,
        hasPaymentPassword: authStore.hasPaymentPassword,
        isPasswordSessionValid: authStore.isPasswordSessionValid
      })
      console.log('📱 跳转前的钱包状态:', {
        walletsCount: walletStore.wallets.length,
        currentWallet: walletStore.currentWallet?.id
      })

      await router.push('/')
      console.log('✅ 路由跳转完成，当前路径:', router.currentRoute.value.path)
    } else {
      throw new Error(data.message || 'Failed to create wallet')
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to create wallet'
  } finally {
    submitting.value = false
  }
}

// 加载数据
const loadData = () => {
  const mnemonic = sessionStorage.getItem('verified_mnemonic')
  const chain = sessionStorage.getItem('selected_chain')
  
  if (!mnemonic || !chain) {
    error.value = 'Missing wallet creation data. Please start over.'
    return
  }
  
  verifiedMnemonic.value = mnemonic
  selectedChain.value = chain
}

// 生命周期
onMounted(() => {
  loadData()
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
/* 移除旧的页面容器样式，使用 ResponsiveLayout */

/* 移除旧的 .header 样式，使用 ResponsiveLayout 的头部 */

/* 移除冲突的 .content 样式，使用 ResponsiveLayout 的滚动管理 */

.page-content {
  /* 让内容自然流动，不设置滚动 */

  .description {
    text-align: center;
    margin-bottom: 32px;

    h2 {
      font-size: 24px;
      font-weight: 700;
      margin: 0 0 12px 0;
      color: #f1f5f9;
    }
    
    p {
      font-size: 16px;
      color: #94a3b8;
      margin: 0;
      line-height: 1.5;
    }
  }
}

.password-section {
  .input-group {
    label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #f1f5f9;
      margin-bottom: 8px;
    }
    
    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      
      .password-input {
        width: 100%;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 16px 50px 16px 16px;
        color: #f1f5f9;
        font-size: 16px;
        outline: none;
        transition: all 0.3s ease;
        
        &:focus {
          border-color: #6366f1;
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        
        &.error {
          border-color: #ef4444;
        }
        
        &::placeholder {
          color: #64748b;
        }
      }
      
      .toggle-password {
        position: absolute;
        right: 12px;
        background: none;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 8px;
        border-radius: 6px;
        transition: color 0.3s ease;
        
        &:hover {
          color: #f1f5f9;
        }
        
        i {
          font-size: 18px;
        }
      }
    }
  }
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  padding: 12px;
  color: #fca5a5;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  
  i {
    font-size: 16px;
  }
}

.footer {
  padding: 20px;
  border-top: 1px solid #334155;
  
  .create-btn {
    width: 100%;
    background: #6366f1;
    color: white;
    border: none;
    padding: 16px;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    
    &:hover:not(:disabled) {
      background: #5855eb;
      transform: translateY(-1px);
    }
    
    &:disabled {
      background: #374151;
      color: #6b7280;
      cursor: not-allowed;
      transform: none;
    }
    
    .animate-spin {
      animation: spin 1s linear infinite;
    }
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
