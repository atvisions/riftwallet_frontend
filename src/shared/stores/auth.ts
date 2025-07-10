import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { STORAGE_KEYS, APP_CONFIG } from '@shared/constants'
import { generateDeviceId } from '@shared/utils'
import { getStorage, initChromeMock } from '@shared/utils/chrome-mock'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const isAuthenticated = ref(false)
  const deviceId = ref('')
  const hasPaymentPassword = ref(false)
  const isPasswordSessionValid = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const isInitialized = computed(() => !!deviceId.value)
  const needsPasswordSetup = computed(() => isInitialized.value && !hasPaymentPassword.value)
  const canAccessWallet = computed(() => hasPaymentPassword.value && isPasswordSessionValid.value)

  // 初始化
  const initialize = async () => {
    try {
      loading.value = true

      // 初始化 Chrome API 模拟器（开发环境）
      initChromeMock()

      // 获取存储实例
      const storage = getStorage()

      // 从存储中获取设备ID
      const result = await storage.get([
        STORAGE_KEYS.DEVICE_ID,
        STORAGE_KEYS.PAYMENT_PASSWORD_SET,
        STORAGE_KEYS.LAST_PASSWORD_TIME
      ])

      if (result[STORAGE_KEYS.DEVICE_ID]) {
        deviceId.value = result[STORAGE_KEYS.DEVICE_ID]

        // 检查服务器端密码状态
        await checkPasswordStatus()

        // 如果已设置密码，检查密码会话是否有效
        if (hasPaymentPassword.value) {
          await checkPasswordSession()
        }

        isAuthenticated.value = true
      } else {
        // 首次使用，生成设备ID
        const newDeviceId = generateDeviceId()
        deviceId.value = newDeviceId

        await storage.set({
          [STORAGE_KEYS.DEVICE_ID]: newDeviceId
        })

        // 新用户，检查密码状态
        await checkPasswordStatus()

        // 新用户密码会话无效
        isPasswordSessionValid.value = false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to initialize'
      console.error('Failed to initialize auth:', err)
    } finally {
      loading.value = false
    }
  }

  // 检查密码会话是否有效
  const checkPasswordSession = async () => {
    try {
      const storage = getStorage()
      const result = await storage.get([STORAGE_KEYS.LAST_PASSWORD_TIME])
      const lastPasswordTime = result[STORAGE_KEYS.LAST_PASSWORD_TIME]

      console.log('Checking password session:', {
        lastPasswordTime,
        now: Date.now(),
        timeout: APP_CONFIG.PASSWORD_SESSION_TIMEOUT
      })

      if (lastPasswordTime) {
        const now = Date.now()
        const timeDiff = now - lastPasswordTime
        const isValid = timeDiff < APP_CONFIG.PASSWORD_SESSION_TIMEOUT

        console.log('Session check result:', {
          timeDiff,
          isValid,
          remainingTime: APP_CONFIG.PASSWORD_SESSION_TIMEOUT - timeDiff
        })

        isPasswordSessionValid.value = isValid
      } else {
        console.log('No last password time found, session invalid')
        isPasswordSessionValid.value = false
      }
    } catch (err) {
      console.error('Failed to check password session:', err)
      isPasswordSessionValid.value = false
    }
  }

  // 设置密码会话
  const setPasswordSession = async () => {
    try {
      const storage = getStorage()
      const now = Date.now()
      await storage.set({
        [STORAGE_KEYS.LAST_PASSWORD_TIME]: now
      })
      isPasswordSessionValid.value = true

      console.log('Password session set:', {
        timestamp: now,
        expiresAt: now + APP_CONFIG.PASSWORD_SESSION_TIMEOUT,
        timeoutMinutes: APP_CONFIG.PASSWORD_SESSION_TIMEOUT / (1000 * 60)
      })
    } catch (err) {
      console.error('Failed to set password session:', err)
    }
  }

  // 清除密码会话
  const clearPasswordSession = async () => {
    try {
      const storage = getStorage()
      await storage.remove([STORAGE_KEYS.LAST_PASSWORD_TIME])
      isPasswordSessionValid.value = false
    } catch (err) {
      console.error('Failed to clear password session:', err)
    }
  }

  // 设置支付密码
  const setPaymentPassword = async (password: string) => {
    try {
      loading.value = true
      error.value = null

      const response = await fetch(`${APP_CONFIG.API_BASE_URL}/wallets/set_password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          device_id: deviceId.value,
          payment_password: password,
          payment_password_confirm: password
        })
      })

      const data = await response.json()

      console.log('Set password request body:', {
        device_id: deviceId.value,
        payment_password: password,
        payment_password_confirm: password
      })
      console.log('Set password response:', response.status, data)

      // 如果是400错误，打印详细信息
      if (response.status === 400) {
        console.error('400 Bad Request Details:', {
          status: response.status,
          statusText: response.statusText,
          data: data,
          url: response.url
        })
      }

      if (data.state === 'success') {
        hasPaymentPassword.value = true
        const storage = getStorage()
        await storage.set({
          [STORAGE_KEYS.PAYMENT_PASSWORD_SET]: true
        })
        // 设置密码会话
        await setPasswordSession()
      } else if (response.status === 400 && data.message?.includes('already set')) {
        // 密码已经设置过了，直接设置状态
        hasPaymentPassword.value = true
        const storage = getStorage()
        await storage.set({
          [STORAGE_KEYS.PAYMENT_PASSWORD_SET]: true
        })
        // 验证密码并设置会话
        const isValid = await verifyPaymentPassword(password)
        if (!isValid) {
          throw new Error('Password verification failed')
        }
      } else {
        throw new Error(data.message || 'Failed to set password')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to set password'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 验证支付密码
  const verifyPaymentPassword = async (password: string): Promise<boolean> => {
    try {
      loading.value = true
      error.value = null

      const response = await fetch(`${APP_CONFIG.API_BASE_URL}/wallets/verify_password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          device_id: deviceId.value,
          payment_password: password
        })
      })

      const data = await response.json()

      if (data.state === 'success') {
        // 验证成功，设置密码会话
        await setPasswordSession()
        return true
      } else {
        throw new Error(data.message || 'Invalid password')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Password verification failed'
      return false
    } finally {
      loading.value = false
    }
  }

  // 修改支付密码
  const changePaymentPassword = async (oldPassword: string, newPassword: string) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await fetch('http://192.168.3.56:8000/api/v1/wallets/change_password/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          device_id: deviceId.value,
          old_password: oldPassword,
          new_password: newPassword
        })
      })
      
      const data = await response.json()
      
      if (data.status !== 'success') {
        throw new Error(data.message || 'Failed to change password')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to change password'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 检查支付密码状态
  const checkPasswordStatus = async () => {
    if (!deviceId.value) return

    try {
      const response = await fetch(`${APP_CONFIG.API_BASE_URL}/wallets/payment_password/status/${deviceId.value}/`)
      const data = await response.json()

      console.log('Password status response:', response.status, data)

      if (data.state === 'success') {
        hasPaymentPassword.value = data.data?.has_password || false
        const storage = getStorage()
        await storage.set({
          [STORAGE_KEYS.PAYMENT_PASSWORD_SET]: hasPaymentPassword.value
        })

        console.log('Password status updated:', hasPaymentPassword.value)
      }
    } catch (err) {
      console.error('Failed to check password status:', err)
      // 如果网络错误，从本地存储获取状态
      const storage = getStorage()
      const result = await storage.get([STORAGE_KEYS.PAYMENT_PASSWORD_SET])
      hasPaymentPassword.value = result[STORAGE_KEYS.PAYMENT_PASSWORD_SET] || false
    }
  }

  // 登出
  const logout = async () => {
    isAuthenticated.value = false
    hasPaymentPassword.value = false

    // 清除敏感数据，但保留设备ID
    const storage = getStorage()
    await storage.remove([
      STORAGE_KEYS.WALLETS,
      STORAGE_KEYS.CURRENT_WALLET,
      STORAGE_KEYS.BALANCES,
      STORAGE_KEYS.TRANSACTIONS
    ])
  }

  // 重置状态
  const reset = async () => {
    isAuthenticated.value = false
    deviceId.value = ''
    hasPaymentPassword.value = false
    loading.value = false
    error.value = null

    // 清除所有存储数据
    const storage = getStorage()
    await storage.clear()
  }

  return {
    // 状态
    isAuthenticated,
    deviceId,
    hasPaymentPassword,
    isPasswordSessionValid,
    loading,
    error,

    // 计算属性
    isInitialized,
    needsPasswordSetup,
    canAccessWallet,

    // 方法
    initialize,
    setPaymentPassword,
    verifyPaymentPassword,
    changePaymentPassword,
    checkPasswordStatus,
    checkPasswordSession,
    setPasswordSession,
    clearPasswordSession,
    logout,
    reset
  }
})
