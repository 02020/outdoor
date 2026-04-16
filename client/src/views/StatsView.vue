<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NTag, NSpin, NEmpty, useMessage } from 'naive-ui'
import { ExpenseCategory } from '@outdoor-fund/shared'
import { fetchStats, type StatsData } from '@/api/stats'

const router = useRouter()
const message = useMessage()

const loading = ref(false)
const stats = ref<StatsData | null>(null)

async function loadData() {
  loading.value = true
  try {
    stats.value = await fetchStats()
  } catch (err: any) {
    message.error(err.message)
  } finally {
    loading.value = false
  }
}

const categoryLabel = (key: string) =>
  ExpenseCategory[key as keyof typeof ExpenseCategory] ?? key

const maxCategoryTotal = computed(() => {
  if (!stats.value?.categoryStats.length) return 1
  return Math.max(...stats.value.categoryStats.map((c) => c.total))
})

onMounted(loadData)
</script>

<template>
  <div>
    <NSpin :show="loading">
      <template v-if="stats">
        <!-- 资金概览 -->
        <div class="overview-grid">
          <div class="stat-card">
            <span class="stat-label">公积金总额</span>
            <span class="stat-value text-emerald-600">¥{{ stats.totalBalance.toFixed(2) }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">累计充值</span>
            <span class="stat-value text-blue-500">¥{{ stats.totalTopup.toFixed(2) }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">累计支出</span>
            <span class="stat-value text-orange-500">¥{{ stats.totalSpent.toFixed(2) }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">活动次数</span>
            <span class="stat-value text-gray-700">{{ stats.settledActivities }} / {{ stats.totalActivities }}</span>
          </div>
        </div>

        <!-- 余额排行 -->
        <div class="section-card mt-4">
          <h3 class="section-title">余额排行</h3>
          <div v-if="stats.balanceRanking.length" class="ranking-list">
            <div
              v-for="(m, idx) in stats.balanceRanking"
              :key="m.memberId"
              class="ranking-row"
              @click="router.push(`/members/${m.memberId}`)"
            >
              <span class="rank-num" :class="{ 'rank-top': idx < 3 }">{{ idx + 1 }}</span>
              <span class="flex-1 text-sm text-gray-700">
                {{ m.nickname || m.name }}
                <span v-if="m.nickname" class="text-xs text-gray-400 ml-1">({{ m.name }})</span>
              </span>
              <span
                class="text-sm font-semibold"
                :class="m.balance >= 0 ? 'text-emerald-600' : 'text-red-500'"
              >
                ¥{{ m.balance.toFixed(2) }}
              </span>
            </div>
          </div>
          <NEmpty v-else description="暂无会员" size="small" />
        </div>

        <!-- 费用分类 -->
        <div v-if="stats.categoryStats.length" class="section-card mt-4">
          <h3 class="section-title">费用分类统计</h3>
          <div class="category-list">
            <div v-for="c in stats.categoryStats" :key="c.category" class="category-row">
              <div class="flex-between mb-1">
                <span class="text-sm text-gray-600">{{ categoryLabel(c.category) }}</span>
                <span class="text-sm font-semibold text-gray-800">¥{{ c.total.toFixed(2) }}</span>
              </div>
              <div class="bar-bg">
                <div
                  class="bar-fill"
                  :style="{ width: (c.total / maxCategoryTotal * 100) + '%' }"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 最近活动 -->
        <div v-if="stats.recentActivities.length" class="section-card mt-4">
          <h3 class="section-title">最近结算活动</h3>
          <div class="recent-list">
            <div
              v-for="a in stats.recentActivities"
              :key="a.id"
              class="recent-row"
              @click="router.push(`/activities/${a.id}`)"
            >
              <div class="flex-1">
                <span class="text-sm font-medium text-gray-800">{{ a.name }}</span>
                <span class="text-xs text-gray-400 ml-2">{{ a.date }}</span>
              </div>
              <div class="text-right">
                <span class="text-sm font-semibold text-emerald-600">¥{{ a.totalCost?.toFixed(2) ?? '0.00' }}</span>
                <div v-if="a.unitPrice" class="text-xs text-gray-400">人均 ¥{{ a.unitPrice.toFixed(2) }}</div>
              </div>
            </div>
          </div>
        </div>
      </template>
      <NEmpty v-else-if="!loading" description="暂无数据" class="mt-12" />
    </NSpin>
  </div>
</template>

<style scoped>
.overview-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.stat-card {
  background: #fff;
  border-radius: 14px;
  padding: 16px 14px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.04);
}

.stat-label {
  font-size: 12px;
  color: #9CA3AF;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
}

.section-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 12px;
}

.ranking-list {
  display: flex;
  flex-direction: column;
}

.ranking-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #F3F4F6;
  cursor: pointer;
}

.ranking-row:last-child {
  border-bottom: none;
}

.rank-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  background: #F3F4F6;
  color: #6B7280;
  flex-shrink: 0;
}

.rank-top {
  background: linear-gradient(135deg, #F59E0B, #D97706);
  color: #fff;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-row {
  display: flex;
  flex-direction: column;
}

.bar-bg {
  height: 8px;
  background: #F3F4F6;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #10B981, #059669);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.recent-list {
  display: flex;
  flex-direction: column;
}

.recent-row {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #F3F4F6;
  cursor: pointer;
}

.recent-row:last-child {
  border-bottom: none;
}
</style>
