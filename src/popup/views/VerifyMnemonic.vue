<template>
  <div class="verify-mnemonic-page">
    <div class="header">
      <button class="back-btn" @click="goBack">
        <i class="ri-arrow-left-line"></i>
      </button>
      <h1>Verify Seed Phrase</h1>
      <div class="placeholder"></div>
    </div>
    
    <div class="content">
      <div class="description">
        <h2>Your Seed Phrase</h2>
        <p>Write down these 12 words in order and keep them safe.</p>
      </div>
      
      <div class="mnemonic-display">
        <div class="word-grid">
          <div
            v-for="(word, index) in mnemonicWords"
            :key="index"
            class="word-display-container"
          >
            <label>{{ index + 1 }}</label>
            <div class="word-display">
              {{ word }}
            </div>
          </div>
        </div>

        <div class="mnemonic-actions">
          <button class="copy-btn" @click="copyMnemonic">
            <i class="ri-clipboard-line"></i>
            Copy to Clipboard
          </button>
        </div>
      </div>
      
      <div class="error-message" v-if="error">
        <i class="ri-error-warning-line"></i>
        {{ error }}
      </div>
      
      <div class="security-tips">
        <div class="tips-content">
          <i class="ri-shield-check-line"></i>
          <div>
            <h3>Security Notice</h3>
            <p>Never share your seed phrase. Store it safely offline.</p>
          </div>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <button 
        class="verify-btn" 
        :disabled="!isValidMnemonic || submitting"
        @click="verifyMnemonic"
      >
        <span v-if="submitting">
          <i class="ri-loader-4-line animate-spin"></i>
          Verifying...
        </span>
        <span v-else>
          I've Written It Down
          <i class="ri-check-line"></i>
        </span>
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
const mnemonicWords = ref<string[]>(Array(12).fill(''))
const submitting = ref(false)
const error = ref('')
const selectedChain = ref('')

// 计算属性
const isValidMnemonic = computed(() => {
  return mnemonicWords.value.length === 12 && mnemonicWords.value.every(word => word.trim().length > 0)
})

// 返回上一页
const goBack = () => {
  router.go(-1)
}

// 复制助记词到剪贴板
const copyMnemonic = async () => {
  try {
    const mnemonic = mnemonicWords.value.join(' ')
    await navigator.clipboard.writeText(mnemonic)
    // 可以添加一个临时的成功提示
    console.log('Mnemonic copied to clipboard')
  } catch (err) {
    error.value = 'Failed to copy to clipboard'
  }
}

// 加载生成的助记词和链信息
const loadGeneratedMnemonic = () => {
  const generatedMnemonic = sessionStorage.getItem('generated_mnemonic')
  const chainData = sessionStorage.getItem('selected_chain')

  if (generatedMnemonic && chainData) {
    mnemonicWords.value = generatedMnemonic.split(' ')
    selectedChain.value = chainData
  } else {
    error.value = 'No mnemonic found. Please go back and select a chain again.'
  }
}

// 确认助记词（用户确认已记录）
const verifyMnemonic = () => {
  if (!isValidMnemonic.value) return

  // 跳转到确认助记词页面
  router.push('/confirm-mnemonic')
}

// 生命周期
onMounted(() => {
  loadGeneratedMnemonic()
})
</script>

<style lang="scss" scoped>
.verify-mnemonic-page {
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
  padding: 16px 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.description {
  text-align: center;
  margin-bottom: 20px;

  h2 {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 6px 0;
  }

  p {
    color: #94a3b8;
    margin: 0;
    font-size: 14px;
    line-height: 1.4;
  }
}

.mnemonic-display {
  flex: 1;
  margin-bottom: 16px;

  .word-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    margin-bottom: 12px;
  }

  .word-display-container {
    display: flex;
    flex-direction: column;
    gap: 4px;

    label {
      font-size: 12px;
      color: #94a3b8;
      font-weight: 500;
    }

    .word-display {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      padding: 8px;
      color: #f1f5f9;
      font-size: 13px;
      font-weight: 500;
      text-align: center;
      min-height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .mnemonic-actions {
    display: flex;
    justify-content: center;

    .copy-btn {
      background: rgba(99, 102, 241, 0.1);
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 8px;
      padding: 10px 16px;
      color: #6366f1;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(99, 102, 241, 0.15);
        border-color: #6366f1;
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
  margin-bottom: 24px;
  
  i {
    font-size: 16px;
  }
}

.security-tips {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;

  .tips-content {
    display: flex;
    align-items: center;
    gap: 10px;

    i {
      color: #10b981;
      font-size: 18px;
      flex-shrink: 0;
    }

    h3 {
      font-size: 13px;
      font-weight: 600;
      margin: 0 0 2px 0;
      color: #10b981;
    }

    p {
      font-size: 11px;
      color: #94a3b8;
      margin: 0;
      line-height: 1.3;
    }
  }
}

.footer {
  padding: 16px 20px;
  border-top: 1px solid #334155;
  
  .verify-btn {
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
