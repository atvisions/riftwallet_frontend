// 工具函数

import { v4 as uuidv4 } from 'uuid'
import CryptoJS from 'crypto-js'

/**
 * 生成设备ID
 */
export function generateDeviceId(): string {
  return uuidv4()
}

/**
 * 格式化地址显示
 */
export function formatAddress(address: string, start = 6, end = 4): string {
  if (!address) return ''
  if (address.length <= start + end) return address
  return `${address.slice(0, start)}...${address.slice(-end)}`
}

/**
 * 格式化数字显示
 */
export function formatNumber(
  value: string | number,
  decimals = 2,
  compact = false
): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0'
  
  if (compact && num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (compact && num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  })
}

/**
 * 格式化货币显示
 */
export function formatCurrency(
  value: string | number,
  currency = 'USD',
  decimals = 2
): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '$0.00'
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num)
}

/**
 * 格式化百分比显示
 */
export function formatPercentage(value: string | number, decimals = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0%'
  
  const sign = num >= 0 ? '+' : ''
  return `${sign}${num.toFixed(decimals)}%`
}

/**
 * 验证地址格式
 */
export function isValidAddress(address: string, chain: string): boolean {
  if (!address) return false
  
  switch (chain) {
    case 'ETH':
    case 'BSC':
    case 'MATIC':
    case 'ARB':
    case 'OP':
    case 'AVAX':
    case 'BASE':
    case 'ZKSYNC':
    case 'LINEA':
    case 'MANTA':
    case 'FTM':
    case 'CRO':
      // EVM地址验证
      return /^0x[a-fA-F0-9]{40}$/.test(address)
    
    case 'SOL':
      // Solana地址验证
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
    
    case 'KDA':
      // Kadena地址验证
      return /^k:[a-fA-F0-9]{64}$/.test(address)
    
    default:
      return false
  }
}

/**
 * 验证私钥格式
 */
export function isValidPrivateKey(privateKey: string, chain: string): boolean {
  if (!privateKey) return false
  
  switch (chain) {
    case 'ETH':
    case 'BSC':
    case 'MATIC':
    case 'ARB':
    case 'OP':
    case 'AVAX':
    case 'BASE':
    case 'ZKSYNC':
    case 'LINEA':
    case 'MANTA':
    case 'FTM':
    case 'CRO':
      // EVM私钥验证
      return /^(0x)?[a-fA-F0-9]{64}$/.test(privateKey)
    
    case 'SOL':
      // Solana私钥验证 (Base58编码)
      return /^[1-9A-HJ-NP-Za-km-z]{87,88}$/.test(privateKey)
    
    case 'KDA':
      // Kadena私钥验证
      return /^[a-fA-F0-9]{64}$/.test(privateKey)
    
    default:
      return false
  }
}

/**
 * 验证助记词
 */
export function isValidMnemonic(mnemonic: string): boolean {
  if (!mnemonic) return false
  
  const words = mnemonic.trim().split(/\s+/)
  return words.length === 12 || words.length === 24
}

/**
 * 复制到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

/**
 * 延迟函数
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * 生成随机字符串
 */
export function generateRandomString(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 加密数据
 */
export function encryptData(data: string, password: string): string {
  return CryptoJS.AES.encrypt(data, password).toString()
}

/**
 * 解密数据
 */
export function decryptData(encryptedData: string, password: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedData, password)
  return bytes.toString(CryptoJS.enc.Utf8)
}

/**
 * 计算文件哈希
 */
export async function calculateHash(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 格式化时间
 */
export function formatTime(timestamp: number | string): string {
  const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) * 1000 : timestamp)
  return date.toLocaleString()
}

/**
 * 获取相对时间
 */
export function getRelativeTime(timestamp: number | string): string {
  const now = Date.now()
  const time = typeof timestamp === 'string' ? parseInt(timestamp) * 1000 : timestamp
  const diff = now - time
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  return 'Just now'
}

/**
 * 检查是否为开发环境
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * 安全的JSON解析
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json)
  } catch {
    return defaultValue
  }
}
