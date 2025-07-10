// 会话管理工具

import { useAuthStore } from '@shared/stores/auth'
import { useRouter } from 'vue-router'
import { APP_CONFIG, STORAGE_KEYS } from '@shared/constants'
import { getStorage } from '@shared/utils/chrome-mock'

let sessionCheckInterval: NodeJS.Timeout | null = null

/**
 * 启动会话检查定时器
 */
export function startSessionCheck() {
  // 清除现有的定时器
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval)
  }
  
  // 每5分钟检查一次会话状态
  sessionCheckInterval = setInterval(async () => {
    const authStore = useAuthStore()

    // 重新检查会话状态
    await authStore.checkPasswordSession()

    // 如果用户已设置密码但会话无效，需要重新验证
    if (authStore.hasPaymentPassword && !authStore.isPasswordSessionValid) {
      console.log('Session expired during periodic check, redirecting to verify password')

      // 清除会话
      await authStore.clearPasswordSession()

      // 跳转到密码验证页面
      const router = useRouter()
      router.push('/verify-password')
    }
  }, 5 * 60 * 1000) // 每5分钟检查一次
  
  console.log('Session check started')
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
 * 在用户活动时刷新会话
 */
export function setupActivityRefresh() {
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
  let lastActivity = Date.now()
  
  const handleActivity = async () => {
    const now = Date.now()
    // 如果距离上次活动超过5分钟，刷新会话
    if (now - lastActivity > 5 * 60 * 1000) {
      const authStore = useAuthStore()
      if (authStore.isPasswordSessionValid) {
        await refreshSession()
      }
    }
    lastActivity = now
  }
  
  events.forEach(event => {
    document.addEventListener(event, handleActivity, true)
  })
  
  console.log('Activity-based session refresh enabled')
}
