<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  NButton,
  NInput,
  NModal,
  NForm,
  NFormItem,
  NSelect,
  NDatePicker,
  NTag,
  NEmpty,
  NSpin,
  useMessage,
  useDialog,
  type FormInst,
  type FormRules,
} from 'naive-ui'
import type { Activity } from '@outdoor-fund/shared'
import { ActivityStatus, SplitMode, ReimburseMode } from '@outdoor-fund/shared'
import { useAuthStore } from '@/stores/auth'
import { fetchActivities, createActivity, deleteActivity } from '@/api/activities'
import { fetchRoutes, type RouteItem } from '@/api/routes'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const auth = useAuthStore()

// --- ref ---
const list = ref<Activity[]>([])
const loading = ref(false)
const keyword = ref('')
const showCreate = ref(false)
const createFormRef = ref<FormInst | null>(null)
const createModel = ref({
  name: '',
  date: null as number | null,
  location: '',
  routeId: null as number | null,
  splitMode: 'all_split',
  reimburseMode: 'balance',
  notes: '',
})
const createLoading = ref(false)

const routeList = ref<RouteItem[]>([])
const routeOptions = computed(() =>
  routeList.value.map(r => ({ label: r.name, value: r.id }))
)

// --- computed ---
const filtered = computed(() => {
  if (!keyword.value) return list.value
  const kw = keyword.value.toLowerCase()
  return list.value.filter((a) => a.name.toLowerCase().includes(kw))
})

// --- 校验规则 ---
const createRules: FormRules = {
  name: { required: true, message: '请输入活动名称', trigger: 'blur' },
  date: { required: true, type: 'number', message: '请选择日期', trigger: ['blur', 'change'] },
}

const splitOptions = Object.entries(SplitMode).map(([k, v]) => ({ label: v, value: k }))
const reimburseOptions = Object.entries(ReimburseMode).map(([k, v]) => ({ label: v, value: k }))

function formatDate(ts: number): string {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// --- functions ---
async function loadData() {
  loading.value = true
  try {
    [list.value, routeList.value] = await Promise.all([fetchActivities(), fetchRoutes()])
  } catch (err: any) {
    message.error(err.message)
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  try {
    await createFormRef.value?.validate()
  } catch {
    return
  }
  createLoading.value = true
  try {
    const act = await createActivity({
      name: createModel.value.name,
      date: formatDate(createModel.value.date!),
      location: createModel.value.location || undefined,
      routeId: createModel.value.routeId ?? undefined,
      splitMode: createModel.value.splitMode,
      reimburseMode: createModel.value.reimburseMode,
      notes: createModel.value.notes || undefined,
    })
    message.success('活动创建成功')
    showCreate.value = false
    createModel.value = { name: '', date: null, location: '', routeId: null, splitMode: 'all_split', reimburseMode: 'balance', notes: '' }
    router.push(`/activities/${act.id}`)
  } catch (err: any) {
    message.error(err.message)
  } finally {
    createLoading.value = false
  }
}

function handleDelete(act: Activity) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除活动「${act.name}」吗？`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteActivity(act.id)
        message.success('已删除')
        await loadData()
      } catch (err: any) {
        message.error(err.message)
      }
    },
  })
}

function statusColor(status: string) {
  if (status === 'settled') return 'success'
  if (status === 'reversed') return 'error'
  return 'default'
}

// --- lifecycle ---
onMounted(loadData)
</script>

<template>
  <div>
    <!-- 搜索 + 创建 -->
    <div class="flex items-center gap-3 mb-3">
      <NInput v-model:value="keyword" placeholder="搜索活动..." clearable class="flex-1" size="medium">
        <template #prefix><span class="i-carbon-search text-gray-400" /></template>
      </NInput>
      <NButton v-if="auth.isAdmin" type="primary" size="medium" @click="showCreate = true">
        <template #icon><span class="i-carbon-add" /></template>
        创建
      </NButton>
    </div>

    <!-- 活动卡片列表 -->
    <NSpin :show="loading">
      <div v-if="filtered.length" class="activity-list">
        <div
          v-for="act in filtered"
          :key="act.id"
          class="act-card"
          @click="router.push(`/activities/${act.id}`)"
        >
          <div class="flex-between">
            <span class="font-semibold text-sm text-gray-800">{{ act.name }}</span>
            <NTag :type="statusColor(act.status)" size="small" :bordered="false">
              {{ ActivityStatus[act.status as keyof typeof ActivityStatus] }}
            </NTag>
          </div>
          <div class="flex items-center gap-4 mt-2 text-xs text-gray-400">
            <span>{{ act.date }}</span>
            <span v-if="act.location">{{ act.location }}</span>
            <span>{{ SplitMode[act.splitMode as keyof typeof SplitMode] }}</span>
          </div>
          <div v-if="act.totalCost" class="mt-2 text-right">
            <span class="text-base font-bold text-emerald-600">¥{{ act.totalCost.toFixed(2) }}</span>
            <span v-if="act.unitPrice" class="text-xs text-gray-400 ml-2">人均 ¥{{ act.unitPrice.toFixed(2) }}</span>
          </div>
          <div v-if="auth.isAdmin && act.status === 'draft'" class="mt-2 flex justify-end">
            <NButton text type="error" size="tiny" @click.stop="handleDelete(act)">删除</NButton>
          </div>
        </div>
      </div>
      <NEmpty v-else description="暂无活动" class="mt-12" />
    </NSpin>

    <!-- 创建活动弹窗 -->
    <NModal v-model:show="showCreate" title="创建活动" preset="dialog" :mask-closable="false" style="width: 90%; max-width: 400px;">
      <NForm ref="createFormRef" :model="createModel" :rules="createRules" label-placement="top" size="medium" class="mt-4">
        <NFormItem label="活动名称" path="name">
          <NInput v-model:value="createModel.name" placeholder="例如：白云山徒步" />
        </NFormItem>
        <NFormItem label="日期" path="date">
          <NDatePicker v-model:value="createModel.date" type="date" class="w-full" placeholder="选择活动日期" />
        </NFormItem>
        <NFormItem label="地点">
          <NInput v-model:value="createModel.location" placeholder="可选" />
        </NFormItem>
        <NFormItem label="关联路线">
          <NSelect
            v-model:value="createModel.routeId"
            :options="routeOptions"
            placeholder="可选，选择本次活动路线"
            clearable
            filterable
          />
        </NFormItem>
        <NFormItem label="分摊模式">
          <NSelect v-model:value="createModel.splitMode" :options="splitOptions" />
        </NFormItem>
        <NFormItem label="报销模式">
          <NSelect v-model:value="createModel.reimburseMode" :options="reimburseOptions" />
        </NFormItem>
        <NFormItem label="备注">
          <NInput v-model:value="createModel.notes" type="textarea" placeholder="可选" :autosize="{ minRows: 2 }" />
        </NFormItem>
      </NForm>
      <template #action>
        <NButton @click="showCreate = false">取消</NButton>
        <NButton type="primary" :loading="createLoading" @click="handleCreate">创建</NButton>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.act-card {
  background: #fff;
  border-radius: 14px;
  padding: 10px 12px;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: transform 0.15s ease;
}
.act-card:active {
  transform: scale(0.98);
}
</style>
