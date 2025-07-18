<template>
  <ResponsiveLayout
    title="Import Private Key"
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
          <h1 class="header-title">Import Private Key</h1>
        </div>
      </div>
    </template>

    <!-- 主要内容 -->
    <div class="form-content">
        <!-- Selected Chain Display -->
        <div class="selected-chain" v-if="selectedChain">
          <div class="chain-display">
            <img v-if="selectedChain.logo" :src="selectedChain.logo" :alt="selectedChain.name" class="chain-logo">
            <div v-else class="chain-placeholder">
              {{ selectedChain.chain.charAt(0).toUpperCase() }}
            </div>
            <div class="chain-details">
              <h3>{{ selectedChain.name }}</h3>
              <p>{{ selectedChain.chain }}</p>
            </div>
          </div>
        </div>

        <!-- Private Key Input -->
        <div class="form-group">
          <label>Private Key</label>
          <p class="form-hint">
            {{ selectedChain?.chain === 'SOL'
              ? 'Enter your private key (Base58 encoded or 64-character hexadecimal string)'
              : 'Enter your private key (64-character hexadecimal string)' }}
          </p>
          <div class="private-key-input-container">
            <textarea
              v-model="privateKey"
              class="private-key-input"
              placeholder="Enter your private key..."
              rows="3"
              :class="{ error: privateKeyError }"
            ></textarea>
            <button 
              type="button" 
              class="private-key-toggle"
              @click="showPrivateKey = !showPrivateKey"
            >
              <i :class="showPrivateKey ? 'ri-eye-off-line' : 'ri-eye-line'"></i>
            </button>
          </div>
          <div v-if="privateKeyError" class="error-message">{{ privateKeyError }}</div>
        </div>

        <!-- Kadena Chain ID (only shown when KDA is selected) -->
        <div v-if="selectedChain?.chain === 'KDA'" class="form-group">
          <label>Kadena Chain ID</label>
          <p class="form-hint">Select Kadena Chain ID (0-19)</p>

          <div class="chain-selector-container">
            <div class="chain-id-selector" @click="showChainList = !showChainList">
              <div class="selected-chain-id">
                <div class="chain-id-icon">
                  <i class="ri-link"></i>
                </div>
                <div class="chain-id-info">
                  <div class="chain-id-label">Chain {{ kadenaChainId }}</div>
                  <div class="chain-id-desc">Kadena Chain {{ kadenaChainId }}</div>
                </div>
              </div>
              <i class="ri-arrow-down-s-line dropdown-icon" :class="{ 'rotated': showChainList }"></i>
            </div>

            <!-- Chain ID 下拉列表 -->
            <div v-if="showChainList" class="chain-dropdown">
              <div
                v-for="i in 20"
                :key="i-1"
                @click="selectChainId((i-1).toString())"
                class="chain-option"
                :class="{ 'selected': kadenaChainId === (i-1).toString() }"
              >
                <div class="chain-icon">
                  <i class="ri-link"></i>
                </div>
                <div class="chain-info">
                  <div class="chain-label">Chain {{ i-1 }}</div>
                  <div class="chain-desc">Kadena Chain {{ i-1 }}</div>
                </div>
                <i v-if="kadenaChainId === (i-1).toString()" class="ri-check-line"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Password Input -->
        <div class="form-group">
          <label>Payment Password</label>
          <p class="form-hint">Enter your payment password to protect the wallet</p>
          <div class="password-input-container">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="password-input"
              placeholder="Enter payment password"
              :class="{ error: passwordError }"
            >
            <button 
              type="button" 
              class="password-toggle"
              @click="showPassword = !showPassword"
            >
              <i :class="showPassword ? 'ri-eye-off-line' : 'ri-eye-line'"></i>
            </button>
          </div>
          <div v-if="passwordError" class="error-message">{{ passwordError }}</div>
        </div>

        <!-- Error Alert -->
        <div v-if="error" class="error-alert">
          <i class="ri-error-warning-line"></i>
          <span>{{ error }}</span>
        </div>
      </div>

    <template #footer>
      <div class="bottom-section">
        <button
          class="import-btn"
          :disabled="!canImport || loading"
          @click="handleImport"
        >
          <i v-if="loading" class="ri-loader-4-line spinning"></i>
          <i v-else class="ri-key-line"></i>
          {{ loading ? 'Importing...' : 'Import Wallet' }}
        </button>
      </div>
    </template>
  </ResponsiveLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWalletStore } from '@shared/stores/wallet'
