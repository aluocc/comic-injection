# Security Audit — 多语种学习平台后端

> 审计日期：2026-07-28
> 审计范围：NestJS 后端（`backend/src/` 全部模块）
> 审计人员：自动化安全自查（Task 12.3）

---

## 1. 鉴权（Authentication & Authorization）

### 检查项
所有需登录的接口是否都有 `@UseGuards(JwtAuthGuard)` 保护。

### 审计结果

| 模块 | 接口 | 方法 | 鉴权 | 状态 |
|------|------|------|------|------|
| Auth | /auth/register | POST | 公开 | ✅ 正确（注册应公开） |
| Auth | /auth/login | POST | 公开 | ✅ 正确（登录应公开） |
| Auth | /auth/me | GET | JwtAuthGuard | ✅ 已保护 |
| Course | /courses/languages | GET | 公开 | ✅ 正确（课程浏览应公开） |
| Course | /courses/languages/:code/tree | GET | OptionalJwtGuard | ✅ 正确（可选认证） |
| Course | /courses/lessons/:id | GET | 公开 | ✅ 正确 |
| Vocabulary | /vocabulary/lesson/:id | GET | 公开 | ✅ 正确（课程内容公开） |
| Vocabulary | /vocabulary/review | GET | JwtAuthGuard | ✅ 已保护 |
| Vocabulary | /vocabulary/:id/review | POST | JwtAuthGuard | ✅ 已保护 |
| Grammar | /grammar/lesson/:id | GET | 公开 | ✅ 正确（题目列表公开） |
| Grammar | /grammar/lesson/:id/attempts | GET | JwtAuthGuard | ✅ 已保护 |
| Grammar | /grammar/:id/check | POST | JwtAuthGuard | ✅ 已保护 |
| Speaking | /speaking/upload | POST | JwtAuthGuard | ✅ 已保护 |
| Speaking | /speaking/lesson/:id | GET | 公开 | ✅ 正确 |
| Speaking | /speaking/lesson/:id/attempts | GET | JwtAuthGuard | ✅ 已保护 |
| Speaking | /speaking/:id/attempt | POST | JwtAuthGuard | ✅ 已保护 |
| Listening | /listening/lesson/:id | GET | 公开 | ✅ 正确 |
| Listening | /listening/lesson/:id/attempts | GET | JwtAuthGuard | ✅ 已保护 |
| Listening | /listening/:id/check | POST | JwtAuthGuard | ✅ 已保护 |
| Progress | /progress/lesson/:id/start | POST | JwtAuthGuard | ✅ 已保护 |
| Progress | /progress/lesson/:id/complete | POST | JwtAuthGuard | ✅ 已保护 |
| Progress | /progress/lesson/:id | GET | JwtAuthGuard | ✅ 已保护 |
| Progress | /progress/dashboard | GET | JwtAuthGuard | ✅ 已保护 |
| Recommendation | /recommendation/placement-quiz | GET | 公开 | ✅ 正确（测试题公开） |
| Recommendation | /recommendation/placement-quiz/submit | POST | JwtAuthGuard | ✅ 已保护 |
| Recommendation | /recommendation/goal | POST | JwtAuthGuard | ✅ 已保护 |
| Recommendation | /recommendation/path | GET | JwtAuthGuard | ✅ 已保护 |
| Community | /community/circles | GET | 公开 | ✅ 正确 |
| Community | /community/circles/:code/posts | GET | 公开 | ✅ 正确 |
| Community | /community/circles/:code/posts | POST | JwtAuthGuard | ✅ 已保护 |
| Community | /community/posts/:id | GET | 公开 | ✅ 正确 |
| Community | /community/posts/:id/comments | POST | JwtAuthGuard | ✅ 已保护 |
| Community | /community/posts/:id/like | POST | JwtAuthGuard | ✅ 已保护 |
| Community | /community/posts/:id | DELETE | JwtAuthGuard | ✅ 已保护 |
| Achievement | /achievement/check | POST | JwtAuthGuard | ✅ 已保护 |
| Achievement | /achievement/badges | GET | JwtAuthGuard | ✅ 已保护 |
| Achievement | /achievement/leaderboard | GET | JwtAuthGuard | ✅ 已保护 |
| Health | /health | GET | 公开 | ✅ 正确（健康检查应公开） |

### 结论
**✅ 所有受保护接口均已正确添加 `@UseGuards(JwtAuthGuard)`。** 未发现越权风险。

### 授权粒度
- Community `DELETE /community/posts/:postId` 在 service 层检查 `authorId`，确保用户只能删除自己的帖子。
- Progress 接口通过 `req.user.sub` 传递 userId，确保用户只能操作自己的进度数据。
- 上述设计正确，无水平越权风险。

---

## 2. 密码安全（Password Security）

### 检查项
密码是否使用 bcrypt 加盐哈希存储。

