#!/usr/bin/env node

// 图标生成脚本
// 需要安装 sharp: npm install sharp --save-dev

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputFile = path.join(__dirname, '../public/icons/logo.jpg');
const outputDir = path.join(__dirname, '../public/icons');

// 需要生成的图标尺寸
const sizes = [
  { size: 16, name: 'icon16.png' },
  { size: 48, name: 'icon48.png' },
  { size: 128, name: 'icon128.png' }
];

async function generateIcons() {
  try {
    // 检查输入文件是否存在
    if (!fs.existsSync(inputFile)) {
      console.error('❌ Logo file not found:', inputFile);
      process.exit(1);
    }

    console.log('🎨 Generating Chrome extension icons...');
    console.log('📁 Input file:', inputFile);
    console.log('📁 Output directory:', outputDir);

    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 生成每个尺寸的图标
    for (const { size, name } of sizes) {
      const outputPath = path.join(outputDir, name);
      
      await sharp(inputFile)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .png({
          quality: 90,
          compressionLevel: 6
        })
        .toFile(outputPath);
      
      console.log(`✅ Generated ${name} (${size}x${size})`);
    }

    console.log('🎉 All icons generated successfully!');
    
    // 显示生成的文件信息
    console.log('\n📋 Generated files:');
    for (const { name } of sizes) {
      const filePath = path.join(outputDir, name);
      const stats = fs.statSync(filePath);
      console.log(`   ${name}: ${(stats.size / 1024).toFixed(1)} KB`);
    }

  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

// 检查是否安装了 sharp
try {
  await import('sharp');
} catch (error) {
  console.error('❌ Sharp is not installed. Please run:');
  console.error('   npm install sharp --save-dev');
  process.exit(1);
}

generateIcons();
