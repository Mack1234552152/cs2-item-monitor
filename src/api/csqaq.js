const axios = require('axios');
const config = require('../../config/config.json');

class CSQAQApi {
  constructor() {
    this.baseUrl = config.api.csqaq.baseUrl;
    this.token = config.api.csqaq.token;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * 获取单件饰品数据
   * @param {number} itemId - 饰品ID
   * @param {string} platform - 平台 (youyoupin, buff, steam)
   * @returns {Promise<Object>}
   */
  async getItemData(itemId, platform = 'steam') {
    try {
      const response = await this.client.get(`/item/${itemId}`, {
        params: {
          platform: platform,
          token: this.token
        }
      });
      return response.data;
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
      const response = await this.client.post('/items/batch-prices', {
        item_ids: itemIds,
        platform: platform,
        token: this.token
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
   * @param {number} days - 历史天数
   * @returns {Promise<Object>}
   */
  async getItemChartData(itemId, platform = 'steam', days = 30) {
    try {
      const response = await this.client.get(`/item/${itemId}/chart`, {
        params: {
          platform: platform,
          days: days,
          token: this.token
        }
      });
      return response.data;
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
      const response = await this.client.get(`/item/${itemId}/volume`, {
        params: {
          platform: platform,
          token: this.token
        }
      });
      return response.data;
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
      const response = await this.client.get(`/market/${itemId}/listings`, {
        params: {
          platform: platform,
          token: this.token
        }
      });
      return response.data;
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
      const response = await this.client.get('/items', {
        params: {
          ...filters,
          token: this.token
        }
      });
      return response.data;
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
      const response = await this.client.get('/items/search', {
        params: {
          keyword: keyword,
          platform: platform,
          token: this.token
        }
      });
      return response.data;
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
      const response = await this.client.get(`/items/series/${series}`, {
        params: {
          platform: platform,
          token: this.token
        }
      });
      return response.data;
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
    return Math.min(...priceHistory.map(item => item.price));
  }

  /**
   * 计算当前最低售价
   * @param {Object} marketData - 市场数据
   * @returns {number}
   */
  getCurrentLowestPrice(marketData) {
    if (!marketData || !marketData.listings || marketData.listings.length === 0) {
      return null;
    }
    return Math.min(...marketData.listings.map(listing => listing.price));
  }
}

module.exports = CSQAQApi;