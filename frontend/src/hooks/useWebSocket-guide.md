# useWebSocket Hook 使用指南

一个功能完整的 React WebSocket Hook，提供自动连接管理、重连机制和状态跟踪。

## 快速开始

### 基本用法

```typescript
import useWebSocket from '@/hooks/useWebSocket';

function MyComponent() {
  const { socket, readyState, lastMessage, sendMessage } = useWebSocket('ws://localhost:8080');

  const handleSend = () => {
    sendMessage('Hello WebSocket!');
  };

  return (
    <div>
      <p>状态: {readyState === WebSocket.OPEN ? '已连接' : '未连接'}</p>
      <button onClick={handleSend}>发送消息</button>
      {lastMessage && <p>收到: {lastMessage.data}</p>}
    </div>
  );
}
```

## API 参考

### useWebSocket(url, options)

#### 参数

- **url** `string | null` - WebSocket 服务器地址，传入 `null` 时不会建立连接
- **options** `UseWebSocketOptions` - 可选配置项

#### 返回值 `UseWebSocketReturn`

| 属性 | 类型 | 描述 |
|------|------|------|
| `socket` | `WebSocket \| null` | WebSocket 实例 |
| `readyState` | `number` | 连接状态 (0:连接中, 1:已连接, 2:正在关闭, 3:已关闭) |
| `lastMessage` | `ResponseMessage \| null` | 最后收到的消息 |
| `sendMessage` | `Function` | 发送消息的方法 |
| `connect` | `Function` | 手动连接 |
| `disconnect` | `Function` | 手动断开连接 |
| `reconnect` | `Function` | 重新连接 |

### 配置选项 `UseWebSocketOptions`

```typescript
interface UseWebSocketOptions {
  // 连接配置
  protocols?: string | string[];           // WebSocket 子协议
  
  // 重连配置
  reconnectLimit?: number;                 // 最大重连次数，默认 3
  reconnectInterval?: number;              // 重连间隔(ms)，默认 3000
  
  // 事件回调
  onOpen?: (event: Event) => void;         // 连接建立时触发
  onClose?: (event: CloseEvent) => void;   // 连接关闭时触发
  onError?: (event: Event) => void;        // 发生错误时触发
  onMessage?: (event: ResponseMessage) => void; // 收到消息时触发
}
```

## 连接状态

WebSocket 有四种连接状态：

```typescript
WebSocket.CONNECTING = 0  // 正在连接
WebSocket.OPEN = 1        // 连接已建立
WebSocket.CLOSING = 2     // 连接正在关闭
WebSocket.CLOSED = 3      // 连接已关闭
```

## 使用示例

### 1. 聊天应用

```typescript
import React, { useState } from 'react';
import useWebSocket from '@/hooks/useWebSocket';

function ChatRoom() {
  const [messages, setMessages] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');

  const { readyState, sendMessage } = useWebSocket('ws://localhost:8080/chat', {
    onMessage: (event) => {
      const message = JSON.parse(event.data);
      setMessages(prev => [...prev, message.content]);
    },
    onOpen: () => {
      console.log('已连接到聊天室');
    },
    onClose: () => {
      console.log('已断开连接');
    },
    reconnectLimit: 5,
    reconnectInterval: 2000,
  });

  const handleSend = () => {
    if (inputValue.trim() && readyState === WebSocket.OPEN) {
      sendMessage(JSON.stringify({ 
        type: 'message', 
        content: inputValue 
      }));
      setInputValue('');
    }
  };

  return (
    <div>
      <div>
        状态: {readyState === WebSocket.OPEN ? '在线' : '离线'}
      </div>
      
      <div style={{ height: '300px', overflow: 'auto', border: '1px solid #ccc' }}>
        {messages.map((msg, index) => (
          <div key={index}>{msg}</div>
        ))}
      </div>
      
      <div>
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="输入消息..."
        />
        <button onClick={handleSend} disabled={readyState !== WebSocket.OPEN}>
          发送
        </button>
      </div>
    </div>
  );
}
```

