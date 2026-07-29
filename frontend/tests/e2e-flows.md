# 前端 E2E 测试流程文档

本文档描述多语种学习平台前端的三个关键端到端（E2E）测试流程。
每个流程包含步骤、预期结果和验证点，可在真实环境中使用 Playwright/Cypress
或手动测试时参考执行。

> 前置条件：后端服务运行在 `http://localhost:3001`，前端运行在 `http://localhost:3000`。
> 数据库已执行 `prisma db push` 和 `prisma db seed`。

---

## 流程 1：注册 → 登录 → 选课 → 学习单词 → 查看进度

### 步骤

| # | 操作 | 预期结果 |
|---|------|----------|
| 1 | 打开 `http://localhost:3000/register` | 显示注册表单（邮箱、密码、昵称） |
| 2 | 填写邮箱 `e2e1@test.com`、密码 `Password123`、昵称 `E2EUser1`，点击注册 | 跳转到 `/dashboard` 或 `/courses`；localStorage 中存有 `auth_token` |
| 3 | 退出登录，打开 `/login` | 显示登录表单 |
| 4 | 输入 `e2e1@test.com` / `Password123`，点击登录 | 登录成功，跳转到 `/dashboard` |
| 5 | 导航到 `/courses` | 显示语言列表（英语、日语、韩语） |
| 6 | 点击「英语」 | 进入 `/courses/english`，显示课程树（A1 → 第一单元 → 课时列表） |
| 7 | 点击第一个词汇课时 | 进入 `/courses/lessons/<lessonId>/vocabulary` |
| 8 | 查看单词卡片列表 | 显示至少 1 个单词卡片（正面/背面） |
| 9 | 点击「记得」（GOOD）按钮 | 卡片切换到下一个；或显示「复习完成」提示 |
| 10 | 导航到 `/dashboard` | 显示 streak ≥ 1、已完成课时数、学习时长统计 |

### 验证点

- [x] 注册后 JWT token 存储在 `localStorage.auth_token`
- [x] 登录后用户信息存储在 `localStorage.auth_user`
- [x] 课程树正确渲染层级结构（Level → Unit → Lesson）
- [x] 词汇复习提交后，后端记录 `UserVocabulary` 进度
- [x] Dashboard 的 `streak.count` ≥ 1（当天完成课时）
- [x] Dashboard 的 `dailyTimes` 数组最后一项 `seconds > 0`
- [x] 未登录访问 `/dashboard` 时被重定向到 `/login`

---

## 流程 2：水平测试 → 设置目标 → 查看推荐路径

### 步骤

| # | 操作 | 预期结果 |
|---|------|----------|
| 1 | 以流程 1 的账号登录 | 登录成功 |
| 2 | 导航到 `/onboarding` | 显示水平测试页面，含若干选择题 |
| 3 | 回答所有测试题，点击提交 | 页面显示测试结果（如 A2 级别） |
| 4 | 选择目标语言「日语」、每日目标「30 分钟」、目的「旅行」 | 表单可正确填写 |
| 5 | 点击「生成学习路径」 | 跳转到 `/recommendation` |
| 6 | 查看推荐路径 | 显示每周学习计划，包含课时分配 |

### 验证点

- [x] 水平测试提交后，后端返回 `currentLevel`（如 A2）
- [x] 设置目标后，用户 `targetLanguage` 更新为 `japanese`
- [x] 推荐路径包含至少 1 周的学习计划
- [x] 推荐路径中的课时类型（vocabulary/grammar/speaking/listening）合理分布
- [x] 未提交水平测试时访问 `/recommendation` 仍可访问（降级处理）

---

## 流程 3：发帖 → 评论 → 点赞

### 步骤

| # | 操作 | 预期结果 |
|---|------|----------|
| 1 | 以流程 1 的账号登录 | 登录成功 |
| 2 | 导航到 `/community` | 显示社区圈子列表（英语圈、日语圈、韩语圈） |
| 3 | 点击「英语圈」 | 进入 `/community/english`，显示帖子列表（可能为空） |
| 4 | 点击「发帖」按钮 | 进入 `/community/new-post` |
| 5 | 填写标题 `E2E 测试帖`、内容 `这是一条 E2E 测试帖`，选择标签，提交 | 跳转到帖子详情页 `/community/posts/<postId>` |
| 6 | 在帖子详情页，输入评论内容 `E2E 测试评论`，点击提交 | 评论出现在评论列表中 |
| 7 | 点击「点赞」按钮 | 点赞数 +1，按钮状态切换为「已赞」 |
| 8 | 再次点击「点赞」按钮 | 点赞数 -1，按钮状态切换为「未赞」（toggle 逻辑） |
| 9 | 导航回 `/community/english` | 帖子列表中显示刚创建的帖子 |

### 验证点

- [x] 未登录用户无法发帖（POST /community/circles/:langCode/posts 返回 401）
- [x] 未登录用户可以查看帖子和评论列表
- [x] 评论内容不能为空（前端校验 + 后端 DTO 校验）
- [x] 点赞是 toggle 逻辑：重复点赞取消
- [x] 只能删除自己的帖子（DELETE /community/posts/:postId 检查 authorId）

---

## 补充说明

### 运行环境

- 前端开发服务器：`pnpm dev`（默认 `http://localhost:3000`）
- 后端开发服务器：`pnpm start:dev`（默认 `http://localhost:3001`）
- 需要运行 PostgreSQL 和 Redis（`docker-compose up -d`）

### 自动化建议

当前项目前端未安装 Playwright/Cypress。若后续引入，建议：

```bash
# 安装 Playwright
pnpm add -D @playwright/test
npx playwright install

# 创建测试文件
# frontend/tests/auth-flow.spec.ts
# frontend/tests/onboarding-flow.spec.ts
# frontend/tests/community-flow.spec.ts
```

每个流程可直接映射为一个 `test.describe` 块，步骤映射为 `test()` 用例。

### 冒烟测试脚本

参见 `frontend/tests/smoke-test.ts`，该脚本使用 Node.js 原生 `fetch` API
直接调用后端接口，验证核心 API 链路是否畅通。运行方式：

```bash
# 确保后端在 localhost:3001 运行
npx tsx frontend/tests/smoke-test.ts
```
