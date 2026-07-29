<template>
  <div v-if="visible" class="absolute z-50 bg-white border rounded shadow-lg w-64 max-h-80 overflow-auto">
    <input
      ref="inputEl"
      v-model="query"
      @keydown.esc="close"
      @keydown.down="moveDown"
      @keydown.up="moveUp"
      @keydown.enter.prevent="selectCurrent"
      class="w-full px-3 py-2 border-b outline-none"
      placeholder="输入命令或描述..."
    />
    <ul>
      <li
        v-for="(item, i) in filtered"
        :key="item.id"
        @click="execute(item)"
        @mouseenter="selected = i"
        :class="['px-3 py-2 cursor-pointer text-sm', selected === i ? 'bg-blue-50' : '']"
      >
        <span class="font-medium">/{{ item.id }}</span>
        <span class="text-gray-500 ml-2">{{ item.label }}</span>
      </li>
      <li v-if="!filtered.length && query" class="px-3 py-2 text-sm text-gray-500">
        回车使用 AI: "{{ query }}"
      </li>
    </ul>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { aiApi } from '../api/ai-prompts';

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'result', text: string): void;
  (e: 'error', msg: string): void;
}>();

const query = ref('');
const selected = ref(0);
const inputEl = ref<HTMLInputElement>();

const commands = [
  { id: '生成大纲', label: '根据标题生成分场表', operation: 'outline' },
  { id: '生成下一场', label: '续写下一场景', operation: 'nextScene' },
  { id: '扩写', label: '扩展为详细描写', operation: 'expand' },
  { id: '压缩', label: '精简为摘要', operation: 'compress' },
  { id: '润色', label: '风格调整', operation: 'polish' },
  { id: '一致性检查', label: '检查设定冲突', operation: 'check' },
];

const filtered = computed(() => {
  if (!query.value) return commands;
  return commands.filter((c) => c.id.includes(query.value) || c.label.includes(query.value));
});

watch(() => props.visible, async (v) => {
  if (v) {
    query.value = '';
    selected.value = 0;
    await nextTick();
    inputEl.value?.focus();
  }
});

function moveDown() { selected.value = (selected.value + 1) % Math.max(1, filtered.value.length); }
function moveUp() { selected.value = (selected.value - 1 + filtered.value.length) % Math.max(1, filtered.value.length); }

async function selectCurrent() {
  if (filtered.value.length) {
    await execute(filtered.value[selected.value]);
  } else if (query.value) {
    await runAi('generate', query.value);
  }
}

async function execute(item: typeof commands[0]) {
  await runAi(item.operation, item.label);
}

async function runAi(operation: string, prompt: string) {
  try {
    const r = await aiApi.execute(operation, prompt);
    emit('result', r.output);
    emit('close');
  } catch (e: any) {
    emit('error', e.response?.data?.message ?? e.message);
  }
}

function close() { emit('close'); }
</script>
