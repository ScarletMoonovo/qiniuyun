import { LoadingOutlined, RobotOutlined, SoundOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Space, Tag, Tooltip, Typography } from 'antd';
import moment from 'moment';
import React from 'react';
import './index.less';

const { Text, Paragraph } = Typography;

export interface MessageItemProps {
  /** 消息数据 */
  message: API.ChatMessage;
  /** 角色信息（用于显示角色头像和名称） */
  role?: API.Role;
  /** 用户信息（用于显示用户头像和名称） */
  user?: API.User;
  /** 是否显示时间戳 */
  showTimestamp?: boolean;
  /** 是否显示头像 */
  showAvatar?: boolean;
  /** 语音消息播放状态 */
  voiceStatus?: 'idle' | 'playing' | 'loading';
  /** 语音消息播放回调 */
  onPlayVoice?: (messageId: string) => void;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * 聊天消息组件
 * 支持文本消息显示和实时语音通话状态显示
 */
const MessageItem: React.FC<MessageItemProps> = ({
  message,
  role,
  user,
  showTimestamp = true,
  showAvatar = true,
  voiceStatus = 'idle',
  onPlayVoice,
  className,
}) => {
  const isUserMessage = message.sender === 'user';
  const isRoleMessage = message.sender === 'role';

  // 获取发送者信息
  const getSenderInfo = () => {
    if (isUserMessage && user) {
      return {
        name: user.name || '用户',
        avatar: user.avatar,
        icon: <UserOutlined />,
      };
    }
    if (isRoleMessage && role) {
      return {
        name: role.name || '角色',
        avatar: role.avatar,
        icon: <RobotOutlined />,
      };
    }
    return {
      name: isUserMessage ? '用户' : '角色',
      avatar: undefined,
      icon: isUserMessage ? <UserOutlined /> : <RobotOutlined />,
    };
  };

  const senderInfo = getSenderInfo();

  // 格式化时间戳
  const formatTimestamp = (timestamp: string) => {
    try {
      return moment(timestamp).fromNow();
    } catch (error) {
      return '';
    }
  };

  // 处理语音播放
  const handlePlayVoice = () => {
    if (onPlayVoice && message.id) {
      onPlayVoice(message.id);
    }
  };

  // 渲染语音状态图标
  const renderVoiceIcon = () => {
    if (voiceStatus === 'loading') {
      return <LoadingOutlined spin />;
    }
    if (voiceStatus === 'playing') {
      return <SoundOutlined style={{ color: '#1890ff' }} />;
    }
    return <SoundOutlined />;
  };

  return (
    <div
      className={`message-item ${isUserMessage ? 'user-message' : 'role-message'} ${
        className || ''
      }`}
    >
      <div className="message-content">
        {/* 头像区域 */}
        {showAvatar && (
          <div className="message-avatar">
            <Avatar
              size={36}
              src={senderInfo.avatar}
              icon={senderInfo.icon}
              style={{
                backgroundColor: isUserMessage ? '#1890ff' : '#52c41a',
              }}
            />
          </div>
        )}

        {/* 消息主体 */}
        <div className="message-body">
          {/* 发送者名称和时间戳 */}
          <div className="message-header">
            <Space size="small">
              <Text strong className="sender-name">
                {senderInfo.name}
              </Text>
              {showTimestamp && (
                <Text type="secondary" className="message-time">
                  {formatTimestamp(message.timestamp)}
                </Text>
              )}
            </Space>
          </div>

          {/* 消息气泡 */}
          <div className="message-bubble">
            {/* 文本消息内容 */}
            {message.type === 'text' && (
              <div className="text-content">
                <Paragraph className="message-text" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  {message.content}
                </Paragraph>
              </div>
            )}

            {/* 语音消息状态（如果有语音功能） */}
            {message.type === 'text' && onPlayVoice && (
              <div className="voice-controls">
                <Tooltip
                  title={
                    voiceStatus === 'playing'
                      ? '正在播放'
                      : voiceStatus === 'loading'
                      ? '加载中'
                      : '播放语音'
                  }
                >
                  <div className={`voice-button ${voiceStatus}`} onClick={handlePlayVoice}>
                    {renderVoiceIcon()}
                  </div>
                </Tooltip>
              </div>
            )}

            {/* 消息状态标签 */}
            <div className="message-status">
              {message.type === 'text' && (
                <Tag color="default" style={{ fontSize: '12px', padding: '0 4px' }}>
                  文本
                </Tag>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
