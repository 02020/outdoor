import type {
  ActivityStatus,
  ExpenseCategory,
  ExperienceLevel,
  GroupRole,
  ReimburseMode,
  SplitMode,
  TransactionType,
} from './enums'

/** 群组 */
export interface Group {
  id: number
  name: string
  description: string | null
  createdAt: number
  updatedAt: number
}

/** 会员 */
export interface Member {
  id: number
  name: string
  avatarUrl: string | null
  phone: string | null
  createdAt: number
}

/** 群组会员（含余额） */
export interface GroupMember {
  id: number
  groupId: number
  memberId: number
  balance: number
  role: GroupRole
  joinedAt: number
}

/** 会员列表展示项 */
export interface MemberListItem {
  memberId: number
  name: string
  nickname: string | null
  avatarUrl: string | null
  balance: number
  role: GroupRole
  outdoorTitle: string | null
  hasCar: boolean
  experienceLevel: ExperienceLevel | null
  activityCount: number
}

/** 车辆 */
export interface Vehicle {
  id: number
  groupId: number
  plateNumber: string
  model: string | null
  ownerId: number | null
  ownerName?: string
  createdAt: number
}

/** 路线 */
export interface Route {
  id: number
  groupId: number
  name: string
  description: string | null
  altitudeM: number | null
  elevationGainM: number | null
  distanceKm: number | null
  driveDistanceKm: number | null
  driveTimeMin: number | null
  waypointsJson: string | null
  createdAt: number
}

/** 途经点 */
export interface Waypoint {
  lat: number
  lng: number
  label: string
}

/** 活动 */
export interface Activity {
  id: number
  groupId: number
  name: string
  date: string
  location: string | null
  routeId: number | null
  splitMode: SplitMode
  reimburseMode: ReimburseMode
  status: ActivityStatus
  totalCost: number | null
  unitPrice: number | null
  notes: string | null
  createdAt: number
  settledAt: number | null
}

/** 活动参与人 */
export interface ActivityMember {
  id: number
  activityId: number
  memberId: number
  hangerOnCount: number
  vehicleId: number | null
  amountCharged: number
  amountAdvanced: number
  netAmount: number
  isAbsent: boolean
}

/** 费用明细 */
export interface Expense {
  id: number
  activityId: number
  category: ExpenseCategory
  amount: number
  payerId: number
  description: string | null
  isVehicleCost: boolean
  vehicleId: number | null
  createdAt: number
}

/** 资金流水 */
export interface Transaction {
  id: number
  groupId: number
  memberId: number
  activityId: number | null
  type: TransactionType
  amount: number
  balanceBefore: number
  balanceAfter: number
  description: string | null
  createdAt: number
}

/** 审计日志 */
export interface AuditLog {
  id: number
  groupId: number
  entityType: string
  entityId: number
  action: string
  diffJson: string | null
  operatorId: number | null
  createdAt: number
}

/** 统一 API 响应 */
export interface ApiResponse<T = unknown> {
  code: number
  data: T
  message: string
}
