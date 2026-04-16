import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      component: () => import('@/layouts/AppShell.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/members',
        },
        {
          path: 'members',
          name: 'Members',
          component: () => import('@/views/MembersView.vue'),
          meta: { title: '会员', icon: 'i-carbon-user-multiple' },
        },
        {
          path: 'members/:id',
          name: 'MemberDetail',
          component: () => import('@/views/MemberDetailView.vue'),
          meta: { title: '会员详情' },
        },
        {
          path: 'activities',
          name: 'Activities',
          component: () => import('@/views/ActivitiesView.vue'),
          meta: { title: '活动', icon: 'i-carbon-campsite' },
        },
        {
          path: 'activities/:id',
          name: 'ActivityDetail',
          component: () => import('@/views/ActivityDetailView.vue'),
          meta: { title: '活动详情' },
        },
        {
          path: 'stats',
          name: 'Stats',
          component: () => import('@/views/StatsView.vue'),
          meta: { title: '统计', icon: 'i-carbon-chart-bar' },
        },
        {
          path: 'settings',
          name: 'Settings',
          component: () => import('@/views/SettingsView.vue'),
          meta: { title: '设置', icon: 'i-carbon-settings' },
        },
        {
          path: 'routes',
          name: 'Routes',
          component: () => import('@/views/RoutesView.vue'),
          meta: { title: '路线管理' },
        },
        {
          path: 'audit-logs',
          name: 'AuditLogs',
          component: () => import('@/views/AuditLogView.vue'),
          meta: { title: '审计日志' },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/login',
    },
  ],
})

// 路由守卫
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth !== false && !auth.isLoggedIn) {
    return { name: 'Login' }
  }
  if (to.name === 'Login' && auth.isLoggedIn) {
    return { path: '/' }
  }
})

export default router
