# 🔫 CS2 饰品价格监控系统

基于 GitHub Actions 和 CSQAQ API 的 CS2 饰品价格自动监控系统，支持实时价格追踪和 WXpusher 推送通知。

## ✨ 功能特性

- 🔄 **自动IP绑定**：每次运行时动态绑定 GitHub Actions IP 到 CSQAQ
- 📊 **多饰品监控**：支持同时监控多个热门饰品价格
- 🔥 **热门排行**：获取当前热门饰品排行榜
- 📱 **实时通知**：通过 WXpusher 推送到手机
- 🛠️ **智能错误处理**：完善的错误检测和通知机制
- ⏰ **定时运行**：每6小时自动监控 + 每天9点额外推送
- 🧪 **测试模式**：支持手动测试运行

## 🚀 快速开始

### 1. 获取 CSQAQ API Token

1. 访问 [CSQAQ 官网](https://csqaq.com) 并登录
2. 点击右上角用户头像
3. 查找并复制 "ApiToken令牌"

### 2. 配置 GitHub Secrets

进入你的 GitHub 仓库设置：

1. 点击 `Settings` → `Secrets and variables` → `Actions`
2. 点击 `New repository secret`
3. 添加以下 Secret：

| Secret 名称 | 值 | 说明 |
|------------|-----|------|
| `CSQAQ_API_TOKEN` | 你的 CSQAQ API Token | 必需 |

### 3. 测试运行

1. 进入 `Actions` 页面
2. 选择 `CS2 Advanced Price Monitor` 工作流
3. 点击 `Run workflow`
4. 可选择 "测试模式" 进行快速验证

## 📋 监控的饰品

### 默认监控饰品
- M4A4 \| 活色生香 (崭新出厂) - ID: 13283
- AWP \| 复古流行 (崭新出厂) - ID: 13463  
- M4A4 \| 赛博 (崭新出厂) - ID: 12832

### 热门排行
实时获取 CSQAQ 热门饰品 TOP 排行榜

## 📱 WXpusher 配置

系统已预配置 WXpusher 推送：
- **AppToken**: `AT_oVgZnjiSqzzv1ycEbihcgjtoM4BggMjz`
- **用户UID**: `UID_Nkv98Q7XEQcDsvSInIlR10nm33xI`

确保你的 WXpusher 账号可以接收消息。

## ⚙️ 工作流说明

### 运行时间
- **定时运行**：每6小时 (0 */6 * * *)
- **额外推送**：每天上午9点 (0 9 * * *)
- **手动触发**：支持随时手动运行

### 执行步骤
1. 📍 获取当前运行器IP地址
2. 🔗 绑定IP到 CSQAQ 白名单
3. ⏳ 等待绑定生效 (30秒)
4. 📊 获取多个饰品价格数据
5. 🔥 获取热门饰品排行榜
6. 📱 发送WXpusher通知到手机
7. 📊 生成执行报告

## 🛠️ 自定义配置

### 修改监控饰品

编辑 `scripts/cs2-monitor.js` 中的 `targetItems` 数组：

```javascript
const targetItems = [
    { id: 13283, name: 'M4A4 | 活色生香 (崭新出厂)' },
    { id: 13463, name: 'AWP | 复古流行 (崭新出厂)' },
    { id: 12832, name: 'M4A4 | 赛博 (崭新出厂)' },
    // 添加更多饰品...
];
```

### 修改运行频率

编辑 `.github/workflows/cs2-monitor-advanced.yml` 中的 cron 表达式：

```yaml
schedule:
  - cron: '0 */6 * * *'  # 每6小时
  - cron: '0 9 * * *'   # 每天9点
```

### 添加更多监控功能

可以扩展 `scripts/cs2-monitor.js` 来支持：
- 价格阈值提醒
- 历史价格趋势分析
- 更多饰品数据源
- 自定义通知格式

## 📊 通知格式示例

### 成功通知
```
✅ CS2饰品价格更新

📊 M4A4 | 活色生香 (崭新出厂)
💰 当前价格: ¥1978
📈 24h涨跌: +5.2%
🕐 更新时间: 2025-10-25 16:45:00

🔥 热门饰品TOP3:
1. M4A4 | 活色生香: ¥1978
2. AWP | 复古流行: ¥320
3. M4A4 | 赛博: ¥2470
```

### 错误通知
```
❌ CS2监控失败

🔧 状态: IP绑定失败
📍 IP: 102.114.14.120
🌍 位置: San Francisco
🕐 失败时间: 2025-10-25 08:45:00

请检查工作流日志
```

## 🔧 故障排除

### 常见问题

**Q: 没有收到WXpusher通知？**
A: 
1. 检查 WXpusher AppToken 和 UID 是否正确
2. 确认手机网络连接正常
3. 查看 GitHub Actions 日志确认工作流状态

**Q: IP绑定失败？**
A:
1. 检查 CSQAQ_API_TOKEN 是否正确设置
2. 确认 Token 没有过期
3. 重新获取新的 API Token

**Q: 饰品数据获取失败？**
A:
1. 确认 IP 绑定成功
2. 检查饰品ID是否正确
3. 查看 CSQAQ API 状态

### 调试方法

1. **启用测试模式**：手动运行工作流时选择测试模式
2. **查看详细日志**：在 GitHub Actions 页面查看完整执行日志
3. **检查API响应**：日志中包含完整的API响应信息

## 📝 项目结构

```
cs2-item-monitor/
├── .github/workflows/
│   ├── cs2-monitor-fixed.yml      # 基础监控工作流
│   ├── cs2-monitor-advanced.yml   # 高级监控工作流 (推荐)
│   └── test-notification.yml      # 测试通知工作流
├── scripts/
│   └── cs2-monitor.js            # Node.js 监控脚本
├── README.md                     # 项目说明文档
└── trigger-workflow.md           # 工作流触发文件
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个监控系统！

## 📄 许可证

本项目采用 MIT 许可证 - 详见 LICENSE 文件

## 🔗 相关链接

- [CSQAQ 官网](https://csqaq.com)
- [CSQAQ API 文档](https://docs.csqaq.com)
- [WXpusher 官网](https://wxpusher.zjiecode.com)
- [GitHub Actions 文档](https://docs.github.com/en/actions)

---

⭐ 如果这个项目对你有帮助，请给个 Star！