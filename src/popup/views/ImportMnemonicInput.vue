<template>
  <ResponsiveLayout
    title="Import Recovery Phrase"
    :show-header="true"
    :show-footer="true"
    :scrollable="true"
    padding="16px"
    @back="$router.go(-1)"
  >
    <!-- 自定义头部 -->
    <template #header>
      <div class="page-header">
        <div class="header-left">
          <button @click="$router.go(-1)" class="back-button">
            <i class="ri-arrow-left-line"></i>
          </button>
          <h1 class="header-title">Import Recovery Phrase</h1>
        </div>
      </div>
    </template>

    <!-- 主要内容 -->
    <div class="form-container">
        <!-- 选择的链信息 -->
        <div v-if="selectedChain" class="selected-chain-info">
          <img :src="selectedChain.logo" :alt="selectedChain.name" class="chain-logo">
          <div class="chain-details">
            <span class="chain-name">{{ selectedChain.name }}</span>
            <span class="chain-code">{{ selectedChain.chain }}</span>
          </div>
        </div>

        <!-- Mnemonic Input -->
        <div class="form-group">
          <label>Recovery Phrase</label>
          <p class="form-hint">Enter your 12-word recovery phrase, separated by spaces</p>
          <textarea
            v-model="mnemonic"
            class="mnemonic-input"
            placeholder="Enter your 12-word recovery phrase..."
            rows="4"
            :class="{ error: mnemonicError }"
          ></textarea>
          <div v-if="mnemonicError" class="error-message">{{ mnemonicError }}</div>
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

        <!-- Kadena Chain ID (只在选择 KDA 时显示) -->
        <div v-if="selectedChain?.chain === 'KDA'" class="form-group">
          <label>Kadena Chain ID</label>
          <p class="form-hint">Select the Kadena chain ID (0-19)</p>

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

        <!-- Error Message -->
        <div v-if="error" class="error-message">{{ error }}</div>
      </div>

    <template #footer>
      <div class="footer">
        <!-- Import Button -->
        <button
          class="import-btn"
          :disabled="!canImport"
          @click="importWallet"
        >
          Import Wallet
        </button>
      </div>
    </template>
  </ResponsiveLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ResponsiveLayout from '@/popup/components/ResponsiveLayout.vue'

const router = useRouter()

// 响应式数据
const selectedChain = ref<any>(null)
const mnemonic = ref('')
const password = ref('')
const kadenaChainId = ref('0')
const showPassword = ref(false)
const showChainList = ref(false)
const error = ref('')
const mnemonicError = ref('')
const passwordError = ref('')

// 计算属性
const canImport = computed(() => {
  return selectedChain.value && 
         mnemonic.value.trim() && 
         password.value.trim() && 
         !mnemonicError.value && 
         !passwordError.value
})

// 验证助记词
const validateMnemonic = () => {
  const words = mnemonic.value.trim().split(/\s+/)
  if (words.length !== 12) {
    mnemonicError.value = 'Recovery phrase must contain exactly 12 words'
    return false
  }
  mnemonicError.value = ''
  return true
}

// 验证密码
const validatePassword = () => {
  if (password.value.length < 6) {
    passwordError.value = 'Password must be at least 6 characters'
    return false
  }
  passwordError.value = ''
  return true
}

// 选择链ID
const selectChainId = (chainId: string) => {
  kadenaChainId.value = chainId
  showChainList.value = false
}

// 导入钱包
const importWallet = async () => {
  if (!validateMnemonic() || !validatePassword()) {
    return
  }

  try {
    error.value = ''

    const importData = {
      mnemonic: mnemonic.value.trim(),
      chain: selectedChain.value.chain,
      payment_password: password.value,
      kadena_chain_id: selectedChain.value.chain === 'KDA' ? kadenaChainId.value : '0'
    }

    console.log('Starting mnemonic import with data:', importData)
    
    // 跳转到加载页面，传递导入数据
    console.log('Redirecting to loading page for mnemonic import and balance refresh')
    await router.push({
      name: 'WalletImportLoading',
      query: {
        importType: 'mnemonic',
        importData: JSON.stringify(importData)
      }
    })

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Import failed'

    // 根据错误信息提供更具体的提示
    if (errorMessage.toLowerCase().includes('password')) {
      error.value = 'Incorrect password. Please check your payment password.'
    } else if (errorMessage.toLowerCase().includes('mnemonic')) {
      error.value = 'Invalid recovery phrase. Please check your mnemonic words.'
    } else {
      error.value = errorMessage
    }

    console.error('Import mnemonic error:', err)
  }
}

// 生命周期
onMounted(() => {
  // 从 sessionStorage 获取选择的链
  const chainData = sessionStorage.getItem('mnemonic_selected_chain')
  if (chainData) {
    try {
      selectedChain.value = JSON.parse(chainData)
    } catch (err) {
      console.error('Failed to parse chain data:', err)
      // 返回链选择页面
      router.push('/select-chain?mode=import-mnemonic')
    }
  } else {
    // 如果没有选择的链，返回链选择页面
    router.push('/select-chain?mode=import-mnemonic')
  }

  // 监听输入变化
  mnemonic.value && validateMnemonic()
  password.value && validatePassword()
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


.import-mnemonic-input-page {
  width: 375px;
  height: 600px; // 固定高度，适应插件环境
  background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
  color: #f1f5f9;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  .back-btn {
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 12px;
    color: #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    
    i {
      font-size: 20px;
    }
  }
  
  h1 {
    font-size: 20px;
    font-weight: 600;
    margin: 0;
  }
}

.content {
  padding: 24px;
  height: calc(100% - 81px);
  overflow-y: auto;
}

.form-container {
  max-width: 420px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 120px; /* 为底部固定按钮留出空间 */
}



// 选择的链信息
.selected-chain-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 12px;
  margin-bottom: 24px;
  margin-top: 8px; // 添加顶部间距
}

.chain-logo {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.chain-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chain-name {
  font-size: 14px;
  font-weight: 600;
  color: #f1f5f9;
}

.chain-code {
  font-size: 12px;
  color: #94a3b8;
}

// 表单样式
.form-group {
  margin-bottom: 20px;
  
  label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 6px;
    color: #f1f5f9;
  }
  
  .form-hint {
    font-size: 12px;
    color: #94a3b8;
    margin-bottom: 12px;
    line-height: 1.4;
  }
}

.mnemonic-input {
  width: 100%;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #f1f5f9;
  font-size: 14px;
  resize: vertical;
  min-height: 100px;
  
  &::placeholder {
    color: #64748b;
  }
  
  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
  
  &.error {
    border-color: #ef4444;
  }
}

.password-input-container {
  position: relative;
}

.password-input {
  width: 100%;
  padding: 16px 50px 16px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #f1f5f9;
  font-size: 14px;
  
  &::placeholder {
    color: #64748b;
  }
  
  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
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
  color: #94a3b8;
  cursor: pointer;
  padding: 8px;
  
  &:hover {
    color: #f1f5f9;
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

.footer {
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

.import-btn {
  width: 100%;
  padding: 18px 24px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  border-radius: 16px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 56px;
  margin-top: 24px;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(99, 102, 241, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
}

.error-message {
  color: #ef4444;
  font-size: 12px;
  margin-top: 6px;
  padding: 8px 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 6px;
}
</style>
