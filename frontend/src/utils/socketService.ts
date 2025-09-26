/**
 * WebSocket服务类
 * 用于管理与后端的实时通信连接，支持文本消息和音频流传输
 * 
 * @example
 * ```typescript
 * const socketService = getSocketService('ws://localhost:3001');
 * socketService.setHandlers({
 *   onConnect: () => console.log('已连接'),
 *   onMessage: (message) => console.log('收到消息:', message),
 *   onTTSAudio: (roleId, sessionId, audioData, isLast) => {
 *     // 处理TTS音频流
 *   }
 * });
 * await socketService.connect();
 * ```
 */

/** WebSocket连接状态类型 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * WebSocket服务配置选项
 */
export interface SocketServiceOptions {
  /** WebSocket服务器地址 */
  url: string;
  /** 重连间隔时间，默认3000ms */
  reconnectInterval?: number;
  /** 最大重连次数，默认5次 */
  maxReconnectAttempts?: number;
  /** 心跳间隔时间，默认30000ms */
  heartbeatInterval?: number;
}

/**
 * WebSocket事件处理器接口
 */
export interface SocketEventHandlers {
  /** 连接成功回调 */
  onConnect?: () => void;
  /** 连接断开回调 */
  onDisconnect?: () => void;
  /** 连接错误回调 */
  onError?: (error: Event) => void;
  /** 通用消息接收回调 */
  onMessage?: (message: API.WebSocketMessage) => void;
  /** 连接状态变化回调 */
  onStatusChange?: (status: ConnectionStatus) => void;
  
  // 聊天消息处理器
  /** 聊天消息接收回调 */
  onChatMessage?: (message: API.ChatMessage, sessionId: string) => void;
  /** 输入状态变化回调 */
  onTypingStatus?: (roleId: number, sessionId: string, isTyping: boolean) => void;
  
  // TTS音频流处理器
  /** TTS音频流接收回调 */
  onTTSAudio?: (roleId: number, sessionId: string, audioData: ArrayBuffer, isLast: boolean) => void;
}

/**
 * WebSocket服务类
 * 提供完整的WebSocket连接管理、消息传输、音频流处理等功能
 */
export class SocketService {
  /** WebSocket连接实例 */
  private socket: WebSocket | null = null;
  
  /** 当前连接状态 */
  private status: ConnectionStatus = 'disconnected';
  
  /** 服务配置选项 */
  private options: Required<SocketServiceOptions>;
  
  /** 事件处理器集合 */
  private handlers: SocketEventHandlers = {};
  
  /** 重连定时器 */
  private reconnectTimer: NodeJS.Timeout | null = null;
  
  /** 心跳定时器 */
  private heartbeatTimer: NodeJS.Timeout | null = null;
  
  /** 当前重连尝试次数 */
  private reconnectAttempts = 0;
  
  /** 是否为手动关闭连接 */
  private isManualClose = false;

