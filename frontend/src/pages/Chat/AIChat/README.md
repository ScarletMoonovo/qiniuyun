# AI聊天页面

## 功能说明

这是一个完整的AI聊天页面组件，支持以下功能：

### 主要特性

1. **WebSocket实时通信**
   - 进入页面时自动建立WebSocket连接
   - 实时发送和接收消息
   - 连接状态显示
   - 自动重连机制（通过useWebSocket hook）

2. **消息管理**
   - 支持用户和AI消息显示
   - 消息发送状态（发送中、已发送、失败）
   - 自动滚动到最新消息
   - 时间戳显示

3. **用户交互**
   - 文本输入框支持多行输入
   - Enter发送，Shift+Enter换行
   - 发送按钮状态管理
   - 返回上一页功能

4. **响应式设计**
   - 支持桌面和移动端
   - 自适应布局
   - 触摸友好的界面

### 使用方式

1. **从角色卡片进入**
   ```tsx
   // 在RoleCard组件中点击"开始聊天"按钮
   // 会自动跳转到 /role/chat/{角色ID}
   ```

2. **页面路由**
   ```tsx
   // 路由配置在 config/routes.ts 中
   { 
     path: '/role/chat/:id', 
     component: './Role/Chat', 
     name: '与角色聊天',
     hideInMenu: true,
   }
   ```

### WebSocket配置

当前WebSocket连接URL格式：
```
ws://localhost:8080/ws/chat/{sessionId}
```

**消息格式：**
```typescript
// 发送消息
{
  type: 'chat',
  content: string,
  session_id: number,
  timestamp: number
}

// 接收消息
{
  content: string,        // 或者 message: string
  // 其他字段...
}
```

### 模拟模式

当WebSocket连接不可用时，系统会自动进入模拟模式：
- 创建模拟会话ID
- 显示模拟AI回复
- 保持界面功能正常

### API依赖

使用现有的后端API：
- `newSession`: 创建新的聊天会话
- 其他API保持不变

### 样式特点

- 现代化的聊天界面设计
- 区分用户和AI消息的气泡样式
- 平滑的动画效果
- 自定义滚动条
- 响应式布局适配

### 扩展建议

1. **消息类型扩展**
   - 支持图片消息
   - 支持文件传输
   - 支持语音消息

2. **功能增强**
   - 消息搜索
   - 聊天记录导出
   - 消息引用回复
   - 表情符号支持

3. **性能优化**
   - 虚拟滚动（长对话）
   - 消息分页加载
   - 图片懒加载
