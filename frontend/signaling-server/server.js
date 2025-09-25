/**
 * AI角色语音聊天 - WebRTC信令服务器
 * 基于Socket.IO实现Simple-peer信令交换
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Socket.IO配置
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:8000",    // 开发环境前端
      "http://localhost:3000",    // 备用前端端口
      "https://your-domain.com"   // 生产环境域名
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  // 连接配置
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

// Express中间件
app.use(cors({
  origin: [
    "http://localhost:8000",
    "http://localhost:3000",
    "https://your-domain.com"
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// 数据存储
const activeCalls = new Map();      // 活跃通话会话
const userSessions = new Map();     // 用户会话映射
const callStats = new Map();        // 通话统计

// 工具函数
const getCallKey = (roleId, sessionId) => `${roleId}_${sessionId}`;

const logWithTimestamp = (message, ...args) => {
  console.log(`[${new Date().toISOString()}] ${message}`, ...args);
};

// Socket.IO连接处理
io.on('connection', (socket) => {
  logWithTimestamp('🔗 用户连接:', socket.id);

  // 用户加入房间（基于roleId和sessionId）
  socket.on('join_call', (data) => {
    const { roleId, sessionId, userId } = data;
    const callKey = getCallKey(roleId, sessionId);
    const roomName = `call_${callKey}`;
    
    // 加入房间
    socket.join(roomName);
    
    // 记录用户会话
    userSessions.set(socket.id, {
      userId,
      roleId,
      sessionId,
      roomName,
      joinTime: Date.now()
    });
    
    logWithTimestamp('👥 用户加入通话房间:', {
      socketId: socket.id,
      userId,
      callKey,
      roomName
    });
    
    // 通知房间内其他用户
    socket.to(roomName).emit('user_joined', {
      socketId: socket.id,
      userId,
      roleId,
      sessionId
    });
  });

  // 处理Simple-peer信令交换
  socket.on('peer_signal', (data) => {
    const { roleId, sessionId, signalData, targetSocketId } = data;
    const userSession = userSessions.get(socket.id);
    
    if (!userSession) {
      logWithTimestamp('⚠️ 未找到用户会话:', socket.id);
      return;
    }

    const callKey = getCallKey(roleId, sessionId);
    
    // 如果指定了目标socket，直接发送
    if (targetSocketId) {
      socket.to(targetSocketId).emit('peer_signal', {
        roleId,
        sessionId,
        signalData,
        fromSocketId: socket.id
      });
    } else {
      // 广播到房间内其他用户
      socket.to(userSession.roomName).emit('peer_signal', {
        roleId,
        sessionId,
        signalData,
        fromSocketId: socket.id
      });
    }
    
    logWithTimestamp('📡 转发信令:', {
      callKey,
      type: signalData.type || 'unknown',
      from: socket.id,
      to: targetSocketId || 'room'
    });
  });

  // 语音通话开始
  socket.on('voice_call_start', (data) => {
    const { roleId, sessionId, callMode = 'realtime' } = data;
    const callKey = getCallKey(roleId, sessionId);
    const userSession = userSessions.get(socket.id);
    
    if (!userSession) {
      logWithTimestamp('⚠️ 通话开始失败 - 未找到用户会话:', socket.id);
      return;
    }

    // 记录通话信息
    activeCalls.set(callKey, {
      roleId,
      sessionId,
      callMode,
      startTime: Date.now(),
      participants: [socket.id],
      status: 'starting'
    });

    // 广播通话开始事件
    socket.to(userSession.roomName).emit('voice_call_start', {
      roleId,
      sessionId,
      callMode,
      fromSocketId: socket.id
    });

    logWithTimestamp('🎙️ 语音通话开始:', {
      callKey,
      callMode,
      initiator: socket.id
    });
  });

  // 语音通话状态更新
  socket.on('voice_call_status', (data) => {
    const { roleId, sessionId, status, quality } = data;
    const callKey = getCallKey(roleId, sessionId);
    const userSession = userSessions.get(socket.id);
    
    if (!userSession) return;

    // 更新通话状态
    const call = activeCalls.get(callKey);
    if (call) {
      call.status = status;
      call.quality = quality;
      call.lastUpdate = Date.now();
    }

    // 广播状态更新
    socket.to(userSession.roomName).emit('voice_call_status', {
      roleId,
      sessionId,
      status,
      quality,
      fromSocketId: socket.id
    });

    logWithTimestamp('📊 通话状态更新:', {
      callKey,
      status,
      quality
    });
  });

  // 语音通话结束
  socket.on('voice_call_end', (data) => {
    const { roleId, sessionId } = data;
    const callKey = getCallKey(roleId, sessionId);
    const userSession = userSessions.get(socket.id);
    
    if (!userSession) return;

    const call = activeCalls.get(callKey);
    let duration = 0;
    
    if (call) {
      duration = Date.now() - call.startTime;
      
      // 保存通话统计
      callStats.set(`${callKey}_${Date.now()}`, {
        ...call,
        endTime: Date.now(),
        duration,
        endedBy: socket.id
      });
      
      // 删除活跃通话
      activeCalls.delete(callKey);
    }

    // 广播通话结束
    socket.to(userSession.roomName).emit('voice_call_end', {
      roleId,
      sessionId,
      duration,
      fromSocketId: socket.id
    });

    logWithTimestamp('🔚 语音通话结束:', {
      callKey,
      duration: `${Math.round(duration / 1000)}s`,
      endedBy: socket.id
    });
  });

  // 文本消息转发
  socket.on('chat_message', (data) => {
    const { roleId, sessionId, message } = data;
    const userSession = userSessions.get(socket.id);
    
    if (!userSession) return;

    socket.to(userSession.roomName).emit('chat_message', {
      ...data,
      fromSocketId: socket.id,
      timestamp: Date.now()
    });

    logWithTimestamp('💬 文本消息:', {
      from: socket.id,
      roleId,
      sessionId,
      messageLength: message?.length || 0
    });
  });

  // 输入状态
  socket.on('typing_start', (data) => {
    const userSession = userSessions.get(socket.id);
    if (userSession) {
      socket.to(userSession.roomName).emit('typing_start', {
        ...data,
        fromSocketId: socket.id
      });
    }
  });

  socket.on('typing_stop', (data) => {
    const userSession = userSessions.get(socket.id);
    if (userSession) {
      socket.to(userSession.roomName).emit('typing_stop', {
        ...data,
        fromSocketId: socket.id
      });
    }
  });

  // 心跳检测
  socket.on('ping', () => {
    socket.emit('pong');
  });

  // 连接断开处理
  socket.on('disconnect', (reason) => {
    const userSession = userSessions.get(socket.id);
    
    logWithTimestamp('❌ 用户断开:', {
      socketId: socket.id,
      reason,
      session: userSession
    });

    if (userSession) {
      const { roleId, sessionId, roomName } = userSession;
      const callKey = getCallKey(roleId, sessionId);

      // 通知房间内其他用户
      socket.to(roomName).emit('user_left', {
        socketId: socket.id,
        roleId,
        sessionId,
        reason
      });

      // 清理活跃通话
      const call = activeCalls.get(callKey);
      if (call) {
        const duration = Date.now() - call.startTime;
        
        // 保存通话统计
        callStats.set(`${callKey}_${Date.now()}`, {
          ...call,
          endTime: Date.now(),
          duration,
          endReason: 'disconnect',
          endedBy: socket.id
        });
        
        activeCalls.delete(callKey);
        
        // 通知通话结束
        socket.to(roomName).emit('voice_call_end', {
          roleId,
          sessionId,
          duration,
          reason: 'disconnect',
          fromSocketId: socket.id
        });
      }

      // 清理用户会话
      userSessions.delete(socket.id);
    }
  });

  // 错误处理
  socket.on('error', (error) => {
    logWithTimestamp('🚨 Socket错误:', {
      socketId: socket.id,
      error: error.message
    });
  });
});

// REST API路由

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    connections: io.engine.clientsCount,
    activeCalls: activeCalls.size,
    userSessions: userSessions.size,
    uptime: process.uptime()
  });
});

// 获取活跃通话列表
app.get('/api/active-calls', (req, res) => {
  const calls = Array.from(activeCalls.entries()).map(([callKey, call]) => ({
    callKey,
    ...call,
    duration: Date.now() - call.startTime,
    participantCount: call.participants.length
  }));
  
  res.json({
    success: true,
    data: calls,
    total: calls.length
  });
});

// 获取通话统计
app.get('/api/call-stats', (req, res) => {
  const { limit = 10 } = req.query;
  const stats = Array.from(callStats.entries())
    .slice(-parseInt(limit))
    .map(([key, stat]) => ({
      id: key,
      ...stat,
      durationSeconds: Math.round(stat.duration / 1000)
    }));
  
  res.json({
    success: true,
    data: stats,
    total: callStats.size
  });
});

// 获取在线用户
app.get('/api/online-users', (req, res) => {
  const users = Array.from(userSessions.entries()).map(([socketId, session]) => ({
    socketId,
    ...session,
    onlineDuration: Date.now() - session.joinTime
  }));
  
  res.json({
    success: true,
    data: users,
    total: users.length
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  logWithTimestamp('🚨 服务器错误:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 启动服务器
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || 'localhost';

server.listen(PORT, HOST, () => {
  logWithTimestamp('🚀 AI语音聊天信令服务器启动成功!');
  logWithTimestamp(`📍 服务地址: http://${HOST}:${PORT}`);
  logWithTimestamp(`📊 健康检查: http://${HOST}:${PORT}/health`);
  logWithTimestamp(`📋 活跃通话: http://${HOST}:${PORT}/api/active-calls`);
  logWithTimestamp(`📈 通话统计: http://${HOST}:${PORT}/api/call-stats`);
  logWithTimestamp(`👥 在线用户: http://${HOST}:${PORT}/api/online-users`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  logWithTimestamp('🛑 收到SIGTERM信号，准备关闭服务器...');
  server.close(() => {
    logWithTimestamp('✅ 服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logWithTimestamp('🛑 收到SIGINT信号，准备关闭服务器...');
  server.close(() => {
    logWithTimestamp('✅ 服务器已关闭');
    process.exit(0);
  });
});

module.exports = { app, io, server };
