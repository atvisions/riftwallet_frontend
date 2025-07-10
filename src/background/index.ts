// Background Script (Service Worker)
// 处理长期运行的任务，API调用，数据存储

import { ChromeMessage, ApiResponse } from '@shared/types'
import { MESSAGE_TYPES, STORAGE_KEYS, APP_CONFIG } from '@shared/constants'
import { initChromeMock, getStorage } from '@shared/utils/chrome-mock'
import { generateDeviceId } from '@shared/utils'

console.log('Riftwallet Background Script loaded')

// 初始化
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Extension installed:', details.reason)
  
  if (details.reason === 'install') {
    // 首次安装时初始化
    await initializeExtension()
  }
})

// 初始化扩展
async function initializeExtension() {
  try {
    // 生成设备ID
    const deviceId = generateDeviceId()
    await chrome.storage.local.set({
      [STORAGE_KEYS.DEVICE_ID]: deviceId,
      [STORAGE_KEYS.WALLETS]: [],
      [STORAGE_KEYS.SETTINGS]: {
        language: 'en',
        currency: 'USD',
        theme: 'light',
        notifications: true,
        autoLock: true,
        lockTimeout: 300000
      }
    })
    
    console.log('Extension initialized with device ID:', deviceId)
  } catch (error) {
    console.error('Failed to initialize extension:', error)
  }
}

// 消息处理
chrome.runtime.onMessage.addListener((
  message: ChromeMessage,
  sender,
  sendResponse
) => {
  console.log('Background received message:', message.type, message.data)
  
  handleMessage(message)
    .then(response => {
      sendResponse({ success: true, data: response })
    })
    .catch(error => {
      console.error('Message handling error:', error)
      sendResponse({ success: false, error: error.message })
    })
  
  // 返回true表示异步响应
  return true
})

// 处理消息
async function handleMessage(message: ChromeMessage): Promise<any> {
  switch (message.type) {
    case MESSAGE_TYPES.GET_WALLETS:
      return await getWallets()
    
    case MESSAGE_TYPES.CREATE_WALLET:
      return await createWallet(message.data)
    
    case MESSAGE_TYPES.IMPORT_WALLET:
      return await importWallet(message.data)
    
    case MESSAGE_TYPES.DELETE_WALLET:
      return await deleteWallet(message.data.walletId)
    
    case MESSAGE_TYPES.GET_BALANCE:
      return await getBalance(message.data.walletId)
    
    case MESSAGE_TYPES.TRANSFER:
      return await transfer(message.data)
    
    case MESSAGE_TYPES.SWAP:
      return await swap(message.data)
    
    case MESSAGE_TYPES.GET_SETTINGS:
      return await getSettings()
    
    case MESSAGE_TYPES.UPDATE_SETTINGS:
      return await updateSettings(message.data)

    case MESSAGE_TYPES.GET_SUPPORTED_CHAINS:
      return await getSupportedChains()

    case MESSAGE_TYPES.REFRESH_TOKEN_PRICES:
      return await refreshTokenPrices(message.data.walletId)

    default:
      throw new Error(`Unknown message type: ${message.type}`)
  }
}

// 获取钱包列表
async function getWallets() {
  // 初始化 Chrome Mock（开发环境）
  initChromeMock()
  const storage = getStorage()

  const result = await storage.get([STORAGE_KEYS.DEVICE_ID, STORAGE_KEYS.WALLETS])
  const deviceId = result[STORAGE_KEYS.DEVICE_ID]
  
  if (!deviceId) {
    throw new Error('Device ID not found')
  }
  
  // 构建完整的 API URL
  const baseUrl = APP_CONFIG.API_BASE_URL.startsWith('http')
    ? APP_CONFIG.API_BASE_URL
    : `http://localhost:3000${APP_CONFIG.API_BASE_URL}`

  // 从API获取钱包列表
  const response = await fetch(`${baseUrl}/wallets/?device_id=${deviceId}`)
  const data = await response.json()
  
  if (data.state === 'success') {
    // 更新本地存储
    await storage.set({
      [STORAGE_KEYS.WALLETS]: data.data || []
    })
    return data.data || []
  } else {
    throw new Error(data.message || 'Failed to get wallets')
  }
}

