// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 此处后端没有提供注释 GET /api/character */
export async function getCharacter(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getCharacterParams,
  options?: { [key: string]: any },
) {
  return request<API.getCharacterResponse>('/api/character', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /api/character */
export async function newCharacter(
  body: API.NewCharacterRequest,
  options?: { [key: string]: any },
) {
  return request<API.NewCharacterResponse>('/api/character', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
