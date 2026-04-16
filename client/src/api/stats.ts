import { request } from '@/utils/http'

export interface StatsData {
  memberCount: number
  totalBalance: number
  totalTopup: number
  totalSpent: number
  totalActivities: number
  settledActivities: number
  balanceRanking: {
    memberId: number
    name: string
    nickname: string | null
    balance: number
  }[]
  recentActivities: {
    id: number
    name: string
    date: string
    totalCost: number | null
    unitPrice: number | null
  }[]
  categoryStats: {
    category: string
    total: number
  }[]
}

export interface TransactionItem {
  id: number
  memberId: number
  memberName: string
  memberNickname: string | null
  activityId: number | null
  type: string
  amount: number
  balanceBefore: number
  balanceAfter: number
  description: string | null
  createdAt: number
}

export function fetchStats() {
  return request<StatsData>({ url: '/stats' })
}

export function fetchTransactions(memberId?: number) {
  const params = memberId ? { memberId } : undefined
  return request<TransactionItem[]>({ url: '/stats/transactions', params })
}
