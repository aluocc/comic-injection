<template>
  <div class="space-y-3">
    <div
      v-for="comment in comments"
      :key="comment.id"
      class="flex gap-3 p-3 bg-gray-50 rounded"
    >
      <div class="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs text-white shrink-0">
        {{ (comment.authorName || '?')[0] }}
      </div>
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-xs font-medium">{{ comment.authorName || '匿名' }}</span>
          <span class="text-xs text-gray-400">{{ new Date(comment.createdAt).toLocaleString() }}</span>
        </div>
        <p class="text-sm text-gray-700">{{ comment.content }}</p>
        <div class="flex items-center gap-3 mt-1 text-xs text-gray-400">
          <button @click="$emit('like', comment.id)" class="hover:text-blue-600">
            {{ comment.likeCount }} 赞
          </button>
          <button @click="$emit('reply', comment.id)" class="hover:text-blue-600">
            回复
          </button>
        </div>
      </div>
    </div>
    <div v-if="!comments.length" class="text-sm text-gray-400 text-center py-4">
      暂无评论
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  comments: any[];
}>();

defineEmits<{
  (e: 'like', id: string): void;
  (e: 'reply', parentId: string): void;
}>();
</script>
