/**
 * JWT 双 Token 管理工具类
 * 实现 accessToken 和 refreshToken 的存储、获取、刷新机制
 */

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_ID_KEY = 'user_id';

export class TokenManager {
  /**
   * 存储 token 信息和用户 ID
   */
  static setTokens(accessToken: string, refreshToken: string, userId?: number) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    if (userId) {
      localStorage.setItem(USER_ID_KEY, userId.toString());
    }
  }

  /**
   * 获取 access token
   */
  static getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  /**
   * 获取 refresh token
   */
  static getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  /**
   * 获取用户 ID
   */
  static getUserId(): string | null {
    return localStorage.getItem(USER_ID_KEY);
  }

  /**
   * 检查是否有 token（不验证过期时间，由后端验证）
   */
  static hasToken(): boolean {
    const accessToken = this.getAccessToken();
    return !!accessToken;
  }

  /**
   * 清除所有 token 信息
   */
  static clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
  }

  /**
   * 获取 Authorization 头部值（Access Token）
   */
  static getAuthorizationHeader(): string | null {
    const token = this.getAccessToken();
    return token ? `Bearer ${token}` : null;
  }

  /**
   * 获取 Refresh 头部值（Refresh Token）
   */
  static getRefreshHeader(): string | null {
    return this.getRefreshToken();
  }

  /**
   * 获取所有认证头部
   */
  static getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    const accessToken = this.getAccessToken();
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      headers.Refresh = refreshToken;
    }
    
    return headers;
  }
}

/**
 * Token 刷新服务
 */
export class TokenRefreshService {
  private static isRefreshing = false;
  private static refreshPromise: Promise<boolean> | null = null;

  /**
   * 刷新 token
   * @param refreshTokenApi 刷新 token 的 API 函数
   */
  static async refreshToken(
    refreshTokenApi: (refreshToken: string) => Promise<{
      accessToken: string;
      refreshToken: string;
    }>
  ): Promise<boolean> {
    // 如果正在刷新，返回已有的 Promise
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) {
      TokenManager.clearTokens();
      return false;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performRefresh(refreshTokenApi, refreshToken);

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * 执行 token 刷新
   */
  private static async performRefresh(
    refreshTokenApi: (refreshToken: string) => Promise<{
      accessToken: string;
      refreshToken: string;
    }>,
    refreshToken: string
  ): Promise<boolean> {
    try {
      const response = await refreshTokenApi(refreshToken);
      
      // 更新 token
      TokenManager.setTokens(
        response.accessToken,
        response.refreshToken
      );
      
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // 刷新失败，清除所有 token
      TokenManager.clearTokens();
      return false;
    }
  }
}

export default TokenManager;
