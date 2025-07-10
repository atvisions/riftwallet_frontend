#!/usr/bin/env node

// 简单的构建测试脚本
const fs = require('fs')
const path = require('path')

console.log('🚀 CocoWallet Extension Build Test')
console.log('=====================================')

// 检查必要文件
const requiredFiles = [
  'package.json',
  'vite.config.ts',
  'tsconfig.json',
  'public/manifest.json',
  'src/popup/main.ts',
  'src/popup/App.vue',
  'src/popup/views/Home.vue',
  'src/background/index.ts',
  'src/content/index.ts',
  'src/shared/types/index.ts',
  'src/shared/constants/index.ts',
  'src/shared/utils/index.ts',
  'src/shared/stores/wallet.ts',
  'src/shared/stores/auth.ts'
]

let allFilesExist = true

console.log('\n📁 Checking required files...')
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file)
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`)
  } else {
    console.log(`❌ ${file} - MISSING`)
    allFilesExist = false
  }
})

// 检查package.json依赖
console.log('\n📦 Checking package.json...')
const packagePath = path.join(__dirname, '..', 'package.json')
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
  
  const requiredDeps = [
    'vue',
    'vue-router',
    'pinia',
    'axios',
    'crypto-js',
    'ethers',
    '@solana/web3.js',
    'echarts',
    'uuid'
  ]
  
  const requiredDevDeps = [
    '@types/chrome',
    '@vitejs/plugin-vue',
    'typescript',
    'vite',
    'vue-tsc'
  ]
  
  console.log('Dependencies:')
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`)
    } else {
      console.log(`❌ ${dep} - MISSING`)
      allFilesExist = false
    }
  })
  
  console.log('Dev Dependencies:')
  requiredDevDeps.forEach(dep => {
    if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
      console.log(`✅ ${dep}: ${packageJson.devDependencies[dep]}`)
    } else {
      console.log(`❌ ${dep} - MISSING`)
      allFilesExist = false
    }
  })
}

// 检查manifest.json
console.log('\n🔧 Checking manifest.json...')
const manifestPath = path.join(__dirname, '..', 'public', 'manifest.json')
if (fs.existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    
    const requiredFields = [
      'manifest_version',
      'name',
      'version',
      'description',
      'action',
      'background',
      'content_scripts',
      'permissions'
    ]
    
    requiredFields.forEach(field => {
      if (manifest[field]) {
        console.log(`✅ ${field}`)
      } else {
        console.log(`❌ ${field} - MISSING`)
        allFilesExist = false
      }
    })
    
    // 检查manifest版本
    if (manifest.manifest_version === 3) {
      console.log('✅ Using Manifest V3')
    } else {
      console.log('⚠️  Not using Manifest V3')
    }
    
  } catch (error) {
    console.log('❌ Invalid JSON in manifest.json')
    allFilesExist = false
  }
}

// 总结
console.log('\n📊 Build Test Summary')
console.log('=====================')

if (allFilesExist) {
  console.log('🎉 All checks passed! Ready to build.')
  console.log('\nNext steps:')
  console.log('1. Run: npm install')
  console.log('2. Run: npm run build')
  console.log('3. Load the dist/ directory in Chrome as an unpacked extension')
  process.exit(0)
} else {
  console.log('❌ Some files or dependencies are missing.')
  console.log('Please check the errors above and fix them before building.')
  process.exit(1)
}
