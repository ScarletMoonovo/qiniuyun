import useWebSocket from '@/hooks/useWebSocket';
import useAliSpeechRecognition from '@/hooks/useAliSpeechRecognition';
import { newSession } from '@/services/backend/chat';
import { uploadToken } from '@/services/backend/api';
import TokenManager from '@/utils/token';
import {
  ArrowLeftOutlined,
  AudioOutlined,
  AudioMutedOutlined,
  LoadingOutlined,
  RobotOutlined,
  SendOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Card,
  Empty,
  Input,
  message,
  Space,
  Spin,
  Tooltip,
  Typography,
} from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { history, useLocation, useParams } from 'umi';
import './index.less';

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
  // 角色ID
  const id = params.id;
  // 会话ID（从查询参数中获取）
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const oldSessionId = urlParams.get('sessionId');
  const [messages, setMessages] = useState<ShowMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(
    oldSessionId ? parseInt(oldSessionId) : null,
  );
  const [characterInfo, setCharacterInfo] = useState<API.Character | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<any>(null);

  // WebSocket连接URL - 这里先使用模拟的URL，实际项目中需要根据后端配置
  const wsUrl = sessionId ? `ws://192.168.196.54:10086/api/chat/${sessionId}` : null;

  // 2. 缓存WebSocket选项，避免重复创建
  const webSocketOptions = useMemo(
    () => ({
      onOpen: () => {
        console.log('WebSocket连接已建立');
        message.success('连接成功');
        // 发送鉴权消息，按照RequestMessage格式
        sendMessage(
          JSON.stringify({
            type: 'auth',
            token: TokenManager.getAccessToken(),
            content: '',
          }),
        );
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
          protocol: target?.protocol,
        });

        message.error('WebSocket连接失败，请检查网络或服务器状态');
      },
      // 限制重连，避免无限循环
      reconnectLimit: 3,
      reconnectInterval: 5000,
    }),
    [],
  );

  const { sendMessage, readyState, lastMessage } = useWebSocket(wsUrl, webSocketOptions);

  // 语音识别Hook
  const speechRecognition = useAliSpeechRecognition({
    onTranscription: (text: string, isFinal: boolean) => {
      if (isFinal && text.trim()) {
        // 最终识别结果，发送消息
        handleVoiceMessage(text.trim());
        setVoiceText('');
      } else {
        // 实时识别结果，仅显示
        setVoiceText(text);
      }
    },
    onError: (error: string) => {
      console.error('语音识别错误:', error);
      message.error('语音识别失败: ' + error);
    },
    onConnected: () => {
      message.success('语音识别连接成功');
    },
    onDisconnected: () => {
      setIsVoiceMode(false);
      setVoiceText('');
      message.info('语音识别已断开');
    },
  });

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  //   // 处理流式消息更新的回调函数
  //   const handleStreamingUpdate = useCallback((content: string) => {
  //     setMessages((prev) => {
  //       const lastMsg = prev[prev.length - 1];

  //       if (lastMsg && lastMsg.role === 'assistant' && lastMsg.status === 'streaming') {
  //         // 更新流式消息内容
  //         const updatedMessages = [...prev];
  //         const lastIndex = updatedMessages.length - 1;
  //         updatedMessages[lastIndex] = {
  //           ...updatedMessages[lastIndex],
  //           content: updatedMessages[lastIndex].content + content
  //         };
  //         return updatedMessages;
  //       } else {
  //         // 创建新的流式消息
  //         const streamingMessageId = `ai-streaming-${Date.now()}-${Math.random()}`;
  //         const streamingMessage: ShowMessage = {
  //           id: streamingMessageId,
  //           content: content,
  //           role: 'assistant',
  //           timestamp: Date.now(),
  //           status: 'streaming',
  //         };
  //         return [...prev, streamingMessage];
  //       }
  //     });
  //   }, []);

  // id存在且sessionId为空时初始化会话
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

  // 处理语音消息
  const handleVoiceMessage = async (voiceContent: string) => {
    if (!voiceContent.trim()) return;

    const userMessage: ShowMessage = {
      id: `voice-user-${Date.now()}`,
      content: voiceContent.trim(),
      role: 'user',
      timestamp: Date.now(),
      status: 'sending',
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      // 通过WebSocket发送语音消息，使用voice类型
      if (readyState === WebSocket.OPEN) {
        const voiceRequestMessage = {
          type: 'voice',
          content: voiceContent.trim(),
        };
        sendMessage(JSON.stringify(voiceRequestMessage));

        // 更新消息状态为已发送
        setMessages((prev) =>
          prev.map((msg) => (msg.id === userMessage.id ? { ...msg, status: 'sent' } : msg)),
        );
      } else {
        // WebSocket未连接，标记为失败
        setMessages((prev) =>
          prev.map((msg) => (msg.id === userMessage.id ? { ...msg, status: 'failed' } : msg)),
        );
        message.error('连接已断开，语音消息发送失败');
      }
    } catch (error) {
      console.error('发送语音消息失败:', error);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === userMessage.id ? { ...msg, status: 'failed' } : msg)),
      );
      message.error('发送语音消息失败');
    }
  };

  // 切换语音模式
  const toggleVoiceMode = async () => {
    if (!isVoiceMode) {
      try {
        // 固定的阿里云语音识别AppKey
        const appkey = 'gEoJFpChxpzCPHky';
        
        // 通过后端接口获取token
        message.loading('正在获取语音识别授权...', 0);
        const tokenResponse = await uploadToken({url: 'https://api.ai-chat.com/api/upload/token'});
        message.destroy();
        
        if (!tokenResponse?.token) {
          message.error('获取语音识别授权失败');
          return;
        }

        speechRecognition.connect({
          appkey,
          token: tokenResponse.token,
          enableIntermediate: true,
        });
        setIsVoiceMode(true);
      } catch (error) {
        message.destroy();
        console.error('获取语音识别token失败:', error);
        message.error('获取语音识别授权失败，请稍后重试');
      }
    } else {
      speechRecognition.disconnect();
      setIsVoiceMode(false);
    }
  };

  // 开始/停止录音
  const toggleRecording = () => {
    if (speechRecognition.isRecording) {
      speechRecognition.stopRecording();
    } else {
      speechRecognition.startRecording();
    }
  };

  // 处理接收到的WebSocket消息
  useEffect(() => {
    if (lastMessage) {
      const { type, msg, content, audio } = lastMessage;

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
        // // 流式数据 - 使用专门的回调函数处理
        // handleStreamingUpdate(content);
        // 流式数据 - 追加到最后一条AI消息
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.role === 'assistant' && lastMsg.status === 'streaming') {
            // 更新最后一条流式消息
            return prev.map((msg, index) =>
              index === prev.length - 1 ? { ...msg, content: msg.content + content } : msg,
            );
          } else {
            // 创建新的流式消息
            const streamingMessage: ShowMessage = {
              id: `ai-streaming-${Date.now()}`,
              content: content,
              role: 'assistant',
              timestamp: Date.now(),
              status: 'streaming',
            };
            return [...prev, streamingMessage];
          }
        });
      } else if (type === 'done') {
        // 流式数据结束，更新消息状态
        setMessages((prev) =>
          prev.map((msg) =>
            msg.role === 'assistant' && msg.status === 'streaming'
              ? { ...msg, status: 'sent' }
              : msg,
          ),
        );
      } else if (type === 'audio' && audio) {
        // 处理语音数据
        console.log('收到语音数据:', audio);
        try {
          // 这里可以添加播放音频的逻辑
          // 例如：创建AudioContext，播放ArrayBuffer格式的音频数据
          // const audioContext = new AudioContext();
          // const audioBuffer = await audioContext.decodeAudioData(audio);
          // const source = audioContext.createBufferSource();
          // source.buffer = audioBuffer;
          // source.connect(audioContext.destination);
          // source.start();
          
          message.info('收到语音回复');
        } catch (error) {
          console.error('处理语音数据失败:', error);
        }
      }
    }
    //   }, [lastMessage, handleStreamingUpdate]);
  }, [lastMessage]);

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
      // 通过WebSocket发送消息，按照RequestMessage格式
      if (readyState === WebSocket.OPEN) {
        const textRequestMessage = {
          type: 'text',
          content: messageContent,
        };
        sendMessage(JSON.stringify(textRequestMessage));

        // 更新消息状态为已发送
        setMessages((prev) =>
          prev.map((msg) => (msg.id === userMessage.id ? { ...msg, status: 'sent' } : msg)),
        );
      } else {
        // WebSocket未连接，模拟AI回复
        setMessages((prev) =>
          prev.map((msg) => (msg.id === userMessage.id ? { ...msg, status: 'sent' } : msg)),
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
        prev.map((msg) => (msg.id === userMessage.id ? { ...msg, status: 'failed' } : msg)),
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
    if (id && !sessionId) {
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
              {speechRecognition.isConnected && ' • 语音已连接'}
            </Text>
          </div>
        </div>
        <div className="header-actions">
          <Tooltip title={isVoiceMode ? '关闭语音模式' : '开启语音聊天'}>
            <Button
              type={isVoiceMode ? 'primary' : 'default'}
              icon={isVoiceMode ? <AudioOutlined /> : <AudioMutedOutlined />}
              onClick={toggleVoiceMode}
              className="voice-button"
              loading={isVoiceMode && !speechRecognition.isConnected}
            />
          </Tooltip>
          {isVoiceMode && speechRecognition.isConnected && (
            <Tooltip title={speechRecognition.isRecording ? '停止录音' : '开始录音'}>
              <Button
                type={speechRecognition.isRecording ? 'primary' : 'default'}
                icon={<AudioOutlined />}
                onClick={toggleRecording}
                className={speechRecognition.isRecording ? 'recording-button' : ''}
              />
            </Tooltip>
          )}
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
                  {message.status === 'sending' && <LoadingOutlined className="message-status" />}
                  {message.status === 'streaming' && <span className="streaming-cursor">|</span>}
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
        {/* 语音状态显示 */}
        {isVoiceMode && speechRecognition.isConnected && (
          <Card className="voice-status-card" style={{ marginBottom: 12 }}>
            <Space align="center">
              <AudioOutlined className={speechRecognition.isRecording ? 'recording' : ''} />
              <Text>
                {speechRecognition.isRecording 
                  ? (voiceText || speechRecognition.currentText || '正在听取中...') 
                  : '点击录音按钮开始语音聊天'
                }
              </Text>
              {speechRecognition.isRecording && <span className="recording-indicator">●</span>}
            </Space>
          </Card>
        )}
        
        <Card className="input-card">
          <Space.Compact style={{ display: 'flex', width: '100%' }}>
            <TextArea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isVoiceMode ? "语音模式已开启，可直接说话或输入文字..." : "输入消息... (Enter发送，Shift+Enter换行)"}
              autoSize={{ minRows: 1, maxRows: 4 }}
              className="message-input"
              disabled={speechRecognition.isRecording}
            />
            <Tooltip title="发送消息">
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || speechRecognition.isRecording}
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
