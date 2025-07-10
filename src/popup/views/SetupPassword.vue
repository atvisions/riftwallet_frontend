<template>
  <div class="setup-password-page">
    <!-- Logo 和标题区域 -->
    <div class="header-section">
      <div class="logo-container">
        <img src="/icons/icon128.png" alt="Riftwallet" class="logo">
      </div>
      <h1 class="app-name">{{ APP_CONFIG.NAME }}</h1>
      <p class="welcome-text">Create a secure password to protect your wallet</p>
    </div>

    <!-- 密码设置表单 -->
    <div class="form-section">
      <form @submit.prevent="handleSetPassword" class="password-form">
        <div class="input-group">
          <label for="password">Password</label>
          <div class="input-wrapper">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Enter your password (min 8 characters)"
              class="password-input"
              :class="{ 'error': passwordError }"
              @input="validatePassword"
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

        <div class="input-group">
          <label for="confirmPassword">Confirm Password</label>
          <div class="input-wrapper">
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="Confirm your password"
              class="password-input"
              :class="{ 'error': confirmPasswordError }"
              @input="validateConfirmPassword"
            >
            <button
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
              class="toggle-password"
            >
              <i :class="showConfirmPassword ? 'ri-eye-off-line' : 'ri-eye-line'"></i>
            </button>
          </div>
          <div v-if="confirmPasswordError" class="error-message">
            {{ confirmPasswordError }}
          </div>
        </div>

        <!-- 简化的密码强度指示器 -->
        <div v-if="password" class="password-strength">
          <div class="strength-bar">
            <div
              class="strength-fill"
              :class="passwordStrengthClass"
              :style="{ width: passwordStrengthWidth }"
            ></div>
          </div>
          <div class="strength-text" :class="passwordStrengthClass">
            {{ passwordStrengthText }}
          </div>
        </div>

        <button
          type="submit"
          :disabled="!canSubmit || loading"
          class="submit-btn"
        >
          <div v-if="loading" class="loading-spinner"></div>
          <span v-else>Create Password</span>
        </button>

        <div v-if="error" class="error-message global-error">
          {{ error }}
        </div>
      </form>
    </div>

    <!-- 简化的提示信息 -->
    <div class="footer-info">
      <p><i class="ri-shield-check-line"></i> Password protects all transactions</p>
      <p class="critical-warning"><i class="ri-alert-line"></i> If you forget your password, it cannot be recovered. Keep it safe!</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@shared/stores/auth'
import { useWalletStore } from '@shared/stores/wallet'
import { APP_CONFIG } from '@shared/constants'

const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const passwordError = ref('')
const confirmPasswordError = ref('')
const loading = ref(false)
const error = ref('')

// 密码强度计算
const passwordStrength = computed(() => {
  const pwd = password.value
  let score = 0

  if (pwd.length >= 8) score += 1
  if (pwd.length >= 12) score += 1
  if (/[a-z]/.test(pwd)) score += 1
  if (/[A-Z]/.test(pwd)) score += 1
  if (/[0-9]/.test(pwd)) score += 1
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1

  return score
})

const passwordStrengthClass = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 2) return 'weak'
  if (strength <= 4) return 'medium'
  return 'strong'
})

const passwordStrengthWidth = computed(() => {
  const strength = passwordStrength.value
  return `${Math.min(strength * 16.67, 100)}%`
})

const passwordStrengthText = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 2) return 'Weak'
  if (strength <= 4) return 'Medium'
  return 'Strong'
})

// 表单验证
const canSubmit = computed(() => {
  return password.value.length >= 8 &&
         password.value === confirmPassword.value &&
         !passwordError.value &&
         !confirmPasswordError.value
})

// 验证密码
const validatePassword = () => {
  passwordError.value = ''

  if (password.value.length > 0 && password.value.length < 8) {
    passwordError.value = 'Password must be at least 8 characters long'
  }

  // 重新验证确认密码
  if (confirmPassword.value) {
    validateConfirmPassword()
  }
}

// 验证确认密码
const validateConfirmPassword = () => {
  confirmPasswordError.value = ''

  if (confirmPassword.value && confirmPassword.value !== password.value) {
    confirmPasswordError.value = 'Passwords do not match'
  }
}

// 处理密码设置
const handleSetPassword = async () => {
  if (!canSubmit.value) return

  try {
    loading.value = true
    error.value = ''

    await authStore.setPaymentPassword(password.value)

    // 密码设置成功，设置登录会话并跳转到钱包选择页面
    await authStore.setPasswordSession()

    // 跳转到钱包选择页面（创建或导入钱包）
    router.push('/wallet-choice')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to set password'
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.setup-password-page {
  width: 375px;
  height: 600px; // 固定高度，适应插件环境
  background: #0F172A;
  color: #f1f5f9;
  overflow: hidden;
  padding: 32px 24px 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

// Header Section
.header-section {
  text-align: center;
  margin-bottom: 40px;

  .logo-container {
    margin-bottom: 12px;

    .logo {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(99, 102, 241, 0.3);
    }
  }

  .app-name {
    font-size: 24px;
    font-weight: 700;
    margin: 0 0 6px 0;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .welcome-text {
    color: #9ca3af;
    font-size: 13px;
    margin: 0;
  }
}

// Form Section
.form-section {
  flex: 1;
}

// Password Form
.password-form {
  .input-group {
    margin-bottom: 16px;

    label {
      display: block;
      font-weight: 500;
      margin-bottom: 6px;
      color: #f1f5f9;
      font-size: 14px;
    }

    .input-wrapper {
      position: relative;

      .password-input {
        width: 100%;
        padding: 14px 48px 14px 16px;
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
          font-size: 14px;
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
      margin-top: 6px;
    }
  }
}

// Password Strength
.password-strength {
  margin-bottom: 20px;

  .strength-bar {
    width: 100%;
    height: 3px;
    background: #1E293B;
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 6px;

    .strength-fill {
      height: 100%;
      transition: all 0.3s ease;

      &.weak {
        background: #ef4444;
      }

      &.medium {
        background: #f59e0b;
      }

      &.strong {
        background: #10b981;
      }
    }
  }

  .strength-text {
    font-size: 11px;
    font-weight: 500;
    text-align: center;

    &.weak {
      color: #ef4444;
    }

    &.medium {
      color: #f59e0b;
    }

    &.strong {
      color: #10b981;
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
  margin-bottom: 16px;

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

// Global Error
.global-error {
  text-align: center;
  margin-top: 12px;
  padding: 10px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid #ef4444;
  border-radius: 8px;
  font-size: 13px;
}

// Footer Info
.footer-info {
  margin-top: auto;
  padding-top: 16px;

  p {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #9ca3af;
    font-size: 11px;
    margin: 0 0 6px 0;

    &:last-child {
      margin-bottom: 0;
    }

    i {
      color: #6366f1;
      font-size: 12px;
    }

    &.critical-warning {
      color: #ef4444;

      i {
        color: #ef4444;
      }
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
