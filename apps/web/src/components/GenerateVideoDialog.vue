<script setup lang="ts">
// apps/web/src/components/GenerateVideoDialog.vue
import { ref } from 'vue';
import { useShotsStore } from '@/stores/shots';
import type { VideoModel } from '@comic-injection/shared-types';

const props = defineProps<{
  projectId: string;
  shotId: string | null;
}>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'generated'): void;
}>();

const store = useShotsStore();
const form = ref<{
  model: VideoModel;
  prompt: string;
  referenceImageId: string;
  duration: number;
}>({
  model: 'svd',
  prompt: '',
  referenceImageId: '',
  duration: 4,
});
const loading = ref(false);
const error = ref('');

const models: { label: string; value: VideoModel }[] = [
  { label: 'Stable Video Diffusion', value: 'svd' },
  { label: 'Runway Gen-3', value: 'runway' },
];

async function submit() {
  if (!props.shotId) {
    error.value = '请先选择分镜';
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    await store.generateVideo(props.projectId, {
      shotId: props.shotId,
      model: form.value.model,
      prompt: form.value.prompt || undefined,
      referenceImageId: form.value.referenceImageId || undefined,
      duration: form.value.duration,
    });
    emit('generated');
    emit('close');
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg w-full max-w-md p-6">
      <h2 class="text-xl font-bold mb-4">生成视频</h2>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">模型</label>
          <select v-model="form.model" class="w-full border rounded px-3 py-2">
            <option v-for="m in models" :key="m.value" :value="m.value">
              {{ m.label }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">提示词（可选，覆盖分镜提示词）</label>
          <textarea
            v-model="form.prompt"
            rows="3"
            class="w-full border rounded px-3 py-2"
            placeholder="留空使用分镜的提示词..."
          ></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">参考图片 ID（可选）</label>
          <input
            v-model="form.referenceImageId"
            type="text"
            class="w-full border rounded px-3 py-2"
            placeholder="引用素材库中的图片..."
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">时长（秒）</label>
          <input
            v-model.number="form.duration"
            type="number"
            min="1"
            max="10"
            class="w-full border rounded px-3 py-2"
          />
        </div>

        <div v-if="error" class="text-red-500 text-sm">{{ error }}</div>
      </div>

      <div class="flex justify-end gap-3 mt-6">
        <button
          class="px-4 py-2 border rounded hover:bg-gray-50"
          @click="emit('close')"
        >
          取消
        </button>
        <button
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          :disabled="loading"
          @click="submit"
        >
          {{ loading ? '生成中...' : '生成' }}
        </button>
      </div>
    </div>
  </div>
</template>