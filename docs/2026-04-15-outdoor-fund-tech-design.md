# 户外公积金管理系统 — 技术设计文档

> 版本：1.0  
> 日期：2026-04-15  
> 状态：Draft  
> 前置文档：[PRD](./2026-04-15-outdoor-fund-prd.md)

---

## 1. 技术栈

| 层 | 技术 | 版本 |
|---|---|---|
| 前端框架 | Vue 3 Composition API + TypeScript | ^3.5 |
| 状态管理 | Pinia | ^2.x |
| UI 组件库 | Naive UI | ^2.x |
| CSS | UnoCSS (presetUno + presetIcons) | ^0.60 |
| 搜索 | MiniSearch | ^7.x |
| 虚拟滚动 | @tanstack/vue-virtual | ^3.x |
| 画布 | 原生 Canvas 2D | — |
| 工具集 | VueUse | ^11.x |
| 后端 | Node.js + Express + TypeScript | Node ^20, Express ^4.x |
| ORM | Drizzle ORM + better-sqlite3 | ^0.35 |
| 数据库 | SQLite (WAL 模式) | — |
| 校验 | Zod | ^3.x |
| 地图 | 高德地图 JS API 2.0 | — |
| 认证 | JWT (jsonwebtoken) | — |
| 构建 | Vite | ^6.x |
| 部署 | Nginx + PM2 + 阿里云 ECS | — |

---

## 2. 项目结构

