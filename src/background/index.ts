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

// 处理扩展图标点击事件（Phantom 风格：总是打开弹窗）
chrome.action.onClicked.addListener(async (tab) => {
  console.log('Background: Extension icon clicked, opening popup (Phantom-style)')

  try {
    const windowId = tab.windowId
    if (!windowId) {
      throw new Error('No window ID available')
    }

    // Phantom 风格：扩展图标总是打开弹窗，不是侧边栏
    console.log('Background: Opening popup window')

    // 方法1: 尝试使用 chrome.action.openPopup()
    try {
      await chrome.action.openPopup()
      console.log('Background: Popup opened via chrome.action.openPopup()')
    } catch (popupError) {
      console.log('Background: chrome.action.openPopup() failed, using tab fallback:', popupError)

      // 方法2: 降级到新标签页
      await chrome.tabs.create({
        url: chrome.runtime.getURL('src/popup/index.html'),
        windowId
      })
      console.log('Background: Popup opened as new tab')
    }

    // 更新状态
    windowModes.set(windowId, 'popup')

  } catch (error) {
    console.error('Background: Failed to handle icon click:', error)

    // 最终降级处理
    try {
      console.log('Background: Final fallback - opening popup tab')
      await chrome.tabs.create({
        url: chrome.runtime.getURL('src/popup/index.html'),
        windowId: tab.windowId
      })
    } catch (fallbackError) {
      console.error('Background: All methods failed:', fallbackError)
    }
  }
})

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'open-popup') {
    try {
      await chrome.tabs.create({
        url: chrome.runtime.getURL('src/popup/index.html'),
        windowId: tab?.windowId
      })
    } catch (error) {
      console.error('Failed to open popup:', error)
    }
  }
})

// 存储当前窗口模式状态
const windowModes = new Map<number, 'popup' | 'sidepanel'>()

// 监听侧边栏相关的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background: Received message:', message.type, 'from sender:', sender)

  if (message.type === 'TOGGLE_SIDEPANEL') {
    handleToggleSidePanel(sender.tab?.windowId)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }))
    return true
  }

  if (message.type === 'SWITCH_TO_SIDEPANEL') {
    handleSwitchToSidePanel(message.windowId)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }))
    return true
  }

  if (message.type === 'SWITCH_TO_POPUP') {
    handleSwitchToPopup(message.windowId)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }))
    return true
  }

  if (message.type === 'GET_WINDOW_MODE') {
    handleGetWindowMode(message.windowId)
      .then(mode => sendResponse({ success: true, mode }))
      .catch(error => sendResponse({ success: false, error: error.message }))
    return true
  }

  if (message.type === 'CLOSE_SIDEPANEL') {
    handleCloseSidePanel(message.windowId)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }))
    return true
  }

  if (message.type === 'REOPEN_WALLET') {
    handleReopenWallet(message.windowId)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }))
    return true
  }

  if (message.type === 'CLOSE_SIDEPANEL_PHANTOM_STYLE') {
    handleCloseSidePanelPhantomStyle(message.windowId)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }))
    return true
  }
})

// 切换侧边栏显示状态
async function handleToggleSidePanel(windowId?: number) {
  console.log('Background: handleToggleSidePanel called with windowId:', windowId)

  if (!chrome.sidePanel) {
    throw new Error('Side Panel API not available')
  }

  try {
    // 如果没有 windowId，获取当前活动窗口
    let targetWindowId = windowId
    if (!targetWindowId) {
      console.log('Background: No windowId provided, getting current window...')
      const currentWindow = await chrome.windows.getCurrent()
      targetWindowId = currentWindow.id
      console.log('Background: Using current window ID:', targetWindowId)
    }

    if (!targetWindowId) {
      throw new Error('Unable to determine target window')
    }

    console.log('Background: Opening side panel for window:', targetWindowId)
    await chrome.sidePanel.open({ windowId: targetWindowId })
    console.log('Background: Side panel opened successfully')

  } catch (error) {
    console.error('Background: Failed to toggle side panel:', error)
    throw error
  }
}

// 切换到侧边栏模式
async function handleSwitchToSidePanel(windowId?: number) {
  console.log('Background: Switching to side panel mode for window:', windowId)

  if (!chrome.sidePanel) {
    throw new Error('Side Panel API not available')
  }

  try {
    // 获取目标窗口ID
    let targetWindowId = windowId
    if (!targetWindowId) {
      const currentWindow = await chrome.windows.getCurrent()
      targetWindowId = currentWindow.id
    }

    if (!targetWindowId) {
      throw new Error('Unable to determine target window')
    }

    // 记录当前模式
    windowModes.set(targetWindowId, 'sidepanel')

    // 打开侧边栏
    await chrome.sidePanel.open({ windowId: targetWindowId })
    console.log('Background: Successfully switched to side panel mode')

  } catch (error) {
    console.error('Background: Failed to switch to side panel:', error)
    throw error
  }
}

