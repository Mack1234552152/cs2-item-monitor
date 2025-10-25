const CSQAQApi = require('./src/api/csqaq');

async function testAPI() {
  console.log('🔄 开始测试CSQAQ API连接...\n');
  
  const api = new CSQAQApi();
  
  try {
    // 测试1: 检查API连接
    console.log('📡 测试API连接状态...');
    const isConnected = await api.checkConnection();
    console.log(`连接状态: ${isConnected ? '✅ 成功' : '❌ 失败'}\n`);
    
    // 测试2: 获取当前用户信息
    console.log('👤 获取用户信息...');
    try {
      const userInfo = await api.getCurrentUser();
      console.log('✅ 用户信息获取成功');
      console.log('用户数据:', JSON.stringify(userInfo, null, 2));
    } catch (error) {
      console.log('❌ 用户信息获取失败:', error.message);
    }
    
    // 测试3: 获取当前市场数据
    console.log('\n📊 获取市场数据...');
    try {
      const marketData = await api.getCurrentData();
      console.log('✅ 市场数据获取成功');
      console.log('市场数据:', JSON.stringify(marketData, null, 2));
    } catch (error) {
      console.log('❌ 市场数据获取失败:', error.message);
    }
    
    // 测试4: 获取子数据（价格走势）
    console.log('\n📈 获取价格走势数据...');
    try {
      const chartData = await api.getSubData(1, 'daily');
      console.log('✅ 价格走势数据获取成功');
      console.log('图表数据:', JSON.stringify(chartData, null, 2));
    } catch (error) {
      console.log('❌ 价格走势数据获取失败:', error.message);
    }
    
    console.log('\n🎉 API测试完成！');
    console.log('📝 测试总结:');
    console.log('- API端点: https://api.csqaq.com/api/v1');
    console.log('- 认证令牌: JOVN71P7T388E2N1G1H6W5A0');
    console.log('- 白名单IP: 111.19.113.82');
    console.log('- 速率限制: 1请求/秒');
    
  } catch (error) {
    console.error('❌ API测试失败:', error.message);
    console.error('错误详情:', error);
  }
}

// 运行测试
testAPI().catch(console.error);