```
outdoor-fund/
├── package.json                    # Workspace root (npm workspaces)
├── tsconfig.base.json              # 共享 TS 配置
├── .env.example
├── .gitignore
│
├── shared/                         # 前后端共享包
│   ├── package.json
│   └── src/
│       ├── types.ts                # 领域类型定义
│       ├── enums.ts                # 枚举常量
│       └── settlement.ts           # 核心结算算法（纯函数，同构）
│
├── client/                         # Vue 3 前端
│   ├── package.json
│   ├── vite.config.ts
│   ├── uno.config.ts
│   ├── index.html
│   └── src/
│       ├── main.ts                 # 入口：NaiveUI provider 注册
│       ├── App.vue                 # NConfigProvider + NMessageProvider + RouterView
│       ├── api/                    # HTTP 客户端层
│       │   ├── client.ts           # axios 实例 + 拦截器 + auth header
│       │   ├── group.ts
│       │   ├── member.ts
│       │   ├── vehicle.ts
│       │   ├── route.ts
│       │   ├── activity.ts
│       │   └── report.ts
│       ├── stores/                 # Pinia stores
│       │   ├── auth.ts             # 群组上下文、JWT token
│       │   ├── group.ts            # 群组列表 + 当前群组
│       │   ├── member.ts           # 当前群会员
│       │   ├── vehicle.ts          # 车辆
│       │   ├── route.ts            # 路线库
│       │   └── activity.ts         # 活动向导状态 + 列表
│       ├── composables/
│       │   ├── useSettlement.ts    # 客户端结算预览
│       │   ├── useSearch.ts        # MiniSearch 封装
│       │   ├── useAmap.ts          # 高德地图生命周期
│       │   └── useAuth.ts          # 认证守卫 + token 管理
│       ├── router/
│       │   ├── index.ts            # 路由实例 + 守卫
│       │   └── routes.ts           # 路由定义
│       ├── views/                  # 页面组件
│       │   ├── login/
│       │   │   ├── LoginView.vue
│       │   │   ├── props.ts
│       │   │   └── schema.ts
│       │   ├── home/
│       │   │   ├── HomeView.vue
│       │   │   ├── props.ts
│       │   │   └── schema.ts
│       │   ├── activity/
│       │   │   ├── ActivityListView.vue
│       │   │   ├── ActivityWizardView.vue
│       │   │   ├── ActivityDetailView.vue
│       │   │   ├── props.ts
│       │   │   └── schema.ts       # 向导步骤 schema 配置
│       │   ├── member/
│       │   │   ├── MemberListView.vue
│       │   │   ├── MemberDetailView.vue
│       │   │   ├── props.ts
│       │   │   └── schema.ts       # 会员列表 columns 配置
│       │   ├── vehicle/
│       │   │   ├── VehicleListView.vue
│       │   │   ├── props.ts
│       │   │   └── schema.ts
│       │   ├── route/
│       │   │   ├── RouteListView.vue
│       │   │   ├── RouteFormView.vue
│       │   │   ├── props.ts
│       │   │   └── schema.ts
│       │   ├── report/
│       │   │   ├── FundSummaryView.vue
│       │   │   ├── ActivityReportView.vue
│       │   │   ├── props.ts
│       │   │   └── schema.ts       # 报表 columns 配置
│       │   └── map/
│       │       └── MapView.vue
│       ├── components/
│       │   ├── layout/
│       │   │   ├── AppShell.vue
│       │   │   ├── BottomTabBar.vue
│       │   │   └── PageHeader.vue
│       │   ├── activity/
│       │   │   ├── StepBasicInfo.vue
│       │   │   ├── StepParticipants.vue
│       │   │   ├── StepVehicles.vue
│       │   │   ├── StepExpenses.vue
│       │   │   ├── StepSettlement.vue
│       │   │   ├── ExpenseEntryCard.vue
│       │   │   └── SettlementSheet.vue
│       │   ├── member/
│       │   │   ├── MemberCard.vue
│       │   │   ├── MemberPicker.vue
│       │   │   └── TopUpDialog.vue
│       │   ├── vehicle/
│       │   │   ├── VehicleCard.vue
│       │   │   └── PassengerAssigner.vue
│       │   ├── common/
│       │   │   ├── BalanceBadge.vue
│       │   │   ├── SearchBar.vue
│       │   │   ├── EmptyState.vue
│       │   │   ├── ConfirmDialog.vue
│       │   │   ├── AuditLogTimeline.vue
│       │   │   └── SchemaForm.vue       # 配置驱动通用表单
│       │   └── map/
│       │       └── AmapContainer.vue
│       ├── types/
│       └── utils/
│           ├── format.ts           # 金额/日期格式化
│           ├── schema-helpers.ts   # 配置驱动渲染辅助函数
│           └── canvas.ts           # Canvas 结算单导出
│
├── server/                         # Express 后端
│   ├── package.json
│   ├── tsconfig.json
│   ├── drizzle.config.ts
│   └── src/
│       ├── index.ts                # Express 入口
│       ├── db/
│       │   ├── connection.ts       # 数据库连接（迁移时只改此文件）
│       │   ├── schema/             # Drizzle 表定义（迁移时 sqliteTable → mysqlTable）
│       │   │   ├── index.ts
│       │   │   ├── groups.ts
│       │   │   ├── members.ts
│       │   │   ├── vehicles.ts
│       │   │   ├── routes.ts
│       │   │   ├── activities.ts
│       │   │   ├── expenses.ts
│       │   │   ├── transactions.ts
│       │   │   ├── settlements.ts
│       │   │   └── auditLogs.ts
│       │   ├── repositories/       # 数据访问层（隔离 Drizzle 调用）
│       │   │   ├── group.repo.ts
│       │   │   ├── member.repo.ts
│       │   │   ├── vehicle.repo.ts
│       │   │   ├── route.repo.ts
│       │   │   ├── activity.repo.ts
│       │   │   ├── transaction.repo.ts
│       │   │   └── audit.repo.ts
│       │   └── migrations/
│       ├── middleware/
│       │   ├── auth.ts
│       │   ├── errorHandler.ts
│       │   └── validate.ts
│       ├── routes/
│       │   ├── index.ts
│       │   ├── auth.routes.ts
│       │   ├── group.routes.ts
│       │   ├── member.routes.ts
│       │   ├── vehicle.routes.ts
│       │   ├── route.routes.ts
│       │   ├── activity.routes.ts
│       │   └── report.routes.ts
│       ├── controllers/
│       ├── services/
│       │   ├── settlement.service.ts   # 核心：结算执行 + 冲红重算
│       │   ├── group.service.ts
│       │   ├── member.service.ts
│       │   ├── vehicle.service.ts
│       │   ├── route.service.ts
│       │   ├── activity.service.ts
│       │   └── report.service.ts
│       ├── validators/             # Zod schemas
│       └── utils/
│           ├── crypto.ts           # bcrypt 密码处理
│           └── token.ts            # JWT 生成/验证
```

---

## 3. 配置驱动渲染规范（Naive UI 适配版）

> 延续 `coding-style.md` 的核心模式，适配 Naive UI 组件库。

### 3.1 核心思想

不写重复的列/字段 HTML，而是：

1. **配置层** (`schema.ts`)：定义 `columns` / `formSchema` 数组，每项描述一列或一个表单字段。
2. **组件层** (`components/`)：用 `v-for` 遍历 + `v-if/v-else-if` 按 `adaptor` 分发渲染。
3. **使用层** (`views/`)：传入配置数组，不关心内部渲染细节。

