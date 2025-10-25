const axios = require('axios');
const config = require('../../config/config.json');

class CSQAQApi {
  constructor() {
    this.baseUrl = config.api.csqaq.baseUrl || 'https://api.csqaq.com';
    this.token = config.api.csqaq.token;
    this.endpoint = config.api.csqaq.endpoint || '/api/v1/goods/get_all_goods_info';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'ApiToken': this.token,  // 使用正确的ApiToken header
        'Content-Type': 'application/json',
        'User-Agent': 'CS2-Price-Monitor/1.0.0',
        'Referer': 'https://csqaq.com/',
        'Origin': 'https://csqaq.com'
      }
    });

    // 添加请求拦截器用于速率限制
    this.lastRequestTime = 0;
    this.minRequestInterval = 1000; // CSQAQ API限制：1请求/秒
    this.client.interceptors.request.use(async (config) => {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.minRequestInterval) {
        const waitTime = this.minRequestInterval - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      this.lastRequestTime = Date.now();
      return config;
    });
  }

  /**
   * 测试API连接
   * @returns {Promise<Object>}
   */
  async testConnection() {
    try {
      console.log('🔍 测试CSQAQ API连接...');
      console.log(`API端点: ${this.baseUrl}${this.endpoint}`);
      console.log(`Token: ${this.token.substring(0, 10)}...`);
      
      // 使用正确的端点进行测试
      const response = await this.client.post(this.endpoint, {
        limit: 1,
        page: 1
      });
      
      console.log('✅ API测试成功');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ API测试失败:', error.message);
      if (error.response) {
        console.error('响应状态:', error.response.status);
        console.error('响应数据:', error.response.data);
      }
      return {
        success: false,
        error: error.message
      };
    }
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
      const response = await this.client.post('/monitor/rank', {
        ...params,
        token: this.token  // 某些端点可能需要token在body中
      });
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
      const response = await this.client.post('/info/get_rank_list', {
        ...params,
        token: this.token
      });
      return response.data;
    } catch (error) {
      console.error('获取排行榜列表失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取单件饰品数据 - 使用正确的端点
   * @param {number} itemId - 饰品ID
   * @param {string} platform - 平台 (youyoupin, buff, steam)
   * @returns {Promise<Object>}
   */
  async getItemData(itemId, platform = 'steam') {
    try {
      // 首先尝试从批量API获取数据
      const batchResponse = await this.client.post(this.endpoint, {
        item_ids: [itemId],
        limit: 1,
        page: 1
      });
      
      if (batchResponse.data && batchResponse.data.data && batchResponse.data.data.length > 0) {
        return batchResponse.data.data.find(item => item.id == itemId) || batchResponse.data.data[0];
      }
      
      // 如果批量API失败，回退到旧方法
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
      // 使用正确的批量API端点
      const response = await this.client.post(this.endpoint, {
        item_ids: itemIds,
        limit: itemIds.length,
        page: 1
      });
      return response.data;
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