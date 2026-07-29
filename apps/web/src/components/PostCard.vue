<template>
  <div class="bg-white rounded-lg border p-4 hover:shadow transition-shadow cursor-pointer" @click="$emit('click')">
    <div class="flex items-start justify-between gap-2 mb-2">
      <h3 class="text-sm font-semibold line-clamp-1">{{ post.title }}</h3>
      <span class="text-xs px-2 py-0.5 rounded-full shrink-0" :class="categoryClass">
        {{ categoryLabel }}
      </span>
    </div>
    <p class="text-xs text-gray-500 line-clamp-2 mb-3">{{ post.content }}</p>
    <div class="flex items-center gap-4 text-xs text-gray-400">
      <span>{{ post.authorName || '匿名' }}</span>
      <span>{{ new Date(post.createdAt).toLocaleDateString() }}</span>
      <span class="flex items-center gap-1">
        <span>{{ post.likeCount }}</span>
      </span>
      <span class="flex items-center gap-1">
        <span>{{ post.commentCount }}</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  post: any;
}>();

defineEmits<{ (e: 'click'): void }>();

const categoryLabel = computed(() => {
  const map: Record<string, string> = {
    showcase: '作品展示',
    help: '求助',
    discussion: '讨论',
    feedback: '反馈',
  };
  return map[props.post.category] ?? props.post.category;
});

const categoryClass = computed(() => {
  const map: Record<string, string> = {
    showcase: 'bg-purple-100 text-purple-700',
    help: 'bg-orange-100 text-orange-700',
    discussion: 'bg-blue-100 text-blue-700',
    feedback: 'bg-green-100 text-green-700',
  };
  return map[props.post.category] ?? 'bg-gray-100 text-gray-700';
});
</script>
