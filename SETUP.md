# CS2饰品监控器部署指南

## 🎯 测试结果确认

✅ **微信推送功能**: 测试成功，您的UID已自动配置
✅ **价格预警功能**: 测试成功，消息格式正确
✅ **自动UID获取**: 系统会自动获取所有关注用户

您的UID: `UID_Nkv98Q7XEQcDsvSInIlR10nm33xI`

## 🚀 GitHub部署步骤

### 1. 创建GitHub仓库

```bash
# 1. 在GitHub上创建新的公共仓库 "cs2-item-monitor"
# 2. 本地初始化git（如果还没有）
cd cs2-item-monitor
git init
git add .
git commit -m "初始化CS2饰品监控器"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/cs2-item-monitor.git
git push -u origin main
```

### 2. 配置GitHub Secrets

进入你的GitHub仓库 → Settings → Secrets and variables → Actions

添加以下secrets：

| 名称 | 值 | 说明 |
|------|----|----|
| `CSQAQ_TOKEN` | `JOVN71P7T388E2N1G1H6W5A0` | 你的CSQAQ API令牌 |
| `CSQAQ_WHITELIST_IP` | `111.19.113.82` | 你的IP白名单 |
| `WXPUSHER_APP_TOKEN` | `AT_dmsTcEfwKejxVc42SEVppII7gUUYCIRH` | 你的WXpusher应用令牌 |

### 3. 启用GitHub Actions

1. 进入仓库的 `Actions` 页面
2. 点击 "I understand my workflows, go ahead and enable them"
3. 系统将自动开始运行监控

### 4. 配置监控饰品

编辑 `config/items.json` 文件：

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
    },
    {
      "id": 2,
      "name": "AWP 龙狙",
      "market_name": "AWP | Dragon Lore", 
      "enabled": true,
      "platforms": ["youyoupin", "buff", "steam"],
      "wear_ranges": ["FT", "MW", "FN"],
      "notify_threshold": 0.95,
      "priority": "high"
    }
  ]
}
```

## 🔍 监控配置说明

### 预警阈值设置

- `notify_threshold`: 预警阈值（0.9 = 当前价格低于历史最低价90%时预警）
- 建议值：
  - 热门饰品：0.95 (5%折扣就通知)
  - 普通饰品：0.9 (10%折扣才通知)
  - 高价饰品：0.98 (2%折扣就通知)

### 平台选择

- `youyoupin`: 悠悠有品
- `buff`: BUFF饰品
- `steam`: Steam官方市场

### 饰品ID获取

1. 访问CSQAQ API文档查找饰品ID
2. 或使用搜索功能找到对应ID
3. 确保ID在白名单IP范围内可以访问

## ⏰ 运行时间表

| 任务 | 频率 | 说明 |
|------|------|------|
| 价格监控 | 每5分钟 | 检查所有启用的饰品价格 |
| 每日报告 | 每天8:00 | 发送前一天的监控统计 |
| 系统维护 | 每周日2:00 | 清理过期数据和备份 |

## 📱 通知类型

### 1. 价格预警
```
🚨 CS2饰品价格预警！

📦 饰品名称: AK-47 红线
🏪 交易平台: BUFF饰品
💰 当前价格: ¥85.60
📉 历史最低: ¥95.20
🎯 折扣幅度: 10.1%
⏰ 发现时间: 2024-01-15 14:30:25

⚡ 机会难得，快去抢购吧！
```

### 2. 每日报告
```
📈 CS2饰品监控日报

📦 监控饰品: 5 个
🚨 触发预警: 3 次
📅 日期: 2024-01-15

🏆 今日最佳交易:
1. AK-47 红线 - 10.1%折扣
2. M4A4 咆哮 - 8.5%折扣

📊 监控系统运行正常
```

### 3. 系统通知
```
ℹ️ CS2饰品监控系统

📊 状态更新: 监控系统启动
⏰ 时间: 2024-01-15 12:00:00
```

## 🛠️ 故障排除

### 常见问题

1. **收不到通知**
   - 检查WXpusher公众号是否关注
   - 确认AppToken是否正确
   - 查看GitHub Actions运行日志

2. **API调用失败**
   - 检查CSQAQ Token是否有效
   - 确认IP是否在白名单中
   - 查看API配额是否用完

3. **GitHub Actions不运行**
   - 确认仓库是公开的
   - 检查Actions是否启用
   - 查看workflow文件语法

### 查看运行日志

1. 进入GitHub仓库
2. 点击 `Actions` 标签
3. 选择最新的运行记录
4. 查看详细日志信息

## 📊 数据持久化

GitHub Actions使用缓存机制保存数据：
- 价格历史数据会在运行间保持
- 预警记录会持续累积
- 系统会自动清理30天前的数据

## 🔒 安全性

- 所有敏感信息都通过GitHub Secrets加密存储
- API令牌不会出现在代码中
- 运行日志不包含敏感信息

## 📈 扩展功能

后续可以添加：
- 更多交易平台支持
- 价格趋势分析
- 自定义通知模板
- Web管理界面
- 移动端APP

---

🎮 **部署完成后，您将收到24小时不间断的CS2饰品价格监控服务！**