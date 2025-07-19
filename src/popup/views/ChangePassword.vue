<template>
  <div class="change-password-page">
    <PageHeader title="Change Password" />

    <div class="content">
      <div class="password-form">
        <!-- 当前密码 -->
        <div class="form-group">
          <label class="form-label">Current Password</label>
          <div class="password-input-container">
            <input
              v-model="oldPassword"
              :type="showOldPassword ? 'text' : 'password'"
              class="form-input"
              placeholder="Enter current password"
              :class="{ 'error': errors.oldPassword }"
              @input="clearError('oldPassword')"
            >
            <button
              type="button"
              class="password-toggle"
              @click="showOldPassword = !showOldPassword"
            >
              <i :class="showOldPassword ? 'ri-eye-off-line' : 'ri-eye-line'"></i>
            </button>
          </div>
          <div v-if="errors.oldPassword" class="error-message">
            {{ errors.oldPassword }}
          </div>
        </div>

        <!-- 新密码 -->
        <div class="form-group">
          <label class="form-label">New Password</label>
          <div class="password-input-container">
            <input
              v-model="newPassword"
              :type="showNewPassword ? 'text' : 'password'"
              class="form-input"
              placeholder="Enter new password"
              :class="{ 'error': errors.newPassword }"
              @input="clearError('newPassword')"
            >
            <button
              type="button"
              class="password-toggle"
              @click="showNewPassword = !showNewPassword"
            >
              <i :class="showNewPassword ? 'ri-eye-off-line' : 'ri-eye-line'"></i>
            </button>
          </div>
          <div v-if="errors.newPassword" class="error-message">
            {{ errors.newPassword }}
          </div>
        </div>

        <!-- 确认新密码 -->
        <div class="form-group">
          <label class="form-label">Confirm New Password</label>
          <div class="password-input-container">
            <input
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              class="form-input"
              placeholder="Confirm new password"
              :class="{ 'error': errors.confirmPassword }"
              @input="clearError('confirmPassword')"
            >
            <button
              type="button"
              class="password-toggle"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              <i :class="showConfirmPassword ? 'ri-eye-off-line' : 'ri-eye-line'"></i>
            </button>
          </div>
          <div v-if="errors.confirmPassword" class="error-message">
            {{ errors.confirmPassword }}
          </div>
        </div>

        <!-- 密码要求提示 -->
        <div class="password-requirements">
          <div class="requirements-title">Password Requirements:</div>
          <ul class="requirements-list">
            <li :class="{ 'valid': passwordValidation.length }">
              <i :class="passwordValidation.length ? 'ri-check-line' : 'ri-close-line'"></i>
              At least 6 characters
            </li>
            <li :class="{ 'valid': passwordValidation.number }">
              <i :class="passwordValidation.number ? 'ri-check-line' : 'ri-close-line'"></i>
              Contains numbers
            </li>
          </ul>
        </div>

        <!-- 错误提示 -->
        <div v-if="generalError" class="general-error">
          {{ generalError }}
        </div>

        <!-- 成功提示 -->
        <div v-if="successMessage" class="success-message">
          {{ successMessage }}
        </div>

        <!-- 操作按钮 -->
        <div class="form-actions">
          
          <button
            class="btn btn-primary"
            @click="changePassword"
            :disabled="!isFormValid || loading"
          >
            <i v-if="loading" class="ri-loader-4-line animate-spin"></i>
            <span>{{ loading ? 'Changing...' : 'Change Password' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@shared/stores/auth'
import { APP_CONFIG } from '@shared/constants'
import PageHeader from '@/popup/components/PageHeader.vue'

const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showOldPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)
const generalError = ref('')
const successMessage = ref('')

// 错误状态
const errors = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 密码验证
const passwordValidation = computed(() => ({
  length: newPassword.value.length >= 6,
  number: /\d/.test(newPassword.value)
}))

// 表单验证
const isFormValid = computed(() => {
  return oldPassword.value.length > 0 &&
         newPassword.value.length >= 6 &&
         confirmPassword.value === newPassword.value &&
         passwordValidation.value.length &&
         passwordValidation.value.number
})

// 清除错误
const clearError = (field: keyof typeof errors.value) => {
  errors.value[field] = ''
  generalError.value = ''
}

// 验证表单
const validateForm = () => {
  let isValid = true

  // 重置错误
  errors.value = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  }

  // 验证当前密码
  if (!oldPassword.value) {
    errors.value.oldPassword = 'Current password is required'
    isValid = false
  }

  // 验证新密码
  if (!newPassword.value) {
    errors.value.newPassword = 'New password is required'
    isValid = false
  } else if (newPassword.value.length < 6) {
    errors.value.newPassword = 'Password must be at least 6 characters'
    isValid = false
  } else if (!/\d/.test(newPassword.value)) {
    errors.value.newPassword = 'Password must contain at least one number'
    isValid = false
  }

  // 验证确认密码
  if (!confirmPassword.value) {
    errors.value.confirmPassword = 'Please confirm your new password'
    isValid = false
  } else if (confirmPassword.value !== newPassword.value) {
    errors.value.confirmPassword = 'Passwords do not match'
    isValid = false
  }

  // 检查新密码是否与旧密码相同
  if (oldPassword.value && newPassword.value && oldPassword.value === newPassword.value) {
    errors.value.newPassword = 'New password must be different from current password'
    isValid = false
  }

  return isValid
}

