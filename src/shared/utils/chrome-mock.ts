// Chrome API 模拟器，用于开发环境

// 模拟 Chrome Storage API - 使用 localStorage 持久化
const createMockStorage = () => {
  const STORAGE_PREFIX = 'riftwallet_mock_'

  // 从 localStorage 加载数据
  const loadFromLocalStorage = (): { [key: string]: any } => {
    const data: { [key: string]: any } = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(STORAGE_PREFIX)) {
        const actualKey = key.replace(STORAGE_PREFIX, '')
        try {
          data[actualKey] = JSON.parse(localStorage.getItem(key) || 'null')
        } catch (e) {
          data[actualKey] = localStorage.getItem(key)
        }
      }
    }
    return data
  }

  // 保存到 localStorage
  const saveToLocalStorage = (key: string, value: any) => {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
    } catch (e) {
      localStorage.setItem(STORAGE_PREFIX + key, String(value))
    }
  }

  // 从 localStorage 删除
  const removeFromLocalStorage = (key: string) => {
    localStorage.removeItem(STORAGE_PREFIX + key)
  }

  return {
    get: (keys?: string | string[] | null): Promise<{ [key: string]: any }> => {
      return new Promise((resolve) => {
        const storage = loadFromLocalStorage()

        if (!keys) {
          resolve({ ...storage })
          return
        }

        const result: { [key: string]: any } = {}
        const keyArray = Array.isArray(keys) ? keys : [keys]

        keyArray.forEach(key => {
          if (storage.hasOwnProperty(key)) {
            result[key] = storage[key]
          }
        })

        resolve(result)
      })
    },

    set: (items: { [key: string]: any }): Promise<void> => {
      return new Promise((resolve) => {
        Object.keys(items).forEach(key => {
          saveToLocalStorage(key, items[key])
        })
        console.log('Mock Storage Set:', items)
        resolve()
      })
    },

    remove: (keys: string | string[]): Promise<void> => {
      return new Promise((resolve) => {
        const keyArray = Array.isArray(keys) ? keys : [keys]
        keyArray.forEach(key => {
          removeFromLocalStorage(key)
        })
        console.log('Mock Storage Remove:', keys)
        resolve()
      })
    },

    clear: (): Promise<void> => {
      return new Promise((resolve) => {
        // 清除所有以前缀开头的 localStorage 项
        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith(STORAGE_PREFIX)) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => {
          localStorage.removeItem(key)
        })
        console.log('Mock Storage Clear')
        resolve()
      })
    }
  }
}

// 模拟 Chrome Runtime API
const createMockRuntime = () => {
  return {
    sendMessage: (message: any, callback?: (response: any) => void): void => {
      console.log('Mock Runtime sendMessage:', message)

      // 模拟异步响应
      setTimeout(() => {
        if (callback) {
          let response = { success: true, data: null }

          // 根据消息类型返回不同的模拟数据
          switch (message.type) {
            case 'GET_WALLETS':
              // 从存储中获取钱包数据
              const storage = getStorage()
              storage.get(['wallets']).then(result => {
                const wallets = result.wallets || []
                if (callback) {
                  callback({ success: true, data: wallets })
                }
              })
              return // 异步处理，不执行后面的callback
              break

            case 'SET_CURRENT_WALLET':
              // 保存当前钱包ID
              const storageSet = getStorage()
              storageSet.set({ currentWalletId: message.data.walletId }).then(() => {
                if (callback) {
                  callback({ success: true })
                }
              })
              return
              break

            case 'GET_CURRENT_WALLET':
              // 获取当前钱包ID
              const storageGet = getStorage()
              storageGet.get(['currentWalletId']).then(result => {
                if (callback) {
                  callback({
                    success: true,
                    data: { walletId: result.currentWalletId || null }
                  })
                }
              })
              return
              break

            case 'REFRESH_TOKEN_PRICES':
              // 刷新代币价格
              const walletId = message.data.walletId
              console.log('Mock Chrome: Refreshing token prices for wallet:', walletId)

              // 调用新的代币价格API
              fetch(`/api/v1/wallets/${walletId}/get_token_prices/`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json'
                }
              })
              .then(res => res.json())
              .then(data => {
                console.log('Mock Chrome: Refresh token prices response:', data)
                if (callback) {
                  if (data.status === 'success') {
                    callback({ success: true, data: data })
                  } else {
                    callback({ success: false, error: data.message || 'Failed to refresh token prices' })
                  }
                }
              })
              .catch(error => {
                console.error('Mock Chrome: Refresh token prices error:', error)
                if (callback) {
                  callback({ success: false, error: error.message })
                }
              })
              return
              break

            case 'CREATE_WALLET':
              // 模拟创建钱包成功
              response = { success: true, data: message.data }
              break

            case 'IMPORT_WALLET':
              // 调用真实的导入API
              try {
                const importData = message.data
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

                // 获取device_id
                const storage = getStorage()
                storage.get(['device_id']).then(result => {
                  let deviceId = result.device_id

                  if (!deviceId) {
                    // 如果没有device_id，使用固定的测试device_id
                    deviceId = 'c883201f-ef9f-4a4d-8054-454532e3084c'
                    storage.set({ device_id: deviceId })
                    console.log('Mock Chrome: Using test device_id:', deviceId)
                  }

                  const requestBody = {
                    ...importData,
                    device_id: deviceId
                  }

                  console.log('Mock Chrome: Making real import API call (v2):', {
                    endpoint,
                    url: `/api/v1/wallets/${endpoint}/`,
                    body: requestBody,
                    timestamp: new Date().toISOString()
                  })

                  // 调用真实API (通过Vite代理)
                  fetch(`/api/v1/wallets/${endpoint}/`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                  })
                  .then(res => res.json())
                  .then(data => {
                    console.log('Mock Chrome: Import API response:', data)
                    if (data.state === 'success') {
                      if (callback) {
                        callback({ success: true, data: data.data })
                      }
                    } else {
                      if (callback) {
                        callback({ success: false, error: data.message || 'Failed to import wallet' })
                      }
                    }
                  })
                  .catch(error => {
                    console.error('Mock Chrome: Import API error:', error)
                    if (callback) {
                      callback({ success: false, error: error.message })
                    }
                  })
                })

                // 立即返回，不执行后面的callback
                return
              } catch (error) {
                response = { success: false, error: error.message }
              }
              break

            default:
              response = { success: true, data: null }
          }

          callback(response)
        }
      }, 100)
    },
    
    onMessage: {
      addListener: (callback: (message: any, sender: any, sendResponse: (response: any) => void) => void) => {
        console.log('Mock Runtime onMessage listener added')
      }
    },
    
    lastError: null
  }
}

// 检查是否在 Chrome 扩展环境中
export const isExtensionEnvironment = (): boolean => {
  return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local
}

// 初始化 Chrome API 模拟器
export const initChromeMock = (): void => {
  if (!isExtensionEnvironment()) {
    console.log('🔧 Initializing Chrome API Mock for development')
    
    // 创建全局 chrome 对象
    ;(window as any).chrome = {
      storage: {
        local: createMockStorage()
      },
      runtime: createMockRuntime()
    }
    
    console.log('✅ Chrome API Mock initialized')
  }
}

// 获取存储实例（自动选择真实或模拟）
export const getStorage = () => {
  if (isExtensionEnvironment()) {
    return chrome.storage.local
  } else {
    return (window as any).chrome?.storage?.local
  }
}

// 获取运行时实例（自动选择真实或模拟）
export const getRuntime = () => {
  if (isExtensionEnvironment()) {
    return chrome.runtime
  } else {
    return (window as any).chrome?.runtime
  }
}
