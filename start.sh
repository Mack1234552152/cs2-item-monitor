#!/bin/bash

# CS2饰品监控器启动脚本

echo "🚀 CS2饰品监控器启动脚本"
echo "================================"

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm未安装，请先安装npm"
    exit 1
fi

# 显示Node.js版本
echo "📋 Node.js版本: $(node --version)"
echo "📋 npm版本: $(npm --version)"

# 检查package.json是否存在
if [ ! -f "package.json" ]; then
    echo "❌ package.json不存在，请确保在项目根目录运行此脚本"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

# 检查配置文件
echo "📋 检查配置文件..."
if [ ! -f "config/config.json" ]; then
    echo "❌ config/config.json不存在"
    echo "请确保已正确配置API令牌和通知设置"
    exit 1
fi

if [ ! -f "config/items.json" ]; then
    echo "❌ config/items.json不存在"
    echo "请确保已配置要监控的饰品列表"
    exit 1
fi

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p data logs

# 启动应用
echo "🚀 启动CS2饰品监控器..."
echo "按Ctrl+C停止监控"
echo "================================"

# 启动监控器
node src/index.js

echo "👋 监控器已停止"