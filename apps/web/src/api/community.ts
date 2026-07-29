import { api } from './client';

export const communityApi = {
  listPosts: (params?: { category?: string; page?: number; limit?: number }) =>
    api.get('/community/posts', { params }).then((r) => r.data),
  getPost: (id: string) =>
    api.get(`/community/posts/${id}`).then((r) => r.data),
  createPost: (data: { title: string; content: string; category: string; tags?: string[] }) =>
    api.post('/community/posts', data).then((r) => r.data),
  updatePost: (id: string, data: Partial<{ title: string; content: string; category: string; tags: string[] }>) =>
    api.patch(`/community/posts/${id}`, data).then((r) => r.data),
  deletePost: (id: string) =>
    api.delete(`/community/posts/${id}`).then((r) => r.data),
  listComments: (postId: string) =>
    api.get(`/community/posts/${postId}/comments`).then((r) => r.data),
  createComment: (postId: string, data: { content: string; parentId?: string }) =>
    api.post(`/community/posts/${postId}/comments`, data).then((r) => r.data),
  deleteComment: (id: string) =>
    api.delete(`/community/comments/${id}`).then((r) => r.data),
  toggleLike: (data: { targetType: string; targetId: string }) =>
    api.post('/community/like', data).then((r) => r.data),
  getLeaderboard: (limit?: number) =>
    api.get('/community/leaderboard', { params: { limit } }).then((r) => r.data),
};