### 3.2 adaptor 枚举（Naive UI 版）

| `adaptor` 值 | 渲染组件 | 用途 |
|-------------|---------|------|
| `undefined` / 无 | 纯文本 `<span>` | 只读展示 |
| `'input'` | `<NInput>` | 文本输入 |
| `'input-number'` | `<NInputNumber>` | 数字输入 |
| `'select'` | `<NSelect>` | 下拉选择 |
| `'date'` | `<NDatePicker>` | 日期选择 |
| `'radio'` | `<NRadioGroup>` | 单选 |
| `'checkbox'` | `<NCheckbox>` | 复选框 |
| `'switch'` | `<NSwitch>` | 开关 |
| `'button'` | `<NButton>` 操作按钮组 | 操作列 |
| `'balance'` | `<BalanceBadge>` | 余额醒目展示 |
| `'member-picker'` | `<MemberPicker>` | 会员多选 + 外挂输入 |
| `'passenger'` | `<PassengerAssigner>` | 乘客分配 |
| `'expense'` | `<ExpenseEntryCard>` | 费用条目 |

### 3.3 Schema 字段结构

```ts
// schema.ts
interface SchemaField {
  // 必填
  prop: string           // 绑定数据字段名
  label: string          // 标签/列标题

  // 渲染控制
  adaptor?: string       // 渲染类型（决定 v-else-if 分支）

  // 布局
  width?: number         // 固定宽度
  minWidth?: number      // 最小宽度
  align?: 'left' | 'center' | 'right'
  span?: number          // 表单布局 NGrid span

  // 数据来源
  options?: Array<{ label: string; value: string | number }>

  // 显隐控制
  visible?: boolean | VisibleCondition[][] | ((entity: any) => boolean)

  // 禁用控制
  disabled?: boolean | ((ctx: { row: any }) => boolean)

  // 验证
  required?: boolean
  rules?: any[]          // Naive UI FormItemRule[]
}
```

### 3.4 列表 schema 示例（会员列表）

```ts
// views/member/schema.ts
import type { SchemaField } from '@/types'

export const memberColumns: SchemaField[] = [
  { prop: 'name', label: '姓名', minWidth: 80 },
  { prop: 'balance', label: '余额', adaptor: 'balance', width: 120, align: 'right' },
  { prop: 'activityCount', label: '活动次数', width: 80, align: 'center' },
  {
    prop: 'actions',
    label: '操作',
    adaptor: 'button',
    width: 160,
    options: [
      { label: '充值', value: 'topup' },
      { label: '编辑', value: 'edit' },
    ],
    // 仅管理员可见
    visible: (entity) => entity._role === 'admin',
  },
]
```

### 3.5 表单 schema 示例（活动基本信息）

```ts
// views/activity/schema.ts
export const activityBasicSchema: SchemaField[] = [
  { prop: 'name', label: '活动名称', adaptor: 'input', required: true, span: 24 },
  { prop: 'date', label: '活动时间', adaptor: 'date', required: true, span: 12 },
  { prop: 'location', label: '活动地点', adaptor: 'input', span: 12 },
  { prop: 'routeId', label: '关联路线', adaptor: 'select', options: [], span: 24 },
  { prop: 'notes', label: '备注', adaptor: 'input', span: 24 },
]

export const expenseSchema: SchemaField[] = [
  {
    prop: 'category',
    label: '费用类别',
    adaptor: 'select',
    required: true,
    options: [
      { label: '食材费', value: 'food' },
      { label: '油费', value: 'gas' },
      { label: '路费', value: 'toll' },
      { label: '停车费', value: 'parking' },
      { label: '住宿费', value: 'accommodation' },
      { label: '其他', value: 'other' },
    ],
  },
  { prop: 'amount', label: '金额', adaptor: 'input-number', required: true },
  { prop: 'payerId', label: '垫付人', adaptor: 'select', required: true, options: [] },
  { prop: 'isVehicleCost', label: '车辆费用', adaptor: 'switch' },
  {
    prop: 'vehicleId',
    label: '关联车辆',
    adaptor: 'select',
    visible: [[{ prop: 'isVehicleCost', value: true }]],
  },
]
```

### 3.6 通用表单组件（SchemaForm）

