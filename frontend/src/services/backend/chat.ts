// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 开始聊天，用于与后端的ws连接 GET /api/chat */
export async function chat(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.chatParams,
  options?: { [key: string]: any },
) {
  return request<string>('/api/chat', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 获取对话 GET /api/session */
export async function getSession(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getSessionParams,
  options?: { [key: string]: any },
) {
  return request<API.GetSessionResponse>('/api/session', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 新建会话时创建Session POST /api/session */
export async function newSession(body: API.NewSessionRequest, options?: { [key: string]: any }) {
  return request<API.NewSessionResponse>('/api/session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

// /** 获取聊天历史 GET /api/chat/history */
// export async function getChatHistory(
//   params?: API.GetChatHistoryParams,
//   options?: { [key: string]: any }
// ) {
//   return request<API.GetChatHistoryResponse>('/api/chat/history', {
//     method: 'GET',
//     params,
//     ...(options || {}),
//   });
// }

// /** 获取会话消息 GET /api/chat/sessions/:sessionId/messages */
// export async function getChatMessages(
//   params: API.GetChatMessagesParams,
//   options?: { [key: string]: any }
// ) {
//   return request<API.GetChatMessagesResponse>(`/api/chat/sessions/${params.sessionId}/messages`, {
//     method: 'GET',
//     params: {
//       page: params.page,
//       pageSize: params.pageSize,
//     },
//     ...(options || {}),
//   });
// }

// /** 发送文本消息 POST /api/chat/messages */
// export async function sendTextMessage(
//   body: API.SendTextMessageRequest,
//   options?: { [key: string]: any }
// ) {
//   return request<API.SendMessageResponse>('/api/chat/messages', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     data: body,
//     ...(options || {}),
//   });
// }

// /** 发送STT识别的文本消息到后端进行LLM处理 POST /api/chat/stt-text */
// export async function sendSTTText(
//   body: {
//     roleId: number;
//     sessionId?: string;
//     text: string;
//     isFinal: boolean;
//   },
//   options?: { [key: string]: any }
// ) {
//   return request<API.SendMessageResponse>('/api/chat/stt-text', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     data: body,
//     ...(options || {}),
//   });
// }

// /** 删除聊天会话 DELETE /api/chat/sessions/:sessionId */
// export async function deleteChatSession(
//   sessionId: string,
//   options?: { [key: string]: any }
// ) {
//   return request<{ success: boolean }>(`/api/chat/sessions/${sessionId}`, {
//     method: 'DELETE',
//     ...(options || {}),
//   });
// }

// /** 删除消息 DELETE /api/chat/messages/:messageId */
// export async function deleteChatMessage(
//   messageId: string,
//   options?: { [key: string]: any }
// ) {
//   return request<{ success: boolean }>(`/api/chat/messages/${messageId}`, {
//     method: 'DELETE',
//     ...(options || {}),
//   });
// }

// /** 获取后端WebSocket连接token GET /api/chat/ws-token */
// export async function getBackendWebSocketToken(
//   roleId: number,
//   options?: { [key: string]: any }
// ) {
//   return request<{ token: string; wsUrl: string }>('/api/chat/ws-token', {
//     method: 'GET',
//     params: { roleId },
//     ...(options || {}),
//   });
// }

// /** 开始语音会话 POST /api/chat/voice-session/start */
// export async function startVoiceSession(
//   body: {
//     roleId: number;
//     sessionId?: string;
//   },
//   options?: { [key: string]: any }
// ) {
//   return request<{
//     sessionId: string;
//     backendWsUrl: string;
//     token: string;
//   }>('/api/chat/voice-session/start', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     data: body,
//     ...(options || {}),
//   });
// }

// /** 结束语音会话 POST /api/chat/voice-session/end */
// export async function endVoiceSession(
//   body: {
//     sessionId: string;
//   },
//   options?: { [key: string]: any }
// ) {
//   return request<{ success: boolean }>('/api/chat/voice-session/end', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     data: body,
//     ...(options || {}),
//   });
// }
