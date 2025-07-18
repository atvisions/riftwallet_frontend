<template>
  <ResponsiveLayout
    title="Confirm Seed Phrase"
    :show-header="true"
    :show-footer="true"
    :scrollable="true"
    padding="16px"
    @back="goBack"
  >
    <!-- 自定义头部 -->
    <template #header>
      <div class="page-header">
        <div class="header-left">
          <button @click="goBack" class="back-button">
            <i class="ri-arrow-left-line"></i>
          </button>
          <h1 class="header-title">Confirm Seed Phrase</h1>
        </div>
      </div>
    </template>

    <!-- 主要内容 -->
    <div class="confirm-container">
        <!-- 进度指示器 -->
        <div class="progress-section">
          <div class="progress-bar">
            <div class="progress-fill" style="width: 100%"></div>
          </div>
          <div class="progress-text">Step 2 of 2</div>
        </div>

        <!-- 头部信息 -->
        <div class="header-section">
          <div class="header-icon">
            <i class="ri-shield-check-line"></i>
          </div>
          <h2>Confirm Recovery Phrase</h2>
          <p>Enter your 12-word recovery phrase to verify you've saved it correctly.</p>
        </div>

        <!-- 输入区域 -->
        <div class="input-card">
          <div class="card-header">
            <h3>Enter Your Recovery Phrase</h3>
            <div class="input-actions">
              <button class="paste-btn" @click="pasteMnemonic" :disabled="pasting">
                <i v-if="pasting" class="ri-loader-4-line animate-spin"></i>
                <i v-else class="ri-clipboard-line"></i>
                <span>{{ pasting ? 'Pasting...' : 'Paste' }}</span>
              </button>
              <button class="clear-btn" @click="clearInput" :disabled="!hasInput">
                <i class="ri-delete-bin-line"></i>
                <span>Clear</span>
              </button>
            </div>
          </div>

          <div class="word-grid">
            <div
              v-for="(word, index) in inputWords"
              :key="index"
              class="word-input-item"
              :class="{ 'filled': word.trim() }"
            >
              <span class="word-number">{{ index + 1 }}</span>
              <input
                v-model="inputWords[index]"
                type="text"
                :placeholder="`Word ${index + 1}`"
                class="word-input"
                @input="validateInput"
                autocomplete="off"
                spellcheck="false"
              />
            </div>
          </div>
        </div>

        <!-- 密码验证区域 -->
        <div class="password-card">
          <div class="card-header">
            <div class="password-icon">
              <i class="ri-lock-line"></i>
            </div>
            <div class="password-info">
              <h3>Verify Your Password</h3>
              <p>Enter your wallet password to complete setup</p>
            </div>
          </div>

          <div class="password-input-group">
            <input
              v-model="password"
              type="password"
              placeholder="Enter your wallet password"
              class="password-input"
              @input="validatePassword"
            />
            <div class="password-strength" :class="passwordStrengthClass">
              <div class="strength-bar"></div>
            </div>
          </div>
        </div>

        <div class="error-message" v-if="error">
          <i class="ri-error-warning-line"></i>
          {{ error }}
        </div>
      </div>

    <template #footer>
      <div class="bottom-section">
        <button
          class="confirm-btn"
          :disabled="!isValidInput || !isValidPassword || submitting"
          @click="confirmMnemonic"
        >
          <i v-if="submitting" class="ri-loader-4-line animate-spin"></i>
          <i v-else class="ri-add-line"></i>
          <span>{{ submitting ? 'Creating Wallet...' : 'Create Wallet' }}</span>
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
const inputWords = ref<string[]>(Array(12).fill(''))
const password = ref('')
const submitting = ref(false)
const pasting = ref(false)
const error = ref('')
const originalMnemonic = ref('')
const selectedChain = ref('')



// 计算属性
const isValidInput = computed(() => {
  return inputWords.value.every(word => word.trim().length > 0)
})

const isValidPassword = computed(() => {
  return password.value.length >= 6
})

const hasInput = computed(() => {
  return inputWords.value.some(word => word.trim().length > 0)
})

const passwordStrengthClass = computed(() => {
  const len = password.value.length
  if (len === 0) return ''
  if (len < 6) return 'weak'
  if (len < 10) return 'medium'
  return 'strong'
})



// 返回上一页
const goBack = () => {
  router.go(-1)
}

// 验证输入
const validateInput = () => {
  error.value = ''
}

// 验证密码
const validatePassword = () => {
  error.value = ''
  if (password.value.length > 0 && password.value.length < 6) {
    error.value = 'Password must be at least 6 characters'
    return
  }
}



