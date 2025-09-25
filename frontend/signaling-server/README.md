# AI角色语音聊天 - 信令服务器

WebRTC信令服务器，用于处理Simple-peer的信令交换和会话管理。

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm 或 yarn

### 安装依赖

```bash
# 进入信令服务器目录
cd signaling-server

# 安装依赖
npm install

# 或使用 yarn
yarn install
```

### 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
vim .env
```

主要配置项：

```bash
# 服务器端口
PORT=3001

# 服务器地址
HOST=localhost

# 前端地址（CORS配置）
FRONTEND_URL=http://localhost:8000
FRONTEND_URL_PROD=https://your-domain.com

# 运行环境
NODE_ENV=development
```

### 启动服务器

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

## 📊 API接口

### 健康检查

```bash
GET /health
```

响应：
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "connections": 5,
  "activeCalls": 2,
  "userSessions": 8,
  "uptime": 3600
}
```

### 活跃通话列表

```bash
GET /api/active-calls
```

响应：
```json
{
  "success": true,
  "data": [
    {
      "callKey": "123_session456",
      "roleId": 123,
      "sessionId": "session456",
      "callMode": "realtime",
      "startTime": 1704067200000,
      "duration": 30000,
      "participantCount": 2,
      "status": "connected"
    }
  ],
  "total": 1
}
```

### 通话统计

```bash
GET /api/call-stats?limit=10
```

### 在线用户

```bash
GET /api/online-users
```

## 🔌 WebSocket事件

### 客户端发送的事件

| 事件名 | 描述 | 参数 |
|--------|------|------|
| `join_call` | 加入通话房间 | `{ roleId, sessionId, userId }` |
| `peer_signal` | Simple-peer信令数据 | `{ roleId, sessionId, signalData, targetSocketId? }` |
| `voice_call_start` | 开始语音通话 | `{ roleId, sessionId, callMode }` |
| `voice_call_end` | 结束语音通话 | `{ roleId, sessionId }` |
| `voice_call_status` | 通话状态更新 | `{ roleId, sessionId, status, quality? }` |
| `chat_message` | 文本消息 | `{ roleId, sessionId, message }` |
| `typing_start` | 开始输入 | `{ roleId, sessionId }` |
| `typing_stop` | 停止输入 | `{ roleId, sessionId }` |

### 服务器发送的事件

| 事件名 | 描述 | 参数 |
|--------|------|------|
| `user_joined` | 用户加入房间 | `{ socketId, userId, roleId, sessionId }` |
| `user_left` | 用户离开房间 | `{ socketId, roleId, sessionId, reason }` |
| `peer_signal` | 转发信令数据 | `{ roleId, sessionId, signalData, fromSocketId }` |
| `voice_call_start` | 通话开始通知 | `{ roleId, sessionId, callMode, fromSocketId }` |
| `voice_call_end` | 通话结束通知 | `{ roleId, sessionId, duration, fromSocketId }` |
| `voice_call_status` | 通话状态更新 | `{ roleId, sessionId, status, quality, fromSocketId }` |

## 🏗️ 架构设计

```
前端客户端 A ←→ WebSocket ←→ 信令服务器 ←→ WebSocket ←→ 前端客户端 B
     ↓                                                          ↓
Simple-peer ←←←←←←←←←←←← WebRTC P2P连接 ←←←←←←←←←←←← Simple-peer
```

### 通话流程

1. **发起方**：
   - 连接信令服务器
   - 加入通话房间
   - 创建Simple-peer实例（initiator: true）
   - 发送`voice_call_start`事件

2. **接收方**：
   - 收到`voice_call_start`事件
   - 连接信令服务器
   - 加入通话房间
   - 创建Simple-peer实例（initiator: false）

3. **信令交换**：
   - Simple-peer生成信令数据
   - 通过WebSocket发送`peer_signal`事件
   - 信令服务器转发给对方
   - 建立WebRTC P2P连接

4. **通话进行**：
   - 音频流通过WebRTC直接传输
   - 状态更新通过WebSocket同步

## 🔧 开发调试

### 启用详细日志

```bash
# 设置日志级别
export LOG_LEVEL=debug

# 启动服务器
npm run dev
```

### 测试连接

```bash
# 使用wscat测试WebSocket连接
npm install -g wscat

# 连接测试
wscat -c ws://localhost:3001

# 发送测试消息
{"type": "join_call", "payload": {"roleId": 1, "sessionId": "test", "userId": "user1"}}
```

### 性能监控

访问以下端点监控服务器状态：

- 健康检查：`http://localhost:3001/health`
- 活跃通话：`http://localhost:3001/api/active-calls`
- 通话统计：`http://localhost:3001/api/call-stats`
- 在线用户：`http://localhost:3001/api/online-users`

## 🚀 部署指南

### Docker部署

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 3001

CMD ["npm", "start"]
```

### PM2部署

```bash
# 安装PM2
npm install -g pm2

# 启动服务
pm2 start server.js --name "signaling-server"

# 查看状态
pm2 status

# 查看日志
pm2 logs signaling-server
```

### Nginx反向代理

```nginx
upstream signaling_server {
    server 127.0.0.1:3001;
}

server {
    listen 80;
    server_name your-signaling-server.com;

    location / {
        proxy_pass http://signaling_server;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

## 🔒 安全配置

### CORS配置

在生产环境中，确保正确配置CORS：

```javascript
// server.js
const io = socketIo(server, {
  cors: {
    origin: [
      "https://your-frontend-domain.com"  // 只允许你的前端域名
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});
```

### 连接限制

```javascript
// 限制每个IP的连接数
const connectionLimits = new Map();

io.on('connection', (socket) => {
  const clientIP = socket.handshake.address;
  const currentConnections = connectionLimits.get(clientIP) || 0;
  
  if (currentConnections >= 10) {
    socket.disconnect();
    return;
  }
  
  connectionLimits.set(clientIP, currentConnections + 1);
});
```

## 📝 故障排除

### 常见问题

1. **WebSocket连接失败**
   - 检查防火墙设置
   - 确认端口3001未被占用
   - 检查CORS配置

2. **信令交换失败**
   - 检查Simple-peer版本兼容性
   - 确认信令数据格式正确
   - 查看服务器日志

3. **音频无法传输**
   - 检查浏览器媒体权限
   - 确认STUN服务器配置
   - 检查网络防火墙

### 日志分析

服务器会输出详细的日志信息：

```
[2024-01-01T00:00:00.000Z] 🔗 用户连接: abc123
[2024-01-01T00:00:01.000Z] 👥 用户加入通话房间: {...}
[2024-01-01T00:00:02.000Z] 📡 转发信令: {...}
[2024-01-01T00:00:03.000Z] 🎙️ 语音通话开始: {...}
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

MIT License
