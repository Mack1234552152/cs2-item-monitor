#!/bin/bash

echo "🚀 CS2饰品监控器GitHub部署脚本"
echo "=================================="

# 检查是否在正确目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

echo "📋 请确保您已经："
echo "1. 在GitHub创建了公开仓库：cs2-item-monitor"
echo "2. 获得了仓库的Git URL"
echo ""

read -p "请输入您的GitHub用户名: " USERNAME
read -p "请输入仓库名 (默认: cs2-item-monitor): " REPO_NAME

# 设置默认仓库名
if [ -z "$REPO_NAME" ]; then
    REPO_NAME="cs2-item-monitor"
fi

REPO_URL="https://github.com/$USERNAME/$REPO_NAME.git"

echo ""
echo "🔧 开始配置Git..."

# 初始化Git（如果还没有）
if [ ! -d ".git" ]; then
    git init
    echo "✅ Git仓库已初始化"
fi

# 添加所有文件
git add .
echo "✅ 文件已添加到暂存区"

# 提交
git commit -m "初始化CS2饰品监控器

✨ 功能特点:
- 🔍 多平台价格监控 (Steam, BUFF, 悠悠有品)
- 📱 微信实时推送通知
- 🤖 GitHub Actions自动化运行
- 📊 价格历史记录和分析
- 🛡️ 完善的错误处理和重试机制

🚀 部署说明:
1. 配置GitHub Secrets (API令牌)
2. 启用GitHub Actions
3. 开始24小时自动监控"

echo "✅ 代码已提交"

# 设置主分支
git branch -M main
echo "✅ 设置为main分支"

# 添加远程仓库
git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"
echo "✅ 远程仓库已配置: $REPO_URL"

echo ""
echo "🔐 准备推送到GitHub..."
echo "注意: 可能需要输入GitHub用户名和Personal Access Token"
echo ""

# 推送到GitHub
if git push -u origin main; then
    echo ""
    echo "🎉 代码上传成功！"
    echo ""
    echo "📋 下一步操作:"
    echo "1. 访问: https://github.com/$USERNAME/$REPO_NAME"
    echo "2. 进入 Settings > Secrets and variables > Actions"
    echo "3. 添加以下Secrets:"
    echo "   - CSQAQ_TOKEN: JOVN71P7T388E2N1G1H6W5A0"
    echo "   - CSQAQ_WHITELIST_IP: 111.19.113.82"
    echo "   - WXPUSHER_APP_TOKEN: AT_dmsTcEfwKejxVc42SEVppII7gUUYCIRH"
    echo "4. 进入 Actions 页面启用工作流"
    echo "5. 等待几分钟，系统开始自动监控！"
    echo ""
    echo "🎮 享受您的CS2饰品监控服务！"
else
    echo ""
    echo "❌ 上传失败，请检查："
    echo "1. GitHub仓库是否已创建"
    echo "2. 仓库URL是否正确"
    echo "3. 是否有推送权限"
    echo ""
    echo "💡 也可以使用GitHub网页界面上传文件"
fi