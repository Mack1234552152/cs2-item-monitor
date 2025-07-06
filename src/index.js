const PriceMonitor = require('./monitor/priceMonitor');
const cron = require('node-cron');
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// 配置日志
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.File({ filename: path.join(logDir, 'monitor.log') }),
    new winston.transports.Console()
  ]
});

class CS2ItemMonitorApp {
  constructor() {
    this.monitor = new PriceMonitor();
    this.jobs = [];
    this.isGitHubActions = process.env.GITHUB_ACTIONS === 'true';
  }

  /**
   * 启动应用
   */
  async start() {
    try {
      logger.info('🚀 CS2饰品监控应用启动');
      
      if (this.isGitHubActions) {
        // GitHub Actions环境，只运行一次
        await this.runSingleCheck();
      } else {
        // 本地环境，启动定时任务
        await this.startScheduledTasks();
      }
      
    } catch (error) {
      logger.error('应用启动失败:', error.message);
      process.exit(1);
    }
  }

  /**
   * 单次检查（用于GitHub Actions）
   */
  async runSingleCheck() {
    try {
      logger.info('📊 执行单次价格检查');
      
      await this.monitor.start();
      await this.monitor.monitorPrices();
      
      logger.info('✅ 单次检查完成');
      
      // 显示统计信息
      const stats = await this.monitor.dataManager.getStatistics();
      logger.info(`统计信息: 监控${stats.monitoredItems}个饰品, 今日预警${stats.todayAlerts}次`);
      
    } catch (error) {
      logger.error('单次检查失败:', error.message);
      throw error;
    }
  }

  /**
   * 启动定时任务（用于本地运行）
   */
  async startScheduledTasks() {
    try {
      logger.info('⏰ 启动定时任务');
      
      // 启动监控器
      await this.monitor.start();
      
      // 主监控任务 - 每5分钟执行一次
      const monitorJob = cron.schedule('*/5 * * * *', async () => {
        try {
          logger.info('🔍 执行定时价格监控');
          await this.monitor.monitorPrices();
        } catch (error) {
          logger.error('定时监控失败:', error.message);
        }
      });
      
      // 每日报告任务 - 每天早上8点
      const dailyReportJob = cron.schedule('0 8 * * *', async () => {
        try {
          logger.info('📊 生成每日报告');
          await this.monitor.generateDailyReport();
        } catch (error) {
          logger.error('生成每日报告失败:', error.message);
        }
      });
      
      // 系统维护任务 - 每周日凌晨2点
      const maintenanceJob = cron.schedule('0 2 * * 0', async () => {
        try {
          logger.info('🧹 执行系统维护');
          await this.monitor.performMaintenance();
        } catch (error) {
          logger.error('系统维护失败:', error.message);
        }
      });
      
      this.jobs = [monitorJob, dailyReportJob, maintenanceJob];
      
      logger.info('✅ 定时任务启动完成');
      logger.info('📋 任务列表:');
      logger.info('  - 价格监控: 每5分钟');
      logger.info('  - 每日报告: 每天8:00');
      logger.info('  - 系统维护: 每周日2:00');
      
      // 立即执行一次监控
      await this.monitor.monitorPrices();
      
    } catch (error) {
      logger.error('启动定时任务失败:', error.message);
      throw error;
    }
  }

  /**
   * 停止应用
   */
  async stop() {
    try {
      logger.info('⏹️ 停止应用');
      
      // 停止所有定时任务
      this.jobs.forEach(job => job.destroy());
      this.jobs = [];
      
      // 停止监控器
      await this.monitor.stop();
      
      logger.info('✅ 应用已停止');
      
    } catch (error) {
      logger.error('停止应用失败:', error.message);
    }
  }

  /**
   * 获取应用状态
   */
  getStatus() {
    return {
      isRunning: this.jobs.length > 0,
      isGitHubActions: this.isGitHubActions,
      jobCount: this.jobs.length,
      monitorStatus: this.monitor.getStatus()
    };
  }
}

// 全局错误处理
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝:', reason);
  process.exit(1);
});

// 优雅关闭
process.on('SIGINT', async () => {
  logger.info('收到SIGINT信号，正在关闭应用...');
  if (global.app) {
    await global.app.stop();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('收到SIGTERM信号，正在关闭应用...');
  if (global.app) {
    await global.app.stop();
  }
  process.exit(0);
});

// 启动应用
if (require.main === module) {
  const app = new CS2ItemMonitorApp();
  global.app = app;
  app.start().catch(error => {
    logger.error('应用启动失败:', error);
    process.exit(1);
  });
}

module.exports = CS2ItemMonitorApp;