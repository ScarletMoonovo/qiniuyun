/**
 * 阿里云实时语音识别（STT）服务
 * 前端直连阿里云STT，获取识别文本后发送给后端处理
 * 
 * @example
 * ```typescript
 * const sttService = getAlicloudSTTService();
 * sttService.setCredentials(appKey, token);
 * sttService.setHandlers({
 *   onTextReceived: (result) => console.log(result.text),
 *   onError: (error) => console.error(error)
 * });
 * await sttService.startRecognition(roleId, sessionId);
 * ```
 */

import { sendSTTText } from '@/services/backend/chat';

/**
 * 阿里云实时语音识别服务类
 * 提供完整的语音识别功能，包括音频捕获、实时传输、结果处理等
 */
class AlicloudSTTService {
  /** WebSocket连接实例，用于与阿里云STT服务通信 */
  private websocket: WebSocket | null = null;
  
  /** 音频上下文，用于处理音频数据 */
  private audioContext: AudioContext | null = null;
  
  /** 脚本处理器节点，用于实时处理音频数据 */
  private scriptProcessor: ScriptProcessorNode | null = null;
  
  /** 音频输入源节点 */
  private audioInput: MediaStreamAudioSourceNode | null = null;
  
  /** 音频媒体流 */
  private audioStream: MediaStream | null = null;
  
  /** 音频分析器节点，用于音量监测 */
  private analyser: AnalyserNode | null = null;
  
  /** STT服务配置参数 */
  private config: Voice.STTConfig = {
    sampleRate: 16000,
    channels: 1,
    encoding: 'pcm',
    chunkDuration: 100,
    language: 'zh-cn',
    enablePunctuation: true,
    enableITN: true,
  };
  
  /** 当前服务状态 */
  private status: Voice.STTStatus = 'disconnected';
  
  /** 事件处理器集合 */
  private handlers: Voice.STTEventHandlers = {};
  
  /** 当前角色ID */
  private currentRoleId: number | null = null;
  
  /** 当前会话ID */
  private currentSessionId: string | null = null;
  
  /** 阿里云STT任务ID */
  private taskId: string = '';
  
  /** 阿里云STT消息ID */
  private messageId: string = '';
  
  /** 阿里云STT应用密钥 */
  private appKey: string = '';
  
  /** 阿里云STT访问令牌 */
  private token: string = '';
  
  /** 阿里云STT WebSocket服务地址 */
  private wsUrl: string = 'wss://nls-gateway.cn-shanghai.aliyuncs.com/ws/v1';

