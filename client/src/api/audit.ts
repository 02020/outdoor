import { request } from '@/utils/http'

export interface AuditLogItem {
  id: number
  groupId: number
  entityType: string
  entityId: number
  action: string
  diffJson: string | null
  operatorId: number | null
  operatorName: string | null
  createdAt: number
}

export function fetchAuditLogs(limit = 50, offset = 0) {
  return request<AuditLogItem[]>({ url: '/audit-logs', params: { limit, offset } })
}
