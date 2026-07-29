// apps/web/src/api/shots.ts
import { apiClient } from './client';
import type { ShotDTO, GenerateShotRequest, GenerateVideoRequest } from '@comic-injection/shared-types';

export const shotsApi = {
  listByProject(projectId: string) {
    return apiClient.get<ShotDTO[]>(`/projects/${projectId}/shots`);
  },

  listByScene(sceneId: string) {
    return apiClient.get<ShotDTO[]>(`/scenes/${sceneId}/shots`);
  },

  get(id: string) {
    return apiClient.get<ShotDTO>(`/shots/${id}`);
  },

  create(projectId: string, payload: GenerateShotRequest) {
    return apiClient.post<ShotDTO>(`/projects/${projectId}/shots`, payload);
  },

  update(id: string, payload: Partial<GenerateShotRequest>) {
    return apiClient.patch<ShotDTO>(`/shots/${id}`, payload);
  },

  generateVideo(projectId: string, payload: GenerateVideoRequest) {
    return apiClient.post<ShotDTO>(`/projects/${projectId}/shots/video`, payload);
  },

  remove(id: string) {
    return apiClient.delete(`/shots/${id}`);
  },
};