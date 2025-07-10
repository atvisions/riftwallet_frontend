<template>
  <div class="import-wallet-page">
    <div class="header">
      <button @click="$router.go(-1)" class="back-btn">
        <i class="ri-arrow-left-line"></i>
      </button>
      <h1>Import Wallet</h1>
    </div>

    <div class="content">
      <div class="import-options">
        <!-- Import Recovery Phrase -->
        <div class="option-card" @click="importMnemonic">
          <div class="option-icon">
            <i class="ri-file-text-line"></i>
          </div>
          <div class="option-content">
            <h3>Import Recovery Phrase</h3>
            <p>Import account from another wallet</p>
          </div>
          <div class="option-arrow">
            <i class="ri-arrow-right-line"></i>
          </div>
        </div>

        <!-- Import Private Key -->
        <div class="option-card" @click="importPrivateKey">
          <div class="option-icon">
            <i class="ri-key-line"></i>
          </div>
          <div class="option-content">
            <h3>Import Private Key</h3>
            <p>Import single chain account</p>
          </div>
          <div class="option-arrow">
            <i class="ri-arrow-right-line"></i>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

// Import mnemonic
const importMnemonic = () => {
  // 设置导入类型为助记词，然后跳转到链选择页面
  sessionStorage.setItem('import_type', 'mnemonic')
  router.push('/import-private-key-select-chain')
}

// Import private key
const importPrivateKey = () => {
  // 设置导入类型为私钥，然后跳转到链选择页面
  sessionStorage.setItem('import_type', 'private_key')
  router.push('/import-private-key-select-chain')
}
</script>

<style lang="scss" scoped>
.import-wallet-page {
  width: 375px;
  height: 762px;
  background: #0F172A;
  color: #f1f5f9;
}

.header {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #1E293B;

  .back-btn {
    background: none;
    border: none;
    color: #6366f1;
    font-size: 20px;
    margin-right: 16px;
    cursor: pointer;

    &:hover {
      color: #8b5cf6;
    }
  }

  h1 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }
}

.content {
  padding: 20px 16px;
  height: calc(100% - 80px);
  overflow-y: auto;
}

.import-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: #6366f1;
    transform: translateY(-1px);
  }
}

.option-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  i {
    font-size: 20px;
    color: white;
  }
}

.option-content {
  flex: 1;

  h3 {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 4px 0;
    color: #f1f5f9;
  }

  p {
    font-size: 14px;
    color: #94a3b8;
    margin: 0;
    line-height: 1.3;
  }
}

.option-arrow {
  color: #6366f1;
  font-size: 16px;
  transition: transform 0.3s ease;

  .option-card:hover & {
    transform: translateX(2px);
  }
}
</style>
