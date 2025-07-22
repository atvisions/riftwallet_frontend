// 简化的认证处理器
import type { Router } from 'vue-router'
import { useAuthStore } from '@shared/stores/auth'
import { useWalletStore } from '@shared/stores/wallet'

/**
 * 简化的应用初始化
 */
export async function initializeAppSimple(router: Router, mode: 'popup' | 'sidepanel'): Promise<void> {
  console.log(`🚀 开始简化初始化 ${mode} 应用`)

  try {
    const authStore = useAuthStore()

    // 1. 初始化认证状态
    if (!authStore.isAuthenticated) {
      await authStore.initialize()
    }

    // 2. 检查密码设置状态
    if (!authStore.hasPaymentPassword) {
      console.log('🔐 未设置密码，跳转到设置密码页面')
      await router.replace('/setup-password')
      return
    }

    // 3. 检查密码会话状态
    if (!authStore.isPasswordSessionValid) {
      console.log('🔐 需要验证密码，跳转到验证页面')
      await router.replace('/verify-password')
      return
    }

    // 4. 会话有效，检查钱包状态
    console.log('✅ 会话有效，检查钱包状态')
    const walletStore = useWalletStore()
    await walletStore.loadWallets()

    if (walletStore.wallets.length === 0) {
      console.log('💼 没有钱包，跳转到钱包选择页面')
      await router.replace('/wallet-choice')
      return
    }

    // 5. 跳转到首页
    console.log('🏠 跳转到首页')
    await router.replace('/')

    console.log(`✅ ${mode} 应用初始化完成`)

  } catch (error) {
    console.error(`❌ ${mode} 应用初始化失败:`, error)
    // 出错时跳转到验证页面
    await router.replace('/verify-password')
  }
}
