# WXpusher 配置指南

## 🔧 问题诊断

如果您没有收到WXpusher通知消息，请按照以下步骤排查和配置：

## 📋 第一步：检查GitHub Secrets

1. 访问您的GitHub仓库：https://github.com/Mack1234552152/cs2-item-monitor
2. 点击 `Settings` 标签
3. 在左侧菜单中找到 `Secrets and variables` > `Actions`
4. 检查是否存在名为 `WXPUSHER_APP_TOKEN` 的Secret

## 🔑 第二步：获取WXpusher AppToken

1. 访问 [WXpusher管理后台](https://wxpusher.zjiecode.com/admin)
2. 登录您的账号
3. 进入 `应用管理` 页面
4. 找到或创建一个应用
5. 复制应用的 `AppToken`

## ⚙️ 第三步：配置GitHub Secret

1. 在GitHub仓库的 `Secrets and variables` > `Actions` 页面
2. 点击 `New repository secret`
3. 填写以下信息：
   - **Name**: `WXPUSHER_APP_TOKEN`
   - **Secret**: 您的WXpusher AppToken
4. 点击 `Add secret`

## 📱 第四步：关注WXpusher公众号

1. 使用微信扫描以下二维码关注WXpusher公众号：
   ```
   微信搜索：WXpusher
   或者访问：https://wxpusher.zjiecode.com/
   ```

2. 关注后，在公众号中输入您的应用Token或使用应用二维码绑定

## 🧪 第五步：测试配置

我们已经创建了测试工作流来验证配置：

### 方法1：简单配置测试
1. 访问：https://github.com/Mack1234552152/cs2-item-monitor/actions/workflows/simple-wxpusher-test.yml
2. 点击 `Run workflow` 手动触发测试
3. 查看测试结果和日志

### 方法2：强制价格预警测试  
1. 访问：https://github.com/Mack1234552152/cs2-item-monitor/actions/workflows/force-alert-test.yml
2. 点击 `Run workflow` 手动触发测试
3. 选择 `yes` 发送测试预警

## 🚨 常见问题

### Q: 为什么没有收到消息？
**A**: 最常见的原因是：
1. `WXPUSHER_APP_TOKEN` 未在GitHub Secrets中配置
2. 微信未关注WXpusher公众号
3. 应用配置错误或Token不正确

### Q: 测试工作流失败怎么办？
**A**: 查看工作流日志中的错误信息：
- 如果显示"WXPUSHER_APP_TOKEN 未配置"，需要添加Secret
- 如果显示HTTP错误，检查Token是否正确
- 如果显示"没有关注用户"，需要关注公众号

### Q: 价格预警为什么不触发？
**A**: 可能的原因：
1. 价格未达到预警条件（需要低于历史最低价的90%）
2. 缺少历史价格数据
3. API调用失败

## 📞 支持

如果问题仍然存在：
1. 查看GitHub Actions的详细日志
2. 检查WXpusher管理后台的应用状态
3. 确认微信已正确关注和绑定

## 🔗 相关链接

- [GitHub仓库](https://github.com/Mack1234552152/cs2-item-monitor)
- [WXpusher官网](https://wxpusher.zjiecode.com/)
- [WXpusher管理后台](https://wxpusher.zjiecode.com/admin/)