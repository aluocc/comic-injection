import { defineStore } from 'pinia';
import { ref } from 'vue';
import { achievementsApi } from '../api/achievements';

export const useAchievementsStore = defineStore('achievements', () => {
  const achievements = ref<any[]>([]);
  const myStats = ref<any | null>(null);
  const leaderboard = ref<any[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchAchievements() {
    loading.value = true;
    error.value = null;
    try {
      achievements.value = await achievementsApi.list();
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  async function fetchMyStats() {
    try {
      myStats.value = await achievementsApi.myStats();
    } catch {
      // ignore
    }
  }

  async function fetchLeaderboard() {
    try {
      leaderboard.value = await achievementsApi.leaderboard(20);
    } catch {
      // ignore
    }
  }

  return {
    achievements, myStats, leaderboard, loading, error,
    fetchAchievements, fetchMyStats, fetchLeaderboard,
  };
});
