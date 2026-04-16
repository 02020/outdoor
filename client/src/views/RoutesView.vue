<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  NButton,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NRate,
  NSwitch,
  NEmpty,
  NSpin,
  useMessage,
  useDialog,
} from 'naive-ui'
import { useAuthStore } from '@/stores/auth'
import { fetchRoutes, createRoute, updateRoute, deleteRoute, type RouteItem } from '@/api/routes'

const message = useMessage()
const dialog = useDialog()
const auth = useAuthStore()

const loading = ref(false)
const routeList = ref<RouteItem[]>([])

const regionOptions = [
  { label: '福州', value: '350100' },
  { label: '厦门', value: '350200' },
  { label: '莆田', value: '350300' },
  { label: '三明', value: '350400' },
  { label: '泉州', value: '350500' },
  { label: '漳州', value: '350600' },
  { label: '南平', value: '350700' },
  { label: '龙岩', value: '350800' },
  { label: '宁德', value: '350900' },
]

const routeTypeOptions = [
  { label: '登山', value: 'hiking' },
  { label: '穿越', value: 'traverse' },
  { label: '溯溪', value: 'canyoning' },
  { label: '露营', value: 'camping' },
  { label: '骑行', value: 'cycling' },
]

function emptyForm() {
  return {
    name: '',
    description: '',
    regionCode: null as string | null,
    routeType: null as string | null,
    difficulty: undefined as number | undefined,
    altitudeM: null as number | null,
    elevationGainM: null as number | null,
    distanceKm: null as number | null,
    estimatedTimeMin: null as number | null,
    driveDistanceKm: null as number | null,
    driveTimeMin: null as number | null,
    bestSeason: '',
    sceneryTags: '',
    hasWaterSource: false,
    hasCellSignal: false,
    trackRef: '',
    parkingInfo: '',
    notes: '',
  }
}

// 添加/编辑路线
const showForm = ref(false)
const formTitle = ref('添加路线')
const editId = ref<number | null>(null)
const formLoading = ref(false)
const formModel = ref(emptyForm())

async function loadData() {
  loading.value = true
  try {
    routeList.value = await fetchRoutes()
  } catch (err: any) {
    message.error(err.message)
  } finally {
    loading.value = false
  }
}

function openAdd() {
  editId.value = null
  formTitle.value = '添加路线'
  formModel.value = emptyForm()
  showForm.value = true
}

function openEdit(r: RouteItem) {
  editId.value = r.id
  formTitle.value = '编辑路线'
  formModel.value = {
    ...emptyForm(),
    name: r.name,
    description: r.description ?? '',
    altitudeM: r.altitudeM,
    elevationGainM: r.elevationGainM,
    distanceKm: r.distanceKm,
    driveDistanceKm: r.driveDistanceKm,
    driveTimeMin: r.driveTimeMin,
  }
  showForm.value = true
}

async function handleSubmit() {
  if (!formModel.value.name.trim()) {
    message.warning('请填写路线名称')
    return
  }
  formLoading.value = true
  try {
    const f = formModel.value
    const data: Record<string, unknown> = {
      name: f.name.trim(),
      description: f.description.trim() || undefined,
      regionCode: f.regionCode || undefined,
      routeType: f.routeType || undefined,
      difficulty: f.difficulty ?? undefined,
      altitudeM: f.altitudeM ?? undefined,
      elevationGainM: f.elevationGainM ?? undefined,
      distanceKm: f.distanceKm ?? undefined,
      estimatedTimeMin: f.estimatedTimeMin ?? undefined,
      driveDistanceKm: f.driveDistanceKm ?? undefined,
      driveTimeMin: f.driveTimeMin ?? undefined,
      bestSeason: f.bestSeason.trim() || undefined,
      sceneryTags: f.sceneryTags.trim() ? f.sceneryTags.trim().split(/[、,，\s]+/).filter(Boolean) : undefined,
      hasWaterSource: f.hasWaterSource || undefined,
      hasCellSignal: f.hasCellSignal || undefined,
      trackRef: f.trackRef.trim() || undefined,
      parkingInfo: f.parkingInfo.trim() || undefined,
      notes: f.notes.trim() || undefined,
    }
    if (editId.value) {
      await updateRoute(editId.value, data)
      message.success('路线已更新')
    } else {
      await createRoute(data as any)
      message.success('路线添加成功')
    }
    showForm.value = false
    await loadData()
  } catch (err: any) {
    message.error(err.message)
  } finally {
    formLoading.value = false
  }
}

function handleDelete(r: RouteItem) {
  dialog.warning({
    title: '删除路线',
    content: `确定要删除「${r.name}」吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteRoute(r.id)
        message.success('路线已删除')
        await loadData()
      } catch (err: any) {
        message.error(err.message)
      }
    },
  })
}

onMounted(loadData)
</script>

<template>
  <div>
    <div class="flex-between mb-3">
      <h2 class="text-lg font-bold text-gray-800 m-0">路线管理</h2>
      <NButton v-if="auth.isAdmin" type="primary" size="small" @click="openAdd">添加路线</NButton>
    </div>

    <NSpin :show="loading">
      <div v-if="routeList.length" class="route-list">
        <div v-for="r in routeList" :key="r.id" class="route-card">
          <div class="flex-between">
            <h3 class="text-base font-semibold text-gray-800 m-0">{{ r.name }}</h3>
            <div v-if="auth.isAdmin" class="flex items-center gap-1">
              <NButton text type="primary" size="tiny" @click="openEdit(r)">
                <span class="i-carbon-edit" />
              </NButton>
              <NButton text type="error" size="tiny" @click="handleDelete(r)">
                <span class="i-carbon-trash-can" />
              </NButton>
            </div>
          </div>
          <p v-if="r.description" class="text-xs text-gray-400 mt-1 mb-2">{{ r.description }}</p>
          <div class="route-stats">
            <span v-if="r.altitudeM" class="route-stat">
              <span class="text-gray-400">海拔</span>
              <span>{{ r.altitudeM }}m</span>
            </span>
            <span v-if="r.elevationGainM" class="route-stat">
              <span class="text-gray-400">爬升</span>
              <span>{{ r.elevationGainM }}m</span>
            </span>
            <span v-if="r.distanceKm" class="route-stat">
              <span class="text-gray-400">距离</span>
              <span>{{ r.distanceKm }}km</span>
            </span>
            <span v-if="r.driveDistanceKm" class="route-stat">
              <span class="text-gray-400">车程</span>
              <span>{{ r.driveDistanceKm }}km</span>
            </span>
            <span v-if="r.driveTimeMin" class="route-stat">
              <span class="text-gray-400">车时</span>
              <span>{{ r.driveTimeMin }}min</span>
            </span>
          </div>
        </div>
      </div>
      <NEmpty v-else description="暂无路线" />
    </NSpin>

    <!-- 添加/编辑路线弹窗 -->
    <NModal v-model:show="showForm" :title="formTitle" preset="dialog" :mask-closable="false" style="width: 90%; max-width: 480px;">
      <NForm label-placement="top" size="medium" class="mt-4">
        <NFormItem label="路线名称">
          <NInput v-model:value="formModel.name" placeholder="例如：白云山主线" />
        </NFormItem>
        <NFormItem label="描述">
          <NInput v-model:value="formModel.description" type="textarea" placeholder="可选" :autosize="{ minRows: 2 }" />
        </NFormItem>
        <div class="flex gap-3">
          <NFormItem label="所属区域" class="flex-1">
            <NSelect v-model:value="formModel.regionCode" :options="regionOptions" placeholder="选择区域" clearable />
          </NFormItem>
          <NFormItem label="路线类型" class="flex-1">
            <NSelect v-model:value="formModel.routeType" :options="routeTypeOptions" placeholder="选择类型" clearable />
          </NFormItem>
        </div>
        <NFormItem label="难度 (1-5星)">
          <NRate v-model:value="formModel.difficulty" :count="5" allow-half />
        </NFormItem>
        <div class="flex gap-3">
          <NFormItem label="海拔 (m)" class="flex-1">
            <NInputNumber v-model:value="formModel.altitudeM" :min="0" placeholder="可选" class="w-full" />
          </NFormItem>
          <NFormItem label="爬升 (m)" class="flex-1">
            <NInputNumber v-model:value="formModel.elevationGainM" :min="0" placeholder="可选" class="w-full" />
          </NFormItem>
        </div>
        <div class="flex gap-3">
          <NFormItem label="徒步距离 (km)" class="flex-1">
            <NInputNumber v-model:value="formModel.distanceKm" :min="0" :precision="1" placeholder="可选" class="w-full" />
          </NFormItem>
          <NFormItem label="预计耗时 (分钟)" class="flex-1">
            <NInputNumber v-model:value="formModel.estimatedTimeMin" :min="0" placeholder="可选" class="w-full" />
          </NFormItem>
        </div>
        <div class="flex gap-3">
          <NFormItem label="车程距离 (km)" class="flex-1">
            <NInputNumber v-model:value="formModel.driveDistanceKm" :min="0" :precision="1" placeholder="可选" class="w-full" />
          </NFormItem>
          <NFormItem label="车程时间 (分钟)" class="flex-1">
            <NInputNumber v-model:value="formModel.driveTimeMin" :min="0" placeholder="可选" class="w-full" />
          </NFormItem>
        </div>
        <NFormItem label="最佳季节">
          <NInput v-model:value="formModel.bestSeason" placeholder="例如：春秋" />
        </NFormItem>
        <NFormItem label="风景标签">
          <NInput v-model:value="formModel.sceneryTags" placeholder="多个标签用顿号分隔，例如：溪水、森林、瀑布" />
        </NFormItem>
        <div class="flex gap-4 mb-3">
          <NFormItem label="有水源" label-placement="left" :show-feedback="false">
            <NSwitch v-model:value="formModel.hasWaterSource" />
          </NFormItem>
          <NFormItem label="有信号" label-placement="left" :show-feedback="false">
            <NSwitch v-model:value="formModel.hasCellSignal" />
          </NFormItem>
        </div>
        <NFormItem label="参考轨迹 (两步路链接等)">
          <NInput v-model:value="formModel.trackRef" placeholder="可选，两步路轨迹链接" />
        </NFormItem>
        <NFormItem label="停车信息">
          <NInput v-model:value="formModel.parkingInfo" placeholder="可选" />
        </NFormItem>
        <NFormItem label="备注">
          <NInput v-model:value="formModel.notes" type="textarea" placeholder="可选" :autosize="{ minRows: 2 }" />
        </NFormItem>
      </NForm>
      <template #action>
        <NButton @click="showForm = false">取消</NButton>
        <NButton type="primary" :loading="formLoading" @click="handleSubmit">
          {{ editId ? '保存' : '添加' }}
        </NButton>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.route-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.route-card {
  background: #fff;
  border-radius: 16px;
  padding: 10px 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.route-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.route-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 12px;
  background: #F0FDF4;
  border-radius: 8px;
  padding: 4px 8px;
  min-width: 44px;
}

.route-stat span:first-child {
  font-size: 10px;
  margin-bottom: 2px;
}

.route-stat span:last-child {
  font-weight: 600;
  color: #10B981;
}
</style>
