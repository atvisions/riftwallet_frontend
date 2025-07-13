<template>
  <div class="wallet-choice-page">
    <!-- 头部区域 -->
    <div class="header-section">
      <div class="app-logo">
        <i class="ri-wallet-3-fill"></i>
      </div>
      <h1>Welcome to Riftwallet</h1>
      <p>Choose how you want to get started</p>
    </div>

    <!-- 选择区域 -->
    <div class="choices-section">
      <!-- 创建新钱包 -->
      <div class="choice-card create-card" @click="createWallet">
        <div class="card-icon">
          <i class="ri-add-circle-line"></i>
        </div>
        <div class="card-content">
          <h3>Create New Wallet</h3>
          <p>Generate a new wallet with a secure seed phrase</p>
          <div class="tags">
            <span class="tag">Secure</span>
            <span class="tag recommended">Recommended</span>
          </div>
        </div>
      </div>

      <!-- 导入钱包 -->
      <div class="choice-card import-card" @click="importWallet">
        <div class="card-icon">
          <i class="ri-download-line"></i>
        </div>
        <div class="card-content">
          <h3>Import Wallet</h3>
          <p>Import an existing wallet using private key</p>
          <div class="tags">
            <span class="tag">Quick</span>
            <span class="tag">Flexible</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 安全提示 -->
    <div class="security-notice">
      <div class="notice-icon">
        <i class="ri-shield-check-line"></i>
      </div>
      <div class="notice-content">
        <h4>Security Notice</h4>
        <p>Your wallet is secured by your password and stored locally on your device. Make sure to backup your seed phrase safely.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'

const router = useRouter()

const createWallet = () => {
  try {
    console.log('Navigating to select-chain for wallet creation')
    router.push('/select-chain')
  } catch (error) {
    console.error('Navigation error:', error)
  }
}

const importWallet = () => {
  try {
    console.log('Navigating to import-wallet')
    router.push('/import-wallet')
  } catch (error) {
    console.error('Navigation error:', error)
  }
}

onMounted(() => {
  console.log('WalletChoice component mounted')
  console.log('Router:', router)
})
</script>

<style lang="scss" scoped>
.wallet-choice-page {
  min-height: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  display: flex;
  flex-direction: column;
  padding: 24px;
  box-sizing: border-box;
  overflow-y: auto;
}

.header-section {
  text-align: center;
  margin-bottom: 24px;
  flex-shrink: 0;

  .app-logo {
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    box-shadow: 0 20px 40px rgba(139, 92, 246, 0.3);

    i {
      font-size: 28px;
      color: white;
    }
  }

  h1 {
    font-size: 24px;
    font-weight: 700;
    color: #f8fafc;
    margin: 0 0 8px;
    background: linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  p {
    font-size: 16px;
    color: #94a3b8;
    margin: 0;
  }
}

.choices-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.choice-card {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 16px;
  backdrop-filter: blur(10px);

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(139, 92, 246, 0.3);
    box-shadow: 0 10px 30px rgba(139, 92, 246, 0.2);
  }

  .card-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    i {
      font-size: 24px;
      color: white;
    }
  }

  .card-content {
    flex: 1;

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: #f8fafc;
      margin: 0 0 6px;
    }

    p {
      font-size: 13px;
      color: #94a3b8;
      margin: 0 0 10px;
      line-height: 1.4;
    }

    .tags {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .tag {
      font-size: 11px;
      font-weight: 500;
      padding: 4px 8px;
      border-radius: 8px;
      border: 1px solid rgba(148, 163, 184, 0.2);
      color: #cbd5e1;

      &.recommended {
        background: rgba(34, 197, 94, 0.1);
        border-color: rgba(34, 197, 94, 0.3);
        color: #22c55e;
      }
    }
  }
}

.create-card {
  .card-icon {
    background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
  }
}

.import-card {
  .card-icon {
    background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  }
}

.security-notice {
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  backdrop-filter: blur(10px);
  flex-shrink: 0;

  .notice-icon {
    width: 32px;
    height: 32px;
    background: rgba(245, 158, 11, 0.1);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    i {
      font-size: 16px;
      color: #f59e0b;
    }
  }

  .notice-content {
    flex: 1;

    h4 {
      font-size: 13px;
      font-weight: 600;
      color: #f59e0b;
      margin: 0 0 4px;
    }

    p {
      font-size: 12px;
      color: #94a3b8;
      margin: 0;
      line-height: 1.4;
    }
  }
}

// 响应式设计
@media (max-width: 480px) {
  .wallet-choice-page {
    padding: 32px 20px 20px;
  }

  .header-section {
    margin-bottom: 32px;

    .app-logo {
      width: 64px;
      height: 64px;

      i {
        font-size: 28px;
      }
    }

    h1 {
      font-size: 24px;
    }
  }

  .choice-card {
    padding: 20px;
    gap: 16px;

    .card-icon {
      width: 48px;
      height: 48px;

      i {
        font-size: 24px;
      }
    }

    .card-content {
      h3 {
        font-size: 18px;
      }
    }
  }

  .security-notice {
    padding: 16px;
    gap: 12px;

    .notice-icon {
      width: 36px;
      height: 36px;

      i {
        font-size: 18px;
      }
    }
  }
}
</style>