  /**
   * 创建阿里云STT服务实例
   * @param config - 可选的STT配置参数，用于覆盖默认配置
   * @example
   * ```typescript
   * const service = new AlicloudSTTService({
   *   sampleRate: 8000,
   *   language: 'en-us'
   * });
   * ```
   */
  constructor(config?: Partial<Voice.STTConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * 设置阿里云STT认证信息
   * @param appKey - 阿里云STT应用密钥
   * @param token - 阿里云STT访问令牌
   * @throws {Error} 当appKey或token为空时抛出错误
   * @example
   * ```typescript
   * service.setCredentials('your-app-key', 'your-access-token');
   * ```
   */
  public setCredentials(appKey: string, token: string): void {
    this.appKey = appKey;
    this.token = token;
  }

  /**
   * 设置事件处理器
   * @param handlers - 事件处理器对象，包含各种回调函数
   * @example
   * ```typescript
   * service.setHandlers({
   *   onTextReceived: (result) => console.log('识别结果:', result.text),
   *   onVolumeChange: (volume) => updateVolumeIndicator(volume),
   *   onError: (error) => console.error('STT错误:', error)
   * });
   * ```
   */
  public setHandlers(handlers: Voice.STTEventHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * 开始语音识别
   * @param roleId - 角色ID，用于标识当前对话的角色
   * @param sessionId - 会话ID，用于标识当前对话会话
   * @returns Promise<void> - 异步操作完成的Promise
   * @throws {Error} 当语音识别已在进行中或初始化失败时抛出错误
   * @example
   * ```typescript
   * try {
   *   await service.startRecognition(123, 'session-456');
   *   console.log('语音识别已启动');
   * } catch (error) {
   *   console.error('启动失败:', error);
   * }
   * ```
   */
  public async startRecognition(roleId: number, sessionId: string): Promise<void> {
    if (this.status === 'recognizing') {
      throw new Error('语音识别已在进行中');
    }

    this.currentRoleId = roleId;
    this.currentSessionId = sessionId;

    try {
      // 1. 连接阿里云STT WebSocket
      await this.connectSTTWebSocket();
      
      // 2. 初始化音频捕获
      await this.initAudioCapture();
      
      // 3. 开始录音
      await this.startRecording();
      
      this.updateStatus('recognizing');
      this.handlers.onConnect?.();
    } catch (error) {
      this.updateStatus('error');
      this.handlers.onError?.({
        code: 'START_FAILED',
        message: error instanceof Error ? error.message : '启动语音识别失败',
        details: error,
      });
      throw error;
    }
  }

  /**
   * 停止语音识别
   * @returns Promise<void> - 异步操作完成的Promise
   * @example
   * ```typescript
   * try {
   *   await service.stopRecognition();
   *   console.log('语音识别已停止');
   * } catch (error) {
   *   console.error('停止失败:', error);
   * }
   * ```
   */
  public async stopRecognition(): Promise<void> {
    try {
      // 停止录音
      this.stopRecording();
      
      // 发送停止转录消息
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        const stopMessage = {
          header: {
            appkey: this.appKey,
            namespace: 'SpeechTranscriber',
            name: 'StopTranscription',
            task_id: this.taskId,
            message_id: this.generateUUID(),
          },
        };
        this.websocket.send(JSON.stringify(stopMessage));
      }
      
      // 关闭WebSocket连接
      if (this.websocket) {
        this.websocket.close();
        this.websocket = null;
      }
      
      this.updateStatus('disconnected');
      this.handlers.onDisconnect?.();
    } catch (error) {
      this.handlers.onError?.({
        code: 'STOP_FAILED',
        message: error instanceof Error ? error.message : '停止语音识别失败',
        details: error,
      });
    }
  }

  /**
   * 连接阿里云STT WebSocket服务
   * @private
   * @returns Promise<void> - 连接建立完成的Promise
   * @throws {Error} 当认证信息缺失或连接失败时抛出错误
   */
  private async connectSTTWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.appKey || !this.token) {
        reject(new Error('请先设置阿里云STT认证信息'));
        return;
      }

      this.updateStatus('connecting');
      
      const socketUrl = `${this.wsUrl}?token=${this.token}`;
      this.websocket = new WebSocket(socketUrl);

      this.websocket.onopen = () => {
        console.log('阿里云STT WebSocket连接已建立');
        this.updateStatus('connected');
        
        // 发送开始转录消息
        this.taskId = this.generateUUID();
        this.messageId = this.generateUUID();
        
        const startMessage = {
          header: {
            appkey: this.appKey,
            namespace: 'SpeechTranscriber',
            name: 'StartTranscription',
            task_id: this.taskId,
            message_id: this.messageId,
          },
          payload: {
            format: this.config.encoding,
            sample_rate: this.config.sampleRate,
            enable_intermediate_result: true,
            enable_punctuation_prediction: this.config.enablePunctuation,
            enable_inverse_text_normalization: this.config.enableITN,
            language: this.config.language,
          },
        };

        this.websocket!.send(JSON.stringify(startMessage));
      };

      this.websocket.onmessage = (event) => {
        this.handleSTTMessage(event.data);
      };

      this.websocket.onerror = (error) => {
        console.error('阿里云STT WebSocket错误:', error);
        this.updateStatus('error');
        reject(new Error('阿里云STT WebSocket连接失败'));
      };

      this.websocket.onclose = () => {
        console.log('阿里云STT WebSocket连接已关闭');
        this.updateStatus('disconnected');
      };