```vue
<!-- components/common/SchemaForm.vue -->
<template>
  <NForm ref="formRef" :model="model" label-placement="top">
    <NGrid :cols="24" :x-gap="12">
      <NFormItemGi
        v-for="field in visibleFields"
        :key="field.prop"
        :span="field.span ?? 24"
        :label="field.label"
        :path="field.prop"
        :rule="field.rules"
      >
        <!-- 纯文本 -->
        <span v-if="!field.adaptor">
          {{ model[field.prop] }}
        </span>

        <!-- 文本输入 -->
        <NInput
          v-else-if="field.adaptor === 'input'"
          v-model:value="model[field.prop]"
          :disabled="resolveDisabled(field, model)"
          :placeholder="`请输入${field.label}`"
        />

        <!-- 数字输入 -->
        <NInputNumber
          v-else-if="field.adaptor === 'input-number'"
          v-model:value="model[field.prop]"
          :disabled="resolveDisabled(field, model)"
          class="w-full"
        />

        <!-- 下拉选择 -->
        <NSelect
          v-else-if="field.adaptor === 'select'"
          v-model:value="model[field.prop]"
          :options="resolveOptions(field)"
          :disabled="resolveDisabled(field, model)"
          :placeholder="`请选择${field.label}`"
        />

        <!-- 日期选择 -->
        <NDatePicker
          v-else-if="field.adaptor === 'date'"
          v-model:value="model[field.prop]"
          type="date"
          class="w-full"
        />

        <!-- 单选 -->
        <NRadioGroup
          v-else-if="field.adaptor === 'radio'"
          v-model:value="model[field.prop]"
        >
          <NRadioButton
            v-for="opt in resolveOptions(field)"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </NRadioButton>
        </NRadioGroup>

        <!-- 开关 -->
        <NSwitch
          v-else-if="field.adaptor === 'switch'"
          v-model:value="model[field.prop]"
        />

        <!-- 兜底 -->
        <span v-else class="text-gray text-xs">
          [{{ field.adaptor }}]
        </span>
      </NFormItemGi>
    </NGrid>
  </NForm>
</template>
```

### 3.7 adaptor 分发链规则

```
v-if="!field.adaptor"              → 纯文本
v-else-if="field.adaptor === 'xxx'" → 对应 Naive UI 组件
v-else                              → 兜底（开发调试用，上线移除）
```

---

## 4. `<script setup>` 声明块顺序规范

```vue
<script setup lang="ts">
// 1. 第三方库 import
import { NButton, NDataTable, NInput } from 'naive-ui'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

// 2. 内部路径 import（从近到远）
import SettlementSheet from '../components/activity/SettlementSheet.vue'
import { useSettlement } from '../composables/useSettlement'
import { useActivityStore } from '../stores/activity'
import { Props } from './props'
import { memberColumns } from './schema'

// 3. Props & Emits
const props = defineProps(Props)
const emit = defineEmits(['cmd', 'update:modelValue'])

// 4. computed 响应式派生
const columns_ = computed(() => {
  return memberColumns.filter(col =>
    fitVisible(col.visible, { entity: currentRow.value })
  )
})

// 5. composable / hooks 调用
const store = useActivityStore()
const { result, calculate } = useSettlement()

// 6. 局部状态 ref / reactive
const loading = ref(false)
const formData = ref({})

// 7. 事件处理函数
function onCmd(key: string, evt: any) {
  if (key === 'topup') {
    showTopUpDialog(evt.row)
  }
  else {
    emit('cmd', key, evt)
  }
}

// 8. watch
watch(() => props.groupId, (val) => {
  if (val) store.fetchMembers(val)
}, { immediate: true })

// 9. 生命周期
onMounted(() => {
  store.init()
})

// 10. defineExpose
defineExpose({ validate })
</script>
```

### 4.1 Props 规范

```ts
// props.ts
import type { PropType } from 'vue'

export const Props = {
  /** 群组 ID */
  groupId: { type: Number, required: true },

  /** 列配置 */
  columns: { type: Array as PropType<SchemaField[]>, default: () => [] },

  /** 数据源 */
  data: { type: Array as PropType<any[]>, default: () => [] },

  /** 是否加载中 */
  loading: { type: Boolean, default: false },
}
```

### 4.2 事件规范

```ts
// 核心事件格式
const emit = defineEmits<{
  /** 通用命令事件 */
  cmd: [key: string, evt: { row?: any; field?: SchemaField; value?: any }]
  /** v-model 双向绑定 */
  'update:modelValue': [value: any]
}>()
```

- `cmd` 收敛多种操作，子组件统一通过 `emit('cmd', key, evt)` 冒泡。
- 事件处理用 `if/else-if` 链分发，末尾 `else` 兜底透传，不用 `switch`。

### 4.3 显隐控制

复用 `fitVisible` 逻辑，支持布尔、条件数组、函数三种模式：