// 从剪贴板粘贴
const pasteMnemonic = async () => {
  if (pasting.value) return // 防止重复点击

  try {
    // 设置加载状态
    pasting.value = true
    error.value = ''

    // 检查剪贴板 API 是否可用
    if (!navigator.clipboard) {
      error.value = 'Clipboard API not supported. Please type your seed phrase manually.'
      return
    }

    // 首先检查权限
    try {
      const permission = await navigator.permissions.query({ name: 'clipboard-read' as PermissionName })
      if (permission.state === 'denied') {
        error.value = 'Clipboard access denied. Please allow clipboard permissions in your browser settings or type manually.'
        return
      }
    } catch (permErr) {
      console.log('Permission check not supported, proceeding with clipboard read')
    }

    // 使用现代剪贴板 API
    const text = await navigator.clipboard.readText()
    console.log('Clipboard content:', text)
    processPastedText(text)

  } catch (err: any) {
    console.error('Clipboard error:', err)
    if (err.name === 'NotAllowedError') {
      error.value = 'Clipboard access denied. Please allow clipboard permissions or type manually.'
    } else if (err.name === 'NotFoundError') {
      error.value = 'No text found in clipboard. Please go back to the previous page and copy your seed phrase first.'
    } else if (err.name === 'SecurityError') {
      error.value = 'Clipboard access blocked by security policy. Please type your seed phrase manually.'
    } else {
      error.value = 'Failed to read from clipboard. Please go back and copy your seed phrase, or type manually.'
    }
  } finally {
    // 清除加载状态
    pasting.value = false
  }
}

// 处理粘贴的文本
const processPastedText = (text: string) => {
  if (!text || !text.trim()) {
    error.value = 'No text found in clipboard. Please go back to the previous page and copy your seed phrase first.'
    return
  }

  const words = text.trim().split(/\s+/).filter(word => word.length > 0)

  console.log('Pasted text:', text)
  console.log('Parsed words:', words)

  if (words.length === 12) {
    inputWords.value = words.map(word => word.toLowerCase().trim())
    validateInput()
    // 清除错误信息
    error.value = ''
    // 成功提示
    setTimeout(() => {
      if (!error.value) {
        console.log('Successfully pasted 12 words')
      }
    }, 100)
  } else if (words.length > 12) {
    error.value = `Too many words (${words.length}). Please paste exactly 12 words.`
  } else if (words.length > 0) {
    error.value = `Not enough words (${words.length}). Please paste exactly 12 words.`
  } else {
    error.value = 'Invalid seed phrase format. Please paste 12 words separated by spaces.'
  }
}

// 清除输入
const clearInput = () => {
  inputWords.value = Array(12).fill('')
  error.value = ''
}