### 审计结果
- **哈希算法**：`bcryptjs`（`backend/src/modules/auth/auth.service.ts` 第 12 行）
- **盐轮数**：10（`bcrypt.hash(input.password, 10)`，第 68 行）
- **密码比较**：`bcrypt.compare(input.password, user.passwordHash)`（第 106 行）
- **密码不出现在响应中**：`PublicUser` 接口不含 `passwordHash` 字段

### 结论
**✅ 密码安全处理正确。** bcrypt 加盐哈希，10 轮迭代，密码不出现在任何 API 响应中。

---

## 3. SQL 注入防护

### 检查项
是否使用参数化查询，有无原生 SQL 拼接。

### 审计结果
- **ORM**：全项目使用 Prisma ORM（`@prisma/client`）
- **查询方式**：所有数据库操作均通过 `PrismaService` 的委托方法（`findUnique`、`findMany`、`create`、`update`、`upsert` 等）
- **原生 SQL**：未发现 `prisma.$queryRaw` 或 `prisma.$executeRaw` 调用
- **参数化**：Prisma 自动对所有查询参数进行参数化处理

### 结论
**✅ 无 SQL 注入风险。** 所有查询通过 Prisma ORM 参数化执行。

---

## 4. 输入校验（Input Validation）

### 检查项
所有 DTO 是否使用 `class-validator` 装饰器进行输入校验。

### 审计结果
- **全局 ValidationPipe**：`main.ts` 第 15-21 行配置了 `ValidationPipe`，启用 `whitelist: true`、`forbidNonWhitelisted: true`、`transform: true`
- **DTO 文件清单**：

| DTO 文件 | 校验装饰器 | 状态 |
|----------|------------|------|
| RegisterDto | @IsEmail, @MinLength(8), @MaxLength(32), @Matches, @Length | ✅ |
| LoginDto | @IsString, @Length, @MinLength | ✅ |
| CheckAnswerDto (Grammar) | @IsString, @IsNotEmpty, @MaxLength | ✅ |
| CheckAnswerDto (Listening) | @IsString, @IsNotEmpty, @MaxLength | ✅ |
| CompleteLessonDto | @IsOptional, @IsNumber, @IsInt, @Min, @Max, @Type | ✅ |
| SubmitReviewDto | @IsEnum | ✅ |
| SubmitAttemptDto | @IsString, @IsNotEmpty, @MaxLength | ✅ |
| CreatePostDto | @IsString, @MinLength, @MaxLength, @IsArray, @IsOptional | ✅ |
| CreateCommentDto | @IsString, @MinLength, @MaxLength | ✅ |
| SubmitQuizDto | @IsArray, @ArrayMinSize, @ValidateNested, @Type | ✅ |
| SetGoalDto | @IsString, @IsIn, @IsInt, @Min, @Max, @Type | ✅ |

### 结论
**✅ 所有 DTO 均使用 class-validator 装饰器进行输入校验。** `forbidNonWhitelisted: true` 确保未声明的字段会被拒绝，防止参数污染。

---

## 5. JWT 安全

### 检查项
JWT 密钥是否从环境变量读取，是否设置过期时间。

### 审计结果
- **密钥来源**：`AppConfig.jwtSecret` 读取 `JWT_SECRET` 环境变量，默认值 `'dev-secret-change-me'`（仅用于开发）
- **过期时间**：`AppConfig.jwtExpiresIn` 读取 `JWT_EXPIRES_IN`，默认值 `'7d'`
- **Strategy 配置**：`JwtStrategy` 使用 `ignoreExpiration: false`（不忽略过期）
- **Token 提取**：`ExtractJwt.fromAuthHeaderAsBearerToken()`（标准 Bearer Token 模式）
- **.env.example**：已配置 `JWT_SECRET="change-me-in-production"` 和 `JWT_EXPIRES_IN="7d"`

### 结论
**✅ JWT 安全配置正确。** 密钥从环境变量读取，有 7 天过期时间，过期 token 会被拒绝。

### 建议
- 生产环境务必设置强随机 `JWT_SECRET`（至少 32 字符）
- 考虑实现 refresh token 机制，缩短 access token 过期时间至 15-30 分钟
- 考虑实现 token 撤销列表（blacklist）用于用户主动登出

---

## 6. 文件上传安全

### 检查项
文件上传是否限制大小和类型。

### 审计结果
- **上传端点**：`POST /speaking/upload`（`speaking.controller.ts`）
- **文件大小限制**：25 MB（`limits: { fileSize: 25 * 1024 * 1024 }`，第 72 行）
- **存储方式**：`diskStorage` 写入 `uploads/speaking/` 目录
- **文件名**：使用 `${Date.now()}-${random}${extname}` 防止文件名冲突和路径遍历
- **静态访问**：通过 `app.useStaticAssets` 在 `/uploads/` 前缀下提供访问

### 结论
**✅ 文件上传有大小限制（25 MB）。** 文件名使用时间戳+随机数生成，防止路径遍历。

### 建议
- 添加文件类型白名单（目前接受任意扩展名）。建议在 `FileInterceptor` 配置中添加 `fileFilter`：
  ```typescript
  fileFilter: (_req, file, cb) => {
    const allowed = ['.webm', '.mp3', '.wav', '.ogg', '.m4a'];
    const ext = extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new BadRequestException('Unsupported file type'), false);
  }
  ```
