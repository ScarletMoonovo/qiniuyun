// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 此处后端没有提供注释 GET /api/auth/github */
export async function githubOauth(options?: { [key: string]: any }) {
  return request<string>('/api/auth/github', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /api/auth/github/callback */
export async function githubCallback(options?: { [key: string]: any }) {
  return request<string>('/api/auth/github/callback', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /api/avatar */
export async function postAvatar(options?: { [key: string]: any }) {
  return request<string>('/api/avatar', {
    method: 'POST',
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /api/captcha */
export async function sendCaptcha(body: API.CaptchaRequest, options?: { [key: string]: any }) {
  return request<string>('/api/captcha', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /api/login */
export async function login(body: API.LoginRequest, options?: { [key: string]: any }) {
  return request<API.LoginResponse>('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /api/refresh */
export async function refreshToken(refreshTokenValue: string, options?: { [key: string]: any }) {
  return request<API.RefreshResponse>('/api/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': refreshTokenValue,
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /api/register */
export async function register(body: API.RegisterRequest, options?: { [key: string]: any }) {
  return request<API.RegisterResponse>('/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 PUT /api/user */
export async function updateUserinfo(body: API.UserExtend, options?: { [key: string]: any }) {
  return request<string>('/api/user', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /api/user/${param0} */
export async function getUserInfo(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getUserInfoParams,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.UserInfo>(`/api/user/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /api/user/name */
export async function getUserByName(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getUserByNameParams,
  options?: { [key: string]: any },
) {
  return request<API.GetUserByNameResponse>('/api/user/name', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 PUT /api/user/password */
export async function changePwd(body: API.ChangePwdRequest, options?: { [key: string]: any }) {
  return request<string>('/api/user/password', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
