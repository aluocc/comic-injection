// apps/web/src/stores/shots.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { shotsApi } from '@/api/shots';
import type { ShotDTO, GenerateShotRequest, GenerateVideoRequest } from '@comic-injection/shared-types';

export const useShotsStore = defineStore('shots', () => {
  const shots = ref<ShotDTO[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchByProject(projectId: string) {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await shotsApi.listByProject(projectId);
      shots.value = data;
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  async function fetchByScene(sceneId: string) {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await shotsApi.listByScene(sceneId);
      shots.value = data;
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  async function createShot(projectId: string, payload: GenerateShotRequest) {
    const { data } = await shotsApi.create(projectId, payload);
    shots.value.push(data);
    return data;
  }

  async function updateShot(id: string, payload: Partial<GenerateShotRequest>) {
    const { data } = await shotsApi.update(id, payload);
    const idx = shots.value.findIndex(s => s.id === id);
    if (idx !== -1) shots.value[idx] = data;
    return data;
  }

  async function generateVideo(projectId: string, payload: GenerateVideoRequest) {
    const { data } = await shotsApi.generateVideo(projectId, payload);
    const idx = shots.value.findIndex(s => s.id === data.id);
    if (idx !== -1) shots.value[idx] = data;
    return data;
  }

  async function removeShot(id: string) {
    await shotsApi.remove(id);
    shots.value = shots.value.filter(s => s.id !== id);
  }

  return {
    shots,
    loading,
    error,
    fetchByProject,
    fetchByScene,
    createShot,
    updateShot,
    generateVideo,
    removeShot,
  };
});