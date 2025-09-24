## 后端需求文档（MVP-必做）

### 目标
- 提供角色检索、人设卡服务、实时语音对话通道、短期记忆上下文、基础内容安全，满足低延迟与稳定性。

### 架构概要
- API 网关（REST + WebSocket）
- 角色服务（角色库、推荐）
- 会话服务（会话创建、上下文短期记忆）
- 实时对话服务（WS 会话编排：ASR→LLM→TTS，打断处理）
- 安全与合规模块（输入/输出双向审核、事件日志）
- 第三方提供商适配层（OpenAI/Claude/Qwen/本地 ASR/TTS）

### 数据模型（建议）
- `roles`：id, name, tags[], avatar_url, summary, prompt(system, constraints[], speech_style, safety_profile_id), voice(provider, voice_id, speed, pitch), language_default, created_at, updated_at
- `sessions`：id, role_id, user_id/null, memory_window, created_at, status
- `messages`：id, session_id, sender(user|assistant|system), type(text|audio), text, audio_url/blob_ref, is_partial, safety_json, created_at
- `safety_logs`：id, session_id, direction(in|out), level, reason, payload_ref, created_at
- `usage_stats`：session_id, tokens_in, tokens_out, audio_secs_in, audio_secs_out, provider_cost

### API（REST，P0）
- GET `/api/roles?query=&limit=&cursor=`：角色搜索/分页
- GET `/api/roles/recommend`：热门/个性化推荐
- GET `/api/roles/:id`：角色详情
- POST `/api/sessions`：创建会话 `{ roleId, memoryWindow? } → { id }`
- GET `/api/sessions/:id/messages?limit=&before=`：拉取会话消息（文本回退/历史）
- POST `/api/sessions/:id/messages`：文本消息入口 `{ text } → 202 Accepted`
- GET `/api/policies/disclaimer`：获取版权与内容提示文案
- 健康检查 GET `/api/health`：包含依赖项探针

### 实时通道（WebSocket，P0）
- 路径：`/ws/chat?sessionId=...`
- 鉴权：Bearer Token 或匿名会话令牌（短期、会话绑定）
- 消息类型（与前端约定一致）
  - 入站：`session.start` | `audio.user` | `text.user` | `barge_in` | `session.end`
  - 出站：`asr.partial` | `assistant.text` | `assistant.audio` | `moderation.flag` | `error` | `session.ended`
- 媒体
  - 输入：`audio/webm;codecs=opus`（分片 base64）；每片 ≤ 200ms，序号递增
  - 输出：`audio/mpeg` 或 `audio/ogg;codecs=opus`（分片）
- 打断（barge-in）
  - 收到 `barge_in.stop_assistant` 后停止当前 TTS 队列与生成，重置解码缓冲
- 时序保障
  - 使用 `sequence` 单调递增；乱序包按序合并；超时丢弃

### 编排逻辑（服务端）
1. 音频分片 → ASR 流式转写（增量 partial）  
2. 触发 LLM 流式生成（走人设卡 + 会话 N 轮摘要/截断）  
3. 同步送 TTS 流式合成，边合成边下发  
4. 如用户打断：取消 LLM/TTS 未完成任务，清理输出缓冲  
5. 将最终文本与音频片存档到 `messages`

### 模型与提供商（抽象接口）
- ASR：`transcribeStream(frame) → partial/final text`（Aliyun/Volcengine/OpenAI Realtime 视区域选择）
- LLM：`completeStream(messages, persona, safetyCtx) → tokens`
- TTS：`synthesizeStream(text, voice) → audio chunks`
- Moderation：`classify(input|output) → level, reason, action(rewrite|block|pass)`
- 地域路由：海外优先 GPT-4o Realtime/mini；国内优先 Qwen + 本地 ASR/TTS

### 安全与合规（P0）
- 输入/输出双向审核；命中“软违规”→重写/遮蔽；“硬违规”→阻断并返回 `moderation.flag`
- 角色版权与二创免责声明接口化；未成年人保护（青少年策略）
- 日志脱敏存储；字段级加密（如用户标识）

### 性能指标（P0）
- WS 建连 < 400ms；ASR 首个 partial < 800ms；打断处理 < 150ms
- 并发：1k 持久连接（水平扩展）；WS 心跳 30s；空闲 2 分钟断开
- 速率限制：每连接入站帧 ≤ 50 rps；文本消息 ≤ 10 rpm；全局并发 LLM 流 ≤ N

### 错误与重试
- 标准错误码：`error.code`（`AUTH_FAILED`/`RATE_LIMIT`/`ASR_TIMEOUT`/`LLM_PROVIDER_DOWN`/`TTS_FAILED`）
- 重试策略：ASR/LLM/TTS 级联降级（切换 mini/备用区/仅文本）

### 监控与可观测
- 指标：首帧时延、整句时延、打断响应、ASR/LLM/TTS 成功率、错误码分布、成本
- 日志：会话级 traceId；消息级 sequence；审计安全事件
- 报警：错误率/延迟阈值、依赖健康检查失败

### 验收标准（摘选）
- 完整打通：`/api/roles`、`/api/sessions`、`/ws/chat` 正常工作
- 语音对话可持续 5 分钟无明显累积延迟；随时打断即时生效
- 被审核内容返回明确 `moderation.flag` 并完成“重写或拦截”
- 短期记忆生效：近 20 轮上下文摘要/截断策略正确

### 风险与降级
- 提供商不稳定 → 动态切换备用提供商/mini 模型
- 异构音频格式 → 统一转码（ffmpeg）至内部标准（16k 单声道）
- 成本突增 → 峰值限流与按角色配额