### 2. 实时数据监控

```typescript
import React, { useState, useEffect } from 'react';
import useWebSocket from '@/hooks/useWebSocket';

interface SystemData {
  cpu: number;
  memory: number;
  timestamp: string;
}

function SystemMonitor() {
  const [systemData, setSystemData] = useState<SystemData | null>(null);

  const { readyState, reconnect, disconnect } = useWebSocket('ws://localhost:8080/monitor', {
    onMessage: (event) => {
      try {
        const data: SystemData = JSON.parse(event.data);
        setSystemData(data);
      } catch (error) {
        console.error('解析数据失败:', error);
      }
    },
    onError: (error) => {
      console.error('WebSocket 错误:', error);
    },
    reconnectLimit: 10,
    reconnectInterval: 5000,
  });

  return (
    <div>
      <div>
        <span>连接状态: </span>
        <span style={{ 
          color: readyState === WebSocket.OPEN ? 'green' : 'red' 
        }}>
          {readyState === WebSocket.OPEN ? '已连接' : '未连接'}
        </span>
        <button onClick={reconnect} style={{ marginLeft: '10px' }}>
          重连
        </button>
        <button onClick={disconnect} style={{ marginLeft: '10px' }}>
          断开
        </button>
      </div>

      {systemData && (
        <div>
          <h3>系统状态</h3>
          <p>CPU 使用率: {systemData.cpu}%</p>
          <p>内存使用率: {systemData.memory}%</p>
          <p>更新时间: {systemData.timestamp}</p>
        </div>
      )}
    </div>
  );
}
```

### 3. 条件连接

