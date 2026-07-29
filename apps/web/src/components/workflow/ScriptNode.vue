<template>
  <div class="px-3 py-2 rounded border bg-white shadow text-sm min-w-[160px]">
    <div class="font-semibold">剧本节点</div>
    <div class="text-gray-500 text-xs">{{ data?.prompt?.slice(0, 30) ?? '未配置' }}</div>
  </div>
</template>
<script setup lang="ts">
defineProps<{ data: { prompt?: string } }>();
</script>
