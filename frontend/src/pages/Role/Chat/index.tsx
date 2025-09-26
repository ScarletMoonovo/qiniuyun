import { ChatModeSwitch, MessageList, TextChatInput, type ChatMode } from '@/components/Chat';
import { RealtimeVoiceControls } from '@/components/Voice';
import { newSession } from '@/services/backend/chat';
import { getRoleDetail } from '@/services/backend/role';
import { ArrowLeftOutlined, MoreOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Alert, Avatar, Button, message, Space, Spin, Typography } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { history, useParams } from 'umi';
import './index.less';

const { Title, Text } = Typography;

/**
 * 生成模拟AI回复（实际项目中应调用真实API）
 */
const generateMockAIResponse = (userMessage: string, role: API.Role): string => {
  const responses = [
    `作为${role.name}，我想说：${userMessage}这个话题很有趣！`,
    `${userMessage}？让我想想...这确实是个值得深思的问题。`,
    `我理解你的想法。从我的角度来看，${userMessage.toLowerCase()}有着特殊的意义。`,
    `${role.name}的性格让我对此有独特的看法：${userMessage}确实值得我们探讨。`,
    `你提到的${userMessage}让我想起了一些往事...`,
  ];

  return responses[Math.floor(Math.random() * responses.length)];
};

/**
 * 角色聊天页面
 * 集成文本聊天和实时语音对话功能
 */
