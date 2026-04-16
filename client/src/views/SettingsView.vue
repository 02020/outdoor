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
  NSelect,
  NEmpty,
  NTag,
  NSpin,
  useMessage,
  useDialog,
  type FormInst,
  type FormRules,
  type SelectOption,
} from 'naive-ui'
import { useAuthStore } from '@/stores/auth'
import { request } from '@/utils/http'
import { fetchMembers } from '@/api/members'
import { fetchVehicles, createVehicle, updateVehicle, deleteVehicle, type VehicleItem } from '@/api/vehicles'
import { importExcel, type ImportResult } from '@/api/import'
import type { MemberListItem } from '@outdoor-fund/shared'

const router = useRouter()
const message = useMessage()
const auth = useAuthStore()

// --- group info ---
const loading = ref(false)
const groupInfo = ref<{
  id: number
  name: string
  description: string | null
  createdAt: number
  updatedAt: number
} | null>(null)

// --- edit group ---
const showEdit = ref(false)
const editFormRef = ref<FormInst | null>(null)
const editModel = ref({ name: '', description: '' })
const editLoading = ref(false)

const editRules: FormRules = {
  name: { required: true, message: '群组名称不能为空', trigger: 'blur' },
}

// --- change password ---
const showChangePwd = ref(false)
const pwdFormRef = ref<FormInst | null>(null)
const pwdModel = ref({ adminPassword: '', memberPassword: '' })
const pwdLoading = ref(false)

const pwdRules: FormRules = {
  adminPassword: { min: 4, message: '至少4位', trigger: 'blur' },
  memberPassword: { min: 4, message: '至少4位', trigger: 'blur' },
}

// --- vehicles ---
const vehicleList = ref<VehicleItem[]>([])
const allMembers = ref<MemberListItem[]>([])
const showAddVehicle = ref(false)
const showEditVehicle = ref(false)
const vehicleModel = ref({ plateNumber: '', model: '', ownerId: null as number | null })
const editVehicleId = ref<number | null>(null)
const vehicleLoading = ref(false)
const dialog = useDialog()

// --- 数据导入 ---
const importLoading = ref(false)
const importResult = ref<ImportResult | null>(null)
const showImportResult = ref(false)

async function handleImportClick() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.xlsx,.xls'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    importLoading.value = true
    try {
      const result = await importExcel(file)
      importResult.value = result
      showImportResult.value = true
      message.success(result.message)
      await loadData()
    } catch (err: any) {
      message.error(err.message || '导入失败')
    } finally {
      importLoading.value = false
    }
  }
  input.click()
}

const ownerOptions = computed<SelectOption[]>(() =>
  allMembers.value.map((m) => ({
    label: m.nickname ? `${m.name} (${m.nickname})` : m.name,
    value: m.memberId,
  })),
)

// --- functions ---
async function loadData() {
  loading.value = true
  try {
    const [gi, vl, ml] = await Promise.all([
      request<any>({ url: '/groups/current' }),
      fetchVehicles(),
      fetchMembers(),
    ])
    groupInfo.value = gi
    vehicleList.value = vl
    allMembers.value = ml
  } catch (err: any) {
    message.error(err.message)
  } finally {
    loading.value = false
  }
}

function openEdit() {
  if (!groupInfo.value) return
  editModel.value = {
    name: groupInfo.value.name,
    description: groupInfo.value.description ?? '',
  }
  showEdit.value = true
}

async function handleEdit() {
  try {
    await editFormRef.value?.validate()
  } catch { return }
  editLoading.value = true
  try {
    await request({
      method: 'PUT',
      url: '/groups/current',
      data: {
        name: editModel.value.name.trim(),
        description: editModel.value.description.trim() || undefined,
      },
    })
    message.success('群组信息已更新')
    showEdit.value = false
    auth.setGroupName(editModel.value.name.trim())
    await loadData()
  } catch (err: any) {
    message.error(err.message)
  } finally {
    editLoading.value = false
  }
}

