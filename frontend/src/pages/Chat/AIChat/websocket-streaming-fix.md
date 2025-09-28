# WebSocket流式消息丢失问题解决方案

## 问题描述

在WebSocket流式聊天功能中，虽然能够收到完整的流式数据，但在页面展示时会出现中间一部分文字丢失的问题。具体表现为：

- WebSocket能正常接收所有`delta`类型的流式数据片段
- 但在前端界面显示时，某些片段没有被正确追加到消息内容中
- 导致最终显示的消息内容不完整

## 问题原因分析

### 1. React状态更新竞态条件
当快速连续收到多个`delta`消息时，React的异步状态更新可能产生竞态条件：
- 多个`setMessages`调用可能基于相同的旧状态
- 后续的状态更新可能覆盖前面的更新结果

### 2. 状态更新时序问题
```javascript
// 问题代码示例
setMessages((prev) => {
  const lastMsg = prev[prev.length - 1];
  // 如果prev还是旧状态，会导致更新丢失
  return prev.map((msg, index) =>
    index === prev.length - 1
      ? { ...msg, content: msg.content + content }
      : msg
  );
});
```

### 3. 流式消息ID追踪缺失
没有准确的机制来追踪当前正在进行流式传输的消息，导致：
- 无法准确识别应该更新哪条消息
- 可能错误地创建新消息而不是更新现有消息

## 解决方案

### 1. 添加流式消息ID追踪
```javascript
const streamingMessageRef = useRef<string | null>(null); // 跟踪当前流式消息ID
```

### 2. 创建专门的流式消息处理回调
```javascript
const handleStreamingUpdate = useCallback((content: string) => {
  setMessages((prev) => {
    const lastMsg = prev[prev.length - 1];
    
    if (lastMsg && lastMsg.role === 'assistant' && lastMsg.status === 'streaming' && 
        streamingMessageRef.current === lastMsg.id) {
      // 更新最后一条流式消息
      const updatedMessages = [...prev];
      const lastIndex = updatedMessages.length - 1;
      updatedMessages[lastIndex] = {
        ...updatedMessages[lastIndex],
        content: updatedMessages[lastIndex].content + content
      };
      return updatedMessages;
    } else {
      // 创建新的流式消息
      const streamingMessageId = `ai-streaming-${Date.now()}-${Math.random()}`;
      const streamingMessage: ShowMessage = {
        id: streamingMessageId,
        content: content,
        role: 'assistant',
        timestamp: Date.now(),
        status: 'streaming',
      };
      streamingMessageRef.current = streamingMessageId;
      return [...prev, streamingMessage];
    }
  });
}, []);
```

### 3. 优化WebSocket消息处理逻辑
```javascript
useEffect(() => {
  if (lastMessage) {
    const { type, msg, content } = lastMessage;
    
    if (type === 'message' && msg) {
      // 完整消息处理
      const newMessage: ShowMessage = {
        id: `ai-${msg.id}`,
        content: msg.content,
        role: 'assistant',
        timestamp: Date.now(),
        status: 'sent',
      };
      setMessages((prev) => [...prev, newMessage]);
    } else if (type === 'delta' && content) {
      // 流式数据 - 使用专门的回调函数处理
      handleStreamingUpdate(content);
    } else if (type === 'done') {
      // 流式数据结束，更新消息状态
      streamingMessageRef.current = null; // 清空流式消息ID
      setMessages((prev) =>
        prev.map((msg) =>
          msg.role === 'assistant' && msg.status === 'streaming'
            ? { ...msg, status: 'sent' }
            : msg
        )
      );
    }
  }
}, [lastMessage, handleStreamingUpdate]);
```

## 关键改进点

### 1. 消息ID唯一性保证
- 使用`Date.now() + Math.random()`确保消息ID的唯一性
- 通过`streamingMessageRef`精确追踪当前流式消息

### 2. 状态更新原子性
- 使用`useCallback`避免重复创建函数
- 采用更稳定的数组操作方式，减少竞态条件

### 3. 流式状态管理
- 明确区分`streaming`和`sent`状态
- 在流式结束时正确清理状态

## 消息格式说明

### WebSocket响应消息格式
```typescript
interface ResponseMessage {
  type: 'message' | 'delta' | 'done';
  msg?: Message;      // 完整消息对象（type为message时）
  content?: string;   // 流式数据内容（type为delta时）
}
```

### 前端显示消息格式
```typescript
interface ShowMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
  status?: 'sending' | 'sent' | 'failed' | 'streaming';
}
```

## 测试验证

修复后的功能应该满足：

1. **完整性**：所有流式数据片段都能正确追加到消息内容中
2. **顺序性**：消息片段按照接收顺序正确显示
3. **状态管理**：流式消息状态正确从`streaming`转换为`sent`
4. **用户体验**：流式打字效果流畅，无内容丢失

## 预防措施

为了避免类似问题再次出现：

1. **状态更新最佳实践**：始终使用函数式状态更新，确保基于最新状态
2. **异步操作处理**：对于快速连续的状态更新，考虑使用专门的处理机制
3. **状态追踪**：对于复杂的状态变化，使用ref来追踪关键信息
4. **测试覆盖**：添加针对流式消息的专门测试用例

## 相关文件

- `src/pages/Chat/AIChat/index.tsx` - 主要修复文件
- `src/hooks/useWebSocket.ts` - WebSocket连接管理
- `src/pages/Chat/AIChat/index.less` - 流式消息样式

---

**修复日期**: 2025年9月27日  
**影响范围**: AI聊天页面的WebSocket流式消息功能  
**测试状态**: ✅ 已验证修复