```ts
// utils/schema-helpers.ts
export function fitVisible(
  visible: SchemaField['visible'],
  ctx: { entity: Record<string, any> }
): boolean {
  if (visible === undefined || visible === null) return true
  if (typeof visible === 'boolean') return visible
  if (typeof visible === 'function') return visible(ctx.entity)
  // 二维数组：外层 some（或），内层 every（且）
  return visible.some(group =>
    group.every(cond => {
      const val = ctx.entity[cond.prop]
      if (Array.isArray(cond.value)) return cond.value.includes(val)
      return val === cond.value
    })
  )
}

export function resolveDisabled(
  field: SchemaField,
  row: any
): boolean {
  if (typeof field.disabled === 'function') return field.disabled({ row })
  return field.disabled ?? false
}

export function resolveOptions(field: SchemaField) {
  return field.options ?? []
}
```

### 4.4 Composable 规范

```ts
// composables/useSettlement.ts
export function useSettlement(
  props: { participants: Ref<Participant[]>; expenses: Ref<Expense[]> },
  { splitMode }: { splitMode: Ref<SplitMode> }
) {
  const result = computed(() =>
    calculateSettlement(props.participants.value, props.expenses.value, splitMode.value)
  )

  return { result }
}
```

规则：
- 参数：`(props/refs, { 配置对象 })`
- 返回：普通对象（命名返回值）
- 内部用 `ref` / `computed`，不直接修改传入数据

---

## 5. 数据库设计

### 5.1 迁移策略

**当前**：SQLite (WAL 模式) + Drizzle ORM + better-sqlite3。

**架构隔离措施**（确保后续可迁移 MySQL）：

1. 所有数据库操作集中在 `server/src/db/` 目录。
2. Schema 文件独立（迁移时 `sqliteTable` → `mysqlTable`）。
3. `connection.ts` 统一导出 db 实例（切换时只改此文件）。
4. 避免 SQLite 特有函数。时间用 INTEGER (Unix 时间戳 ms)，布尔用 INTEGER (0/1)。
5. Services 通过 repositories 访问数据，不直接调用 Drizzle API。

**迁移步骤**（约改 12 个文件，业务代码零改动）：
```
1. npm i mysql2 @drizzle-orm/mysql2 && npm rm better-sqlite3
2. 改写 connection.ts
3. 改写 schema/*.ts (sqliteTable → mysqlTable)
4. 改写 drizzle.config.ts
5. drizzle-kit generate → MySQL migrations
6. 数据迁移脚本 (SQLite dump → MySQL import)
```

### 5.2 表结构定义

#### groups — 群组

```ts
// server/src/db/schema/groups.ts
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const groups = sqliteTable('groups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  adminPasswordHash: text('admin_password_hash').notNull(),
  memberPasswordHash: text('member_password_hash').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
})
```

#### members — 全局会员

```ts
export const members = sqliteTable('members', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  phone: text('phone'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
})
```

#### groupMembers — 群组-会员关联（含余额）

```ts
import { real, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const groupMembers = sqliteTable('group_members', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupId: integer('group_id').notNull().references(() => groups.id),
  memberId: integer('member_id').notNull().references(() => members.id),
  balance: real('balance').notNull().default(0),
  role: text('role', { enum: ['admin', 'member'] }).notNull().default('member'),
  joinedAt: integer('joined_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => ({
  uniqueGroupMember: uniqueIndex('idx_group_member').on(table.groupId, table.memberId),
}))
```

#### vehicles — 车辆

```ts
export const vehicles = sqliteTable('vehicles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupId: integer('group_id').notNull().references(() => groups.id),
  plateNumber: text('plate_number').notNull(),
  model: text('model'),
  ownerId: integer('owner_id').references(() => members.id),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
})
```

#### routes — 路线库

```ts
export const routes = sqliteTable('routes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupId: integer('group_id').notNull().references(() => groups.id),
  name: text('name').notNull(),
  description: text('description'),
  altitudeM: real('altitude_m'),
  elevationGainM: real('elevation_gain_m'),
  distanceKm: real('distance_km'),
  driveDistanceKm: real('drive_distance_km'),
  driveTimeMin: integer('drive_time_min'),
  waypointsJson: text('waypoints_json'),          // JSON: [{lat, lng, label}]
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
})
```

#### activities — 活动

