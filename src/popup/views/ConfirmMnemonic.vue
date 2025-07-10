<template>
  <div class="confirm-mnemonic-page">
    <div class="header">
      <button class="back-btn" @click="goBack">
        <i class="ri-arrow-left-line"></i>
      </button>
      <h1>Confirm Seed Phrase</h1>
      <div class="placeholder"></div>
    </div>
    
    <div class="content">
      <div class="description">
        <h2>Verify Your Seed Phrase</h2>
        <p>Please enter your 12-word seed phrase to confirm you've saved it correctly.</p>
      </div>
      
      <div class="mnemonic-input">
        <div class="word-grid">
          <div 
            v-for="(word, index) in inputWords" 
            :key="index"
            class="word-input-container"
          >
            <label>{{ index + 1 }}</label>
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
        
        <div class="input-actions">
          <button class="paste-btn" @click="pasteMnemonic">
            <i class="ri-clipboard-line"></i>
            Paste from Clipboard
          </button>
          <button class="clear-btn" @click="clearInput">
            <i class="ri-delete-bin-line"></i>
            Clear All
          </button>
        </div>
      </div>
      
      <div class="error-message" v-if="error">
        <i class="ri-error-warning-line"></i>
        {{ error }}
      </div>


    </div>
    
    <div class="footer">
      <button
        class="confirm-btn"
        :disabled="!isValidInput"
        @click="confirmMnemonic"
      >
        <span>Continue</span>
        <i class="ri-arrow-right-line"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@shared/stores/auth'
import { useWalletStore } from '@shared/stores/wallet'
import { APP_CONFIG } from '@shared/constants'

const router = useRouter()
const authStore = useAuthStore()
const walletStore = useWalletStore()

// 响应式数据
const inputWords = ref<string[]>(Array(12).fill(''))
const submitting = ref(false)
const error = ref('')
const originalMnemonic = ref('')
const selectedChain = ref('')



// 计算属性
const isValidInput = computed(() => {
  return inputWords.value.every(word => word.trim().length > 0)
})



// 返回上一页
const goBack = () => {
  router.go(-1)
}

// 验证输入
const validateInput = () => {
  error.value = ''
}



// 从剪贴板粘贴
const pasteMnemonic = async () => {
  try {
    const text = await navigator.clipboard.readText()
    const words = text.trim().split(/\s+/)
    
    if (words.length === 12) {
      inputWords.value = words.map(word => word.toLowerCase().trim())
      validateInput()
    } else {
      error.value = 'Please paste a valid 12-word seed phrase'
    }
  } catch (err) {
    error.value = 'Failed to read from clipboard'
  }
}

// 清除输入
const clearInput = () => {
  inputWords.value = Array(12).fill('')
  error.value = ''
}

// 确认助记词
const confirmMnemonic = () => {
  if (!isValidInput.value) return

  try {
    error.value = ''

    const inputMnemonic = inputWords.value.join(' ').toLowerCase()
    const originalMnemonicLower = originalMnemonic.value.toLowerCase()

    // 验证助记词是否匹配
    if (inputMnemonic !== originalMnemonicLower) {
      error.value = 'The seed phrase you entered does not match. Please try again.'
      return
    }

    // 助记词验证通过，保存到 sessionStorage 并跳转到密码页面
    sessionStorage.setItem('verified_mnemonic', inputMnemonic)

    // 跳转到密码输入页面
    router.push('/create-wallet-password')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Verification failed'
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
.confirm-mnemonic-page {
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
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #334155;
  
  .back-btn {
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 10px;
    color: #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    
    &:hover {
      background: rgba(255, 255, 255, 0.15);
    }
  }
  
  h1 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }
  
  .placeholder {
    width: 40px;
  }
}

.content {
  flex: 1;
  padding: 24px 20px;
  overflow-y: auto;
}

.description {
  text-align: center;
  margin-bottom: 32px;
  
  h2 {
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 8px 0;
  }
  
  p {
    color: #94a3b8;
    margin: 0;
    line-height: 1.5;
  }
}

.mnemonic-input {
  margin-bottom: 24px;
  
  .word-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 16px;
  }
  
  .word-input-container {
    display: flex;
    flex-direction: column;
    gap: 4px;
    
    label {
      font-size: 12px;
      color: #94a3b8;
      font-weight: 500;
    }
    
    .word-input {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 12px;
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
  
  .input-actions {
    display: flex;
    gap: 8px;
    
    button {
      flex: 1;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 10px 12px;
      color: #94a3b8;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.3s ease;
      
      &:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: #6366f1;
        color: #f1f5f9;
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
  
  .confirm-btn {
    width: 100%;
    background: #6366f1;
    color: white;
    border: none;
    padding: 16px;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.3s ease;
    
    &:hover:not(:disabled) {
      background: #5856d6;
    }
    
    &:disabled {
      background: #374151;
      color: #9ca3af;
      cursor: not-allowed;
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
