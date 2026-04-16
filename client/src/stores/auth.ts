import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { GroupRole } from '@outdoor-fund/shared'

interface AuthState {
  token: string
  groupId: number
  groupName: string
  role: GroupRole
}

const STORAGE_KEY = 'outdoor_fund_auth'

export const useAuthStore = defineStore('auth', () => {
  // --- ref ---
  const token = ref('')
  const groupId = ref(0)
  const groupName = ref('')
  const role = ref<GroupRole>('member')

  // --- computed ---
  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => role.value === 'admin')

  // --- functions ---
  function setAuth(data: AuthState) {
    token.value = data.token
    groupId.value = data.groupId
    groupName.value = data.groupName
    role.value = data.role
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  function logout() {
    token.value = ''
    groupId.value = 0
    groupName.value = ''
    role.value = 'member'
    localStorage.removeItem(STORAGE_KEY)
  }

  function restore() {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const data: AuthState = JSON.parse(raw)
        token.value = data.token
        groupId.value = data.groupId
        groupName.value = data.groupName
        role.value = data.role
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }

  // 初始化时恢复
  restore()

  function setGroupName(name: string) {
    groupName.value = name
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const data = JSON.parse(raw)
        data.groupName = name
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      } catch { /* ignore */ }
    }
  }

  return { token, groupId, groupName, role, isLoggedIn, isAdmin, setAuth, setGroupName, logout, restore }
})