// 确认助记词并创建钱包
const confirmMnemonic = async () => {
  if (!isValidInput.value || !isValidPassword.value) return

  try {
    error.value = ''
    submitting.value = true

    const inputMnemonic = inputWords.value.join(' ').toLowerCase()
    const originalMnemonicLower = originalMnemonic.value.toLowerCase()

    // 验证助记词是否匹配
    if (inputMnemonic !== originalMnemonicLower) {
      error.value = 'The seed phrase you entered does not match. Please try again.'
      return
    }

    // 调用验证助记词API
    const response = await fetch(`${APP_CONFIG.API_BASE_URL}/wallets/verify_mnemonic/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        device_id: authStore.deviceId,
        chain: selectedChain.value,
        mnemonic: inputMnemonic,
        payment_password: password.value
      })
    })

    const data = await response.json()

    if (!response.ok || data.state !== 'success') {
      throw new Error(data.message || 'Failed to verify mnemonic')
    }

    // 验证成功，重新加载钱包列表
    if (data.data && data.data.success) {
      console.log('✅ Wallet verification successful, reloading wallets...')
      await walletStore.loadWallets()
      console.log('📋 Wallets loaded:', walletStore.wallets.length)

      // 确保设置当前钱包（选择最新创建的钱包）
      if (walletStore.wallets.length > 0) {
        // 如果API返回了钱包信息，尝试找到对应的钱包
        if (data.data.wallet && data.data.wallet.id) {
          console.log('🔍 Looking for wallet with ID:', data.data.wallet.id)
          const newWallet = walletStore.wallets.find(w => w.id === data.data.wallet.id)
          if (newWallet) {
            console.log('✅ Found new wallet, setting as current:', newWallet.name)
            await walletStore.setCurrentWallet(newWallet)
          } else {
            console.log('❌ New wallet not found, selecting first wallet')
            await walletStore.setCurrentWallet(walletStore.wallets[0])
          }
        } else {
          console.log('📝 No wallet ID in response, selecting first wallet')
          await walletStore.setCurrentWallet(walletStore.wallets[0])
        }
        console.log('🎯 Current wallet set:', walletStore.currentWallet?.name)
      } else {
        console.log('❌ No wallets found after reload')
      }
    }

    // 清除临时数据
    sessionStorage.removeItem('generated_mnemonic')
    sessionStorage.removeItem('selected_chain')
    console.log('🧹 Temporary data cleared')

    // 跳转到首页
    console.log('🚀 Navigating to home page...')
    router.push('/')
    console.log('✅ Navigation initiated')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Verification failed'
  } finally {
    submitting.value = false
  }
}

// 加载原始助记词和链信息
const loadMnemonicData = () => {
  const generatedMnemonic = sessionStorage.getItem('generated_mnemonic')
  const chainData = sessionStorage.getItem('selected_chain')
  
  if (generatedMnemonic && chainData) {
    originalMnemonic.value = generatedMnemonic
    selectedChain.value = chainData
  } else {
    error.value = 'No mnemonic data found. Please go back and start over.'
  }
}

// 生命周期
onMounted(() => {
  loadMnemonicData()
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

// 主容器
.confirm-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 420px;
  margin: 0 auto;
  width: 100%;
  min-height: calc(100vh - 140px);
  flex: 1;
  padding-bottom: 120px;
}

// 进度指示器
.progress-section {
  text-align: center;
  margin-bottom: 8px;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
}

// 头部区域
.header-section {
  text-align: center;
  margin-bottom: 8px;
}

.header-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  box-shadow: 0 8px 32px rgba(34, 197, 94, 0.3);

  i {
    font-size: 28px;
    color: white;
  }
}

.header-section h2 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #f1f5f9;
}

.header-section p {
  color: #94a3b8;
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  max-width: 320px;
  margin: 0 auto;
}

// 输入卡片
.input-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #f1f5f9;
    margin: 0;
  }
}

.input-actions {
  display: flex;
  gap: 8px;
}

.paste-btn, .clear-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 10px;
  padding: 6px 12px;
  color: #6366f1;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: rgba(99, 102, 241, 0.25);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  i {
    font-size: 12px;
  }
}

.clear-btn {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;

  &:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.25);
  }
}

.word-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  min-width: 0;
}

.word-input-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  min-height: 60px;
  justify-content: center;

  &.filled {
    border-color: rgba(99, 102, 241, 0.3);
    background: rgba(99, 102, 241, 0.05);
  }

  &:focus-within {
    border-color: rgba(99, 102, 241, 0.5);
    background: rgba(99, 102, 241, 0.08);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
}

.word-number {
  font-size: 11px;
  color: white;
  font-weight: 700;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 6px;
  flex-shrink: 0;
}

.word-input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: #f1f5f9;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  font-family: 'Monaco', 'Menlo', monospace;

  &::placeholder {
    color: #64748b;
    font-size: 12px;
  }
}

// 密码卡片
.password-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.password-card .card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.password-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  i {
    font-size: 18px;
    color: white;
  }
}

.password-info {
  flex: 1;

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #f1f5f9;
    margin: 0 0 4px 0;
  }

  p {
    font-size: 13px;
    color: #94a3b8;
    margin: 0;
  }
}

.password-input-group {
  position: relative;
}

.password-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  color: #f1f5f9;
  font-size: 16px;
  font-weight: 500;
  outline: none;
  transition: all 0.2s ease;

  &::placeholder {
    color: #64748b;
  }

  &:focus {
    border-color: rgba(99, 102, 241, 0.5);
    background: rgba(99, 102, 241, 0.05);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
}

.password-strength {
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  margin-top: 8px;
  overflow: hidden;

  .strength-bar {
    height: 100%;
    width: 0;
    border-radius: 2px;
    transition: all 0.3s ease;
  }

  &.weak .strength-bar {
    width: 33%;
    background: #ef4444;
  }

  &.medium .strength-bar {
    width: 66%;
    background: #f59e0b;
  }

  &.strong .strength-bar {
    width: 100%;
    background: #22c55e;
  }
}

// 错误信息
.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 12px;
  padding: 16px;
  color: #fca5a5;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 12px;

  i {
    font-size: 18px;
    flex-shrink: 0;
  }
}

// 响应式设计
@media (max-width: 480px) {
  .confirm-container {
    padding-bottom: 100px;
    gap: 20px;
  }

  .word-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .word-input-item {
    min-height: 50px;
    padding: 10px;
  }

  .input-actions {
    flex-direction: column;
    gap: 6px;
  }

  .paste-btn, .clear-btn {
    font-size: 11px;
    padding: 8px 12px;
  }
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

.confirm-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 420px;
  margin: 0 auto;
  width: 100%;
  flex: 1;
  padding-bottom: 120px; /* 为底部固定按钮留出空间 */
}

.header-section {
  text-align: center;
  margin-bottom: 8px;

  h2 {
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 8px 0;
    color: #f1f5f9;
  }

  p {
    color: #94a3b8;
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
  }
}

.input-section {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;

  .word-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 16px;
    min-width: 0; // 确保网格可以收缩
  }

  .word-input-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0; // 确保可以收缩

    .word-number {
      font-size: 10px;
      color: #64748b;
      font-weight: 600;
      text-align: center;
    }

    .word-input {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 14px 6px; // 增加高度以匹配显示框
      color: #f1f5f9;
      font-size: 13px;
      font-weight: 500;
      text-align: center;
      transition: all 0.3s ease;
      min-width: 0; // 确保可以收缩
      min-height: 44px; // 设置最小高度
      display: flex;
      align-items: center;
      justify-content: center;

      &:focus {
        outline: none;
        border-color: #6366f1;
        background: rgba(255, 255, 255, 0.08);
      }

      &::placeholder {
        color: #64748b;
        font-size: 11px;
      }
    }
  }
  
  .action-buttons {
    display: flex;
    gap: 12px;

    button {
      flex: 1;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 12px 16px;
      color: #94a3b8;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.3s ease;

      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(99, 102, 241, 0.3);
        color: #f1f5f9;
        transform: translateY(-1px);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background: rgba(255, 255, 255, 0.03);
        border-color: rgba(255, 255, 255, 0.05);
        color: #64748b;
      }

      i {
        font-size: 14px;
      }
    }

    .paste-btn {
      &:hover:not(:disabled) {
        border-color: rgba(16, 185, 129, 0.3);
        color: #10b981;
      }
    }

    .clear-btn {
      &:hover:not(:disabled) {
        border-color: rgba(239, 68, 68, 0.3);
        color: #ef4444;
      }
    }
  }
}

.password-section {
  margin-top: 24px;

  h3 {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 6px 0;
    color: #f1f5f9;
  }

  p {
    color: #94a3b8;
    margin: 0 0 16px 0;
    font-size: 14px;
    line-height: 1.5;
  }

  .password-inputs {
    display: flex;
    flex-direction: column;
    gap: 0; // 只有一个输入框，不需要间距
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 6px;

    label {
      font-size: 14px;
      color: #94a3b8;
      font-weight: 500;
    }

    .password-input {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 12px 16px;
      color: #f1f5f9;
      font-size: 14px;
      transition: all 0.3s ease;

      &:focus {
        outline: none;
        border-color: #6366f1;
        background: rgba(255, 255, 255, 0.08);
      }

      &::placeholder {
        color: #64748b;
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

.bottom-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px 20px 24px;
  background: linear-gradient(180deg, transparent 0%, #0F172A 20%, #0F172A 100%);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  z-index: 10;
  min-height: 80px;
}

.confirm-btn {
  width: 100%;
  padding: 18px 24px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.2);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);

    &::before {
      left: 100%;
    }
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
  }
}

// 响应式设计
@media (max-width: 480px) {
  .confirm-container {
    gap: 20px;
  }

  .header-section {
    h2 {
      font-size: 18px;
    }

    p {
      font-size: 13px;
    }
  }

  .input-section {
    padding: 12px;

    .word-grid {
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 6px;
      margin-bottom: 12px;
    }

    .word-input-item {
      gap: 3px;

      .word-number {
        font-size: 9px;
      }

      .word-input {
        padding: 12px 4px;
        font-size: 11px;
        min-height: 36px; // 小屏幕上稍微减少高度但保持一致
      }
    }

    .action-buttons {
      gap: 8px;

      button {
        padding: 10px 12px;
        font-size: 12px;

        i {
          font-size: 12px;
        }
      }
    }
  }

  .password-section {
    margin-top: 20px;

    h3 {
      font-size: 16px;
    }

    p {
      font-size: 13px;
    }

    .password-inputs {
      gap: 0; // 只有一个输入框
    }

    .input-group {
      label {
        font-size: 13px;
      }

      .password-input {
        padding: 10px 12px;
        font-size: 13px;
      }
    }
  }
}



@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
