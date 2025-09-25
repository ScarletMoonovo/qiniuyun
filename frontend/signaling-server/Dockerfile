# AI角色语音聊天 - 信令服务器 Docker镜像

FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装基础工具
RUN apk add --no-cache \
    dumb-init \
    && rm -rf /var/cache/apk/*

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production \
    && npm cache clean --force

# 复制应用代码
COPY . .

# 创建非root用户
RUN addgroup -g 1001 -S nodejs \
    && adduser -S signaling -u 1001 -G nodejs

# 创建日志目录
RUN mkdir -p logs \
    && chown -R signaling:nodejs /app

# 切换到非root用户
USER signaling

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# 使用dumb-init作为PID 1
ENTRYPOINT ["dumb-init", "--"]

# 启动应用
CMD ["node", "server.js"]

# 标签信息
LABEL \
    name="ai-chat-signaling-server" \
    version="1.0.0" \
    description="WebRTC signaling server for AI role chat" \
    maintainer="your-team@company.com"
