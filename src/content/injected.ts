// Injected Script
// 注入到页面中，提供Web3 Provider功能

interface EthereumProvider {
  isCocoWallet: boolean
  isConnected(): boolean
  request(args: { method: string; params?: any[] }): Promise<any>
  on(event: string, handler: (...args: any[]) => void): void
  removeListener(event: string, handler: (...args: any[]) => void): void
  selectedAddress: string | null
  chainId: string | null
  networkVersion: string | null
}

class RiftwalletProvider implements EthereumProvider {
  public isRiftwallet = true
  public selectedAddress: string | null = null
  public chainId: string | null = null
  public networkVersion: string | null = null
  
  private eventListeners: { [event: string]: ((...args: any[]) => void)[] } = {}
  private requestId = 0
  private pendingRequests: { [id: number]: { resolve: Function; reject: Function } } = {}
  
  constructor() {
    // 监听来自content script的响应
    window.addEventListener('message', (event) => {
      if (event.source !== window) return
      if (!event.data || event.data.source !== 'cocowallet-content') return
      
      const { id, response, error } = event.data
      const pendingRequest = this.pendingRequests[id]
      
      if (pendingRequest) {
        delete this.pendingRequests[id]
        
        if (error) {
          pendingRequest.reject(new Error(error))
        } else {
          pendingRequest.resolve(response.data)
        }
      }
    })
    
    console.log('Riftwallet Provider initialized')
  }
  
  isConnected(): boolean {
    return this.selectedAddress !== null
  }
  
  async request(args: { method: string; params?: any[] }): Promise<any> {
    console.log('Riftwallet Provider request:', args.method, args.params)
    
    const requestId = ++this.requestId
    
    return new Promise((resolve, reject) => {
      this.pendingRequests[requestId] = { resolve, reject }
      
      // 发送请求到content script
      window.postMessage({
        source: 'cocowallet-injected',
        id: requestId,
        method: args.method,
        params: args.params || []
      }, '*')
      
      // 设置超时
      setTimeout(() => {
        if (this.pendingRequests[requestId]) {
          delete this.pendingRequests[requestId]
          reject(new Error('Request timeout'))
        }
      }, 30000) // 30秒超时
    })
  }
  
  on(event: string, handler: (...args: any[]) => void): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = []
    }
    this.eventListeners[event].push(handler)
  }
  
  removeListener(event: string, handler: (...args: any[]) => void): void {
    if (this.eventListeners[event]) {
      const index = this.eventListeners[event].indexOf(handler)
      if (index > -1) {
        this.eventListeners[event].splice(index, 1)
      }
    }
  }
  
  emit(event: string, ...args: any[]): void {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(handler => {
        try {
          handler(...args)
        } catch (error) {
          console.error('Error in event handler:', error)
        }
      })
    }
  }
  
  // 兼容性方法
  enable(): Promise<string[]> {
    return this.request({ method: 'eth_requestAccounts' })
  }
  
  send(method: string, params?: any[]): Promise<any> {
    return this.request({ method, params })
  }
  
  sendAsync(payload: any, callback: (error: any, result: any) => void): void {
    this.request({ method: payload.method, params: payload.params })
      .then(result => callback(null, { id: payload.id, jsonrpc: '2.0', result }))
      .catch(error => callback(error, null))
  }
}

// 创建Provider实例
const riftwalletProvider = new RiftwalletProvider()

// 注入到window对象
declare global {
  interface Window {
    ethereum?: EthereumProvider
    web3?: any
    riftwallet?: EthereumProvider
  }
}

// 设置为主要的ethereum provider
if (!window.ethereum) {
  window.ethereum = riftwalletProvider

  // 触发ethereum#initialized事件
  window.dispatchEvent(new Event('ethereum#initialized'))
}

// 同时提供riftwallet命名空间
window.riftwallet = riftwalletProvider

// 兼容旧版本web3
if (typeof window.web3 === 'undefined') {
  window.web3 = {
    currentProvider: riftwalletProvider,
    eth: {
      defaultAccount: riftwalletProvider.selectedAddress
    }
  }
}

// 通知页面Provider已准备就绪
window.dispatchEvent(new CustomEvent('riftwalletReady', {
  detail: {
    provider: riftwalletProvider,
    isRiftwallet: true
  }
}))

console.log('Riftwallet Provider injected successfully')

// 导出类型供TypeScript使用
export type { EthereumProvider }
export { RiftwalletProvider }
