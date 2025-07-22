const axios = require('axios');
const configManager = require('../utils/configManager');

class WXPusher {
  constructor() {
    this.config = configManager.getConfig();
    this.appToken = this.config.notification.wxpusher.appToken;
    this.baseUrl = this.config.notification.wxpusher.baseUrl;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * 检查是否启用通知
   * @returns {boolean}
   */
  isEnabled() {
    return !!(this.appToken && this.appToken !== '');
  }

  /**
   * 发送消息
   * @param {Object} messageOptions - 消息选项
   * @param {string} messageOptions.content - 消息内容
   * @param {string} messageOptions.summary - 消息摘要
   * @param {number} messageOptions.contentType - 内容类型 (1=文本, 2=html, 3=markdown)
   * @param {Array} messageOptions.uids - 用户UID数组
   * @param {Array} messageOptions.topicIds - 主题ID数组
   * @returns {Promise<Object>}
   */
  async sendMessage(messageOptions) {
    if (!this.isEnabled()) {
      console.warn('微信推送未配置，跳过通知发送');
      return { success: false, reason: 'wxpusher_not_configured' };
    }

    try {
      const defaultOptions = {
        appToken: this.appToken,
        contentType: 1, // 默认文本消息
        uids: [],
        topicIds: []
      };

      const options = { ...defaultOptions, ...messageOptions };

      // 如果没有指定UID，自动获取所有关注用户
      if (!options.uids || options.uids.length === 0) {
        const users = await this.getAppUsers();
        if (users.data && users.data.records && users.data.records.length > 0) {
          options.uids = users.data.records.map(user => user.uid);
        }
      }

      const response = await this.client.post('/api/send/message', options);
      
      if (response.data.code === 1000) {
        console.log('消息发送成功:', response.data.data);
        return response.data;
      } else {
        console.error('消息发送失败:', response.data.msg);
        throw new Error(response.data.msg);
      }
    } catch (error) {
      console.error('发送WXPusher消息失败:', error.message);
      throw error;
    }
  }

  /**
   * 发送价格预警通知
   * @param {Object} alertData - 预警数据
   * @param {string} alertData.itemName - 饰品名称
   * @param {string} alertData.platform - 平台名称
   * @param {number} alertData.currentPrice - 当前价格
   * @param {number} alertData.historicalLow - 历史最低价
   * @param {number} alertData.discount - 折扣百分比
   * @param {string} alertData.url - 链接地址
   * @returns {Promise<Object>}
   */
  async sendPriceAlert(alertData) {
    if (!this.isEnabled()) {
      console.log('价格预警:', JSON.stringify(alertData, null, 2));
      return { success: false, reason: 'wxpusher_not_configured' };
    }

    const { itemName, platform, currentPrice, historicalLow, discount, url } = alertData;
    
    const content = `🚨 CS2饰品价格预警！
    
📦 饰品名称: ${itemName}
🏪 交易平台: ${platform}
💰 当前价格: ¥${currentPrice.toFixed(2)}
📉 历史最低: ¥${historicalLow.toFixed(2)}
🎯 折扣幅度: ${(discount * 100).toFixed(1)}%
⏰ 发现时间: ${new Date().toLocaleString('zh-CN')}

${url ? `🔗 查看链接: ${url}` : ''}

⚡ 机会难得，快去抢购吧！`;

    const summary = `${itemName} 价格预警 - ${(discount * 100).toFixed(1)}%折扣`;

    return await this.sendMessage({
      content: content,
      summary: summary,
      contentType: 1 // 文本消息
    });
  }

  /**
   * 发送系统状态通知
   * @param {string} status - 状态信息
   * @param {string} level - 级别 (info, warning, error)
   * @returns {Promise<Object>}
   */
  async sendSystemNotification(status, level = 'info') {
    if (!this.isEnabled()) {
      console.log(`系统通知[${level}]:`, status);
      return { success: false, reason: 'wxpusher_not_configured' };
    }

    const emoji = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌'
    };

    const content = `${emoji[level]} CS2饰品监控系统

📊 状态更新: ${status}
⏰ 时间: ${new Date().toLocaleString('zh-CN')}`;

    const summary = `监控系统${level === 'error' ? '异常' : '状态更新'}`;

    return await this.sendMessage({
      content: content,
      summary: summary,
      contentType: 1
    });
  }

  /**
   * 发送每日监控报告
   * @param {Object} reportData - 报告数据
   * @param {number} reportData.monitoredItems - 监控饰品数量
   * @param {number} reportData.alerts - 预警次数
   * @param {Array} reportData.topDeals - 最佳交易
   * @returns {Promise<Object>}
   */
  async sendDailyReport(reportData) {
    if (!this.isEnabled()) {
      console.log('每日报告:', JSON.stringify(reportData, null, 2));
      return { success: false, reason: 'wxpusher_not_configured' };
    }

    const { monitoredItems, alerts, topDeals } = reportData;
    
    let content = `📈 CS2饰品监控日报

📦 监控饰品: ${monitoredItems} 个
🚨 触发预警: ${alerts} 次
📅 日期: ${new Date().toLocaleDateString('zh-CN')}

`;

    if (topDeals && topDeals.length > 0) {
      content += `🏆 今日最佳交易:\n`;
      topDeals.slice(0, 5).forEach((deal, index) => {
        content += `${index + 1}. ${deal.itemName} - ${(deal.discount * 100).toFixed(1)}%折扣\n`;
      });
    }

    content += `\n📊 监控系统运行正常`;

    return await this.sendMessage({
      content: content,
      summary: '饰品监控日报',
      contentType: 1
    });
  }

  /**
   * 发送Markdown格式消息
   * @param {string} markdownContent - Markdown内容
   * @param {string} summary - 消息摘要
   * @returns {Promise<Object>}
   */
  async sendMarkdownMessage(markdownContent, summary) {
    if (!this.isEnabled()) {
      console.log('Markdown消息:', { summary, markdownContent });
      return { success: false, reason: 'wxpusher_not_configured' };
    }

    return await this.sendMessage({
      content: markdownContent,
      summary: summary,
      contentType: 3 // Markdown消息
    });
  }

  /**
   * 获取应用信息
   * @returns {Promise<Object>}
   */
  async getAppInfo() {
    if (!this.isEnabled()) {
      throw new Error('微信推送未配置');
    }

    try {
      const response = await this.client.get(`/api/fun/app/${this.appToken}`);
      return response.data;
    } catch (error) {
      console.error('获取应用信息失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取应用用户列表
   * @param {number} page - 页码
   * @param {number} pageSize - 每页大小
   * @returns {Promise<Object>}
   */
  async getAppUsers(page = 1, pageSize = 100) {
    if (!this.isEnabled()) {
      return { data: { records: [] } };
    }

    try {
      const response = await this.client.get('/api/fun/wxuser', {
        params: {
          appToken: this.appToken,
          page: page,
          pageSize: pageSize
        }
      });
      return response.data;
    } catch (error) {
      console.error('获取应用用户列表失败:', error.message);
      throw error;
    }
  }
}

module.exports = WXPusher;