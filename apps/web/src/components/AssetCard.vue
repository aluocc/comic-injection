<script setup lang="ts">
// apps/web/src/components/AssetCard.vue
import { ref } from 'vue';
import type { ImageDTO } from '@comic-injection/shared-types';

const props = defineProps<{ image: ImageDTO }>();
const emit = defineEmits<{ (e: 'delete'): void }>();
const showModal = ref(false);
</script>

<template>
  <div class="bg-white rounded shadow overflow-hidden">
    <div class="aspect-square bg-gray-100 cursor-pointer" @click="showModal = true">
      <img
        :src="props.image.url"
        :alt="props.image.prompt"
        class="w-full h-full object-cover"
      />
    </div>
    <div class="p-3">
      <div class="text-sm font-medium truncate">{{ props.image.type }}</div>
      <div class="text-xs text-gray-500 truncate">{{ props.image.prompt }}</div>
      <div class="flex justify-between items-center mt-2">
        <span class="text-xs text-gray-400">{{ props.image.model }}</span>
        <button class="text-red-500 text-xs hover:underline" @click="emit('delete')">
          删除
        </button>
      </div>
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showModal = false"
    >
      <img
        :src="props.image.url"
        :alt="props.image.prompt"
        class="max-w-full max-h-full object-contain"
      />
    </div>
  </div>
</template>