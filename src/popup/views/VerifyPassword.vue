<template>
  <div class="verify-password-page">
    <!-- Logo 和标题区域 -->
    <div class="header-section">
      <div class="logo-container">
        <img src="/icons/icon128.png" alt="Riftwallet" class="logo">
      </div>
      <h1 class="app-name">{{ APP_CONFIG.NAME }}</h1>
      <p class="form-description">
          Enter your password to access your wallet
        </p>
    </div>
    
    <!-- 密码验证表单 -->
    <div class="form-section">
      <form @submit.prevent="handleVerifyPassword" class="password-form">
        <div class="input-group">
          <label for="password">Password</label>
          <div class="input-wrapper">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Enter your password"
              class="password-input"
              :class="{ 'error': error }"
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
          <div v-if="error" class="error-message">
            {{ error }}
          </div>
        </div>
        
        <button
          type="submit"
          :disabled="!password || loading"
          class="submit-btn"
        >
          <div v-if="loading" class="loading-spinner"></div>
          <span v-else>Verify Password</span>
        </button>
      </form>
    </div>
    

    

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@shared/stores/auth'
import { useWalletStore } from '@shared/stores/wallet'
import { APP_CONFIG } from '@shared/constants'

// 添加详细日志来诊断问题
console.log('🔐 VerifyPassword.vue - 页面开始加载')
console.log('🌐 当前环境信息:', {
  href: window.location.href,
  pathname: window.location.pathname,
  hash: window.location.hash,
  windowSize: { width: window.innerWidth, height: window.innerHeight }
})

// 添加详细日志来诊断问题
console.log('🔐 VerifyPassword.vue - 组件开始加载')
console.log('🌐 当前环境信息:', {
  href: window.location.href,
  pathname: window.location.pathname,
  windowSize: { width: window.innerWidth, height: window.innerHeight }
})

const router = useRouter()
const authStore = useAuthStore()
const walletStore = useWalletStore()

// 响应式数据
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

// 处理密码验证
const handleVerifyPassword = async () => {
  console.log('🔐 开始密码验证流程')
  console.log('📝 输入的密码长度:', password.value.length)

  if (!password.value) {
    console.log('❌ 密码为空，停止验证')
    return
  }

  try {
    loading.value = true
    error.value = ''

    console.log('🔄 调用 authStore.verifyPaymentPassword')
    console.log('🏪 当前 authStore 状态:', {
      isAuthenticated: authStore.isAuthenticated,
      deviceId: authStore.deviceId,
      hasPaymentPassword: authStore.hasPaymentPassword,
      isPasswordSessionValid: authStore.isPasswordSessionValid
    })

    const isValid = await authStore.verifyPaymentPassword(password.value)
    console.log('✅ 密码验证结果:', isValid)

    if (isValid) {
      console.log('🎉 密码验证成功，检查钱包状态')

      // 验证成功后检查认证状态
      console.log('🔍 验证后的 authStore 状态:', {
        isAuthenticated: authStore.isAuthenticated,
        deviceId: authStore.deviceId,
        hasPaymentPassword: authStore.hasPaymentPassword,
        isPasswordSessionValid: authStore.isPasswordSessionValid
      })

      // 等待 isPasswordSessionValid 响应式更新
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 50))

      // 加载钱包数据并检查是否有钱包
      console.log('📱 开始加载钱包列表')
      await walletStore.loadWallets()
      console.log('📊 钱包加载完成，钱包数量:', walletStore.wallets.length)

      if (walletStore.wallets.length > 0) {
        // 有钱包，跳转到首页
        console.log('🏠 有钱包，从密码验证页面跳转到首页')
        // 使用 replace 而不是 push，避免在历史记录中留下验证页面
        await router.replace('/')
        console.log('✅ 路由跳转完成')
      } else {
        // 没有钱包，跳转到钱包选择页面
        console.log('💼 没有钱包，从密码验证页面跳转到钱包选择页面')
        await router.replace('/wallet-choice')
        console.log('✅ 路由跳转完成')
      }
    } else {
      console.log('❌ 密码验证失败')
      error.value = 'Invalid password. Please try again.'
    }
  } catch (err) {
    console.error('💥 密码验证过程中发生错误:', err)
    error.value = err instanceof Error ? err.message : 'Verification failed'
  } finally {
    loading.value = false
    console.log('�� 密码验证流程结束')
  }
}

// 页面挂载时的检查
onMounted(() => {
  console.log('🔐 VerifyPassword.vue - 页面挂载完成')
  console.log('🏪 挂载时的 authStore 状态:', {
    isAuthenticated: authStore.isAuthenticated,
    deviceId: authStore.deviceId,
    hasPaymentPassword: authStore.hasPaymentPassword,
    isPasswordSessionValid: authStore.isPasswordSessionValid
  })
  console.log('📱 挂载时的 walletStore 状态:', {
    walletsCount: walletStore.wallets.length,
    currentWallet: walletStore.currentWallet
  })
  console.log('🌐 挂载时的路由信息:', {
    currentRoute: router.currentRoute.value.path,
    query: router.currentRoute.value.query,
    params: router.currentRoute.value.params
  })
})


</script>

<style lang="scss" scoped>
.verify-password-page {
  width: 375px;
  height: 600px; // 固定高度，适应插件环境
  background: #0F172A;
  color: #f1f5f9;
  overflow-y: auto;
  padding: 40px 24px 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

// Header Section
.header-section {
  text-align: center;
  margin-bottom: 40px;
  width: 100%;

  .logo-container {
    margin-bottom: 20px;

    .logo {
      width: 80px;
      height: 80px;
      border-radius: 20px;
      box-shadow: 0 8px 32px rgba(99, 102, 241, 0.3);
    }
  }
  
  .app-name {
    font-size: 28px;
    font-weight: 700;
    margin: 0 0 8px 0;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .welcome-text {
    color: #9ca3af;
    font-size: 14px;
    margin: 0;
  }
}

// Form Section
.form-section {
  width: 100%;
  max-width: 320px;
  .form-header {
    text-align: center;
    margin-bottom: 32px;
    
    .security-icon {
      font-size: 48px;
      color: #6366f1;
      margin-bottom: 12px;
    }
    
    h2 {
      font-size: 20px;
      font-weight: 600;
      margin: 0 0 8px 0;
    }
    
    .form-description {
      color: #9ca3af;
      font-size: 14px;
      margin: 0;
    }
  }
}

// Password Form
.password-form {
  .input-group {
    margin-bottom: 24px;
    
    label {
      display: block;
      font-weight: 500;
      margin-bottom: 8px;
      color: #f1f5f9;
      font-size: 14px;
    }
    
    .input-wrapper {
      position: relative;
      
      .password-input {
        width: 100%;
        padding: 16px 48px 16px 16px;
        background: #1E293B;
        border: 2px solid #334155;
        border-radius: 12px;
        color: #f1f5f9;
        font-size: 16px;
        transition: all 0.2s ease;
        
        &:focus {
          outline: none;
          border-color: #6366f1;
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
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: #9ca3af;
        cursor: pointer;
        font-size: 18px;
        
        &:hover {
          color: #6366f1;
        }
      }
    }
    
    .error-message {
      color: #ef4444;
      font-size: 12px;
      margin-top: 8px;
      text-align: center;
    }
  }
}

// Submit Button
.submit-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(99, 102, 241, 0.3);
  }
  
  &:disabled {
    background: #374151;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}





@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