// 切换到弹窗模式
async function handleSwitchToPopup(windowId?: number) {
  console.log('Background: Switching to popup mode for window:', windowId)

  try {
    // 获取目标窗口ID
    let targetWindowId = windowId
    if (!targetWindowId) {
      const currentWindow = await chrome.windows.getCurrent()
      targetWindowId = currentWindow.id
    }

    if (!targetWindowId) {
      throw new Error('Unable to determine target window')
    }

    // 记录当前模式
    windowModes.set(targetWindowId, 'popup')

    // 关闭侧边栏（如果打开的话）
    if (chrome.sidePanel) {
      try {
        // 注意：Chrome 扩展 API 没有直接关闭侧边栏的方法
        // 我们只能通过打开一个新的弹窗来"切换"
        console.log('Background: Side panel cannot be directly closed, opening popup instead')
      } catch (error) {
        console.log('Background: Could not close side panel:', error)
      }
    }

    // 打开弹窗（通过创建新标签页的方式）
    await chrome.tabs.create({
      url: chrome.runtime.getURL('src/popup/index.html'),
      windowId: targetWindowId
    })

    console.log('Background: Successfully switched to popup mode')

  } catch (error) {
    console.error('Background: Failed to switch to popup:', error)
    throw error
  }
}

// 获取当前窗口模式
async function handleGetWindowMode(windowId?: number) {
  try {
    let targetWindowId = windowId
    if (!targetWindowId) {
      const currentWindow = await chrome.windows.getCurrent()
      targetWindowId = currentWindow.id
    }

    if (!targetWindowId) {
      throw new Error('Unable to determine target window')
    }

    const mode = windowModes.get(targetWindowId) || 'popup'
    console.log('Background: Current window mode for', targetWindowId, ':', mode)
    return mode

  } catch (error) {
    console.error('Background: Failed to get window mode:', error)
    throw error
  }
}

// 关闭侧边栏
async function handleCloseSidePanel(windowId?: number) {
  console.log('Background: Closing side panel for window:', windowId)

  try {
    // 获取目标窗口ID
    let targetWindowId = windowId
    if (!targetWindowId) {
      const currentWindow = await chrome.windows.getCurrent()
      targetWindowId = currentWindow.id
    }

    if (!targetWindowId) {
      throw new Error('Unable to determine target window')
    }

    // 更新窗口模式状态
    windowModes.set(targetWindowId, 'popup')

    // Chrome 扩展 API 没有直接关闭侧边栏的方法
    // 我们可以尝试以下方法：

    // 方法1: 尝试设置侧边栏为禁用状态
    if (chrome.sidePanel && chrome.sidePanel.setOptions) {
      try {
        await chrome.sidePanel.setOptions({
          enabled: false
        })
        console.log('Background: Side panel disabled')
      } catch (error) {
        console.log('Background: Could not disable side panel:', error)
      }
    }

    // 方法2: 尝试打开一个空的侧边栏页面
    if (chrome.sidePanel && chrome.sidePanel.setOptions) {
      try {
        await chrome.sidePanel.setOptions({
          path: 'about:blank'
        })
        console.log('Background: Side panel path set to blank')
      } catch (error) {
        console.log('Background: Could not set blank path:', error)
      }
    }

    console.log('Background: Side panel close attempt completed')

  } catch (error) {
    console.error('Background: Failed to close side panel:', error)
    throw error
  }
}

// 重新打开钱包
async function handleReopenWallet(windowId?: number) {
  console.log('Background: Reopening wallet for window:', windowId)

  try {
    // 获取目标窗口ID
    let targetWindowId = windowId
    if (!targetWindowId) {
      const currentWindow = await chrome.windows.getCurrent()
      targetWindowId = currentWindow.id
    }

    if (!targetWindowId) {
      throw new Error('Unable to determine target window')
    }

    // 重新打开侧边栏
    if (chrome.sidePanel) {
      try {
        // 首先确保侧边栏是启用的
        await chrome.sidePanel.setOptions({
          enabled: true,
          path: 'src/sidepanel/index.html'
        })

        // 然后打开侧边栏
        await chrome.sidePanel.open({ windowId: targetWindowId })
        windowModes.set(targetWindowId, 'sidepanel')
        console.log('Background: Successfully reopened side panel')
      } catch (error) {
        console.log('Background: Could not reopen side panel, opening popup instead:', error)
        // 降级：打开弹窗
        await chrome.tabs.create({
          url: chrome.runtime.getURL('src/popup/index.html'),
          windowId: targetWindowId
        })
        windowModes.set(targetWindowId, 'popup')
      }
    } else {
      // 没有侧边栏 API，打开弹窗
      await chrome.tabs.create({
        url: chrome.runtime.getURL('src/popup/index.html'),
        windowId: targetWindowId
      })
      windowModes.set(targetWindowId, 'popup')
    }

    console.log('Background: Wallet reopened successfully')

  } catch (error) {
    console.error('Background: Failed to reopen wallet:', error)
    throw error
  }
}

