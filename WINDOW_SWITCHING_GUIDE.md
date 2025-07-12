# 🔄 Riftwallet 窗口切换功能指南

## 📋 功能概述

Riftwallet 现在支持完整的窗口模式切换功能，类似于 Phantom 钱包的体验：

- **弹窗模式 (Popup Mode)**: 传统的小窗口弹窗界面
- **侧边栏模式 (Side Panel Mode)**: 浏览器侧边栏的大屏幕界面

## 🎯 切换方式

### 1. 通过界面按钮切换

在钱包界面右上角有一个切换按钮：

- **🔍 全屏图标**: 当前为弹窗模式，点击切换到侧边栏模式
- **⬅ 收缩图标**: 当前为侧边栏模式，点击切换到弹窗模式

### 2. 通过扩展图标切换

点击浏览器工具栏中的 Riftwallet 图标：

- 会自动在弹窗模式和侧边栏模式之间智能切换
- 系统会记住每个窗口的当前模式状态

## 🔧 技术实现

### Background Script 消息处理

```typescript
// 支持的消息类型
- SWITCH_TO_SIDEPANEL: 切换到侧边栏模式
- SWITCH_TO_POPUP: 切换到弹窗模式
- GET_WINDOW_MODE: 获取当前窗口模式
- TOGGLE_SIDEPANEL: 切换侧边栏显示状态
```

### 状态管理

```typescript
// 窗口模式状态存储
const windowModes = new Map<number, 'popup' | 'sidepanel'>()

// 响应式状态
const isSidePanelMode = ref(false)

// 图标计算属性
const sidePanelModeIcon = computed(() => {
  return isSidePanelMode.value ? 'ri-contract-left-line' : 'ri-fullscreen-line'
})
```

## 🎨 视觉反馈

### 按钮状态

- **默认状态**: 白色半透明背景，白色边框
- **悬停状态**: 边框变亮，轻微放大效果 (scale: 1.05)
- **激活状态**: 蓝色边框，蓝色发光效果
- **点击状态**: 按下效果，背景变深

### 图标变化

```scss
// 弹窗模式图标
.ri-fullscreen-line

// 侧边栏模式图标  
.ri-contract-left-line
```

## 🚀 使用流程

### 开发环境

1. 启动开发服务器: `npm run dev`
2. 打开浏览器访问 `http://localhost:5173`
3. 点击右上角切换按钮测试功能
4. 查看控制台日志了解切换过程

### 扩展环境

1. 构建扩展: `npm run build`
2. 在 Chrome 中加载 `dist` 文件夹
3. 点击工具栏图标或界面按钮切换模式
4. 享受流畅的窗口切换体验

## 📱 兼容性

- ✅ Chrome 114+ (支持 Side Panel API)
- ✅ 开发环境 (模拟切换功能)
- ✅ 降级支持 (自动回退到标签页模式)

## 🔍 调试信息

切换过程中会输出详细的控制台日志：

```
🔄 Toggle side panel mode clicked!
📱 Switching to side panel mode...
✅ Successfully switched to side panel mode
🎯 Icon state set to: contract
```

## ⚠️ 注意事项

1. **API 限制**: Chrome 扩展 API 无法直接关闭侧边栏，只能通过打开新窗口来"切换"
2. **状态持久化**: 窗口模式状态存储在内存中，扩展重启后会重置
3. **开发环境**: 在开发环境中只会切换图标状态，不会实际切换窗口

## 🎯 未来改进

- [ ] 状态持久化到 Chrome Storage
- [ ] 添加用户偏好设置
- [ ] 支持键盘快捷键切换
- [ ] 添加切换动画效果
