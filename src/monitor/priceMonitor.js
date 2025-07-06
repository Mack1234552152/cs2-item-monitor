const CSQAQApi = require('../api/csqaq');
const WXPusher = require('../notification/wxpusher');
const DataManager = require('../storage/dataManager');
const config = require('../../config/config.json');
const itemsConfig = require('../../config/items.json');

class PriceMonitor {
  constructor() {
    this.api = new CSQAQApi();
    this.notifier = new WXPusher();
    this.dataManager = new DataManager();
    this.config = config.monitor;
    this.isRunning = false;
    this.retryCount = {};
  }

  /**
   * 启动监控
   */
  async start() {
    if (this.isRunning) {
      console.log('监控已在运行中');
      return;
    }

    this.isRunning = true;
    console.log('🚀 CS2饰品价格监控启动');
    
    try {
      await this.notifier.sendSystemNotification('监控系统启动', 'info');
    } catch (error) {
      console.error('发送启动通知失败:', error.message);
    }

    // 立即执行一次监控
    await this.monitorPrices();
  }

  /**
   * 停止监控
   */
  async stop() {
    this.isRunning = false;
    console.log('⏹️ CS2饰品价格监控停止');
    
    try {
      await this.notifier.sendSystemNotification('监控系统停止', 'info');
    } catch (error) {
      console.error('发送停止通知失败:', error.message);
    }
  }

  /**
   * 监控所有配置的饰品价格
   */
  async monitorPrices() {
    if (!this.isRunning) return;

    console.log(`🔍 开始监控价格 - ${new Date().toLocaleString('zh-CN')}`);
    
    const enabledItems = itemsConfig.items.filter(item => item.enabled);
    let successCount = 0;
    let alertCount = 0;

    for (const item of enabledItems) {
      try {
        const alerts = await this.monitorItemPrice(item);
        alertCount += alerts.length;
        successCount++;
      } catch (error) {
        console.error(`监控饰品失败 [${item.name}]:`, error.message);
        await this.handleError(item, error);
      }

      // 添加延迟避免API限制
      await this.sleep(1000);
    }

    console.log(`✅ 监控完成 - 成功: ${successCount}/${enabledItems.length}, 预警: ${alertCount}`);

    // 处理未通知的预警
    await this.processUnnotifiedAlerts();
  }

  /**
   * 监控单个饰品价格
   * @param {Object} item - 饰品配置
   * @returns {Promise<Array>} 生成的预警数组
   */
  async monitorItemPrice(item) {
    const alerts = [];

    for (const platform of item.platforms) {
      try {
        const alert = await this.checkItemPriceOnPlatform(item, platform);
        if (alert) {
          alerts.push(alert);
        }
      } catch (error) {
        console.error(`监控饰品平台失败 [${item.name} - ${platform}]:`, error.message);
      }
    }

    return alerts;
  }

  /**
   * 检查单个饰品在特定平台的价格
   * @param {Object} item - 饰品配置
   * @param {string} platform - 平台名称
   * @returns {Promise<Object|null>} 预警对象或null
   */
  async checkItemPriceOnPlatform(item, platform) {
    try {
      // 获取当前价格数据
      const itemData = await this.api.getItemData(item.id, platform);
      
      if (!itemData || !itemData.data) {
        console.warn(`无法获取饰品数据 [${item.name} - ${platform}]`);
        return null;
      }

      const currentPrice = this.extractCurrentPrice(itemData.data, platform);
      if (!currentPrice) {
        console.warn(`无法提取当前价格 [${item.name} - ${platform}]`);
        return null;
      }

      // 保存价格历史
      await this.dataManager.savePriceHistory(item.id, platform, {
        price: currentPrice,
        volume: itemData.data.volume || 0,
        listings: itemData.data.listings || 0,
        source: 'csqaq_api'
      });

      // 获取历史最低价
      const historicalLow = await this.dataManager.getHistoricalLow(item.id, platform);
      
      if (!historicalLow) {
        console.log(`首次记录价格 [${item.name} - ${platform}]: ¥${currentPrice}`);
        return null;
      }

      // 检查是否触发价格预警
      const threshold = item.notify_threshold || this.config.priceThreshold;
      const priceRatio = currentPrice / historicalLow;

      if (priceRatio <= threshold) {
        const discount = 1 - priceRatio;
        console.log(`🚨 价格预警触发 [${item.name} - ${platform}]: 当前¥${currentPrice}, 历史最低¥${historicalLow}, 折扣${(discount * 100).toFixed(1)}%`);

        // 创建预警记录
        const alert = await this.dataManager.saveAlert({
          itemId: item.id,
          itemName: item.name,
          platform: platform,
          currentPrice: currentPrice,
          historicalLow: historicalLow,
          discount: discount
        });

        return alert;
      }

      console.log(`✓ 价格正常 [${item.name} - ${platform}]: ¥${currentPrice} (历史最低: ¥${historicalLow})`);
      return null;

    } catch (error) {
      console.error(`检查价格失败 [${item.name} - ${platform}]:`, error.message);
      throw error;
    }
  }

  /**
   * 从API数据中提取当前价格
   * @param {Object} data - API返回的数据
   * @param {string} platform - 平台名称
   * @returns {number|null}
   */
  extractCurrentPrice(data, platform) {
    // 根据不同平台的数据结构提取价格
    switch (platform) {
      case 'steam':
        return data.steam_price || data.lowest_price || data.price;
      case 'buff':
        return data.buff_price || data.sell_min_price || data.price;
      case 'youyoupin':
        return data.youyoupin_price || data.min_price || data.price;
      default:
        return data.price || data.current_price || data.lowest_price;
    }
  }

