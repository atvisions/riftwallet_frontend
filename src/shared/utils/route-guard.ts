// 路由守卫工具 - 统一的密码验证和跳转逻辑

import { useAuthStore } from '@shared/stores/auth'
import { useWalletStore } from '@shared/stores/wallet'
import type { Router } from 'vue-router'

// 验证状态管理
let isVerifyingPassword = false
let verificationPromise: Promise<void> | null = null

/**
 * 设置密码验证标志
 */
export function setVerifyingPassword(): void {
  isVerifyingPassword = true
  sessionStorage.setItem('isVerifyingPassword', 'true')
  console.log('🔐 设置密码验证标志: true')
}

/**
 * 重置密码验证标志
 */
export function resetVerifyingFlag(): void {
  isVerifyingPassword = false
  sessionStorage.removeItem('isVerifyingPassword')
  console.log('🔐 重置密码验证标志: false')
}

/**
 * 检查是否正在验证密码
 */
export function isCurrentlyVerifying(): boolean {
  const sessionFlag = sessionStorage.getItem('isVerifyingPassword') === 'true'
  return isVerifyingPassword || sessionFlag
}

/**
 * 密码验证成功后的统一处理逻辑
 */
export async function handlePostPasswordVerification(router: Router): Promise<void> {
  console.log('🎉 开始处理密码验证成功后的逻辑')

  try {
    const authStore = useAuthStore()
    const walletStore = useWalletStore()

    // 确保认证状态已更新
    console.log('🔍 验证后的认证状态:', {
      isAuthenticated: authStore.isAuthenticated,
      hasPaymentPassword: authStore.hasPaymentPassword,
      isPasswordSessionValid: authStore.isPasswordSessionValid
    })

    // 等待状态完全更新，增加等待时间
    await new Promise(resolve => setTimeout(resolve, 200))

    // 多次确认会话状态，确保状态已正确更新
    let retryCount = 0
    const maxRetries = 5

    while (!authStore.isPasswordSessionValid && retryCount < maxRetries) {
      console.warn(`⚠️ 密码会话状态未正确更新，重新检查 (${retryCount + 1}/${maxRetries})`)
      await authStore.checkPasswordSession()
      await new Promise(resolve => setTimeout(resolve, 100))
      retryCount++
    }

    if (!authStore.isPasswordSessionValid) {
      console.error('❌ 密码会话状态更新失败，但继续跳转')
    } else {
      console.log('✅ 密码会话状态确认有效')
    }

    // 加载钱包数据
    console.log('📱 开始加载钱包列表')
    await walletStore.loadWallets()
    console.log('📊 钱包加载完成，钱包数量:', walletStore.wallets.length)

    // 重置验证标志
    resetVerifyingFlag()

    // 根据钱包状态决定跳转目标
    const targetRoute = walletStore.wallets.length > 0 ? '/' : '/wallet-choice'

    console.log(`🏠 准备跳转到: ${targetRoute}`)
    console.log('🔍 跳转前最终状态检查:', {
      isPasswordSessionValid: authStore.isPasswordSessionValid,
      walletsCount: walletStore.wallets.length
    })

    // 使用 replace 避免在历史记录中留下验证页面
    await router.replace(targetRoute)

    console.log('✅ 密码验证后跳转完成')
  } catch (error) {
    console.error('❌ 密码验证后处理失败:', error)
    resetVerifyingFlag()
    throw error
  }
}

/**
 * 统一的密码验证处理函数
 */
export async function handlePasswordVerification(
  password: string, 
  router: Router
): Promise<{ success: boolean; error?: string }> {
  if (!password) {
    return { success: false, error: 'Password is required' }
  }

  // 防止重复验证
  if (isCurrentlyVerifying()) {
    console.log('🔐 密码验证已在进行中，跳过重复验证')
    if (verificationPromise) {
      await verificationPromise
    }
    return { success: true }
  }

  try {
    // 设置验证标志
    setVerifyingPassword()
    
    // 创建验证Promise
    verificationPromise = performPasswordVerification(password, router)
    await verificationPromise
    
    return { success: true }
  } catch (error) {
    console.error('🔐 密码验证失败:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Password verification failed' 
    }
  } finally {
    verificationPromise = null
  }
}

/**
 * 执行实际的密码验证
 */
async function performPasswordVerification(password: string, router: Router): Promise<void> {
  console.log('🔐 开始执行密码验证')
  
  const authStore = useAuthStore()
  
  console.log('🏪 当前认证状态:', {
    isAuthenticated: authStore.isAuthenticated,
    deviceId: authStore.deviceId,
    hasPaymentPassword: authStore.hasPaymentPassword,
    isPasswordSessionValid: authStore.isPasswordSessionValid
  })

  // 调用密码验证API
  const isValid = await authStore.verifyPaymentPassword(password)
  console.log('✅ 密码验证结果:', isValid)

  if (!isValid) {
    resetVerifyingFlag()
    throw new Error('Invalid password. Please try again.')
  }

  // 验证成功，处理后续逻辑
  await handlePostPasswordVerification(router)
}

/**
 * 检查是否需要密码验证
 */
export async function shouldRequirePasswordVerification(): Promise<boolean> {
  const authStore = useAuthStore()
  
  // 没有设置密码，不需要验证
  if (!authStore.hasPaymentPassword) {
    return false
  }
  
  // 会话有效，不需要验证
  if (authStore.isPasswordSessionValid) {
    return false
  }
  
  return true
}

/**
 * 统一的路由守卫逻辑
 */
export async function routeGuard(
  router: Router, 
  targetPath: string = '/'
): Promise<string | null> {
  console.log('🛡️ 执行路由守卫检查，目标路径:', targetPath)
  
  const authStore = useAuthStore()
  
  // 确保认证状态已初始化
  if (!authStore.isAuthenticated) {
    await authStore.initialize()
  }
  
  // 检查密码设置状态
  if (!authStore.hasPaymentPassword) {
    console.log('🔐 未设置密码，跳转到设置密码页面')
    return '/setup-password'
  }
  
  // 检查密码会话状态
  if (!authStore.isPasswordSessionValid) {
    // 如果正在验证密码，不要重复跳转
    if (isCurrentlyVerifying()) {
      console.log('🔐 密码验证正在进行中，跳过路由守卫')
      return null
    }

    console.log('🔐 密码会话无效，需要验证密码')
    return '/verify-password'
  }
  
  // 如果目标是首页，检查钱包状态
  if (targetPath === '/') {
    const walletStore = useWalletStore()
    await walletStore.loadWallets()
    
    if (walletStore.wallets.length === 0) {
      console.log('💼 没有钱包，跳转到钱包选择页面')
      return '/wallet-choice'
    }
  }
  
  console.log('✅ 路由守卫检查通过')
  return null // 不需要重定向
}
