<template>
  <div class="wallet-choice-page">
    <div class="header">
      <h1>Welcome to Riftwallet</h1>
      <p>Choose how you want to get started</p>
    </div>
    
    <div class="content">
      <div class="choice-container">
        <!-- 创建新钱包 -->
        <div class="choice-card" @click="createWallet">
          <div class="choice-icon">
            <i class="ri-add-circle-line"></i>
          </div>
          <div class="choice-content">
            <h3>Create New Wallet</h3>
            <p>Generate a new wallet with a secure seed phrase</p>
          </div>
          <div class="choice-arrow">
            <i class="ri-arrow-right-line"></i>
          </div>
        </div>
        
        <!-- 导入钱包 -->
        <div class="choice-card" @click="importWallet">
          <div class="choice-icon">
            <i class="ri-download-line"></i>
          </div>
          <div class="choice-content">
            <h3>Import Wallet</h3>
            <p>Import an existing wallet using private key</p>
          </div>
          <div class="choice-arrow">
            <i class="ri-arrow-right-line"></i>
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
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

// 创建新钱包
const createWallet = () => {
  router.push('/select-chain')
}

// 导入钱包
const importWallet = () => {
  router.push('/import-wallet')
}
</script>

<style lang="scss" scoped>
.wallet-choice-page {
  width: 375px;
  height: 762px;
  background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
  color: #f1f5f9;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  text-align: center;
  padding: 60px 24px 40px;
  
  h1 {
    font-size: 28px;
    font-weight: 700;
    margin: 0 0 12px 0;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
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

.content {
  flex: 1;
  padding: 0 24px 24px;
  display: flex;
  flex-direction: column;
}

.choice-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
}

.choice-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: #6366f1;
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(99, 102, 241, 0.2);
  }
  
  &:active {
    transform: translateY(0);
  }
}

.choice-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
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

.choice-content {
  flex: 1;
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 8px 0;
    color: #f1f5f9;
  }
  
  p {
    font-size: 14px;
    color: #94a3b8;
    margin: 0;
    line-height: 1.4;
  }
}

.choice-arrow {
  color: #6366f1;
  font-size: 20px;
  transition: transform 0.3s ease;
  
  .choice-card:hover & {
    transform: translateX(4px);
  }
}

.security-notice {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  
  .notice-icon {
    color: #10b981;
    font-size: 20px;
    flex-shrink: 0;
    margin-top: 2px;
  }
  
  .notice-content {
    flex: 1;
    
    h4 {
      font-size: 14px;
      font-weight: 600;
      margin: 0 0 4px 0;
      color: #10b981;
    }
    
    p {
      font-size: 12px;
      color: #94a3b8;
      margin: 0;
      line-height: 1.4;
    }
  }
}
</style>