async function handleChangePwd() {
  try {
    await pwdFormRef.value?.validate()
  } catch { return }
  if (!pwdModel.value.adminPassword && !pwdModel.value.memberPassword) {
    message.warning('请至少填写一个密码')
    return
  }
  pwdLoading.value = true
  try {
    const data: Record<string, string> = {}
    if (pwdModel.value.adminPassword) data.adminPassword = pwdModel.value.adminPassword
    if (pwdModel.value.memberPassword) data.memberPassword = pwdModel.value.memberPassword
    await request({ method: 'PUT', url: '/groups/current', data })
    message.success('密码已更新')
    showChangePwd.value = false
    pwdModel.value = { adminPassword: '', memberPassword: '' }
  } catch (err: any) {
    message.error(err.message)
  } finally {
    pwdLoading.value = false
  }
}

// --- vehicle handlers ---
function openAddVehicle() {
  vehicleModel.value = { plateNumber: '', model: '', ownerId: null }
  showAddVehicle.value = true
}

function openEditVehicle(v: VehicleItem) {
  editVehicleId.value = v.id
  vehicleModel.value = {
    plateNumber: v.plateNumber,
    model: v.model ?? '',
    ownerId: v.ownerId,
  }
  showEditVehicle.value = true
}

async function handleAddVehicle() {
  if (!vehicleModel.value.plateNumber.trim()) {
    message.warning('请填写车牌号')
    return
  }
  vehicleLoading.value = true
  try {
    await createVehicle({
      plateNumber: vehicleModel.value.plateNumber.trim(),
      model: vehicleModel.value.model.trim() || undefined,
      ownerId: vehicleModel.value.ownerId ?? undefined,
    })
    message.success('车辆添加成功')
    showAddVehicle.value = false
    await loadData()
  } catch (err: any) {
    message.error(err.message)
  } finally {
    vehicleLoading.value = false
  }
}

async function handleEditVehicle() {
  if (!editVehicleId.value || !vehicleModel.value.plateNumber.trim()) {
    message.warning('请填写车牌号')
    return
  }
  vehicleLoading.value = true
  try {
    await updateVehicle(editVehicleId.value, {
      plateNumber: vehicleModel.value.plateNumber.trim(),
      model: vehicleModel.value.model.trim() || null,
      ownerId: vehicleModel.value.ownerId,
    })
    message.success('车辆已更新')
    showEditVehicle.value = false
    await loadData()
  } catch (err: any) {
    message.error(err.message)
  } finally {
    vehicleLoading.value = false
  }
}

