const WXPusher = require('../src/notification/wxpusher');
const CSQAQApi = require('../src/api/csqaq');

class TestResultsNotifier {
  constructor() {
    this.wxpusher = new WXPusher();
    this.csqaq = new CSQAQApi();
  }

  async sendTestResults(testResults) {
    const timestamp = new Date().toLocaleString('zh-CN');
    const { passed, failed, total, details } = testResults;
    const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';

    let content = `🧪 CS2饰品监控系统 - API测试报告\n\n`;
    content += `📊 测试统计:\n`;
    content += `   • 总测试数: ${total}\n`;
    content += `   • ✅ 通过: ${passed}\n`;
    content += `   • ❌ 失败: ${failed}\n`;
    content += `   • 📈 成功率: ${successRate}%\n\n`;
    
    content += `⚙️ 系统配置:\n`;
    content += `   • API端点: ${this.csqaq.baseUrl}\n`;
    content += `   • 令牌状态: ${this.csqaq.token ? '已配置 ✅' : '未配置 ❌'}\n`;
    content += `   • 测试时间: ${timestamp}\n\n`;

    if (failed > 0) {
      content += `❌ 失败的测试:\n`;
      details
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          content += `   • ${test.name}: ${test.error}\n`;
        });
      content += `\n`;
    }

    content += `📋 详细结果:\n`;
    details.forEach(test => {
      const emoji = test.status === 'PASSED' ? '✅' : '❌';
      content += `   ${emoji} ${test.name}\n`;
    });

    // 添加状态总结
    if (failed === 0) {
      content += `\n🎉 所有测试通过！系统运行正常。`;
    } else {
      content += `\n⚠️ 部分测试失败，请检查系统配置。`;
    }

    try {
      const result = await this.wxpusher.sendMessage({
        content: content,
        summary: `API测试完成 - 成功率${successRate}%`,
        contentType: 1 // 文本消息
      });
      
      console.log('测试结果通知发送成功:', result);
      return result;
    } catch (error) {
      console.error('发送测试结果通知失败:', error.message);
      throw error;
    }
  }

  async sendApiConnectionError(error) {
    const content = `❌ CS2饰品监控系统 - API连接失败\n\n`
      + `🔗 API端点: ${this.csqaq.baseUrl}\n`
      + `⏰ 错误时间: ${new Date().toLocaleString('zh-CN')}\n`
      + `💥 错误信息: ${error.message}\n\n`
      + `请检查:\n`
      + `   • API令牌是否正确\n`
      + `   • 白名单IP是否配置\n`
      + `   • 网络连接是否正常`;

    try {
      const result = await this.wxpusher.sendMessage({
        content: content,
        summary: 'API连接失败',
        contentType: 1
      });
      
      console.log('API错误通知发送成功:', result);
      return result;
    } catch (notifyError) {
      console.error('发送API错误通知失败:', notifyError.message);
      throw notifyError;
    }
  }

  async sendSystemStartupMessage() {
    const content = `🚀 CS2饰品监控系统启动\n\n`
      + `⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}\n`
      + `🔗 API端点: ${this.csqaq.baseUrl}\n`
      + `🔑 令牌状态: ${this.csqaq.token ? '已配置 ✅' : '未配置 ❌'}\n`
      + `📱 通知系统: WXpusher已就绪 ✅`;

    try {
      const result = await this.wxpusher.sendMessage({
        content: content,
        summary: '监控系统启动',
        contentType: 1
      });
      
      console.log('系统启动通知发送成功:', result);
      return result;
    } catch (error) {
      console.error('发送启动通知失败:', error.message);
      throw error;
    }
  }
}

// 如果直接运行此脚本，执行测试并发送结果
if (require.main === module) {
  const notifier = new TestResultsNotifier();
  
  // 模拟测试结果
  const mockTestResults = {
    total: 5,
    passed: 4,
    failed: 1,
    details: [
      { name: 'API连接测试', status: 'PASSED', result: '连接成功' },
      { name: '用户信息获取', status: 'PASSED', result: '获取成功' },
      { name: '市场数据获取', status: 'PASSED', result: '数据正常' },
      { name: '价格历史数据', status: 'FAILED', error: 'API响应超时' },
      { name: '速率限制测试', status: 'PASSED', result: '限制正常' }
    ]
  };

  notifier.sendTestResults(mockTestResults)
    .then(() => {
      console.log('测试结果通知发送完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('发送通知失败:', error);
      process.exit(1);
    });
}

module.exports = TestResultsNotifier;