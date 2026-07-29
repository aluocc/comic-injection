<template>
  <div class="flex flex-col items-center">
    <svg :width="size" :height="size" viewBox="0 0 200 200">
      <!-- background grid -->
      <g v-for="level in [0.2, 0.4, 0.6, 0.8, 1]" :key="level">
        <polygon
          :points="gridPoints(level)"
          fill="none"
          stroke="#e5e7eb"
          stroke-width="1"
        />
      </g>
      <!-- axes -->
      <line
        v-for="(label, i) in labels"
        :key="`axis-${i}`"
        x1="100"
        y1="100"
        :x2="point(100, 100, i, 1).x"
        :y2="point(100, 100, i, 1).y"
        stroke="#e5e7eb"
        stroke-width="1"
      />
      <!-- data polygon -->
      <polygon
        :points="dataPoints"
        fill="rgba(59,130,246,0.25)"
        stroke="#3b82f6"
        stroke-width="2"
      />
      <!-- data dots -->
      <circle
        v-for="(p, i) in dataDots"
        :key="`dot-${i}`"
        :cx="p.x"
        :cy="p.y"
        r="3"
        fill="#3b82f6"
      />
      <!-- labels -->
      <text
        v-for="(label, i) in labels"
        :key="`label-${i}`"
        :x="labelPoint(i).x"
        :y="labelPoint(i).y"
        text-anchor="middle"
        dominant-baseline="middle"
        class="text-xs fill-gray-600"
      >
        {{ label }}
      </text>
    </svg>
    <div class="mt-2 text-sm text-gray-500">
      综合能力: <span class="font-semibold text-gray-800">{{ overall }}</span> · 等级:
      <span class="font-semibold text-gray-800">{{ levelText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  writing: number;
  directing: number;
  art: number;
  technical: number;
  overall: number;
  level: string;
  size?: number;
}>();

const size = computed(() => props.size ?? 240);
const labels = ['编剧', '导演', '美术', '技术'];
const values = computed(() => [props.writing, props.directing, props.art, props.technical]);

const levelText = computed(() => {
  const map: Record<string, string> = {
    novice: '新手',
    beginner: '入门',
    intermediate: '中级',
    advanced: '高级',
    expert: '专家',
  };
  return map[props.level] ?? props.level;
});

function point(cx: number, cy: number, index: number, ratio: number) {
  const angle = (Math.PI * 2 * index) / 4 - Math.PI / 2;
  const r = 80 * ratio;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function gridPoints(ratio: number) {
  return Array.from({ length: 4 }, (_, i) => {
    const p = point(100, 100, i, ratio);
    return `${p.x},${p.y}`;
  }).join(' ');
}

const dataPoints = computed(() => {
  return values.value
    .map((v, i) => {
      const ratio = Math.min(Math.max(v / 100, 0), 1);
      const p = point(100, 100, i, ratio);
      return `${p.x},${p.y}`;
    })
    .join(' ');
});

const dataDots = computed(() => {
  return values.value.map((v, i) => {
    const ratio = Math.min(Math.max(v / 100, 0), 1);
    return point(100, 100, i, ratio);
  });
});

function labelPoint(index: number) {
  const angle = (Math.PI * 2 * index) / 4 - Math.PI / 2;
  const r = 95;
  return { x: 100 + r * Math.cos(angle), y: 100 + r * Math.sin(angle) };
}
</script>
