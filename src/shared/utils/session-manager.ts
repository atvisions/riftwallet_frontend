// 会话管理工具

import { useAuthStore } from '@shared/stores/auth'
import { useRouter } from 'vue-router'
import { APP_CONFIG, STORAGE_KEYS } from '@shared/constants'
import { getStorage } from '@shared/utils/chrome-mock'

let sessionCheckInterval: NodeJS.Timeout | null = null
let lastActivityTime = Date.now()
let activityListenersSetup = false

/**
 * 获取Auto-lock设置
 */
async function getAutoLockSettings() {
  try {
    const storage = getStorage()
    const result = await storage.get(['settings'])
    const settings = result.settings || {}

    return {
      autoLock: settings.autoLock !== false, // 默认开启
      lockTimeout: settings.lockTimeout || 30 // 默认30分钟
    }
  } catch (error) {
    console.error('Failed to get auto-lock settings:', error)
    return {
      autoLock: true,
      lockTimeout: 30
    }
  }
}

/**
 * 检查是否应该锁定钱包
 */
async function shouldLockWallet(): Promise<boolean> {
  const settings = await getAutoLockSettings()

  // 如果关闭了Auto-lock，永不锁定
  if (!settings.autoLock) {
    return false
  }

  // 如果设置为"永不"锁定
  if (settings.lockTimeout === -1) {
    return false
  }

  // 如果设置为"立即"锁定
  if (settings.lockTimeout === 0) {
    return true
  }

  // 检查用户不活动时间
  const now = Date.now()
  const inactiveTime = now - lastActivityTime
  const timeoutMs = settings.lockTimeout * 60 * 1000 // 转换为毫秒

  return inactiveTime >= timeoutMs
}

/**
 * 启动会话检查定时器
 */
export function startSessionCheck() {
  // 清除现有的定时器
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval)
  }

  // 设置活动监听器
  setupActivityListeners()

  // 每30秒检查一次会话状态（更频繁的检查）
  sessionCheckInterval = setInterval(async () => {
    const authStore = useAuthStore()

    // 如果用户没有设置密码，不需要检查
    if (!authStore.hasPaymentPassword) {
      return
    }

    // 检查是否应该锁定钱包
    const shouldLock = await shouldLockWallet()

    if (shouldLock) {
      console.log('Auto-lock triggered due to inactivity, redirecting to verify password')

      // 清除会话
      await authStore.clearPasswordSession()

      // 跳转到密码验证页面
      const router = useRouter()
      router.push('/verify-password')
    }
  }, 30 * 1000) // 每30秒检查一次

  console.log('Session check started with activity-based auto-lock')
}

/**
 * 停止会话检查定时器
 */
export function stopSessionCheck() {
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval)
    sessionCheckInterval = null
    console.log('Session check stopped')
  }
}

/**
 * 手动检查会话状态
 */
export async function checkSessionStatus(): Promise<boolean> {
  const authStore = useAuthStore()
  await authStore.checkPasswordSession()
  return authStore.isPasswordSessionValid
}

/**
 * 刷新会话（重置过期时间）
 */
export async function refreshSession(): Promise<void> {
  const authStore = useAuthStore()
  await authStore.setPasswordSession()
  console.log('Session refreshed')
}

/**
 * 获取会话剩余时间（毫秒）
 */
export async function getSessionRemainingTime(): Promise<number> {
  try {
    const storage = getStorage()
    const result = await storage.get([STORAGE_KEYS.LAST_PASSWORD_TIME])
    const lastPasswordTime = result[STORAGE_KEYS.LAST_PASSWORD_TIME]

    if (!lastPasswordTime) {
      return 0
    }

    const now = Date.now()
    const elapsed = now - lastPasswordTime
    const remaining = APP_CONFIG.PASSWORD_SESSION_TIMEOUT - elapsed

    return Math.max(0, remaining)
  } catch (error) {
    console.error('Failed to get session remaining time:', error)
    return 0
  }
}

/**
 * 格式化剩余时间为可读字符串
 */
export function formatRemainingTime(milliseconds: number): string {
  if (milliseconds <= 0) {
    return 'Expired'
  }
  
  const minutes = Math.floor(milliseconds / (1000 * 60))
  const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000)
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  } else {
    return `${seconds}s`
  }
}

/**
 * 设置活动监听器
 */
function setupActivityListeners() {
  if (activityListenersSetup) {
    return
  }

  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']

  const handleActivity = () => {
    lastActivityTime = Date.now()
    // console.log('User activity detected, updating last activity time')
  }

  events.forEach(event => {
    document.addEventListener(event, handleActivity, true)
  })

  activityListenersSetup = true
  console.log('Activity listeners setup completed')
}

/**
 * 在用户活动时刷新会话（保留原有接口）
 */
export function setupActivityRefresh() {
  setupActivityListeners()
}