      // 设置连接超时
      setTimeout(() => {
        if (this.status === 'connecting') {
          reject(new Error('阿里云STT WebSocket连接超时'));
        } else {
          resolve();
        }
      }, 10000);
    });
  }

  /**
   * 处理阿里云STT返回的消息
   * @private
   * @param data - 从WebSocket接收的JSON字符串数据
   */
  private handleSTTMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      console.log('收到阿里云STT消息:', message);

      if (message.header.name === 'TranscriptionStarted') {
        console.log('语音转录已启动');
        return;
      }

      if (message.header.name === 'SentenceBegin') {
        console.log('句子开始');
        return;
      }

      if (message.header.name === 'TranscriptionResultChanged') {
        // 中间识别结果
        const result: Voice.VoiceRecognitionResult = {
          text: message.payload.result || '',
          confidence: message.payload.confidence || 0,
          isFinal: false,
          startTime: message.payload.begin_time,
          endTime: message.payload.end_time,
        };
        
        this.handlers.onTextReceived?.(result);
        return;
      }

      if (message.header.name === 'SentenceEnd') {
        // 最终识别结果
        const result: Voice.VoiceRecognitionResult = {
          text: message.payload.result || '',
          confidence: message.payload.confidence || 0,
          isFinal: true,
          startTime: message.payload.begin_time,
          endTime: message.payload.end_time,
        };
        
        this.handlers.onTextReceived?.(result);
        
        // 发送最终识别结果到后端
        if (result.text && this.currentRoleId && this.currentSessionId) {
          this.sendTextToBackend(result.text, true);
        }
        return;
      }

      if (message.header.name === 'TranscriptionCompleted') {
        console.log('语音转录完成');
        return;
      }

      if (message.header.status !== 20000000) {
        // 错误处理
        const error: Voice.STTError = {
          code: message.header.status_text || 'STT_ERROR',
          message: message.header.status_message || '语音识别错误',
          details: message,
        };
        this.handlers.onError?.(error);
      }
    } catch (error) {
      console.error('解析STT消息失败:', error);
      this.handlers.onError?.({
        code: 'PARSE_ERROR',
        message: '解析语音识别消息失败',
        details: error,
      });
    }
  }

  /**
   * 初始化音频捕获设备和音频处理链路
   * @private
   * @returns Promise<void> - 初始化完成的Promise
   * @throws {Error} 当音频设备访问失败或初始化失败时抛出错误
   */
  private async initAudioCapture(): Promise<void> {
    try {
      // 获取音频输入设备
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channels,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // 创建音频上下文
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.config.sampleRate,
      });

      // 创建音频源
      this.audioInput = this.audioContext.createMediaStreamSource(this.audioStream);

      // 创建分析器用于音量监测
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.audioInput.connect(this.analyser);

      // 创建脚本处理器
      this.scriptProcessor = this.audioContext.createScriptProcessor(2048, 1, 1);
      
      this.scriptProcessor.onaudioprocess = (event) => {
        this.processAudioData(event);
      };

      this.audioInput.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.audioContext.destination);

      console.log('音频捕获初始化完成');
    } catch (error) {
      throw new Error(`音频捕获初始化失败: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * 开始录音和音量监测
   * @private
   * @returns Promise<void> - 录音启动完成的Promise
   */
  private async startRecording(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
    
    // 开始音量监测
    this.startVolumeMonitoring();
    
    console.log('开始录音');
  }

  /**
   * 停止录音并清理音频资源
   * @private
   */
  private stopRecording(): void {
    // 停止音量监测
    this.stopVolumeMonitoring();

    // 清理音频资源
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }

    if (this.audioInput) {
      this.audioInput.disconnect();
      this.audioInput = null;
    }

    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    console.log('录音已停止');
  }

  /**
   * 处理音频数据并转换为PCM格式发送到阿里云STT
   * @private
   * @param event - 音频处理事件，包含音频缓冲区数据
   */
  private processAudioData(event: AudioProcessingEvent): void {
    const inputData = event.inputBuffer.getChannelData(0);
    
    // 转换为16位PCM数据
    const inputData16 = new Int16Array(inputData.length);
    for (let i = 0; i < inputData.length; i++) {
      inputData16[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
    }

    // 发送音频数据到阿里云STT
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(inputData16.buffer);
    }
  }

  /** 音量监测动画帧ID */
  private volumeMonitoringId: number | null = null;

  /**
   * 开始音量监测
   * @private
   */
  private startVolumeMonitoring(): void {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const monitor = () => {
      if (!this.analyser) return;
      
      this.analyser.getByteFrequencyData(dataArray);
      
      // 计算音量（RMS）
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const volume = Math.sqrt(sum / bufferLength) / 255;
      
      this.handlers.onVolumeChange?.(volume);
      
      this.volumeMonitoringId = requestAnimationFrame(monitor);
    };

    monitor();
  }

  /**
   * 停止音量监测
   * @private
   */
  private stopVolumeMonitoring(): void {
    if (this.volumeMonitoringId) {
      cancelAnimationFrame(this.volumeMonitoringId);
      this.volumeMonitoringId = null;
    }
  }

  /**
   * 发送识别文本到后端进行LLM处理
   * @private
   * @param text - 识别出的文本内容
   * @param isFinal - 是否为最终识别结果
   * @returns Promise<void> - 发送完成的Promise
   */
  private async sendTextToBackend(text: string, isFinal: boolean): Promise<void> {
    if (!this.currentRoleId || !this.currentSessionId) return;

    try {
      await sendSTTText({
        roleId: this.currentRoleId,
        sessionId: this.currentSessionId,
        text,
        isFinal,
      });
      
      console.log('STT文本已发送到后端:', text);
    } catch (error) {
      console.error('发送STT文本到后端失败:', error);
      this.handlers.onError?.({
        code: 'BACKEND_SEND_FAILED',
        message: '发送识别文本到后端失败',
        details: error,
      });
    }
  }

  /**
   * 更新服务状态并触发状态变化事件
   * @private
   * @param status - 新的服务状态
   */
  private updateStatus(status: Voice.STTStatus): void {
    this.status = status;
    this.handlers.onStatusChange?.(status);
  }

  /**
   * 生成UUID用于阿里云STT任务和消息标识
   * @private
   * @returns string - 生成的UUID字符串（去除连字符）
   */
  private generateUUID(): string {
    return (([1e7] as any) + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c: any) =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    ).replace(/-/g, '');
  }

  /**
   * 获取当前服务状态
   * @returns Voice.STTStatus - 当前服务状态
   * @example
   * ```typescript
   * const status = service.getStatus();
   * if (status === 'recognizing') {
   *   console.log('正在识别中...');
   * }
   * ```
   */
  public getStatus(): Voice.STTStatus {
    return this.status;
  }

  /**
   * 获取当前STT配置参数
   * @returns Voice.STTConfig - 当前配置参数的副本
   * @example
   * ```typescript
   * const config = service.getConfig();
   * console.log('采样率:', config.sampleRate);
   * console.log('语言:', config.language);
   * ```
   */
  public getConfig(): Voice.STTConfig {
    return { ...this.config };
  }

  /**
   * 更新STT配置参数
   * @param config - 要更新的配置参数（部分更新）
   * @example
   * ```typescript
   * service.updateConfig({
   *   sampleRate: 8000,
   *   language: 'en-us',
   *   enablePunctuation: false
   * });
   * ```
   */
  public updateConfig(config: Partial<Voice.STTConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/** 阿里云STT服务单例实例 */
let sttServiceInstance: AlicloudSTTService | null = null;

/**
 * 获取阿里云STT服务单例实例
 * @param config - 可选的STT配置参数，仅在首次创建时生效
 * @returns AlicloudSTTService - STT服务实例
 * @example
 * ```typescript
 * // 首次获取实例时可以传入配置
 * const service = getAlicloudSTTService({
 *   sampleRate: 16000,
 *   language: 'zh-cn'
 * });
 * 
 * // 后续获取同一个实例
 * const sameService = getAlicloudSTTService();
 * ```
 */
export function getAlicloudSTTService(config?: Partial<Voice.STTConfig>): AlicloudSTTService {
  if (!sttServiceInstance) {
    sttServiceInstance = new AlicloudSTTService(config);
  }
  return sttServiceInstance;
}

/** 导出阿里云STT服务类，供直接实例化使用 */
export default AlicloudSTTService;
