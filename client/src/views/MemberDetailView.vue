<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NButton,
  NTag,
  NSpin,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSwitch,
  NEmpty,
  useMessage,
  useDialog,
  type FormInst,
  type FormRules,
} from 'naive-ui'
import { GroupRole, ExperienceLevel, TransactionType } from '@outdoor-fund/shared'
import { useAuthStore } from '@/stores/auth'
import { fetchMember, updateMember, updateMemberRole } from '@/api/members'
import { fetchTransactions, type TransactionItem } from '@/api/stats'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const auth = useAuthStore()

const memberId = Number(route.params.id)

// --- ref ---
const member = ref<{
  memberId: number
  name: string
  nickname: string | null
  avatarUrl: string | null
  phone: string | null
  outdoorTitle: string | null
  hasCar: boolean
  hasLicense: boolean
  experienceLevel: string | null
  notes: string | null
  balance: number
  role: string
  joinedAt: number
} | null>(null)
const loading = ref(false)
const txList = ref<TransactionItem[]>([])

// --- edit ---
const showEdit = ref(false)
const editFormRef = ref<FormInst | null>(null)
const editModel = ref({
  name: '',
  nickname: '',
  phone: '',
  outdoorTitle: '',
  hasCar: false,
  hasLicense: false,
  experienceLevel: null as string | null,
  notes: '',
})
const editLoading = ref(false)

const editRules: FormRules = {
  name: { required: true, message: '姓名不能为空', trigger: 'blur' },
}

const experienceLevelOptions = Object.entries(ExperienceLevel).map(([k, v]) => ({ label: v, value: k }))

// --- functions ---
async function loadData() {
  loading.value = true
  try {
    const [m, txs] = await Promise.all([
      fetchMember(memberId),
      fetchTransactions(memberId),
    ])
    member.value = m
    txList.value = txs
  } catch (err: any) {
    message.error(err.message)
  } finally {
    loading.value = false
  }
}

function openEdit() {
  if (!member.value) return
  editModel.value = {
    name: member.value.name,
    nickname: member.value.nickname ?? '',
    phone: member.value.phone ?? '',
    outdoorTitle: member.value.outdoorTitle ?? '',
    hasCar: member.value.hasCar,
    hasLicense: member.value.hasLicense,
    experienceLevel: member.value.experienceLevel,
    notes: member.value.notes ?? '',
  }
  showEdit.value = true
}

