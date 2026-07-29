<template>
  <div>
    <AppHeader />
    <main class="p-4 max-w-5xl mx-auto">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-xl font-bold">社区</h1>
        <button
          @click="showNewPost = !showNewPost"
          class="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
        >
          {{ showNewPost ? '取消' : '发帖' }}
        </button>
      </div>

      <!-- New Post Form -->
      <div v-if="showNewPost" class="bg-white rounded-lg border p-4 mb-4 space-y-3">
        <input
          v-model="newPost.title"
          placeholder="标题"
          class="w-full border rounded px-3 py-2 text-sm"
        />
        <textarea
          v-model="newPost.content"
          placeholder="内容（支持 Markdown）"
          rows="4"
          class="w-full border rounded px-3 py-2 text-sm"
        />
        <div class="flex gap-2">
          <select v-model="newPost.category" class="border rounded px-2 py-1.5 text-sm">
            <option value="discussion">讨论</option>
            <option value="showcase">作品展示</option>
            <option value="help">求助</option>
            <option value="feedback">反馈</option>
          </select>
          <input
            v-model="newPost.tagsStr"
            placeholder="标签（逗号分隔）"
            class="flex-1 border rounded px-3 py-1.5 text-sm"
          />
        </div>
        <button
          @click="submitPost"
          :disabled="!newPost.title || !newPost.content"
          class="bg-green-600 text-white text-sm px-4 py-1.5 rounded disabled:opacity-50"
        >
          发布
        </button>
      </div>

      <!-- Category Filter -->
      <div class="flex gap-2 mb-4">
        <button
          v-for="cat in categories"
          :key="cat.value"
          @click="store.fetchPosts(cat.value)"
          class="text-xs px-3 py-1 rounded-full"
          :class="activeCategory === cat.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'"
        >
          {{ cat.label }}
        </button>
      </div>

      <!-- Posts List -->
      <div v-if="loading" class="text-sm text-gray-500">加载中...</div>
      <div v-else-if="error" class="text-sm text-red-500">{{ error }}</div>
      <div v-else class="grid grid-cols-1 gap-3">
        <PostCard
          v-for="post in posts"
          :key="post.id"
          :post="post"
          @click="goToPost(post.id)"
        />
        <div v-if="!posts.length" class="text-sm text-gray-400 text-center py-8">
          暂无帖子，快来发第一篇吧！
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCommunityStore } from '../stores/community';
import { storeToRefs } from 'pinia';
import AppHeader from '../components/AppHeader.vue';
import PostCard from '../components/PostCard.vue';

const router = useRouter();
const store = useCommunityStore();
const { posts, loading, error } = storeToRefs(store);

const showNewPost = ref(false);
const activeCategory = ref('');
const newPost = ref({
  title: '',
  content: '',
  category: 'discussion',
  tagsStr: '',
});

const categories = [
  { value: '', label: '全部' },
  { value: 'discussion', label: '讨论' },
  { value: 'showcase', label: '作品展示' },
  { value: 'help', label: '求助' },
  { value: 'feedback', label: '反馈' },
];

onMounted(() => {
  store.fetchPosts();
});

function goToPost(id: string) {
  router.push(`/community/${id}`);
}

async function submitPost() {
  const tags = newPost.value.tagsStr
    ? newPost.value.tagsStr.split(',').map((t) => t.trim()).filter(Boolean)
    : undefined;
  await store.createPost({
    title: newPost.value.title,
    content: newPost.value.content,
    category: newPost.value.category,
    tags,
  });
  newPost.value = { title: '', content: '', category: 'discussion', tagsStr: '' };
  showNewPost.value = false;
}
</script>
