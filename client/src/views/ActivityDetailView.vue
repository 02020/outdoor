<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NButton,
  NTag,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSwitch,
  NDatePicker,
  NEmpty,
  NSpin,
  NDivider,
  useMessage,
  useDialog,
  type SelectOption,
} from 'naive-ui'
import {
  ActivityStatus,
  SplitMode,
  ReimburseMode,
  ExpenseCategory,
} from '@outdoor-fund/shared'
import type { Activity, MemberListItem } from '@outdoor-fund/shared'
import { useAuthStore } from '@/stores/auth'
import { fetchMembers } from '@/api/members'
import { fetchVehicles, type VehicleItem } from '@/api/vehicles'
import {
  fetchActivityDetail,
  updateActivity,
  setActivityMembers,
  addExpense,
  deleteExpense,
  previewSettlement,
  confirmSettlement,
  reverseSettlement,
} from '@/api/activities'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const auth = useAuthStore()

const activityId = Number(route.params.id)

// --- ref ---
const loading = ref(false)
const activity = ref<Activity | null>(null)
const actMembers = ref<any[]>([])
const actExpenses = ref<any[]>([])
const actSettlements = ref<any[]>([])
const allMembers = ref<MemberListItem[]>([])

// 添加参与人
const showAddMembers = ref(false)
const selectedMemberIds = ref<number[]>([])
const hangerOnMap = ref<Record<number, number>>({})
const vehicleIdMap = ref<Record<number, number | null>>({})
const vehicleList = ref<VehicleItem[]>([])
// 添加费用
const showAddExpense = ref(false)
const expenseModel = ref({ category: 'food' as string, amount: null as number | null, payerId: null as number | null, description: '', isVehicleCost: false })
const expenseLoading = ref(false)

// 结算预览
const showSettlePreview = ref(false)
const settleResult = ref<any>(null)
const settleLoading = ref(false)

// 编辑活动
const showEditActivity = ref(false)
const editModel = ref({
  name: '',
  date: null as number | null,
  location: '',
  splitMode: 'all_split',
  reimburseMode: 'balance',
  notes: '',
})
const editLoading = ref(false)

const splitOptions = Object.entries(SplitMode).map(([k, v]) => ({ label: v, value: k }))
const reimburseOptions = Object.entries(ReimburseMode).map(([k, v]) => ({ label: v, value: k }))

// --- computed ---
const isDraft = computed(() => activity.value?.status === 'draft')
const isSettled = computed(() => activity.value?.status === 'settled')
const isReversed = computed(() => activity.value?.status === 'reversed')
const isPerCar = computed(() => activity.value?.splitMode === 'per_car')

const vehicleOptions = computed<SelectOption[]>(() =>
  vehicleList.value.map((v) => ({
    label: v.ownerName ? `${v.plateNumber} (${v.ownerName})` : v.plateNumber,
    value: v.id,
  })),
)

const memberOptions = computed<SelectOption[]>(() =>
  allMembers.value.map((m) => ({
    label: m.nickname ? `${m.name} (${m.nickname})` : m.name,
    value: m.memberId,
  })),
)

const payerOptions = computed<SelectOption[]>(() =>
  actMembers.value.map((m) => ({
    label: m.memberNickname ? `${m.memberName} (${m.memberNickname})` : m.memberName,
    value: m.memberId,
  })),
)

const categoryOptions = Object.entries(ExpenseCategory).map(([k, v]) => ({ label: v, value: k }))

const totalExpense = computed(() =>
  actExpenses.value.reduce((sum, e) => sum + e.amount, 0),
)

// --- functions ---
async function loadData() {
  loading.value = true
  try {
    const [detail, members, vehicles] = await Promise.all([
      fetchActivityDetail(activityId),
      fetchMembers(),
      fetchVehicles(),
    ])
    activity.value = detail.activity
    actMembers.value = detail.members
    actExpenses.value = detail.expenses
    actSettlements.value = detail.settlements
    allMembers.value = members
    vehicleList.value = vehicles
  } catch (err: any) {
    message.error(err.message)
  } finally {
    loading.value = false
  }
}

