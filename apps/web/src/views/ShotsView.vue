<script setup lang="ts">
// apps/web/src/views/ShotsView.vue
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useShotsStore } from '@/stores/shots';
import ShotCard from '@/components/ShotCard.vue';
import GenerateVideoDialog from '@/components/GenerateVideoDialog.vue';

const route = useRoute();
const store = useShotsStore();
const projectId = route.params.id as string;
const showDialog = ref(false);
const selectedShot = ref<string | null>(null);

onMounted(() => {
  store.fetchByProject(projectId);
});

function openGenerateVideo(shotId: string) {
  selectedShot.value = shotId;
  showDialog.value = true;
}
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">分镜管理</h1>
      <button
        class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        @click="showDialog = true"
      >
        新建分镜
      </button>
    </div>

    <div v-if="store.loading" class="text-center py-10">加载中...</div>
    <div v-else-if="store.error" class="text-red-500">{{ store.error }}</div>
    <div v-else-if="store.shots.length === 0" class="text-gray-500 text-center py-10">
      暂无分镜，点击"新建分镜"开始创作
    </div>
    <div v-else class="space-y-4">
      <ShotCard
        v-for="shot in store.shots"
        :key="shot.id"
        :shot="shot"
        @generate-video="openGenerateVideo(shot.id)"
        @delete="store.removeShot(shot.id)"
        @update="store.updateShot(shot.id, $event)"
      />
    </div>

    <GenerateVideoDialog
      v-if="showDialog"
      :project-id="projectId"
      :shot-id="selectedShot"
      @close="showDialog = false; selectedShot = null"
      @generated="store.fetchByProject(projectId)"
    />
  </div>
</template>