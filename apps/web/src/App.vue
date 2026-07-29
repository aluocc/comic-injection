<template>
  <RouterView />
</template>
<script setup lang="ts">
import { RouterView } from 'vue-router';
</script>
<style>
/* Tiptap 编辑器全局样式 */
.ProseMirror { outline: none; min-height: 300px; }
.ProseMirror p { margin: 0.5em 0; }
/* 剧本节点样式由 TiptapEditor.vue 内部 <style> 提供 */
</style>
