#!/bin/bash

# CS2 饰品价格监控脚本
# 使用方法: ./simple-monitor.sh

# 配置信息
CSQAQ_API_TOKEN="JOVN71P7T388E2N1G1H6W5A0"
WXPUSHER_TOKEN="AT_oVgZnjiSqzzv1ycEbihcgjtoM4BggMjz"
WXPUSHER_UID="UID_Nkv98Q7XEQcDsvSInIlR10nm33xI"

echo "🚀 开始CS2饰品价格监控..."

# 1. 绑定IP到CSQAQ
echo "🔗 绑定IP到CSQAQ..."
bind_response=$(curl -s -X POST "https://api.csqaq.com/api/v1/sys/bind_local_ip" \
  -H "Content-Type: application/json" \
  -H "ApiToken: $CSQAQ_API_TOKEN")

echo "IP绑定响应: $bind_response"

if echo "$bind_response" | grep -q '"code":200'; then
    echo "✅ IP绑定成功!"
    bound_ip=$(echo "$bind_response" | grep -o '当前绑定IP为：[^"]*' | cut -d'：' -f2)
    echo "绑定IP: $bound_ip"
else
    echo "❌ IP绑定失败"
    
    # 发送失败通知
    curl -s -X POST "https://wxpusher.zjiecode.com/api/send/message" \
      -H "Content-Type: application/json" \
      -d "{\"appToken\": \"$WXPUSHER_TOKEN\", \"content\": \"CS2 Monitor Failed - IP binding failed\", \"summary\": \"CS2 Monitor Error\", \"contentType\": 1, \"uids\": [\"$WXPUSHER_UID\"]}"
    exit 1
fi

# 2. 等待绑定生效
echo "⏳ 等待IP绑定生效 (30秒)..."
sleep 30

# 3. 获取CSQAQ数据
echo "📊 获取CSQAQ数据..."
api_response=$(curl -s -X GET "https://api.csqaq.com/api/v1/current_data")

if echo "$api_response" | grep -q '"code":200'; then
    echo "✅ 数据获取成功!"
    
    # 解析数据
    market_index=$(echo "$api_response" | grep -o '"market_index":[^,]*' | head -1 | cut -d':' -f2 | tr -d '" ')
    chg_rate=$(echo "$api_response" | grep -o '"chg_rate":[^,]*' | head -1 | cut -d':' -f2)
    online_players=$(echo "$api_response" | grep -o '"current_number":[^,}]*' | cut -d':' -f2)
    
    echo "当前饰品指数: $market_index"
    echo "涨跌幅: $chg_rate%"
    echo "在线人数: $online_players"
    
    # 构建通知内容
    notification_content="CS2饰品价格监控更新

当前饰品指数: $market_index
涨跌幅: $chg_rate%
在线人数: $online_players人
更新时间: $(date '+%Y-%m-%d %H:%M:%S')
监控状态: 正常运行"
    
    # 发送成功通知
    curl -s -X POST "https://wxpusher.zjiecode.com/api/send/message" \
      -H "Content-Type: application/json" \
      -d "{\"appToken\": \"$WXPUSHER_TOKEN\", \"content\": \"$notification_content\", \"summary\": \"CS2 Price Update\", \"contentType\": 1, \"uids\": [\"$WXPUSHER_UID\"]}"
    
    echo "🎉 监控任务完成，通知已发送!"
else
    echo "❌ 数据获取失败"
    
    # 发送错误通知
    curl -s -X POST "https://wxpusher.zjiecode.com/api/send/message" \
      -H "Content-Type: application/json" \
      -d "{\"appToken\": \"$WXPUSHER_TOKEN\", \"content\": \"CS2 Monitor Failed - Data fetch failed\", \"summary\": \"CS2 Monitor Error\", \"contentType\": 1, \"uids\": [\"$WXPUSHER_UID\"]}"
    exit 1
fi

echo "✅ 监控脚本执行完毕"