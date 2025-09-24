# JWT 双 Token 鉴权系统使用说明

## 概述

本项目已实现完整的 JWT 双 token 鉴权系统，包括 `accessToken` 和 `refreshToken` 的自动管理。

## 核心特性

### 1. **双 Token 机制**
- **Access Token**: 用于日常 API 请求认证，较短过期时间
- **Refresh Token**: 用于刷新 Access Token，较长过期时间
- **自动刷新**: Access Token 过期前自动使用 Refresh Token 更新

### 2. **Token 管理工具类**

```typescript
import { TokenManager, TokenRefreshService } from '@/utils/token';

// 存储 tokens 和用户 ID
TokenManager.setTokens(accessToken, refreshToken, userId);

// 获取信息
const accessToken = TokenManager.getAccessToken();
const refreshToken = TokenManager.getRefreshToken();
const userId = TokenManager.getUserId();

// 检查是否有 token
const hasToken = TokenManager.hasToken();

// 清理所有信息
TokenManager.clearTokens();

// 获取头部
const authHeader = TokenManager.getAuthorizationHeader(); // "Bearer xxx"
const refreshHeader = TokenManager.getRefreshHeader(); // "refresh_token_value"
const allHeaders = TokenManager.getAuthHeaders(); // { Authorization: "Bearer xxx", Refresh: "refresh_token" }
```

### 3. **自动请求拦截**

所有 API 请求会自动：
- 添加 `Authorization: Bearer <accessToken>` 头部（如果有 accessToken）
- 添加 `Refresh: <refreshToken>` 头部（如果有 refreshToken）
- 后端验证 token 过期，返回 40100/40101 错误码时自动刷新
- 处理 token 过期的响应，自动重试

### 4. **错误处理机制**

- **Token 过期**: 自动尝试刷新，失败则跳转登录页
- **Refresh Token 过期**: 清理所有 token，跳转登录页
- **网络错误**: 保持当前状态，显示错误信息

## API 接口要求

### 后端需要提供以下接口：

#### 1. 登录接口
```typescript
POST /api/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password", // 密码登录时
  "captcha": "123456"     // 验证码登录时
}

// 响应
{
  "code": 0,
  "data": {
  "id": 123,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
}
```

#### 2. Token 刷新接口
```typescript
POST /api/refresh
Content-Type: application/json
Refresh: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... // refresh token

// 响应
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 3. 受保护的 API
```typescript
GET /api/user/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... // access token
Refresh: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... // refresh token

// Token 过期响应
{
  "code": 40100, // 或 40101
  "msg": "Token expired"
}
```

## 登录流程

### 1. **邮箱密码登录**
```typescript
const res = await login({
  email: "user@example.com",
  password: "password"
});

// 自动存储 tokens 和用户 ID
TokenManager.setTokens(res.accessToken, res.refreshToken, res.id);
```

### 2. **邮箱验证码登录**
```typescript
// 发送验证码
await sendCaptcha({ email: "user@example.com" });

// 验证码登录
const res = await login({
  email: "user@example.com",
  captcha: "123456"
});

// 自动存储 tokens 和用户 ID
TokenManager.setTokens(res.accessToken, res.refreshToken, res.id);
```

## 登出流程

```typescript
// 点击登出按钮
const loginOut = async () => {
  // 可选：调用后端登出接口
  // await logoutAPI();
  
  // 必须：清理本地 tokens
  TokenManager.clearTokens();
  
  // 跳转到登录页
  history.push('/user/login');
};
```

## 自动刷新机制

### 触发条件
- Access Token 过期前 5 分钟（可配置）
- API 响应 40100/40101 错误码
- 手动调用检查方法

### 刷新流程
```typescript
// 自动检查并刷新
const success = await TokenRefreshService.checkAndRefreshToken(refreshTokenApi);

if (success) {
  // 继续执行原请求
} else {
  // 跳转登录页
  TokenManager.clearTokens();
  window.location.href = '/user/login';
}
```

## 安全考虑

### 1. **Token 存储**
- 使用 `localStorage` 存储（可考虑升级为 `httpOnly` cookie）
- 页面刷新时自动验证 token 有效性

### 2. **接口白名单**
以下接口不需要认证：
- `/api/login`
- `/api/register`
- `/api/captcha`
- `/api/token/refresh`

### 3. **错误处理**
- Token 刷新失败自动清理所有认证信息
- 防止无限刷新循环
- 并发请求时只执行一次刷新

## 配置说明

### 1. **后端验证模式**
前端不再验证 token 过期时间，完全依赖后端验证：
- 前端只负责存储和传递 token
- 后端验证 token 有效性并返回相应错误码
- 收到过期错误码时自动刷新 token

### 2. **请求拦截配置**
```typescript
// 在 requestConfig.ts 中的 skipAuthPaths 数组中添加不需要认证的路径
const skipAuthPaths = ['/api/login', '/api/register', '/api/captcha', '/api/refresh'];
```

### 3. **错误码配置**
```typescript
// 在响应拦截器中配置 token 过期的错误码
if (code === 40100 || code === 40101) {
  // Token 过期处理
}
```

## 开发调试

### 查看 Token 状态
```typescript
console.log('Access Token:', TokenManager.getAccessToken());
console.log('Refresh Token:', TokenManager.getRefreshToken());
console.log('Has Token:', TokenManager.hasToken());
```

### 手动清理 Token
```typescript
TokenManager.clearTokens();
```

### 手动刷新 Token
```typescript
const success = await TokenRefreshService.refreshToken(refreshTokenApi);
```

## 注意事项

1. **后端接口一致性**: 确保后端接口返回格式与前端期望一致
2. **时间同步**: 确保前后端时间同步，避免 token 过期判断错误
3. **并发处理**: 系统已处理并发请求时的 token 刷新竞态问题
4. **错误恢复**: token 相关错误会自动恢复，无需手动干预

## 升级建议

1. **使用 httpOnly Cookie**: 提高安全性，防止 XSS 攻击
2. **添加 token 加密**: 对本地存储的 token 进行加密
3. **实现指纹验证**: 结合设备指纹验证 token 有效性
4. **添加 SSO 支持**: 扩展支持单点登录机制