function openAddMembers() {
  selectedMemberIds.value = actMembers.value.map((m: any) => m.memberId)
  const hMap: Record<number, number> = {}
  const vMap: Record<number, number | null> = {}
  for (const m of actMembers.value) {
    hMap[m.memberId] = m.hangerOnCount ?? 0
    vMap[m.memberId] = m.vehicleId ?? null
  }
  hangerOnMap.value = hMap
  vehicleIdMap.value = vMap
  showAddMembers.value = true
}

async function handleSetMembers() {
  try {
    const memberList = selectedMemberIds.value.map((id) => ({
      memberId: id,
      hangerOnCount: hangerOnMap.value[id] ?? 0,
      vehicleId: vehicleIdMap.value[id] ?? undefined,
    }))
    await setActivityMembers(activityId, memberList)
    message.success('参与人已更新')
    showAddMembers.value = false
    await loadData()
  } catch (err: any) {
    message.error(err.message)
  }
}

async function handleAddExpense() {
  if (!expenseModel.value.amount || !expenseModel.value.payerId) {
    message.warning('请填写金额和垫付人')
    return
  }
  expenseLoading.value = true
  try {
    await addExpense(activityId, {
      category: expenseModel.value.category,
      amount: expenseModel.value.amount,
      payerId: expenseModel.value.payerId,
      description: expenseModel.value.description || undefined,
      isVehicleCost: expenseModel.value.isVehicleCost,
    })
    message.success('费用已添加')
    showAddExpense.value = false
    expenseModel.value = { category: 'food', amount: null, payerId: null, description: '', isVehicleCost: false }
    await loadData()
  } catch (err: any) {
    message.error(err.message)
  } finally {
    expenseLoading.value = false
  }
}

async function handleDeleteExpense(eid: number) {
  try {
    await deleteExpense(activityId, eid)
    message.success('费用已删除')
    await loadData()
  } catch (err: any) {
    message.error(err.message)
  }
}

async function handlePreviewSettle() {
  settleLoading.value = true
  try {
    settleResult.value = await previewSettlement(activityId)
    showSettlePreview.value = true
  } catch (err: any) {
    message.error(err.message)
  } finally {
    settleLoading.value = false
  }
}

async function handleConfirmSettle() {
  dialog.warning({
    title: '确认结算',
    content: '结算后将扣减会员余额，确定要继续吗？',
    positiveText: '确认结算',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await confirmSettlement(activityId)
        message.success('结算完成！')
        showSettlePreview.value = false
        await loadData()
      } catch (err: any) {
        message.error(err.message)
      }
    },
  })
}

async function handleReverseSettle() {
  dialog.warning({
    title: '确认冲红',
    content: '冲红将撤销本次结算，恢复所有会员余额变动，确定要继续吗？',
    positiveText: '确认冲红',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await reverseSettlement(activityId)
        message.success('结算已冲红')
        await loadData()
      } catch (err: any) {
        message.error(err.message)
      }
    },
  })
}

function memberNameById(id: number) {
  const m = actMembers.value.find((m: any) => m.memberId === id)
  return m?.memberNickname || m?.memberName || `#${id}`
}

function openEditActivity() {
  if (!activity.value) return
  // 将 YYYY-MM-DD 转为时间戳
  const dateParts = activity.value.date.split('-')
  const dateTs = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2])).getTime()
  editModel.value = {
    name: activity.value.name,
    date: dateTs,
    location: activity.value.location ?? '',
    splitMode: activity.value.splitMode,
    reimburseMode: activity.value.reimburseMode,
    notes: activity.value.notes ?? '',
  }
  showEditActivity.value = true
}