  /**
   * 处理未通知的预警
   */
  async processUnnotifiedAlerts() {
    try {
      const unnotifiedAlerts = await this.dataManager.getUnnotifiedAlerts();
      
      if (unnotifiedAlerts.length === 0) {
        return;
      }

      console.log(`📬 处理 ${unnotifiedAlerts.length} 条未通知的预警`);

      for (const alert of unnotifiedAlerts) {
        try {
          await this.sendPriceAlert(alert);
          await this.dataManager.markAlertAsNotified(alert.id);
          console.log(`✅ 预警通知已发送 [${alert.itemName} - ${alert.platform}]`);
          
          // 添加延迟避免通知过于频繁
          await this.sleep(2000);
        } catch (error) {
          console.error(`发送预警通知失败 [${alert.itemName}]:`, error.message);
        }
      }
    } catch (error) {
      console.error('处理未通知预警失败:', error.message);
    }
  }

  /**
   * 发送价格预警通知
   * @param {Object} alert - 预警数据
   */
  async sendPriceAlert(alert) {
    const alertData = {
      itemName: alert.itemName,
      platform: this.getPlatformDisplayName(alert.platform),
      currentPrice: alert.currentPrice,
      historicalLow: alert.historicalLow,
      discount: alert.discount,
      url: this.generateItemUrl(alert.itemId, alert.platform)
    };

    await this.notifier.sendPriceAlert(alertData);
  }

  /**
   * 获取平台显示名称
   * @param {string} platform - 平台代码
   * @returns {string}
   */
  getPlatformDisplayName(platform) {
    const displayNames = {
      'steam': 'Steam市场',
      'buff': 'BUFF饰品',
      'youyoupin': '悠悠有品'
    };
    return displayNames[platform] || platform;
  }

  /**
   * 生成饰品链接
   * @param {number} itemId - 饰品ID
   * @param {string} platform - 平台
   * @returns {string}
   */
  generateItemUrl(itemId, platform) {
    const baseUrls = {
      'steam': 'https://steamcommunity.com/market/listings/730/',
      'buff': 'https://buff.163.com/goods/',
      'youyoupin': 'https://www.youyoupin.com/goods/'
    };
    
    const baseUrl = baseUrls[platform];
    return baseUrl ? `${baseUrl}${itemId}` : null;
  }

  /**
   * 错误处理
   * @param {Object} item - 饰品配置
   * @param {Error} error - 错误对象
   */
  async handleError(item, error) {
    const itemKey = `${item.id}_error`;
    
    if (!this.retryCount[itemKey]) {
      this.retryCount[itemKey] = 0;
    }
    
    this.retryCount[itemKey]++;
    
    if (this.retryCount[itemKey] >= this.config.retryAttempts) {
      console.error(`⚠️ 饰品监控失败次数过多，暂时跳过 [${item.name}]`);
      
      try {
        await this.notifier.sendSystemNotification(
          `饰品 ${item.name} 监控失败次数过多，已暂时跳过`, 
          'warning'
        );
      } catch (notifyError) {
        console.error('发送错误通知失败:', notifyError.message);
      }
      
      // 重置重试计数，下次循环重新开始
      delete this.retryCount[itemKey];
    } else {
      console.log(`🔄 将在下次监控时重试 [${item.name}] (${this.retryCount[itemKey]}/${this.config.retryAttempts})`);
    }
  }

  /**
   * 生成日报
   */
  async generateDailyReport() {
    try {
      const stats = await this.dataManager.getStatistics();
      
      // 获取今日最佳交易
      const today = new Date().toDateString();
      const todayAlerts = (await this.dataManager.loadData()).alerts.filter(alert =>
        new Date(alert.timestamp).toDateString() === today
      );
      
      const topDeals = todayAlerts
        .sort((a, b) => b.discount - a.discount)
        .slice(0, 5);

      const reportData = {
        monitoredItems: stats.monitoredItems,
        alerts: stats.todayAlerts,
        topDeals: topDeals
      };

      await this.notifier.sendDailyReport(reportData);
      console.log('📊 日报已发送');
    } catch (error) {
      console.error('生成日报失败:', error.message);
    }
  }

  /**
   * 执行数据清理
   */
  async performMaintenance() {
    try {
      console.log('🧹 执行系统维护...');
      
      // 数据清理
      await this.dataManager.performCleanup();
      
      // 数据备份
      await this.dataManager.backupData();
      
      // 重置错误计数
      this.retryCount = {};
      
      console.log('✅ 系统维护完成');
      
      await this.notifier.sendSystemNotification('系统维护完成', 'info');
    } catch (error) {
      console.error('系统维护失败:', error.message);
      await this.notifier.sendSystemNotification(`系统维护失败: ${error.message}`, 'error');
    }
  }

  /**
   * 获取监控状态
   * @returns {Object}
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      monitoredItems: itemsConfig.items.filter(item => item.enabled).length,
      retryCount: Object.keys(this.retryCount).length,
      lastCheck: new Date().toISOString()
    };
  }

  /**
   * 延迟函数
   * @param {number} ms - 毫秒数
   * @returns {Promise}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = PriceMonitor;