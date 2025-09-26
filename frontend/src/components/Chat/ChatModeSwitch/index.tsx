import { AudioOutlined, ExclamationCircleOutlined, MessageOutlined } from '@ant-design/icons';
import { Alert, message, Radio, Space, Tooltip } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import './index.less';

export type ChatMode = 'text' | 'voice';

export interface ChatModeSwitchProps {
  /** 当前聊天模式 */
  mode: ChatMode;
  /** 模式切换回调 */
  onChange: (mode: ChatMode) => void;
  /** 是否禁用切换 */
  disabled?: boolean;
  /** 是否显示模式说明 */
  showDescription?: boolean;
  /** 自定义样式类名 */
  className?: string;
  /** 强制禁用语音模式（用于测试） */
  forceDisableVoice?: boolean;
}

/**
 * 聊天模式切换组件
 * 支持文本聊天和实时语音对话模式切换，自动检测浏览器兼容性
 */
const ChatModeSwitch: React.FC<ChatModeSwitchProps> = ({
  mode,
  onChange,
  disabled = false,
  showDescription = true,
  className,
  forceDisableVoice = false,
}) => {
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [webSocketSupported, setWebSocketSupported] = useState(false);
  const [mediaRecorderSupported, setMediaRecorderSupported] = useState(false);
  const [audioContextSupported, setAudioContextSupported] = useState(false);
  const [compatibilityChecked, setCompatibilityChecked] = useState(false);
  const [compatibilityWarnings, setCompatibilityWarnings] = useState<string[]>([]);

  // 检测浏览器兼容性
  const checkBrowserCompatibility = useCallback(async () => {
    const warnings: string[] = [];
    let voiceAvailable = true;

    try {
      // 检测WebSocket支持
      const wsSupported = typeof WebSocket !== 'undefined';
      setWebSocketSupported(wsSupported);
      if (!wsSupported) {
        warnings.push('当前浏览器不支持WebSocket，语音功能不可用');
        voiceAvailable = false;
      }

      // 检测MediaRecorder API支持
      const mrSupported = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported;
      setMediaRecorderSupported(mrSupported);
      if (!mrSupported) {
        warnings.push('当前浏览器不支持MediaRecorder API，无法录制音频');
        voiceAvailable = false;
      }

      // 检测AudioContext支持
      const acSupported =
        typeof AudioContext !== 'undefined' ||
        typeof (window as any).webkitAudioContext !== 'undefined';
      setAudioContextSupported(acSupported);
      if (!acSupported) {
        warnings.push('当前浏览器不支持AudioContext，音频处理功能受限');
        voiceAvailable = false;
      }

      // 检测麦克风权限（不直接请求权限，只检测API可用性）
      if (
        typeof navigator.mediaDevices === 'undefined' ||
        typeof navigator.mediaDevices.getUserMedia === 'undefined'
      ) {
        warnings.push('当前浏览器不支持麦克风访问API');
        voiceAvailable = false;
      }

      // 检测HTTPS环境（某些浏览器要求HTTPS才能使用麦克风）
      if (
        location.protocol !== 'https:' &&
        location.hostname !== 'localhost' &&
        location.hostname !== '127.0.0.1'
      ) {
        warnings.push('语音功能需要HTTPS环境或本地开发环境');
        voiceAvailable = false;
      }

      // 强制禁用语音模式（用于测试）
      if (forceDisableVoice) {
        warnings.push('语音功能已被禁用（测试模式）');
        voiceAvailable = false;
      }

      setVoiceSupported(voiceAvailable);
      setCompatibilityWarnings(warnings);

      // 如果当前是语音模式但不支持，自动切换到文本模式
      if (mode === 'voice' && !voiceAvailable) {
        onChange('text');
        message.warning('语音功能不可用，已自动切换到文本模式');
      }
    } catch (error) {
      console.error('兼容性检测失败:', error);
      warnings.push('兼容性检测失败，语音功能可能不可用');
      setVoiceSupported(false);
      setCompatibilityWarnings(warnings);

      if (mode === 'voice') {
        onChange('text');
      }
    } finally {
      setCompatibilityChecked(true);
    }
  }, [mode, onChange, forceDisableVoice]);

  // 组件挂载时检测兼容性
  useEffect(() => {
    checkBrowserCompatibility();
  }, [checkBrowserCompatibility]);

  // 处理模式切换
  const handleModeChange = useCallback(
    (newMode: ChatMode) => {
      if (disabled) return;

      // 如果切换到语音模式但不支持，显示警告
      if (newMode === 'voice' && !voiceSupported) {
        message.error('当前环境不支持语音功能，请使用文本模式');
        return;
      }

      onChange(newMode);

      // 显示切换成功提示
      const modeText = newMode === 'text' ? '文本聊天' : '语音对话';
      message.success(`已切换到${modeText}模式`);
    },
    [disabled, voiceSupported, onChange],
  );

  // 获取模式选项配置
  const getModeOptions = () => {
    return [
      {
        label: (
          <Space>
            <MessageOutlined />
            <span>文本聊天</span>
          </Space>
        ),
        value: 'text',
        disabled: false,
      },
      {
        label: (
          <Space>
            <AudioOutlined />
            <span>语音对话</span>
            {!voiceSupported && compatibilityChecked && (
              <Tooltip title="当前环境不支持语音功能">
                <ExclamationCircleOutlined style={{ color: '#faad14' }} />
              </Tooltip>
            )}
          </Space>
        ),
        value: 'voice',
        disabled: !voiceSupported || disabled,
      },
    ];
  };

  // 渲染兼容性警告
  const renderCompatibilityWarning = () => {
    if (!showDescription || compatibilityWarnings.length === 0) return null;

    return (
      <Alert
        type="warning"
        showIcon
        message="语音功能兼容性提示"
        description={
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {compatibilityWarnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        }
        style={{ marginTop: '12px' }}
        closable
      />
    );
  };

  // 渲染模式说明
  const renderModeDescription = () => {
    if (!showDescription) return null;

    const descriptions = {
      text: '通过文字与AI角色进行对话交流，支持多行输入和快捷键发送',
      voice: '通过语音与AI角色进行实时对话，支持语音识别和语音合成',
    };

    return (
      <div className="mode-description">
        <div className="description-text">{descriptions[mode]}</div>
        {mode === 'voice' && voiceSupported && (
          <div className="voice-tips">
            <Space size="small">
              <span>💡 提示：</span>
              <span>确保麦克风权限已开启，在安静环境中获得最佳体验</span>
            </Space>
          </div>
        )}
      </div>
    );
  };

  // 渲染兼容性状态
  const renderCompatibilityStatus = () => {
    if (!showDescription || !compatibilityChecked) return null;

    return (
      <div className="compatibility-status">
        <Space size="middle">
          <div className="status-item">
            <span className="status-label">WebSocket:</span>
            <span className={`status-value ${webSocketSupported ? 'supported' : 'unsupported'}`}>
              {webSocketSupported ? '✓' : '✗'}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">录音:</span>
            <span
              className={`status-value ${mediaRecorderSupported ? 'supported' : 'unsupported'}`}
            >
              {mediaRecorderSupported ? '✓' : '✗'}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">音频处理:</span>
            <span className={`status-value ${audioContextSupported ? 'supported' : 'unsupported'}`}>
              {audioContextSupported ? '✓' : '✗'}
            </span>
          </div>
        </Space>
      </div>
    );
  };

  return (
    <div className={`chat-mode-switch ${className || ''}`}>
      {/* 模式切换器 */}
      <div className="mode-selector">
        <Radio.Group
          value={mode}
          onChange={(e) => handleModeChange(e.target.value)}
          disabled={disabled}
          buttonStyle="solid"
          size="large"
        >
          {getModeOptions().map((option) => (
            <Radio.Button key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </Radio.Button>
          ))}
        </Radio.Group>
      </div>

      {/* 模式说明 */}
      {renderModeDescription()}

      {/* 兼容性状态 */}
      {renderCompatibilityStatus()}

      {/* 兼容性警告 */}
      {renderCompatibilityWarning()}
    </div>
  );
};

export default ChatModeSwitch;
