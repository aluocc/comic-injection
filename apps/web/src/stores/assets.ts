// apps/web/src/stores/assets.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { imagesApi } from '@/api/images';
import type { ImageDTO, GenerateImageRequest, ImageType } from '@comic-injection/shared-types';

export const useAssetsStore = defineStore('assets', () => {
  const images = ref<ImageDTO[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchImages(projectId: string, type?: ImageType) {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await imagesApi.list(projectId, type);
      images.value = data;
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  async function uploadImage(projectId: string, payload: { url: string; type: string; referenceId?: string; prompt?: string }) {
    const { data } = await imagesApi.upload(projectId, payload);
    images.value.unshift(data);
    return data;
  }

  async function generateImage(projectId: string, payload: GenerateImageRequest) {
    const { data } = await imagesApi.generate(projectId, payload);
    images.value.unshift(data);
    return data;
  }

  async function removeImage(id: string) {
    await imagesApi.remove(id);
    images.value = images.value.filter(img => img.id !== id);
  }

  return {
    images,
    loading,
    error,
    fetchImages,
    uploadImage,
    generateImage,
    removeImage,
  };
});