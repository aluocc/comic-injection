import { api } from './client';

export const learningApi = {
  getProfile: () => api.get('/learning/profile').then((r) => r.data),
  getPath: () => api.get('/learning/path').then((r) => r.data),
  completeStep: (pathId: string, stepNo: number) =>
    api.post(`/learning/path/${pathId}/complete-step`, { stepNo }).then((r) => r.data),
  getRecommendations: (limit?: number) =>
    api.get('/learning/recommendations', { params: { limit } }).then((r) => r.data),
  listContents: (category?: string) =>
    api.get('/learning/contents', { params: { category } }).then((r) => r.data),
  listEvents: (limit?: number) =>
    api.get('/learning/events', { params: { limit } }).then((r) => r.data),
  trackEvent: (data: { eventType: string; entityType?: string; entityId?: string; metadata?: Record<string, unknown> }) =>
    api.post('/learning/events', data).then((r) => r.data),
};
