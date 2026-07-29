<template>
  <div>
    <AppHeader />
    <main class="p-4 max-w-5xl mx-auto">
      <h1 class="text-xl font-bold mb-4">学习仪表盘</h1>

      <div v-if="loading" class="text-sm text-gray-500">加载中...</div>
      <div v-else-if="error" class="text-sm text-red-500">{{ error }}</div>
      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Skill Radar -->
        <div class="md:col-span-1 bg-white rounded-lg border p-4">
          <h2 class="text-sm font-semibold mb-3">技能画像</h2>
          <SkillRadar
            v-if="profile"
            :writing="profile.writing"
            :directing="profile.directing"
            :art="profile.art"
            :technical="profile.technical"
            :overall="profile.overall"
            :level="profile.level"
          />
        </div>

        <!-- Learning Path -->
        <div class="md:col-span-2 bg-white rounded-lg border p-4">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-semibold">{{ path?.title ?? '学习路径' }}</h2>
            <span class="text-xs text-gray-500">进度 {{ path?.progress ?? 0 }}%</span>
          </div>
          <div class="w-full bg-gray-100 rounded-full h-2 mb-4">
            <div
              class="bg-blue-600 h-2 rounded-full transition-all"
              :style="{ width: `${path?.progress ?? 0}%` }"
            />
          </div>
          <LearningPathTimeline
            v-if="path"
            :steps="path.steps"
            @complete="onCompleteStep"
          />
        </div>

        <!-- Recommendations -->
        <div class="md:col-span-3 bg-white rounded-lg border p-4">
          <h2 class="text-sm font-semibold mb-3">为你推荐</h2>
          <div v-if="!recommendations.length" class="text-sm text-gray-400">暂无推荐</div>
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <RecommendationCard
              v-for="rec in recommendations"
              :key="rec.content.id"
              :content="rec.content"
              :reason="rec.reason"
              :matchedSkill="rec.matchedSkill"
            />
          </div>
        </div>

        <!-- Recent Events -->
        <div class="md:col-span-3 bg-white rounded-lg border p-4">
          <h2 class="text-sm font-semibold mb-3">最近动态</h2>
          <div v-if="!events.length" class="text-sm text-gray-400">暂无动态</div>
          <ul v-else class="space-y-2">
            <li
              v-for="event in events"
              :key="event.id"
              class="text-xs text-gray-600 flex items-center gap-2"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span class="font-medium">{{ eventTypeLabel(event.eventType) }}</span>
              <span class="text-gray-400">{{ new Date(event.createdAt).toLocaleString() }}</span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useLearningStore } from '../stores/learning';
import { storeToRefs } from 'pinia';
import AppHeader from '../components/AppHeader.vue';
import SkillRadar from '../components/SkillRadar.vue';
import LearningPathTimeline from '../components/LearningPathTimeline.vue';
import RecommendationCard from '../components/RecommendationCard.vue';

const store = useLearningStore();
const { profile, path, recommendations, events, loading, error } = storeToRefs(store);

onMounted(() => {
  store.fetchProfile();
  store.fetchPath();
  store.fetchRecommendations();
  store.fetchEvents();
});

function onCompleteStep(stepNo: number) {
  store.completeStep(stepNo);
}

function eventTypeLabel(type: string) {
  const map: Record<string, string> = {
    project_created: '创建项目',
    scene_completed: '完成场景',
    chapter_finished: '完成章节',
    image_generated: '生成图片',
    shot_completed: '完成分镜',
    video_generated: '生成视频',
    ai_assisted: '使用 AI 辅助',
    novel_to_script: '小说转剧本',
    tutorial_viewed: '查看教程',
    collab_joined: '加入协作',
  };
  return map[type] ?? type;
}
</script>
