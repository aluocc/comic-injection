import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/login', component: () => import('../views/LoginView.vue') },
  { path: '/register', component: () => import('../views/RegisterView.vue') },
  { path: '/', component: () => import('../views/WorkspaceView.vue'), meta: { auth: true } },
  { path: '/workflows/:id', component: () => import('../views/WorkflowEditorView.vue'), meta: { auth: true } },
  { path: '/projects', component: () => import('../views/ProjectsView.vue'), meta: { auth: true } },
  { path: '/projects/:id/editor', component: () => import('../views/EditorView.vue'), meta: { auth: true } },
  { path: '/projects/:id/assets', component: () => import('../views/AssetsView.vue'), meta: { auth: true } },
  { path: '/projects/:id/shots', component: () => import('../views/ShotsView.vue'), meta: { auth: true } },
  { path: '/settings', component: () => import('../views/SettingsView.vue'), meta: { auth: true } },
  { path: '/learning', component: () => import('../views/LearningView.vue'), meta: { auth: true } },
  { path: '/community', component: () => import('../views/CommunityView.vue'), meta: { auth: true } },
  { path: '/community/:id', component: () => import('../views/PostDetailView.vue'), meta: { auth: true } },
  { path: '/achievements', component: () => import('../views/AchievementsView.vue'), meta: { auth: true } },
];

const router = createRouter({ history: createWebHistory(), routes });

router.beforeEach((to) => {
  if (to.meta.auth && !localStorage.getItem('accessToken')) return '/login';
});

export default router;
