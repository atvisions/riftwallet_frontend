// Content Script
// 与网页交互，提供Web3功能

import { ChromeMessage } from '@shared/types'
import { MESSAGE_TYPES } from '@shared/constants'

console.log('Riftwallet Content Script loaded')

// 注入Provider脚本到页面
function injectProvider() {
  try {
    const script = document.createElement('script')
    script.src = chrome.runtime.getURL('content/injected.js')
    script.onload = function() {
      // 脚本加载完成后移除
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
    
    // 注入到页面
    const target = document.head || document.documentElement
    target.appendChild(script)
    
    console.log('Riftwallet provider injected')
  } catch (error) {
    console.error('Failed to inject provider:', error)
  }
}

// 监听来自注入脚本的消息
window.addEventListener('message', async (event) => {
  // 只处理来自同一窗口的消息
  if (event.source !== window) return
  
  // 检查消息格式
  if (!event.data || event.data.source !== 'cocowallet-injected') return
  
  console.log('Content script received message from injected script:', event.data)
  
  try {
    // 转发消息到background script
    const response = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.PROVIDER_REQUEST,
      data: event.data
    })
    
    // 将响应发送回注入脚本
    window.postMessage({
      source: 'cocowallet-content',
      id: event.data.id,
      response: response
    }, '*')
    
  } catch (error) {
    console.error('Failed to handle provider request:', error)
    
    // 发送错误响应
    window.postMessage({
      source: 'cocowallet-content',
      id: event.data.id,
      error: error.message
    }, '*')
  }
})

// 监听来自background script的消息
chrome.runtime.onMessage.addListener((message: ChromeMessage, sender, sendResponse) => {
  console.log('Content script received message from background:', message.type)
  
  switch (message.type) {
    case MESSAGE_TYPES.INJECT_PROVIDER:
      injectProvider()
      sendResponse({ success: true })
      break
      
    default:
      sendResponse({ success: false, error: 'Unknown message type' })
  }
  
  return true
})

// 页面加载完成后自动注入Provider
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectProvider)
} else {
  injectProvider()
}

// 检测页面是否为DApp
function detectDApp() {
  // 检测常见的Web3库
  const web3Libraries = [
    'web3',
    'ethers',
    'Web3',
    'ethereum'
  ]
  
  const isDApp = web3Libraries.some(lib => {
    return window.hasOwnProperty(lib) || 
           document.querySelector(`script[src*="${lib}"]`) !== null
  })
  
  if (isDApp) {
    console.log('DApp detected, Riftwallet provider available')
    
    // 通知background script
    chrome.runtime.sendMessage({
      type: 'DAPP_DETECTED',
      data: {
        url: window.location.href,
        title: document.title
      }
    })
  }
}

// 延迟检测DApp，等待页面完全加载
setTimeout(detectDApp, 2000)

// 监听页面变化（SPA应用）
let lastUrl = location.href
new MutationObserver(() => {
  const url = location.href
  if (url !== lastUrl) {
    lastUrl = url
    setTimeout(detectDApp, 1000)
  }
}).observe(document, { subtree: true, childList: true })
