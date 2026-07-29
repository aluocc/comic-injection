# 多语种在线学习平台

Multilingual online learning platform scaffold — Next.js 14+ App Router frontend + NestJS backend, Prisma (PostgreSQL) + Redis (ioredis).

## 目录结构

```
画布00/
├── frontend/          # Next.js 前端（App Router + TypeScript + Tailwind CSS v4）
│   ├── src/app/        # 页面与布局（layout.tsx、page.tsx、providers.tsx）
│   ├── src/components/ # 组件（health-status 等）
│   ├── src/hooks/      # react-query hooks（use-health 等）
│   ├── src/lib/        # axios 客户端（自动剥离统一响应包装）
│   └── .stub/sharp/    # 本地 sharp stub（沙箱中跳过原生模块）
├── backend/           # NestJS 后端（TypeScript + 模块化）
│   ├── src/common/     # 统一响应拦截器、异常过滤器、错误码
│   ├── src/config/     # ConfigModule + AppConfig
│   ├── src/prisma/     # PrismaService（全局单例）
│   ├── src/redis/      # RedisService（全局单例）
│   ├── src/health/     # GET /health 健康检查
│   ├── prisma/schema.prisma # Prisma schema（含 User 模型）
│   └── .stub/bcrypt/   # 本地 bcrypt stub（沙箱中跳过原生模块）
└── README.md
```

## 前置依赖

- Node.js 20+（建议通过 `.nvmrc` 选择版本）
- pnpm 11+（已通过 `packageManager` 字段固定版本）
- PostgreSQL（本地或远程实例）
- Redis（本地或远程实例）

## 启动方式

### 后端（NestJS）

```powershell
cd backend
pnpm install
pnpm prisma generate     # 生成 Prisma Client
# 可选：首次运行时创建数据库表
# pnpm prisma db push
pnpm start:dev           # http://localhost:3001
```

健康检查：

```powershell
curl http://localhost:3001/health
# 返回统一格式：{ "code": 0, "message": "success", "data": { "status": "ok" } }
```

### 前端（Next.js）

```powershell
cd frontend
pnpm install
pnpm dev                 # http://localhost:3000
```

首页会调用后端 `/health` 接口并展示联调状态指示灯（绿点=后端正常，红点=未连接）。

## 环境变量

### backend/.env

复制 `backend/.env.example` 为 `backend/.env` 并按需修改：

| 变量            | 说明                          | 默认值                                                              |
| --------------- | ----------------------------- | ------------------------------------------------------------------- |
| `PORT`          | NestJS 监听端口               | `3001`                                                              |
| `DATABASE_URL`  | PostgreSQL 连接串（Prisma）  | `postgresql://postgres:postgres@localhost:5432/learning_platform`   |
| `REDIS_URL`     | Redis 连接串（ioredis）      | `redis://localhost:6379`                                            |
| `JWT_SECRET`    | JWT 签名密钥                  | `change-me-in-production`                                           |
| `JWT_EXPIRES_IN`| JWT 过期时间                 | `7d`                                                                |

### frontend/.env.local

| 变量                          | 说明                | 默认值                    |
| ----------------------------- | ------------------- | ------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`    | 后端 API 基址       | `http://localhost:3001`   |

## 统一 API 规范

- 成功：`{ code: 0, message: 'success', data: T }`
- 失败：`{ code: number, message: string, data: null }`

前端 `src/lib/api.ts` 已通过响应拦截器自动剥离外层包装，调用方直接拿到 `data`。

## 已知问题

1. **bcrypt / sharp 原生模块沙箱兼容**：在受限沙箱环境中，原生模块 `bcrypt`（后端）与 `sharp`（前端）的 tarball 解压会因 `EPERM` 失败。当前通过 `pnpm-workspace.yaml` 的 `overrides` 字段指向本地 `.stub/` 下的 stub 包绕过。**生产部署前需移除 stub 并安装真实原生模块**。
2. **数据库与 Redis 需本地可用**：后端启动时若连不上 PostgreSQL/Redis，会在日志中告警但不阻止启动，`/health` 仍可访问。完成实际业务功能前请确保二者可用并执行 `pnpm prisma db push`。
3. **沙箱 HTTP 验证限制**：在受限沙箱环境中，即使服务器成功监听端口（netstat 确认 LISTENING），localhost TCP 连接也可能被阻止。后端启动日志（`Backend running on http://localhost:3001` + `Mapped {/health, GET} route`）即为可用性证据；完整 HTTP 联调请在常规开发环境中执行。
4. **Prisma 6（非 7）**：因 Prisma 7 移除了 `schema.prisma` 中 `datasource.url` 字段并要求 adapter 模式，当前使用 Prisma 6.19.3 以匹配现有 schema 格式。升级到 Prisma 7 时需迁移到 `prisma.config.ts` + adapter 方式。
5. **pnpm hoisted linker**：沙箱中 pnpm 默认 isolated linker 的 `importPackage` rename 操作会触发 EPERM。通过 `.npmrc` 设置 `node-linker=hoisted` 切换为扁平 node_modules 绕过。生产环境可移除此设置恢复默认隔离链接。
