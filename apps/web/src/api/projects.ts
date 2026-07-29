// apps/web/src/api/projects.ts
import { api } from './client';

export const projectsApi = {
  list: () => api.get('/projects').then((r) => r.data),
  get: (id: string) => api.get(`/projects/${id}`).then((r) => r.data),
  create: (title: string, type: 'novel' | 'script' | 'article') =>
    api.post('/projects', { title, type }).then((r) => r.data),
  update: (id: string, data: any) => api.patch(`/projects/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/projects/${id}`),
  listChapters: (id: string) => api.get(`/projects/${id}/chapters`).then((r) => r.data),
  createChapter: (id: string, title: string) =>
    api.post(`/projects/${id}/chapters`, { title }).then((r) => r.data),
};
