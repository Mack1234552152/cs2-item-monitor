# CS2饰品价格监控器

一个全自动的CS2饰品价格监控系统，支持多平台价格监控和微信推送通知。

## 🌟 功能特点

- 🔍 **多平台监控**: 支持Steam市场、BUFF饰品、悠悠有品
- 📱 **微信推送**: 使用WXpusher实现实时微信通知
- 🤖 **GitHub Actions**: 完全免费的24小时自动监控
- 📊 **价格分析**: 自动计算历史最低价和折扣幅度
- 🛡️ **错误处理**: 完善的重试机制和错误恢复
- 📈 **数据存储**: 自动保存价格历史和预警记录
- 🔧 **灵活配置**: 支持自定义监控频率和预警阈值

## 🚀 快速开始

### 方式一：GitHub Actions（推荐）

1. **Fork此仓库**
   ```bash
   # 在GitHub上Fork这个仓库到你的账户
   ```

2. **配置GitHub Secrets**
   
   在你的GitHub仓库中，进入 `Settings > Secrets and variables > Actions`，添加以下secrets：
   
   - `CSQAQ_TOKEN`: 你的CSQAQ API令牌
   - `CSQAQ_WHITELIST_IP`: 你的IP白名单
   - `WXPUSHER_APP_TOKEN`: 你的WXpusher应用令牌

3. **启用GitHub Actions**
   
   进入仓库的 `Actions` 页面，启用工作流。

4. **配置监控饰品**
   
   编辑 `config/items.json` 文件，添加你要监控的饰品：
   ```json
   {
     "items": [
       {
         "id": 1,
         "name": "AK-47 红线",
         "market_name": "AK-47 | Redline",
         "enabled": true,
         "platforms": ["youyoupin", "buff", "steam"],
         "wear_ranges": ["FT", "MW", "FN"],
         "notify_threshold": 0.9,
         "priority": "high"
       }
     ]
   }
   ```

5. **完成！**
   
   系统将自动每5分钟检查一次价格，发现低价时会发送微信通知。

### 方式二：本地运行

1. **克隆仓库**
   ```bash
   git clone https://github.com/your-username/cs2-item-monitor.git
   cd cs2-item-monitor
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置设置**
   
   编辑 `config/config.json` 文件，填入你的API令牌和通知设置。

4. **启动监控**
   ```bash
   # 使用启动脚本
   ./start.sh
   
   # 或直接运行
   npm start
   ```

## ⚙️ 配置说明

### API配置 (`config/config.json`)

```json
{
  "api": {
    "csqaq": {
      "baseUrl": "https://api.csqaq.com",
      "token": "你的CSQAQ API令牌",
      "whitelist_ip": "你的IP白名单"
    }
  },
  "notification": {
    "wxpusher": {
      "appToken": "你的WXpusher应用令牌",
      "baseUrl": "https://wxpusher.zjiecode.com"
    }
  },
  "monitor": {
    "interval": 300000,
    "platforms": ["youyoupin", "buff", "steam"],
    "priceThreshold": 0.95,
    "retryAttempts": 3,
    "retryDelay": 5000
  }
}
```

### 饰品配置 (`config/items.json`)

```json
{
  "items": [
    {
      "id": 1,
      "name": "饰品显示名称",
      "market_name": "Steam市场名称",
      "enabled": true,
      "platforms": ["youyoupin", "buff", "steam"],
      "wear_ranges": ["FT", "MW", "FN"],
      "notify_threshold": 0.9,
      "priority": "high"
    }
  ]
}
```

## 📊 监控原理

1. **价格获取**: 每5分钟通过CSQAQ API获取各平台当前价格
2. **历史对比**: 将当前价格与历史最低价对比
3. **预警判断**: 当价格低于历史最低价的90%时触发预警
4. **通知推送**: 通过WXpusher发送微信通知
5. **数据存储**: 保存价格历史和预警记录

## 🛠️ 项目结构

```
cs2-item-monitor/
├── .github/
│   └── workflows/
│       └── price-monitor.yml    # GitHub Actions工作流
├── config/
│   ├── config.json             # 主配置文件
│   └── items.json              # 饰品配置文件
├── src/
│   ├── api/
│   │   └── csqaq.js           # CSQAQ API接口
│   ├── notification/
│   │   └── wxpusher.js        # WXpusher通知模块
│   ├── monitor/
│   │   └── priceMonitor.js    # 价格监控核心逻辑
│   ├── storage/
│   │   └── dataManager.js     # 数据存储管理
│   └── index.js               # 主程序入口
├── data/                      # 数据存储目录
├── logs/                      # 日志文件目录
├── package.json
├── start.sh                   # 启动脚本
└── README.md
```

## 🔧 高级配置

### 自定义监控频率

在GitHub Actions中修改 `.github/workflows/price-monitor.yml`:

```yaml
on:
  schedule:
    # 每10分钟运行一次
    - cron: '*/10 * * * *'
```

### 添加新饰品

1. 在 `config/items.json` 中添加新的饰品配置
2. 设置合适的预警阈值 (`notify_threshold`)
3. 选择要监控的平台 (`platforms`)

### 修改通知内容

编辑 `src/notification/wxpusher.js` 中的 `sendPriceAlert` 方法。

## 📱 微信通知设置

1. **关注WXpusher公众号**
   
   扫描二维码关注WXpusher微信公众号

2. **创建应用**
   
   在 [WXpusher官网](https://wxpusher.zjiecode.com/) 创建应用并获取AppToken

3. **获取UID**
   
   关注公众号后会自动获得UID，用于接收通知

## 🚨 预警类型

- **💰 价格预警**: 当前价格低于历史最低价的阈值时
- **📊 每日报告**: 每天8点发送监控统计报告
- **⚠️ 系统异常**: 监控系统出现错误时
- **🔧 系统维护**: 每周日进行数据清理和备份

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 📝 更新日志

### v1.0.0
- ✅ 基础价格监控功能
- ✅ 多平台支持（Steam、BUFF、悠悠有品）
- ✅ 微信推送通知
- ✅ GitHub Actions自动化
- ✅ 数据存储和历史记录
- ✅ 错误处理和重试机制

## 🙏 致谢

- [CSQAQ](https://docs.csqaq.com/) - 提供CS2饰品数据API
- [WXpusher](https://wxpusher.zjiecode.com/) - 提供微信推送服务
- [GitHub Actions](https://github.com/features/actions) - 提供免费的自动化服务

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🔗 相关链接

- [CSQAQ API文档](https://docs.csqaq.com/)
- [WXpusher官网](https://wxpusher.zjiecode.com/)
- [GitHub Actions文档](https://docs.github.com/en/actions)

---

🎮 **Happy Trading!** 愿你买到心仪的饰品！
