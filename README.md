# RoleTalk

本项目是一个基于现代 Web 技术与外部 AI 服务构建的交互式平台，用户可以创建和管理个性化的 AI 角色，并通过文本和语音与角色进行实时对话。

---

## ✨ 平台功能

- **角色管理**
    - 创建个性化 AI 角色（姓名、背景、描述、性格特征、语音模型）
    - 编辑与查看角色详情
    - 浏览与发现其他用户的角色

- **实时聊天**
    - 文本聊天：支持实时双向通信与会话记录
    - 语音聊天：支持语音输入（STT）与语音回复（TTS）
    - 集成 AI 服务，实现智能对话与语音合成

- **会话管理**
    - 支持历史记录
    - 个性化角色收藏

---

## 🏗 系统架构

平台采用 **前后端分离 + 外部 AI 服务集成** 的架构：

- **前端应用**：React + UmiJS + Ant Design Pro
- **服务层**：统一封装后端与外部服务接口
- **AI 服务**：接入 LLM、阿里云 STT/TTS、向量检索等
- **核心页面**：
    - `pages/Role/Home`：角色浏览与发现
    - `pages/Role/Create`：角色创建
    - `pages/Role/Edit`：角色编辑
    - `pages/Role/Detail`：角色详情
    - `pages/Role/Chat`：角色聊天

---

## ⚙️ 技术栈

| 层级              | 技术方案                                      | 作用                     |
| ----------------- | --------------------------------------------- | ------------------------ |
| 前端框架          | React 18 + TypeScript                        | 组件化开发，类型安全     |
| 构建与路由        | UmiJS 4.x                                    | 路由管理与构建工具链     |
| UI 框架           | Ant Design 5.x + Pro Components              | 统一设计系统与预构建组件 |
| 状态管理          | React Hooks                                  | 页面级状态管理           |
| 实时通信          | WebSocket + Socket.IO                        | 实时双向通信             |
| 语音处理          | MediaRecorder API + Web Audio API            | 音频采集与播放           |
| 外部 AI 服务      | 阿里云 STT/TTS + LLM APIs                    | 语音识别、语音合成与对话 |

---

## 💬 核心模块

### 角色管理系统
- 页面：`Create`、`Edit`、`Detail`、`Home`
- 组件：`RoleCard`、语音模型选择器、标签管理
- 服务：角色管理 API、上传 Token 服务、语音模型 API

### 实时聊天系统
- 页面：`Chat`
- 组件：`MessageList`、`TextChatInput`、`RealtimeVoiceControls`
- 服务：`socketService`、`alicloudSTTService`
- 流程：
    1. 用户语音采集 → 阿里云 STT → 文本识别
    2. 文本输入传输至后端 → LLM 处理 → 生成回复
    3. 回复文本 → TTS 合成 → 语音输出

---

## 🔄 数据流架构

- **语音对话**：采用 **双 WebSocket 模式**
    - 前端 → 阿里云 STT：低延迟语音识别
    - 前端 → 后端服务：文本交互、LLM 处理、TTS 合成

数据流包括：
1. 语音采集与上传
2. STT 实时识别
3. 文本消息传输与处理
4. LLM 回复生成
5. TTS 合成与音频回传
6. 前端播放 AI 回复音频

---

## 🛠 开发架构

- **模块化组件设计**：单一职责，清晰边界
- **服务层抽象**：所有 API 调用通过独立服务模块封装
- **类型安全**：TypeScript 接口定义，编译期校验
- **可复用工具**：语音、Socket、云服务调用抽象为独立工具

平台在 **Ant Design Pro 基础设施** 上扩展，结合 AI 功能模块，提供完整的角色管理与对话体验。

---

## 📚 参考文档


- 前端文档：[Frontend Implementation](docs/frontend)
- 后端文档：[Backend Implementation](docs/backend)