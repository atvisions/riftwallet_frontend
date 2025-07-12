import { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeSidePanel.vue')
  },
  {
    path: '/wallet/:id',
    name: 'WalletDetail',
    component: () => import('../views/WalletDetail.vue')
  },
  {
    path: '/send',
    name: 'Send',
    component: () => import('../views/Send.vue')
  },
  {
    path: '/receive',
    name: 'Receive',
    component: () => import('../views/Receive.vue')
  },
  {
    path: '/swap',
    name: 'Swap',
    component: () => import('../views/Swap.vue')
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('../views/History.vue')
  },
  {
    path: '/markets',
    name: 'Markets',
    component: () => import('../views/Markets.vue')
  },
  {
    path: '/trade',
    name: 'Trade',
    component: () => import('../views/Trade.vue')
  },
  {
    path: '/discover',
    name: 'Discover',
    component: () => import('../views/Discover.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings.vue')
  },

  {
    path: '/import-wallet',
    name: 'ImportWallet',
    component: () => import('../views/ImportWallet.vue')
  },
  {
    path: '/import-mnemonic',
    name: 'ImportMnemonic',
    component: () => import('../views/ImportMnemonic.vue')
  },
  {
    path: '/import-mnemonic-input',
    name: 'ImportMnemonicInput',
    component: () => import('../views/ImportMnemonicInput.vue')
  },
  {
    path: '/import-private-key',
    name: 'ImportPrivateKey',
    component: () => import('../views/ImportPrivateKey.vue')
  },
  {
    path: '/import-private-key-select-chain',
    name: 'ImportPrivateKeySelectChain',
    component: () => import('../views/ImportPrivateKeySelectChain.vue')
  },
  {
    path: '/import-private-key-input',
    name: 'ImportPrivateKeyInput',
    component: () => import('../views/ImportPrivateKeyInput.vue')
  },
  {
    path: '/wallet-import-loading',
    name: 'WalletImportLoading',
    component: () => import('../views/WalletImportLoading.vue')
  },
  {
    path: '/setup-password',
    name: 'SetupPassword',
    component: () => import('../views/SetupPassword.vue')
  },
  {
    path: '/verify-password',
    name: 'VerifyPassword',
    component: () => import('../views/VerifyPassword.vue')
  },
  {
    path: '/wallet-choice',
    name: 'WalletChoice',
    component: () => import('../views/WalletChoice.vue')
  },
  {
    path: '/select-chain',
    name: 'SelectChain',
    component: () => import('../views/SelectChain.vue')
  },
  {
    path: '/verify-mnemonic',
    name: 'VerifyMnemonic',
    component: () => import('../views/VerifyMnemonic.vue')
  },
  {
    path: '/confirm-mnemonic',
    name: 'ConfirmMnemonic',
    component: () => import('../views/ConfirmMnemonic.vue')
  },
  {
    path: '/create-wallet-password',
    name: 'CreateWalletPassword',
    component: () => import('../views/CreateWalletPassword.vue')
  }
]

export default routes
