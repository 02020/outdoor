/** 费用类别 */
export const ExpenseCategory = {
  food: '食材费',
  gas: '油费',
  toll: '路费',
  parking: '停车费',
  accommodation: '住宿费',
  other: '其他',
} as const

export type ExpenseCategory = keyof typeof ExpenseCategory

/** 分摊模式 */
export const SplitMode = {
  all_split: '全员平摊',
  per_car: '按车分摊',
} as const

export type SplitMode = keyof typeof SplitMode

/** 报销模式 */
export const ReimburseMode = {
  balance: '走公款',
  cash: '走现金',
} as const

export type ReimburseMode = keyof typeof ReimburseMode

/** 活动状态 */
export const ActivityStatus = {
  draft: '草稿',
  settled: '已结算',
  reversed: '已冲红',
} as const

export type ActivityStatus = keyof typeof ActivityStatus

/** 流水类型 */
export const TransactionType = {
  topup: '充值',
  debit: '活动扣减',
  reversal: '冲红退回',
  adjustment: '调整',
} as const

export type TransactionType = keyof typeof TransactionType

/** 群组角色 */
export const GroupRole = {
  admin: '管理员',
  member: '会员',
} as const

export type GroupRole = keyof typeof GroupRole

/** 结算记录状态 */
export const SettlementStatus = {
  pending: '待确认',
  confirmed: '已确认',
} as const

export type SettlementStatus = keyof typeof SettlementStatus

/** 户外经验等级 */
export const ExperienceLevel = {
  beginner: '新手',
  elementary: '入门',
  intermediate: '进阶',
  senior: '资深',
} as const

export type ExperienceLevel = keyof typeof ExperienceLevel

/** 路线类型 */
export const RouteType = {
  loop: '环线',
  traverse: '穿越',
  creek: '溯溪',
  climb: '攀岩',
  trail: '古道',
  coastline: '海岸线',
  ridge: '山脊线',
  other: '其他',
} as const

export type RouteType = keyof typeof RouteType

/** 行政区划（地级市） */
export const RegionCode: Record<string, string> = {
  '350100': '福州市',
  '350200': '厦门市',
  '350300': '莆田市',
  '350400': '三明市',
  '350500': '泉州市',
  '350600': '漳州市',
  '350700': '南平市',
  '350800': '龙岩市',
  '350900': '宁德市',
} as const
