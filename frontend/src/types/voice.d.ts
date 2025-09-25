// 前端语音服务相关类型定义

declare namespace Voice {
  // 阿里云STT服务相关类型定义
  type STTConfig = {
    sampleRate: number;
    channels: number;
    encoding: 'pcm' | 'webm' | 'wav';
    chunkDuration: number; // 音频分片时长，单位ms
    language?: string;
    enablePunctuation?: boolean;
    enableITN?: boolean; // 逆文本归一化
  };

  type STTStatus = 'disconnected' | 'connecting' | 'connected' | 'recognizing' | 'error';

  type VoiceRecognitionResult = {
    text: string;
    confidence: number;
    isFinal: boolean;
    startTime?: number;
    endTime?: number;
    words?: {
      word: string;
      startTime: number;
      endTime: number;
      confidence: number;
    }[];
  };

  type STTError = {
    code: string;
    message: string;
    details?: any;
  };

  type STTEvent = {
    type: 'start' | 'result' | 'end' | 'error' | 'volume';
    data: VoiceRecognitionResult | STTError | { volume: number } | null;
    timestamp: number;
  };

  // 音频处理相关类型
  type AudioConfig = {
    sampleRate: number;
    channels: number;
    bitDepth: number;
    bufferSize?: number;
    echoCancellation?: boolean;
    noiseSuppression?: boolean;
    autoGainControl?: boolean;
  };

  type AudioChunk = {
    data: ArrayBuffer;
    timestamp: number;
    duration: number;
  };

  // 事件处理器类型定义
  type STTEventHandlers = {
    onStatusChange?: (status: STTStatus) => void;
    onTextReceived?: (result: VoiceRecognitionResult) => void;
    onVolumeChange?: (volume: number) => void;
    onError?: (error: STTError) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
  };

  // 语音服务接口类型
  type VoiceServiceInterface = {
    startRecognition: (roleId: number, sessionId: string) => Promise<void>;
    stopRecognition: () => Promise<void>;
    setHandlers: (handlers: STTEventHandlers) => void;
    getStatus: () => STTStatus;
    getConfig: () => STTConfig;
    updateConfig: (config: Partial<STTConfig>) => void;
  };
}
