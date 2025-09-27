import { BACKEND_HOST_LOCAL, BACKEND_HOST_PROD } from '@/constants';
import { TokenManager, TokenRefreshService } from '@/utils/token';
import type { RequestOptions } from '@@/plugin-request/request';
import type { RequestConfig } from '@umijs/max';
import { message } from 'antd';

// 与后端约定的响应数据格式
interface ResponseStructure {
  code: number;
  msg: string;
  data: any;
}

const isDev = process.env.NODE_ENV === 'development';

// Token 刷新 API（避免循环依赖）
const refreshTokenApi = async (refreshToken: string) => {
  const response = await fetch(`${isDev ? BACKEND_HOST_LOCAL : BACKEND_HOST_PROD}/api/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': refreshToken, // 通过 Authorization 头部传递 refreshToken
    },
  });
  
  if (!response.ok) {
    throw new Error('Token refresh failed');
  }
  
  const data = await response.json();
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  };
};

/**
 * @name 错误处理
 * pro 自带的错误处理， 可以在这里做自己的改动
 * @doc https://umijs.org/docs/max/request#配置
 */
export const requestConfig: RequestConfig = {
  baseURL: isDev ? BACKEND_HOST_LOCAL : BACKEND_HOST_PROD,
  withCredentials: true,

  // 请求拦截器
  requestInterceptors: [
    (config: RequestOptions) => {
      // 跳过不需要认证的接口
      const skipAuthPaths = ['/api/login', '/api/register', '/api/captcha', '/api/refresh'];
      const needAuth = !skipAuthPaths.some(path => config.url?.includes(path));
      
      if (needAuth) {
        // 添加认证头部（Authorization）
        const authHeader = TokenManager.getAuthorizationHeader();
        if (authHeader) {
          config.headers = {
            ...config.headers,
            Authorization: authHeader,
          };
        }
      }
      
      return config;
    },
  ],

  // 响应拦截器
  responseInterceptors: [
    async (response) => {
      // 请求地址
      const requestPath: string = response.config.url ?? '';

      // 响应
      const { data } = response as unknown as ResponseStructure;
      if (!data) {
        throw new Error('服务异常');
      }

      // 错误码处理
      const code: number = data.code;
      
      // Token 过期或无效 (根据后端约定的错误码)
      if (code === 40100 || code === 40101 || code === 401) {
        // 如果不是登录相关接口，尝试刷新 token
        const skipAuthPaths = ['/api/login', '/api/register', '/api/captcha', '/api/refresh'];
        const isAuthPath = skipAuthPaths.some(path => requestPath.includes(path));
        
        if (!isAuthPath && !location.pathname.includes('/user/login')) {
          try {
            // 尝试刷新 token
            const refreshSuccess = await TokenRefreshService.refreshToken(refreshTokenApi);
            if (refreshSuccess) {
              // 刷新成功，重新发起请求
              message.warning('登录状态已更新，请重试操作');
              throw new Error('Token refreshed, please retry');
            } else {
              // 刷新失败，跳转登录页
              TokenManager.clearTokens();
              window.location.href = `/user/login?redirect=${encodeURIComponent(window.location.href)}`;
              throw new Error('请先登录');
            }
          } catch (refreshError: any) {
            console.error('Token refresh failed:', refreshError);
            // 只有在真正的刷新错误时才清理和跳转
            if (refreshError.message !== 'Token refreshed, please retry') {
              TokenManager.clearTokens();
              window.location.href = `/user/login?redirect=${encodeURIComponent(window.location.href)}`;
              throw new Error('请先登录');
            } else {
              // 重新抛出刷新成功的错误，让外层处理重试
              throw refreshError;
            }
          }
        }
      }

      if (code !== 0) {
        throw new Error(data.msg ?? '服务器错误');
      }
      return data;
    },
  ],
};
