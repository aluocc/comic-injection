import { api } from './client';

export const achievementsApi = {
  list: () => api.get('/achievements').then((r) => r.data),
  myStats: () => api.get('/achievements/me').then((r) => r.data),
  leaderboard: (limit?: number) =>
    api.get('/achievements/leaderboard', { params: { limit } }).then((r) => r.data),
};
