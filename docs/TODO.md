# 户外公积金管理系统 - 项目待办清单

> 最后更新: 2026-04-16
> 项目路径: `d:\P00\Superpowers\outdoor-fund\`

---

## 项目概览

移动优先 H5 Web App，用于户外活动群组的公积金管理。

### 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vue 3 + TypeScript + Pinia + Naive UI + UnoCSS + Vite |
| 后端 | Express + TypeScript + Drizzle ORM + better-sqlite3 + JWT + Zod |
| 共享 | `@outdoor-fund/shared` (类型、枚举、结算算法) |
| 结构 | npm workspaces monorepo (`shared/` `server/` `client/`) |

### 常用命令

```bash
# 启动
npm run dev                          # 同时启动前后端
npx tsx server/src/index.ts          # 单独启动后端 (localhost:3000)
npx vite --config client/vite.config.ts  # 单独启动前端 (localhost:5173)

# 类型检查
npx tsc --noEmit -p server/tsconfig.json
npx vue-tsc --noEmit -p client/tsconfig.json

# 数据库
npx drizzle-kit generate             # 在 server/ 目录下生成迁移
npx tsx server/src/db/migrate.ts     # 应用迁移
```

### 认证方式

- 双密码登录: 每个群组有管理员密码 + 会员密码
- JWT payload: `{ groupId, role }`
- JWT_SECRET: `outdoor-fund-dev-secret-key-2024-not-for-production-use`
- 测试群组 ID=1, 管理员密码: `admin123`, 会员密码: `member123`

### 设计系统

- 详见 `docs/design-system.md`
- 主色: 山岳绿 `#10B981`, 强调色: 暖日橙 `#F59E0B`
- 背景: `#F0FDF4`, 卡片圆角 16px, 按钮圆角 12px
- 底部 Tab 4 等分: 会员 / 活动 / 统计 / 设置

---

## 已完成功能

### 认证模块
- [x] 群组创建 (POST /api/auth/groups)
- [x] 群组列表 (GET /api/auth/groups)
- [x] 双密码登录 (POST /api/auth/login) → JWT
- [x] 前端 LoginView: 选群组 + 输密码 + 创建群组
- [x] 路由守卫 + token 持久化 (localStorage)

### 会员模块
- [x] 会员列表 (GET /api/members) — 含余额、活动次数、昵称、户外称号、有车、经验等级
- [x] 会员详情 (GET /api/members/:id)
- [x] 添加会员 (POST /api/members) — 管理员
- [x] 编辑会员 (PUT /api/members/:id) — 管理员
- [x] 删除会员 (DELETE /api/members/:id) — 管理员, 余额须为 0
- [x] 前端 MembersView: 卡片列表 + 搜索 + 添加弹窗 + 充值弹窗
- [x] 前端 MemberDetailView: 详情卡 + 编辑弹窗 + 资金流水

### 充值模块
- [x] 手动充值 (POST /api/topup) — 原子事务, 更新余额 + 写流水
- [x] 前端充值弹窗 (MembersView 中)

### 活动模块
- [x] 活动列表 (GET /api/activities)
- [x] 活动详情 (GET /api/activities/:id) — 含参与人、费用、结算记录
- [x] 创建活动 (POST /api/activities) — NDatePicker 选日期
- [x] 编辑活动 (PUT /api/activities/:id) — 仅草稿状态
- [x] 删除活动 (DELETE /api/activities/:id) — 仅草稿状态
- [x] 前端 ActivitiesView: 卡片列表 + 搜索 + 创建弹窗
- [x] 前端 ActivityDetailView: 信息卡 + 编辑弹窗 + 参与人 + 费用 + 结算

### 参与人管理
- [x] 设置参与人 (PUT /api/activities/:id/members)
- [x] 前端多选弹窗

### 费用管理
- [x] 添加费用 (POST /api/activities/:id/expenses) — 支持类别、垫付人、车费标记
- [x] 删除费用 (DELETE /api/activities/:id/expenses/:eid)
- [x] 前端费用弹窗