```typescript
import React, { useState } from 'react';
import useWebSocket from '@/hooks/useWebSocket';

function ConditionalConnection() {
  const [shouldConnect, setShouldConnect] = useState(false);
  const [token, setToken] = useState('');

  // 只有在 shouldConnect 为 true 且有 token 时才连接
  const wsUrl = shouldConnect && token ? 
    `ws://localhost:8080/secure?token=${token}` : 
    null;

  const { readyState, lastMessage, sendMessage, connect, disconnect } = useWebSocket(wsUrl, {
    onOpen: () => {
      console.log('安全连接已建立');
    },
    onClose: (event) => {
      console.log('连接已关闭:', event.reason);
      setShouldConnect(false);
    },
    onError: () => {
      console.error('认证失败');
      setShouldConnect(false);
    }
  });

  const handleConnect = () => {
    if (token) {
      setShouldConnect(true);
    } else {
      alert('请输入访问令牌');
    }
  };

  const handleDisconnect = () => {
    setShouldConnect(false);
    disconnect();
  };

  return (
    <div>
      <div>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="输入访问令牌"
        />
        {!shouldConnect ? (
          <button onClick={handleConnect}>连接</button>
        ) : (
          <button onClick={handleDisconnect}>断开</button>
        )}
      </div>
      
      <p>状态: {readyState === WebSocket.OPEN ? '已连接' : '未连接'}</p>
      
      {lastMessage && (
        <div>
          <h4>最新消息:</h4>
          <pre>{JSON.stringify(JSON.parse(lastMessage.data), null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

## 最佳实践

### 1. 错误处理

```typescript
const { readyState, sendMessage } = useWebSocket(url, {
  onError: (error) => {
    // 记录错误日志
    console.error('WebSocket 错误:', error);
    
    // 显示用户友好的错误信息
    notification.error({
      message: '连接错误',
      description: '无法连接到服务器，请检查网络连接',
    });
  },
  onClose: (event) => {
    if (!event.wasClean) {
      // 非正常关闭，可能是网络问题
      console.warn('连接异常关闭:', event.reason);
    }
  }
});
```

### 2. 消息格式化

```typescript
// 定义消息类型
interface WebSocketMessage {
  type: 'chat' | 'notification' | 'system';
  data: any;
  timestamp: string;
}

const { lastMessage } = useWebSocket(url, {
  onMessage: (event) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      switch (message.type) {
        case 'chat':
          handleChatMessage(message.data);
          break;
        case 'notification':
          handleNotification(message.data);
          break;
        case 'system':
          handleSystemMessage(message.data);
          break;
      }
    } catch (error) {
      console.error('消息解析失败:', error);
    }
  }
});

// 发送格式化消息
const sendFormattedMessage = (type: string, data: any) => {
  const message: WebSocketMessage = {
    type: type as any,
    data,
    timestamp: new Date().toISOString()
  };
  sendMessage(JSON.stringify(message));
};
```

### 3. 内存清理

```typescript
import { useEffect } from 'react';

function MyComponent() {
  const { socket, disconnect } = useWebSocket(url);

  // 组件卸载时确保连接关闭
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // ... 其他逻辑
}
```

### 4. 性能优化

```typescript
import { useMemo, useCallback } from 'react';

function OptimizedComponent() {
  // 缓存 WebSocket URL
  const wsUrl = useMemo(() => {
    return `ws://localhost:8080/room/${roomId}?token=${token}`;
  }, [roomId, token]);

  // 缓存事件处理器
  const handleMessage = useCallback((event: ResponseMessage) => {
    // 处理消息逻辑
  }, [/* 依赖项 */]);

  const { readyState, sendMessage } = useWebSocket(wsUrl, {
    onMessage: handleMessage,
    reconnectLimit: 3,
    reconnectInterval: 3000,
  });

  // ... 其他逻辑
}
```

## 故障排除

### 常见问题

1. **连接失败**
   - 检查 WebSocket 服务器是否运行
   - 确认 URL 格式正确 (`ws://` 或 `wss://`)
   - 检查网络连接和防火墙设置

2. **消息发送失败**
   - 确保连接状态为 `WebSocket.OPEN`
   - 检查消息格式是否正确
   - 查看浏览器控制台错误信息

3. **频繁重连**
   - 检查服务器稳定性
   - 适当增加 `reconnectInterval`
   - 限制 `reconnectLimit` 避免无限重连

4. **内存泄漏**
   - 确保组件卸载时调用 `disconnect()`
   - 避免在事件回调中创建闭包引用大对象

### 调试技巧

```typescript
const { socket, readyState } = useWebSocket(url, {
  onOpen: (event) => {
    console.log('🟢 WebSocket 连接已建立', event);
  },
  onClose: (event) => {
    console.log('🔴 WebSocket 连接已关闭', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean
    });
  },
  onError: (error) => {
    console.error('❌ WebSocket 错误', error);
  },
  onMessage: (event) => {
    console.log('📨 收到消息', {
      data: event.data,
      origin: event.origin,
      timestamp: new Date().toISOString()
    });
  }
});

// 在开发环境下暴露 socket 到全局变量便于调试
if (process.env.NODE_ENV === 'development') {
  (window as any).debugSocket = socket;
}
```

## TypeScript 支持

Hook 提供完整的 TypeScript 类型支持：

```typescript
import useWebSocket, { UseWebSocketOptions, UseWebSocketReturn } from '@/hooks/useWebSocket';

// 自定义消息类型
interface ChatMessage {
  id: string;
  user: string;
  content: string;
  timestamp: number;
}

function TypedChatComponent() {
  const options: UseWebSocketOptions = {
    reconnectLimit: 5,
    onMessage: (event: ResponseMessage) => {
      const message: ChatMessage = JSON.parse(event.data);
      // TypeScript 会提供完整的类型检查
      console.log(message.user, message.content);
    }
  };

  const webSocket: UseWebSocketReturn = useWebSocket('ws://localhost:8080', options);
  
  return <div>...</div>;
}
```

## 更新日志

### v1.0.0
- 初始版本
- 支持自动连接和重连
- 提供完整的状态管理
- 包含事件回调机制
- TypeScript 类型支持
