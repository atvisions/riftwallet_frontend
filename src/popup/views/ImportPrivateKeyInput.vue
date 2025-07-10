<template>
  <div class="import-private-key-input-page">
    <div class="header">
      <button @click="goBack" class="back-btn">
        <i class="ri-arrow-left-line"></i>
      </button>
      <h1>Import Private Key</h1>
    </div>
    
    <div class="content">
      <div class="form-container">
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
          <select v-model="kadenaChainId" class="chain-id-select">
            <option v-for="i in 20" :key="i-1" :value="(i-1).toString()">Chain {{ i-1 }}</option>
          </select>
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

        <!-- Import Button -->
        <button 
          class="import-btn"
          :disabled="!canImport || loading"
          @click="handleImport"
        >
          <i v-if="loading" class="ri-loader-4-line spinning"></i>
          <i v-else class="ri-key-line"></i>
          {{ loading ? 'Importing...' : 'Import Wallet' }}
        </button>

        <!-- Error Alert -->
        <div v-if="error" class="error-alert">
          <i class="ri-error-warning-line"></i>
          <span>{{ error }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWalletStore } from '@shared/stores/wallet'

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
      router.push('/import-private-key-select-chain')
    }
  } else {
    // 如果没有选择的链，返回链选择页面
    router.push('/import-private-key-select-chain')
  }
})
</script>

<style lang="scss" scoped>
.import-private-key-input-page {
  width: 375px;
  height: 762px;
  background: #0F172A;
  color: #f1f5f9;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #1E293B;
  flex-shrink: 0;

  .back-btn {
    background: none;
    border: none;
    color: #6366f1;
    font-size: 20px;
    margin-right: 16px;
    cursor: pointer;

    &:hover {
      color: #8b5cf6;
    }
  }

  h1 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }
}

.content {
  flex: 1;
  padding: 20px 16px;
  overflow-y: auto;
}

.form-container {
  max-width: 100%;
}

.selected-chain {
  margin-bottom: 24px;

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
  margin-bottom: 24px;

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

.chain-id-select {
  width: 100%;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #f1f5f9;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #6366f1;
    background: rgba(255, 255, 255, 0.08);
  }

  option {
    background: #1E293B;
    color: #f1f5f9;
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
  padding: 14px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
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
  padding: 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: #ef4444;
  font-size: 14px;
  margin-top: 16px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
