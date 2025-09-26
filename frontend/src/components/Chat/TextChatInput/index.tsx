import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Input, Button, Space, Tooltip, message } from 'antd';
import { SendOutlined, SmileOutlined, PaperClipOutlined } from '@ant-design/icons';
import './index.less';

const { TextArea } = Input;

export interface TextChatInputProps {
  /** 发送消息回调 */
  onSendMessage: (message: string) => void;
  /** 是否正在发送 */
  loading?: boolean;
  /** 是否禁用输入 */
  disabled?: boolean;
  /** 占位符文本 */
  placeholder?: string;
  /** 最大字符数限制 */
  maxLength?: number;
  /** 最大行数 */
  maxRows?: number;
  /** 最小行数 */
  minRows?: number;
  /** 是否显示字符计数 */
  showCount?: boolean;
  /** 是否启用快捷键发送 */
  enableShortcuts?: boolean;
  /** 自定义样式类名 */
  className?: string;
  /** 输入变化回调 */
  onChange?: (value: string) => void;
  /** 焦点变化回调 */
  onFocus?: () => void;
  onBlur?: () => void;
}

/**
 * 文本聊天输入组件
 * 支持多行文本输入、快捷键发送、输入验证等功能
 */
const TextChatInput: React.FC<TextChatInputProps> = ({
  onSendMessage,
  loading = false,
  disabled = false,
  placeholder = '输入消息...',
  maxLength = 1000,
  maxRows = 6,
  minRows = 1,
  showCount = true,
  enableShortcuts = true,
  className,
  onChange,
  onFocus,
  onBlur,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const textAreaRef = useRef<any>(null);

  // 处理输入变化
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);
    onChange?.(value);
  }, [onChange]);

  // 验证消息内容
  const validateMessage = useCallback((content: string): { valid: boolean; error?: string } => {
    const trimmedContent = content.trim();
    
    if (!trimmedContent) {
      return { valid: false, error: '消息内容不能为空' };
    }
    
    if (trimmedContent.length > maxLength) {
      return { valid: false, error: `消息内容不能超过${maxLength}个字符` };
    }

    // 基础的敏感词过滤（实际项目中应使用专业的过滤服务）
    const sensitiveWords = ['敏感词1', '敏感词2']; // 示例
    const hasSensitiveWord = sensitiveWords.some(word => 
      trimmedContent.toLowerCase().includes(word.toLowerCase())
    );
    
    if (hasSensitiveWord) {
      return { valid: false, error: '消息包含不当内容' };
    }

    return { valid: true };
  }, [maxLength]);

  // 发送消息
  const handleSendMessage = useCallback(() => {
    if (loading || disabled) return;

    const trimmedValue = inputValue.trim();
    const validation = validateMessage(trimmedValue);
    
    if (!validation.valid) {
      message.error(validation.error);
      return;
    }

    try {
      onSendMessage(trimmedValue);
      setInputValue('');
      
      // 发送后重新聚焦输入框
      setTimeout(() => {
        textAreaRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error('发送消息失败:', error);
      message.error('发送消息失败，请重试');
    }
  }, [inputValue, loading, disabled, onSendMessage, validateMessage]);

  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!enableShortcuts || isComposing) return;

    // Enter发送，Shift+Enter换行
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter 换行，不做处理，让默认行为执行
        return;
      } else {
        // Enter 发送消息
        e.preventDefault();
        handleSendMessage();
      }
    }

    // Ctrl+Enter 也可以发送消息
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [enableShortcuts, isComposing, handleSendMessage]);

  // 处理输入法组合事件
  const handleCompositionStart = useCallback(() => {
    setIsComposing(true);
  }, []);

  const handleCompositionEnd = useCallback(() => {
    setIsComposing(false);
  }, []);

  // 处理焦点事件
  const handleFocus = useCallback(() => {
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    onBlur?.();
  }, [onBlur]);

  // 自动调整高度
  useEffect(() => {
    if (textAreaRef.current) {
      const textArea = textAreaRef.current.resizableTextArea?.textArea;
      if (textArea) {
        textArea.style.height = 'auto';
        textArea.style.height = `${textArea.scrollHeight}px`;
      }
    }
  }, [inputValue]);

  // 计算剩余字符数
  const remainingChars = maxLength - inputValue.length;
  const isNearLimit = remainingChars <= 50;
  const isOverLimit = remainingChars < 0;

  return (
    <div className={`text-chat-input ${className || ''}`}>
      <div className="input-container">
        {/* 文本输入区域 */}
        <div className="textarea-wrapper">
          <TextArea
            ref={textAreaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            autoSize={{ minRows, maxRows }}
            showCount={false} // 我们自定义字符计数显示
            style={{
              resize: 'none',
              borderRadius: '12px',
              paddingRight: '60px', // 为发送按钮留出空间
            }}
          />
          
          {/* 发送按钮 */}
          <div className="send-button-wrapper">
            <Tooltip title={enableShortcuts ? 'Enter发送，Shift+Enter换行' : '点击发送'}>
              <Button
                type="primary"
                shape="circle"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                loading={loading}
                disabled={disabled || !inputValue.trim() || isOverLimit}
                size="small"
                className="send-button"
              />
            </Tooltip>
          </div>
        </div>

        {/* 底部工具栏 */}
        <div className="input-toolbar">
          <div className="toolbar-left">
            <Space size="small">
              {/* 表情按钮（占位） */}
              <Tooltip title="表情（即将推出）">
                <Button
                  type="text"
                  icon={<SmileOutlined />}
                  size="small"
                  disabled
                  className="toolbar-button"
                />
              </Tooltip>
              
              {/* 附件按钮（占位） */}
              <Tooltip title="附件（即将推出）">
                <Button
                  type="text"
                  icon={<PaperClipOutlined />}
                  size="small"
                  disabled
                  className="toolbar-button"
                />
              </Tooltip>
            </Space>
          </div>

          <div className="toolbar-right">
            {/* 字符计数 */}
            {showCount && (
              <div className={`char-count ${isNearLimit ? 'near-limit' : ''} ${isOverLimit ? 'over-limit' : ''}`}>
                {inputValue.length}/{maxLength}
              </div>
            )}
            
            {/* 快捷键提示 */}
            {enableShortcuts && (
              <div className="shortcut-hint">
                Enter发送
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextChatInput;