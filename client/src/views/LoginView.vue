<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  NCard,
  NForm,
  NFormItem,
  NSelect,
  NInput,
  NButton,
  useMessage,
  type FormRules,
  type FormInst,
  type SelectOption,
} from 'naive-ui'
import { request } from '@/utils/http'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const message = useMessage()
const auth = useAuthStore()

const groupOptions = ref<SelectOption[]>([])
const loginFormRef = ref<FormInst | null>(null)
const loginModel = ref({ groupId: null as number | null, password: '' })
const loading = ref(false)

const loginRules: FormRules = {
  groupId: { required: true, type: 'number', message: '请选择群组', trigger: 'change' },
  password: { required: true, message: '请输入密码', trigger: 'blur' },
}

async function loadGroups() {
  try {
    const list = await request<{ id: number; name: string }[]>({ url: '/auth/groups' })
    groupOptions.value = list.map((g) => ({ label: g.name, value: g.id }))
  } catch {
    // 静默
  }
}

async function handleLogin() {
  try {
    await loginFormRef.value?.validate()
  } catch {
    return
  }
  loading.value = true
  try {
    const data = await request<{ token: string; group: { id: number; name: string }; role: 'admin' | 'member' }>({
      method: 'POST',
      url: '/auth/login',
      data: { groupId: loginModel.value.groupId, password: loginModel.value.password },
    })
    auth.setAuth({
      token: data.token,
      groupId: data.group.id,
      groupName: data.group.name,
      role: data.role,
    })
    message.success(`欢迎回来 (${data.role === 'admin' ? '管理员' : '会员'})`)
    router.push('/')
  } catch (err: any) {
    message.error(err.message || '登录失败')
  } finally {
    loading.value = false
  }
}

onMounted(loadGroups)
</script>

<template>
  <div class="login-page">
    <div class="login-hero">
      <div class="text-5xl mb-2">&#x26F0;&#xFE0F;</div>
      <h1 class="text-xl font-bold text-white m-0">户外公积金</h1>
      <p class="text-sm text-emerald-200 mt-1">轻松管理 &middot; 透明结算</p>
    </div>

    <div class="login-body">
      <NCard class="login-card" :bordered="false">
        <NForm ref="loginFormRef" :model="loginModel" :rules="loginRules" label-placement="top" size="medium">
          <NFormItem label="选择群组" path="groupId">
            <NSelect
              v-model:value="loginModel.groupId"
              :options="groupOptions"
              placeholder="请选择群组"
              filterable
            />
          </NFormItem>
          <NFormItem label="密码" path="password">
            <NInput
              v-model:value="loginModel.password"
              type="password"
              placeholder="管理员密码或会员密码"
              show-password-on="click"
              @keyup.enter="handleLogin"
            />
          </NFormItem>
          <NButton type="primary" block :loading="loading" class="mt-1" @click="handleLogin">
            登 录
          </NButton>
        </NForm>
      </NCard>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  min-height: 100dvh;
  background: linear-gradient(160deg, #064E3B 0%, #10B981 55%, #A7F3D0 100%);
  display: flex;
  flex-direction: column;
}

.login-hero {
  padding: 60px 24px 28px;
  text-align: center;
}

.login-body {
  flex: 1;
  padding: 0 20px 40px;
}

.login-card {
  border-radius: 20px !important;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.10);
}
</style>
