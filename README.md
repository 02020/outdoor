# 户外公积金管理系统 (Outdoor Fund)


cd d:\Er\io\outdoor
npm run build                    # 1. 构建
python deploy\deploy.py          # 2. 部署（一键完成）


> 面向户外活动群组的公积金自动结算系统

---

## 📖 产品概述

一个用于管理户外活动公积金的完整系统。成员预充值公积金余额，每次活动由系统自动 AA 计算并扣减余额，余额不足时自动转为现金补款，替代手工记账和线下收款。

### 核心价值

| 痛点 | 解决方案 |
|------|----------|
| 每次活动手工算 AA，容易出错 | 系统自动结算，支持外挂、按车分摊等复杂场景 |
| 垫付后催款困难 | 预充值余额自动扣减，余额不足标记补款 |
| 多个群各管各账，数据混乱 | 多群隔离，余额独立，统一平台管理 |
| 活动结算后发现错误无法修改 | 冲红重算机制，修改自动回滚+重新结算 |
| 资金流水不透明 | 不可变账本 + 审计日志，每笔变动可追溯 |

### 目标用户

户外活动群组（登山、徒步、自驾、露营等），群规模 5~100 人。

### 产品形态

移动端优先的 H5 Web 应用，部署在阿里云 ECS，通过手机浏览器访问。

## ✨ 核心功能

### 👥 会员管理
- 会员信息维护（姓名、手机号、头像）
- 余额管理（充值、扣减、流水记录）
- 一键收款充值（批量处理欠款会员）
- 个人资金流水（按时间倒序展示）

### 🏔️ 活动管理
- **5 步活动向导**：基本信息 → 参与人员 → 车辆分摊 → 费用录入 → 智能结算
- **外挂机制**：支持非群成员随行人员，费用由所属会员代付
- **车辆分摊**：全员平摊 / 按车分摊两种模式
- **费用类别**：食材费 / 油费 / 路费 / 停车费 / 住宿费 / 其他
- **垫付报销**：走公款（增加余额）/ 走现金（线下转账）

### 💰 自动结算
- 人均费用自动计算（支持外挂、缺席惩罚）
- 余额自动扣减，不足部分标记"需补现金"
- 垫付金额自动识别，生成报销清单
- 结算单预览确认后执行

### 🔄 冲红重算
- 已结算活动支持编辑修改
- 自动冲红（原扣减全额退回）→ 重算 → 入账
- 差异确认框展示修改前后对比
- 审计日志记录每次变更

### 🚗 车辆与路线
- 车辆管理（车牌、车型、车主绑定）
- 路线库管理（海拔、爬升、距离、途经点）
- 活动关联路线，自动带出路线信息

### 📊 报表统计
- 全员资金总表（余额、充值、消费、活动次数）
- 单次活动结算单（费用明细、参与人结算表）
- 个人流水查询
- 资金池汇总

### 🗺️ 地图可视化
- 高德地图集成
- 路线起点、终点、途经点标记
- 活动地图展示

### 📝 审计日志
- 操作记录追踪
- 字段级别差异对比
- 不可篡改的时间线

## 💻 技术栈

### 前端
- **框架**：Vue 3 (Composition API + TypeScript)
- **状态管理**：Pinia
- **UI 组件库**：Naive UI
- **CSS**：UnoCSS (原子化 CSS)
- **路由**：Vue Router
- **HTTP 客户端**：Axios
- **构建工具**：Vite 6
- **地图**：高德地图 JS API 2.0
- **搜索**：MiniSearch
- **虚拟滚动**：@tanstack/vue-virtual

### 后端
- **运行时**：Node.js 20+ + Express
- **语言**：TypeScript
- **数据库**：SQLite (WAL 模式) + better-sqlite3
- **ORM**：Drizzle ORM
- **数据校验**：Zod
- **认证**：JWT (jsonwebtoken, 7 天有效期)
- **密码加密**：bcrypt
- **进程管理**：PM2

### 架构设计
- **Monorepo**：npm workspaces (shared + client + server)
- **配置驱动渲染**：Schema-based 表单和列表，减少重复代码
- **结算算法**：纯函数实现，前后端共享（`shared/src/settlement.ts`）
- **数据库隔离**：支持后续从 SQLite 迁移到 MySQL

### 项目结构
```
outdoor-fund/
├── shared/              # 前后端共享包
│   └── src/
│       ├── types.ts     # 领域类型定义
│       ├── enums.ts     # 枚举常量
│       └── settlement.ts # 核心结算算法（纯函数）
│
├── client/              # Vue 3 前端应用
│   └── src/
│       ├── api/         # HTTP 客户端层
│       ├── stores/      # Pinia stores
│       ├── composables/ # 可组合函数
│       ├── views/       # 页面组件
│       ├── components/  # 通用组件
│       └── utils/       # 工具函数
│
├── server/              # Express 后端服务
│   └── src/
│       ├── db/
│       │   ├── schema/    # Drizzle 表定义
│       │   └── migrations/# 数据库迁移
│       ├── routes/      # 路由定义
│       ├── services/    # 业务逻辑
│       ├── middleware/  # 中间件
│       └── validators/  # Zod 校验
│
├── deploy/              # 部署脚本
├── docs/                # 项目文档
│   ├── PRD.md           # 产品需求文档
│   └── tech-design.md   # 技术设计文档
└── data/                # 数据库文件（已忽略）
```