```ts
export const activities = sqliteTable('activities', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupId: integer('group_id').notNull().references(() => groups.id),
  name: text('name').notNull(),
  date: text('date').notNull(),                     // ISO date: 'YYYY-MM-DD'
  location: text('location'),
  routeId: integer('route_id').references(() => routes.id),
  splitMode: text('split_mode', { enum: ['all_split', 'per_car'] }).notNull(),
  reimburseMode: text('reimburse_mode', { enum: ['balance', 'cash'] }).notNull().default('balance'),
  status: text('status', { enum: ['draft', 'settled', 'reversed'] }).notNull().default('draft'),
  totalCost: real('total_cost'),
  unitPrice: real('unit_price'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  settledAt: integer('settled_at', { mode: 'timestamp_ms' }),
})
```

#### activityMembers — 活动参与人

```ts
export const activityMembers = sqliteTable('activity_members', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  activityId: integer('activity_id').notNull().references(() => activities.id),
  memberId: integer('member_id').notNull().references(() => members.id),
  hangerOnCount: integer('hanger_on_count').notNull().default(0),
  vehicleId: integer('vehicle_id').references(() => vehicles.id),
  amountCharged: real('amount_charged').default(0),
  amountAdvanced: real('amount_advanced').default(0),
  netAmount: real('net_amount').default(0),
  isAbsent: integer('is_absent', { mode: 'boolean' }).default(false),
}, (table) => ({
  uniqueActivityMember: uniqueIndex('idx_activity_member').on(table.activityId, table.memberId),
}))
```

#### expenses — 费用明细

```ts
export const expenses = sqliteTable('expenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  activityId: integer('activity_id').notNull().references(() => activities.id),
  category: text('category', {
    enum: ['food', 'gas', 'toll', 'parking', 'accommodation', 'other']
  }).notNull(),
  amount: real('amount').notNull(),
  payerId: integer('payer_id').notNull().references(() => members.id),
  description: text('description'),
  isVehicleCost: integer('is_vehicle_cost', { mode: 'boolean' }).default(false),
  vehicleId: integer('vehicle_id').references(() => vehicles.id),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
})
```

#### transactions — 资金流水（不可变账本）

```ts
export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupId: integer('group_id').notNull().references(() => groups.id),
  memberId: integer('member_id').notNull().references(() => members.id),
  activityId: integer('activity_id').references(() => activities.id),
  type: text('type', { enum: ['topup', 'debit', 'reversal', 'adjustment'] }).notNull(),
  amount: real('amount').notNull(),                 // 正=入账，负=扣减
  balanceBefore: real('balance_before').notNull(),
  balanceAfter: real('balance_after').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
})
```

#### settlements — 结算转账记录

```ts
export const settlements = sqliteTable('settlements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  activityId: integer('activity_id').notNull().references(() => activities.id),
  fromMemberId: integer('from_member_id').notNull().references(() => members.id),
  toMemberId: integer('to_member_id').notNull().references(() => members.id),
  amount: real('amount').notNull(),
  mode: text('mode', { enum: ['balance', 'cash'] }).notNull(),
  status: text('status', { enum: ['pending', 'confirmed'] }).notNull().default('pending'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
})
```

#### auditLogs — 审计日志

```ts
export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupId: integer('group_id').notNull().references(() => groups.id),
  entityType: text('entity_type').notNull(),        // 'activity' | 'member' | 'settlement'
  entityId: integer('entity_id').notNull(),
  action: text('action').notNull(),                  // 'create' | 'update' | 'reverse' | 'settle'
  diffJson: text('diff_json'),                       // JSON: { field: { old, new } }
  operatorId: integer('operator_id').references(() => members.id),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
})
```

### 5.3 实体关系图

```
groups ──1:N── group_members ──N:1── members
  │                                      │
  ├──1:N── vehicles                      ├──1:N── transactions
  ├──1:N── routes                        │
  ├──1:N── activities                    │
  │           ├──1:N── activity_members ──┘
  │           ├──1:N── expenses
  │           ├──1:N── settlements
  │           └──1:N── audit_logs
  └──1:N── audit_logs
```

---

## 6. API 设计

所有接口前缀：`/api/v1`。认证通过 Authorization Bearer Token (JWT)。

### 6.1 认证模块

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/auth/login` | 群组密码登录，返回 JWT `{ token, role, groupId }` | 公开 |
| POST | `/auth/groups` | 创建群组 | 公开 |
| GET | `/auth/groups` | 群组列表（仅名称和 ID） | 公开 |

**JWT Payload：**
```ts
{
  groupId: number
  role: 'admin' | 'member'
  iat: number
  exp: number    // 7 天有效期
}
```

### 6.2 会员模块 `/groups/:gid/members`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/` | 列表（含余额、活动次数） | admin |
| POST | `/` | 新增会员 | admin |
| GET | `/:mid` | 会员详情 | admin |
| PUT | `/:mid` | 编辑会员 | admin |
| POST | `/:mid/topup` | 手动充值 | admin |
| GET | `/:mid/transactions` | 个人流水 | admin |
| POST | `/batch-topup` | 一键收款充值 | admin |

### 6.3 车辆模块 `/groups/:gid/vehicles`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/` | 列表 | admin |
| POST | `/` | 新增 | admin |
| PUT | `/:vid` | 编辑 | admin |
| DELETE | `/:vid` | 删除 | admin |

### 6.4 路线模块 `/groups/:gid/routes`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/` | 列表（支持搜索） | admin |
| POST | `/` | 新增 | admin |
| GET | `/:rid` | 详情 + 途经点 | admin |
| PUT | `/:rid` | 编辑 | admin |
| DELETE | `/:rid` | 删除 | admin |

### 6.5 活动模块 `/groups/:gid/activities`（核心）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/` | 活动列表（分页，按日期倒序） | admin, member |
| POST | `/` | 创建活动草稿 | admin |
| GET | `/:aid` | 活动详情（含参与人、费用、结算单） | admin, member |
| PUT | `/:aid` | 更新活动（向导步骤 1-4 数据） | admin |
| PUT | `/:aid/participants` | 批量设置参与人 + 外挂 | admin |
| PUT | `/:aid/vehicle-assignments` | 分配乘车 | admin |
| PUT | `/:aid/expenses` | 批量设置费用 | admin |
| POST | `/:aid/preview` | 预览结算（dry run，不写库） | admin |
| POST | `/:aid/settle` | 执行结算 | admin |
| POST | `/:aid/reverse` | 冲红 | admin |
| POST | `/:aid/resettle` | 冲红 + 重算 + 入账（原子操作） | admin |
| GET | `/:aid/audit-log` | 审计日志 | admin |

### 6.6 报表模块 `/groups/:gid/reports`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/fund-summary` | 全员资金总表 | admin |
| GET | `/activity/:aid/sheet` | 单次活动结算单 | admin, member |
| GET | `/statistics` | 汇总统计 | admin |

### 6.7 统一响应格式

```ts
// 成功
{ code: 0, data: T, message: 'ok' }

// 失败
{ code: number, data: null, message: string }
```

错误码约定：

| 范围 | 说明 |
|------|------|
| 1xxx | 认证/权限错误 |
| 2xxx | 参数校验错误 |
| 3xxx | 业务逻辑错误（余额不足、活动状态不允许等） |
| 5xxx | 系统内部错误 |

---

## 7. 核心结算算法

位于 `shared/src/settlement.ts`，纯函数，前后端共用。

```ts
interface SettlementInput {
  participants: Array<{
    memberId: number
    hangerOnCount: number
    vehicleId?: number
    isAbsent?: boolean
  }>
  expenses: Array<{
    category: string
    amount: number
    payerId: number
    isVehicleCost: boolean
    vehicleId?: number
  }>
  splitMode: 'all_split' | 'per_car'
}

interface SettlementResult {
  totalCost: number
  totalHeads: number
  sharedPerHead: number
  vehiclePerHead?: number                  // 全员平摊模式
  vehicleCostMap?: Map<number, {           // 按车分摊模式
    cost: number
    heads: number
    perHead: number
  }>
  participants: Array<{
    memberId: number
    heads: number
    amountCharged: number
    amountAdvanced: number
    netAmount: number                       // 正=应付，负=应收
  }>
  transfers: Array<{
    from: number
    to: number
    amount: number
  }>
}

function calculateSettlement(input: SettlementInput): SettlementResult
```

**算法伪代码：**

```
1. totalHeads = SUM(1 + hangerOnCount) 对所有非缺席参与者
2. sharedExpenses = expenses.filter(!isVehicleCost)
3. vehicleExpenses = expenses.filter(isVehicleCost)
4. sharedPerHead = SUM(sharedExpenses.amount) / totalHeads
5. 车辆费用：
   - all_split: vehiclePerHead = SUM(vehicleExpenses.amount) / totalHeads
   - per_car: 按 vehicleId 分组，每组 cost / heads
6. 每人 amountCharged = (sharedPerHead + vehiclePerHead) × heads
7. 每人 amountAdvanced = SUM(expenses.filter(payerId === memberId).amount)
8. netAmount = amountCharged - amountAdvanced
9. 最小化转账：贪心算法匹配 debtors 与 creditors
```

