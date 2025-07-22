const fs = require('fs');
const path = require('path');

class ConfigManager {
  constructor() {
    this.configPath = path.join(__dirname, '../../config/config.json');
    this.exampleConfigPath = path.join(__dirname, '../../config/config.example.json');
  }

  /**
   * 获取配置，支持环境变量和文件两种方式
   * @returns {Object} 配置对象
   */
  getConfig() {
    // 优先使用环境变量配置（用于GitHub Actions）
    if (process.env.GITHUB_ACTIONS === 'true') {
      return {
        api: {
          csqaq: {
            baseUrl: "https://csqaq.com/proxies/api/v1",
            token: process.env.CSQAQ_TOKEN || "JOVN71P7T388E2N1G1H6W5A0",
            whitelist_ip: process.env.CSQAQ_WHITELIST_IP || ""
          }
        },
        notification: {
          wxpusher: {
            appToken: process.env.WXPUSHER_APP_TOKEN || "",
            baseUrl: "https://wxpusher.zjiecode.com"
          }
        },
        monitor: {
          interval: 300000,
          platforms: ["youyoupin", "buff", "steam"],
          priceThreshold: 1.0,
          retryAttempts: 3,
          retryDelay: 5000,
          historyDays: 180
        },
        storage: {
          dataPath: "./data/price-history.json",
          maxHistoryDays: 180
        },
        logging: {
          level: "info",
          file: "logs/monitor.log"
        }
      };
    }

    // 尝试加载配置文件
    try {
      if (fs.existsSync(this.configPath)) {
        const configContent = fs.readFileSync(this.configPath, 'utf8');
        return JSON.parse(configContent);
      }
    } catch (error) {
      console.error('加载config.json失败:', error.message);
    }

    // 尝试加载示例配置
    try {
      if (fs.existsSync(this.exampleConfigPath)) {
        const exampleContent = fs.readFileSync(this.exampleConfigPath, 'utf8');
        const config = JSON.parse(exampleContent);
        console.warn('使用示例配置文件，请检查配置是否正确');
        return config;
      }
    } catch (error) {
      console.error('加载config.example.json失败:', error.message);
    }

    // 最后的备用配置
    console.warn('使用默认配置，功能可能受限');
    return {
      api: {
        csqaq: {
          baseUrl: "https://csqaq.com/proxies/api/v1",
          token: "YOUR_TOKEN_HERE",
          whitelist_ip: ""
        }
      },
      notification: {
        wxpusher: {
          appToken: "",
          baseUrl: "https://wxpusher.zjiecode.com"
        }
      },
      monitor: {
        interval: 300000,
        platforms: ["steam"],
        priceThreshold: 1.0,
        retryAttempts: 3,
        retryDelay: 5000,
        historyDays: 180
      },
      storage: {
        dataPath: "./data/price-history.json",
        maxHistoryDays: 180
      },
      logging: {
        level: "info",
        file: "logs/monitor.log"
      }
    };
  }

  /**
   * 验证配置的有效性
   * @param {Object} config - 配置对象
   * @returns {Object} 验证结果
   */
  validateConfig(config) {
    const errors = [];
    const warnings = [];

    // 检查必需的配置项
    if (!config.api?.csqaq?.baseUrl) {
      errors.push('API baseUrl未配置');
    }

    if (!config.api?.csqaq?.token || config.api.csqaq.token === 'YOUR_TOKEN_HERE') {
      errors.push('API token未配置或使用默认值');
    }

    if (!config.notification?.wxpusher?.appToken) {
      warnings.push('微信推送token未配置，通知功能将被禁用');
    }

    if (!config.monitor?.platforms?.length) {
      errors.push('未配置监控平台');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

module.exports = new ConfigManager();