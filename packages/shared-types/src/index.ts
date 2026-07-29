export type UserRole = 'admin' | 'user';
export type CollaboratorRole = 'owner' | 'editor' | 'viewer';
export type WorkflowVisibility = 'private' | 'unlisted' | 'public';
export type TaskStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'cancelled';

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: UserRole;
  createdAt: string;
}

export interface WorkflowDTO {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  visibility: WorkflowVisibility;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyDTO {
  id: string;
  provider: string;
  createdAt: string;
  // 不返回 encryptedKey
}

export interface TaskDTO {
  id: string;
  workflowId: string;
  nodeId: string;
  kind: string;
  status: TaskStatus;
  input: unknown;
  output: unknown;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

// P2 文本创作引擎
export type ProjectType = 'novel' | 'script' | 'article';
export type BlockType = 'text' | 'dialogue' | 'action' | 'heading' | 'parenthetical' | 'transition';
export type SceneLocation = 'INT' | 'EXT' | 'INT./EXT.';
export type SceneTime = 'DAY' | 'NIGHT' | 'DAWN' | 'DUSK' | 'CONTINUOUS';

export interface ProjectDTO {
  id: string;
  title: string;
  type: ProjectType;
  ownerId: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChapterDTO {
  id: string;
  projectId: string;
  title: string;
  orderIndex: number;
}

export interface SceneDTO {
  id: string;
  chapterId: string;
  title: string;
  location: SceneLocation | null;
  time: SceneTime | null;
  characters: string[];
  orderIndex: number;
}

export interface BlockDTO {
  id: string;
  sceneId: string;
  type: BlockType;
  content: unknown;
  meta: Record<string, unknown>;
  orderIndex: number;
}

export interface CharacterDTO {
  id: string;
  projectId: string;
  name: string;
  description: string;
  aliases: string[];
}

export interface PropDTO {
  id: string;
  projectId: string;
  name: string;
  description: string;
}

export interface AiPromptRequest {
  operation: 'generate' | 'expand' | 'compress' | 'polish' | 'check' | 'outline' | 'nextScene';
  prompt: string;
  context?: string;
  style?: string;
  projectId?: string;
  sceneId?: string;
}

export interface AiPromptResult {
  output: string;
  meta: { model: string; usage?: Record<string, number> };
}

export interface SceneBreakdownItem {
  sceneNo: number;
  location: string;
  time: string;
  characters: string[];
  actionSummary: string;
}

export interface NovelToScriptResult {
  scenes: SceneBreakdownItem[];
}

// P3 AI 物品图片生成
export type ImageType = 'character' | 'prop' | 'scene' | 'other';
export type ImageModel = 'sd' | 'dalle' | 'midjourney';

export interface ImageDTO {
  id: string;
  projectId: string;
  type: ImageType;
  referenceId: string | null;
  prompt: string;
  model: ImageModel;
  url: string;
  thumbnailUrl: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateImageRequest {
  type: ImageType;
  referenceId?: string;
  prompt: string;
  model: ImageModel;
  style?: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
}

// P4 分镜提示词与剧集生成
export type ShotType = 'wide' | 'medium' | 'closeup' | 'extreme_closeup' | 'over_shoulder' | 'aerial';
export type ShotStatus = 'draft' | 'pending' | 'generating' | 'completed' | 'failed';
export type VideoModel = 'runway' | 'pika' | 'svd';

export interface ShotDTO {
  id: string;
  projectId: string;
  sceneId: string;
  sequence: number;
  shotType: ShotType;
  description: string;
  prompt: string;
  negativePrompt: string | null;
  referenceImageId: string | null;
  videoUrl: string | null;
  duration: number;
  status: ShotStatus;
  model: VideoModel;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateShotRequest {
  sceneId: string;
  shotType?: ShotType;
  description?: string;
  prompt?: string;
  negativePrompt?: string;
  referenceImageId?: string;
  duration?: number;
}

export interface GenerateVideoRequest {
  shotId: string;
  model: VideoModel;
  prompt?: string;
  referenceImageId?: string;
  duration?: number;
}

// P5 个性化学习路径推荐
export type SkillDimension = 'writing' | 'directing' | 'art' | 'technical';
export type UserLevel = 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type LearningEventType =
  | 'project_created'
  | 'scene_completed'
  | 'chapter_finished'
  | 'image_generated'
  | 'shot_completed'
  | 'video_generated'
  | 'ai_assisted'
  | 'novel_to_script'
  | 'tutorial_viewed'
  | 'collab_joined';

export type LearningContentType = 'tutorial' | 'template' | 'challenge' | 'tip';
export type LearningPathStatus = 'active' | 'completed' | 'paused';

export interface SkillProfileDTO {
  id: string;
  userId: string;
  writing: number;
  directing: number;
  art: number;
  technical: number;
  overall: number;
  level: UserLevel;
  updatedAt: string;
}

export interface LearningEventDTO {
  id: string;
  userId: string;
  eventType: LearningEventType;
  entityType: 'project' | 'scene' | 'shot' | 'image' | 'chapter' | null;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface LearningPathStep {
  stepNo: number;
  title: string;
  type: LearningContentType;
  status: 'locked' | 'available' | 'completed';
  contentId: string | null;
}

export interface LearningPathDTO {
  id: string;
  userId: string;
  title: string;
  description: string;
  steps: LearningPathStep[];
  status: LearningPathStatus;
  progress: number;
  createdAt: string;
}

export interface LearningContentDTO {
  id: string;
  type: LearningContentType;
  category: SkillDimension;
  title: string;
  description: string;
  difficulty: number;
  content: string;
  tags: string[];
  prerequisites: { skills: Partial<Record<SkillDimension, number>> } | null;
}

export interface LearningRecommendationDTO {
  content: LearningContentDTO;
  reason: string;
  matchedSkill: SkillDimension;
}

export interface CreateLearningEventRequest {
  eventType: LearningEventType;
  entityType?: 'project' | 'scene' | 'shot' | 'image' | 'chapter';
  entityId?: string;
  metadata?: Record<string, unknown>;
}

// P6 社区交流及成就激励系统
export type PostCategory = 'showcase' | 'help' | 'discussion' | 'feedback';
export type LikeTargetType = 'post' | 'comment';
export type AchievementCategory = 'creation' | 'social' | 'learning' | 'milestone';

export interface PostDTO {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  title: string;
  content: string;
  category: PostCategory;
  tags: string[];
  likeCount: number;
  commentCount: number;
  liked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommentDTO {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  content: string;
  parentId: string | null;
  likeCount: number;
  liked: boolean;
  createdAt: string;
}

export interface AchievementDTO {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  points: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface UserStatsDTO {
  userId: string;
  totalPoints: number;
  postCount: number;
  commentCount: number;
  likeReceivedCount: number;
  level: number;
}

export interface LeaderboardEntryDTO {
  userId: string;
  userName: string;
  avatar: string | null;
  totalPoints: number;
  level: number;
  rank: number;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  category: PostCategory;
  tags?: string[];
}

export interface CreateCommentRequest {
  content: string;
  parentId?: string;
}

export interface LikeRequest {
  targetType: LikeTargetType;
  targetId: string;
}