function formatDateTs(ts: number): string {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function handleEditActivity() {
  if (!editModel.value.name.trim() || !editModel.value.date) {
    message.warning('请填写活动名称和日期')
    return
  }
  editLoading.value = true
  try {
    await updateActivity(activityId, {
      name: editModel.value.name.trim(),
      date: formatDateTs(editModel.value.date),
      location: editModel.value.location.trim() || undefined,
      splitMode: editModel.value.splitMode,
      reimburseMode: editModel.value.reimburseMode,
      notes: editModel.value.notes.trim() || undefined,
    })
    message.success('活动已更新')
    showEditActivity.value = false
    await loadData()
  } catch (err: any) {
    message.error(err.message)
  } finally {
    editLoading.value = false
  }
}

// --- lifecycle ---
onMounted(loadData)
</script>

<template>
  <div>
    <!-- 返回 -->
    <div class="mb-3">
      <NButton text class="text-emerald-700!" @click="router.push('/activities')">
        <template #icon><span class="i-carbon-arrow-left" /></template>
        活动列表
      </NButton>
    </div>

    <NSpin :show="loading">
      <template v-if="activity">
        <!-- 活动信息卡 -->
        <div class="info-card mb-4">
          <div class="flex-between">
            <h2 class="text-lg font-bold text-gray-800 m-0">{{ activity.name }}</h2>
            <div class="flex items-center gap-2">
              <NButton v-if="auth.isAdmin && isDraft" text type="primary" size="small" @click="openEditActivity">
                <template #icon><span class="i-carbon-edit" /></template>
              </NButton>
              <NTag :type="isSettled ? 'success' : isReversed ? 'error' : 'default'" size="small" :bordered="false">
                {{ ActivityStatus[activity.status as keyof typeof ActivityStatus] }}
              </NTag>
            </div>
          </div>
          <div class="flex items-center gap-4 mt-2 text-xs text-gray-400">
            <span>{{ activity.date }}</span>
            <span v-if="activity.location">{{ activity.location }}</span>
            <span>{{ SplitMode[activity.splitMode as keyof typeof SplitMode] }}</span>
            <span>{{ ReimburseMode[activity.reimburseMode as keyof typeof ReimburseMode] }}</span>
          </div>
          <div v-if="activity.totalCost" class="mt-3 text-center">
            <span class="text-2xl font-bold text-emerald-600">¥{{ activity.totalCost.toFixed(2) }}</span>
            <span v-if="activity.unitPrice" class="text-sm text-gray-400 ml-2">人均 ¥{{ activity.unitPrice.toFixed(2) }}</span>
          </div>
        </div>

        <!-- 参与人区块 -->
        <div class="section-card mb-4">
          <div class="flex-between mb-3">
            <h3 class="text-sm font-semibold text-gray-700 m-0">参与人 ({{ actMembers.length }})</h3>
            <NButton v-if="auth.isAdmin && isDraft" text type="primary" size="small" @click="openAddMembers">
              管理参与人
            </NButton>
          </div>
          <div v-if="actMembers.length" class="flex flex-wrap gap-2">
            <NTag v-for="m in actMembers" :key="m.memberId" size="small" round>
              {{ m.memberNickname || m.memberName }}
              <span v-if="m.hangerOnCount" class="text-gray-400"> +{{ m.hangerOnCount }}</span>
            </NTag>
          </div>
          <NEmpty v-else description="未添加参与人" size="small" />
        </div>

        <!-- 费用区块 -->
        <div class="section-card mb-4">
          <div class="flex-between mb-3">
            <h3 class="text-sm font-semibold text-gray-700 m-0">费用明细 (¥{{ totalExpense.toFixed(2) }})</h3>
            <NButton v-if="auth.isAdmin && isDraft" text type="primary" size="small" @click="showAddExpense = true">
              添加费用
            </NButton>
          </div>
          <div v-if="actExpenses.length" class="expense-list">
            <div v-for="e in actExpenses" :key="e.id" class="expense-row">
              <div class="flex-1">
                <span class="text-sm text-gray-800">
                  {{ ExpenseCategory[e.category as keyof typeof ExpenseCategory] }}
                </span>
                <span v-if="e.description" class="text-xs text-gray-400 ml-1">{{ e.description }}</span>
                <div class="text-xs text-gray-400 mt-0.5">
                  {{ e.payerName }} 垫付
                  <NTag v-if="e.isVehicleCost" size="tiny" type="info" :bordered="false" class="ml-1">车费</NTag>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="font-semibold text-sm">¥{{ e.amount.toFixed(2) }}</span>
                <NButton v-if="auth.isAdmin && isDraft" text type="error" size="tiny" @click="handleDeleteExpense(e.id)">
                  <span class="i-carbon-trash-can" />
                </NButton>
              </div>
            </div>
          </div>
          <NEmpty v-else description="暂无费用" size="small" />
        </div>

        <!-- 结算区块 -->
        <div v-if="isSettled && actSettlements.length" class="section-card mb-4">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">结算明细</h3>
          <template v-for="s in actSettlements" :key="s.id">
            <div class="settle-row">
              <NTag :type="s.type === 'collect' ? 'warning' : 'success'" size="tiny" :bordered="false" class="mr-2">
                {{ s.type === 'collect' ? '缴纳' : '报销' }}
              </NTag>
              <span class="text-sm flex-1">{{ memberNameById(s.memberId) }}</span>
              <span class="font-semibold text-sm" :class="s.type === 'collect' ? 'text-orange-500' : 'text-emerald-600'">
                {{ s.type === 'collect' ? '-' : '+' }}¥{{ s.amount.toFixed(2) }}
              </span>
            </div>
          </template>
        </div>

        <!-- 操作按钮 -->
        <div v-if="auth.isAdmin && isDraft" class="mt-4">
          <NButton
            type="primary"
            block
            :loading="settleLoading"
            :disabled="actMembers.length === 0 || actExpenses.length === 0"
            @click="handlePreviewSettle"
          >
            预览结算
          </NButton>
        </div>
        <div v-if="auth.isAdmin && isSettled" class="mt-4">
          <NButton type="error" block ghost @click="handleReverseSettle">
            冲红结算
          </NButton>
        </div>
      </template>
    </NSpin>

    <!-- 管理参与人弹窗 -->
    <NModal v-model:show="showAddMembers" title="管理参与人" preset="dialog" style="width: 90%; max-width: 400px;">
      <div class="mt-4">
        <NSelect
          v-model:value="selectedMemberIds"
          :options="memberOptions"
          multiple
          filterable
          placeholder="选择参与人"
        />
        <div v-if="selectedMemberIds.length" class="mt-3">
          <div class="text-xs text-gray-400 mb-2">参与人设置</div>
          <div class="member-hanger-list">
            <div v-for="mid in selectedMemberIds" :key="mid" class="member-hanger-row">
              <span class="text-sm flex-1 min-w-0 truncate">{{ memberOptions.find(o => o.value === mid)?.label }}</span>
              <div class="flex items-center gap-2 shrink-0">
                <NInputNumber
                  :value="hangerOnMap[mid] ?? 0"
                  @update:value="(v: number | null) => hangerOnMap[mid] = v ?? 0"
                  :min="0"
                  :max="10"
                  size="small"
                  style="width: 90px"
                  placeholder="挂靠"
                >
                  <template #prefix>+</template>
                </NInputNumber>
                <NSelect
                  v-if="isPerCar"
                  :value="vehicleIdMap[mid] ?? null"
                  @update:value="(v: number | null) => vehicleIdMap[mid] = v"
                  :options="vehicleOptions"
                  size="small"
                  placeholder="选车"
                  clearable
                  style="width: 120px"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #action>
        <NButton @click="showAddMembers = false">取消</NButton>
        <NButton type="primary" @click="handleSetMembers">确定</NButton>
      </template>
    </NModal>

    <!-- 添加费用弹窗 -->
    <NModal v-model:show="showAddExpense" title="添加费用" preset="dialog" style="width: 90%; max-width: 400px;">
      <NForm label-placement="top" size="medium" class="mt-4">
        <NFormItem label="费用类别">
          <NSelect v-model:value="expenseModel.category" :options="categoryOptions" />
        </NFormItem>
        <NFormItem label="金额">
          <NInputNumber v-model:value="expenseModel.amount" :min="0.01" :precision="2" placeholder="金额" class="w-full" />
        </NFormItem>
        <NFormItem label="垫付人">
          <NSelect v-model:value="expenseModel.payerId" :options="payerOptions" placeholder="谁先垫付的" filterable />
        </NFormItem>
        <NFormItem label="描述">
          <NInput v-model:value="expenseModel.description" placeholder="可选" />
        </NFormItem>
        <NFormItem label="是否车辆费用">
          <NSwitch v-model:value="expenseModel.isVehicleCost" />
        </NFormItem>
      </NForm>
      <template #action>
        <NButton @click="showAddExpense = false">取消</NButton>
        <NButton type="primary" :loading="expenseLoading" @click="handleAddExpense">添加</NButton>
      </template>
    </NModal>

    <!-- 结算预览弹窗 -->
    <NModal v-model:show="showSettlePreview" title="结算预览" preset="dialog" style="width: 95%; max-width: 440px;">
      <div v-if="settleResult" class="mt-4">
        <div class="settle-summary">
          <div class="settle-stat">
            <span class="text-xs text-gray-400">总费用</span>
            <span class="text-lg font-bold">¥{{ settleResult.totalCost.toFixed(2) }}</span>
          </div>
          <div class="settle-stat">
            <span class="text-xs text-gray-400">总人头</span>
            <span class="text-lg font-bold">{{ settleResult.totalHeads }}</span>
          </div>
          <div class="settle-stat">
            <span class="text-xs text-gray-400">人均</span>
            <span class="text-lg font-bold">¥{{ settleResult.sharedPerHead.toFixed(2) }}</span>
          </div>
        </div>

        <NDivider style="margin: 12px 0">每人明细</NDivider>

        <div class="settle-detail-list">
          <div v-for="p in settleResult.participants" :key="p.memberId" class="settle-detail-row">
            <span class="text-sm flex-1">{{ memberNameById(p.memberId) }}</span>
            <span class="text-xs text-gray-400 mr-2">应付 ¥{{ p.amountCharged.toFixed(2) }}</span>
            <span class="text-sm font-semibold" :class="p.netAmount > 0 ? 'text-red-500' : 'text-emerald-600'">
              {{ p.netAmount > 0 ? '补' : '退' }} ¥{{ Math.abs(p.netAmount).toFixed(2) }}
            </span>
          </div>
        </div>

        <NDivider v-if="settleResult.transfers.length" style="margin: 12px 0">结算操作</NDivider>
        <div v-for="(t, i) in settleResult.transfers" :key="i" class="settle-transfer">
          <NTag :type="t.type === 'collect' ? 'warning' : 'success'" size="tiny" :bordered="false" class="mr-2">
            {{ t.type === 'collect' ? '收款' : '报销' }}
          </NTag>
          <span class="flex-1">{{ memberNameById(t.memberId) }}</span>
          <span class="font-bold" :class="t.type === 'collect' ? 'text-orange-500' : 'text-emerald-600'">
            {{ t.type === 'collect' ? '-' : '+' }}¥{{ t.amount.toFixed(2) }}
          </span>
        </div>
      </div>
      <template #action>
        <NButton @click="showSettlePreview = false">取消</NButton>
        <NButton type="primary" @click="handleConfirmSettle">确认结算</NButton>
      </template>
    </NModal>

    <!-- 编辑活动弹窗 -->
    <NModal v-model:show="showEditActivity" title="编辑活动" preset="dialog" :mask-closable="false" style="width: 90%; max-width: 400px;">
      <NForm label-placement="top" size="medium" class="mt-4">
        <NFormItem label="活动名称">
          <NInput v-model:value="editModel.name" placeholder="例如：白云山徒步" />
        </NFormItem>
        <NFormItem label="日期">
          <NDatePicker v-model:value="editModel.date" type="date" class="w-full" placeholder="选择活动日期" />
        </NFormItem>
        <NFormItem label="地点">
          <NInput v-model:value="editModel.location" placeholder="可选" />
        </NFormItem>
        <NFormItem label="分摊模式">
          <NSelect v-model:value="editModel.splitMode" :options="splitOptions" />
        </NFormItem>
        <NFormItem label="报销模式">
          <NSelect v-model:value="editModel.reimburseMode" :options="reimburseOptions" />
        </NFormItem>
        <NFormItem label="备注">
          <NInput v-model:value="editModel.notes" type="textarea" placeholder="可选" :autosize="{ minRows: 2 }" />
        </NFormItem>
      </NForm>
      <template #action>
        <NButton @click="showEditActivity = false">取消</NButton>
        <NButton type="primary" :loading="editLoading" @click="handleEditActivity">保存</NButton>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.info-card,
.section-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.expense-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.expense-row {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #F3F4F6;
}

.expense-row:last-child {
  border-bottom: none;
}

.settle-row,
.settle-transfer {
  display: flex;
  align-items: center;
  padding: 8px 0;
}

.settle-summary {
  display: flex;
  gap: 8px;
}

.settle-stat {
  flex: 1;
  text-align: center;
  background: #F0FDF4;
  border-radius: 10px;
  padding: 10px 4px;
  display: flex;
  flex-direction: column;
}

.settle-detail-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.settle-detail-row {
  display: flex;
  align-items: center;
  padding: 6px 0;
}

.member-hanger-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.member-hanger-row {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  background: #F9FAFB;
  border-radius: 8px;
}

.cash-hint {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #FFFBEB;
  border-radius: 8px;
  font-size: 12px;
  color: #92400E;
}
</style>
