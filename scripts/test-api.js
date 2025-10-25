const CSQAQApi = require('../src/api/csqaq');

class APITester {
  constructor() {
    this.api = new CSQAQApi();
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }

  async runTest(testName, testFunction) {
    this.testResults.total++;
    console.log(`\n🧪 ${testName}...`);
    
    try {
      const result = await testFunction();
      this.testResults.passed++;
      this.testResults.details.push({ name: testName, status: 'PASSED', result });
      console.log(`✅ ${testName} - 成功`);
      return result;
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({ name: testName, status: 'FAILED', error: error.message });
      console.log(`❌ ${testName} - 失败: ${error.message}`);
      throw error;
    }
  }

  async testAPIConnection() {
    return await this.runTest('API连接测试', async () => {
      const isConnected = await this.api.checkConnection();
      if (!isConnected) {
        throw new Error('API连接失败');
      }
      return isConnected;
    });
  }

  async testUserInfo() {
    return await this.runTest('用户信息获取', async () => {
      const userInfo = await this.api.getCurrentUser();
      if (!userInfo) {
        throw new Error('用户信息为空');
      }
      return userInfo;
    });
  }

  async testMarketData() {
    return await this.runTest('市场数据获取', async () => {
      const marketData = await this.api.getCurrentData();
      if (!marketData) {
        throw new Error('市场数据为空');
      }
      return marketData;
    });
  }

  async testPriceHistory() {
    return await this.runTest('价格历史数据', async () => {
      const chartData = await this.api.getSubData(1, 'daily');
      if (!chartData) {
        throw new Error('价格历史数据为空');
      }
      return chartData;
    });
  }

  async testRateLimiting() {
    return await this.runTest('速率限制测试', async () => {
      const startTime = Date.now();
      await Promise.all([
        this.api.getCurrentData(),
        this.api.getCurrentData()
      ]);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // 应该至少有1秒间隔（速率限制）
      if (duration < 1000) {
        throw new Error(`速率限制可能未生效，执行时间: ${duration}ms`);
      }
      
      return { duration, rateLimitWorking: true };
    });
  }

  async runAllTests() {
    console.log('🚀 开始CSQAQ API集成测试...\n');
    console.log('📋 测试配置:');
    console.log(`   - API端点: ${this.api.baseUrl}`);
    console.log(`   - 令牌状态: ${this.api.token ? '已配置' : '未配置'}`);
    console.log(`   - 测试时间: ${new Date().toISOString()}\n`);

    try {
      // 运行所有测试
      await this.testAPIConnection();
      await this.testUserInfo();
      await this.testMarketData();
      await this.testPriceHistory();
      await this.testRateLimiting();

      // 输出测试结果
      console.log('\n📊 测试结果统计:');
      console.log(`   - 总测试数: ${this.testResults.total}`);
      console.log(`   - 通过: ${this.testResults.passed}`);
      console.log(`   - 失败: ${this.testResults.failed}`);
      console.log(`   - 成功率: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);

      if (this.testResults.failed === 0) {
        console.log('\n🎉 所有测试通过！API集成配置正确。');
        process.exit(0);
      } else {
        console.log('\n⚠️ 部分测试失败，请检查配置。');
        process.exit(1);
      }

    } catch (error) {
      console.log('\n💥 测试过程中发生严重错误:', error.message);
      process.exit(1);
    }
  }
}

// 运行测试
const tester = new APITester();
tester.runAllTests().catch(console.error);