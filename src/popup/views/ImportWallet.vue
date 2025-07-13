<template>
  <ResponsiveLayout
    title="Import Wallet"
    :show-header="true"
    :show-footer="false"
    :show-back-button="true"
    :scrollable="true"
    @back="$router.go(-1)"
  >
    <!-- 自定义头部 -->
    <template #header>
      <div class="import-header-bar">
        <div class="header-left">
          <button @click="$router.go(-1)" class="back-button">
            <i class="ri-arrow-left-line"></i>
          </button>
          <h1 class="header-title">Import Wallet</h1>
        </div>
      </div>
    </template>

    <!-- 主要内容 -->
    <div class="import-content">
      <!-- 头部说明 -->
      <div class="import-header">
        <div class="import-icon">
          <i class="ri-download-cloud-line"></i>
        </div>
        <h2>Import Your Wallet</h2>
        <p>Choose your preferred import method to restore your existing wallet</p>
      </div>

      <!-- 导入选项 -->
      <div class="import-options">
          <!-- Import Recovery Phrase -->
          <div class="option-card mnemonic-card" @click="importMnemonic">
            <div class="card-background"></div>
            <div class="card-content">
              <div class="option-icon">
                <i class="ri-file-text-line"></i>
                <div class="icon-glow"></div>
              </div>
              <div class="option-info">
                <h3>Recovery Phrase</h3>
                <p>12-24 word seed phrase</p>
                <div class="feature-tags">
                  <span class="tag">Multi-Chain</span>
                  <span class="tag popular">Popular</span>
                </div>
              </div>
            </div>
            <div class="card-decoration">
              <div class="decoration-circle"></div>
              <div class="decoration-line"></div>
            </div>
          </div>

          <!-- Import Private Key -->
          <div class="option-card private-key-card" @click="importPrivateKey">
            <div class="card-background"></div>
            <div class="card-content">
              <div class="option-icon">
                <i class="ri-key-line"></i>
                <div class="icon-glow"></div>
              </div>
              <div class="option-info">
                <h3>Private Key</h3>
                <p>Single account import</p>
                <div class="feature-tags">
                  <span class="tag">Quick</span>
                  <span class="tag">Secure</span>
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
      <div class="security-warning">
        <div class="warning-icon">
          <i class="ri-shield-check-line"></i>
        </div>
        <div class="warning-content">
          <h4>Security Reminder</h4>
          <p>Never share your recovery phrase or private key with anyone. Riftwallet will never ask for this information.</p>
        </div>
      </div>
    </div>
  </ResponsiveLayout>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import ResponsiveLayout from '../components/ResponsiveLayout.vue'

const router = useRouter()

// Import mnemonic
const importMnemonic = () => {
  // 跳转到统一的链选择页面，使用助记词导入模式
  router.push('/select-chain?mode=import-mnemonic')
}

// Import private key
const importPrivateKey = () => {
  // 跳转到统一的链选择页面，使用私钥导入模式
  router.push('/select-chain?mode=import-private-key')
}
</script>

<style lang="scss" scoped>
// 自定义头部样式
.import-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  width: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateX(-2px);
  }
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: white;
}

// 主要内容容器
.import-content {
  padding: 24px;
  max-width: 420px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.import-header {
  text-align: center;
  margin-bottom: 40px;
}

.import-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: -2px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4);
    border-radius: 22px;
    z-index: -1;
    opacity: 0.3;
    filter: blur(6px);
  }

  i {
    font-size: 28px;
    color: white;
  }
}

.import-header h2 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #f1f5f9;
}

.import-header p {
  font-size: 16px;
  color: #94a3b8;
  margin: 0;
  line-height: 1.5;
}

.import-options {
  display: flex;
  flex-direction: column;
  gap: 24px;
  flex: 1;
}

.option-card {
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

.mnemonic-card {
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

.private-key-card {
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

.card-content {
  position: relative;
  z-index: 2;
  padding: 24px;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 20px;
}

.option-icon {
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

.option-info {
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

  &.popular {
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

.option-card:hover {
  .option-info {
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

    &.popular {
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

.security-warning {
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-top: 32px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(245, 158, 11, 0.12);
    border-color: rgba(245, 158, 11, 0.3);
  }

  .warning-icon {
    color: #f59e0b;
    font-size: 24px;
    flex-shrink: 0;
    margin-top: 2px;
    transition: transform 0.3s ease;
  }

  &:hover .warning-icon {
    transform: scale(1.1);
  }

  .warning-content {
    flex: 1;

    h4 {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 6px 0;
      color: #f59e0b;
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
  .import-wallet-container {
    padding: 20px;
  }

  .import-header {
    margin-bottom: 30px;
  }

  .import-icon {
    width: 56px;
    height: 56px;

    i {
      font-size: 24px;
    }
  }

  .import-header h2 {
    font-size: 22px;
  }

  .import-options {
    gap: 20px;
  }

  .option-card {
    height: 120px;

    .card-content {
      padding: 20px;
      gap: 16px;
    }
  }

  .option-icon {
    width: 56px;
    height: 56px;

    i {
      font-size: 28px;
    }
  }

  .option-info {
    h3 {
      font-size: 18px;
    }

    p {
      font-size: 13px;
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

// 响应式布局调整
@media (max-width: 400px) {
  .import-content {
    padding: 20px;
  }

  .import-header {
    margin-bottom: 24px;
  }

  .import-options {
    gap: 18px;
  }

  .option-card {
    height: 120px;

    .card-content {
      padding: 20px;
    }
  }

  .option-icon {
    width: 56px;
    height: 56px;

    i {
      font-size: 28px;
    }
  }

  .option-info {
    h3 {
      font-size: 18px;
    }

    p {
      font-size: 13px;
    }
  }

  .security-warning {
    margin-top: 20px;
  }
}
</style>