// 修改密码
const changePassword = async () => {
  if (!validateForm()) return

  try {
    loading.value = true
    generalError.value = ''
    successMessage.value = ''

    const response = await fetch(`${APP_CONFIG.API_BASE_URL}/wallets/change_password/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        device_id: authStore.deviceId,
        old_password: oldPassword.value,
        new_password: newPassword.value,
        confirm_password: confirmPassword.value
      })
    })

    const data = await response.json()

    if (response.ok && data.state === 'success') {
      successMessage.value = 'Password changed successfully!'

      // 清空表单
      oldPassword.value = ''
      newPassword.value = ''
      confirmPassword.value = ''

      // 2秒后返回设置页面
      setTimeout(() => {
        router.push('/settings')
      }, 2000)
    } else {
      // 处理API错误
      if (data.message) {
        generalError.value = data.message
      } else if (data.error) {
        generalError.value = data.error
      } else {
        generalError.value = 'Failed to change password. Please try again.'
      }
    }
  } catch (error) {
    console.error('Change password error:', error)
    generalError.value = 'Network error. Please check your connection and try again.'
  } finally {
    loading.value = false
  }
}

// 监听新密码变化，自动清除确认密码错误
watch(newPassword, () => {
  if (errors.value.confirmPassword && confirmPassword.value === newPassword.value) {
    errors.value.confirmPassword = ''
  }
})
</script>

<style lang="scss" scoped>
.change-password-page {
  width: 100%;
  height: 100vh;
  background: #0F172A;
  color: #f1f5f9;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.password-form {
  max-width: 100%;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 12px;
}

.password-input-container {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 16px 48px 16px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #f1f5f9;
  font-size: 16px;
  transition: all 0.3s ease;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #6366f1;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  &.error {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }

  &::placeholder {
    color: #64748b;
  }
}

.password-toggle {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s ease;

  &:hover {
    color: #f1f5f9;
    background: rgba(255, 255, 255, 0.05);
  }

  i {
    font-size: 18px;
  }
}

.error-message {
  color: #ef4444;
  font-size: 13px;
  margin-top: 8px;
  font-weight: 500;
}

.password-form {
  max-width: 400px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #f1f5f9;
  margin-bottom: 8px;
}

.password-input-container {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 12px 40px 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #f1f5f9;
  font-size: 16px;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  background: rgba(255, 255, 255, 0.08);
}

.form-input.error {
  border-color: #ef4444;
}

.form-input::placeholder {
  color: #64748b;
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
  padding: 4px;
  transition: color 0.2s ease;
}

.password-toggle:hover {
  color: #f1f5f9;
}

.error-message {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
}

.password-requirements {
  background: rgba(99, 102, 241, 0.05);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 32px;
}

.requirements-title {
  font-size: 14px;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 12px;
}

.requirements-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.requirements-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #64748b;
  margin-bottom: 8px;
  transition: all 0.3s ease;

  &.valid {
    color: #22c55e;
  }

  i {
    font-size: 16px;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.general-error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  padding: 16px;
  color: #ef4444;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;

  &::before {
    content: '⚠️';
    font-size: 16px;
  }
}

.success-message {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 12px;
  padding: 16px;
  color: #22c55e;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 24px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;

  &::before {
    content: '✅';
    font-size: 16px;
  }
}

.form-actions {
  display: flex;
  gap: 16px;
  margin-top: 40px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn {
  flex: 1;
  padding: 16px 24px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 52px;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  color: #f1f5f9;
  border: 1px solid rgba(255, 255, 255, 0.2);

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.12);
    transform: translateY(-1px);
  }
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: 1px solid transparent;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #5b5bd6 0%, #7c3aed 100%);
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(99, 102, 241, 0.3);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 页面进入动画
.change-password-page {
  animation: fadeInUp 0.4s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
