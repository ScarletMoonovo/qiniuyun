/**
 * WebSocket服务类
 * 用于管理与后端的实时通信连接
 */

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface SocketServiceOptions {
  url: string;
  reconnectInterval?: number; // 重连间隔，默认3000ms
  maxReconnectAttempts?: number; // 最大重连次数，默认5次
  heartbeatInterval?: number; // 心跳间隔，默认30000ms
}

export interface SocketEventHandlers {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (message: API.WebSocketMessage) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
  // WebRTC信令专用处理器
  onWebRTCOffer?: (roleId: number, sessionId: string, offer: RTCSessionDescriptionInit) => void;
  onWebRTCAnswer?: (roleId: number, sessionId: string, answer: RTCSessionDescriptionInit) => void;
  onWebRTCICECandidate?: (roleId: number, sessionId: string, candidate: RTCIceCandidateInit) => void;
  onVoiceCallStart?: (roleId: number, sessionId: string, callMode: 'realtime' | 'traditional') => void;
  onVoiceCallEnd?: (roleId: number, sessionId: string, duration: number) => void;
  onVoiceCallStatus?: (roleId: number, sessionId: string, status: string, quality?: string) => void;
}

export class SocketService {
  private socket: WebSocket | null = null;
  private status: ConnectionStatus = 'disconnected';
  private options: Required<SocketServiceOptions>;
  private handlers: SocketEventHandlers = {};
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private isManualClose = false;

  constructor(options: SocketServiceOptions) {
    this.options = {
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      ...options,
    };
  }

  /**
   * 设置事件处理器
   */
  public setHandlers(handlers: SocketEventHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * 连接WebSocket
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket && this.status === 'connected') {
        resolve();
        return;
      }

      this.isManualClose = false;
      this.setStatus('connecting');

