import { api } from './client';

export const workflowsApi = {
  list: () => api.get('/workflows').then((r) => r.data),
  create: (title: string) => api.post('/workflows', { title }).then((r) => r.data),
  get: (id: string) => api.get(`/workflows/${id}`).then((r) => r.data),
};
