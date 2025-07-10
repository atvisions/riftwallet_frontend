<template>
  <ResponsiveLayout
    title="Confirm Seed Phrase"
    :show-header="true"
    :show-footer="false"
    :show-back-button="true"
    :scrollable="true"
    padding="0"
    @back="goBack"
  >
    <div class="confirm-mnemonic-container">
      <div class="content-area">
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
            <button class="paste-btn" @click="pasteMnemonic" :disabled="pasting">
              <i v-if="pasting" class="ri-loader-4-line animate-spin"></i>
              <i v-else class="ri-clipboard-line"></i>
              {{ pasting ? 'Pasting...' : 'Paste from Clipboard' }}
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

      <!-- Fixed Bottom Button -->
      <div class="bottom-section">
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
const submitting = ref(false)
const pasting = ref(false)
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
  if (pasting.value) return // 防止重复点击

  try {
    // 设置加载状态
    pasting.value = true
    error.value = ''

    // 检查剪贴板 API 是否可用
    if (!navigator.clipboard) {
      // 备用方案：使用传统的 execCommand (已废弃但仍可用)
      try {
        const textArea = document.createElement('textarea')
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        document.execCommand('paste')
        const text = textArea.value
        document.body.removeChild(textArea)

        if (text) {
          processPastedText(text)
        } else {
          error.value = 'No text found in clipboard. Please copy your seed phrase first.'
        }
      } catch (fallbackErr) {
        error.value = 'Clipboard access not available. Please type your seed phrase manually.'
      }
      return
    }

    // 使用现代剪贴板 API
    const text = await navigator.clipboard.readText()
    processPastedText(text)

  } catch (err) {
    console.error('Clipboard error:', err)
    if (err.name === 'NotAllowedError') {
      error.value = 'Clipboard access denied. Please allow clipboard permissions or type manually.'
    } else if (err.name === 'NotFoundError') {
      error.value = 'No text found in clipboard. Please copy your seed phrase first.'
    } else {
      error.value = 'Failed to read from clipboard. Please type your seed phrase manually.'
    }
  } finally {
    // 清除加载状态
    pasting.value = false
  }
}

// 处理粘贴的文本
const processPastedText = (text: string) => {
  if (!text || !text.trim()) {
    error.value = 'No text found in clipboard. Please copy your seed phrase first.'
    return
  }

  const words = text.trim().split(/\s+/).filter(word => word.length > 0)

  if (words.length === 12) {
    inputWords.value = words.map(word => word.toLowerCase().trim())
    validateInput()
    // 成功提示
    setTimeout(() => {
      if (!error.value) {
        // 可以添加成功提示，但这里我们保持简洁
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
.confirm-mnemonic-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: 24px;
  min-height: calc(100vh - 120px);
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
  margin-bottom: 24px;
}

.description {
  text-align: center;
  
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
      
      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.08);
        border-color: #6366f1;
        color: #f1f5f9;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background: rgba(255, 255, 255, 0.03);
        border-color: rgba(255, 255, 255, 0.05);
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
  flex-shrink: 0;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.confirm-btn {
  width: 100%;
  padding: 16px 24px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
  .confirm-mnemonic-container {
    padding: 20px;
    min-height: calc(100vh - 100px);
  }

  .content-area {
    gap: 20px;
    margin-bottom: 20px;
  }

  .bottom-section {
    padding-top: 12px;
  }

  .confirm-btn {
    padding: 14px 20px;
    font-size: 15px;
  }
}

// 弹窗模式特殊样式
:global(.layout-popup) .confirm-mnemonic-container {
  min-height: calc(600px - 120px);
  padding: 20px;

  .content-area {
    gap: 18px;
    margin-bottom: 16px;
  }

  .bottom-section {
    padding-top: 12px;
  }

  .confirm-btn {
    padding: 14px 20px;
    font-size: 15px;
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