  /**
   * 创建WebSocket服务实例
   * @param options - WebSocket服务配置选项
   * @example
   * ```typescript
   * const service = new SocketService({
   *   url: 'ws://localhost:3001',
   *   reconnectInterval: 5000,
   *   maxReconnectAttempts: 10
   * });
   * ```
   */
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
   * @param handlers - 事件处理器对象，包含各种回调函数
   * @example
   * ```typescript
   * service.setHandlers({
   *   onConnect: () => console.log('连接成功'),
   *   onMessage: (message) => console.log('收到消息:', message),
   *   onTTSAudio: (roleId, sessionId, audioData, isLast) => {
   *     // 处理TTS音频流
   *     playAudioData(audioData);
   *   }
   * });
   * ```
   */
  public setHandlers(handlers: SocketEventHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * 连接到WebSocket服务器
   * @returns Promise<void> - 连接建立完成的Promise
   * @throws {Error} 当连接失败时抛出错误
   * @example
   * ```typescript
   * try {
   *   await service.connect();
   *   console.log('WebSocket连接成功');
   * } catch (error) {
   *   console.error('连接失败:', error);
   * }
   * ```
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
            // 处理文本数据（JSON消息）
            const message: API.WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('处理WebSocket消息失败:', error);
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
   * @example
   * ```typescript
   * service.disconnect();
   * console.log('WebSocket连接已断开');
   * ```
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
   * 发送WebSocket消息
   * @param message - 要发送的消息对象（不包含timestamp）
   * @returns boolean - 发送成功返回true，否则返回false
   * @example
   * ```typescript
   * const success = service.sendMessage({
   *   type: 'chat_message',
   *   payload: { roleId: 1, sessionId: 'abc', content: 'Hello' }
   * });
   * if (success) {
   *   console.log('消息发送成功');
   * }
   * ```
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
   * @param roleId - 角色ID
   * @param sessionId - 会话ID
   * @param content - 消息内容
   * @returns boolean - 发送成功返回true
   * @example
   * ```typescript
   * const success = service.sendChatMessage(1, 'session-123', 'Hello AI!');
   * ```
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
   * 发送输入状态（开始/停止输入）
   * @param roleId - 角色ID
   * @param sessionId - 会话ID
   * @param isTyping - 是否正在输入
   * @returns boolean - 发送成功返回true
   * @example
   * ```typescript
   * // 开始输入
   * service.sendTypingStatus(1, 'session-123', true);
   * // 停止输入
   * service.sendTypingStatus(1, 'session-123', false);
   * ```
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

  /**
   * 发送STT识别的文本到后端进行LLM处理
   * @param roleId - 角色ID
   * @param sessionId - 会话ID
   * @param text - 识别出的文本内容
   * @param isFinal - 是否为最终识别结果
   * @returns boolean - 发送成功返回true
   * @example
   * ```typescript
   * // 发送中间识别结果
   * service.sendSTTText(1, 'session-123', '你好', false);
   * // 发送最终识别结果
   * service.sendSTTText(1, 'session-123', '你好世界', true);
   * ```
   */
  public sendSTTText(roleId: number, sessionId: string, text: string, isFinal: boolean): boolean {
    return this.sendMessage({
      type: 'stt_text',
      payload: {
        roleId,
        sessionId,
        text,
        isFinal,
      },
    });
  }


  /**
   * 获取当前连接状态
   * @returns ConnectionStatus - 当前连接状态
   * @example
   * ```typescript
   * const status = service.getStatus();
   * if (status === 'connected') {
   *   console.log('WebSocket已连接');
   * }
   * ```
   */
  public getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * 检查是否已连接到WebSocket服务器
   * @returns boolean - 已连接返回true，否则返回false
   * @example
   * ```typescript
   * if (service.isConnected()) {
   *   service.sendChatMessage(1, 'session-123', 'Hello');
   * } else {
   *   console.log('WebSocket未连接');
   * }
   * ```
   */
  public isConnected(): boolean {
    return this.status === 'connected';
  }

  /**
   * 设置连接状态并触发状态变化事件
   * @private
   * @param status - 新的连接状态
   */
  private setStatus(status: ConnectionStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.handlers.onStatusChange?.(status);
    }
  }

  /**
   * 处理接收到的WebSocket消息
   * @private
   * @param message - WebSocket消息
   */
  private handleMessage(message: API.WebSocketMessage): void {

    // 处理心跳响应
    if (message.type === 'heartbeat' && message.payload === 'pong') {
      return;
    }

    // 处理具体消息类型
    switch (message.type) {
      case 'chat_message':
        // 聊天消息
        this.handlers.onChatMessage?.(
          message.payload.message,
          message.payload.sessionId
        );
        break;
      
      case 'typing_start':
      case 'typing_stop':
        // 输入状态变化
        this.handlers.onTypingStatus?.(
          message.payload.roleId,
          message.payload.sessionId,
          message.type === 'typing_start'
        );
        break;
      
      case 'tts_audio':
        // TTS音频流消息
        this.handlers.onTTSAudio?.(
          message.payload.roleId,
          message.payload.sessionId,
          message.payload.audioData,
          message.payload.isLast
        );
        break;
      
      case 'error':
        console.error('WebSocket服务器错误:', message.payload);
        break;
    }

    // 触发通用消息处理器
    this.handlers.onMessage?.(message as API.WebSocketMessage);
  }


  /**
   * 安排重连操作
   * @private
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
   * @private
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * 开始心跳检测
   * @private
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.sendMessage({
          type: 'heartbeat',
          payload: 'ping',
        });
      }
    }, this.options.heartbeatInterval);
  }

  /**
   * 停止心跳检测
   * @private
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}

/** WebSocket服务单例实例 */
let socketServiceInstance: SocketService | null = null;

/**
 * 获取WebSocket服务单例实例
 * @param url - WebSocket服务器地址，仅在首次调用时需要提供
 * @returns SocketService - WebSocket服务实例
 * @throws {Error} 当首次调用时未提供url参数时抛出错误
 * @example
 * ```typescript
 * // 首次调用时提供URL
 * const service = getSocketService('ws://localhost:3001');
 * 
 * // 后续调用可以不提供URL
 * const sameService = getSocketService();
 * 
 * // 设置事件处理器并连接
 * service.setHandlers({
 *   onConnect: () => console.log('WebSocket已连接'),
 *   onTTSAudio: (roleId, sessionId, audioData, isLast) => {
 *     // 处理TTS音频流
 *   }
 * });
 * await service.connect();
 * ```
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
 * 销毁WebSocket服务单例实例
 * 断开连接并清理资源
 * @example
 * ```typescript
 * // 销毁服务实例
 * destroySocketService();
 * console.log('WebSocket服务已销毁');
 * ```
 */
export function destroySocketService(): void {
  if (socketServiceInstance) {
    socketServiceInstance.disconnect();
    socketServiceInstance = null;
  }
}

/** 导出WebSocket服务类，供直接实例化使用 */
export default SocketService;