import ResponsiveLayout from '@/popup/components/ResponsiveLayout.vue'

interface SupportedChain {
  chain: string
  name: string
  logo?: string
  type: string
  is_testnet: boolean
}

const router = useRouter()
const walletStore = useWalletStore()

// 响应式数据
const selectedChain = ref<SupportedChain | null>(null)
const privateKey = ref('')
const password = ref('')
const kadenaChainId = ref('0')
const showPrivateKey = ref(false)
const showPassword = ref(false)
const showChainList = ref(false)
const loading = ref(false)
const error = ref('')
const privateKeyError = ref('')
const passwordError = ref('')

// 计算属性
const canImport = computed(() => {
  return privateKey.value.trim() && password.value.trim() && selectedChain.value
})

// 返回上一页
const goBack = () => {
  router.go(-1)
}

// 选择链ID
const selectChainId = (chainId: string) => {
  kadenaChainId.value = chainId
  showChainList.value = false
}

// 验证私钥
const validatePrivateKey = () => {
  const key = privateKey.value.trim().replace(/^0x/, '')

  // 根据选择的链验证不同格式的私钥
  if (selectedChain.value?.chain === 'SOL') {
    // Solana 支持 Base58 格式 (87-88字符) 或十六进制格式 (64字符)
    if (!/^[1-9A-HJ-NP-Za-km-z]{87,88}$/.test(key) && !/^[a-fA-F0-9]{64}$/.test(key)) {
      privateKeyError.value = 'Solana private key must be Base58 encoded (87-88 characters) or 64-character hexadecimal string'
      return false
    }
  } else {
    // 其他链使用十六进制格式
    if (!/^[a-fA-F0-9]{64}$/.test(key)) {
      privateKeyError.value = 'Private key must be a 64-character hexadecimal string'
      return false
    }
  }

  privateKeyError.value = ''
  return true
}

// 验证密码
const validatePassword = () => {
  if (password.value.length < 8) {
    passwordError.value = 'Password must be at least 8 characters'
    return false
  }
  passwordError.value = ''
  return true
}

// 处理导入
const handleImport = async () => {
  if (!validatePrivateKey() || !validatePassword()) {
    return
  }

  try {
    // 不在这里显示加载状态，直接跳转到专门的加载页面
    error.value = ''

    const importData = {
      private_key: privateKey.value.trim().replace(/^0x/, ''),
      chain: selectedChain.value!.chain,
      payment_password: password.value,
      kadena_chain_id: selectedChain.value!.chain === 'KDA' ? kadenaChainId.value : '0'
    }

    console.log('Starting wallet import with data:', importData)

    // 立即跳转到加载页面，传递导入数据
    console.log('Redirecting to loading page for wallet import and balance refresh')
    await router.push({
      name: 'WalletImportLoading',
      query: {
        importData: JSON.stringify(importData)
      }
    })


  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Import failed'

    // 根据错误信息提供更具体的提示
    if (errorMessage.toLowerCase().includes('password')) {
      error.value = 'Incorrect password. Please check your payment password.'
    } else if (errorMessage.toLowerCase().includes('invalid') && errorMessage.toLowerCase().includes('private key')) {
      error.value = 'Invalid private key. Please check your private key format.'
    } else if (errorMessage.toLowerCase().includes('private key')) {
      error.value = 'Invalid private key. Please check if the private key is correct.'
    } else {
      error.value = errorMessage
    }

    console.error('Import private key error:', err)
  }
}

