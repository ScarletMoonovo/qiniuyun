/**
 * 基于Simple-peer的实时语音服务
 * 大大简化WebRTC实现复杂度
 */

import Peer from 'simple-peer';
import { getSocketService } from './socketService';

export type VoiceCallStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

export interface SimplePeerVoiceOptions {
  // Simple-peer配置
  config?: {
    iceServers?: RTCIceServer[];
  };
  // 音频约束
  audioConstraints?: MediaTrackConstraints;
}

export interface VoiceCallEventHandlers {
  onStatusChange?: (status: VoiceCallStatus) => void;
  onError?: (error: Error) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onDataReceived?: (data: any) => void;
}

export class SimplePeerVoiceService {
  private peer: Peer.Instance | null = null;
  private localStream: MediaStream | null = null;
  private status: VoiceCallStatus = 'idle';
  private handlers: VoiceCallEventHandlers = {};
  
  private roleId: number | null = null;
  private sessionId: string | null = null;
  private isInitiator = false;

  constructor(private options: SimplePeerVoiceOptions = {}) {
    this.setupDefaultConfig();
  }

  /**
   * 设置事件处理器
   */
  public setHandlers(handlers: VoiceCallEventHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * 开始语音通话（作为发起方）
   */
  public async startCall(roleId: number, sessionId: string): Promise<void> {
    if (this.status !== 'idle') {
      throw new Error(`Cannot start call in ${this.status} state`);
    }

    this.roleId = roleId;
    this.sessionId = sessionId;
    this.isInitiator = true;

    try {
      this.setStatus('connecting');

      // 连接到信令服务器
      await this.connectToSignalingServer();

      // 获取本地音频流
      await this.setupLocalStream();

      // 创建peer连接（作为发起方）
      this.createPeerConnection(true);

      // 设置信令处理
      this.setupSignalingHandlers();

      // 加入通话房间
      this.joinCallRoom();

      // 发送语音通话开始信号
      this.sendVoiceCallStart();

      console.log('开始语音通话（发起方）');
    } catch (error) {
      console.error('开始语音通话失败:', error);
      this.setStatus('error');
      this.handlers.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * 接受语音通话（作为接收方）
   */
  public async acceptCall(roleId: number, sessionId: string): Promise<void> {
    if (this.status !== 'idle') {
      throw new Error(`Cannot accept call in ${this.status} state`);
    }

    this.roleId = roleId;
    this.sessionId = sessionId;
    this.isInitiator = false;

    try {
      this.setStatus('connecting');

      // 连接到信令服务器
      await this.connectToSignalingServer();

      // 获取本地音频流
      await this.setupLocalStream();

      // 创建peer连接（作为接收方）
      this.createPeerConnection(false);

      // 设置信令处理
      this.setupSignalingHandlers();

      // 加入通话房间
      this.joinCallRoom();

      console.log('接受语音通话（接收方）');
    } catch (error) {
      console.error('接受语音通话失败:', error);
      this.setStatus('error');
      this.handlers.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * 结束语音通话
   */
  public async endCall(): Promise<void> {
    try {
      // 发送通话结束信号
      if (this.roleId && this.sessionId) {
        const socketService = getSocketService();
        socketService.sendVoiceCallEnd(this.roleId, this.sessionId, 0);
      }

      // 清理资源
      this.cleanup();
      this.setStatus('idle');

      console.log('语音通话已结束');
    } catch (error) {
      console.error('结束语音通话失败:', error);
    }
  }

  /**
   * 静音/取消静音
   */
  public setMuted(muted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }

  /**
   * 发送数据（可选功能）
   */
  public sendData(data: any): void {
    if (this.peer && this.status === 'connected') {
      this.peer.send(JSON.stringify(data));
    }
  }

  /**
   * 获取当前状态
   */
  public getStatus(): VoiceCallStatus {
    return this.status;
  }

  /**
   * 设置默认配置
   */
  private setupDefaultConfig(): void {
    this.options = {
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
        ...this.options.config,
      },
      audioConstraints: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        ...this.options.audioConstraints,
      },
    };
  }

  /**
   * 设置本地音频流
   */
  private async setupLocalStream(): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: this.options.audioConstraints,
        video: false,
      });

      console.log('本地音频流设置完成');
    } catch (error) {
      console.error('获取本地音频流失败:', error);
      throw new Error('无法访问麦克风，请检查权限设置');
    }
  }

  /**
   * 创建Peer连接
   */
  private createPeerConnection(initiator: boolean): void {
    this.peer = new Peer({
      initiator,
      trickle: false, // 简化ICE处理
      config: this.options.config,
      stream: this.localStream || undefined,
    });

    // 处理信令数据
    this.peer.on('signal', (data) => {
      console.log('生成信令数据:', data.type);
      this.sendSignalData(data);
    });

    // 连接建立
    this.peer.on('connect', () => {
      console.log('Peer连接已建立');
      this.setStatus('connected');
    });

    // 接收远程流
    this.peer.on('stream', (remoteStream) => {
      console.log('收到远程音频流');
      this.handlers.onRemoteStream?.(remoteStream);
    });

    // 接收数据
    this.peer.on('data', (data) => {
      try {
        const parsedData = JSON.parse(data.toString());
        this.handlers.onDataReceived?.(parsedData);
      } catch (error) {
        console.warn('解析接收数据失败:', error);
      }
    });

    // 连接关闭
    this.peer.on('close', () => {
      console.log('Peer连接已关闭');
      this.setStatus('disconnected');
    });

    // 错误处理
    this.peer.on('error', (error) => {
      console.error('Peer连接错误:', error);
      this.setStatus('error');
      this.handlers.onError?.(error);
    });
  }

  /**
   * 设置信令处理
   */
  private setupSignalingHandlers(): void {
    const socketService = getSocketService();

    // 发送通话开始信号
    socketService.sendVoiceCallStart(this.roleId!, this.sessionId!, 'realtime');

    // 监听信令数据
    socketService.setHandlers({
      onPeerSignal: (roleId, sessionId, signalData) => {
        if (this.matchesCurrentCall(roleId, sessionId)) {
          this.handleSignalData(signalData);
        }
      },
      onVoiceCallEnd: (roleId, sessionId) => {
        if (this.matchesCurrentCall(roleId, sessionId)) {
          this.endCall();
        }
      },
    });
  }

  /**
   * 发送信令数据
   */
  private sendSignalData(data: any): void {
    if (!this.roleId || !this.sessionId) return;

    const socketService = getSocketService();
    // Simple-peer统一信令接口
    socketService.sendPeerSignal(this.roleId, this.sessionId, data);
  }

  /**
   * 处理接收到的信令数据
   */
  private handleSignalData(data: any): void {
    if (this.peer) {
      console.log('处理信令数据:', data.type);
      this.peer.signal(data);
    }
  }

  /**
   * 检查是否匹配当前通话
   */
  private matchesCurrentCall(roleId: number, sessionId: string): boolean {
    return this.roleId === roleId && this.sessionId === sessionId;
  }

  /**
   * 设置状态
   */
  private setStatus(status: VoiceCallStatus): void {
    if (this.status !== status) {
      console.log(`语音通话状态变化: ${this.status} → ${status}`);
      this.status = status;
      this.handlers.onStatusChange?.(status);
    }
  }

  /**
   * 连接到信令服务器
   */
  private async connectToSignalingServer(): Promise<void> {
    const signalingServerUrl = process.env.NODE_ENV === 'production' 
      ? 'wss://your-signaling-server.com'  // 生产环境信令服务器
      : 'ws://localhost:3001';              // 开发环境信令服务器
    
    const socketService = getSocketService(signalingServerUrl);
    
    if (!socketService.isConnected()) {
      await socketService.connect();
      console.log('已连接到信令服务器:', signalingServerUrl);
    }
  }

  /**
   * 加入通话房间
   */
  private joinCallRoom(): void {
    if (!this.roleId || !this.sessionId) return;
    
    const socketService = getSocketService();
    socketService.sendMessage({
      type: 'join_call',
      payload: {
        roleId: this.roleId,
        sessionId: this.sessionId,
        userId: 'user_' + Date.now() // 临时用户ID，实际应从认证系统获取
      }
    });
    
    console.log('已加入通话房间:', this.roleId, this.sessionId);
  }

  /**
   * 发送语音通话开始信号
   */
  private sendVoiceCallStart(): void {
    if (!this.roleId || !this.sessionId) return;
    
    const socketService = getSocketService();
    socketService.sendVoiceCallStart(this.roleId, this.sessionId, 'realtime');
    
    console.log('已发送语音通话开始信号');
  }

  /**
   * 清理资源
   */
  private cleanup(): void {
    // 销毁peer连接
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    // 停止本地音频流
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    this.roleId = null;
    this.sessionId = null;
  }
}

// 单例实例
let simplePeerVoiceServiceInstance: SimplePeerVoiceService | null = null;

/**
 * 获取Simple-peer语音服务实例
 */
export function getSimplePeerVoiceService(options?: SimplePeerVoiceOptions): SimplePeerVoiceService {
  if (!simplePeerVoiceServiceInstance) {
    simplePeerVoiceServiceInstance = new SimplePeerVoiceService(options);
  }
  return simplePeerVoiceServiceInstance;
}

export default SimplePeerVoiceService;
