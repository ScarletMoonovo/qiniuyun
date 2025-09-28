import { useRef, useState, useCallback, useEffect } from 'react';
import { message } from 'antd';

interface AliSpeechConfig {
  appkey: string;
  token: string;
  enableIntermediate?: boolean;
}

interface UseAliSpeechRecognitionOptions {
  onTranscription?: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export interface UseAliSpeechRecognitionReturn {
  isConnected: boolean;
  isRecording: boolean;
  connect: (config: AliSpeechConfig) => void;
  disconnect: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  currentText: string;
}

// 生成 UUID - 与demo保持一致
const generateUUID = (): string => {
  return (([1e7] as any) + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c: any) =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  ).replace(/-/g, '');
};

const useAliSpeechRecognition = (
  options: UseAliSpeechRecognitionOptions = {}
): UseAliSpeechRecognitionReturn => {
  const {
    onTranscription,
    onError,
    onConnected,
    onDisconnected,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentText, setCurrentText] = useState('');

  const websocketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const audioInputRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const taskIdRef = useRef<string>('');

  // 连接到阿里云语音识别服务
  const connect = useCallback((config: AliSpeechConfig) => {
    if (isConnected) {
      console.warn('Already connected to speech recognition service');
      return;
    }

    const socketUrl = `wss://nls-gateway.cn-shanghai.aliyuncs.com/ws/v1?token=${config.token}`;
    
    try {
      const ws = new WebSocket(socketUrl);
      websocketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        onConnected?.();
        console.log('Connected to Ali Speech Recognition');

        // 生成任务ID
        taskIdRef.current = generateUUID();

        // 发送开始转录命令
        const startTranscriptionMessage = {
          header: {
            appkey: config.appkey,
            namespace: "SpeechTranscriber",
            name: "StartTranscription",
            task_id: taskIdRef.current,
            message_id: generateUUID()
          },
          payload: {
            "format": "pcm",
            "sample_rate": 16000,
            "enable_intermediate_result": config.enableIntermediate ?? true,
            "enable_punctuation_prediction": true,
            "enable_inverse_text_normalization": true
          }
        };

        ws.send(JSON.stringify(startTranscriptionMessage));
      };

      ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          console.log('Speech recognition response:', response);

          if (response.header.name === "TranscriptionStarted") {
            console.log('Transcription started successfully');
          } else if (response.header.name === "TranscriptionResultChanged") {
            // 实时识别结果
            const text = response.payload?.result || '';
            setCurrentText(text);
            onTranscription?.(text, false);
          } else if (response.header.name === "SentenceEnd") {
            // 句子结束，最终结果
            const text = response.payload?.result || '';
            setCurrentText('');
            onTranscription?.(text, true);
          } else if (response.header.name === "TranscriptionCompleted") {
            // 转录完成
            console.log('Transcription completed');
          }
        } catch (error) {
          console.error('Failed to parse speech recognition response:', error);
          onError?.('Failed to parse response from speech service');
        }
      };

      ws.onerror = (error) => {
        console.error('Speech recognition WebSocket error:', error);
        onError?.('Speech recognition connection error');
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('Speech recognition connection closed');
        setIsConnected(false);
        setIsRecording(false);
        onDisconnected?.();
        websocketRef.current = null;
      };

    } catch (error) {
      console.error('Failed to connect to speech recognition:', error);
      onError?.('Failed to connect to speech recognition service');
    }
  }, [isConnected, onConnected, onTranscription, onError, onDisconnected]);

  // 断开连接
  const disconnect = useCallback(() => {
    if (websocketRef.current) {
      websocketRef.current.close();
    }
    
    // 清理音频资源
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    
    if (audioInputRef.current) {
      audioInputRef.current.disconnect();
      audioInputRef.current = null;
    }
    
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsConnected(false);
    setIsRecording(false);
    setCurrentText('');
  }, []);

  // 开始录音
  const startRecording = useCallback(async () => {
    if (!isConnected || isRecording) {
      return;
    }

    try {
      // 获取音频输入设备 - 与demo保持一致
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioStreamRef.current = stream;

      // 创建音频上下文 - 与demo保持一致
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000
      });
      audioContextRef.current = audioContext;

      const audioInput = audioContext.createMediaStreamSource(stream);
      audioInputRef.current = audioInput;

      // 设置缓冲区大小为2048的脚本处理器 - 与demo保持一致
      const scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);
      scriptProcessorRef.current = scriptProcessor;

      scriptProcessor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        const inputData16 = new Int16Array(inputData.length);
        
        // 转换为 PCM 16位 - 与demo保持一致
        for (let i = 0; i < inputData.length; ++i) {
          inputData16[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF; // PCM 16-bit
        }

        // 发送音频数据
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
          websocketRef.current.send(inputData16.buffer);
          console.log('发送音频数据块');
        }
      };

      audioInput.connect(scriptProcessor);
      scriptProcessor.connect(audioContext.destination);

      setIsRecording(true);
      console.log('Recording started');

    } catch (error) {
      console.error('Failed to start recording:', error);
      onError?.('Failed to access microphone');
      message.error('无法访问麦克风，请检查权限设置');
    }
  }, [isConnected, isRecording, onError]);

  // 停止录音
  const stopRecording = useCallback(() => {
    if (!isRecording) {
      return;
    }

    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    
    if (audioInputRef.current) {
      audioInputRef.current.disconnect();
      audioInputRef.current = null;
    }
    
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsRecording(false);
    setCurrentText('');
    console.log('Recording stopped');
  }, [isRecording]);

  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isRecording,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    currentText,
  };
};

export default useAliSpeechRecognition;
