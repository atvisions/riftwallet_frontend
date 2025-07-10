// 基础类型定义

export interface Wallet {
  id: number
  address: string
  name: string
  chain: string
  avatar?: string
  is_active: boolean
  created_at: string
  updated_at: string
  kadena_chain_id?: string
}

export interface WalletToken {
  token_address: string
  symbol: string
  name: string
  decimals: number
  balance: string
  balance_usd: string
  price_usd: string
  price_change_24h: string
  logo_url?: string
  is_visible: boolean
  imageError?: boolean  // 图片加载错误标志
  fallbackIndex?: number  // 备用logo索引
}

export interface WalletBalance {
  wallet_id: number
  chain: string
  total_value_usd: string
  total_value_change_24h: string
  total_change_percentage: string
  tokens: WalletToken[]
  timestamp: number
}

export interface TransferRequest {
  to_address: string
  amount: string
  token_address?: string
  payment_password: string
  device_id: string
  kadena_chain_id?: string
}

export interface TransferResponse {
  status: string
  transaction_hash?: string
  message: string
  error?: string
}

export interface SwapQuote {
  quote_id: string
  from_token: string
  to_token: string
  in_amount: string
  out_amount: string
  price_impact: string
  slippage: string
  route_plan: any[]
  other_amount_threshold: string
  swap_mode: string
  fees: Record<string, any>
  timestamp: number
}

export interface SwapRequest {
  device_id: string
  quote_id: string
  from_token: string
  to_token: string
  amount: string
  payment_password: string
  slippage?: string
}

export interface Chain {
  chain: string
  name: string
  logo?: string
  type: 'EVM' | 'NON_EVM'
  is_testnet: boolean
}

export interface Device {
  id: string
  device_id: string
  device_name: string
  created_at: string
}

export interface PaymentPassword {
  device_id: string
  has_password: boolean
  created_at?: string
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error'
  data?: T
  message?: string
  code?: string
}

export interface CreateWalletRequest {
  device_id: string
  chain: string
  name?: string
}

export interface ImportWalletRequest {
  private_key?: string
  mnemonic?: string
  address?: string
  chain: string
  wallet_name?: string
  device_id: string
}

export interface TechnicalIndicators {
  symbol: string
  interval: string
  indicators: {
    sma?: number[]
    ema?: number[]
    rsi?: number[]
    macd?: {
      macd: number[]
      signal: number[]
      histogram: number[]
    }
    bollinger_bands?: {
      upper: number[]
      middle: number[]
      lower: number[]
    }
  }
  timestamp: number
}

export interface TokenAnalysis {
  symbol: string
  price: number
  price_change_24h: number
  market_cap: number
  volume_24h: number
  analysis: {
    trend: 'bullish' | 'bearish' | 'neutral'
    support_levels: number[]
    resistance_levels: number[]
    recommendation: 'buy' | 'sell' | 'hold'
  }
}

// Chrome Extension 相关类型
export interface ChromeMessage {
  type: string
  data?: any
  requestId?: string
}

export interface StorageData {
  wallets?: Wallet[]
  currentWallet?: Wallet
  settings?: UserSettings
  deviceId?: string
}

export interface UserSettings {
  language: string
  currency: string
  theme: 'light' | 'dark'
  notifications: boolean
  autoLock: boolean
  lockTimeout: number
}

// 错误类型
export interface WalletError {
  code: string
  message: string
  details?: any
}

// 常量
export const SUPPORTED_CHAINS = [
  'ETH', 'BSC', 'MATIC', 'ARB', 'OP', 'AVAX', 
  'BASE', 'ZKSYNC', 'LINEA', 'MANTA', 'FTM', 
  'CRO', 'SOL', 'KDA'
] as const

export type SupportedChain = typeof SUPPORTED_CHAINS[number]

export const ERROR_CODES = {
  MISSING_DEVICE_ID: 'MISSING_DEVICE_ID',
  MISSING_PARAMETERS: 'MISSING_PARAMETERS',
  WALLET_ACCESS_DENIED: 'WALLET_ACCESS_DENIED',
  INVALID_CHAIN: 'INVALID_CHAIN',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  WALLET_NOT_FOUND: 'WALLET_NOT_FOUND',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR'
} as const