      try {
        this.socket = new WebSocket(this.options.url);

        this.socket.onopen = () => {
          console.log('WebSocket连接成功');
          this.setStatus('connected');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.handlers.onConnect?.();
          resolve();
        };

        this.socket.onclose = (event) => {
          console.log('WebSocket连接关闭', event.code, event.reason);
          this.setStatus('disconnected');
          this.stopHeartbeat();
          this.handlers.onDisconnect?.();
          
          // 如果不是手动关闭，尝试重连
          if (!this.isManualClose && this.reconnectAttempts < this.options.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket连接错误:', error);
          this.setStatus('error');
          this.handlers.onError?.(error);
          reject(error);
        };

        this.socket.onmessage = (event) => {
          try {
            const message: API.WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('解析WebSocket消息失败:', error);
          }
        };
      } catch (error) {
        console.error('创建WebSocket连接失败:', error);
        this.setStatus('error');
        reject(error);
      }
    });
  }

  /**
   * 断开WebSocket连接
   */
  public disconnect(): void {
    this.isManualClose = true;
    this.clearReconnectTimer();
    this.stopHeartbeat();

    if (this.socket) {
      this.socket.close(1000, '手动断开连接');
      this.socket = null;
    }

    this.setStatus('disconnected');
  }

  /**
   * 发送消息
   */
  public sendMessage(message: Omit<API.WebSocketMessage, 'timestamp'>): boolean {
    if (!this.socket || this.status !== 'connected') {
      console.warn('WebSocket未连接，无法发送消息');
      return false;
    }

    try {
      const fullMessage: API.WebSocketMessage = {
        ...message,
        timestamp: new Date().toISOString(),
      };

      this.socket.send(JSON.stringify(fullMessage));
      return true;
    } catch (error) {
      console.error('发送WebSocket消息失败:', error);
      return false;
    }
  }

  /**
   * 发送聊天消息
   */
  public sendChatMessage(roleId: number, sessionId: string, content: string): boolean {
    return this.sendMessage({
      type: 'chat_message',
      payload: {
        roleId,
        sessionId,
        content,
      },
    });
  }

  /**
   * 发送输入状态
   */
  public sendTypingStatus(roleId: number, sessionId: string, isTyping: boolean): boolean {
    return this.sendMessage({
      type: isTyping ? 'typing_start' : 'typing_stop',
      payload: {
        roleId,
        sessionId,
      },
    });
  }

  // ==================== WebRTC信令相关方法 ====================

  /**
   * 发送WebRTC Offer
   */
  public sendWebRTCOffer(roleId: number, sessionId: string, offer: RTCSessionDescriptionInit): boolean {
    return this.sendMessage({
      type: 'webrtc_offer',
      payload: {
        roleId,
        sessionId,
        offer,
      },
    });
  }

  /**
   * 发送WebRTC Answer
   */
  public sendWebRTCAnswer(roleId: number, sessionId: string, answer: RTCSessionDescriptionInit): boolean {
    return this.sendMessage({
      type: 'webrtc_answer',
      payload: {
        roleId,
        sessionId,
        answer,
      },
    });
  }

  /**
   * 发送ICE候选
   */
  public sendICECandidate(roleId: number, sessionId: string, candidate: RTCIceCandidateInit): boolean {
    return this.sendMessage({
      type: 'webrtc_ice_candidate',
      payload: {
        roleId,
        sessionId,
        candidate,
      },
    });
  }

  /**
   * 发送语音通话开始信号
   */
  public sendVoiceCallStart(roleId: number, sessionId: string, callMode: 'realtime' | 'traditional' = 'realtime'): boolean {
    return this.sendMessage({
      type: 'voice_call_start',
      payload: {
        roleId,
        sessionId,
        callMode,
      },
    });
  }

  /**
   * 发送语音通话结束信号
   */
  public sendVoiceCallEnd(roleId: number, sessionId: string, duration: number): boolean {
    return this.sendMessage({
      type: 'voice_call_end',
      payload: {
        roleId,
        sessionId,
        duration,
      },
    });
  }

  /**
   * 发送语音通话状态
   */
  public sendVoiceCallStatus(
    roleId: number, 
    sessionId: string, 
    status: 'connecting' | 'connected' | 'disconnected' | 'error',
    quality?: 'excellent' | 'good' | 'fair' | 'poor'
  ): boolean {
    return this.sendMessage({
      type: 'voice_call_status',
      payload: {
        roleId,
        sessionId,
        status,
        quality,
      },
    });
  }

  /**
   * 获取连接状态
   */
  public getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * 是否已连接
   */
  public isConnected(): boolean {
    return this.status === 'connected';
  }

  /**
   * 设置连接状态
   */
  private setStatus(status: ConnectionStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.handlers.onStatusChange?.(status);
    }
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(message: API.WebSocketMessage): void {
    // 处理心跳响应
    if (message.type === 'connection' && message.payload === 'pong') {
      return;
    }

    // 处理WebRTC信令消息
    switch (message.type) {
      case 'webrtc_offer':
        this.handlers.onWebRTCOffer?.(
          message.payload.roleId,
          message.payload.sessionId,
          message.payload.offer
        );
        break;
      
      case 'webrtc_answer':
        this.handlers.onWebRTCAnswer?.(
          message.payload.roleId,
          message.payload.sessionId,
          message.payload.answer
        );
        break;
      
      case 'webrtc_ice_candidate':
        this.handlers.onWebRTCICECandidate?.(
          message.payload.roleId,
          message.payload.sessionId,
          message.payload.candidate
        );
        break;
      
      case 'voice_call_start':
        this.handlers.onVoiceCallStart?.(
          message.payload.roleId,
          message.payload.sessionId,
          message.payload.callMode
        );
        break;
      
      case 'voice_call_end':
        this.handlers.onVoiceCallEnd?.(
          message.payload.roleId,
          message.payload.sessionId,
          message.payload.duration
        );
        break;
      
      case 'voice_call_status':
        this.handlers.onVoiceCallStatus?.(
          message.payload.roleId,
          message.payload.sessionId,
          message.payload.status,
          message.payload.quality
        );
        break;
    }

    // 触发通用消息处理器
    this.handlers.onMessage?.(message);
  }

  /**
   * 安排重连
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectAttempts++;
    console.log(`准备进行第${this.reconnectAttempts}次重连...`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch((error) => {
        console.error('重连失败:', error);
      });
    }, this.options.reconnectInterval);
  }

  /**
   * 清除重连定时器
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * 开始心跳
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.sendMessage({
          type: 'connection',
          payload: 'ping',
        });
      }
    }, this.options.heartbeatInterval);
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}

// 创建单例实例
let socketServiceInstance: SocketService | null = null;

/**
 * 获取WebSocket服务实例
 */
export function getSocketService(url?: string): SocketService {
  if (!socketServiceInstance) {
    if (!url) {
      throw new Error('首次调用getSocketService时必须提供url参数');
    }
    socketServiceInstance = new SocketService({ url });
  }
  return socketServiceInstance;
}

/**
 * 销毁WebSocket服务实例
 */
export function destroySocketService(): void {
  if (socketServiceInstance) {
    socketServiceInstance.disconnect();
    socketServiceInstance = null;
  }
}

export default SocketService;
