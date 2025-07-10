<template>
  <ResponsiveLayout
    title="Welcome to Riftwallet"
    :show-header="false"
    :show-footer="false"
    :scrollable="true"
    padding="0"
  >
    <div class="wallet-choice-container">
      <!-- 头部区域 -->
      <div class="welcome-header">
        <div class="logo-section">
          <div class="app-logo">
            <i class="ri-wallet-3-fill"></i>
          </div>
          <h1>Welcome to Riftwallet</h1>
          <p>Choose how you want to get started</p>
        </div>
      </div>

      <!-- 选择区域 -->
      <div class="choices-section">
        <div class="choice-container">
          <!-- 创建新钱包 -->
          <div class="choice-card create-card" @click="createWallet">
            <div class="card-background"></div>
            <div class="card-content">
              <div class="choice-icon">
                <i class="ri-add-circle-line"></i>
                <div class="icon-glow"></div>
              </div>
              <div class="choice-info">
                <h3>Create New Wallet</h3>
                <p>Generate a new wallet with a secure seed phrase</p>
                <div class="feature-tags">
                  <span class="tag">Secure</span>
                  <span class="tag recommended">Recommended</span>
                </div>
              </div>
            </div>
            <div class="card-decoration">
              <div class="decoration-circle"></div>
              <div class="decoration-line"></div>
            </div>
          </div>

          <!-- 导入钱包 -->
          <div class="choice-card import-card" @click="importWallet">
            <div class="card-background"></div>
            <div class="card-content">
              <div class="choice-icon">
                <i class="ri-download-line"></i>
                <div class="icon-glow"></div>
              </div>
              <div class="choice-info">
                <h3>Import Wallet</h3>
                <p>Import an existing wallet using private key</p>
                <div class="feature-tags">
                  <span class="tag">Quick</span>
                  <span class="tag">Flexible</span>
                </div>
              </div>
            </div>
            <div class="card-decoration">
              <div class="decoration-circle"></div>
              <div class="decoration-line"></div>
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
  </ResponsiveLayout>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import ResponsiveLayout from '../components/ResponsiveLayout.vue'

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
.wallet-choice-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%);
  position: relative;
  overflow: hidden;
}

// 背景装饰
.wallet-choice-container::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at 30% 20%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 70% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%);
  animation: float 20s ease-in-out infinite;
  pointer-events: none;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(-20px, -20px) rotate(1deg); }
  66% { transform: translate(20px, -10px) rotate(-1deg); }
}

.welcome-header {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 24px 40px;
  text-align: center;
  position: relative;
  z-index: 1;
}

.logo-section {
  max-width: 400px;
  width: 100%;
}

.app-logo {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  box-shadow: 0 20px 40px rgba(99, 102, 241, 0.3);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: -2px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4);
    border-radius: 26px;
    z-index: -1;
    opacity: 0.5;
    filter: blur(8px);
  }

  i {
    font-size: 36px;
    color: white;
  }
}

.welcome-header h1 {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 12px 0;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
}

.welcome-header p {
  font-size: 16px;
  color: #94a3b8;
  margin: 0;
  line-height: 1.5;
}

.choices-section {
  flex-shrink: 0;
  padding: 0 24px 40px;
  position: relative;
  z-index: 1;
}

.choice-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 400px;
  margin: 0 auto;
}

.choice-card {
  position: relative;
  border-radius: 24px;
  padding: 0;
  cursor: pointer;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  height: 140px;

  &:hover {
    transform: translateY(-8px) scale(1.02);
  }

  &:active {
    transform: translateY(-4px) scale(1.01);
  }
}

.card-background {
  position: absolute;
  inset: 0;
  border-radius: 24px;
  transition: all 0.5s ease;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 24px;
    padding: 2px;
    background: linear-gradient(135deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: xor;
    transition: all 0.5s ease;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 2px;
    border-radius: 22px;
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(20px);
    transition: all 0.5s ease;
  }
}

.card-content {
  position: relative;
  z-index: 2;
  padding: 24px;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 20px;
}

.create-card {
  .card-background::before {
    background: linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4);
  }

  &:hover {
    .card-background::before {
      background: linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4, #10b981);
    }

    box-shadow:
      0 25px 50px rgba(99, 102, 241, 0.3),
      0 0 0 1px rgba(99, 102, 241, 0.2);
  }
}

