import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PostEntity } from '../../database/entities/post.entity';
import { CommentEntity } from '../../database/entities/comment.entity';
import { LikeEntity } from '../../database/entities/like.entity';
import { UserStatsEntity } from '../../database/entities/user-stats.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { AchievementService } from '../achievement/achievement.service';
import { CreatePostDto, UpdatePostDto, CreateCommentDto, LikeDto } from './dto/community.dto';

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(PostEntity) private posts: Repository<PostEntity>,
    @InjectRepository(CommentEntity) private comments: Repository<CommentEntity>,
    @InjectRepository(LikeEntity) private likes: Repository<LikeEntity>,
    @InjectRepository(UserStatsEntity) private statsRepo: Repository<UserStatsEntity>,
    @InjectRepository(UserEntity) private users: Repository<UserEntity>,
    private dataSource: DataSource,
    @Inject(forwardRef(() => AchievementService)) private achievements: AchievementService,
  ) {}

  // ---- Posts ----
  async listPosts(category?: string, page = 1, limit = 20, userId?: string) {
    const qb = this.posts.createQueryBuilder('p')
      .leftJoinAndSelect(UserEntity, 'u', 'u.id = p.authorId')
      .select([
        'p.id AS id', 'p.authorId AS "authorId"', 'p.title AS title',
        'p.content AS content', 'p.category AS category', 'p.tags AS tags',
        'p.likeCount AS "likeCount"', 'p.commentCount AS "commentCount"',
        'p.createdAt AS "createdAt"', 'p.updatedAt AS "updatedAt"',
        'u.name AS "authorName"', 'u.avatar AS "authorAvatar"',
      ])
      .orderBy('p.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (category) qb.andWhere('p.category = :category', { category });

    const raw = await qb.getRawMany();
    const total = await this.posts.count({ where: category ? { category: category as any } : {} });

    const items = raw.map((r: any) => ({
      ...r,
      tags: r.tags ?? [],
      liked: false, // simplified; would need to check likes table
    }));

    return { items, total, page, limit };
  }

  async getPost(id: string, userId?: string) {
    const post = await this.posts.findOne({ where: { id } });
    if (!post) throw new NotFoundException('post not found');
    const author = await this.users.findOne({ where: { id: post.authorId } });
    let liked = false;
    if (userId) {
      liked = !!(await this.likes.findOne({ where: { userId, targetType: 'post', targetId: id } }));
    }
    return {
      ...post,
      authorName: author?.name ?? '未知',
      authorAvatar: author?.avatar ?? null,
      liked,
    };
  }

  async createPost(userId: string, dto: CreatePostDto) {
    const post = await this.posts.save(this.posts.create({
      authorId: userId,
      title: dto.title,
      content: dto.content,
      category: dto.category as any,
      tags: dto.tags ?? [],
    }));
    await this.incStats(userId, { postCount: 1, totalPoints: 5 });
    await this.achievements.checkAchievements(userId);
    return post;
  }

  async updatePost(id: string, userId: string, dto: UpdatePostDto) {
    const post = await this.posts.findOne({ where: { id } });
    if (!post) throw new NotFoundException('post not found');
    if (post.authorId !== userId) throw new ForbiddenException('not the author');
    Object.assign(post, dto);
    return this.posts.save(post);
  }

  async deletePost(id: string, userId: string) {
    const post = await this.posts.findOne({ where: { id } });
    if (!post) throw new NotFoundException('post not found');
    if (post.authorId !== userId) throw new ForbiddenException('not the author');
    await this.posts.delete(id);
    await this.incStats(userId, { postCount: -1, totalPoints: -5 });
  }

  // ---- Comments ----
  async listComments(postId: string, userId?: string) {
    const comments = await this.comments.find({
      where: { postId },
      order: { createdAt: 'ASC' },
    });
    const userIds = [...new Set(comments.map((c) => c.authorId))];
    const users = await this.users.createQueryBuilder('u')
      .where('u.id IN (:...ids)', { ids: userIds })
      .getMany();
    const userMap = new Map(users.map((u) => [u.id, u]));

    let likedIds: Set<string> = new Set();
    if (userId) {
      const likes = await this.likes.find({
        where: { userId, targetType: 'comment' },
      });
      likedIds = new Set(likes.map((l) => l.targetId));
    }

    return comments.map((c) => {
      const u = userMap.get(c.authorId);
      return {
        ...c,
        authorName: u?.name ?? '未知',
        authorAvatar: u?.avatar ?? null,
        liked: likedIds.has(c.id),
      };
    });
  }

  async createComment(postId: string, userId: string, dto: CreateCommentDto) {
    const post = await this.posts.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('post not found');

    const comment = await this.comments.save(this.comments.create({
      postId,
      authorId: userId,
      content: dto.content,
      parentId: dto.parentId ?? null,
    }));

    post.commentCount += 1;
    await this.posts.save(post);
    await this.incStats(userId, { commentCount: 1, totalPoints: 2 });
    await this.achievements.checkAchievements(userId);

    return comment;
  }

  async deleteComment(id: string, userId: string) {
    const comment = await this.comments.findOne({ where: { id } });
    if (!comment) throw new NotFoundException('comment not found');
    if (comment.authorId !== userId) throw new ForbiddenException('not the author');

    const post = await this.posts.findOne({ where: { id: comment.postId } });
    if (post) {
      post.commentCount = Math.max(0, post.commentCount - 1);
      await this.posts.save(post);
    }

    await this.comments.delete(id);
    await this.incStats(userId, { commentCount: -1, totalPoints: -2 });
  }

  // ---- Likes ----
  async toggleLike(userId: string, dto: LikeDto) {
    const existing = await this.likes.findOne({
      where: { userId, targetType: dto.targetType as any, targetId: dto.targetId },
    });

    if (existing) {
      // unlike
      await this.likes.delete(existing.id);
      if (dto.targetType === 'post') {
        await this.posts.decrement({ id: dto.targetId }, 'likeCount', 1);
      } else {
        await this.comments.decrement({ id: dto.targetId }, 'likeCount', 1);
      }
      return { liked: false };
    }

    await this.likes.save(this.likes.create({
      userId,
      targetType: dto.targetType as any,
      targetId: dto.targetId,
    }));

    if (dto.targetType === 'post') {
      await this.posts.increment({ id: dto.targetId }, 'likeCount', 1);
      const post = await this.posts.findOne({ where: { id: dto.targetId } });
      if (post) {
        await this.incStats(post.authorId, { likeReceivedCount: 1, totalPoints: 1 });
        await this.achievements.checkAchievements(post.authorId);
      }
    } else {
      await this.comments.increment({ id: dto.targetId }, 'likeCount', 1);
      const comment = await this.comments.findOne({ where: { id: dto.targetId } });
      if (comment) {
        await this.incStats(comment.authorId, { likeReceivedCount: 1, totalPoints: 1 });
        await this.achievements.checkAchievements(comment.authorId);
      }
    }

    return { liked: true };
  }

  // ---- Leaderboard ----
  async getLeaderboard(limit = 20) {
    const stats = await this.statsRepo.find({
      order: { totalPoints: 'DESC' },
      take: limit,
    });
    const userIds = stats.map((s) => s.userId);
    const users = await this.users.createQueryBuilder('u')
      .where('u.id IN (:...ids)', { ids: userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000'] })
      .getMany();
    const userMap = new Map(users.map((u) => [u.id, u]));

    return stats.map((s, i) => ({
      userId: s.userId,
      userName: userMap.get(s.userId)?.name ?? '未知',
      avatar: userMap.get(s.userId)?.avatar ?? null,
      totalPoints: s.totalPoints,
      level: s.level,
      rank: i + 1,
    }));
  }

  // ---- Stats helper ----
  async getOrCreateStats(userId: string) {
    let stats = await this.statsRepo.findOne({ where: { userId } });
    if (!stats) {
      stats = this.statsRepo.create({ userId, totalPoints: 0, postCount: 0, commentCount: 0, likeReceivedCount: 0, level: 1 });
      await this.statsRepo.save(stats);
    }
    return stats;
  }

  async incStats(userId: string, deltas: Partial<Pick<UserStatsEntity, 'totalPoints' | 'postCount' | 'commentCount' | 'likeReceivedCount'>>) {
    const stats = await this.getOrCreateStats(userId);
    if (deltas.totalPoints) stats.totalPoints = Math.max(0, stats.totalPoints + deltas.totalPoints);
    if (deltas.postCount) stats.postCount = Math.max(0, stats.postCount + deltas.postCount);
    if (deltas.commentCount) stats.commentCount = Math.max(0, stats.commentCount + deltas.commentCount);
    if (deltas.likeReceivedCount) stats.likeReceivedCount = Math.max(0, stats.likeReceivedCount + deltas.likeReceivedCount);
    stats.level = Math.floor(stats.totalPoints / 100) + 1;
    await this.statsRepo.save(stats);
  }
}
