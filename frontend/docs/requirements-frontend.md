## 前端需求文档（MVP-必做）

### 产品目标
- 提供“可搜索角色 + 稳定人设 + 低延迟语音双向对话”的沉浸式体验。
- 会话内短期记忆与基础合规模块，让对话连贯、可控。

### 范围（本次仅必做）
- 角色检索与推荐
- 角色人设卡展示
- 语音双向流式对话（ASR→LLM→TTS），支持打断
- 会话内短期记忆（同会话上下文）
- 基础安全与版权提示
- 文本回退（当麦克风不可用时）

### 页面与路由（建议）
- `/roles`：角色列表与搜索
- `/role/:id`：角色详情与人设卡预览、开始对话
- `/chat/:sessionId`：语音对话页（含文本回退）
- 全站页脚展示版权/二创免责声明

### 核心用户流程
1. 进入 `/roles` 搜索或浏览 → 选中角色  
2. 查看 `/role/:id` 人设卡 → 点击“开始对话”  
3. 跳转 `/chat/:sessionId` → 授权麦克风 → 开始语音双向流式对话  
4. 可随时打断、静音、切文本输入回退 → 查看本轮会话历史  
5. 结束会话或返回角色列表

### 功能需求（P0）
- 角色检索与推荐
  - 搜索输入（防抖 300ms），展示结果与热门角色
  - 列表项含头像、名称、简介、标签、使用次数
- 角色人设卡展示
  - 展示角色背景、风格、口头禅、禁忌、适用人群、语言与语音预设
  - 显示内容安全提示（如年龄分级）
- 语音对话
  - 采集：启用麦克风，显示输入电平；网络/权限失败给出可见错误
  - 传输：与后端建立实时连接（优先 WebSocket 流式；弱网重连与断线恢复）
  - 展示：气泡式消息流，用户侧音频/转写，助手机器人侧音频/字幕；显示“生成中”占位
  - 打断：用户讲话时可中断助手播报，助手立刻止播并转入识别当前语音
  - 文本回退：输入框回退，回车发送，同步进入上下文
- 会话内短期记忆
  - 同一 `sessionId` 内保留近 N 轮（默认 20）上下文，用于对话连贯展示
- 基础安全与版权提示
  - 首次进入 `chat` 页顶部提示版权与敏感内容规避，可关闭但对会话持久
  - 当返回内容被“审查/替换”时，在消息气泡内标注“已安全处理”

### 非功能性需求
- 响应式布局：移动优先，≥375px 适配；桌面端两栏布局（人物卡/对话）
- 性能/延迟：语音首帧字幕 < 800ms；打断生效 < 150ms；平均 RTT < 200ms
- 稳定性：网络抖动自动重连（指数退避 ≤ 3 次），失败提供文本回退
- 可访问性：字幕/可见转写、键盘操作、对比度与可见加载状态
- 国际化：中英优先；UI 文案可配置

### 前端数据模型（示例）
```ts
type Role = {
  id: string;
  name: string;
  avatarUrl?: string;
  tags: string[];
  summary: string;
  prompt: {
    system: string;
    constraints: string[];
    speechStyle: { tone: string; formality: string; catchphrases?: string[] };
    safetyProfileId?: string;
  };
  voice?: { provider: string; voiceId: string; speed?: number; pitch?: number };
  languageDefault?: 'zh-CN' | 'en-US';
};

type ChatMessage =
  | { id: string; role: 'user'; type: 'audio' | 'text'; text?: string; audioUrl?: string; partial?: boolean; createdAt: string }
  | { id: string; role: 'assistant'; type: 'audio' | 'text'; text?: string; audioUrl?: string; partial?: boolean; safety?: { moderated: boolean; reason?: string }; createdAt: string };

type Session = { id: string; roleId: string; createdAt: string; memoryWindow: number };
```

### 实时通道协议（前端期望，WebSocket）
```json
// 出站（示例）
{ "type": "session.start", "sessionId": "sess_1", "roleId": "hp-harry", "lang": "auto" }
{ "type": "audio.user", "sequence": 1, "mime": "audio/webm;codecs=opus", "data": "<base64>" }
{ "type": "barge_in", "action": "stop_assistant" }
{ "type": "text.user", "text": "你好" }

// 入站（示例）
{ "type": "asr.partial", "text": "你 好", "sequence": 1 }
{ "type": "assistant.text", "final": false, "text": "很高兴见到你…" }
{ "type": "assistant.audio", "sequence": 5, "mime": "audio/mpeg", "data": "<base64>" }
{ "type": "moderation.flag", "level": "soft", "reason": "violence" }
{ "type": "session.ended" }
```

### 埋点（P0）
- 角色搜索曝光/点击、开始对话
- 语音会话时长、打断次数、失败原因、文本回退次数
- ASR/WSS 建连耗时、首帧延迟

### 验收标准（摘选）
- 搜索联想返回 < 500ms；角色详情完整渲染
- 允许无麦克风时使用文本回退；允许会话中随时打断且立即止播
- 同会话内展示近 20 轮消息；断线 10s 内可自动恢复
- 返回被安全替换时，UI 有明确标识

### 风险与降级
- 语音链路不可用 → 强制文本模式
- 高延迟 → 降级仅显示文本字幕，不自动播放音频
- 模型限流 → 降级至 mini/备用地区网关