### 结算模块
- [x] 结算预览 (GET /api/activities/:id/settlement/preview)
- [x] 确认结算 (POST /api/activities/:id/settlement/confirm) — 原子事务
- [x] 管理员中心化收款/报销模式 (非 P2P 转账)
- [x] 走公款模式: 自动扣减余额 + 写流水
- [x] 前端预览弹窗: 总费用/人头/人均 + 每人明细 + 收款/报销操作列表

### 统计模块
- [x] 统计概览 (GET /api/stats) — 总余额、充值总额、支出总额、活动次数、余额排行、分类统计、最近活动
- [x] 交易流水 (GET /api/stats/transactions?memberId=) — 支持按会员筛选
- [x] 前端 StatsView: 4 格概览 + 余额排行(金牌) + 分类柱状图 + 最近结算活动

### 设置模块
- [x] 群组信息 (GET /api/groups/current)
- [x] 更新群组 (PUT /api/groups/current) — 名称、简介、密码
- [x] 前端 SettingsView: 群组信息编辑 + 修改密码 + 当前登录 + 退出登录

---

## 未完成功能

### 优先级 P0 (核心缺失)

#### 1. 结算冲红 (reversed)
- **现状**: 枚举已定义 (`ActivityStatus.reversed`, `TransactionType.reversal`)，无实现
- **需要**:
  - 后端: `POST /api/activities/:id/settlement/reverse` — 反转余额变动、写反向流水、状态改为 reversed
  - 前端: ActivityDetailView 已结算活动显示"冲红"按钮 + 确认弹窗
- **涉及文件**: `server/src/services/activities.ts`, `client/src/views/ActivityDetailView.vue`

#### 2. 参与人挂靠人数编辑
- **现状**: 后端已支持 `hangerOnCount`，结算算法已处理，但前端管理参与人弹窗只能选人不能设置挂靠数
- **需要**: 参与人弹窗中每人旁边加 NInputNumber 设置挂靠人数
- **涉及文件**: `client/src/views/ActivityDetailView.vue` (管理参与人弹窗)

### 优先级 P1 (重要功能)

#### 3. 车辆管理
- **现状**: DB schema 已有 `vehicles` 表 (车牌、车型、车主)，types.ts 有 `Vehicle` 接口，无 service/route/前端
- **需要**:
  - 后端: 车辆 CRUD service + route (`/api/vehicles`)
  - 前端: 车辆管理页面或设置页内的子区块
  - 活动参与人选择所乘车辆 (vehicleId)
  - 费用关联车辆 (vehicleId)
- **涉及文件**: 新建 `server/src/services/vehicles.ts`, `server/src/routes/vehicles.ts`, `server/src/validators/vehicles.ts`, `client/src/api/vehicles.ts`, `client/src/views/VehiclesView.vue` 或在设置页中

