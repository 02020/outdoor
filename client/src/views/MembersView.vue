<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  NButton,
  NInput,
  NInputNumber,
  NModal,
  NForm,
  NFormItem,
  NTag,
  NEmpty,
  NSpin,
  NSelect,
  NSwitch,
  useMessage,
  useDialog,
  type FormInst,
  type FormRules,
} from 'naive-ui'
import type { MemberListItem } from '@outdoor-fund/shared'
import { GroupRole, ExperienceLevel } from '@outdoor-fund/shared'
import { useAuthStore } from '@/stores/auth'
import { fetchMembers, addMember, removeMember, topupMember } from '@/api/members'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const auth = useAuthStore()

// --- ref ---
const list = ref<MemberListItem[]>([])
const loading = ref(false)
const keyword = ref('')
const showAdd = ref(false)
const addFormRef = ref<FormInst | null>(null)
const addModel = ref({
  name: '',
  phone: '',
  nickname: '',
  outdoorTitle: '',
  hasCar: false,
  hasLicense: false,
  experienceLevel: null as string | null,
  notes: '',
})
const addLoading = ref(false)
const topupTarget = ref<MemberListItem | null>(null)
const topupAmount = ref<number | null>(null)
const topupDesc = ref('')
const topupLoading = ref(false)

// --- computed ---
const filtered = computed(() => {
  if (!keyword.value) return list.value
  const kw = keyword.value.toLowerCase()
  return list.value.filter((m) =>
    m.name.toLowerCase().includes(kw) || (m.nickname && m.nickname.toLowerCase().includes(kw)),
  )
})

const totalBalance = computed(() =>
  list.value.reduce((sum, m) => sum + m.balance, 0),
)

// --- 校验规则 ---
const addRules: FormRules = {
  name: { required: true, message: '请输入姓名', trigger: 'blur' },
}

const experienceLevelOptions = Object.entries(ExperienceLevel).map(([k, v]) => ({ label: v, value: k }))

// --- functions ---
async function loadData() {
  loading.value = true
  try {
    list.value = await fetchMembers()
  } catch (err: any) {
    message.error(err.message)
  } finally {
    loading.value = false
  }
}

async function handleAdd() {
  try {
    await addFormRef.value?.validate()
  } catch {
    return
  }
  addLoading.value = true
  try {
    await addMember({
      name: addModel.value.name.trim(),
      phone: addModel.value.phone || undefined,
      nickname: addModel.value.nickname || undefined,
      outdoorTitle: addModel.value.outdoorTitle || undefined,
      hasCar: addModel.value.hasCar || undefined,
      hasLicense: addModel.value.hasLicense || undefined,
      experienceLevel: addModel.value.experienceLevel || undefined,
      notes: addModel.value.notes || undefined,
    })
    message.success('添加成功')
    showAdd.value = false
    addModel.value = { name: '', phone: '', nickname: '', outdoorTitle: '', hasCar: false, hasLicense: false, experienceLevel: null, notes: '' }
    await loadData()
  } catch (err: any) {
    message.error(err.message)
  } finally {
    addLoading.value = false
  }
}

function openTopup(m: MemberListItem) {
  topupTarget.value = m
  topupAmount.value = null
  topupDesc.value = ''
}

async function handleTopup() {
  if (!topupTarget.value || !topupAmount.value || topupAmount.value <= 0) {
    message.warning('请输入正确的充值金额')
    return
  }
  topupLoading.value = true
  try {
    await topupMember({
      memberId: topupTarget.value.memberId,
      amount: topupAmount.value,
      description: topupDesc.value || undefined,
    })
    message.success('充值成功')
    topupTarget.value = null
    await loadData()
  } catch (err: any) {
    message.error(err.message)
  } finally {
    topupLoading.value = false
  }
}

