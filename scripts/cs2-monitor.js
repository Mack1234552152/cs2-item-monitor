const https = require('https');
const http = require('http');

// CS2饰品价格监控脚本
class CS2Monitor {
    constructor() {
        this.apiToken = process.env.CSQAQ_API_TOKEN;
        this.wxToken = 'AT_oVgZnjiSqzzv1ycEbihcgjtoM4BggMjz';
        this.wxUid = 'UID_Nkv98Q7XEQcDsvSInIlR10nm33xI';
        this.baseURL = 'https://api.csqaq.com/api/v1';
    }

    // HTTP请求封装
    async makeRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            const protocol = url.startsWith('https') ? https : http;
            
            const req = protocol.request(url, options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const jsonData = JSON.parse(data);
                        resolve({ status: res.statusCode, data: jsonData });
                    } catch (e) {
                        resolve({ status: res.statusCode, data: data });
                    }
                });
            });

            req.on('error', reject);
            if (options.body) {
                req.write(options.body);
            }
            req.end();
        });
    }

    // 绑定当前IP到CSQAQ
    async bindIP() {
        console.log('🔗 正在绑定IP到CSQAQ...');
        
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ApiToken': this.apiToken
            }
        };

        const response = await this.makeRequest(`${this.baseURL}/sys/bind_local_ip`, options);
        console.log('IP绑定响应:', response.data);
        
        if (response.data.code === 200) {
            console.log('✅ IP绑定成功!');
            return true;
        } else {
            console.log('❌ IP绑定失败:', response.data.msg);
            return false;
        }
    }

    // 获取饰品详情
    async getItemData(itemId) {
        console.log(`🔫 获取饰品数据 (ID: ${itemId})...`);
        
        const options = {
            method: 'GET',
            headers: {
                'ApiToken': this.apiToken
            }
        };

        const response = await this.makeRequest(`${this.baseURL}/goods/detail?goods_id=${itemId}`, options);
        
        if (response.data.code === 200) {
            console.log('✅ 饰品数据获取成功!');
            return response.data.data;
        } else {
            console.log('❌ 饰品数据获取失败:', response.data.msg);
            return null;
        }
    }

    // 获取热门饰品列表
    async getHotItems() {
        console.log('🔥 获取热门饰品列表...');
        
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ApiToken': this.apiToken
            },
            body: JSON.stringify({
                page: 1,
                page_size: 10
            })
        };

        const response = await this.makeRequest(`${this.baseURL}/goods/hot_rank`, options);
        
        if (response.data.code === 200) {
            console.log('✅ 热门饰品获取成功!');
            return response.data.data.list;
        } else {
            console.log('❌ 热门饰品获取失败:', response.data.msg);
            return [];
        }
    }

    // 发送WXpusher通知
    async sendNotification(title, content) {
        console.log('📱 发送WXpusher通知...');
        
        const notificationData = {
            appToken: this.wxToken,
            content: `${title}\n\n${content}`,
            summary: title,
            contentType: 1,
            uids: [this.wxUid]
        };

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(notificationData)
        };

        const response = await this.makeRequest('https://wxpusher.zjiecode.com/api/send/message', options);
        
        if (response.data.code === 1000) {
            console.log('✅ 通知发送成功!');
            return true;
        } else {
            console.log('❌ 通知发送失败:', response.data.msg);
            return false;
        }
    }

    // 格式化价格信息
    formatPrice(price) {
        return `¥${price}`;
    }

    // 主监控函数
    async monitor() {
        try {
            console.log('🚀 开始CS2饰品价格监控...');
            
            // 1. 绑定IP
            const bindSuccess = await this.bindIP();
            if (!bindSuccess) {
                await this.sendNotification('❌ CS2监控失败', 'IP绑定失败，请检查API Token是否正确');
                return false;
            }

            // 等待绑定生效
            console.log('⏳ 等待IP绑定生效...');
            await new Promise(resolve => setTimeout(resolve, 30000));

            // 2. 监控指定饰品
            const targetItems = [
                { id: 13283, name: 'M4A4 | 活色生香 (崭新出厂)' },
                { id: 13463, name: 'AWP | 复古流行 (崭新出厂)' },
                { id: 12832, name: 'M4A4 | 赛博 (崭新出厂)' }
            ];

            let priceInfo = '🔫 CS2饰品价格监控\n\n';
            let hasValidData = false;

            for (const item of targetItems) {
                const itemData = await this.getItemData(item.id);
                if (itemData) {
                    hasValidData = true;
                    priceInfo += `📊 ${item.name}\n`;
                    priceInfo += `💰 当前价格: ${this.formatPrice(itemData.price || 'N/A')}\n`;
                    priceInfo += `📈 24h涨跌: ${itemData.change_24h || 'N/A'}%\n`;
                    priceInfo += `🕐 更新时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
                } else {
                    priceInfo += `❌ ${item.name}: 数据获取失败\n\n`;
                }
            }

            // 3. 获取热门饰品
            const hotItems = await this.getHotItems();
            if (hotItems.length > 0) {
                priceInfo += '🔥 热门饰品TOP3:\n';
                hotItems.slice(0, 3).forEach((item, index) => {
                    priceInfo += `${index + 1}. ${item.name}: ${this.formatPrice(item.price)}\n`;
                });
            }

            // 4. 发送通知
            if (hasValidData) {
                await this.sendNotification('✅ CS2饰品价格更新', priceInfo);
                console.log('🎉 监控任务完成!');
                return true;
            } else {
                await this.sendNotification('❌ CS2监控失败', '所有饰品数据获取失败，请检查API配置');
                return false;
            }

        } catch (error) {
            console.error('❌ 监控过程中发生错误:', error);
            await this.sendNotification('💥 CS2监控异常', `错误信息: ${error.message}`);
            return false;
        }
    }
}

// 导出模块
module.exports = CS2Monitor;

// 如果直接运行此脚本
if (require.main === module) {
    const monitor = new CS2Monitor();
    monitor.monitor().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('脚本执行失败:', error);
        process.exit(1);
    });
}