// 生命周期
onMounted(() => {
  // 从 sessionStorage 获取选择的链
  const chainData = sessionStorage.getItem('import_selected_chain')
  if (chainData) {
    try {
      selectedChain.value = JSON.parse(chainData)
    } catch (err) {
      console.error('Failed to parse selected chain:', err)
      router.push('/select-chain?mode=import-private-key')
    }
  } else {
    // 如果没有选择的链，返回链选择页面
    router.push('/select-chain?mode=import-private-key')
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
  }
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: white;
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 420px;
  margin: 0 auto;
  width: 100%;
  padding-bottom: 120px; /* 为底部按钮留出空间 */
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

.selected-chain {

  .chain-display {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: rgba(99, 102, 241, 0.1);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 12px;

    .chain-logo {
      width: 32px;
      height: 32px;
      border-radius: 50%;
    }

    .chain-placeholder {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 600;
      color: white;
    }

    .chain-details {
      flex: 1;

      h3 {
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 2px 0;
        color: #f1f5f9;
      }

      p {
        font-size: 14px;
        color: #94a3b8;
        margin: 0;
      }
    }
  }
}

.form-group {

  label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #f1f5f9;
    margin-bottom: 8px;
  }

  .form-hint {
    font-size: 12px;
    color: #94a3b8;
    margin: 0 0 12px 0;
    line-height: 1.4;
  }
}

.private-key-input-container {
  position: relative;

  .private-key-input {
    width: 100%;
    min-height: 80px;
    padding: 12px 40px 12px 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #f1f5f9;
    font-size: 14px;
    font-family: 'Monaco', 'Menlo', monospace;
    resize: vertical;

    &::placeholder {
      color: #64748b;
    }

    &:focus {
      outline: none;
      border-color: #6366f1;
      background: rgba(255, 255, 255, 0.08);
    }

    &.error {
      border-color: #ef4444;
    }
  }

  .private-key-toggle {
    position: absolute;
    right: 12px;
    top: 12px;
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    font-size: 16px;

    &:hover {
      color: #94a3b8;
    }
  }
}

// Chain ID 选择器样式
.chain-selector-container {
  position: relative;
}

.chain-id-selector {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .selected-chain-id {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;

    .chain-id-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.1);

      i {
        font-size: 16px;
        color: #f59e0b;
      }
    }

    .chain-id-info {
      flex: 1;

      .chain-id-label {
        font-size: 14px;
        font-weight: 600;
        color: #f1f5f9;
        margin-bottom: 2px;
      }

      .chain-id-desc {
        font-size: 12px;
        color: #9ca3af;
      }
    }
  }

  .dropdown-icon {
    font-size: 16px;
    color: #9ca3af;
    transition: transform 0.3s ease;

    &.rotated {
      transform: rotate(180deg);
    }
  }
}

.chain-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-top: 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);

  .chain-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    &.selected {
      background: rgba(59, 130, 246, 0.1);

      .chain-info .chain-label {
        color: #3b82f6;
      }
    }

    .chain-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;

      i {
        font-size: 16px;
        color: #f59e0b;
      }
    }

    .chain-info {
      flex: 1;
      margin-left: 12px;

      .chain-label {
        font-size: 14px;
        font-weight: 600;
        color: #f1f5f9;
        margin-bottom: 2px;
      }

      .chain-desc {
        font-size: 12px;
        color: #9ca3af;
      }
    }

    i {
      font-size: 16px;
      color: #3b82f6;
    }
  }
}

.password-input-container {
  position: relative;

  .password-input {
    width: 100%;
    padding: 12px 40px 12px 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #f1f5f9;
    font-size: 14px;

    &::placeholder {
      color: #64748b;
    }

    &:focus {
      outline: none;
      border-color: #6366f1;
      background: rgba(255, 255, 255, 0.08);
    }

    &.error {
      border-color: #ef4444;
    }
  }

  .password-toggle {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    font-size: 16px;

    &:hover {
      color: #94a3b8;
    }
  }
}

.import-btn {
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

  .spinning {
    animation: spin 1s linear infinite;
  }
}

.error-message {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
}

.error-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 12px;
  color: #ef4444;
  font-size: 14px;
  margin-bottom: 16px;
  backdrop-filter: blur(10px);
}

// 响应式设计
@media (max-width: 480px) {
  .form-content {
    gap: 20px;
    padding-bottom: 100px;
  }

  .bottom-section {
    padding-top: 12px;
  }

  .import-btn {
    padding: 14px 20px;
    font-size: 15px;
  }
}



@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
