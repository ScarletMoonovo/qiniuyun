/**
 * 实时语音流服务
 * 基于WebRTC实现电话式语音通话功能
 */

import { getSocketService } from './socketService';

export type VoiceCallStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';
export type AudioQuality = 'excellent' | 'good' | 'fair' | 'poor';

export interface RealtimeVoiceOptions {
  // WebRTC配置
  iceServers?: RTCIceServer[];
  // 音频约束
  audioConstraints?: MediaTrackConstraints;
  // 回声消除
  echoCancellation?: boolean;
  // 噪声抑制
  noiseSuppression?: boolean;
  // 自动增益控制
  autoGainControl?: boolean;
}

export interface VoiceCallEventHandlers {
  onStatusChange?: (status: VoiceCallStatus) => void;
  onQualityChange?: (quality: AudioQuality) => void;
  onError?: (error: Error) => void;
  onRemoteAudioStart?: () => void;
  onRemoteAudioEnd?: () => void;
  onLocalAudioStart?: () => void;
  onLocalAudioEnd?: () => void;
}

export class RealtimeVoiceService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private localAudioElement: HTMLAudioElement | null = null;
  private remoteAudioElement: HTMLAudioElement | null = null;
  
  private status: VoiceCallStatus = 'idle';
  private currentQuality: AudioQuality = 'good';
  private options: Required<RealtimeVoiceOptions>;
  private handlers: VoiceCallEventHandlers = {};
  
  private roleId: number | null = null;
  private sessionId: string | null = null;
  private callStartTime: number | null = null;
  
  // 音频分析相关
  private audioContext: AudioContext | null = null;
  private localAnalyser: AnalyserNode | null = null;
  private remoteAnalyser: AnalyserNode | null = null;
  private qualityCheckInterval: NodeJS.Timeout | null = null;

  constructor(options: RealtimeVoiceOptions = {}) {
    this.options = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
      audioConstraints: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
        channelCount: 1,
      },
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      ...options,
    };
  }

  /**
   * 设置事件处理器
   */
  public setHandlers(handlers: VoiceCallEventHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * 开始语音通话
   */
  public async startCall(roleId: number, sessionId: string): Promise<void> {
    if (this.status !== 'idle') {
      throw new Error(`Cannot start call in ${this.status} state`);
    }

    this.roleId = roleId;
    this.sessionId = sessionId;
    this.callStartTime = Date.now();

    try {
      this.setStatus('connecting');

      // 1. 获取用户媒体流
      await this.setupLocalStream();

      // 2. 创建WebRTC连接
      await this.setupPeerConnection();

      // 3. 设置WebSocket信令处理
      this.setupSignalingHandlers();

      // 4. 发送通话开始信号
      const socketService = getSocketService();
      socketService.sendVoiceCallStart(roleId, sessionId, 'realtime');

      console.log('语音通话初始化完成');
    } catch (error) {
      console.error('开始语音通话失败:', error);
      this.setStatus('error');
      this.handlers.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * 结束语音通话
   */
  public async endCall(): Promise<void> {
    if (this.status === 'idle') {
      return;
    }

    try {
      // 计算通话时长
      const duration = this.callStartTime ? Date.now() - this.callStartTime : 0;

      // 发送通话结束信号
      if (this.roleId && this.sessionId) {
        const socketService = getSocketService();
        socketService.sendVoiceCallEnd(this.roleId, this.sessionId, duration);
      }

      // 清理资源
      await this.cleanup();

      this.setStatus('idle');
      console.log(`语音通话结束，时长: ${Math.round(duration / 1000)}秒`);
    } catch (error) {
      console.error('结束语音通话失败:', error);
      this.handlers.onError?.(error as Error);
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
   * 获取当前状态
   */
  public getStatus(): VoiceCallStatus {
    return this.status;
  }

  /**
   * 获取当前音频质量
   */
  public getQuality(): AudioQuality {
    return this.currentQuality;
  }

  /**
   * 获取通话时长（毫秒）
   */
  public getCallDuration(): number {
    return this.callStartTime ? Date.now() - this.callStartTime : 0;
  }

  /**
   * 设置本地音频音量
   */
  public setLocalVolume(volume: number): void {
    if (this.localAudioElement) {
      this.localAudioElement.volume = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * 设置远程音频音量
   */
  public setRemoteVolume(volume: number): void {
    if (this.remoteAudioElement) {
      this.remoteAudioElement.volume = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * 获取音频统计信息
   */
  public async getAudioStats(): Promise<{
    localVolume: number;
    remoteVolume: number;
    packetLoss: number;
    roundTripTime: number;
  }> {
    if (!this.peerConnection) {
      return { localVolume: 0, remoteVolume: 0, packetLoss: 0, roundTripTime: 0 };
    }

    const stats = await this.peerConnection.getStats();
    let packetLoss = 0;
    let roundTripTime = 0;

    stats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.mediaType === 'audio') {
        packetLoss = report.packetsLost || 0;
      }
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        roundTripTime = report.currentRoundTripTime || 0;
      }
    });

    return {
      localVolume: this.getVolumeLevel(this.localAnalyser),
      remoteVolume: this.getVolumeLevel(this.remoteAnalyser),
      packetLoss,
      roundTripTime: roundTripTime * 1000, // 转换为毫秒
    };
  }

  /**
   * 设置通话状态
   */
  private setStatus(status: VoiceCallStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.handlers.onStatusChange?.(status);

      // 发送状态更新到服务器
      if (this.roleId && this.sessionId) {
        const socketService = getSocketService();
        socketService.sendVoiceCallStatus(this.roleId, this.sessionId, status, this.currentQuality);
      }
    }
  }

  /**
   * 设置音频质量
   */
  private setQuality(quality: AudioQuality): void {
    if (this.currentQuality !== quality) {
      this.currentQuality = quality;
      this.handlers.onQualityChange?.(quality);

      // 发送质量更新到服务器
      if (this.roleId && this.sessionId) {
        const socketService = getSocketService();
        socketService.sendVoiceCallStatus(this.roleId, this.sessionId, this.status, quality);
      }
    }
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

      // 设置音频分析
      this.setupAudioAnalysis();

      this.handlers.onLocalAudioStart?.();
      console.log('本地音频流设置完成');
    } catch (error) {
      console.error('获取本地音频流失败:', error);
      throw new Error('无法访问麦克风，请检查权限设置');
    }
  }

  /**
   * 设置WebRTC连接
   */
  private async setupPeerConnection(): Promise<void> {
    this.peerConnection = new RTCPeerConnection({
      iceServers: this.options.iceServers,
    });

    // 添加本地音频流
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });
    }

    // 处理远程音频流
    this.peerConnection.ontrack = (event) => {
      console.log('收到远程音频流');
      this.remoteStream = event.streams[0];
      this.setupRemoteAudio();
      this.handlers.onRemoteAudioStart?.();
    };

    // 处理ICE候选
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.roleId && this.sessionId) {
        const socketService = getSocketService();
        socketService.sendICECandidate(this.roleId, this.sessionId, event.candidate);
      }
    };

    // 处理连接状态变化
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection!.connectionState;
      console.log('WebRTC连接状态:', state);

      switch (state) {
        case 'connected':
          this.setStatus('connected');
          this.startQualityMonitoring();
          break;
        case 'disconnected':
        case 'failed':
          this.setStatus('error');
          break;
        case 'closed':
          this.setStatus('disconnected');
          break;
      }
    };
  }

  /**
   * 设置WebSocket信令处理
   */
  private setupSignalingHandlers(): void {
    const socketService = getSocketService();

    socketService.setHandlers({
      onWebRTCOffer: async (roleId, sessionId, offer) => {
        if (roleId === this.roleId && sessionId === this.sessionId) {
          await this.handleOffer(offer);
        }
      },

      onWebRTCAnswer: async (roleId, sessionId, answer) => {
        if (roleId === this.roleId && sessionId === this.sessionId) {
          await this.handleAnswer(answer);
        }
      },

      onWebRTCICECandidate: async (roleId, sessionId, candidate) => {
        if (roleId === this.roleId && sessionId === this.sessionId) {
          await this.handleICECandidate(candidate);
        }
      },

      onVoiceCallEnd: (roleId, sessionId) => {
        if (roleId === this.roleId && sessionId === this.sessionId) {
          this.endCall();
        }
      },
    });
  }

  /**
   * 处理WebRTC Offer
   */
  private async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.setRemoteDescription(offer);
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      // 发送answer
      if (this.roleId && this.sessionId) {
        const socketService = getSocketService();
        socketService.sendWebRTCAnswer(this.roleId, this.sessionId, answer);
      }
    } catch (error) {
      console.error('处理WebRTC Offer失败:', error);
      this.handlers.onError?.(error as Error);
    }
  }

  /**
   * 处理WebRTC Answer
   */
  private async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.setRemoteDescription(answer);
    } catch (error) {
      console.error('处理WebRTC Answer失败:', error);
      this.handlers.onError?.(error as Error);
    }
  }

  /**
   * 处理ICE候选
   */
  private async handleICECandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.addIceCandidate(candidate);
    } catch (error) {
      console.error('处理ICE候选失败:', error);
      this.handlers.onError?.(error as Error);
    }
  }

  /**
   * 设置音频分析
   */
  private setupAudioAnalysis(): void {
    if (!this.localStream) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(this.localStream);
      
      this.localAnalyser = this.audioContext.createAnalyser();
      this.localAnalyser.fftSize = 256;
      source.connect(this.localAnalyser);
    } catch (error) {
      console.warn('音频分析设置失败:', error);
    }
  }

  /**
   * 设置远程音频播放
   */
  private setupRemoteAudio(): void {
    if (!this.remoteStream) return;

    // 创建音频元素播放远程音频
    this.remoteAudioElement = document.createElement('audio');
    this.remoteAudioElement.srcObject = this.remoteStream;
    this.remoteAudioElement.autoplay = true;
    this.remoteAudioElement.volume = 1.0;

    // 设置远程音频分析
    if (this.audioContext) {
      try {
        const source = this.audioContext.createMediaStreamSource(this.remoteStream);
        this.remoteAnalyser = this.audioContext.createAnalyser();
        this.remoteAnalyser.fftSize = 256;
        source.connect(this.remoteAnalyser);
      } catch (error) {
        console.warn('远程音频分析设置失败:', error);
      }
    }
  }

  /**
   * 开始音频质量监控
   */
  private startQualityMonitoring(): void {
    this.qualityCheckInterval = setInterval(async () => {
      const stats = await this.getAudioStats();
      const quality = this.calculateAudioQuality(stats);
      this.setQuality(quality);
    }, 5000); // 每5秒检查一次
  }

  /**
   * 计算音频质量
   */
  private calculateAudioQuality(stats: {
    localVolume: number;
    remoteVolume: number;
    packetLoss: number;
    roundTripTime: number;
  }): AudioQuality {
    const { packetLoss, roundTripTime } = stats;

    if (packetLoss > 5 || roundTripTime > 300) {
      return 'poor';
    } else if (packetLoss > 2 || roundTripTime > 150) {
      return 'fair';
    } else if (packetLoss > 0.5 || roundTripTime > 50) {
      return 'good';
    } else {
      return 'excellent';
    }
  }

  /**
   * 获取音量级别
   */
  private getVolumeLevel(analyser: AnalyserNode | null): number {
    if (!analyser) return 0;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    
    return sum / bufferLength / 255; // 归一化到0-1
  }

  /**
   * 清理资源
   */
  private async cleanup(): Promise<void> {
    // 停止质量监控
    if (this.qualityCheckInterval) {
      clearInterval(this.qualityCheckInterval);
      this.qualityCheckInterval = null;
    }

    // 关闭WebRTC连接
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // 停止本地音频流
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
      this.handlers.onLocalAudioEnd?.();
    }

    // 清理远程音频
    if (this.remoteAudioElement) {
      this.remoteAudioElement.pause();
      this.remoteAudioElement.srcObject = null;
      this.remoteAudioElement = null;
      this.handlers.onRemoteAudioEnd?.();
    }

    // 清理音频上下文
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    this.localAnalyser = null;
    this.remoteAnalyser = null;
    this.remoteStream = null;
    this.roleId = null;
    this.sessionId = null;
    this.callStartTime = null;
  }
}

// 创建单例实例
let realtimeVoiceServiceInstance: RealtimeVoiceService | null = null;

/**
 * 获取实时语音服务实例
 */
export function getRealtimeVoiceService(options?: RealtimeVoiceOptions): RealtimeVoiceService {
  if (!realtimeVoiceServiceInstance) {
    realtimeVoiceServiceInstance = new RealtimeVoiceService(options);
  }
  return realtimeVoiceServiceInstance;
}

/**
 * 销毁实时语音服务实例
 */
export function destroyRealtimeVoiceService(): void {
  if (realtimeVoiceServiceInstance) {
    realtimeVoiceServiceInstance.endCall();
    realtimeVoiceServiceInstance = null;
  }
}

export default RealtimeVoiceService;
