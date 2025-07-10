<template>
  <div class="send-page">
    <div class="header">
      <button @click="$router.go(-1)" class="back-btn">
        <i class="ri-arrow-left-line"></i>
      </button>
      <h1>Send</h1>
    </div>
    
    <div class="content">
      <div class="form-section">
        <label>To Address</label>
        <input 
          v-model="toAddress" 
          type="text" 
          placeholder="Enter recipient address"
          class="input-field"
        >
      </div>
      
      <div class="form-section">
        <label>Amount</label>
        <input 
          v-model="amount" 
          type="number" 
          placeholder="0.00"
          class="input-field"
        >
      </div>
      
      <div class="form-section">
        <label>Token</label>
        <select v-model="selectedToken" class="input-field">
          <option value="">Select token</option>
          <option v-for="token in tokens" :key="token.token_address" :value="token.token_address">
            {{ token.symbol }} - {{ token.name }}
          </option>
        </select>
      </div>
      
      <button @click="handleSend" :disabled="!canSend" class="send-btn">
        Send Transaction
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWalletStore } from '@shared/stores/wallet'

const walletStore = useWalletStore()

const toAddress = ref('')
const amount = ref('')
const selectedToken = ref('')

const tokens = computed(() => walletStore.currentWalletTokens)

const canSend = computed(() => {
  return toAddress.value && amount.value && parseFloat(amount.value) > 0
})

const handleSend = async () => {
  if (!canSend.value) return
  
  try {
    // TODO: Implement send logic
    console.log('Sending transaction:', {
      to: toAddress.value,
      amount: amount.value,
      token: selectedToken.value
    })
  } catch (error) {
    console.error('Send failed:', error)
  }
}
</script>

<style lang="scss" scoped>
.send-page {
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
  }
  
  h1 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }
}

.content {
  padding: 24px;
}

.form-section {
  margin-bottom: 24px;
  
  label {
    display: block;
    font-weight: 500;
    margin-bottom: 8px;
    color: #f1f5f9;
  }
  
  .input-field {
    width: 100%;
    padding: 12px 16px;
    background: #1E293B;
    border: 1px solid #334155;
    border-radius: 8px;
    color: #f1f5f9;
    font-size: 16px;
    
    &:focus {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
    
    &::placeholder {
      color: #64748b;
    }
  }
}

.send-btn {
  width: 100%;
  padding: 16px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  
  &:hover:not(:disabled) {
    background: #5856d6;
  }
  
  &:disabled {
    background: #374151;
    cursor: not-allowed;
  }
}
</style>
