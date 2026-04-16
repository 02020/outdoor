<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NTag, NEmpty, NSpin, useMessage } from 'naive-ui'
import { fetchAuditLogs, type AuditLogItem } from '@/api/audit'

const router = useRouter()
const message = useMessage()
const loading = ref(false)
const logs = ref<AuditLogItem[]>([])

async function loadData() {
  loading.value = true
  try {
    logs.value = await fetchAuditLogs(100)
  } catch (err: any) {
    message.error(err.message)
  } finally {
    loading.value = false
  }
}

function formatTime(ts: number) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const actionLabels: Record<string, string> = {
  add: '添加',
  remove: '移除',
  settle: '结算',
  reverse: '冲红',
  topup: '充值',
  create: '创建',
  update: '更新',
  delete: '删除',
}

const entityLabels: Record<string, string> = {
  Activity: '活动',
  Member: '会员',
  Expense: '费用',
  Vehicle: '车辆',
  Route: '路线',
  Group: '群组',
}

function actionColor(action: string): 'default' | 'success' | 'warning' | 'error' | 'info' {
  if (action === 'settle' || action === 'add' || action === 'create') return 'success'
  if (action === 'reverse' || action === 'remove' || action === 'delete') return 'error'
  if (action === 'topup') return 'warning'
  return 'info'
}

onMounted(loadData)
</script>

<template>
  <div>
    <div class="mb-3">
      <NButton text class="text-emerald-700!" @click="router.push('/settings')">
        <template #icon><span class="i-carbon-arrow-left" /></template>
        返回设置
      </NButton>
    </div>
    <h2 class="text-lg font-bold text-gray-800 mb-4 mt-0">审计日志</h2>

    <NSpin :show="loading">
      <div v-if="logs.length" class="log-list">
        <div v-for="log in logs" :key="log.id" class="log-row">
          <div class="flex items-center gap-2 mb-1">
            <NTag :type="actionColor(log.action)" size="tiny" :bordered="false">
              {{ actionLabels[log.action] || log.action }}
            </NTag>
            <span class="text-xs text-gray-400">
              {{ entityLabels[log.entityType] || log.entityType }} #{{ log.entityId }}
            </span>
            <span class="text-xs text-gray-300 ml-auto">{{ formatTime(log.createdAt) }}</span>
          </div>
          <div v-if="log.operatorName" class="text-xs text-gray-400">
            操作人: {{ log.operatorName }}
          </div>
          <div v-if="log.diffJson" class="text-xs text-gray-400 mt-0.5 font-mono">
            {{ log.diffJson }}
          </div>
        </div>
      </div>
      <NEmpty v-else description="暂无日志记录" class="mt-12" />
    </NSpin>
  </div>
</template>

<style scoped>
.log-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.log-row {
  background: #fff;
  border-radius: 12px;
  padding: 12px 14px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.03);
}
</style>
