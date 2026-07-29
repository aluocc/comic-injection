<template>
  <div class="h-screen flex flex-col">
    <AppHeader />
    <div class="flex-1 relative">
      <VueFlow :nodes="nodes" :edges="edges" @connect="onConnect">
        <template #node-script="props">
          <ScriptNode :data="props.data" />
        </template>
        <Background />
        <Controls />
      </VueFlow>
      <div class="absolute top-2 right-2 flex gap-2">
        <span class="text-xs px-2 py-1 rounded" :class="connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
          {{ connected ? '已同步' : '离线' }}
        </span>
        <button @click="collab.persist()" class="text-xs bg-gray-100 px-2 py-1 rounded">保存版本</button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { VueFlow, type Connection } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { useYjsCollab } from '../composables/useYjsCollab';
import { useAuthStore } from '../stores/auth';
import AppHeader from '../components/AppHeader.vue';
import ScriptNode from '../components/workflow/ScriptNode.vue';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/controls/dist/style.css';

const route = useRoute();
const workflowId = route.params.id as string;
const auth = useAuthStore();
const collab = useYjsCollab(workflowId, auth.accessToken ?? '');

const nodes = ref<any[]>([]);
const edges = ref<any[]>([]);
const { connected } = collab;

function onConnect(conn: Connection) {
  const id = `e-${Date.now()}`;
  const edge = { id, source: conn.source, target: conn.target };
  edges.value.push(edge);
  collab.yEdges.set(id, JSON.stringify(edge));
}

collab.yNodes.observe(() => {
  nodes.value = Array.from(collab.yNodes.values()).map((s) => JSON.parse(s));
});
collab.yEdges.observe(() => {
  edges.value = Array.from(collab.yEdges.values()).map((s) => JSON.parse(s));
});

onUnmounted(() => collab.dispose());
</script>
