import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Wallet, WalletToken, WalletBalance, ApiResponse } from '@shared/types'
import { MESSAGE_TYPES, APP_CONFIG } from '@shared/constants'
import { useAuthStore } from './auth'
import { isExtensionEnvironment } from '@shared/utils/chrome-mock'

export const useWalletStore = defineStore('wallet', () => {
  // 状态
  const wallets = ref<Wallet[]>([])
  const currentWallet = ref<Wallet | null>(null)
  const balances = ref<{ [walletId: number]: WalletBalance }>({})
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const currentWalletTokens = computed(() => {
    if (!currentWallet.value) return []
    const balance = balances.value[currentWallet.value.id]
    return balance?.tokens || []
  })

  const totalBalance = computed(() => {
    if (!currentWallet.value) return '0'
    const balance = balances.value[currentWallet.value.id]
    return balance?.total_value_usd || '0'
  })

  // 发送消息到background script
  const sendMessage = async (type: string, data?: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type, data }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
          return
        }
        
        if (response.success) {
          resolve(response.data)
        } else {
          reject(new Error(response.error || 'Unknown error'))
        }
      })
    })
  }

  // 加载钱包列表
  const loadWallets = async (autoSelectWallet = true) => {
    try {
      loading.value = true
      error.value = null

      // 在开发环境中直接调用 API，而不是通过 background script
      const authStore = useAuthStore()
      if (!authStore.deviceId) {
        console.log('No device ID found, cannot load wallets')
        wallets.value = []
        return
      }

      console.log('Loading wallets for device:', authStore.deviceId)

      // 直接调用 API 获取钱包列表
      const response = await fetch(`${APP_CONFIG.API_BASE_URL}/wallets/?device_id=${authStore.deviceId}`)
      const data = await response.json()

      console.log('Wallets API response:', data)

      if (data.state === 'success') {
        wallets.value = data.data || []
        console.log('Loaded wallets:', wallets.value)

        // 尝试恢复之前保存的当前钱包（只有在 autoSelectWallet 为 true 时）
        if (autoSelectWallet && wallets.value.length > 0 && !currentWallet.value) {
          try {
            console.log('Attempting to restore current wallet...')
            const savedWalletData = await sendMessage('GET_CURRENT_WALLET')
            console.log('Saved wallet data:', savedWalletData)

            if (savedWalletData && savedWalletData.walletId) {
              const savedWalletId = savedWalletData.walletId
              console.log('Looking for wallet with ID:', savedWalletId)
              console.log('Available wallets:', wallets.value.map(w => ({ id: w.id, chain: w.chain, name: w.name })))

              const savedWallet = wallets.value.find(w => w.id === savedWalletId)
              if (savedWallet) {
                currentWallet.value = savedWallet
                console.log('✅ Restored current wallet:', savedWallet.id, savedWallet.chain, savedWallet.name)
              } else {
                console.log('❌ Saved wallet not found, selecting first wallet')
                currentWallet.value = wallets.value[0]
                console.log('Selected first wallet:', wallets.value[0].id, wallets.value[0].chain, wallets.value[0].name)
              }
            } else {
              console.log('❌ No saved wallet data, selecting first wallet')
              currentWallet.value = wallets.value[0]
              console.log('Selected first wallet:', wallets.value[0].id, wallets.value[0].chain, wallets.value[0].name)
            }
          } catch (err) {
            console.error('❌ Failed to restore current wallet:', err)
            // 出错时选择第一个钱包
            currentWallet.value = wallets.value[0]
            console.log('Selected first wallet due to error:', wallets.value[0].id, wallets.value[0].chain, wallets.value[0].name)
          }
        }
      } else {
        throw new Error(data.message || 'Failed to load wallets')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load wallets'
      console.error('Failed to load wallets:', err)
    } finally {
      loading.value = false
    }
  }

  // 创建钱包
  const createWallet = async (walletData: {
    chain: string
    name?: string
  }) => {
    try {
      loading.value = true
      error.value = null
      
      const newWallet = await sendMessage(MESSAGE_TYPES.CREATE_WALLET, walletData)
      
      // 重新加载钱包列表
      await loadWallets()
      
      return newWallet
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create wallet'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 导入钱包
  const importWallet = async (importData: {
    private_key?: string
    mnemonic?: string
    address?: string
    chain: string
    wallet_name?: string
    payment_password?: string
    kadena_chain_id?: string
  }) => {
    try {
      loading.value = true
      error.value = null

      // 检查是否在扩展环境中
      if (isExtensionEnvironment()) {
        // 在扩展环境中使用消息传递
        const newWallet = await sendMessage(MESSAGE_TYPES.IMPORT_WALLET, importData)

        // 重新加载钱包列表
        await loadWallets()

        return newWallet
      } else {
        // 在浏览器环境中直接调用 API
        const authStore = useAuthStore()
        if (!authStore.deviceId) {
          throw new Error('Device ID not found')
        }

        // 构建请求数据
        const requestData = {
          device_id: authStore.deviceId,
          chain: importData.chain,
          payment_password: importData.payment_password,
          kadena_chain_id: importData.kadena_chain_id || '0'
        }

        // 根据导入类型添加相应字段
        if (importData.private_key) {
          Object.assign(requestData, { private_key: importData.private_key })
        } else if (importData.mnemonic) {
          Object.assign(requestData, { mnemonic: importData.mnemonic })
        } else if (importData.address) {
          Object.assign(requestData, { address: importData.address })
        }

        console.log('Import wallet request data:', requestData)

        // 选择正确的 API 端点
        let endpoint = '/wallets/import_private_key/'
        if (importData.mnemonic) {
          endpoint = '/wallets/import_by_mnemonic/'
        } else if (importData.address) {
          endpoint = '/wallets/import_watch_only/'
        }

        const response = await fetch(`${APP_CONFIG.API_BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        })

        const data = await response.json()

        console.log('Import wallet response:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        })

        if (response.ok && data.state === 'success') {
          // 重新加载钱包列表
          await loadWallets()

          return data.data
        } else {
          console.error('Import wallet failed:', data)
          console.error('Response status:', response.status)
          console.error('Response ok:', response.ok)
          console.error('Data state:', data.state)
          console.error('Error message:', data.message)
          console.error('Non field errors:', data.non_field_errors)
          console.error('Full error data:', JSON.stringify(data, null, 2))

          // 根据HTTP状态码和错误信息提供更准确的错误提示
          if (response.status === 400) {
            // 获取错误信息，可能在 message、non_field_errors 或其他字段中
            let errorMessage = ''

            if (data.message) {
              errorMessage = data.message
            } else if (data.non_field_errors && Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
              errorMessage = data.non_field_errors[0]
            } else if (data.error) {
              errorMessage = data.error
            } else if (typeof data === 'string') {
              errorMessage = data
            }

            const lowerErrorMessage = errorMessage.toLowerCase()

            console.log('Checking error message:', errorMessage)
            console.log('Lowercase error message:', lowerErrorMessage)

            // 检查密码相关错误
            if (lowerErrorMessage.includes('password')) {
              throw new Error('Incorrect password. Please check your payment password.')
            }
            // 检查私钥相关错误
            else if (lowerErrorMessage.includes('private key') || lowerErrorMessage.includes('privatekey')) {
              throw new Error('Invalid private key. Please check your private key format.')
            }
            // 检查助记词相关错误
            else if (lowerErrorMessage.includes('mnemonic') || lowerErrorMessage.includes('recovery phrase')) {
              throw new Error('Invalid recovery phrase. Please check your 12-word phrase.')
            }
            // 检查一般性无效输入
            else if (lowerErrorMessage.includes('invalid') || lowerErrorMessage.includes('wrong') || lowerErrorMessage.includes('incorrect')) {
              throw new Error('Invalid input. Please check your private key and password.')
            }
            // 默认错误
            else {
              throw new Error(errorMessage || 'Invalid request. Please check your input.')
            }
          } else if (response.status === 401) {
            throw new Error('Authentication failed. Please check your password.')
          } else if (response.status === 403) {
            throw new Error('Access denied. Please check your permissions.')
          } else if (response.status === 404) {
            throw new Error('Service not found. Please try again later.')
          } else if (response.status >= 500) {
            throw new Error('Server error. Please try again later.')
          } else {
            throw new Error(data.message || 'Import failed. Please try again.')
          }
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to import wallet'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 导入助记词钱包
  const importMnemonic = async (importData: {
    mnemonic: string
    chain: string
    payment_password: string
    kadena_chain_id?: string
  }) => {
    return await importWallet({
      mnemonic: importData.mnemonic,
      chain: importData.chain,
      payment_password: importData.payment_password,
      kadena_chain_id: importData.kadena_chain_id || '0'
    })
  }

  // 删除钱包
  const deleteWallet = async (walletId: number) => {
    try {
      loading.value = true
      error.value = null
      
      await sendMessage(MESSAGE_TYPES.DELETE_WALLET, { walletId })
      
      // 从本地状态中移除
      wallets.value = wallets.value.filter(w => w.id !== walletId)
      
      // 如果删除的是当前钱包，切换到第一个钱包
      if (currentWallet.value?.id === walletId) {
        currentWallet.value = wallets.value.length > 0 ? wallets.value[0] : null
      }
      
      // 清除余额数据
      delete balances.value[walletId]
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete wallet'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 设置当前钱包
  const setCurrentWallet = async (wallet: Wallet | null) => {
    if (wallet) {
      console.log('🔄 Setting current wallet:', wallet.id, wallet.chain, wallet.name)
      currentWallet.value = wallet

      // 持久化当前钱包ID到存储
      try {
        await sendMessage('SET_CURRENT_WALLET', { walletId: wallet.id })
        console.log('✅ Current wallet saved to storage:', wallet.id)
      } catch (err) {
        console.error('❌ Failed to save current wallet:', err)
      }

      // 如果没有余额数据，加载余额
      if (!balances.value[wallet.id]) {
        loadWalletBalance(wallet.id)
      }
    } else {
      currentWallet.value = null
    }
  }

  // 更新钱包信息
  const updateWallet = (updatedWallet: Wallet) => {
    const index = wallets.value.findIndex(w => w.id === updatedWallet.id)
    if (index !== -1) {
      wallets.value[index] = updatedWallet

      // 如果更新的是当前钱包，也更新当前钱包引用
      if (currentWallet.value?.id === updatedWallet.id) {
        currentWallet.value = updatedWallet
      }
    }
  }

  // 从本地状态中移除钱包
  const removeWallet = (walletId: number) => {
    wallets.value = wallets.value.filter(w => w.id !== walletId)

    // 如果删除的是当前钱包，切换到第一个钱包或设为null
    if (currentWallet.value?.id === walletId) {
      currentWallet.value = wallets.value.length > 0 ? wallets.value[0] : null
    }

    // 清除余额数据
    delete balances.value[walletId]
  }

  // 加载钱包余额
  const loadWalletBalance = async (walletId: number) => {
    try {
      console.log('Loading balance for wallet:', walletId)

      // 直接调用 API 获取余额数据
      const response = await fetch(`${APP_CONFIG.API_BASE_URL}/wallets/${walletId}/get_all_balances/`)
      const data = await response.json()

      console.log('Balance API response:', data)

      if (data.status === 'success') {
        // 转换tokens数据，映射API字段到我们的接口
        const tokens: WalletToken[] = (data.tokens || []).map((token: any) => ({
          token_address: token.token_address || '',
          symbol: token.symbol || '',
          name: token.name || '',
          decimals: token.decimals || 18,
          balance: token.balance_formatted || token.balance?.toString() || '0',
          balance_usd: token.value_usd?.toString() || '0',
          price_usd: token.current_price_usd?.toString() || '0',
          price_change_24h: token.price_change_percentage_24h?.toString() || '0',
          logo_url: token.logo, // API返回的是logo字段，映射到logo_url
          is_visible: token.is_visible !== false, // 默认为true
          imageError: false // 初始化图片错误状态
        }))

        // 构造余额对象
        const balance: WalletBalance = {
          wallet_id: data.wallet_id || walletId,
          chain: data.chain || '',
          total_value_usd: data.total_value_usd || '0',
          total_value_change_24h: data.total_value_change_24h || '0',
          total_change_percentage: data.total_change_percentage || '0',
          tokens: tokens,
          timestamp: Date.now()
        }

        // 使用响应式更新方式，确保Vue能检测到变化
        balances.value = {
          ...balances.value,
          [walletId]: balance
        }
        
        console.log('Balance updated for wallet:', walletId, balance)
        console.log('Current balances state:', balances.value)
      } else {
        throw new Error(data.message || 'Failed to load balance')
      }
    } catch (err) {
      console.error('Failed to load wallet balance:', err)
    }
  }

  // 刷新钱包余额
  const refreshWalletBalance = async (walletId: number) => {
    try {
      loading.value = true

      // 直接调用刷新余额API（包含余额和价格）
      const response = await fetch(`${APP_CONFIG.API_BASE_URL}/wallets/${walletId}/refresh_balances/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to refresh balance: ${response.status}`)
      }

      const data = await response.json()
      if (data.status !== 'success') {
        throw new Error(data.error || 'Failed to refresh balance')
      }

      console.log('Balance refresh successful:', data)

      // 重新加载余额
      await loadWalletBalance(walletId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to refresh balance'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 转账
  const transfer = async (transferData: {
    walletId: number
    to_address: string
    amount: string
    token_address?: string
    payment_password: string
  }) => {
    try {
      loading.value = true
      error.value = null
      
      const result = await sendMessage(MESSAGE_TYPES.TRANSFER, transferData)
      
      // 转账成功后刷新余额
      await loadWalletBalance(transferData.walletId)
      
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Transfer failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 代币兑换
  const swap = async (swapData: {
    walletId: number
    quote_id: string
    from_token: string
    to_token: string
    amount: string
    payment_password: string
    slippage?: string
  }) => {
    try {
      loading.value = true
      error.value = null
      
      const result = await sendMessage(MESSAGE_TYPES.SWAP, swapData)
      
      // 兑换成功后刷新余额
      await loadWalletBalance(swapData.walletId)
      
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Swap failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 重置状态
  const reset = () => {
    wallets.value = []
    currentWallet.value = null
    balances.value = {}
    loading.value = false
    error.value = null
  }

  return {
    // 状态
    wallets,
    currentWallet,
    balances,
    loading,
    error,

    // 计算属性
    currentWalletTokens,
    totalBalance,

    // 方法
    loadWallets,
    createWallet,
    importWallet,
    importMnemonic,
    deleteWallet,
    setCurrentWallet,
    updateWallet,
    removeWallet,
    loadWalletBalance,
    refreshWalletBalance,
    transfer,
    swap,
    reset
  }
})
