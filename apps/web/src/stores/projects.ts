// apps/web/src/stores/projects.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { projectsApi } from '../api/projects';

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<any[]>([]);
  const current = ref<any | null>(null);

  async function fetchList() {
    projects.value = await projectsApi.list();
  }

  async function fetchOne(id: string) {
    current.value = await projectsApi.get(id);
  }

  async function create(title: string, type: 'novel' | 'script' | 'article') {
    const p = await projectsApi.create(title, type);
    projects.value.unshift(p);
    return p;
  }

  return { projects, current, fetchList, fetchOne, create };
});