const RoleChat: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const roleId = parseInt(id || '0', 10);

  // 页面状态
  const [role, setRole] = useState<API.Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatMode, setChatMode] = useState<ChatMode>('text');
  const [messages, setMessages] = useState<API.ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  const [voiceStatusMap, setVoiceStatusMap] = useState<
    Record<string, 'idle' | 'playing' | 'loading'>
  >({});

  // 音频播放相关
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);

  // 初始化页面数据
  useEffect(() => {
    const initializePage = async () => {
      if (!roleId) {
        setError('无效的角色ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // 获取角色详情
        const roleResponse = await getRoleDetail({ id: roleId });
        setRole(roleResponse.role);

        // 创建聊天会话
        const sessionResponse = await newSession({
          character_id: roleId,
          title: `与${roleResponse.role.name}的对话`,
        });
        setSessionId(sessionResponse.session_id.toString());

        // 添加欢迎消息
        const welcomeMessage: API.ChatMessage = {
          id: 'welcome_1',
          roleId,
          userId: 1,
          content:
            roleResponse.role.quotes?.[0] ||
            `你好！我是${roleResponse.role.name}，很高兴与你对话！`,
          type: 'text',
          sender: 'role',
          timestamp: new Date().toISOString(),
        };
        setMessages([welcomeMessage]);
      } catch (err) {
        console.error('初始化聊天页面失败:', err);
        setError('加载角色信息失败，请重试');
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, [roleId]);

  // 初始化音频上下文
  useEffect(() => {
    const initAudioContext = () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioContextRef.current = new AudioContextClass();
        }
      } catch (error) {
        console.warn('音频上下文初始化失败:', error);
      }
    };

    initAudioContext();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // 处理文本消息发送
  const handleSendTextMessage = useCallback(
    async (content: string) => {
      if (!sessionId || !roleId) {
        message.error('会话未初始化，请刷新页面重试');
        return;
      }

      try {
        setIsTyping(true);

        // 添加用户消息到界面
        const userMessage: API.ChatMessage = {
          id: `temp_${Date.now()}`,
          roleId,
          userId: 1, // TODO: 从用户状态获取
          content,
          type: 'text',
          sender: 'user',
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMessage]);

        // 模拟AI回复（实际项目中应调用真实API）
        setTimeout(() => {
          const aiMessage: API.ChatMessage = {
            id: `ai_${Date.now()}`,
            roleId,
            userId: 1,
            content: generateMockAIResponse(content, role),
            type: 'text',
            sender: 'role',
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, aiMessage]);
        }, 1000 + Math.random() * 2000); // 模拟1-3秒的响应时间
      } catch (error) {
        console.error('发送消息失败:', error);
        message.error('发送消息失败，请重试');

        // 移除失败的消息
        setMessages((prev) => prev.filter((msg) => msg.id !== `temp_${Date.now()}`));
      } finally {
        setIsTyping(false);
      }
    },
    [sessionId, roleId],
  );

  // 处理语音识别文本接收
  const handleVoiceTextReceived = useCallback(
    (text: string, isFinal: boolean) => {
      console.log('语音识别结果:', text, 'isFinal:', isFinal);

      if (isFinal && text.trim()) {
        // 最终识别结果，添加用户消息到界面
        // 注意：STT服务已经通过WebSocket发送文本到后端，这里只需要更新UI
        const userMessage: API.ChatMessage = {
          id: `voice_${Date.now()}`,
          roleId,
          userId: 1, // TODO: 从用户状态获取
          content: text.trim(),
          type: 'text',
          sender: 'user',
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, userMessage]);
        setIsTyping(true); // 等待AI回复
      }
    },
    [roleId],
  );

  // 处理AI消息接收
  const handleAIMessageReceived = useCallback((aiMessage: API.ChatMessage) => {
    console.log('收到AI文本回复:', aiMessage);
    setMessages(prev => [...prev, aiMessage]);
    setIsTyping(false);
  }, []);

  // 处理TTS音频接收和播放
  const handleAudioReceived = useCallback(async (audioData: ArrayBuffer, isLast: boolean) => {
    console.log('收到TTS音频数据:', audioData.byteLength, 'bytes, isLast:', isLast);

    try {
      if (!audioContextRef.current) {
        console.warn('音频上下文未初始化');
        return;
      }

      // 将音频数据添加到队列
      audioQueueRef.current.push(audioData);

      // 如果当前没有播放，开始播放
      if (!isPlayingRef.current) {
        await playAudioQueue();
      }
    } catch (error) {
      console.error('音频播放失败:', error);
      message.error('音频播放失败');
    }
  }, []);

  // 播放音频队列
  const playAudioQueue = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) {
      return;
    }

    isPlayingRef.current = true;

    try {
      while (audioQueueRef.current.length > 0) {
        const audioData = audioQueueRef.current.shift();
        if (audioData && audioContextRef.current) {
          const audioBuffer = await audioContextRef.current.decodeAudioData(audioData);
          const source = audioContextRef.current.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContextRef.current.destination);

          // 等待音频播放完成
          await new Promise<void>((resolve) => {
            source.onended = () => resolve();
            source.start();
          });
        }
      }
    } catch (error) {
      console.error('音频播放队列处理失败:', error);
    } finally {
      isPlayingRef.current = false;
    }
  }, []);

  // 处理语音播放（消息列表中的语音按钮）
  const handlePlayVoice = useCallback((messageId: string) => {
    console.log('播放语音消息:', messageId);

    setVoiceStatusMap((prev) => ({
      ...prev,
      [messageId]: 'loading',
    }));

    // 模拟语音播放过程
    setTimeout(() => {
      setVoiceStatusMap((prev) => ({
        ...prev,
        [messageId]: 'playing',
      }));

      setTimeout(() => {
        setVoiceStatusMap((prev) => ({
          ...prev,
          [messageId]: 'idle',
        }));
      }, 3000);
    }, 1000);
  }, []);

  // 处理聊天模式切换
  const handleModeChange = useCallback((newMode: ChatMode) => {
    setChatMode(newMode);
    console.log('聊天模式切换到:', newMode);
  }, []);

  // 处理返回按钮
  const handleGoBack = useCallback(() => {
    history.goBack();
  }, []);

  // 渲染加载状态
  if (loading) {
    return (
      <PageContainer>
        <div className="chat-loading">
          <Spin size="large" tip="加载中..." />
        </div>
      </PageContainer>
    );
  }

  // 渲染错误状态
  if (error || !role) {
    return (
      <PageContainer>
        <Alert
          type="error"
          message="加载失败"
          description={error || '角色信息加载失败'}
          showIcon
          action={
            <Space>
              <Button size="small" onClick={() => window.location.reload()}>
                重试
              </Button>
              <Button size="small" type="primary" onClick={handleGoBack}>
                返回
              </Button>
            </Space>
          }
        />
      </PageContainer>
    );
  }

  return (
    <div className="role-chat-page">
      {/* 聊天头部 */}
      <div className="chat-header">
        <div className="header-content">
          <div className="header-left">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={handleGoBack}
              className="back-button"
            />
            <Avatar size={40} src={role.avatar} className="role-avatar" />
            <div className="role-info">
              <Title level={4} className="role-name">
                {role.name}
              </Title>
              <Text type="secondary" className="role-status">
                在线
              </Text>
            </div>
          </div>
          <div className="header-right">
            <Button type="text" icon={<MoreOutlined />} className="more-button" />
          </div>
        </div>
      </div>

      {/* 聊天模式切换 */}
      <div className="chat-mode-section">
        <ChatModeSwitch mode={chatMode} onChange={handleModeChange} showDescription={false} />
      </div>

      {/* 聊天内容区域 */}
      <div className="chat-content">
        {/* 消息列表 */}
        <div className="message-section">
          <MessageList
            messages={messages}
            role={role}
            loading={isTyping}
            showTimestamp={true}
            showAvatar={true}
            voiceStatusMap={voiceStatusMap}
            onPlayVoice={handlePlayVoice}
            emptyText="开始与角色对话吧！"
          />
        </div>

        {/* 输入区域 */}
        <div className="input-section">
          {chatMode === 'text' ? (
            <TextChatInput
              onSendMessage={handleSendTextMessage}
              loading={isTyping}
              placeholder={`与 ${role.name} 对话...`}
              maxLength={1000}
            />
          ) : (
            <RealtimeVoiceControls
              roleId={roleId}
              sessionId={sessionId}
              onTextReceived={handleVoiceTextReceived}
              onAudioReceived={handleAudioReceived}
              onAIMessageReceived={handleAIMessageReceived}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default RoleChat;
