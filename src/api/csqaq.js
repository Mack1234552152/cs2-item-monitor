const axios = require('axios');
const config = require('../../config/config.json');

class CSQAQApi {
  constructor() {
    this.baseUrl = config.api.csqaq.baseUrl || 'https://csqaq.com/proxies/api/v1';
    this.token = config.api.csqaq.token;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CS2-Price-Monitor/1.0.0',
        'Referer': 'https://csqaq.com/',
        'Origin': 'https://csqaq.com'
      }
    });
  }

  /**
   * 获取当前用户信息
   * @returns {Promise<Object>}
   */
  async getCurrentUser() {
    try {
      const response = await this.client.get('/currentUser');
      return response.data;
    } catch (error) {
      console.error('获取当前用户信息失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取当前市场数据（大盘指数）
   * @returns {Promise<Object>}
   */
  async getCurrentData() {
    try {
      const response = await this.client.get('/current_data');
      return response.data;
    } catch (error) {
      console.error('获取当前市场数据失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取子数据（价格走势图表数据）
   * @param {number} id - 数据ID
   * @param {string} type - 数据类型 (daily, weekly, monthly)
   * @returns {Promise<Object>}
   */
  async getSubData(id = 1, type = 'daily') {
    try {
      const response = await this.client.get('/sub_data', {
        params: { id, type }
      });
      return response.data;
    } catch (error) {
      console.error(`获取子数据失败 (ID: ${id}, 类型: ${type}):`, error.message);
      throw error;
    }
  }

  /**
   * 获取监控排行榜数据
   * @param {Object} params - 请求参数
   * @returns {Promise<Object>}
   */
  async getMonitorRank(params = {}) {
    try {
      const response = await this.client.post('/monitor/rank', params);
      return response.data;
    } catch (error) {
      console.error('获取监控排行榜数据失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取排行榜列表
   * @param {Object} params - 请求参数
   * @returns {Promise<Object>}
   */
  async getRankList(params = {}) {
    try {
      const response = await this.client.post('/info/get_rank_list', params);
      return response.data;
    } catch (error) {
      console.error('获取排行榜列表失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取单件饰品数据
   * @param {number} itemId - 饰品ID
   * @param {string} platform - 平台 (youyoupin, buff, steam)
   * @returns {Promise<Object>}
   */
  async getItemData(itemId, platform = 'steam') {
    try {
      // 使用实际可用的API端点获取数据
      const response = await this.getSubData(itemId, 'daily');
      return response;
    } catch (error) {
      console.error(`获取饰品数据失败 (ID: ${itemId}, 平台: ${platform}):`, error.message);
      throw error;
    }
  }

  /**
   * 批量获取饰品价格数据
   * @param {Array} itemIds - 饰品ID数组
   * @param {string} platform - 平台
   * @returns {Promise<Object>}
   */
  async getBatchItemPrices(itemIds, platform = 'steam') {
    try {
      // 使用监控排行榜API来获取批量数据
      const response = await this.getMonitorRank({
        item_ids: itemIds,
        platform: platform
      });
      return response;
    } catch (error) {
      console.error(`批量获取饰品价格失败 (平台: ${platform}):`, error.message);
      throw error;
    }
  }

  /**
   * 获取单件饰品图表数据（价格历史）
   * @param {number} itemId - 饰品ID
   * @param {string} platform - 平台
   * @param {string} type - 时间类型 (daily, weekly, monthly)
   * @returns {Promise<Object>}
   */
  async getItemChartData(itemId, platform = 'steam', type = 'daily') {
    try {
      const response = await this.getSubData(itemId, type);
      return response;
    } catch (error) {
      console.error(`获取饰品图表数据失败 (ID: ${itemId}, 平台: ${platform}):`, error.message);
      throw error;
    }
  }

  /**
   * 获取成交量数据
   * @param {number} itemId - 饰品ID
   * @param {string} platform - 平台
   * @returns {Promise<Object>}
   */
  async getTransactionVolume(itemId, platform = 'steam') {
    try {
      // 通过图表数据获取成交量信息
      const response = await this.getSubData(itemId, 'daily');
      return response;
    } catch (error) {
      console.error(`获取成交量数据失败 (ID: ${itemId}, 平台: ${platform}):`, error.message);
      throw error;
    }
  }

  /**
   * 获取市场挂单详情
   * @param {number} itemId - 饰品ID
   * @param {string} platform - 平台
   * @returns {Promise<Object>}
   */
  async getMarketListings(itemId, platform = 'steam') {
    try {
      // 使用排行榜API获取市场数据
      const response = await this.getRankList({
        item_id: itemId,
        platform: platform
      });
      return response;
    } catch (error) {
      console.error(`获取市场挂单详情失败 (ID: ${itemId}, 平台: ${platform}):`, error.message);
      throw error;
    }
  }

  /**
   * 获取饰品列表
   * @param {Object} filters - 筛选条件
   * @returns {Promise<Object>}
   */
  async getItemList(filters = {}) {
    try {
      const response = await this.getRankList(filters);
      return response;
    } catch (error) {
      console.error('获取饰品列表失败:', error.message);
      throw error;
    }
  }

  /**
   * 搜索饰品
   * @param {string} keyword - 搜索关键词
   * @param {string} platform - 平台
   * @returns {Promise<Object>}
   */
  async searchItems(keyword, platform = 'steam') {
    try {
      const response = await this.getRankList({
        keyword: keyword,
        platform: platform
      });
      return response;
    } catch (error) {
      console.error(`搜索饰品失败 (关键词: ${keyword}, 平台: ${platform}):`, error.message);
      throw error;
    }
  }

  /**
   * 获取热门系列饰品列表
   * @param {string} series - 系列名称
   * @param {string} platform - 平台
   * @returns {Promise<Object>}
   */
  async getPopularSeriesItems(series, platform = 'steam') {
    try {
      const response = await this.getRankList({
        series: series,
        platform: platform
      });
      return response;
    } catch (error) {
      console.error(`获取热门系列饰品失败 (系列: ${series}, 平台: ${platform}):`, error.message);
      throw error;
    }
  }

  /**
   * 计算历史最低价
   * @param {Array} priceHistory - 价格历史数据
   * @returns {number}
   */
  calculateHistoricalLow(priceHistory) {
    if (!priceHistory || priceHistory.length === 0) {
      return null;
    }
    return Math.min(...priceHistory.map(item => item.price || item.value || item));
  }

  /**
   * 计算当前最低售价
   * @param {Object} marketData - 市场数据
   * @returns {number}
   */
  getCurrentLowestPrice(marketData) {
    if (!marketData || !marketData.data || !Array.isArray(marketData.data)) {
      return null;
    }
    
    const prices = marketData.data.map(item => {
      return item.price || item.current_price || item.value;
    }).filter(price => price && price > 0);
    
    return prices.length > 0 ? Math.min(...prices) : null;
  }

  /**
   * 检查API连接状态
   * @returns {Promise<boolean>}
   */
  async checkConnection() {
    try {
      await this.getCurrentData();
      return true;
    } catch (error) {
      console.error('API连接检查失败:', error.message);
      return false;
    }
  }
}

module.exports = CSQAQApi;