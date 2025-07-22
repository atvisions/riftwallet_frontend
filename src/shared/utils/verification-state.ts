// 全局验证状态管理
class VerificationState {
  private static instance: VerificationState
  private isVerifying = false
  private isNavigating = false

  static getInstance(): VerificationState {
    if (!VerificationState.instance) {
      VerificationState.instance = new VerificationState()
    }
    return VerificationState.instance
  }

  setVerifying(value: boolean): void {
    this.isVerifying = value
    console.log(`🔐 设置验证状态: ${value}`)
  }

  setNavigating(value: boolean): void {
    this.isNavigating = value
    console.log(`🔄 设置导航状态: ${value}`)
  }

  isCurrentlyVerifying(): boolean {
    return this.isVerifying
  }

  isCurrentlyNavigating(): boolean {
    return this.isNavigating
  }

  isBusy(): boolean {
    return this.isVerifying || this.isNavigating
  }

  reset(): void {
    this.isVerifying = false
    this.isNavigating = false
    console.log('🔄 重置验证状态')
  }
}

export const verificationState = VerificationState.getInstance()
