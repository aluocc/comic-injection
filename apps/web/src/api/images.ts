// apps/web/src/api/images.ts
import { apiClient } from './client';
import type { ImageDTO, GenerateImageRequest } from '@comic-injection/shared-types';

export const imagesApi = {
  list(projectId: string, type?: string) {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    return apiClient.get<ImageDTO[]>(`/projects/${projectId}/images?${params.toString()}`);
  },

  get(id: string) {
    return apiClient.get<ImageDTO>(`/images/${id}`);
  },

  upload(projectId: string, payload: { url: string; type: string; referenceId?: string; prompt?: string }) {
    return apiClient.post<ImageDTO>(`/projects/${projectId}/images/upload`, payload);
  },

  generate(projectId: string, payload: GenerateImageRequest) {
    return apiClient.post<ImageDTO>(`/projects/${projectId}/images/generate`, payload);
  },

  remove(id: string) {
    return apiClient.delete(`/images/${id}`);
  },
};