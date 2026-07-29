<script setup lang="ts">
// apps/web/src/components/ShotCard.vue
import { ref } from 'vue';
import type { ShotDTO, ShotType } from '@comic-injection/shared-types';

const props = defineProps<{ shot: ShotDTO }>();
const emit = defineEmits<{
  (e: 'generateVideo'): void;
  (e: 'delete'): void;
  (e: 'update', payload: Partial<ShotDTO>): void;
}>();

const editing = ref(false);
const editForm = ref({ ...props.shot });

const shotTypeLabels: Record<ShotType, string> = {
  wide: '全景',
  medium: '中景',
  closeup: '特写',
  extreme_closeup: '极特写',
  over_shoulder: '过肩',
  aerial: '航拍',
};

const statusLabels: Record<string, string> = {
  draft: '草稿',
  pending: '排队中',
  generating: '生成中',
  completed: '已完成',
  failed: '失败',
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending: 'bg-yellow-100 text-yellow-700',
  generating: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

function saveEdit() {
  emit('update', {
    shotType: editForm.value.shotType,
    description: editForm.value.description,
    prompt: editForm.value.prompt,
    negativePrompt: editForm.value.negativePrompt,
    duration: editForm.value.duration,
  });
  editing.value = false;
}
</script>

<template>
  <div class="bg-white rounded shadow p-4">
    <div class="flex justify-between items-start mb-3">
      <div class="flex items-center gap-2">
        <span class="text-sm font-bold text-gray-500">#{{ props.shot.sequence + 1 }}</span>
        <span
          class="text-xs px-2 py-1 rounded"
          :class="statusColors[props.shot.status]"
        >
          {{ statusLabels[props.shot.status] }}
        </span>
        <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
          {{ shotTypeLabels[props.shot.shotType] }}
        </span>
      </div>
      <div class="flex gap-2">
        <button class="text-blue-500 text-sm hover:underline" @click="editing = !editing">
          {{ editing ? '取消' : '编辑' }}
        </button>
        <button class="text-red-500 text-sm hover:underline" @click="emit('delete')">
          删除
        </button>
      </div>
    </div>

    <div v-if="!editing">
      <div v-if="props.shot.videoUrl" class="mb-3">
        <video
          :src="props.shot.videoUrl"
          controls
          class="w-full max-h-48 rounded bg-black"
        ></video>
      </div>
      <div v-else class="mb-3 bg-gray-100 rounded h-32 flex items-center justify-center text-gray-400">
        暂无视频
      </div>

      <div class="text-sm text-gray-700 mb-1">{{ props.shot.description }}</div>
      <div class="text-xs text-gray-500 mb-2 line-clamp-2">{{ props.shot.prompt }}</div>

      <div class="flex gap-2">
        <button
          class="bg-blue-600 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50"
          :disabled="props.shot.status === 'pending' || props.shot.status === 'generating'"
          @click="emit('generateVideo')"
        >
          {{ props.shot.status === 'generating' ? '生成中...' : '生成视频' }}
        </button>
      </div>
    </div>

    <div v-else class="space-y-3">
      <div>
        <label class="block text-xs text-gray-500 mb-1">镜头类型</label>
        <select v-model="editForm.shotType" class="w-full border rounded px-2 py-1 text-sm">
          <option value="wide">全景</option>
          <option value="medium">中景</option>
          <option value="closeup">特写</option>
          <option value="extreme_closeup">极特写</option>
          <option value="over_shoulder">过肩</option>
          <option value="aerial">航拍</option>
        </select>
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">描述</label>
        <input v-model="editForm.description" class="w-full border rounded px-2 py-1 text-sm" />
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">提示词</label>
        <textarea v-model="editForm.prompt" rows="2" class="w-full border rounded px-2 py-1 text-sm"></textarea>
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">负向提示词</label>
        <input v-model="editForm.negativePrompt" class="w-full border rounded px-2 py-1 text-sm" />
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">时长（秒）</label>
        <input v-model.number="editForm.duration" type="number" class="w-full border rounded px-2 py-1 text-sm" />
      </div>
      <button class="bg-green-600 text-white text-sm px-3 py-1.5 rounded hover:bg-green-700" @click="saveEdit">
        保存
      </button>
    </div>
  </div>
</template>