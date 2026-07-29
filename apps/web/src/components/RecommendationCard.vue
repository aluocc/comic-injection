<template>
  <div class="bg-white rounded-lg border p-4 hover:shadow transition-shadow">
    <div class="flex items-center gap-2 mb-2">
      <span
        class="text-xs px-2 py-0.5 rounded-full font-medium"
        :class="categoryClass"
      >
        {{ categoryLabel }}
      </span>
      <span class="text-xs text-gray-400">{{ content.type }}</span>
    </div>
    <h3 class="text-sm font-semibold mb-1">{{ content.title }}</h3>
    <p class="text-xs text-gray-500 mb-3 line-clamp-2">{{ content.description }}</p>
    <div class="flex items-center justify-between">
      <span class="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{{ reason }}</span>
      <span class="text-xs text-gray-400">难度 {{ content.difficulty }}/5</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { LearningContentDTO, SkillDimension } from '@comic-injection/shared-types';

const props = defineProps<{
  content: LearningContentDTO;
  reason: string;
  matchedSkill: SkillDimension;
}>();

const categoryLabel = computed(() => {
  const map: Record<string, string> = {
    writing: '编剧',
    directing: '导演',
    art: '美术',
    technical: '技术',
  };
  return map[props.content.category] ?? props.content.category;
});

const categoryClass = computed(() => {
  const map: Record<string, string> = {
    writing: 'bg-purple-100 text-purple-700',
    directing: 'bg-orange-100 text-orange-700',
    art: 'bg-pink-100 text-pink-700',
    technical: 'bg-cyan-100 text-cyan-700',
  };
  return map[props.matchedSkill] ?? 'bg-gray-100 text-gray-700';
});
</script>
