const WXPusher = require('../src/notification/wxpusher');
const config = require('../../config/config.json');

class WXPusherTester {
  constructor() {
    this.notifier = new WXPusher();
  }

  async testWXpusher() {
    console.log('🧪 开始测试WXpusher集成...');
    console.log('📋 配置信息:');
    console.log(`   - AppToken: ${config.notification.wxpusher.appToken}`);
    console.log(`   - BaseUrl: ${config.notification.wxpusher.baseUrl}`);
    console.log(`   - 是否为空: ${!config.notification.wxpusher.appToken}`);

    if (!config.notification.wxpusher.appToken) {
      console.log('❌ WXpusher AppToken未配置，无法测试');
      return false;
    }

    try {
      // 测试1: 发送简单文本消息
      console.log('📤 测试1: 发送简单文本消息...');
      const testMessage = '🧪 这是一条测试消息，用于验证WXpusher集成是否正常工作。时间: ' + new Date().toISOString();
      
      const result1 = await this.notifier.sendMessage({
        content: testMessage,
        summary: 'WXpusher集成测试'
      });
      
      console.log('✅ 简单消息发送结果:', result1);
      
      // 测试2: 发送价格预警格式消息
      console.log('📤 测试2: 发送价格预警格式消息...');
      const alertData = {
        itemName: 'AK-47 | 红线 (测试)',
        platform: 'Steam',
        currentPrice: 158.50,
        historicalLow: 145.30,
        discount: 0.08,
        url: 'https://example.com/test'
      };
      
      const result2 = await this.notifier.sendPriceAlert(alertData);
      console.log('✅ 价格预警消息发送结果:', result2);
      
      // 测试3: 获取应用信息
      console.log('📤 测试3: 获取应用信息...');
      const appInfo = await this.notifier.getAppInfo();
      console.log('✅ 应用信息获取结果:', appInfo);
      
      // 测试4: 获取用户列表
      console.log('📤 测试4: 获取用户列表...');
      const userList = await this.notifier.getAppUsers();
      console.log('✅ 用户列表获取结果:', userList);
      
      console.log('🎉 WXpusher集成测试完成！');
      console.log('📊 测试总结:');
      console.log(`   - 简单消息: ${result1 ? '成功' : '失败'}`);
      console.log(`   - 价格预警: ${result2 ? '成功' : '失败'}`);
      console.log(`   - 应用信息: ${appInfo ? '成功' : '失败'}`);
      console.log(`   - 用户列表: ${userList && userList.data ? '成功' : '失败'}`);
      
      return {
        simpleMessage: result1 ? 'success' : 'failed',
        priceAlert: result2 ? 'success' : 'failed',
        appInfo: appInfo ? 'success' : 'failed',
        userList: userList && userList.data ? 'success' : 'failed',
        results: [result1, result2, appInfo, userList]
      };
      
    } catch (error) {
      console.error('❌ WXpusher测试失败:', error.message);
      return {
        error: error.message,
        simpleMessage: 'failed',
        priceAlert: 'failed',
        appInfo: 'failed',
        userList: 'failed'
      };
    }
  }
}

// 运行测试
if (require.main === module) {
  const tester = new WXPusherTester();
  tester.testWXpusher().then(results => {
    console.log('\n🎯 最终测试结果:');
    console.log('============================');
    Object.keys(results).forEach(key => {
      console.log(`${key}: ${results[key]}`);
    });
    console.log('============================');
    
    // 如果所有测试都成功，发送一条确认消息
    if (results.simpleMessage === 'success' && results.priceAlert === 'success') {
      console.log('📱 发送确认消息到您的微信...');
      tester.notifier.sendMessage({
        content: '🎉 WXpusher集成测试成功！所有功能都已正常工作，您现在应该收到多条测试消息。',
        summary: 'WXpusher集成测试完成'
      }).then(() => {
        console.log('✅ 确认消息发送完成');
      }).catch(err => {
        console.log('❌ 确认消息发送失败:', err.message);
      });
    } else {
      console.log('❌ 部分测试失败，请检查配置');
    }
  }).catch(error => {
    console.error('❌ 测试执行失败:', error.message);
  });
}

module.exports = WXPusherTester;