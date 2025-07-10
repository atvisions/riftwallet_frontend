// 应用常量定义

// 根据环境选择 API 基础 URL
const getApiBaseUrl = () => {
  // 强制使用本地开发环境，因为生产服务器 IP 被 Moralis 封了
  return '/api/v1'

  // 原来的逻辑（暂时注释）
  // if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
  //   return '/api/v1'
  // }
  // return 'https://www.riftwallet.io/api/v1'
}

export const APP_CONFIG = {
  NAME: 'Riftwallet',
  VERSION: '1.0.0',
  API_BASE_URL: getApiBaseUrl(),
  STORAGE_PREFIX: 'riftwallet_',
  PASSWORD_SESSION_TIMEOUT: 30 * 60 * 1000 // 30分钟
} as const

export const API_ENDPOINTS = {
  // 钱包管理
  WALLETS: '/wallets/',
  WALLET_DETAIL: (id: number) => `/wallets/${id}/`,
  IMPORT_PRIVATE_KEY: '/wallets/import_private_key/',
  IMPORT_MNEMONIC: '/wallets/import_by_mnemonic/',
  IMPORT_WATCH_ONLY: '/wallets/import_watch_only/',
  SHOW_PRIVATE_KEY: (id: number) => `/wallets/${id}/show_private_key/`,
  RENAME_WALLET: (id: number) => `/wallets/${id}/rename_wallet/`,
  DELETE_WALLET: (id: number) => `/wallets/${id}/delete_wallet/`,
  SUPPORTED_CHAINS: '/wallets/get_supported_chains/',
  SELECT_CHAIN: '/wallets/select_chain/',
  VERIFY_MNEMONIC: '/wallets/verify_mnemonic/',
  UPDATE_KADENA_CHAIN_ID: (id: number) => `/wallets/${id}/update_kadena_chain_id/`,
  
  // 余额查询
  GET_BALANCE: (id: number) => `/wallets/${id}/get_balance/`,
  GET_TOKEN_BALANCE: (id: number) => `/wallets/${id}/get_token_balance/`,
  GET_ALL_BALANCES: (id: number) => `/wallets/${id}/get_all_balances/`,
  REFRESH_BALANCES: (id: number) => `/wallets/${id}/refresh_balances/`,
  GET_TOKEN_PRICES: (id: number) => `/wallets/${id}/get_token_prices/`,
  
  // 转账功能
  TRANSFER: (id: number) => `/wallets/${id}/transfer/`,
  ESTIMATE_FEE: (id: number) => `/wallets/${id}/estimate_fee/`,
  TRANSACTION_HISTORY: (id: number) => `/wallets/${id}/transaction_history/`,
  
  // 代币管理
  TOKEN_METADATA: (id: number) => `/wallets/${id}/token_metadata/`,
  TOKEN_PRICE_HISTORY: (id: number) => `/wallets/${id}/token_price_history/`,
  UPDATE_TOKEN_METADATA: '/wallets/update_token_metadata/',
  CHECK_TASK_STATUS: '/wallets/check_task_status/',
  TOKEN_MANAGEMENT: (walletId: number) => `/wallets/${walletId}/token-management/`,
  SET_TOKEN_VISIBILITY: (walletId: number) => `/wallets/${walletId}/set-token-visibility/`,
  
  // 代币兑换 (Solana)
  SWAP_TOKENS: (walletId: number) => `/wallets/${walletId}/swap/tokens/`,
  SWAP_QUOTE: (walletId: number) => `/wallets/${walletId}/swap/quote/`,
  SWAP_EXECUTE: (walletId: number) => `/wallets/${walletId}/swap/execute/`,
  SWAP_PRICES: (walletId: number) => `/wallets/${walletId}/swap/prices/`,
  
  // 支付密码
  SET_PASSWORD: '/wallets/set_password/',
  VERIFY_PASSWORD: '/wallets/verify_password/',
  CHANGE_PASSWORD: '/wallets/change_password/',
  PASSWORD_STATUS: (deviceId: string) => `/wallets/payment_password/status/${deviceId}/`,
  
  // 设备管理
  DEVICES: '/wallets/devices/',
  
  // 加密货币分析
  TECHNICAL_INDICATORS: (symbol: string) => `/crypto/technical-indicators/${symbol}/`,
  TOKEN_DATA: (tokenId: string) => `/crypto/token-data/${tokenId}/`,
  TOKEN_ANALYSIS: (symbol: string) => `/crypto/token-analysis/${symbol}/`,
  REFRESH_ANALYSIS: (symbol: string) => `/crypto/refresh-analysis/${symbol}/`
} as const

