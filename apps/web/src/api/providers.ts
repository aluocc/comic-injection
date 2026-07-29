import { api } from './client';

export const providersApi = {
  list: () => api.get('/providers').then((r) => r.data),
  upsert: (provider: string, apiKey: string) =>
    api.post('/providers/keys', { provider, apiKey }).then((r) => r.data),
};
