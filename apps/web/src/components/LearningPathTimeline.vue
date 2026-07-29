<template>
  <div class="space-y-3">
    <div
      v-for="step in steps"
      :key="step.stepNo"
      class="flex items-start gap-3 p-3 rounded border"
      :class="{
        'bg-green-50 border-green-200': step.status === 'completed',
        'bg-white border-gray-200': step.status === 'available',
        'bg-gray-50 border-gray-100 opacity-60': step.status === 'locked',
      }"
    >
      <div
        class="mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        :class="{
          'bg-green-500 text-white': step.status === 'completed',
          'bg-blue-500 text-white': step.status === 'available',
          'bg-gray-300 text-white': step.status === 'locked',
        }"
      >
        {{ step.stepNo }}
      </div>
      <div class="flex-1">
        <div class="text-sm font-medium">{{ step.title }}</div>
        <div class="text-xs text-gray-500 mt-0.5">
          <span v-if="step.status === 'completed'">已完成</span>
          <span v-else-if="step.status === 'available'">进行中</span>
          <span v-else>未解锁</span>
        </div>
      </div>
      <button
        v-if="step.status === 'available'"
        @click="$emit('complete', step.stepNo)"
        class="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
      >
        完成
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LearningPathStep } from '@comic-injection/shared-types';

defineProps<{
  steps: LearningPathStep[];
}>();

defineEmits<{
  (e: 'complete', stepNo: number): void;
}>();
</script>
