// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 此处后端没有提供注释 GET /api/chat/${param0} */
export async function chat(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.chatParams,
  options?: { [key: string]: any },
) {
  const { session_id: param0, ...queryParams } = params;
  return request<string>(`/api/chat/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /api/session */
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

/** 此处后端没有提供注释 POST /api/session */
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
