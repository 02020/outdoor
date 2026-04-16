# 户外公积金管理系统 (Outdoor Fund)

一个用于管理户外活动公积金的完整系统，支持成员管理、活动组织、费用结算等功能。

## 功能特性

- 👥 **成员管理** - 成员信息维护、充值记录
- 🏔️ **活动管理** - 活动创建、参与人员管理、费用记录
- 💰 **费用结算** - 自动计算 AA 费用、结算管理
- 🚗 **车辆管理** - 车辆信息、路线规划
- 📊 **数据统计** - 活动统计、成员消费分析
- 📝 **审计日志** - 操作记录追踪
- 📤 **数据导入** - 支持 Excel 批量导入

## 技术栈

### 前端
- Vue 3 (Composition API + TypeScript)
- Naive UI 组件库
- UnoCSS 原子化 CSS
- Pinia 状态管理
- Vue Router 路由管理
- Axios HTTP 客户端
- Vite 构建工具

### 后端
- Node.js + Express
- TypeScript
- SQLite (better-sqlite3)
- Drizzle ORM
- Zod 数据验证
- JWT 认证
- bcrypt 密码加密

### 项目结构
```
outdoor-fund/
├── client/          # Vue 3 前端应用
├── server/          # Node.js 后端服务
├── shared/          # 前后端共享类型和工具
├── deploy/          # 部署脚本
├── docs/            # 项目文档
└── data/            # 数据库文件 (已忽略)
```

## 快速开始

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

## 环境变量

参考 `.env.example` 文件，主要配置项：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# JWT 配置
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# 数据库配置
DB_PATH=./data/outdoor.db
```

## 部署

部署脚本位于 `deploy/` 目录，包含完整的服务器配置和部署流程。

## License

Private - 仅供内部使用