function handleDeleteVehicle(v: VehicleItem) {
  dialog.warning({
    title: '删除车辆',
    content: `确定要删除 ${v.plateNumber} 吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteVehicle(v.id)
        message.success('车辆已删除')
        await loadData()
      } catch (err: any) {
        message.error(err.message)
      }
    },
  })
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

onMounted(loadData)
</script>

<template>
  <div>
    <NSpin :show="loading">
      <template v-if="groupInfo">
        <!-- 群组信息 -->
        <div class="info-card">
          <div class="flex-between mb-3">
            <h3 class="text-base font-semibold text-gray-800 m-0">群组信息</h3>
            <NButton v-if="auth.isAdmin" text type="primary" size="small" @click="openEdit">编辑</NButton>
          </div>
          <div class="info-row">
            <span class="info-label">群组名称</span>
            <span class="info-value">{{ groupInfo.name }}</span>
          </div>
          <div class="info-divider" />
          <div class="info-row">
            <span class="info-label">简介</span>
            <span class="info-value">{{ groupInfo.description || '未填写' }}</span>
          </div>
          <div class="info-divider" />
          <div class="info-row">
            <span class="info-label">创建时间</span>
            <span class="info-value">{{ formatDate(groupInfo.createdAt) }}</span>
          </div>
        </div>

        <!-- 账号安全 -->
        <div v-if="auth.isAdmin" class="info-card mt-4">
          <h3 class="text-base font-semibold text-gray-800 mb-3 m-0">账号安全</h3>
          <div class="action-row" @click="showChangePwd = true">
            <span class="text-sm text-gray-700">修改密码</span>
            <span class="i-carbon-chevron-right text-gray-400" />
          </div>
        </div>

        <!-- 车辆管理 -->
        <div class="info-card mt-4">
          <div class="flex-between mb-3">
            <h3 class="text-base font-semibold text-gray-800 m-0">车辆管理 ({{ vehicleList.length }})</h3>
            <NButton v-if="auth.isAdmin" text type="primary" size="small" @click="openAddVehicle">添加车辆</NButton>
          </div>
          <div v-if="vehicleList.length">
            <div v-for="(v, idx) in vehicleList" :key="v.id">
              <div v-if="idx > 0" class="info-divider" />
              <div class="vehicle-row">
                <div class="flex-1">
                  <div class="text-sm font-medium text-gray-800">{{ v.plateNumber }}</div>
                  <div class="text-xs text-gray-400 mt-0.5">
                    <span v-if="v.model">{{ v.model }}</span>
                    <span v-if="v.ownerName" class="ml-2">车主: {{ v.ownerName }}</span>
                    <span v-if="!v.model && !v.ownerName">未设置详情</span>
                  </div>
                </div>
                <div v-if="auth.isAdmin" class="flex items-center gap-1">
                  <NButton text type="primary" size="tiny" @click="openEditVehicle(v)">
                    <span class="i-carbon-edit" />
                  </NButton>
                  <NButton text type="error" size="tiny" @click="handleDeleteVehicle(v)">
                    <span class="i-carbon-trash-can" />
                  </NButton>
                </div>
              </div>
            </div>
          </div>
          <NEmpty v-else description="暂无车辆" size="small" />
        </div>

        <!-- 路线管理 -->
        <div class="info-card mt-4">
          <h3 class="text-base font-semibold text-gray-800 mb-3 m-0">路线管理</h3>
          <div class="action-row" @click="$router.push('/routes')">
            <span class="text-sm text-gray-700">管理户外路线</span>
            <span class="i-carbon-chevron-right text-gray-400" />
          </div>
        </div>

        <!-- 审计日志 -->
        <div v-if="auth.isAdmin" class="info-card mt-4">
          <h3 class="text-base font-semibold text-gray-800 mb-3 m-0">审计日志</h3>
          <div class="action-row" @click="$router.push('/audit-logs')">
            <span class="text-sm text-gray-700">查看操作记录</span>
            <span class="i-carbon-chevron-right text-gray-400" />
          </div>
        </div>

        <!-- 数据导入 -->
        <div v-if="auth.isAdmin" class="info-card mt-4">
          <h3 class="text-base font-semibold text-gray-800 mb-3 m-0">数据导入</h3>
          <p class="text-xs text-gray-400 mb-3 m-0">上传 Excel 文件批量导入路线和成员数据，需包含"路线"和/或"成员"工作表</p>
          <NButton type="primary" secondary :loading="importLoading" @click="handleImportClick">
            <template #icon><span class="i-carbon-upload" /></template>
            选择 Excel 文件导入
          </NButton>
        </div>

        <!-- 当前登录 -->
        <div class="info-card mt-4">
          <h3 class="text-base font-semibold text-gray-800 mb-3 m-0">当前登录</h3>
          <div class="info-row">
            <span class="info-label">群组</span>
            <span class="info-value">{{ auth.groupName }}</span>
          </div>
          <div class="info-divider" />
          <div class="info-row">
            <span class="info-label">角色</span>
            <span class="info-value">{{ auth.isAdmin ? '管理员' : '会员' }}</span>
          </div>
        </div>

        <!-- 退出按钮 -->
        <NButton type="error" block secondary class="mt-6" @click="handleLogout">
          退出登录
        </NButton>
      </template>
    </NSpin>

    <!-- 编辑群组弹窗 -->
    <NModal v-model:show="showEdit" title="编辑群组" preset="dialog" :mask-closable="false" style="width: 90%; max-width: 400px;">
      <NForm ref="editFormRef" :model="editModel" :rules="editRules" label-placement="top" size="medium" class="mt-4">
        <NFormItem label="群组名称" path="name">
          <NInput v-model:value="editModel.name" placeholder="请输入群组名称" />
        </NFormItem>
        <NFormItem label="简介">
          <NInput v-model:value="editModel.description" type="textarea" placeholder="可选" :autosize="{ minRows: 2 }" />
        </NFormItem>
      </NForm>
      <template #action>
        <NButton @click="showEdit = false">取消</NButton>
        <NButton type="primary" :loading="editLoading" @click="handleEdit">保存</NButton>
      </template>
    </NModal>

    <!-- 修改密码弹窗 -->
    <NModal v-model:show="showChangePwd" title="修改密码" preset="dialog" :mask-closable="false" style="width: 90%; max-width: 400px;">
      <NForm ref="pwdFormRef" :model="pwdModel" :rules="pwdRules" label-placement="top" size="medium" class="mt-4">
        <NFormItem label="新管理员密码" path="adminPassword">
          <NInput v-model:value="pwdModel.adminPassword" type="password" placeholder="不修改则留空" show-password-on="click" />
        </NFormItem>
        <NFormItem label="新会员密码" path="memberPassword">
          <NInput v-model:value="pwdModel.memberPassword" type="password" placeholder="不修改则留空" show-password-on="click" />
        </NFormItem>
      </NForm>
      <template #action>
        <NButton @click="showChangePwd = false">取消</NButton>
        <NButton type="primary" :loading="pwdLoading" @click="handleChangePwd">确认修改</NButton>
      </template>
    </NModal>

    <!-- 添加车辆弹窗 -->
    <NModal v-model:show="showAddVehicle" title="添加车辆" preset="dialog" :mask-closable="false" style="width: 90%; max-width: 400px;">
      <NForm label-placement="top" size="medium" class="mt-4">
        <NFormItem label="车牌号">
          <NInput v-model:value="vehicleModel.plateNumber" placeholder="例如：粤A12345" />
        </NFormItem>
        <NFormItem label="车型">
          <NInput v-model:value="vehicleModel.model" placeholder="可选，例如：丰田RAV4" />
        </NFormItem>
        <NFormItem label="车主">
          <NSelect v-model:value="vehicleModel.ownerId" :options="ownerOptions" placeholder="选择车主" filterable clearable />
        </NFormItem>
      </NForm>
      <template #action>
        <NButton @click="showAddVehicle = false">取消</NButton>
        <NButton type="primary" :loading="vehicleLoading" @click="handleAddVehicle">添加</NButton>
      </template>
    </NModal>

    <!-- 编辑车辆弹窗 -->
    <NModal v-model:show="showEditVehicle" title="编辑车辆" preset="dialog" :mask-closable="false" style="width: 90%; max-width: 400px;">
      <NForm label-placement="top" size="medium" class="mt-4">
        <NFormItem label="车牌号">
          <NInput v-model:value="vehicleModel.plateNumber" placeholder="例如：粤A12345" />
        </NFormItem>
        <NFormItem label="车型">
          <NInput v-model:value="vehicleModel.model" placeholder="可选，例如：丰田RAV4" />
        </NFormItem>
        <NFormItem label="车主">
          <NSelect v-model:value="vehicleModel.ownerId" :options="ownerOptions" placeholder="选择车主" filterable clearable />
        </NFormItem>
      </NForm>
      <template #action>
        <NButton @click="showEditVehicle = false">取消</NButton>
        <NButton type="primary" :loading="vehicleLoading" @click="handleEditVehicle">保存</NButton>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
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
  padding: 12px 0;
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

.action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  cursor: pointer;
}

.vehicle-row {
  display: flex;
  align-items: center;
  padding: 10px 0;
}

.import-section {
  background: #F9FAFB;
  border-radius: 8px;
  padding: 12px;
}
</style>