// Phantom 风格关闭侧边栏
async function handleCloseSidePanelPhantomStyle(windowId?: number) {
  console.log('Background: Closing side panel (Phantom-style) for window:', windowId)

  try {
    // 获取目标窗口ID
    let targetWindowId = windowId
    if (!targetWindowId) {
      const currentWindow = await chrome.windows.getCurrent()
      targetWindowId = currentWindow.id
    }

    if (!targetWindowId) {
      throw new Error('Unable to determine target window')
    }

    // 更新窗口模式状态为关闭
    windowModes.set(targetWindowId, 'closed')

    // Chrome 扩展 API 没有直接关闭侧边栏的方法
    // Phantom 的做法是让侧边栏内容自己处理关闭逻辑

    console.log('Background: Side panel close signal sent (Phantom-style)')
    console.log('Background: Window mode set to closed for window:', targetWindowId)

  } catch (error) {
    console.error('Background: Failed to close side panel (Phantom-style):', error)
    throw error
  }
}

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

    // 创建右键菜单
    chrome.contextMenus.create({
      id: 'open-popup',
      title: 'Open Wallet Popup',
      contexts: ['action']
    })

    console.log('Extension initialized with device ID:', deviceId)
  } catch (error) {
    console.error('Failed to initialize extension:', error)
  }
}

// 消息处理（仅处理钱包相关消息）
chrome.runtime.onMessage.addListener((
  message: ChromeMessage,
  sender,
  sendResponse
) => {
  // 只处理钱包相关的消息类型
  const walletMessageTypes = [
    MESSAGE_TYPES.GET_WALLETS,
    MESSAGE_TYPES.GET_CURRENT_WALLET,
    MESSAGE_TYPES.SET_CURRENT_WALLET,
    MESSAGE_TYPES.CREATE_WALLET,
    MESSAGE_TYPES.IMPORT_WALLET,
    MESSAGE_TYPES.DELETE_WALLET,
    MESSAGE_TYPES.GET_BALANCE,
    MESSAGE_TYPES.TRANSFER,
    MESSAGE_TYPES.SWAP,
    MESSAGE_TYPES.GET_SETTINGS,
    MESSAGE_TYPES.UPDATE_SETTINGS,
    MESSAGE_TYPES.GET_SUPPORTED_CHAINS,
    MESSAGE_TYPES.REFRESH_TOKEN_PRICES
  ]

  if (!walletMessageTypes.includes(message.type)) {
    // 不是钱包消息，让第一个处理器处理
    return false
  }

  console.log('Background received wallet message:', message.type, message.data)

  handleMessage(message)
    .then(response => {
      sendResponse({ success: true, data: response })
    })
    .catch(error => {
      console.error('Wallet message handling error:', error)
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

    case MESSAGE_TYPES.GET_CURRENT_WALLET:
      return await getCurrentWallet()

    case MESSAGE_TYPES.SET_CURRENT_WALLET:
      return await setCurrentWallet(message.data)

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
      // 不应该到达这里，因为我们已经在上面过滤了消息类型
      console.warn('Unexpected wallet message type:', message.type)
      return null
  }
}

// 获取当前钱包
async function getCurrentWallet() {
  // 初始化 Chrome Mock（开发环境）
  initChromeMock()
  const storage = getStorage()

  const result = await storage.get([STORAGE_KEYS.CURRENT_WALLET])
  return result[STORAGE_KEYS.CURRENT_WALLET] || null
}

// 设置当前钱包
async function setCurrentWallet(data: { walletId: number }) {
  // 初始化 Chrome Mock（开发环境）
  initChromeMock()
  const storage = getStorage()

  await storage.set({
    [STORAGE_KEYS.CURRENT_WALLET]: { walletId: data.walletId }
  })

  console.log('Current wallet saved to storage:', data.walletId)
  return { success: true }
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

  // 从API获取钱包列表
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/wallets/?device_id=${deviceId}`)
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
  
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/wallets/`, {
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

  const apiUrl = `${APP_CONFIG.API_BASE_URL}/wallets/${endpoint}/`

  console.log('Import wallet request:', {
    endpoint,
    baseUrl: APP_CONFIG.API_BASE_URL,
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
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/wallets/get_supported_chains/`)
  const data = await response.json()

  if (data.state === 'success') {
    return data.data || []
  } else {
    throw new Error(data.message || 'Failed to get supported chains')
  }
}

// 刷新代币价格
async function refreshTokenPrices(walletId: number) {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/wallets/${walletId}/get_token_prices/`, {
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
