<template>
  <div class="space-y-2">
    <div
      v-for="entry in entries"
      :key="entry.userId"
      class="flex items-center gap-3 p-3 rounded border"
      :class="{
        'bg-yellow-50 border-yellow-200': entry.rank === 1,
        'bg-gray-50 border-gray-200': entry.rank !== 1,
      }"
    >
      <div
        class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        :class="{
          'bg-yellow-400 text-white': entry.rank === 1,
          'bg-gray-300 text-white': entry.rank === 2,
          'bg-orange-300 text-white': entry.rank === 3,
          'bg-gray-200 text-gray-600': entry.rank > 3,
        }"
      >
        {{ entry.rank }}
      </div>
      <div class="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-xs text-white shrink-0">
        {{ (entry.userName || '?')[0] }}
      </div>
      <div class="flex-1">
        <div class="text-sm font-medium">{{ entry.userName }}</div>
        <div class="text-xs text-gray-400">Lv.{{ entry.level }}</div>
      </div>
      <div class="text-sm font-semibold text-blue-600">{{ entry.totalPoints }}</div>
    </div>
    <div v-if="!entries.length" class="text-sm text-gray-400 text-center py-4">
      暂无数据
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  entries: any[];
}>();
</script>
