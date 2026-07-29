// apps/web/src/api/scripts.ts
import { api } from './client';

export const scriptsApi = {
  listCharacters: (projectId: string) =>
    api.get(`/projects/${projectId}/characters`).then((r) => r.data),
  createCharacter: (projectId: string, name: string, description?: string) =>
    api.post(`/projects/${projectId}/characters`, { name, description }).then((r) => r.data),
  listProps: (projectId: string) =>
    api.get(`/projects/${projectId}/props`).then((r) => r.data),
  createProp: (projectId: string, name: string, description?: string) =>
    api.post(`/projects/${projectId}/props`, { name, description }).then((r) => r.data),
};
