// 应用初始化工具
import type { Router } from 'vue-router'
import { useAuthStore } from '@shared/stores/auth'
import { useWalletStore } from '@shared/stores/wallet'
import { startSessionCheck, setupActivityRefresh } from '@shared/utils/session-manager'
import { routeGuard } from '@shared/utils/route-guard'

/**
 * 统一的应用初始化逻辑
 * @param router Vue Router 实例
 * @param mode 应用模式 ('popup' | 'sidepanel')
 * @returns 初始化是否成功
 */
export async function initializeApp(router: Router, mode: 'popup' | 'sidepanel'): Promise<boolean> {
  console.log(`🚀 开始初始化 ${mode} 应用`)
  
  try {
    const authStore = useAuthStore()
    const walletStore = useWalletStore()

    // 1. 初始化认证状态
    console.log('🔐 初始化认证状态...')
    if (!authStore.isAuthenticated) {
      await authStore.initialize()
    }

    // 2. 启动会话检查和活动刷新
    console.log('⏰ 启动会话管理...')
    startSessionCheck()
    setupActivityRefresh()

    // 3. 使用路由守卫确定初始路由
    console.log('🛡️ 执行路由守卫检查...')
    const redirectPath = await routeGuard(router, '/')
    
    if (redirectPath) {
      console.log(`🔄 路由守卫重定向到: ${redirectPath}`)
      await router.replace(redirectPath)
    } else {
      console.log('🏠 跳转到首页')
      await router.replace('/')
    }

    console.log(`✅ ${mode} 应用初始化成功`)
    return true

  } catch (error) {
    console.error(`❌ ${mode} 应用初始化失败:`, error)
    return false
  }
}
