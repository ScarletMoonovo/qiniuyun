import { useEffect, useRef, useState, useCallback } from 'react';

interface Message {
  id: number;
  sessionId: number;
  role: string;
  content: string;
  metadata: string;
  createdAt: Date;
}

// type为message，则会返回Msg
// type为delta，则返回content，content代表流式数据
// type为done代表流式数据结束
// type为audio，则返回audio，audio代表语音数据
interface ResponseMessage {
  type: 'message' | 'delta' | 'done' | 'audio';
  msg?: Message;
  content?: string;
  audio?: ArrayBuffer; // byte[]
}

// type为auth，表示需要鉴权，则需带上token
// type为text，表示需要发送文本消息，需带上content
// type为voice，表示需要发送语音消息转换成的文本消息，需带上content
interface RequestMessage {
    type: 'auth' | 'text' | 'voice';
    token?: string;
    content: string;
}

export interface UseWebSocketOptions {
  // 连接选项
  protocols?: string | string[];
  // 重连选项
  reconnectLimit?: number;
  reconnectInterval?: number;
  // 事件回调
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (event: ResponseMessage) => void;
}

export interface UseWebSocketReturn {
  // WebSocket 实例
  socket: WebSocket | null;
  // 连接状态
  readyState: number;
  // 最后收到的消息
  lastMessage: ResponseMessage | null;
  // 发送消息
  sendMessage: (message: string | ArrayBufferLike | Blob | ArrayBufferView) => void;
  // 手动连接
  connect: () => void;
  // 手动断开连接
  disconnect: () => void;
  // 重连
  reconnect: () => void;
}

const useWebSocket = (
  url: string | null,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn => {
  const {
    protocols,
    reconnectLimit = 3,
    reconnectInterval = 3000,
    onOpen,
    onClose,
    onError,
    onMessage,
  } = options;

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING);
  const [lastMessage, setLastMessage] = useState<ResponseMessage | null>(null);
  
  const reconnectCount = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout>();
  const socketRef = useRef<WebSocket | null>(null);

  // 清理重连定时器
  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = undefined;
    }
  }, []);

  // 创建 WebSocket 连接
  const createWebSocket = useCallback(() => {
    if (!url) return;

    try {
      const ws = new WebSocket(url, protocols);
      socketRef.current = ws;
      setSocket(ws);
      setReadyState(ws.readyState);

      ws.onopen = (event) => {
        setReadyState(WebSocket.OPEN);
        reconnectCount.current = 0; // 重置重连计数
        clearReconnectTimer();
        onOpen?.(event);
      };

      ws.onclose = (event) => {
        setReadyState(WebSocket.CLOSED);
        socketRef.current = null;
        setSocket(null);
        onClose?.(event);

        // 如果不是手动关闭且还有重连次数，则尝试重连
        if (!event.wasClean && reconnectCount.current < reconnectLimit) {
          reconnectTimer.current = setTimeout(() => {
            reconnectCount.current++;
            createWebSocket();
          }, reconnectInterval);
        }
      };

      ws.onerror = (event) => {
        setReadyState(WebSocket.CLOSED);
        onError?.(event);
      };

      ws.onmessage = (event) => {
        try {
          const responseMessage: ResponseMessage = JSON.parse(event.data);
          setLastMessage(responseMessage);
          onMessage?.(responseMessage);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error, event.data);
        }
      };

    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }
  }, [url, protocols, reconnectLimit, reconnectInterval, onOpen, onClose, onError, onMessage, clearReconnectTimer]);

  // 发送消息
  const sendMessage = useCallback((message: string | ArrayBufferLike | Blob | ArrayBufferView) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(message);
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  }, []);

  // 手动连接
  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      return; // 已经连接，无需重复连接
    }
    reconnectCount.current = 0;
    createWebSocket();
  }, [createWebSocket]);

  // 手动断开连接
  const disconnect = useCallback(() => {
    clearReconnectTimer();
    reconnectCount.current = reconnectLimit; // 阻止自动重连
    if (socketRef.current) {
      socketRef.current.close(1000, 'Manual disconnect');
    }
  }, [reconnectLimit, clearReconnectTimer]);

  // 手动重连
  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      connect();
    }, 100);
  }, [connect, disconnect]);

  // 初始化连接
  useEffect(() => {
    if (url) {
      createWebSocket();
    }

    return () => {
      clearReconnectTimer();
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [url, createWebSocket, clearReconnectTimer]);

  // 更新连接状态
  useEffect(() => {
    if (socket) {
      setReadyState(socket.readyState);
    }
  }, [socket]);

  return {
    socket,
    readyState,
    lastMessage,
    sendMessage,
    connect,
    disconnect,
    reconnect,
  };
};

export default useWebSocket;