function handleRemove(m: MemberListItem) {
  dialog.warning({
    title: '确认移除',
    content: `确定要移除会员「${m.name}」吗？余额需为 0 才能移除。`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await removeMember(m.memberId)
        message.success('已移除')
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
    <!-- 统计概览 -->
    <div class="summary-card">
      <div class="summary-item">
        <span class="summary-label">会员总数</span>
        <span class="summary-value">{{ list.length }}</span>
      </div>
      <div class="summary-divider" />
      <div class="summary-item">
        <span class="summary-label">公积金总额</span>
        <span class="summary-value text-emerald-600">¥{{ totalBalance.toFixed(2) }}</span>
      </div>
    </div>

    <!-- 搜索 + 添加 -->
    <div class="flex items-center gap-3 mb-2">
      <NInput
        v-model:value="keyword"
        placeholder="搜索会员..."
        clearable
        class="flex-1"
        size="medium"
      >
        <template #prefix>
          <span class="i-carbon-search text-gray-400" />
        </template>
      </NInput>
      <NButton v-if="auth.isAdmin" type="primary" size="medium" @click="showAdd = true">
        <template #icon><span class="i-carbon-add" /></template>
        添加
      </NButton>
    </div>

    <!-- 会员卡片列表 -->
    <NSpin :show="loading">
      <div v-if="filtered.length" class="member-list">
        <div
          v-for="m in filtered"
          :key="m.memberId"
          class="member-card"
          @click="router.push(`/members/${m.memberId}`)"
        >
          <!-- 头像 -->
          <div class="member-avatar" :class="m.role === 'admin' ? 'avatar-admin' : 'avatar-member'">
            {{ m.name.charAt(0) }}
          </div>

          <!-- 信息 -->
          <div class="member-info">
            <div class="flex items-center gap-1.5">
              <span class="font-semibold text-sm text-gray-800">{{ m.name }}</span>
              <span v-if="m.nickname" class="text-xs text-gray-400">({{ m.nickname }})</span>
              <NTag v-if="m.role === 'admin'" size="tiny" type="warning" :bordered="false">
                {{ GroupRole[m.role] }}
              </NTag>
            </div>
            <div class="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span class="text-xs text-gray-400">{{ m.activityCount }} 次活动</span>
              <NTag v-if="m.outdoorTitle" size="tiny" :bordered="false" type="info">{{ m.outdoorTitle }}</NTag>
              <NTag v-if="m.hasCar" size="tiny" :bordered="false" type="success">有车</NTag>
              <NTag v-if="m.experienceLevel" size="tiny" :bordered="false">{{ ExperienceLevel[m.experienceLevel] }}</NTag>
            </div>
          </div>

          <!-- 余额 -->
          <div class="member-balance">
            <span class="text-base font-bold" :class="m.balance >= 0 ? 'text-emerald-600' : 'text-red-500'">
              ¥{{ m.balance.toFixed(2) }}
            </span>
            <NButton
              v-if="auth.isAdmin"
              size="tiny"
              type="warning"
              secondary
              class="mt-1"
              @click.stop="openTopup(m)"
            >
              充值
            </NButton>
          </div>
        </div>
      </div>
      <NEmpty v-else description="暂无会员" class="mt-12" />
    </NSpin>

    <!-- 添加会员弹窗 -->
    <NModal v-model:show="showAdd" title="添加会员" preset="dialog" :mask-closable="false" style="width: 90%; max-width: 400px;">
      <NForm ref="addFormRef" :model="addModel" :rules="addRules" label-placement="top" class="mt-4">
        <NFormItem label="姓名" path="name">
          <NInput v-model:value="addModel.name" placeholder="请输入姓名" />
        </NFormItem>
        <NFormItem label="昵称/花名">
          <NInput v-model:value="addModel.nickname" placeholder="可选" />
        </NFormItem>
        <NFormItem label="手机号">
          <NInput v-model:value="addModel.phone" placeholder="可选" />
        </NFormItem>
        <NFormItem label="户外称号">
          <NInput v-model:value="addModel.outdoorTitle" placeholder="如：领队、老驴友" />
        </NFormItem>
        <NFormItem label="户外经验">
          <NSelect v-model:value="addModel.experienceLevel" :options="experienceLevelOptions" placeholder="选择经验等级" clearable />
        </NFormItem>
        <div class="flex gap-6 mb-4">
          <NFormItem label="有车" label-placement="left" :show-feedback="false">
            <NSwitch v-model:value="addModel.hasCar" />
          </NFormItem>
          <NFormItem label="有驾照" label-placement="left" :show-feedback="false">
            <NSwitch v-model:value="addModel.hasLicense" />
          </NFormItem>
        </div>
        <NFormItem label="备注">
          <NInput v-model:value="addModel.notes" type="textarea" placeholder="可选" :autosize="{ minRows: 2 }" />
        </NFormItem>
      </NForm>
      <template #action>
        <NButton @click="showAdd = false">取消</NButton>
        <NButton type="primary" :loading="addLoading" @click="handleAdd">确定</NButton>
      </template>
    </NModal>

    <!-- 充值弹窗 -->
    <NModal
      :show="!!topupTarget"
      title="会员充值"
      preset="dialog"
      :mask-closable="false"
      @close="topupTarget = null"
    >
      <NForm label-placement="top" class="mt-4">
        <NFormItem label="会员">
          <NInput :value="topupTarget?.name" disabled />
        </NFormItem>
        <NFormItem label="充值金额">
          <NInputNumber
            v-model:value="topupAmount"
            placeholder="请输入金额"
            :min="0.01"
            :precision="2"
            class="w-full"
          />
        </NFormItem>
        <NFormItem label="备注">
          <NInput v-model:value="topupDesc" placeholder="可选" />
        </NFormItem>
      </NForm>
      <template #action>
        <NButton @click="topupTarget = null">取消</NButton>
        <NButton type="primary" :loading="topupLoading" @click="handleTopup">确认充值</NButton>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.summary-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 16px;
  padding: 10px 16px;
  margin-bottom: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.summary-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.summary-label {
  font-size: 12px;
  color: #9CA3AF;
}

.summary-value {
  font-size: 18px;
  font-weight: 700;
  margin-top: 2px;
  color: #1F2937;
}

.summary-divider {
  width: 1px;
  height: 36px;
  background: #E5E7EB;
  margin: 0 12px;
}

.member-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.member-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border-radius: 14px;
  padding: 10px 12px;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.member-card:active {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.member-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.avatar-admin {
  background: linear-gradient(135deg, #F59E0B, #D97706);
}

.avatar-member {
  background: linear-gradient(135deg, #10B981, #059669);
}

.member-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.member-balance {
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
}
</style>
