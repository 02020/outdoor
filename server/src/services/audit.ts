import { db } from '../db/connection'
import { auditLogs, members } from '../db/schema/index'
import { eq, and, desc } from 'drizzle-orm'

/** 写入审计日志 */
export function writeAuditLog(params: {
  groupId: number
  entityType: string
  entityId: number
  action: string
  diffJson?: string | null
  operatorId?: number | null
}) {
  db.insert(auditLogs).values({
    groupId: params.groupId,
    entityType: params.entityType,
    entityId: params.entityId,
    action: params.action,
    diffJson: params.diffJson ?? null,
    operatorId: params.operatorId ?? null,
    createdAt: Date.now(),
  }).run()
}

/** 查询审计日志 */
export function listAuditLogs(groupId: number, limit = 50, offset = 0) {
  return db
    .select({
      id: auditLogs.id,
      groupId: auditLogs.groupId,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      action: auditLogs.action,
      diffJson: auditLogs.diffJson,
      operatorId: auditLogs.operatorId,
      operatorName: members.name,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(members, eq(auditLogs.operatorId, members.id))
    .where(eq(auditLogs.groupId, groupId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset)
    .all()
}
