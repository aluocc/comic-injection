import { defineStore } from 'pinia';
import { ref } from 'vue';
import { learningApi } from '../api/learning';
import type { SkillProfileDTO, LearningPathDTO, LearningRecommendationDTO, LearningContentDTO, LearningEventDTO } from '@comic-injection/shared-types';

export const useLearningStore = defineStore('learning', () => {
  const profile = ref<SkillProfileDTO | null>(null);
  const path = ref<LearningPathDTO | null>(null);
  const recommendations = ref<LearningRecommendationDTO[]>([]);
  const contents = ref<LearningContentDTO[]>([]);
  const events = ref<LearningEventDTO[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchProfile() {
    loading.value = true;
    error.value = null;
    try {
      profile.value = await learningApi.getProfile();
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  async function fetchPath() {
    loading.value = true;
    error.value = null;
    try {
      path.value = await learningApi.getPath();
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  async function completeStep(stepNo: number) {
    if (!path.value) return;
    path.value = await learningApi.completeStep(path.value.id, stepNo);
  }

  async function fetchRecommendations(limit = 5) {
    loading.value = true;
    error.value = null;
    try {
      recommendations.value = await learningApi.getRecommendations(limit);
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  async function fetchContents(category?: string) {
    loading.value = true;
    error.value = null;
    try {
      contents.value = await learningApi.listContents(category);
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  async function fetchEvents(limit = 20) {
    try {
      events.value = await learningApi.listEvents(limit);
    } catch {
      // ignore
    }
  }

  return {
    profile,
    path,
    recommendations,
    contents,
    events,
    loading,
    error,
    fetchProfile,
    fetchPath,
    completeStep,
    fetchRecommendations,
    fetchContents,
    fetchEvents,
  };
});
