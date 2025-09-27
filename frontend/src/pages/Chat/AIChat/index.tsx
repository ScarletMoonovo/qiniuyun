import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, history } from 'umi';
import {
  Card,
  Input,
  Button,
  Avatar,
  Space,
  Typography,
  Spin,
  message,
  Empty,
  Tooltip,
} from 'antd';
import {
  SendOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  RobotOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import useWebSocket from '@/hooks/useWebSocket';
import { newSession } from '@/services/backend/chat';
import './index.less';
import TokenManager from '@/utils/token';

const { TextArea } = Input;
const { Text } = Typography;

interface ShowMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
  status?: 'sending' | 'sent' | 'failed' | 'streaming';
}

const AIChat: React.FC = () => {
  const params = useParams();
  const id = params.id as string;
  const [messages, setMessages] = useState<ShowMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [characterInfo, setCharacterInfo] = useState<API.Character | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<any>(null);
  const streamingMessageRef = useRef<string | null>(null); // 跟踪当前流式消息ID

  // WebSocket连接URL - 这里先使用模拟的URL，实际项目中需要根据后端配置
  const wsUrl = sessionId ? `ws://192.168.196.54:10086/api/chat/${sessionId}` : null;

  // 2. 缓存WebSocket选项，避免重复创建
  const webSocketOptions = useMemo(() => ({
    onOpen: () => {
      console.log('WebSocket连接已建立');
      message.success('连接成功');
      // 发送一个消息，包含access_token
      sendMessage(JSON.stringify({
        token: TokenManager.getAccessToken(),
      }));
    },
    onClose: (event: CloseEvent) => {
      console.log('WebSocket连接已关闭', event.code, event.reason);
      // 只在非正常关闭时提示
      if (event.code !== 1000) {
        console.warn('WebSocket异常关闭:', event.code, event.reason);
      }
    },
    onError: (error: Event) => {
      console.error('WebSocket连接错误:', error);
      
      // 更详细的错误信息
      const target = error.target as WebSocket;
      console.error('连接详情:', {
        url: target?.url,
        readyState: target?.readyState,
        protocol: target?.protocol
      });
      
      message.error('WebSocket连接失败，请检查网络或服务器状态');
    },
    // 限制重连，避免无限循环
    reconnectLimit: 3,
    reconnectInterval: 5000,
  }), []);

  const { sendMessage, readyState, lastMessage } = useWebSocket(wsUrl, webSocketOptions);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 处理流式消息更新的回调函数
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

  // 初始化会话
  const initSession = async () => {
    try {
      setIsLoading(true);
      
      // 模拟角色信息（实际项目中应该从API获取）
      const mockCharacter: API.Character = {
        id: parseInt(id || '0'),
        name: `AI助手-${id || '0'}`,
        avatar: '',
        description: '我是你的AI助手，很高兴为你服务！',
        background: '',
        open_line: '你好！我是你的AI助手，有什么可以帮助你的吗？',
        tags: ['AI', '助手'],
        is_public: true,
        user_id: 1,
        created_at: Date.now(),
        updated_at: Date.now(),
      };
      setCharacterInfo(mockCharacter);

      // 创建新会话
      const response = await newSession({
        character_id: parseInt(id || '4'),
      });

      if (response.session_id) {
        setSessionId(response.session_id);
        
        // 添加AI的开场白
        const welcomeMessage: ShowMessage = {
          id: `welcome-${Date.now()}`,
          content: mockCharacter.open_line,
          role: 'assistant',
          timestamp: Date.now(),
          status: 'sent',
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('初始化会话失败:', error);
      message.error('初始化会话失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理接收到的WebSocket消息
  useEffect(() => {
    if (lastMessage) {
      const { type, msg, content } = lastMessage;
      
      if (type === 'message' && msg) {
        // 完整消息
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

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ShowMessage = {
      id: `user-${Date.now()}`,
      content: inputValue.trim(),
      role: 'user',
      timestamp: Date.now(),
      status: 'sending',
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageContent = inputValue.trim();
    setInputValue('');

    try {
      // 通过WebSocket发送消息
      if (readyState === WebSocket.OPEN) {
        sendMessage(messageContent);
        
        // 更新消息状态为已发送
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === userMessage.id ? { ...msg, status: 'sent' } : msg
          )
        );
      } else {
        // WebSocket未连接，模拟AI回复
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === userMessage.id ? { ...msg, status: 'sent' } : msg
          )
        );

        // 模拟AI回复延迟
        setTimeout(() => {
          const aiMessage: ShowMessage = {
            id: `ai-${Date.now()}`,
            content: `收到你的消息："${messageContent}"。这是一个模拟回复，因为WebSocket连接不可用。`,
            role: 'assistant',
            timestamp: Date.now(),
            status: 'sent',
          };
          setMessages((prev) => [...prev, aiMessage]);
        }, 1000);
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id ? { ...msg, status: 'failed' } : msg
        )
      );
      message.error('发送消息失败');
    }
  };

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 返回上一页
  const handleGoBack = () => {
    history.back();
  };

  // 初始化
  useEffect(() => {
    if (id) {
      initSession();
    }
  }, [id]);

  // 自动滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 聚焦输入框
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  if (isLoading) {
    return (
      <div className="ai-chat-loading">
        <Spin size="large" />
        <Text style={{ marginTop: 16 }}>正在初始化聊天...</Text>
      </div>
    );
  }

  return (
    <div className="ai-chat-container">
      {/* 顶部导航栏 */}
      <div className="ai-chat-header">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={handleGoBack}
          className="back-button"
        />
        <div className="character-info">
          <Avatar
            size={40}
            src={characterInfo?.avatar}
            icon={<RobotOutlined />}
            className="character-avatar"
          />
          <div className="character-details">
            <Text strong className="character-name">
              {characterInfo?.name}
            </Text>
            <Text type="secondary" className="connection-status">
              {readyState === WebSocket.OPEN ? '已连接' : '未连接'}
            </Text>
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="ai-chat-messages">
        {messages.length === 0 ? (
          <Empty description="暂无消息" />
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message-item ${message.role === 'user' ? 'user-message' : 'ai-message'}`}
            >
              <Avatar
                size={36}
                src={message.role === 'user' ? undefined : characterInfo?.avatar}
                icon={message.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                className="message-avatar"
              />
              <div className="message-content">
                <div className="message-bubble">
                  <Text className="message-text">{message.content}</Text>
                  {message.status === 'sending' && (
                    <LoadingOutlined className="message-status" />
                  )}
                  {message.status === 'streaming' && (
                    <span className="streaming-cursor">|</span>
                  )}
                </div>
                <Text type="secondary" className="message-time">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </Text>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="ai-chat-input">
        <Card className="input-card">
          <Space.Compact style={{ display: 'flex', width: '100%' }}>
            <TextArea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入消息... (Enter发送，Shift+Enter换行)"
              autoSize={{ minRows: 1, maxRows: 4 }}
              className="message-input"
            />
            <Tooltip title="发送消息">
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="send-button"
              />
            </Tooltip>
          </Space.Compact>
        </Card>
      </div>
    </div>
  );
};

export default AIChat;
