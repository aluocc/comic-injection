<template>
  <div
    class="flex flex-col items-center p-4 rounded-lg border text-center transition-all"
    :class="unlocked
      ? 'bg-yellow-50 border-yellow-300'
      : 'bg-gray-50 border-gray-200 opacity-60 grayscale'"
  >
    <div class="text-3xl mb-2">{{ achievement.icon || '🏆' }}</div>
    <div class="text-sm font-medium">{{ achievement.name }}</div>
    <div class="text-xs text-gray-500 mt-1">{{ achievement.description }}</div>
    <div class="text-xs mt-2" :class="unlocked ? 'text-yellow-600' : 'text-gray-400'">
      <span v-if="unlocked">已解锁 · {{ new Date(achievement.unlockedAt).toLocaleDateString() }}</span>
      <span v-else>+{{ achievement.points }} 积分</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  achievement: any;
}>();

const unlocked = props.achievement.unlocked;
</script>