// 创建钱包
async function createWallet(walletData: any) {
  const result = await chrome.storage.local.get([STORAGE_KEYS.DEVICE_ID])
  const deviceId = result[STORAGE_KEYS.DEVICE_ID]
  
  if (!deviceId) {
    throw new Error('Device ID not found')
  }
  
  // 构建完整的 API URL
  const baseUrl = APP_CONFIG.API_BASE_URL.startsWith('http')
    ? APP_CONFIG.API_BASE_URL
    : `http://localhost:3000${APP_CONFIG.API_BASE_URL}`

  const response = await fetch(`${baseUrl}/wallets/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...walletData,
      device_id: deviceId
    })
  })
  
  const data = await response.json()
  
  if (data.state === 'success') {
    // 刷新钱包列表
    await getWallets()
    return data.data
  } else {
    throw new Error(data.message || 'Failed to create wallet')
  }
}

// 导入钱包
async function importWallet(importData: any) {
  const result = await chrome.storage.local.get([STORAGE_KEYS.DEVICE_ID])
  const deviceId = result[STORAGE_KEYS.DEVICE_ID]
  
  if (!deviceId) {
    throw new Error('Device ID not found')
  }
  
  let endpoint = ''
  if (importData.private_key) {
    endpoint = 'import_private_key'
  } else if (importData.mnemonic) {
    endpoint = 'import_by_mnemonic'
  } else if (importData.address) {
    endpoint = 'import_watch_only'
  } else {
    throw new Error('Invalid import data')
  }
  
  const requestBody = {
    ...importData,
    device_id: deviceId
  }

  // 构建完整的 API URL
  const baseUrl = APP_CONFIG.API_BASE_URL.startsWith('http')
    ? APP_CONFIG.API_BASE_URL
    : `http://localhost:3000${APP_CONFIG.API_BASE_URL}`
  const apiUrl = `${baseUrl}/wallets/${endpoint}/`

  console.log('Import wallet request:', {
    endpoint,
    baseUrl,
    apiUrl,
    body: requestBody
  })

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })
  
  const data = await response.json()

  console.log('Import wallet response:', {
    status: response.status,
    statusText: response.statusText,
    data: data
  })

  // 检查响应状态
  if (response.ok && data.state === 'success') {
    // 刷新钱包列表
    await getWallets()
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
      throw new Error('Authentication failed. Please try again.')
    } else if (response.status === 500) {
      throw new Error('Server error. Please try again later.')
    } else {
      throw new Error(data.message || data.non_field_errors?.[0] || 'Failed to import wallet')
    }
  }
}

// 删除钱包
async function deleteWallet(walletId: number) {
  const response = await fetch(`http://192.168.3.56:8000/api/v1/wallets/${walletId}/delete_wallet/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  
  const data = await response.json()
  
  if (data.state === 'success') {
    // 刷新钱包列表
    await getWallets()
    return data.data
  } else {
    throw new Error(data.message || 'Failed to delete wallet')
  }
}

// 获取余额
async function getBalance(walletId: number) {
  const response = await fetch(`http://192.168.3.56:8000/api/v1/wallets/${walletId}/get_all_balances/`)
  const data = await response.json()
  
  if (data.state === 'success') {
    return data
  } else {
    throw new Error(data.message || 'Failed to get balance')
  }
}

// 转账
async function transfer(transferData: any) {
  const response = await fetch(`http://192.168.3.56:8000/api/v1/wallets/${transferData.walletId}/transfer/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(transferData)
  })
  
  const data = await response.json()
  
  if (data.state === 'success') {
    return data.data
  } else {
    throw new Error(data.message || 'Transfer failed')
  }
}

// 兑换
async function swap(swapData: any) {
  const response = await fetch(`http://192.168.3.56:8000/api/v1/wallets/${swapData.walletId}/swap/execute/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(swapData)
  })
  
  const data = await response.json()
  
  if (data.state === 'success') {
    return data.data
  } else {
    throw new Error(data.message || 'Swap failed')
  }
}

// 获取设置
async function getSettings() {
  const result = await chrome.storage.local.get([STORAGE_KEYS.SETTINGS])
  return result[STORAGE_KEYS.SETTINGS] || {}
}

// 更新设置
async function updateSettings(settings: any) {
  await chrome.storage.local.set({
    [STORAGE_KEYS.SETTINGS]: settings
  })
  return settings
}

// 获取支持的链列表
async function getSupportedChains() {
  // 构建完整的 API URL
  const baseUrl = APP_CONFIG.API_BASE_URL.startsWith('http')
    ? APP_CONFIG.API_BASE_URL
    : `http://localhost:3000${APP_CONFIG.API_BASE_URL}`

  const response = await fetch(`${baseUrl}/wallets/get_supported_chains/`)
  const data = await response.json()

  if (data.state === 'success') {
    return data.data || []
  } else {
    throw new Error(data.message || 'Failed to get supported chains')
  }
}

// 刷新代币价格
async function refreshTokenPrices(walletId: number) {
  // 构建完整的 API URL
  const baseUrl = APP_CONFIG.API_BASE_URL.startsWith('http')
    ? APP_CONFIG.API_BASE_URL
    : `http://localhost:3000${APP_CONFIG.API_BASE_URL}`

  const response = await fetch(`${baseUrl}/wallets/${walletId}/get_token_prices/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  const data = await response.json()

  if (data.status === 'success') {
    return data
  } else {
    throw new Error(data.message || 'Failed to refresh token prices')
  }
}

// 定期刷新数据
chrome.alarms.create('refreshData', { periodInMinutes: 5 })

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'refreshData') {
    try {
      // 刷新钱包数据
      await getWallets()
      console.log('Data refreshed')
    } catch (error) {
      console.error('Failed to refresh data:', error)
    }
  }
})
