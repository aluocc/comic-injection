<template>
  <div>
    <AppHeader />
    <main class="p-4 max-w-3xl mx-auto">
      <button @click="$router.back()" class="text-sm text-gray-500 mb-3 hover:underline">
        返回
      </button>

      <div v-if="loading" class="text-sm text-gray-500">加载中...</div>
      <template v-else-if="currentPost">
        <!-- Post -->
        <div class="bg-white rounded-lg border p-5 mb-4">
          <h1 class="text-lg font-bold mb-2">{{ currentPost.title }}</h1>
          <div class="flex items-center gap-3 text-xs text-gray-400 mb-3">
            <span>{{ currentPost.authorName || '匿名' }}</span>
            <span>{{ new Date(currentPost.createdAt).toLocaleString() }}</span>
          </div>
          <div class="text-sm text-gray-700 whitespace-pre-wrap mb-3">{{ currentPost.content }}</div>
          <div class="flex items-center gap-4 text-xs">
            <button @click="togglePostLike" class="flex items-center gap-1" :class="currentPost.liked ? 'text-red-500' : 'text-gray-400'">
              {{ currentPost.likeCount }} 赞
            </button>
            <span class="text-gray-400">{{ currentPost.commentCount }} 评论</span>
          </div>
        </div>

        <!-- Comment Form -->
        <div class="bg-white rounded-lg border p-4 mb-4">
          <textarea
            v-model="commentText"
            placeholder="写下你的评论..."
            rows="3"
            class="w-full border rounded px-3 py-2 text-sm mb-2"
          />
          <button
            @click="submitComment"
            :disabled="!commentText.trim()"
            class="bg-blue-600 text-white text-sm px-3 py-1 rounded disabled:opacity-50"
          >
            发表评论
          </button>
        </div>

        <!-- Comments -->
        <div class="bg-white rounded-lg border p-4">
          <h3 class="text-sm font-semibold mb-3">评论</h3>
          <CommentList
            :comments="comments"
            @like="likeComment"
            @reply="replyTo"
          />
        </div>
      </template>
      <div v-else class="text-sm text-gray-400 text-center py-8">帖子不存在</div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useCommunityStore } from '../stores/community';
import { storeToRefs } from 'pinia';
import AppHeader from '../components/AppHeader.vue';
import CommentList from '../components/CommentList.vue';

const route = useRoute();
const store = useCommunityStore();
const { currentPost, comments, loading } = storeToRefs(store);

const commentText = ref('');
const parentId = ref<string | null>(null);

onMounted(async () => {
  const id = route.params.id as string;
  await store.fetchPost(id);
  await store.fetchComments(id);
});

async function togglePostLike() {
  if (!currentPost.value) return;
  const res = await store.toggleLike('post', currentPost.value.id);
  currentPost.value.liked = res.liked;
  currentPost.value.likeCount += res.liked ? 1 : -1;
}

async function submitComment() {
  if (!currentPost.value || !commentText.value.trim()) return;
  await store.createComment(currentPost.value.id, commentText.value, parentId.value ?? undefined);
  commentText.value = '';
  parentId.value = null;
}

async function likeComment(id: string) {
  await store.toggleLike('comment', id);
  const c = comments.value.find((x) => x.id === id);
  if (c) {
    const res = await store.toggleLike('comment', id);
    c.liked = res.liked;
    c.likeCount += res.liked ? 1 : -1;
  }
}

function replyTo(id: string) {
  parentId.value = id;
  commentText.value = '';
}
</script>
