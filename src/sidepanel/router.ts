import { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../popup/views/HomeSidePanel.vue')
  },
  {
    path: '/wallet/:id',
    name: 'WalletDetail',
    component: () => import('../popup/views/WalletDetail.vue')
  },
  {
    path: '/send',
    name: 'Send',
    component: () => import('../popup/views/Send.vue')
  },
  {
    path: '/receive',
    name: 'Receive',
    component: () => import('../popup/views/Receive.vue')
  },
  {
    path: '/swap',
    name: 'Swap',
    component: () => import('../popup/views/Swap.vue')
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('../popup/views/History.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../popup/views/Settings.vue')
  },
  {
    path: '/markets',
    name: 'Markets',
    component: () => import('../popup/views/Settings.vue') // 临时使用 Settings，后续可以创建专门的 Markets 页面
  },
  {
    path: '/trade',
    name: 'Trade',
    component: () => import('../popup/views/Swap.vue') // 临时使用 Swap，后续可以创建专门的 Trade 页面
  },
  {
    path: '/discover',
    name: 'Discover',
    component: () => import('../popup/views/Settings.vue') // 临时使用 Settings，后续可以创建专门的 Discover 页面
  },

  {
    path: '/import-wallet',
    name: 'ImportWallet',
    component: () => import('../popup/views/ImportWallet.vue')
  },
  {
    path: '/import-mnemonic',
    name: 'ImportMnemonic',
    component: () => import('../popup/views/ImportMnemonic.vue')
  },
  {
    path: '/import-mnemonic-input',
    name: 'ImportMnemonicInput',
    component: () => import('../popup/views/ImportMnemonicInput.vue')
  },
  {
    path: '/import-private-key',
    name: 'ImportPrivateKey',
    component: () => import('../popup/views/ImportPrivateKey.vue')
  },
  {
    path: '/import-private-key-select-chain',
    name: 'ImportPrivateKeySelectChain',
    component: () => import('../popup/views/ImportPrivateKeySelectChain.vue')
  },
  {
    path: '/import-private-key-input',
    name: 'ImportPrivateKeyInput',
    component: () => import('../popup/views/ImportPrivateKeyInput.vue')
  },
  {
    path: '/wallet-import-loading',
    name: 'WalletImportLoading',
    component: () => import('../popup/views/WalletImportLoading.vue')
  },
  {
    path: '/setup-password',
    name: 'SetupPassword',
    component: () => import('../popup/views/SetupPassword.vue')
  },
  {
    path: '/verify-password',
    name: 'VerifyPassword',
    component: () => import('../popup/views/VerifyPassword.vue')
  },
  {
    path: '/wallet-choice',
    name: 'WalletChoice',
    component: () => import('../popup/views/WalletChoice.vue')
  },
  {
    path: '/select-chain',
    name: 'SelectChain',
    component: () => import('../popup/views/SelectChain.vue')
  },
  {
    path: '/verify-mnemonic',
    name: 'VerifyMnemonic',
    component: () => import('../popup/views/VerifyMnemonic.vue')
  },
  {
    path: '/confirm-mnemonic',
    name: 'ConfirmMnemonic',
    component: () => import('../popup/views/ConfirmMnemonic.vue')
  },
  {
    path: '/create-wallet-password',
    name: 'CreateWalletPassword',
    component: () => import('../popup/views/CreateWalletPassword.vue')
  }
]

export default routes
