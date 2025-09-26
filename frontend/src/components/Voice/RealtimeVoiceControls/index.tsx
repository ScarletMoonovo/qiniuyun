import { getAlicloudSTTService } from '@/utils/alicloudSTTService';
import { getSocketService } from '@/utils/socketService';
import {
  AudioMutedOutlined,
  AudioOutlined,
  DisconnectOutlined,
  LoadingOutlined,
  MutedOutlined,
  SoundOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { Badge, Button, message, Progress, Space, Tooltip } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import './index.less';

export interface RealtimeVoiceControlsProps {
  /** 角色ID */
  roleId: number;
  /** 会话ID */
  sessionId: string;
  /** 是否禁用语音功能 */
  disabled?: boolean;
  /** 语音识别结果回调 */
  onTextReceived?: (text: string, isFinal: boolean) => void;
  /** 音频播放回调 */
  onAudioReceived?: (audioData: ArrayBuffer, isLast: boolean) => void;
  /** AI文本回复接收回调 */
  onAIMessageReceived?: (message: API.ChatMessage) => void;
  /** 状态变化回调 */
  onStatusChange?: (status: 'idle' | 'listening' | 'processing' | 'speaking' | 'error') => void;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * 实时语音对话控制组件
 * 集成阿里云STT和后端WebSocket，提供完整的语音对话控制界面
 */
const RealtimeVoiceControls: React.FC<RealtimeVoiceControlsProps> = ({
  roleId,
  sessionId,
  disabled = false,
  onTextReceived,
  onAudioReceived,
  onAIMessageReceived,
  onStatusChange,
  className,
}) => {
  // 组件状态
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [sttStatus, setSTTStatus] = useState<Voice.STTStatus>('disconnected');
  const [socketStatus, setSocketStatus] = useState<
    'disconnected' | 'connecting' | 'connected' | 'error'
  >('disconnected');
  const [recognizedText, setRecognizedText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 服务实例引用
  const sttServiceRef = useRef(getAlicloudSTTService());
  const socketServiceRef = useRef(
    getSocketService(process.env.REACT_APP_WS_URL || 'ws://localhost:3001'),
  );

  // 获取当前状态
  const getCurrentStatus = useCallback(() => {
    if (error) return 'error';
    if (isSpeaking) return 'speaking';
    if (isProcessing) return 'processing';
    if (isListening) return 'listening';
    return 'idle';
  }, [error, isSpeaking, isProcessing, isListening]);

  // 状态变化通知
  useEffect(() => {
    const status = getCurrentStatus();
    onStatusChange?.(status);
  }, [getCurrentStatus, onStatusChange]);

  // 初始化服务
  useEffect(() => {
    const sttService = sttServiceRef.current;
    const socketService = socketServiceRef.current;

    // 设置STT服务事件处理器
    sttService.setHandlers({
      onStatusChange: (status) => {
        setSTTStatus(status);
        console.log('STT状态变化:', status);
      },
      onVolumeChange: (volume) => {
        setVolumeLevel(volume);
      },
      onTextReceived: (result) => {
        console.log('收到STT识别结果:', result);
        setRecognizedText(result.text);
        onTextReceived?.(result.text, result.isFinal);

        if (result.isFinal) {
          setIsProcessing(true);
          setIsListening(false);
        }
      },
      onError: (error) => {
        console.error('STT服务错误:', error);
        setError(error.message);
        setIsListening(false);
        setIsProcessing(false);
        message.error(`语音识别错误: ${error.message}`);
      },
    });

    // 设置WebSocket服务事件处理器
    socketService.setHandlers({
      onStatusChange: (status) => {
        setSocketStatus(status);
        console.log('WebSocket状态变化:', status);
      },
      onMessage: (message) => {
        // 处理AI文本回复消息
        if (message.type === 'chat_message') {
          const chatMessage = message as API.ChatWebSocketMessage;
          if (chatMessage.payload.message.sender === 'role' && 
              chatMessage.payload.message.roleId === roleId &&
              chatMessage.payload.sessionId === sessionId) {
            console.log('收到AI文本回复:', chatMessage.payload.message);
            setIsProcessing(false);
            onAIMessageReceived?.(chatMessage.payload.message);
          }
        }
      },
      onTTSAudio: (receivedRoleId, receivedSessionId, audioData, isLast) => {
        if (receivedRoleId === roleId && receivedSessionId === sessionId) {
          console.log('收到TTS音频数据:', audioData.byteLength, 'bytes, isLast:', isLast);
          setIsSpeaking(true);
          setIsProcessing(false);
          onAudioReceived?.(audioData, isLast);

          if (isLast) {
            setTimeout(() => {
              setIsSpeaking(false);
            }, 1000); // 给音频播放留出时间
          }
        }
      },
      onConnect: () => {
        console.log('WebSocket连接成功');
        setError(null);
      },
      onDisconnect: () => {
        console.log('WebSocket连接断开');
        setIsProcessing(false);
        setIsSpeaking(false);
      },
      onError: (error) => {
        console.error('WebSocket连接错误:', error);
        setError('网络连接错误');
        setIsProcessing(false);
        setIsSpeaking(false);
      },
    });

    // 组件卸载时清理
    return () => {
      sttService.stopRecognition();
      socketService.disconnect();
    };
  }, [roleId, sessionId, onTextReceived, onAudioReceived]);

  // 开始语音识别
  const startListening = useCallback(async () => {
    if (disabled || isListening || isProcessing || isSpeaking) return;

    try {
      setError(null);
      setRecognizedText('');

      // 确保WebSocket连接
      const socketService = socketServiceRef.current;
      if (socketStatus !== 'connected') {
        await socketService.connect();
      }

      // 开始STT识别
      const sttService = sttServiceRef.current;
      await sttService.startRecognition(roleId, sessionId);

      setIsListening(true);
      message.success('开始语音识别');
    } catch (error) {
      console.error('开始语音识别失败:', error);
      setError('启动语音识别失败');
      message.error('启动语音识别失败，请检查麦克风权限');
    }
  }, [disabled, isListening, isProcessing, isSpeaking, roleId, sessionId, socketStatus]);

  // 停止语音识别
  const stopListening = useCallback(async () => {
    if (!isListening) return;

    try {
      const sttService = sttServiceRef.current;
      await sttService.stopRecognition();

      setIsListening(false);
      setVolumeLevel(0);
      message.info('语音识别已停止');
    } catch (error) {
      console.error('停止语音识别失败:', error);
      setError('停止语音识别失败');
    }
  }, [isListening]);

  // 切换静音状态
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
    // TODO: 实现实际的静音功能
    message.info(isMuted ? '已取消静音' : '已静音');
  }, [isMuted]);

  // 获取主按钮的状态和样式
  const getMainButtonProps = () => {
    if (error) {
      return {
        type: 'default' as const,
        danger: true,
        icon: <DisconnectOutlined />,
        text: '连接错误',
        disabled: true,
      };
    }

    if (isSpeaking) {
      return {
        type: 'primary' as const,
        icon: <SoundOutlined />,
        text: 'AI正在回复...',
        disabled: true,
        loading: false,
      };
    }

    if (isProcessing) {
      return {
        type: 'primary' as const,
        icon: <LoadingOutlined spin />,
        text: '处理中...',
        disabled: true,
        loading: false,
      };
    }

    if (isListening) {
      return {
        type: 'primary' as const,
        danger: true,
        icon: <StopOutlined />,
        text: '停止录音',
        disabled: false,
        onClick: stopListening,
      };
    }

    return {
      type: 'primary' as const,
      icon: isMuted ? <AudioMutedOutlined /> : <AudioOutlined />,
      text: '开始语音对话',
      disabled: disabled || socketStatus !== 'connected',
      onClick: startListening,
    };
  };

  const mainButtonProps = getMainButtonProps();

  // 渲染连接状态指示器
  const renderConnectionStatus = () => (
    <Space size="small">
      <Tooltip title={`阿里云STT: ${sttStatus}`}>
        <Badge
          status={
            sttStatus === 'connected' ? 'success' : sttStatus === 'error' ? 'error' : 'default'
          }
          text="STT"
        />
      </Tooltip>
      <Tooltip title={`后端连接: ${socketStatus}`}>
        <Badge
          status={
            socketStatus === 'connected'
              ? 'success'
              : socketStatus === 'error'
              ? 'error'
              : 'default'
          }
          text="后端"
        />
      </Tooltip>
    </Space>
  );

  // 渲染音量指示器
  const renderVolumeIndicator = () => {
    if (!isListening) return null;

    return (
      <div className="volume-indicator">
        <div className="volume-label">音量</div>
        <Progress
          percent={volumeLevel}
          size="small"
          showInfo={false}
          strokeColor={volumeLevel > 70 ? '#ff4d4f' : volumeLevel > 30 ? '#faad14' : '#52c41a'}
        />
      </div>
    );
  };

  // 渲染识别文本
  const renderRecognizedText = () => {
    if (!recognizedText) return null;

    return (
      <div className="recognized-text">
        <div className="text-label">识别结果:</div>
        <div className="text-content">{recognizedText}</div>
      </div>
    );
  };

  return (
    <div className={`realtime-voice-controls ${className || ''}`}>
      {/* 主控制区域 */}
      <div className="main-controls">
        <Button size="large" shape="round" {...mainButtonProps} className="main-voice-button">
          {mainButtonProps.text}
        </Button>

        {/* 静音按钮 */}
        <Tooltip title={isMuted ? '取消静音' : '静音'}>
          <Button
            type="text"
            icon={isMuted ? <MutedOutlined /> : <SoundOutlined />}
            onClick={toggleMute}
            disabled={disabled}
            className="mute-button"
          />
        </Tooltip>
      </div>

      {/* 状态显示区域 */}
      <div className="status-display">
        {/* 连接状态 */}
        <div className="connection-status">{renderConnectionStatus()}</div>

        {/* 音量指示器 */}
        {renderVolumeIndicator()}

        {/* 识别文本 */}
        {renderRecognizedText()}

        {/* 错误信息 */}
        {error && (
          <div className="error-message">
            <span className="error-text">{error}</span>
          </div>
        )}
      </div>

      {/* 波形可视化区域（占位） */}
      {isListening && (
        <div className="voice-waveform">
          <div className="wave-bars">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className="wave-bar"
                style={{
                  animationDelay: `${index * 0.1}s`,
                  height: `${Math.max(20, volumeLevel * 0.8)}%`,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RealtimeVoiceControls;
