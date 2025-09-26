import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Spin, Empty, Button, message } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import MessageItem from '../MessageItem';
import './index.less';

export interface MessageListProps {
  /** 消息列表数据 */
  messages: API.ChatMessage[];
  /** 角色信息 */
  role?: API.Role;
  /** 用户信息 */
  user?: API.User;
  /** 是否正在加载 */
  loading?: boolean;
  /** 是否有更多消息可加载 */
  hasMore?: boolean;
  /** 是否显示时间戳 */
  showTimestamp?: boolean;
  /** 是否显示头像 */
  showAvatar?: boolean;
  /** 语音播放状态映射 */
  voiceStatusMap?: Record<string, 'idle' | 'playing' | 'loading'>;
  /** 加载更多消息回调 */
  onLoadMore?: () => void;
  /** 语音播放回调 */
  onPlayVoice?: (messageId: string) => void;
  /** 自定义样式类名 */
  className?: string;
  /** 自定义空状态 */
  emptyText?: string;
  /** 是否自动滚动到底部 */
  autoScrollToBottom?: boolean;
  /** 滚动到底部阈值（像素） */
  scrollThreshold?: number;
}

/**
 * 聊天消息列表组件
 * 支持消息滚动加载、自动滚动到底部等功能
 */
const MessageList: React.FC<MessageListProps> = ({
  messages = [],
  role,
  user,
  loading = false,
  hasMore = false,
  showTimestamp = true,
  showAvatar = true,
  voiceStatusMap = {},
  onLoadMore,
  onPlayVoice,
  className,
  emptyText = '暂无消息',
  autoScrollToBottom = true,
  scrollThreshold = 100,
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // 滚动到底部
  const scrollToBottom = useCallback((smooth = true) => {
    if (listRef.current) {
      listRef.current.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, []);

  // 检查是否接近底部
  const isNearBottom = useCallback(() => {
    if (!listRef.current) return false;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    return scrollHeight - scrollTop - clientHeight <= scrollThreshold;
  }, [scrollThreshold]);

  // 处理滚动事件
  const handleScroll = useCallback(() => {
    if (!listRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    const isAtBottom = isNearBottom();
    
    // 更新滚动到底部按钮的显示状态
    setShowScrollToBottom(!isAtBottom && messages.length > 0);

    // 标记用户正在滚动
    setIsUserScrolling(true);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 150);

    // 检查是否需要加载更多消息（滚动到顶部附近）
    if (scrollTop <= 100 && hasMore && onLoadMore && !loading) {
      onLoadMore();
    }
  }, [hasMore, onLoadMore, loading, messages.length, isNearBottom]);

  // 当有新消息时自动滚动到底部
  useEffect(() => {
    if (autoScrollToBottom && !isUserScrolling && messages.length > 0) {
      // 延迟滚动，确保DOM已更新
      const timer = setTimeout(() => {
        if (isNearBottom() || messages.length === 1) {
          scrollToBottom();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [messages, autoScrollToBottom, isUserScrolling, scrollToBottom, isNearBottom]);

  // 组件挂载时滚动到底部
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(false);
    }
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // 处理加载更多
  const handleLoadMore = useCallback(() => {
    if (hasMore && onLoadMore && !loading) {
      onLoadMore();
    }
  }, [hasMore, onLoadMore, loading]);

  // 处理语音播放
  const handlePlayVoice = useCallback((messageId: string) => {
    if (onPlayVoice) {
      onPlayVoice(messageId);
    }
  }, [onPlayVoice]);

  // 优化：检测相同发送者的连续消息
  const messagesWithSameSender = useMemo(() => {
    return messages.map((message, index) => {
      const prevMessage = messages[index - 1];
      const isSameSender = prevMessage && prevMessage.sender === message.sender;
      return {
        ...message,
        isSameSender,
      };
    });
  }, [messages]);

  // 渲染加载更多按钮
  const renderLoadMoreButton = () => {
    if (!hasMore) return null;
    
    return (
      <div className="message-list-load-more">
        <Button
          type="text"
          size="small"
          loading={loading}
          onClick={handleLoadMore}
          disabled={loading}
        >
          {loading ? '加载中...' : '加载更多消息'}
        </Button>
      </div>
    );
  };

  // 渲染消息列表
  const renderMessages = () => {
    if (messages.length === 0) {
      return (
        <div className="message-list-empty">
          <Empty
            description={emptyText}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      );
    }

    return messagesWithSameSender.map((message, index) => (
      <div
        key={message.id}
        className={`message-list-item ${message.isSameSender ? 'same-sender' : ''}`}
      >
        <MessageItem
          message={message}
          role={message.sender === 'role' ? role : undefined}
          user={message.sender === 'user' ? user : undefined}
          showTimestamp={showTimestamp && !message.isSameSender}
          showAvatar={showAvatar && !message.isSameSender}
          voiceStatus={voiceStatusMap[message.id] || 'idle'}
          onPlayVoice={handlePlayVoice}
        />
      </div>
    ));
  };

  return (
    <div className={`message-list ${className || ''}`}>
      {/* 消息列表容器 */}
      <div
        ref={listRef}
        className="message-list-container"
        onScroll={handleScroll}
      >
        {/* 加载更多按钮（顶部） */}
        {renderLoadMoreButton()}
        
        {/* 消息列表 */}
        <div className="message-list-content">
          {renderMessages()}
        </div>

        {/* 底部加载指示器 */}
        {loading && messages.length === 0 && (
          <div className="message-list-loading">
            <Spin tip="加载消息中..." />
          </div>
        )}
      </div>

      {/* 滚动到底部按钮 */}
      {showScrollToBottom && (
        <div className="message-list-scroll-to-bottom">
          <Button
            type="primary"
            shape="circle"
            size="small"
            icon={<DownOutlined />}
            onClick={() => scrollToBottom()}
            title="滚动到底部"
          />
        </div>
      )}
    </div>
  );
};

export default MessageList;