export const CHAIN_CONFIG = {
  ETH: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    type: 'EVM',
    color: '#627EEA'
  },
  BSC: {
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    decimals: 18,
    type: 'EVM',
    color: '#F3BA2F'
  },
  MATIC: {
    name: 'Polygon',
    symbol: 'MATIC',
    decimals: 18,
    type: 'EVM',
    color: '#8247E5'
  },
  ARB: {
    name: 'Arbitrum',
    symbol: 'ETH',
    decimals: 18,
    type: 'EVM',
    color: '#28A0F0'
  },
  OP: {
    name: 'Optimism',
    symbol: 'ETH',
    decimals: 18,
    type: 'EVM',
    color: '#FF0420'
  },
  AVAX: {
    name: 'Avalanche',
    symbol: 'AVAX',
    decimals: 18,
    type: 'EVM',
    color: '#E84142'
  },
  BASE: {
    name: 'Base',
    symbol: 'ETH',
    decimals: 18,
    type: 'EVM',
    color: '#0052FF'
  },
  ZKSYNC: {
    name: 'zkSync Era',
    symbol: 'ETH',
    decimals: 18,
    type: 'EVM',
    color: '#8C8DFC'
  },
  LINEA: {
    name: 'Linea',
    symbol: 'ETH',
    decimals: 18,
    type: 'EVM',
    color: '#121212'
  },
  MANTA: {
    name: 'Manta Pacific',
    symbol: 'ETH',
    decimals: 18,
    type: 'EVM',
    color: '#000000'
  },
  FTM: {
    name: 'Fantom',
    symbol: 'FTM',
    decimals: 18,
    type: 'EVM',
    color: '#1969FF'
  },
  CRO: {
    name: 'Cronos',
    symbol: 'CRO',
    decimals: 18,
    type: 'EVM',
    color: '#002D74'
  },
  SOL: {
    name: 'Solana',
    symbol: 'SOL',
    decimals: 9,
    type: 'NON_EVM',
    color: '#9945FF'
  },
  KDA: {
    name: 'Kadena',
    symbol: 'KDA',
    decimals: 12,
    type: 'NON_EVM',
    color: '#ED098F'
  }
} as const

export const STORAGE_KEYS = {
  DEVICE_ID: 'device_id',
  WALLETS: 'wallets',
  CURRENT_WALLET: 'current_wallet',
  SETTINGS: 'settings',
  BALANCES: 'balances',
  TRANSACTIONS: 'transactions',
  PAYMENT_PASSWORD_SET: 'payment_password_set',
  PASSWORD_SESSION: 'password_session',
  LAST_PASSWORD_TIME: 'last_password_time'
} as const

export const MESSAGE_TYPES = {
  // Background <-> Popup
  GET_WALLETS: 'GET_WALLETS',
  CREATE_WALLET: 'CREATE_WALLET',
  IMPORT_WALLET: 'IMPORT_WALLET',
  DELETE_WALLET: 'DELETE_WALLET',
  GET_BALANCE: 'GET_BALANCE',
  TRANSFER: 'TRANSFER',
  SWAP: 'SWAP',
  REFRESH_TOKEN_PRICES: 'REFRESH_TOKEN_PRICES',

  // Background <-> Content Script
  INJECT_PROVIDER: 'INJECT_PROVIDER',
  PROVIDER_REQUEST: 'PROVIDER_REQUEST',
  PROVIDER_RESPONSE: 'PROVIDER_RESPONSE',

  // Settings
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  GET_SETTINGS: 'GET_SETTINGS',

  // Chains
  GET_SUPPORTED_CHAINS: 'GET_SUPPORTED_CHAINS'
} as const

export const DEFAULT_SETTINGS = {
  language: 'en',
  currency: 'USD',
  theme: 'light',
  notifications: true,
  autoLock: true,
  lockTimeout: 300000 // 5 minutes
} as const

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'KRW', symbol: '₩', name: 'Korean Won' }
] as const

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' }
] as const

export const TRANSACTION_TYPES = {
  SEND: 'send',
  RECEIVE: 'receive',
  SWAP: 'swap',
  APPROVE: 'approve'
} as const

export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed'
} as const
