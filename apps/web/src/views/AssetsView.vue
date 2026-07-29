<script setup lang="ts">
// apps/web/src/views/AssetsView.vue
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAssetsStore } from '@/stores/assets';
import AssetCard from '@/components/AssetCard.vue';
import GenerateImageDialog from '@/components/GenerateImageDialog.vue';

const route = useRoute();
const store = useAssetsStore();
const projectId = route.params.id as string;
const filterType = ref<string>('');
const showDialog = ref(false);

const tabs = [
  { label: '全部', value: '' },
  { label: '人物', value: 'character' },
  { label: '道具', value: 'prop' },
  { label: '场景', value: 'scene' },
];

watch(filterType, (type) => {
  store.fetchImages(projectId, type || undefined);
});

onMounted(() => {
  store.fetchImages(projectId);
});
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">素材库</h1>
      <button
        class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        @click="showDialog = true"
      >
        生成图片
      </button>
    </div>

    <div class="flex gap-4 mb-6">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        :class="[
          'px-4 py-2 rounded',
          filterType === tab.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700',
        ]"
        @click="filterType = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-if="store.loading" class="text-center py-10">加载中...</div>
    <div v-else-if="store.error" class="text-red-500">{{ store.error }}</div>
    <div v-else-if="store.images.length === 0" class="text-gray-500 text-center py-10">
      暂无素材，点击"生成图片"开始创作
    </div>
    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <AssetCard
        v-for="img in store.images"
        :key="img.id"
        :image="img"
        @delete="store.removeImage(img.id)"
      />
    </div>

    <GenerateImageDialog
      v-if="showDialog"
      :project-id="projectId"
      @close="showDialog = false"
      @generated="store.fetchImages(projectId, filterType || undefined)"
    />
  </div>
</template>