.import-card {
  .card-background::before {
    background: linear-gradient(135deg, #8b5cf6, #06b6d4, #10b981);
  }

  &:hover {
    .card-background::before {
      background: linear-gradient(135deg, #8b5cf6, #06b6d4, #10b981, #f59e0b);
    }

    box-shadow:
      0 25px 50px rgba(139, 92, 246, 0.3),
      0 0 0 1px rgba(139, 92, 246, 0.2);
  }
}

.choice-icon {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.4s ease;

  i {
    font-size: 32px;
    color: white;
    position: relative;
    z-index: 2;
    transition: all 0.3s ease;
  }

  .icon-glow {
    position: absolute;
    inset: -4px;
    border-radius: 24px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4);
    opacity: 0;
    filter: blur(8px);
    transition: all 0.4s ease;
    z-index: 0;
  }

  &:hover {
    transform: scale(1.1) rotate(5deg);

    .icon-glow {
      opacity: 0.6;
    }

    i {
      transform: scale(1.1);
    }
  }
}

.choice-info {
  flex: 1;

  h3 {
    font-size: 20px;
    font-weight: 700;
    margin: 0 0 6px 0;
    color: #f1f5f9;
    transition: all 0.3s ease;
  }

  p {
    font-size: 14px;
    color: #94a3b8;
    margin: 0 0 12px 0;
    line-height: 1.4;
    transition: all 0.3s ease;
  }
}

.feature-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  display: inline-block;
  background: rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  font-size: 11px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;

  &.recommended {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border-color: #10b981;
  }
}

.card-decoration {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1;
  opacity: 0.3;
  transition: all 0.4s ease;

  .decoration-circle {
    width: 40px;
    height: 40px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 20px;
      height: 20px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
    }
  }

  .decoration-line {
    position: absolute;
    top: 50%;
    right: -20px;
    width: 30px;
    height: 1px;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.2), transparent);
  }
}

.choice-card:hover {
  .choice-info {
    h3 {
      color: #ffffff;
      transform: translateX(4px);
    }

    p {
      color: #cbd5e1;
    }
  }

  .tag {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.2);
    color: #f1f5f9;

    &.recommended {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      transform: scale(1.05);
    }
  }

  .card-decoration {
    opacity: 0.6;
    transform: translateX(8px);

    .decoration-circle {
      border-color: rgba(255, 255, 255, 0.4);

      &::before {
        background: rgba(255, 255, 255, 0.3);
      }
    }
  }
}

.security-notice {
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-top: 32px;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(16, 185, 129, 0.12);
    border-color: rgba(16, 185, 129, 0.3);
  }

  .notice-icon {
    color: #10b981;
    font-size: 24px;
    flex-shrink: 0;
    margin-top: 2px;
    transition: transform 0.3s ease;
  }

  &:hover .notice-icon {
    transform: scale(1.1);
  }

  .notice-content {
    flex: 1;

    h4 {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 6px 0;
      color: #10b981;
    }

    p {
      font-size: 14px;
      color: #94a3b8;
      margin: 0;
      line-height: 1.5;
    }
  }
}

// 响应式设计
@media (max-width: 480px) {
  .welcome-header {
    padding: 40px 20px 30px;
  }

  .choices-section {
    padding: 0 20px 30px;
  }

  .choice-card {
    height: 120px;

    .card-content {
      padding: 20px;
      gap: 16px;
    }
  }

  .choice-icon {
    width: 56px;
    height: 56px;

    i {
      font-size: 28px;
    }
  }

  .choice-info {
    h3 {
      font-size: 18px;
    }

    p {
      font-size: 13px;
    }
  }

  .welcome-header h1 {
    font-size: 28px;
  }

  .app-logo {
    width: 64px;
    height: 64px;

    i {
      font-size: 28px;
    }
  }

  .card-decoration {
    top: 16px;
    right: 16px;

    .decoration-circle {
      width: 32px;
      height: 32px;

      &::before {
        width: 16px;
        height: 16px;
      }
    }
  }
}

// 弹窗模式特殊样式
:global(.layout-popup) .wallet-choice-container {
  min-height: 600px;

  .welcome-header {
    padding: 30px 24px 20px;
  }

  .choices-section {
    padding: 0 24px 30px;
  }

  .choice-card {
    height: 120px;

    .card-content {
      padding: 20px;
    }
  }

  .choice-icon {
    width: 56px;
    height: 56px;

    i {
      font-size: 28px;
    }
  }

  .choice-info {
    h3 {
      font-size: 18px;
    }

    p {
      font-size: 13px;
    }
  }
}
</style>