## 🚀 快速开始

### 环境要求
- Node.js >= 20.0.0
- npm >= 9.0.0

### 安装

```bash
# 克隆项目
git clone https://github.com/02020/outdoor.git
cd outdoor

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置必要的配置
```

### 开发

```bash
# 同时启动前后端开发服务器
npm run dev

# 单独启动后端
npm run dev:server

# 单独启动前端
npm run dev:client
```

### 构建

```bash
# 构建全部
npm run build

# 仅构建前端
npm run build:client

# 仅构建后端
npm run build:server
```

### 数据库

```bash
# 生成迁移文件
npm run db:generate

# 执行数据库迁移
npm run db:migrate
```

### 类型检查

```bash
npm run typecheck
```

## 🔧 环境变量

参考 `.env.example` 文件：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# JWT 配置
JWT_SECRET=<64位随机字符串>
JWT_EXPIRES_IN=7d

# 数据库配置
DATABASE_PATH=./data/outdoor.db

# 高德地图 API
AMAP_API_KEY=<你的高德地图 JS API Key>
```

## 📡 API 接口

所有接口前缀：`/api/v1`，认证通过 Authorization Bearer Token (JWT)。

### 主要模块

| 模块 | 路径 | 说明 |
|------|------|------|
| 认证 | `/auth` | 群组密码登录、创建群组 |
| 会员 | `/groups/:gid/members` | 会员 CRUD、充值、流水 |
| 车辆 | `/groups/:gid/vehicles` | 车辆管理 |
| 路线 | `/groups/:gid/routes` | 路线库管理 |
| 活动 | `/groups/:gid/activities` | 活动创建、结算、冲红重算 |
| 报表 | `/groups/:gid/reports` | 资金总表、结算单 |

详细 API 文档见 [技术设计文档](./docs/2026-04-15-outdoor-fund-tech-design.md#6-api-设计)。

## 📊 数据库设计

### 核心表

| 表名 | 说明 |
|------|------|
| `groups` | 群组（管理员密码、会员密码） |
| `members` | 全局会员 |
| `group_members` | 群组-会员关联（含余额） |
| `activities` | 活动（分摊模式、报销模式） |
| `activity_members` | 活动参与人（外挂数量、分摊金额） |
| `expenses` | 费用明细（类别、垫付人） |
| `transactions` | 资金流水（不可变账本） |
| `vehicles` | 车辆信息 |
| `routes` | 路线库 |
| `audit_logs` | 审计日志 |

详细表结构见 [技术设计文档](./docs/2026-04-15-outdoor-fund-tech-design.md#5-数据库设计)。

## 🧮 结算算法

### 外挂算法
```
单价 = 总费用 ÷ (会员数 + 外挂总数)
会员A（带N个外挂）应付 = 单价 × (1 + N)
```

### 车费算法

**全员平摊**：`车费人均 = 总车费 ÷ 总人头数（含外挂）`

**按车分摊**：`某车费用人均 = 该车费用 ÷ 该车实际乘坐人头数（含外挂）`

### 结算优先级
1. 尝试从余额扣减应付金额
2. 余额充足 → 直接扣减
3. 余额不足 → 余额扣至 0，差额标记"需补现金"
4. 有垫付 → 根据报销模式处理（走公款/走现金）

算法实现：`shared/src/settlement.ts`（纯函数，前后端共享）

## 🛡️ 安全与数据保护

- 资金流水表不可修改、不可删除，仅追加写入
- 所有金额操作在数据库事务中执行
- 群组密码 bcrypt 加密存储
- JWT Token 有效期 7 天
- 审计日志记录每一次数据变更

## 📦 部署

### 部署架构

```
阿里云 ECS (推荐 2C4G)
├── Nginx (:80/443)
│   ├── /* → 静态文件 (client/dist/)
│   └── /api/* → proxy_pass http://127.0.0.1:3000
├── PM2 → Node.js Express (:3000)
├── SQLite (WAL 模式)
├── Certbot → Let's Encrypt SSL
└── Cron → 每日 03:00 备份数据库
```

### 部署步骤

部署脚本位于 `deploy/` 目录，包含完整的服务器配置和部署流程。

详细部署说明见 [技术设计文档](./docs/2026-04-15-outdoor-fund-tech-design.md#9-部署架构)。

## 📚 文档

- [产品需求文档 (PRD)](./docs/2026-04-15-outdoor-fund-prd.md)
- [技术设计文档](./docs/2026-04-15-outdoor-fund-tech-design.md)
- [设计规范](./docs/design-system.md)
- [开发 TODO](./docs/TODO.md)

## 🗺️ 实施阶段

- ✅ **阶段一**：基础框架（Monorepo、认证、会员管理）
- ⏳ **阶段二**：活动核心（结算算法、5 步向导、车辆路线）
- ⏳ **阶段三**：编辑冲红 + 报表
- ⏳ **阶段四**：地图 + 搜索 + 体验优化
- ⏳ **阶段五**：部署上线

## 📄 License

Private - 仅供内部使用