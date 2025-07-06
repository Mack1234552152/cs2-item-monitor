const fs = require('fs').promises;
const path = require('path');
const config = require('../../config/config.json');

class DataManager {
  constructor() {
    this.dataPath = path.resolve(__dirname, '../../', config.storage.dataPath);
    this.maxHistoryDays = config.storage.maxHistoryDays;
    this.ensureDataFile();
  }

  /**
   * 确保数据文件存在
   */
  async ensureDataFile() {
    try {
      await fs.access(this.dataPath);
    } catch (error) {
      // 文件不存在，创建初始数据结构
      const initialData = {
        items: {},
        alerts: [],
        statistics: {
          totalAlerts: 0,
          lastUpdate: null,
          monitorStartTime: new Date().toISOString()
        },
        metadata: {
          version: "1.0.0",
          lastCleanup: new Date().toISOString()
        }
      };
      await this.saveData(initialData);
      console.log('数据文件已创建:', this.dataPath);
    }
  }

  /**
   * 加载数据
   * @returns {Promise<Object>}
   */
  async loadData() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('加载数据失败:', error.message);
      throw error;
    }
  }

  /**
   * 保存数据
   * @param {Object} data - 要保存的数据
   * @returns {Promise<void>}
   */
  async saveData(data) {
    try {
      // 确保目录存在
      await fs.mkdir(path.dirname(this.dataPath), { recursive: true });
      await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.error('保存数据失败:', error.message);
      throw error;
    }
  }

  /**
   * 保存饰品价格历史
   * @param {number} itemId - 饰品ID
   * @param {string} platform - 平台
   * @param {Object} priceData - 价格数据
   * @returns {Promise<void>}
   */
  async savePriceHistory(itemId, platform, priceData) {
    const data = await this.loadData();
    const itemKey = `${itemId}_${platform}`;
    
    if (!data.items[itemKey]) {
      data.items[itemKey] = {
        id: itemId,
        platform: platform,
        priceHistory: [],
        alerts: [],
        lastUpdate: null,
        historicalLow: null,
        historicalHigh: null
      };
    }

    const now = new Date().toISOString();
    const newPriceEntry = {
      timestamp: now,
      price: priceData.price,
      volume: priceData.volume || 0,
      listings: priceData.listings || 0,
      source: priceData.source || 'api'
    };

    data.items[itemKey].priceHistory.push(newPriceEntry);
    data.items[itemKey].lastUpdate = now;

    // 更新历史最高最低价
    const currentPrice = priceData.price;
    if (!data.items[itemKey].historicalLow || currentPrice < data.items[itemKey].historicalLow) {
      data.items[itemKey].historicalLow = currentPrice;
    }
    if (!data.items[itemKey].historicalHigh || currentPrice > data.items[itemKey].historicalHigh) {
      data.items[itemKey].historicalHigh = currentPrice;
    }

    // 清理过期数据
    data.items[itemKey].priceHistory = this.cleanupOldData(
      data.items[itemKey].priceHistory,
      this.maxHistoryDays
    );

    data.statistics.lastUpdate = now;
    await this.saveData(data);
  }

  /**
   * 获取饰品价格历史
   * @param {number} itemId - 饰品ID
   * @param {string} platform - 平台
   * @param {number} days - 获取天数
   * @returns {Promise<Array>}
   */
  async getPriceHistory(itemId, platform, days = 7) {
    const data = await this.loadData();
    const itemKey = `${itemId}_${platform}`;
    
    if (!data.items[itemKey]) {
      return [];
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return data.items[itemKey].priceHistory.filter(entry => 
      new Date(entry.timestamp) >= cutoffDate
    );
  }

  /**
   * 获取历史最低价
   * @param {number} itemId - 饰品ID
   * @param {string} platform - 平台
   * @param {number} days - 历史天数，默认所有历史
   * @returns {Promise<number|null>}
   */
  async getHistoricalLow(itemId, platform, days = null) {
    const data = await this.loadData();
    const itemKey = `${itemId}_${platform}`;
    
    if (!data.items[itemKey]) {
      return null;
    }

    // 如果指定了天数，计算指定期间的最低价
    if (days !== null) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const recentHistory = data.items[itemKey].priceHistory.filter(entry => 
        new Date(entry.timestamp) >= cutoffDate
      );
      
      if (recentHistory.length === 0) {
        return null;
      }
      
      return Math.min(...recentHistory.map(entry => entry.price));
    }

    // 返回全部历史的最低价
    return data.items[itemKey].historicalLow;
  }

  /**
   * 保存价格预警记录
   * @param {Object} alertData - 预警数据
   * @returns {Promise<void>}
   */
  async saveAlert(alertData) {
    const data = await this.loadData();
    
    const alert = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      itemId: alertData.itemId,
      itemName: alertData.itemName,
      platform: alertData.platform,
      currentPrice: alertData.currentPrice,
      historicalLow: alertData.historicalLow,
      discount: alertData.discount,
      triggered: true,
      notified: false
    };

    data.alerts.push(alert);
    data.statistics.totalAlerts++;

    // 也保存到对应饰品的预警记录中
    const itemKey = `${alertData.itemId}_${alertData.platform}`;
    if (data.items[itemKey]) {
      data.items[itemKey].alerts.push(alert);
    }

    data.statistics.lastUpdate = new Date().toISOString();
    await this.saveData(data);
    
    return alert;
  }

  /**
   * 获取未通知的预警
   * @returns {Promise<Array>}
   */
  async getUnnotifiedAlerts() {
    const data = await this.loadData();
    return data.alerts.filter(alert => !alert.notified);
  }

  /**
   * 标记预警为已通知
   * @param {string} alertId - 预警ID
   * @returns {Promise<void>}
   */
  async markAlertAsNotified(alertId) {
    const data = await this.loadData();
    const alert = data.alerts.find(a => a.id === alertId);
    
    if (alert) {
      alert.notified = true;
      alert.notifiedAt = new Date().toISOString();
      await this.saveData(data);
    }
  }

  /**
   * 获取统计信息
   * @returns {Promise<Object>}
   */
  async getStatistics() {
    const data = await this.loadData();
    const now = new Date();
    const today = now.toDateString();
    
    // 计算今日预警数量
    const todayAlerts = data.alerts.filter(alert => 
      new Date(alert.timestamp).toDateString() === today
    ).length;

    // 计算监控的饰品数量
    const monitoredItems = Object.keys(data.items).length;

    // 计算平均价格变化
    let totalPriceChanges = 0;
    let itemsWithHistory = 0;
    
    Object.values(data.items).forEach(item => {
      if (item.priceHistory.length > 1) {
        const latest = item.priceHistory[item.priceHistory.length - 1];
        const previous = item.priceHistory[item.priceHistory.length - 2];
        totalPriceChanges += (latest.price - previous.price) / previous.price;
        itemsWithHistory++;
      }
    });

    const avgPriceChange = itemsWithHistory > 0 ? totalPriceChanges / itemsWithHistory : 0;

    return {
      ...data.statistics,
      monitoredItems,
      todayAlerts,
      avgPriceChange: avgPriceChange * 100, // 转换为百分比
      dataSize: JSON.stringify(data).length
    };
  }

  /**
   * 清理过期数据
   * @param {Array} dataArray - 数据数组
   * @param {number} maxDays - 最大保留天数
   * @returns {Array}
   */
  cleanupOldData(dataArray, maxDays) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxDays);
    
    return dataArray.filter(item => 
      new Date(item.timestamp) >= cutoffDate
    );
  }

  /**
   * 执行数据清理
   * @returns {Promise<void>}
   */
  async performCleanup() {
    const data = await this.loadData();
    let cleaned = false;

    // 清理过期的价格历史
    Object.keys(data.items).forEach(itemKey => {
      const originalLength = data.items[itemKey].priceHistory.length;
      data.items[itemKey].priceHistory = this.cleanupOldData(
        data.items[itemKey].priceHistory,
        this.maxHistoryDays
      );
      
      if (data.items[itemKey].priceHistory.length < originalLength) {
        cleaned = true;
      }
    });

    // 清理过期的预警记录（保留最近30天）
    const originalAlertsLength = data.alerts.length;
    data.alerts = this.cleanupOldData(data.alerts, 30);
    
    if (data.alerts.length < originalAlertsLength) {
      cleaned = true;
    }

    if (cleaned) {
      data.metadata.lastCleanup = new Date().toISOString();
      await this.saveData(data);
      console.log('数据清理完成');
    }
  }

  /**
   * 导出数据
   * @param {string} format - 导出格式 (json, csv)
   * @returns {Promise<string>}
   */
  async exportData(format = 'json') {
    const data = await this.loadData();
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      // 简单的CSV导出预警数据
      let csv = 'Timestamp,ItemID,ItemName,Platform,CurrentPrice,HistoricalLow,Discount\n';
      data.alerts.forEach(alert => {
        csv += `${alert.timestamp},${alert.itemId},"${alert.itemName}",${alert.platform},${alert.currentPrice},${alert.historicalLow},${(alert.discount * 100).toFixed(2)}%\n`;
      });
      return csv;
    }
    
    throw new Error('不支持的导出格式');
  }

  /**
   * 备份数据
   * @returns {Promise<string>}
   */
  async backupData() {
    const data = await this.loadData();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = this.dataPath.replace('.json', `_backup_${timestamp}.json`);
    
    await fs.writeFile(backupPath, JSON.stringify(data, null, 2), 'utf8');
    console.log('数据备份完成:', backupPath);
    
    return backupPath;
  }
}

module.exports = DataManager;