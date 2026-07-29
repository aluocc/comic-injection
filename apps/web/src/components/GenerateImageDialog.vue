<script setup lang="ts">
// apps/web/src/components/GenerateImageDialog.vue
import { ref } from 'vue';
import { useAssetsStore } from '@/stores/assets';
import type { ImageType, ImageModel } from '@comic-injection/shared-types';

const props = defineProps<{ projectId: string }>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'generated'): void;
}>();

const store = useAssetsStore();
const form = ref<{
  type: ImageType;
  prompt: string;
  model: ImageModel;
  negativePrompt: string;
  width: number;
  height: number;
}>({
  type: 'character',
  prompt: '',
  model: 'sd',
  negativePrompt: '',
  width: 512,
  height: 512,
});
const loading = ref(false);
const error = ref('');

const types: { label: string; value: ImageType }[] = [
  { label: '人物', value: 'character' },
  { label: '道具', value: 'prop' },
  { label: '场景', value: 'scene' },
  { label: '其他', value: 'other' },
];

const models: { label: string; value: ImageModel }[] = [
  { label: 'Stable Diffusion', value: 'sd' },
  { label: 'DALL·E', value: 'dalle' },
];

async function submit() {
  if (!form.value.prompt.trim()) {
    error.value = '请输入提示词';
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    await store.generateImage(props.projectId, {
      type: form.value.type,
      prompt: form.value.prompt,
      model: form.value.model,
      negativePrompt: form.value.negativePrompt || undefined,
      width: form.value.width,
      height: form.value.height,
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
      <h2 class="text-xl font-bold mb-4">生成图片</h2>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">类型</label>
          <select v-model="form.type" class="w-full border rounded px-3 py-2">
            <option v-for="t in types" :key="t.value" :value="t.value">
              {{ t.label }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">提示词</label>
          <textarea
            v-model="form.prompt"
            rows="3"
            class="w-full border rounded px-3 py-2"
            placeholder="描述你想要生成的图片..."
          ></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">模型</label>
          <select v-model="form.model" class="w-full border rounded px-3 py-2">
            <option v-for="m in models" :key="m.value" :value="m.value">
              {{ m.label }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">负向提示词（可选）</label>
          <input
            v-model="form.negativePrompt"
            type="text"
            class="w-full border rounded px-3 py-2"
            placeholder="不想出现的元素..."
          />
        </div>

        <div class="flex gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">宽度</label>
            <input
              v-model.number="form.width"
              type="number"
              class="w-full border rounded px-3 py-2"
            />
          </div>
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">高度</label>
            <input
              v-model.number="form.height"
              type="number"
              class="w-full border rounded px-3 py-2"
            />
          </div>
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