# 待办清单 · Supabase + Vercel 版

Express 接口通过 `@supabase/supabase-js`（底层 Supabase REST API）读写 `tasks` 表；前端为静态页面。
同一套代码既能本地 `npm start` 跑，也能直接部署到 Vercel。

## 目录结构（Vercel 标准布局）

```
todo-supabase/
├── index.html            # 前端页面（必须在根目录，Vercel 按根目录提供静态页）
├── styles.css
├── app.js
├── api/
│   └── [...path].js      # Vercel serverless 入口，处理 /api/*
├── routes.js             # 共享路由（增删改查 + 健康检查）
├── server.js             # 本地开发入口（Vercel 不执行）
├── .env                  # 本地环境变量（不提交）
└── package.json
```

> 旧版本的 `public/` 目录已取消。如果 GitHub 仓库里还有 `public/`，需要删掉，否则根路径仍然 404。

## 本地运行

```bash
npm install
npm start          # http://localhost:3000
```

## Vercel 部署

1. 把上面这些文件推到 GitHub 仓库（根目录要能看到 `index.html` 和 `api/`）
2. Vercel 项目里确认：
   - Framework Preset = Other / 无构建
   - Root Directory = 空（不要指向 public）
   - Environment Variables：
     - `SUPABASE_URL` = `https://你的项目ID.supabase.co`
     - `SUPABASE_ANON_KEY` = `sb_publishable_...`
3. 重新 Deploy，访问根域名应该直接看到任务列表

## API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/tasks` | 任务列表（创建时间倒序） |
| POST | `/api/tasks` | 新增 `{title, priority}` |
| PATCH | `/api/tasks/:id` | `{completed: boolean}` |
| DELETE | `/api/tasks/:id` | 删除 |
| GET | `/api/health` | 连通性检查 |

## 测试记录

- 本地 `npm start`：`/api/health` 200、`/` 200、`/app.js` 200、四类接口全部成功
- 模拟 Vercel serverless 调用 `api/[...path].js`：GET/POST/PATCH/DELETE 均返回 200/201，数据落到 Supabase
