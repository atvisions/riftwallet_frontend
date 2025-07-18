<template>
  <ResponsiveLayout
    title="Verify Seed Phrase"
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
          <h1 class="header-title">Verify Seed Phrase</h1>
        </div>
      </div>
    </template>

    <!-- 主要内容 -->
    <div class="mnemonic-container">
        <!-- 进度指示器 -->
        <div class="progress-section">
          <div class="progress-bar">
            <div class="progress-fill" style="width: 50%"></div>
          </div>
          <div class="progress-text">Step 1 of 2</div>
        </div>

        <!-- 头部信息 -->
        <div class="header-section">
          <div class="header-icon">
            <i class="ri-key-2-line"></i>
          </div>
          <h2>Your Recovery Phrase</h2>
          <p>Write down these 12 words in the exact order shown. Keep them safe and never share with anyone.</p>
        </div>

        <!-- 助记词显示卡片 -->
        <div class="mnemonic-card">
          <div class="card-header">
            <div class="security-badge">
              <i class="ri-shield-check-line"></i>
              <span>Secure</span>
            </div>
            <button class="copy-btn" @click="copyMnemonic" :class="{ 'copied': copySuccess }">
              <i :class="copySuccess ? 'ri-check-line' : 'ri-clipboard-line'"></i>
              <span>{{ copySuccess ? 'Copied!' : 'Copy' }}</span>
            </button>
          </div>

          <div class="word-grid">
            <div
              v-for="(word, index) in mnemonicWords"
              :key="index"
              class="word-item"
              :style="{ animationDelay: `${index * 50}ms` }"
            >
              <span class="word-number">{{ index + 1 }}</span>
              <span class="word-text">{{ word }}</span>
            </div>
          </div>
        </div>

        <!-- 错误信息 -->
        <div class="error-message" v-if="error">
          <i class="ri-error-warning-line"></i>
          <span>{{ error }}</span>
        </div>

        <!-- 安全提示 -->
        <div class="security-tips">
          <div class="tip-item">
            <div class="tip-icon">
              <i class="ri-eye-off-line"></i>
            </div>
            <div class="tip-content">
              <h4>Keep it private</h4>
              <p>Never share your recovery phrase with anyone</p>
            </div>
          </div>
          <div class="tip-item">
            <div class="tip-icon">
              <i class="ri-file-paper-line"></i>
            </div>
            <div class="tip-content">
              <h4>Write it down</h4>
              <p>Store it safely offline, not on your device</p>
            </div>
          </div>
          <div class="tip-item">
            <div class="tip-icon">
              <i class="ri-sort-asc"></i>
            </div>
            <div class="tip-content">
              <h4>Order matters</h4>
              <p>The sequence of words is important</p>
            </div>
          </div>
        </div>
      </div>

    <template #footer>
      <div class="bottom-section">
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
const mnemonicWords = ref<string[]>(Array(12).fill(''))
const submitting = ref(false)
const error = ref('')
const selectedChain = ref('')
const copySuccess = ref(false)

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

    if (!navigator.clipboard) {
      error.value = 'Clipboard API not supported'
      return
    }

    await navigator.clipboard.writeText(mnemonic)
    copySuccess.value = true
    error.value = ''

    // 2秒后重置状态
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)

  } catch (err: any) {
    console.error('Copy error:', err)
    if (err.name === 'NotAllowedError') {
      error.value = 'Clipboard access denied. Please allow clipboard permissions.'
    } else {
      error.value = 'Failed to copy to clipboard'
    }
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

.mnemonic-container {
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
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  box-shadow: 0 8px 32px rgba(99, 102, 241, 0.3);

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

// 助记词卡片
.mnemonic-card {
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
}

.security-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 12px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #22c55e;

  i {
    font-size: 14px;
  }
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 12px;
  padding: 8px 16px;
  color: #6366f1;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(99, 102, 241, 0.25);
    transform: translateY(-1px);
  }

  &.copied {
    background: rgba(34, 197, 94, 0.15);
    border-color: rgba(34, 197, 94, 0.3);
    color: #22c55e;
  }

  i {
    font-size: 14px;
  }
}

.word-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  min-width: 0;
}

.word-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  min-width: 0;
  min-height: 60px;
  justify-content: center;
  animation: fadeInUp 0.5s ease forwards;
  opacity: 0;
  transform: translateY(10px);

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(99, 102, 241, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
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

  .word-text {
    color: #f1f5f9;
    font-size: 14px;
    font-weight: 600;
    text-align: center;
    word-break: break-word;
    line-height: 1.2;
    font-family: 'Monaco', 'Menlo', monospace;
  }
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
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

  span {
    flex: 1;
  }
}

// 安全提示
.security-tips {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.1);
  }
}

.tip-icon {
  width: 36px;
  height: 36px;
  background: rgba(99, 102, 241, 0.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  i {
    font-size: 16px;
    color: #6366f1;
  }
}

.tip-content {
  flex: 1;
  min-width: 0;

  h4 {
    font-size: 14px;
    font-weight: 600;
    color: #f1f5f9;
    margin: 0 0 4px 0;
  }

  p {
    font-size: 13px;
    color: #94a3b8;
    margin: 0;
    line-height: 1.4;
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

.verify-btn {
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
  .mnemonic-container {
    gap: 16px;
  }

  .header-section {
    h2 {
      font-size: 16px;
    }

    p {
      font-size: 12px;
    }
  }

  .mnemonic-display {
    padding: 16px 12px;

    .word-grid {
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 8px;
    }

    .word-item {
      padding: 10px 6px;
      min-height: 50px;

      .word-number {
        font-size: 9px;
      }

      .word-text {
        font-size: 12px;
      }
    }
  }

  .action-section {
    .copy-btn {
      padding: 10px 16px;
      font-size: 13px;
    }
  }

  .bottom-section {
    padding: 12px;
  }

  .verify-btn {
    padding: 12px 20px;
    font-size: 14px;
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