- 对上传内容进行 MIME type 校验（不仅仅检查扩展名）
- 考虑将文件存储迁移到对象存储（S3/OSS）而非本地磁盘

---

## 7. CORS 配置

### 检查项
`main.ts` 中的 CORS 配置。

### 审计结果
- **配置位置**：`backend/src/main.ts`
- **当前配置**：
  ```typescript
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  ```
- **origin**：支持通过 `CORS_ORIGIN` 环境变量配置白名单（逗号分隔），未设置时默认 `true`（允许所有来源，适合开发环境）
- **methods**：明确列出允许的 HTTP 方法
- **allowedHeaders**：仅允许 `Content-Type` 和 `Authorization` 头
- **credentials**：启用（支持 cookie/认证头跨域传递）

### 结论
**✅ CORS 已配置。** 开发环境默认允许所有来源，生产环境可通过 `CORS_ORIGIN` 环境变量限制。

### 建议
- 生产环境务必设置 `CORS_ORIGIN=https://your-frontend-domain.com`
- 考虑是否需要 `credentials: true`（如使用 cookie-based auth 则需要，JWT Bearer Token 模式下非必需）

---

## 8. 限流（Rate Limiting）

### 检查项
是否添加全局限流防止暴力破解和滥用。

### 审计结果
- **已安装**：`@nestjs/throttler` v6.5.0
- **配置位置**：`backend/src/app.module.ts`
- **配置内容**：
  ```typescript
  ThrottlerModule.forRoot([
    {
      ttl: 60_000,   // 60 秒窗口
      limit: 100,     // 每窗口 100 次请求
    },
  ])
  ```
- **全局守卫**：通过 `APP_GUARD` 注册 `ThrottlerGuard`，应用于所有路由
- **超限响应**：HTTP 429 Too Many Requests

### 结论
**✅ 全局限流已配置。** 每客户端 IP 每分钟最多 100 次请求。

### 建议
- 对 `/auth/login` 和 `/auth/register` 设置更严格的限流（如 10 次/分钟），可使用 `@Throttle()` 装饰器覆盖：
  ```typescript
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('login')
  async login(...) { ... }
  ```
- 对文件上传接口设置更严格的限制
- 考虑使用 Redis 存储（`ThrottlerStorageRedisService`）以支持多实例部署

---

## 9. 其他安全项

### 9.1 敏感信息泄露
- **错误响应**：`HttpExceptionFilter` 不泄露堆栈信息到客户端（仅记录到日志）
- **passwordHash**：不在任何 API 响应中返回（`PublicUser` 接口不含此字段）
- **Grammar 题目答案**：`GrammarQuestionDto` 不含 `answer` 和 `explanation` 字段（列表接口不泄露答案）

### 9.2 依赖安全
- 运行 `npm audit` 检查依赖漏洞
- 定期更新依赖至最新补丁版本

### 9.3 HTTPS
- 生产环境应通过反向代理（Nginx/CDN）启用 HTTPS
- 后端服务本身监听 HTTP，由前端代理终止 TLS

### 9.4 环境变量
- `.env.example` 提供了配置模板
- 生产环境应通过安全的方式注入环境变量（如 Docker secrets、K8s ConfigMap/Secrets）
- 不应将 `.env` 文件提交到版本控制（`.gitignore` 已排除）

---

## 审计总结

| 检查项 | 状态 | 备注 |
|--------|------|------|
| 1. 鉴权 | ✅ 通过 | 所有受保护接口均有 JwtAuthGuard |
| 2. 密码安全 | ✅ 通过 | bcryptjs + 10 轮加盐 |
| 3. SQL 注入 | ✅ 通过 | Prisma ORM 参数化查询 |
| 4. 输入校验 | ✅ 通过 | class-validator + 全局 ValidationPipe |
| 5. JWT 安全 | ✅ 通过 | 环境变量密钥 + 7d 过期 |
| 6. 文件上传 | ⚠️ 部分 | 有 25MB 大小限制，缺少类型白名单 |
| 7. CORS | ✅ 通过 | 已配置，支持环境变量自定义 |
| 8. 限流 | ✅ 通过 | @nestjs/throttler 全局 100/min |

### 已知问题与改进建议

1. **文件上传类型校验**（中等优先级）：当前未限制上传文件类型，建议添加 `fileFilter` 白名单
2. **登录接口限流**（中等优先级）：建议对 `/auth/login` 设置更严格的限流（10次/分钟）
3. **Refresh Token**（低优先级）：当前只有 7 天 access token，建议实现 refresh token 机制
4. **HTTPS**（部署时必须）：生产环境必须启用 HTTPS
5. **Helmet 中间件**（低优先级）：建议添加 `helmet` 中间件增强 HTTP 头安全
6. **CSRF**（低优先级）：当前使用 Bearer Token 认证，CSRF 风险较低；若改为 cookie 认证则需添加 CSRF 保护
