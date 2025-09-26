// 前端WebSocket连接相关类型定义

declare namespace WebSocket {
  // WebSocket连接状态和事件类型定义
  type Status = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

  type ConnectionConfig = {
    url: string;
    protocols?: string[];
    reconnect?: boolean;
    maxReconnectAttempts?: number;
    reconnectInterval?: number;
    heartbeatInterval?: number;
    timeout?: number;
  };

  type Event = {
    type: 'open' | 'close' | 'error' | 'message' | 'heartbeat';
    data?: any;
    timestamp: number;
  };

  type EventHandlers = {
    onOpen?: () => void;
    onClose?: (event: CloseEvent) => void;
    onError?: (error: Event) => void;
    onMessage?: (message: any) => void;
    onStatusChange?: (status: Status) => void;
    onReconnect?: (attempt: number) => void;
  };

  // WebSocket服务接口类型
  type ServiceInterface = {
    connect: (config: ConnectionConfig) => Promise<void>;
    disconnect: () => void;
    send: (message: any) => boolean;
    setHandlers: (handlers: EventHandlers) => void;
    getStatus: () => Status;
    isConnected: () => boolean;
  };

  // 语音会话控制消息
  type VoiceSessionControlMessage = {
    type: 'voice_session_start' | 'voice_session_end';
    payload: {
      roleId: number;
      sessionId: string;
      config?: Voice.STTConfig;
    };
  };

  // 服务状态消息
  type ServiceStatusMessage = {
    type: 'stt_status' | 'backend_status';
    payload: {
      status: Voice.STTStatus | Status;
      message?: string;
      error?: Voice.STTError;
    };
  };
}
