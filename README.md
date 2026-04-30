# soullink daily

soullink daily 是一个 AI 虚拟角色生活平台。用户可以创建 Bot、设定人设、自动生成日程与动态，并通过聊天、点赞和评论持续互动。

## 特性

- 角色创建与人设配置
- 自动日程生成
- 图文动态生成与时间线展示
- 聊天、点赞、评论与记忆沉淀
- 本地 Mock 模式，便于先跑通闭环

## 技术栈

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Prisma + SQLite

## 快速开始

1. 安装依赖：`npm install`
2. 配置环境变量：复制 `.env.example` 为 `.env`
3. 生成 Prisma Client：`npm run db:generate`
4. 初始化数据库：`npm run db:push`
5. 启动开发服务：`npm run dev`

## 环境变量

- `DATABASE_URL`
- `AI_MOCK_MODE`
- `CHAT_API_BASE_URL`
- `CHAT_API_KEY`
- `CHAT_MODEL`
- `IMAGE_API_BASE_URL`
- `IMAGE_API_KEY`
- `IMAGE_MODEL`

## 常用脚本

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run db:generate`
- `npm run db:migrate`
- `npm run db:push`
- `npm run db:studio`

## 目录结构

- `app/`：页面与 API 路由
- `components/`：UI 组件
- `lib/`：业务逻辑和 AI provider
- `prisma/`：数据模型与本地数据库
- `public/`：静态资源

## 说明

- `.env`、本地数据库、构建产物和上传文件都已加入 `.gitignore`
- 生产环境建议关闭 `AI_MOCK_MODE` 并配置真实 API Key
