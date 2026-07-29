<template>
  <div>
    <AppHeader />
    <main class="p-4 max-w-5xl mx-auto">
      <h1 class="text-xl font-bold mb-4">成就</h1>

      <div v-if="loading" class="text-sm text-gray-500">加载中...</div>
      <div v-else-if="error" class="text-sm text-red-500">{{ error }}</div>
      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- My Stats -->
        <div class="md:col-span-1 bg-white rounded-lg border p-4">
          <h2 class="text-sm font-semibold mb-3">我的数据</h2>
          <div v-if="myStats" class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">等级</span>
              <span class="font-semibold">Lv.{{ myStats.level }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">总积分</span>
              <span class="font-semibold text-blue-600">{{ myStats.totalPoints }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">帖子</span>
              <span>{{ myStats.postCount }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">评论</span>
              <span>{{ myStats.commentCount }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">获赞</span>
              <span>{{ myStats.likeReceivedCount }}</span>
            </div>
            <div class="pt-2 border-t">
              <div class="text-xs text-gray-400 mb-1">下一级还需 {{ nextLevelPoints }} 积分</div>
              <div class="w-full bg-gray-100 rounded-full h-2">
                <div class="bg-blue-600 h-2 rounded-full transition-all" :style="{ width: progressPct + '%' }" />
              </div>
            </div>
          </div>
        </div>

        <!-- Achievements Grid -->
        <div class="md:col-span-2 bg-white rounded-lg border p-4">
          <h2 class="text-sm font-semibold mb-3">成就徽章</h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <AchievementBadge
              v-for="a in achievements"
              :key="a.id"
              :achievement="a"
            />
          </div>
        </div>

        <!-- Leaderboard -->
        <div class="md:col-span-3 bg-white rounded-lg border p-4">
          <h2 class="text-sm font-semibold mb-3">排行榜</h2>
          <Leaderboard :entries="leaderboard" />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useAchievementsStore } from '../stores/achievements';
import { storeToRefs } from 'pinia';
import AppHeader from '../components/AppHeader.vue';
import AchievementBadge from '../components/AchievementBadge.vue';
import Leaderboard from '../components/Leaderboard.vue';

const store = useAchievementsStore();
const { achievements, myStats, leaderboard, loading, error } = storeToRefs(store);

onMounted(() => {
  store.fetchAchievements();
  store.fetchMyStats();
  store.fetchLeaderboard();
});

const nextLevelPoints = computed(() => {
  if (!myStats.value) return 100;
  return 100 - (myStats.value.totalPoints % 100);
});

const progressPct = computed(() => {
  if (!myStats.value) return 0;
  return myStats.value.totalPoints % 100;
});
</script>
