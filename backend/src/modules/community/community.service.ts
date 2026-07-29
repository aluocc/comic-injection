import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ErrorCode } from '../../common/constants/error-code';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

/**
 * Seed circles created on first boot (Task 10.1).
 * Since seed.ts must not be modified, the service self-initialises the three
 * language circles in onModuleInit.
 */
const SEED_CIRCLES = [
  {
    languageCode: 'english',
    name: '英语圈',
    description: '英语学习者交流社区，分享学习心得、提问互助。',
    icon: '🇬🇧',
  },
  {
    languageCode: 'japanese',
    name: '日语圈',
    description: '日语学习者交流社区，一起讨论语法、词汇与考级。',
    icon: '🇯🇵',
  },
  {
    languageCode: 'korean',
    name: '韩语圈',
    description: '韩语学习者交流社区，交流韩剧、韩语学习经验。',
    icon: '🇰🇷',
  },
] as const;

/** Public author projection embedded inside Post/Comment responses. */
export interface AuthorDto {
  id: string;
  nickname: string;
  avatar: string | null;
}

export interface CircleDto {
  id: string;
  languageCode: string;
  name: string;
  description: string | null;
  icon: string | null;
  postCount: number;
  createdAt: string;
}

export interface PostListItemDto {
  id: string;
  circleId: string;
  title: string;
  content: string;
  tags: string[];
  likeCount: number;
  commentCount: number;
  author: AuthorDto;
  createdAt: string;
  updatedAt: string;
}

export interface CommentDto {
  id: string;
  postId: string;
  content: string;
  author: AuthorDto;
  createdAt: string;
}

export interface PostDetailDto extends PostListItemDto {
  comments: CommentDto[];
}

export interface PaginatedPostsDto {
  items: PostListItemDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ToggleLikeResultDto {
  liked: boolean;
  likeCount: number;
}

/**
 * CommunityService: circles, posts, comments and likes.
 *
 * Public read endpoints are anonymous; write endpoints require a JWT and
 * receive the authenticated user's id via the controller.
 */
@Injectable()
export class CommunityService implements OnModuleInit {
  private readonly logger = new Logger(CommunityService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.ensureCircles();
  }

  /** Ensure the three seed circles exist (idempotent). */
  private async ensureCircles(): Promise<void> {
    for (const c of SEED_CIRCLES) {
      const exists = await this.prisma.circle.findUnique({
        where: { languageCode: c.languageCode },
        select: { id: true },
      });
      if (!exists) {
        await this.prisma.circle.create({ data: { ...c } });
        this.logger.log(`Seeded circle "${c.languageCode}"`);
      }
    }
  }

  /** List all circles with their post counts. */
  async listCircles(): Promise<CircleDto[]> {
    const circles = await this.prisma.circle.findMany({
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { posts: true } } },
    });
    return circles.map((c) => ({
      id: c.id,
      languageCode: c.languageCode,
      name: c.name,
      description: c.description,
      icon: c.icon,
      postCount: c._count.posts,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  /** Resolve a circle by language code or throw 404. */
  private async requireCircle(langCode: string) {
    const circle = await this.prisma.circle.findUnique({
      where: { languageCode: langCode },
      select: { id: true },
    });
    if (!circle) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: `circle not found: ${langCode}`,
      });
    }
    return circle;
  }