---

## 8. 前端路由

```ts
// router/routes.ts
const routes = [
  { path: '/login', component: LoginView, meta: { public: true } },
  {
    path: '/',
    component: AppShell,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/home' },
      { path: 'home', component: HomeView },
      { path: 'activity', component: ActivityListView },
      { path: 'activity/new', component: ActivityWizardView, meta: { admin: true } },
      { path: 'activity/:id', component: ActivityDetailView },
      { path: 'activity/:id/edit', component: ActivityWizardView, meta: { admin: true } },
      { path: 'members', component: MemberListView, meta: { admin: true } },
      { path: 'members/:id', component: MemberDetailView, meta: { admin: true } },
      { path: 'vehicles', component: VehicleListView, meta: { admin: true } },
      { path: 'routes', component: RouteListView, meta: { admin: true } },
      { path: 'routes/new', component: RouteFormView, meta: { admin: true } },
      { path: 'routes/:id/edit', component: RouteFormView, meta: { admin: true } },
      { path: 'reports', component: FundSummaryView, meta: { admin: true } },
      { path: 'reports/activity/:id', component: ActivityReportView },
      { path: 'map', component: MapView },
    ],
  },
]
```

**底部导航（4 Tab）：**

| Tab | 图标 | 路由 | 角色 |
|-----|------|------|------|
| 首页 | i-carbon-home | /home | 所有 |
| 活动 | i-carbon-event | /activity | 所有 |
| 成员 | i-carbon-group | /members | 管理员 |
| 更多 | i-carbon-overflow-menu-horizontal | 展开菜单 | 所有 |

普通会员的底部导航隐藏"成员"Tab，"更多"菜单中也隐藏管理功能。

---

## 9. 部署架构

```
阿里云 ECS (推荐 2C4G)
├── Nginx (:80/443)
│   ├── /* → 静态文件 (client/dist/, SPA fallback to index.html)
│   └── /api/* → proxy_pass http://127.0.0.1:3000
├── PM2 → Node.js Express (:3000)
│   ├── 自动重启
│   └── 日志轮转
├── SQLite (/data/outdoor-fund/outdoor.db)
│   └── WAL 模式（并发读）
├── Certbot → Let's Encrypt SSL
└── Cron
    └── 每日 03:00 备份 db → /backups/outdoor_YYYYMMDD.db（保留 30 天）
```

**环境变量 (.env)：**
```
DATABASE_PATH=/data/outdoor-fund/outdoor.db
JWT_SECRET=<random-64-char-string>
PORT=3000
AMAP_API_KEY=<高德地图 JS API Key>
```

---

## 10. 实施阶段

### 阶段一：基础框架

- 初始化 monorepo (npm workspaces: shared + client + server)
- 配置工具链 (TypeScript, Vite, UnoCSS, ESLint)
- 数据库全量 schema + drizzle-kit 迁移
- 认证模块 (群组密码 → JWT, 双密码区分角色)
- 群组 CRUD + 会员 CRUD (含余额)
- 前端骨架 (LoginView, AppShell, BottomTabBar, 路由守卫)
- 会员列表 (配置驱动 columns) + 会员详情
- 手动充值流程 (TopUpDialog → API → 流水)

### 阶段二：活动核心

- shared/ 结算算法包 (纯函数 + 单元测试)
- 车辆 CRUD + 路线库 CRUD (含 schema 配置驱动表单)
- 5 步活动向导 (SchemaForm 驱动)
- 结算执行 (原子事务: 扣余额 + 写流水 + 更新状态)
- 活动列表 + 活动详情 (结算单展示)

### 阶段三：编辑冲红 + 报表

- 活动编辑 + 冲红重算 (resettle 原子操作)
- 差异确认框 + 审计日志 (AuditLogTimeline)
- 全员资金总表 (NDataTable, 排序)
- 单次活动结算单 + 个人流水
- 一键收款充值 + 现金报销模式

### 阶段四：地图 + 搜索 + 体验

- 高德地图集成 (useAmap composable)
- MiniSearch 全局搜索 (useSearch composable)
- @tanstack/vue-virtual 虚拟滚动
- Canvas 2D 结算单图片导出
- 移动端 UX 打磨 (触控、空状态、骨架屏)

### 阶段五：部署上线

- ECS 环境 (Nginx + PM2 + SSL)
- 数据库备份 cron
- 安全加固 (helmet, CORS, rate-limit, 输入消毒)
- 构建脚本 + 部署文档
