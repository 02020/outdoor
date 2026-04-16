import type { SplitMode } from './enums'

/** 结算算法输入 */
export interface SettlementInput {
  participants: SettlementParticipant[]
  expenses: SettlementExpense[]
  splitMode: SplitMode
}

export interface SettlementParticipant {
  memberId: number
  hangerOnCount: number
  vehicleId?: number
  isAbsent?: boolean
}

export interface SettlementExpense {
  category: string
  amount: number
  payerId: number
  isVehicleCost: boolean
  vehicleId?: number
}

/** 结算算法输出 */
export interface SettlementResult {
  totalCost: number
  totalHeads: number
  sharedCost: number
  vehicleCost: number
  sharedPerHead: number
  vehiclePerHead: number | null
  vehicleCostMap: Record<number, VehicleCostEntry>
  participants: SettlementParticipantResult[]
  transfers: SettlementTransfer[]
}

export interface VehicleCostEntry {
  cost: number
  heads: number
  perHead: number
}

export interface SettlementParticipantResult {
  memberId: number
  heads: number
  amountCharged: number
  amountAdvanced: number
  netAmount: number
}

export interface SettlementTransfer {
  type: 'collect' | 'reimburse'
  memberId: number
  amount: number
}

/**
 * 核心结算算法 — 纯函数，前后端共用
 */
export function calculateSettlement(input: SettlementInput): SettlementResult {
  const { participants, expenses, splitMode } = input

  // 过滤缺席者（缺席者仍承担车费，但这里先计算非缺席的人头）
  const activeParticipants = participants.filter(p => !p.isAbsent)

  // 1. 计算总人头
  let totalHeads = 0
  for (const p of activeParticipants) {
    totalHeads += 1 + p.hangerOnCount
  }

  if (totalHeads === 0) {
    return {
      totalCost: 0,
      totalHeads: 0,
      sharedCost: 0,
      vehicleCost: 0,
      sharedPerHead: 0,
      vehiclePerHead: null,
      vehicleCostMap: {},
      participants: [],
      transfers: [],
    }
  }

  // 2. 分类费用
  const sharedExpenses = expenses.filter(e => !e.isVehicleCost)
  const vehicleExpenses = expenses.filter(e => e.isVehicleCost)

  const sharedCost = sharedExpenses.reduce((sum, e) => sum + e.amount, 0)
  const vehicleCost = vehicleExpenses.reduce((sum, e) => sum + e.amount, 0)
  const totalCost = sharedCost + vehicleCost

  // 3. 公共费用人均
  const sharedPerHead = totalHeads > 0 ? round2(sharedCost / totalHeads) : 0

  // 4. 车辆费用计算
  let vehiclePerHead: number | null = null
  const vehicleCostMap: Record<number, VehicleCostEntry> = {}

  if (splitMode === 'all_split') {
    // 全员平摊
    vehiclePerHead = totalHeads > 0 ? round2(vehicleCost / totalHeads) : 0
  } else {
    // 按车分摊：按 vehicleId 分组统计费用
    for (const e of vehicleExpenses) {
      if (e.vehicleId != null) {
        if (!vehicleCostMap[e.vehicleId]) {
          vehicleCostMap[e.vehicleId] = { cost: 0, heads: 0, perHead: 0 }
        }
        vehicleCostMap[e.vehicleId].cost += e.amount
      }
    }
    // 统计每车人头数
    for (const p of activeParticipants) {
      if (p.vehicleId != null && vehicleCostMap[p.vehicleId]) {
        vehicleCostMap[p.vehicleId].heads += 1 + p.hangerOnCount
      }
    }
    // 计算每车人均
    for (const vid of Object.keys(vehicleCostMap)) {
      const entry = vehicleCostMap[Number(vid)]
      entry.perHead = entry.heads > 0 ? round2(entry.cost / entry.heads) : 0
    }
  }

  // 5. 计算每人应付
  const participantResults: SettlementParticipantResult[] = []
  for (const p of activeParticipants) {
    const heads = 1 + p.hangerOnCount
    let charge = sharedPerHead * heads

    if (splitMode === 'all_split') {
      charge += (vehiclePerHead ?? 0) * heads
    } else if (p.vehicleId != null && vehicleCostMap[p.vehicleId]) {
      charge += vehicleCostMap[p.vehicleId].perHead * heads
    }

    // 6. 计算垫付金额
    const advanced = expenses
      .filter(e => e.payerId === p.memberId)
      .reduce((sum, e) => sum + e.amount, 0)

    participantResults.push({
      memberId: p.memberId,
      heads,
      amountCharged: round2(charge),
      amountAdvanced: round2(advanced),
      netAmount: round2(charge - advanced),
    })
  }

  // 7. 管理员中心化转账（收款 + 报销垫付）
  const transfers = adminCentricTransfers(participantResults)

  return {
    totalCost: round2(totalCost),
    totalHeads,
    sharedCost: round2(sharedCost),
    vehicleCost: round2(vehicleCost),
    sharedPerHead,
    vehiclePerHead,
    vehicleCostMap,
    participants: participantResults,
    transfers,
  }
}

/**
 * 管理员中心化转账：
 * 1. 收款(collect)：每位参与人缴纳应付份额
 * 2. 报销(reimburse)：给每位垫付人退回垫付金额
 */
function adminCentricTransfers(
  participants: SettlementParticipantResult[],
): SettlementTransfer[] {
  const transfers: SettlementTransfer[] = []

  // 收款：每人缴纳应付份额
  for (const p of participants) {
    if (p.amountCharged > 0.005) {
      transfers.push({ type: 'collect', memberId: p.memberId, amount: p.amountCharged })
    }
  }

  // 报销：给垫付人退回垫付金额
  for (const p of participants) {
    if (p.amountAdvanced > 0.005) {
      transfers.push({ type: 'reimburse', memberId: p.memberId, amount: p.amountAdvanced })
    }
  }

  return transfers
}

/** 四舍五入到 2 位小数 */
function round2(n: number): number {
  return Math.round(n * 100) / 100
}
