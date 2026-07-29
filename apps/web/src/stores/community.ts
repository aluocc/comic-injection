import { defineStore } from 'pinia';
import { ref } from 'vue';
import { communityApi } from '../api/community';

export const useCommunityStore = defineStore('community', () => {
  const posts = ref<any[]>([]);
  const currentPost = ref<any | null>(null);
  const comments = ref<any[]>([]);
  const leaderboard = ref<any[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchPosts(category?: string) {
    loading.value = true;
    error.value = null;
    try {
      const res = await communityApi.listPosts({ category, limit: 50 });
      posts.value = res.items;
      total.value = res.total;
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  async function fetchPost(id: string) {
    loading.value = true;
    try {
      currentPost.value = await communityApi.getPost(id);
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  async function createPost(data: { title: string; content: string; category: string; tags?: string[] }) {
    const post = await communityApi.createPost(data);
    posts.value.unshift(post);
    return post;
  }

  async function deletePost(id: string) {
    await communityApi.deletePost(id);
    posts.value = posts.value.filter((p) => p.id !== id);
  }

  async function fetchComments(postId: string) {
    comments.value = await communityApi.listComments(postId);
  }

  async function createComment(postId: string, content: string, parentId?: string) {
    const comment = await communityApi.createComment(postId, { content, parentId });
    comments.value.push(comment);
    if (currentPost.value && currentPost.value.id === postId) {
      currentPost.value.commentCount++;
    }
    return comment;
  }

  async function toggleLike(targetType: string, targetId: string) {
    return communityApi.toggleLike({ targetType, targetId });
  }

  async function fetchLeaderboard() {
    leaderboard.value = await communityApi.getLeaderboard(20);
  }

  return {
    posts, currentPost, comments, leaderboard, total, loading, error,
    fetchPosts, fetchPost, createPost, deletePost,
    fetchComments, createComment, toggleLike, fetchLeaderboard,
  };
});
