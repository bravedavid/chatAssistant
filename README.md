# 💬 ChatAI - AI 聊天助手

一个基于 Next.js 的智能聊天回复助手，帮助您在与他人聊天时生成个性化的回复建议。通过配置联系人信息和回复风格，AI 会根据对话上下文为您提供合适的回复选项。

## ✨ 主要功能

### 🎯 核心特性

- **多对话管理** - 创建和管理多个独立的对话，每个对话对应不同的联系人
- **联系人信息配置** - 设置对方的姓名、年龄、职业、背景和关系，让 AI 更好地理解对话场景
- **个性化回复风格** - 选择回复风格（幽默、成熟、调皮、温柔、专业等），或自定义额外要求
- **智能回复建议** - 基于对话历史和联系人信息，AI 会生成 3 个不同风格的回复建议
- **消息分类** - 区分"对方发来的"和"我发送的"消息，保持对话历史清晰
- **多 AI 服务商支持** - 支持 OpenAI、Anthropic、DeepSeek、Moonshot、OpenRouter 等多个服务商
- **响应式设计** - 完美适配桌面端和移动端

### 🚀 使用场景

- 与朋友、同事、客户等不同关系的人聊天时，需要合适的回复建议
- 在重要对话中，希望获得更专业或更得体的回复选项
- 需要根据不同场景调整回复风格（如工作场景用专业风格，朋友聊天用幽默风格）
- 想要提高沟通效率，快速获得回复灵感

## 🛠️ 技术栈

- **框架**: Next.js 16 (App Router)
- **UI 库**: React 19
- **语言**: TypeScript
- **样式**: Tailwind CSS 4
- **AI SDK**: Vercel AI SDK (`@ai-sdk/openai`)
- **图标**: Lucide React
- **状态管理**: React Context API
- **数据存储**: localStorage（本地存储）

## 📦 安装与运行

### 前置要求

- Node.js 18+ 
- npm / yarn / pnpm / bun

### 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 开发模式

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本

```bash
npm run build
npm start
```

## 🔧 配置

### API 设置

首次使用需要配置 AI 服务商的 API Key：

1. 点击侧边栏底部的"配置 API"按钮
2. 选择服务商（OpenAI、Anthropic、DeepSeek、Moonshot 或 OpenRouter）
3. 输入您的 API Key
4. 选择模型（如 GPT-4o、Claude 3.5 Sonnet 等）
5. （可选）配置自定义 Base URL（用于代理）
6. 点击"测试连接"验证配置
7. 保存设置

### 支持的 AI 服务商

| 服务商 | 支持的模型 |
|--------|-----------|
| **OpenAI** | GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-3.5 Turbo |
| **Anthropic** | Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus |
| **DeepSeek** | DeepSeek Chat, DeepSeek Coder |
| **Moonshot** | Moonshot v1 8K/32K/128K |
| **OpenRouter** | 支持多种模型（Claude、GPT、Gemini、Llama 等） |

## 📖 使用指南

### 创建新对话

1. 点击"新建对话"按钮
2. 填写对方信息：
   - **称呼**（必填）：对方的姓名或称呼
   - **年龄**：可选
   - **职业**：可选
   - **关系**：如朋友、同事、客户等
   - **背景信息**：其他有助于 AI 理解的信息
3. 选择回复风格：幽默、成熟、调皮、温柔、专业、高冷、直接、委婉
4. （可选）添加额外要求：如"回复简短一些"、"多用表情"等
5. 点击"开始对话"

### 使用对话

1. **添加对方消息**：粘贴或输入对方发来的消息，点击"对方发来的"按钮
2. **查看 AI 建议**：AI 会自动分析并生成 3 个回复建议
3. **使用建议**：
   - 点击建议可直接填入输入框
   - 点击复制按钮可复制到剪贴板
   - 修改后点击"我发送的"发送消息
4. **编辑设置**：点击右上角设置图标可修改联系人信息和回复风格

### 管理对话

- **切换对话**：在侧边栏点击对话列表切换
- **删除对话**：鼠标悬停在对话上，点击删除图标
- **编辑配置**：在对话界面点击设置图标

## 📁 项目结构

```
chatAI/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   ├── chat/         # 聊天 API（生成回复建议）
│   │   └── test-connection/  # API 连接测试
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 主页面
├── components/            # React 组件
│   ├── APISettings.tsx   # API 配置组件
│   ├── ChatConfig.tsx     # 对话配置表单
│   ├── ChatInterface.tsx  # 聊天界面
│   └── Sidebar.tsx        # 侧边栏
├── lib/                  # 工具函数和类型
│   ├── api-config.ts     # API 配置管理
│   ├── chat-context.tsx  # 聊天状态管理（Context）
│   ├── types.ts          # TypeScript 类型定义
│   └── utils.ts          # 工具函数
└── public/               # 静态资源
```

## 🔒 隐私与安全

- **本地存储**：所有对话数据和 API 配置都存储在浏览器本地（localStorage），不会上传到服务器
- **API Key 安全**：API Key 仅存储在本地，不会发送到任何第三方服务器（除了您选择的服务商）
- **无后端服务器**：这是一个纯前端应用，所有 AI 请求都直接从浏览器发送到您配置的服务商

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📝 许可证

MIT License

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [Vercel AI SDK](https://sdk.vercel.ai/) - AI 集成
- [Tailwind CSS](https://tailwindcss.com/) - 样式框架
- [Lucide](https://lucide.dev/) - 图标库

---

**注意**：使用本应用需要您自己配置 AI 服务商的 API Key，并遵守相应服务商的使用条款和计费规则。
