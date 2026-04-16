<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { NButton } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const tabs = [
  { path: '/members', label: '会员', icon: 'i-carbon-user-multiple' },
  { path: '/activities', label: '活动', icon: 'i-carbon-campsite' },
  { path: '/routes', label: '路线', icon: 'i-carbon-map' },
  { path: '/stats', label: '统计', icon: 'i-carbon-chart-bar' },
  { path: '/settings', label: '设置', icon: 'i-carbon-settings' },
]

const currentPath = computed(() => '/' + (route.path.split('/')[1] || ''))

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="app-shell">
    <!-- 顶栏 -->
    <header class="app-header">
      <div class="flex items-center gap-2">
        <span class="text-lg">&#x26F0;&#xFE0F;</span>
        <span class="font-bold text-sm text-white">{{ auth.groupName }}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="role-badge">{{ auth.isAdmin ? '管理员' : '会员' }}</span>
        <NButton text size="tiny" class="text-emerald-200! hover:text-white!" @click="handleLogout">退出</NButton>
      </div>
    </header>

    <!-- 内容 -->
    <main class="app-content">
      <RouterView />
    </main>

    <!-- 底部 Tab -->
    <nav class="app-tab-bar">
      <router-link
        v-for="tab in tabs"
        :key="tab.path"
        :to="tab.path"
        class="tab-item"
        :class="{ active: currentPath === tab.path }"
      >
        <div :class="tab.icon" class="tab-icon" />
        <span class="tab-label">{{ tab.label }}</span>
      </router-link>
    </nav>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: #F0FDF4;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  background: linear-gradient(135deg, #064E3B 0%, #047857 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.role-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.15);
  color: #A7F3D0;
  font-weight: 500;
}

.app-content {
  flex: 1;
  padding: 12px 12px 72px;
}

.app-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  height: 56px;
  background: #fff;
  border-top: 1px solid #E5E7EB;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.04);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  text-decoration: none;
  color: #9CA3AF;
  transition: color 0.2s ease;
}

.tab-item.active {
  color: #10B981;
}

.tab-icon {
  font-size: 22px;
}

.tab-label {
  font-size: 11px;
  font-weight: 500;
}
</style>