#### 4. 按车分摊模式 (per_car) 前端支持
- **现状**: 结算算法已完整支持 `per_car` 模式 (`shared/src/settlement.ts`)，但前端无法指定参与人的 vehicleId
- **需要**: 依赖车辆管理(#3)完成后，在参与人弹窗中加车辆选择
- **涉及文件**: `client/src/views/ActivityDetailView.vue`

#### 5. 路线管理
- **现状**: DB schema 已有 `routes` 表 (路线名、海拔、爬升、距离、车程、途经点JSON)，types.ts 有 `Route`/`Waypoint` 接口，无 service/route/前端
- **需要**:
  - 后端: 路线 CRUD service + route (`/api/routes`)
  - 前端: 路线管理页面 + 活动创建/编辑时选择路线
  - .env 中已预留 `AMAP_API_KEY` 用于地图集成
- **涉及文件**: 新建 `server/src/services/routes.ts`, `server/src/routes/routes.ts`, `client/src/api/routes.ts`, `client/src/views/RoutesView.vue`

### 优先级 P2 (增强功能)

#### 6. 审计日志
- **现状**: DB schema 已有 `audit_logs` 表 (实体类型、动作、变更diff、操作人)，types.ts 有 `AuditLog` 接口，无写入逻辑和查看页面
- **需要**:
  - 后端: 关键操作时写 audit_logs (结算、冲红、充值、会员增删、密码修改等)
  - 前端: 管理员可查看审计日志 (可放在设置页或独立页面)
- **涉及文件**: 新建 `server/src/services/audit.ts`, 修改各 service 中加入日志写入

#### 7. 会员角色管理
- **现状**: 群组会员角色存在 `groupMembers.role` (admin/member)，但无前端操作入口
- **需要**: 管理员可在会员详情中提升/降级角色
- **涉及文件**: `server/src/services/members.ts`, `client/src/views/MemberDetailView.vue`

#### 8. 走现金模式 (cash) 的完整流程
- **现状**: 创建活动时可选 `reimburseMode: 'cash'`，结算时 cash 模式不扣余额、不写流水，只写 settlements 转账记录
- **需要**: 确认 cash 模式的前端展示是否需要区别对待 (如显示"请线下转账"提示)

---

## 文件结构速查

```
outdoor-fund/
├── .env                          # 环境变量 (DB路径, JWT密钥, 端口, 高德Key)
├── package.json                  # monorepo 根
├── docs/
│   └── design-system.md          # 设计系统文档
├── data/
│   └── outdoor.db                # SQLite 数据库文件
├── shared/src/
│   ├── index.ts                  # 统一导出
│   ├── enums.ts                  # 所有枚举 (费用类别/分摊模式/报销模式/活动状态/流水类型/角色/经验等级)
│   ├── types.ts                  # 所有类型接口
│   └── settlement.ts             # 结算算法 (纯函数, 前后端共用)
├── server/src/
│   ├── index.ts                  # Express 入口, 路由挂载
│   ├── db/
│   │   ├── connection.ts         # better-sqlite3 连接
│   │   ├── migrate.ts            # 迁移执行脚本
│   │   ├── migrations/           # Drizzle 迁移文件
│   │   └── schema/               # 11 个表: groups, members, groupMembers, vehicles, routes, activities, activityMembers, expenses, transactions, settlements, auditLogs
│   ├── middleware/
│   │   ├── auth.ts               # JWT 验证 + adminOnly
│   │   ├── errorHandler.ts       # 全局错误处理
│   │   └── validate.ts           # Zod 校验中间件
│   ├── routes/                   # auth, groups, members, topup, activities, stats
│   ├── services/                 # auth, groups, members, topup, activities, stats
│   ├── validators/               # Zod schema: auth, members, activities, topup
│   └── utils/
│       ├── crypto.ts             # bcrypt hash/compare
│       └── response.ts           # ok() / fail() 响应封装
├── client/src/
│   ├── router/index.ts           # 路由: Login, Members, MemberDetail, Activities, ActivityDetail, Stats, Settings
│   ├── stores/auth.ts            # Pinia auth store (token, groupId, groupName, role)
│   ├── utils/http.ts             # axios 封装 + 拦截器
│   ├── api/                      # members, activities, stats
│   ├── layouts/AppShell.vue      # 主布局 (顶栏 + 内容 + 底部Tab)
│   └── views/                    # LoginView, MembersView, MemberDetailView, ActivitiesView, ActivityDetailView, StatsView, SettingsView
```

---

## 已知注意事项

1. **数据库**: SQLite 文件在 `data/outdoor.db`，重置数据库需要先停服务再删文件再跑迁移
2. **端口冲突**: Windows 下重启服务前用 `netstat -aon | findstr ":3000"` + `taskkill //F //PID xxx` 杀旧进程
3. **中文编码**: Windows cmd 下 curl 发送中文会乱码，用 Node.js 脚本发请求可避免
4. **日期格式**: 后端 Zod 校验要求 `YYYY-MM-DD`，前端用 NDatePicker (返回 timestamp) + formatDate 转换
5. **结算模式**: 当前采用管理员中心化模式 — 管理员统一收款(collect) + 统一报销(reimburse)，非 P2P 转账
