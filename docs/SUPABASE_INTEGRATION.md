# FoodPrint 前端接入 Supabase 指南

本文说明如何配置 Supabase（Auth + 环境变量）并与后端 API 联调。

---

## 一、Supabase 项目准备

### 1. 创建项目

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard) 并登录。
2. 点击 **New Project**，选择组织、填写项目名、数据库密码、区域后创建。
3. 等待项目就绪（约 1～2 分钟）。

### 2. 获取 URL 与 Anon Key

1. 在项目内进入 **Settings → API**。
2. 复制：
   - **Project URL** → 用作 `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** key → 用作 `EXPO_PUBLIC_SUPABASE_ANON_KEY`（仅用于客户端，可暴露）

### 3. 配置 Auth（邮箱密码）

1. 进入 **Authentication → Providers**。
2. 确认 **Email** 已开启。
3. 若需要邮箱验证：**Authentication → Email Templates** 中可修改确认邮件模板；开发阶段可在 **Auth → Settings** 中暂时关闭 “Confirm email” 以便直接登录。

### 4. 与后端保持一致

- 后端的 `SUPABASE_URL`、`SUPABASE_ANON_KEY` 需与前端一致，用于验证 JWT。
- 后端若使用 **Supabase DB** 直连，还需在后端 `.env` 配置 `SUPABASE_DB_URL`、`SUPABASE_DB_USER`、`SUPABASE_DB_PASSWORD` 等（见后端 README）。

---

## 二、前端环境变量

### 1. 创建 .env

在**项目根目录**（与 `app.json` 同级）创建 `.env`，内容可参考 `.env.example`：

```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
```

- 本地调试时 `EXPO_PUBLIC_API_BASE_URL` 通常为 `http://localhost:8080`。
- 真机调试时需改为本机局域网 IP，例如 `http://192.168.1.100:8080`，否则会请求到设备自己的 localhost。

### 2. 让 Expo 加载 .env

Expo 54 默认会从项目根目录加载 `.env` 到 `process.env`（通过 Metro/Babel 等）。若未生效：

- 确认 `.env` 在项目根目录且无拼写错误。
- 重启开发服务器：`pnpm start` 后按 `r` 或重新运行 `pnpm start`。

变量在代码中通过 `src/lib/env.ts` 读取（含 `EXPO_PUBLIC_*` 与未加前缀的兼容）。

---

## 三、API 层与认证流程

### 1. 目录结构

```
src/
├── api/
│   ├── client.ts    # 带 JWT 的 fetch 封装（Authorization: Bearer <token>）
│   ├── types.ts     # 与后端一致的 DTO / ApiResponse
│   ├── user.ts      # GET/PUT /api/users/me、body-data
│   ├── food.ts      # POST/GET/PUT/DELETE /api/food-logs
│   ├── ai.ts        # POST /api/ai/analyze、/api/ai/analyze/image
│   └── index.ts     # 统一导出
├── lib/
│   ├── env.ts       # SUPABASE_URL、SUPABASE_ANON_KEY、API_BASE_URL
│   └── supabase.ts  # createClient、getSupabaseAccessToken()
├── context/
│   └── AuthContext.tsx  # 登录/注册/登出用 Supabase Auth，并同步 session
└── types/
    └── supabase.ts  # Database 类型占位（可后续用 supabase gen types 生成）
```

### 2. 认证流程简述

1. 用户在登录/注册页调用 `login()` / `register()`。
2. **若已配置 Supabase**：`AuthContext` 内部调用 `supabase.auth.signInWithPassword` / `signUp`，成功后 Supabase 会保存 session（本项目用 AsyncStorage 持久化）。
3. 之后任意 API 请求（如 `getMe()`、`createFoodLog()`）在 `api/client.ts` 中通过 `getSupabaseAccessToken()` 取当前 session 的 `access_token`，并附带请求头 `Authorization: Bearer <token>`。
4. 后端 Spring Boot 使用 OAuth2 Resource Server + JWKS 校验该 JWT，并识别当前用户。

### 3. 在页面中调用 API 示例

```ts
import { getMe, updateBodyData } from '../api'
import { createFoodLog } from '../api'
import { useAuth } from '../context/AuthContext'

// 获取当前用户（会带 JWT，后端自动创建 profile）
const res = await getMe()
if (res.data) console.log(res.data)

// 更新身体数据
await updateBodyData({ heightCm: 170, weightKg: 65, goal: 'maintain' })

// 创建食物记录（文字）
await createFoodLog({ text: '一杯拿铁', date: '2026-03-09' })
```

未登录或 token 过期时，`getSupabaseAccessToken()` 返回 `null`，后端可能返回 401；前端可在拦截处统一跳转登录页。

---

## 四、常见问题

| 问题 | 可能原因 | 处理 |
|------|----------|------|
| 登录/注册一直转或报错 | Supabase URL/Key 未配或错误 | 检查 `.env` 与 Dashboard → Settings → API |
| 请求后端 401 | 未带 token 或 token 无效 | 确认已登录且 `getSupabaseAccessToken()` 有值；后端 JWKS 与 Supabase 项目一致 |
| 真机请求不到后端 | 用了 localhost | 将 `EXPO_PUBLIC_API_BASE_URL` 改为电脑局域网 IP |
| .env 不生效 | 路径错误或未重启 | 确保 `.env` 在项目根目录，重启 `pnpm start` |

---

## 五、检查清单

- [ ] Supabase 项目已创建，Auth → Email 已开启。
- [ ] 已从 Settings → API 复制 URL 与 anon key 到 `.env`。
- [ ] 前端 `.env` 中 `EXPO_PUBLIC_SUPABASE_URL`、`EXPO_PUBLIC_SUPABASE_ANON_KEY`、`EXPO_PUBLIC_API_BASE_URL` 已填写。
- [ ] 后端已配置同一 Supabase 项目的 URL 与 anon key（及 DB 等），并已启动。
- [ ] 能成功注册、登录；登录后调用 `getMe()` 或 `createFoodLog()` 能拿到 200 而非 401。

完成以上步骤后，前端即通过 Supabase Auth 拿到 JWT，并由 API 层自动携带访问后端。
