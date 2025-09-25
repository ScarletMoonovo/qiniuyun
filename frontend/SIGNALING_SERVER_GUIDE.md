# 🚀 信令服务器快速启动指南

## 📋 概述

我们已经为你的AI角色语音聊天项目创建了完整的**独立信令服务器**，使用Socket.IO处理WebRTC信令交换。

## 🎯 方案一：独立信令服务器架构

```
前端 (React + Simple-peer) ←→ 信令服务器 (Node.js + Socket.IO) ←→ AI后端
            ↓                                                        ↓
    WebRTC P2P音频流 ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←← WebRTC P2P音频流
```

## 📁 创建的文件结构

```
signaling-server/
├── package.json          # 依赖配置
├── server.js             # 服务器核心代码
├── .env.example          # 环境变量模板
├── .gitignore           # Git忽略文件
├── README.md            # 详细文档
├── start.sh             # 启动脚本
├── Dockerfile           # Docker镜像
├── docker-compose.yml   # Docker编排
└── .dockerignore        # Docker忽略文件
```

## 🚀 快速启动步骤

### 1. 安装信令服务器依赖

```bash
# 进入信令服务器目录
cd signaling-server

# 安装依赖
npm install

# 或者使用便捷脚本
./start.sh install
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置（可选，默认配置即可开发使用）
vim .env
```

### 3. 启动信令服务器

```bash
# 方式1: 使用便捷脚本（推荐）
./start.sh start dev

# 方式2: 直接使用npm
npm run dev

# 方式3: 生产模式
./start.sh start prod
```

### 4. 验证服务器启动

访问 http://localhost:3001/health 应该看到：

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "connections": 0,
  "activeCalls": 0,
  "userSessions": 0,
  "uptime": 10
}
```

### 5. 启动前端项目

```bash
# 在另一个终端，进入前端目录
cd /Users/zhaoyucheng/Desktop/Project/qiniuyun/frontend

# 安装Simple-peer依赖
npm install simple-peer @types/simple-peer

# 启动前端
npm run dev
```

## 🔧 前端已完成的修改

### 1. 添加了Simple-peer依赖

```json
// package.json
{
  "dependencies": {
    "simple-peer": "^9.11.1"
  },
  "devDependencies": {
    "@types/simple-peer": "^9.11.5"
  }
}
```

### 2. 更新了WebSocket服务

- `src/utils/socketService.ts` - 简化了信令处理
- `src/utils/simplePeerVoiceService.ts` - 适配信令服务器连接

### 3. 更新了API类型定义

- `src/services/backend/typings.d.ts` - 添加了新的WebSocket消息类型

## 🎮 测试通话功能

### 开发环境测试流程：

1. **启动信令服务器** (端口3001)
   ```bash
   cd signaling-server
   ./start.sh start dev
   ```

2. **启动前端** (端口8000)
   ```bash
   cd frontend
   npm run dev
   ```

3. **测试语音通话**
   ```typescript
   // 在前端组件中
   import { getSimplePeerVoiceService } from '@/utils/simplePeerVoiceService';
   
   const voiceService = getSimplePeerVoiceService();
   
   // 开始通话
   await voiceService.startCall(roleId, sessionId);
   
   // 结束通话
   await voiceService.endCall();
   ```

## 📊 监控和调试

### 服务器状态监控

```bash
# 查看服务器状态
./start.sh status

# 查看实时日志
./start.sh logs

# 查看活跃通话
curl http://localhost:3001/api/active-calls

# 查看在线用户
curl http://localhost:3001/api/online-users
```

### 前端调试

打开浏览器开发者工具，查看：
- **Console** - Simple-peer和WebSocket日志
- **Network** - WebSocket连接状态
- **Application > Storage** - 会话存储

## 🚀 部署选项

### 选项1: 传统部署
```bash
# 生产模式启动
./start.sh start prod
```

### 选项2: PM2进程管理
```bash
# PM2模式启动
./start.sh start pm2

# 查看PM2状态
pm2 status
```

### 选项3: Docker部署
```bash
# Docker模式启动
./start.sh start docker

# 或使用docker-compose
docker-compose up -d
```

## ⚠️ 注意事项

### 1. 端口配置
- 信令服务器：`3001` (可在.env中修改)
- 前端开发服务器：`8000`
- 确保端口未被占用

### 2. CORS配置
生产环境需要修改 `server.js` 中的CORS配置：
```javascript
origin: [
  "https://your-actual-domain.com"  // 替换为实际域名
]
```

### 3. STUN服务器
默认使用Google的公共STUN服务器，生产环境建议使用自己的TURN服务器。

## 🆘 常见问题

### Q: WebSocket连接失败？
A: 检查端口3001是否被占用，确认防火墙设置

### Q: 信令交换失败？
A: 查看浏览器Console和服务器日志，确认Simple-peer版本兼容性

### Q: 音频无法传输？
A: 检查浏览器媒体权限，确认麦克风访问权限

### Q: 如何扩展到多个服务器？
A: 可以使用Redis适配器实现Socket.IO集群

## 📞 下一步

1. **测试基本连接**: 启动服务器并验证健康检查
2. **集成前端**: 在聊天组件中集成语音服务
3. **测试通话**: 模拟两个用户之间的语音通话
4. **优化配置**: 根据实际需求调整STUN/TURN服务器
5. **部署生产**: 选择合适的部署方案

## 🎉 完成！

你现在拥有了一个完整的WebRTC信令服务器解决方案！

**立即开始**：
```bash
cd signaling-server
./start.sh start dev
```

然后在浏览器访问 http://localhost:3001/health 验证服务器运行状态。