  /** List posts in a circle, paginated (newest first). */
  async listPosts(
    langCode: string,
    page = 1,
    pageSize = 10,
  ): Promise<PaginatedPostsDto> {
    const circle = await this.requireCircle(langCode);
    const safePage = Math.max(1, Math.floor(page));
    const safeSize = Math.min(50, Math.max(1, Math.floor(pageSize)));

    const [total, posts] = await Promise.all([
      this.prisma.post.count({ where: { circleId: circle.id } }),
      this.prisma.post.findMany({
        where: { circleId: circle.id },
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safeSize,
        take: safeSize,
        include: {
          author: { select: { id: true, nickname: true, avatar: true } },
          _count: { select: { comments: true } },
        },
      }),
    ]);

    return {
      items: posts.map((p) => ({
        id: p.id,
        circleId: p.circleId,
        title: p.title,
        content: p.content,
        tags: p.tags,
        likeCount: p.likeCount,
        commentCount: p._count.comments,
        author: p.author,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      total,
      page: safePage,
      pageSize: safeSize,
      totalPages: Math.max(1, Math.ceil(total / safeSize)),
    };
  }

  /** Create a post in a circle. */
  async createPost(
    langCode: string,
    authorId: string,
    dto: CreatePostDto,
  ): Promise<PostListItemDto> {
    const circle = await this.requireCircle(langCode);
    const post = await this.prisma.post.create({
      data: {
        circleId: circle.id,
        authorId,
        title: dto.title.trim(),
        content: dto.content,
        tags: dto.tags ?? [],
      },
      include: {
        author: { select: { id: true, nickname: true, avatar: true } },
        _count: { select: { comments: true } },
      },
    });
    return {
      id: post.id,
      circleId: post.circleId,
      title: post.title,
      content: post.content,
      tags: post.tags,
      likeCount: post.likeCount,
      commentCount: post._count.comments,
      author: post.author,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  }

  /** Get a single post with comments (oldest first). */
  async getPost(postId: string): Promise<PostDetailDto> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: { select: { id: true, nickname: true, avatar: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, nickname: true, avatar: true } },
          },
        },
        _count: { select: { comments: true } },
      },
    });
    if (!post) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: `post not found: ${postId}`,
      });
    }
    return {
      id: post.id,
      circleId: post.circleId,
      title: post.title,
      content: post.content,
      tags: post.tags,
      likeCount: post.likeCount,
      commentCount: post._count.comments,
      author: post.author,
      comments: post.comments.map((c) => ({
        id: c.id,
        postId: c.postId,
        content: c.content,
        author: c.author,
        createdAt: c.createdAt.toISOString(),
      })),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  }

  /** Create a comment on a post. */
  async createComment(
    postId: string,
    authorId: string,
    dto: CreateCommentDto,
  ): Promise<CommentDto> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: `post not found: ${postId}`,
      });
    }
    const comment = await this.prisma.comment.create({
      data: {
        postId,
        authorId,
        content: dto.content,
      },
      include: {
        author: { select: { id: true, nickname: true, avatar: true } },
      },
    });
    return {
      id: comment.id,
      postId: comment.postId,
      content: comment.content,
      author: comment.author,
      createdAt: comment.createdAt.toISOString(),
    };
  }

  /** Toggle like on a post (atomic via transaction). */
  async toggleLike(
    postId: string,
    userId: string,
  ): Promise<ToggleLikeResultDto> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: `post not found: ${postId}`,
      });
    }

    const existing = await this.prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
      select: { id: true },
    });

    if (existing) {
      await this.prisma.$transaction([
        this.prisma.postLike.delete({ where: { id: existing.id } }),
        this.prisma.post.update({
          where: { id: postId },
          data: { likeCount: { decrement: 1 } },
        }),
      ]);
      const updated = await this.prisma.post.findUnique({
        where: { id: postId },
        select: { likeCount: true },
      });
      return { liked: false, likeCount: Math.max(0, updated?.likeCount ?? 0) };
    }

    await this.prisma.$transaction([
      this.prisma.postLike.create({ data: { postId, userId } }),
      this.prisma.post.update({
        where: { id: postId },
        data: { likeCount: { increment: 1 } },
      }),
    ]);
    const updated = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { likeCount: true },
    });
    return { liked: true, likeCount: updated?.likeCount ?? 1 };
  }

  /** Delete a post (only the author may delete). */
  async deletePost(
    postId: string,
    userId: string,
  ): Promise<{ deleted: true }> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });
    if (!post) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: `post not found: ${postId}`,
      });
    }
    if (post.authorId !== userId) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN,
        message: 'only the author can delete this post',
      });
    }
    // Remove dependent rows first to avoid FK constraint violations, since
    // the schema does not specify ON DELETE CASCADE.
    await this.prisma.$transaction([
      this.prisma.comment.deleteMany({ where: { postId } }),
      this.prisma.postLike.deleteMany({ where: { postId } }),
      this.prisma.post.delete({ where: { id: postId } }),
    ]);
    return { deleted: true };
  }
}