async function handleEdit() {
  try {
    await editFormRef.value?.validate()
  } catch { return }
  editLoading.value = true
  try {
    await updateMember(memberId, {
      name: editModel.value.name.trim(),
      nickname: editModel.value.nickname.trim() || null,
      phone: editModel.value.phone.trim() || null,
      outdoorTitle: editModel.value.outdoorTitle.trim() || null,
      hasCar: editModel.value.hasCar,
      hasLicense: editModel.value.hasLicense,
      experienceLevel: editModel.value.experienceLevel,
      notes: editModel.value.notes.trim() || null,
    })
    message.success('会员信息已更新')
    showEdit.value = false
    await loadData()
  } catch (err: any) {
    message.error(err.message)
  } finally {
    editLoading.value = false
  }
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function formatDateTime(ts: number) {
  const d = new Date(ts)
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + ' ' +
    d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function txTypeLabel(type: string) {
  return TransactionType[type as keyof typeof TransactionType] ?? type
}

function handleToggleRole() {
  if (!member.value) return
  const newRole = member.value.role === 'admin' ? 'member' : 'admin'
  const label = newRole === 'admin' ? '提升为管理员' : '降为普通会员'
  dialog.warning({
    title: '确认操作',
    content: `确定将「${member.value.name}」${label}吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await updateMemberRole(memberId, newRole)
        message.success('角色已更新')
        await loadData()
      } catch (err: any) {
        message.error(err.message)
      }
    },
  })
}

// --- lifecycle ---
onMounted(loadData)
</script>

<template>
  <div>
    <!-- 返回 -->
    <div class="mb-3">
      <NButton text class="text-emerald-700!" @click="router.back()">
        <template #icon><span class="i-carbon-arrow-left" /></template>
        返回
      </NButton>
    </div>

    <NSpin :show="loading">
      <div v-if="member" class="detail-page">
        <!-- 头部卡片 -->
        <div class="profile-card">
          <div class="flex justify-end" v-if="auth.isAdmin">
            <NButton text type="primary" size="small" @click="openEdit">
              <template #icon><span class="i-carbon-edit" /></template>
              编辑
            </NButton>
          </div>
          <div class="profile-avatar" :class="member.role === 'admin' ? 'avatar-admin' : 'avatar-member'">
            {{ member.name.charAt(0) }}
          </div>
          <h2 class="text-lg font-bold text-gray-800 mt-3 mb-0.5">{{ member.name }}</h2>
          <span v-if="member.nickname" class="text-sm text-gray-400">{{ member.nickname }}</span>
          <div class="flex items-center justify-center gap-2 mt-2">
            <NTag :type="member.role === 'admin' ? 'warning' : 'success'" size="small" :bordered="false">
              {{ GroupRole[member.role as keyof typeof GroupRole] }}
            </NTag>
            <NTag v-if="member.outdoorTitle" size="small" type="info" :bordered="false">{{ member.outdoorTitle }}</NTag>
            <NTag v-if="member.experienceLevel" size="small" :bordered="false">
              {{ ExperienceLevel[member.experienceLevel as keyof typeof ExperienceLevel] }}
            </NTag>
          </div>
          <div class="balance-display">
            <span class="balance-label">当前余额</span>
            <span class="balance-amount" :class="member.balance >= 0 ? 'text-emerald-600' : 'text-red-500'">
              ¥{{ member.balance.toFixed(2) }}
            </span>
          </div>
        </div>

        <!-- 基本信息 -->
        <div class="info-card">
          <div class="info-row">
            <span class="info-label">手机号</span>
            <span class="info-value">{{ member.phone || '未填写' }}</span>
          </div>
          <div class="info-divider" />
          <div class="info-row">
            <span class="info-label">有车</span>
            <span class="info-value">{{ member.hasCar ? '是' : '否' }}</span>
          </div>
          <div class="info-divider" />
          <div class="info-row">
            <span class="info-label">有驾照</span>
            <span class="info-value">{{ member.hasLicense ? '是' : '否' }}</span>
          </div>
          <div class="info-divider" />
          <div class="info-row">
            <span class="info-label">加入时间</span>
            <span class="info-value">{{ formatDate(member.joinedAt) }}</span>
          </div>
          <template v-if="member.notes">
            <div class="info-divider" />
            <div class="info-row">
              <span class="info-label">备注</span>
              <span class="info-value text-right max-w-60%">{{ member.notes }}</span>
            </div>
          </template>
          <template v-if="auth.isAdmin">
            <div class="info-divider" />
            <div class="info-row">
              <span class="info-label">角色管理</span>
              <NButton text type="primary" size="small" @click="handleToggleRole">
                {{ member.role === 'admin' ? '降为会员' : '提升为管理员' }}
              </NButton>
            </div>
          </template>
        </div>

        <!-- 交易流水 -->
        <div class="info-card">
          <h3 class="text-sm font-semibold text-gray-700 mb-3 m-0">资金流水</h3>
          <div v-if="txList.length" class="tx-list">
            <div v-for="tx in txList" :key="tx.id" class="tx-row">
              <div class="flex-1">
                <div class="flex items-center gap-1.5">
                  <NTag
                    :type="tx.type === 'topup' ? 'success' : tx.type === 'debit' ? 'warning' : 'default'"
                    size="tiny"
                    :bordered="false"
                  >
                    {{ txTypeLabel(tx.type) }}
                  </NTag>
                  <span v-if="tx.description" class="text-xs text-gray-500">{{ tx.description }}</span>
                </div>
                <div class="text-xs text-gray-400 mt-0.5">{{ formatDateTime(tx.createdAt) }}</div>
              </div>
              <div class="text-right">
                <span
                  class="text-sm font-semibold"
                  :class="tx.amount >= 0 ? 'text-emerald-600' : 'text-red-500'"
                >
                  {{ tx.amount >= 0 ? '+' : '' }}¥{{ tx.amount.toFixed(2) }}
                </span>
                <div class="text-xs text-gray-400">余额 ¥{{ tx.balanceAfter.toFixed(2) }}</div>
              </div>
            </div>
          </div>
          <NEmpty v-else description="暂无流水" size="small" />
        </div>
      </div>
    </NSpin>

    <!-- 编辑会员弹窗 -->
    <NModal v-model:show="showEdit" title="编辑会员" preset="dialog" :mask-closable="false" style="width: 90%; max-width: 400px;">
      <NForm ref="editFormRef" :model="editModel" :rules="editRules" label-placement="top" class="mt-4">
        <NFormItem label="姓名" path="name">
          <NInput v-model:value="editModel.name" placeholder="请输入姓名" />
        </NFormItem>
        <NFormItem label="昵称/花名">
          <NInput v-model:value="editModel.nickname" placeholder="可选" />
        </NFormItem>
        <NFormItem label="手机号">
          <NInput v-model:value="editModel.phone" placeholder="可选" />
        </NFormItem>
        <NFormItem label="户外称号">
          <NInput v-model:value="editModel.outdoorTitle" placeholder="如：领队、老驴友" />
        </NFormItem>
        <NFormItem label="户外经验">
          <NSelect v-model:value="editModel.experienceLevel" :options="experienceLevelOptions" placeholder="选择经验等级" clearable />
        </NFormItem>
        <div class="flex gap-6 mb-4">
          <NFormItem label="有车" label-placement="left" :show-feedback="false">
            <NSwitch v-model:value="editModel.hasCar" />
          </NFormItem>
          <NFormItem label="有驾照" label-placement="left" :show-feedback="false">
            <NSwitch v-model:value="editModel.hasLicense" />
          </NFormItem>
        </div>
        <NFormItem label="备注">
          <NInput v-model:value="editModel.notes" type="textarea" placeholder="可选" :autosize="{ minRows: 2 }" />
        </NFormItem>
      </NForm>
      <template #action>
        <NButton @click="showEdit = false">取消</NButton>
        <NButton type="primary" :loading="editLoading" @click="handleEdit">保存</NButton>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.detail-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.profile-card {
  background: #fff;
  border-radius: 20px;
  padding: 16px 20px 28px;
  text-align: center;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.05);
}

.profile-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  color: #fff;
}

.avatar-admin {
  background: linear-gradient(135deg, #F59E0B, #D97706);
}

.avatar-member {
  background: linear-gradient(135deg, #10B981, #059669);
}

.balance-display {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.balance-label {
  font-size: 12px;
  color: #9CA3AF;
}

.balance-amount {
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.5px;
  margin-top: 2px;
}

.info-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
}

.info-label {
  font-size: 14px;
  color: #6B7280;
}

.info-value {
  font-size: 14px;
  color: #1F2937;
  font-weight: 500;
}

.info-divider {
  height: 1px;
  background: #F3F4F6;
}

.tx-list {
  display: flex;
  flex-direction: column;
}

.tx-row {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #F3F4F6;
}

.tx-row:last-child {
  border-bottom: none;
}
</style>
