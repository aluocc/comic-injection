import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ErrorCode } from '../../common/constants/error-code';

/**
 * Public projection types returned by the course endpoints.
 * We strip the foreign-key fields and expose a clean nested tree.
 */
export interface LanguageDto {
  id: string;
  code: string;
  name: string;
  icon: string | null;
}

/**
 * Per-lesson progress projection attached to each LessonDto when a JWT is
 * supplied. Mirrors the UserLessonProgress row.
 */
export interface LessonUserProgressDto {
  id: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  accuracy: number | null;
  timeSpent: number;
  completedAt: string | null;
  updatedAt: string;
}

export interface LessonDto {
  id: string;
  title: string;
  description: string | null;
  order: number;
  type: string;
  duration: number;
  /** Per-user progress; null when no JWT is supplied or no row exists yet. */
  userProgress: LessonUserProgressDto | null;
}

export interface UnitDto {
  id: string;
  title: string;
  description: string | null;
  order: number;
  lessons: LessonDto[];
}

export interface LevelDto {
  id: string;
  code: string;
  name: string;
  order: number;
  units: UnitDto[];
}

export interface LanguageTreeDto {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  levels: Array<LevelDto & { userProgress: unknown }>;
}

/**
 * CourseService: read-only access to the Language → Level → Unit → Lesson tree.
 *
 * All endpoints are public. When a JWT is supplied, `userProgress` is attached
 * to each lesson (queried from UserLessonProgress for the calling user).
 */
@Injectable()
export class CourseService {
  constructor(private readonly prisma: PrismaService) {}

  /** List all available languages. */
  async listLanguages(): Promise<LanguageDto[]> {
    const languages = await this.prisma.language.findMany({
      orderBy: { code: 'asc' },
    });
    return languages.map((l) => ({
      id: l.id,
      code: l.code,
      name: l.name,
      icon: l.icon,
    }));
  }

  /**
   * Return the full level/unit/lesson tree for a language.
   *
   * When `userId` is supplied (authenticated request), each lesson is
   * enriched with a `userProgress` field loaded from the UserLessonProgress
   * table. Anonymous requests get `userProgress: null`.
   */
  async getLanguageTree(
    langCode: string,
    userId?: string,
  ): Promise<LanguageTreeDto> {
    const language = await this.prisma.language.findUnique({
      where: { code: langCode },
      include: {
        levels: {
          orderBy: { order: 'asc' },
          include: {
            units: {
              orderBy: { order: 'asc' },
              include: {
                lessons: {
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!language) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: `language not found: ${langCode}`,
      });
    }

    // Collect every lesson id in the tree so we can bulk-load progress.
    const allLessonIds: string[] = [];
    for (const level of language.levels) {
      for (const unit of level.units) {
        for (const lesson of unit.lessons) {
          allLessonIds.push(lesson.id);
        }
      }
    }

    const progressByLesson = await this.loadProgressForLessons(
      userId,
      allLessonIds,
    );

    return {
      id: language.id,
      code: language.code,
      name: language.name,
      icon: language.icon,
      levels: language.levels.map((level) => ({
        id: level.id,
        code: level.code,
        name: level.name,
        order: level.order,
        // Per-level summary kept as null; per-lesson progress is attached
        // on each lesson below.
        userProgress: null,
        units: level.units.map((unit) => ({
          id: unit.id,
          title: unit.title,
          description: unit.description,
          order: unit.order,
          lessons: unit.lessons.map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            description: lesson.description,
            order: lesson.order,
            type: lesson.type,
            duration: lesson.duration,
            userProgress: progressByLesson.get(lesson.id) ?? null,
          })),
        })),
      })),
    };
  }

  /**
   * Bulk-load the calling user's UserLessonProgress rows for the given
   * lesson ids. Returns a Map keyed by lessonId. Anonymous callers
   * (`userId` falsy) get an empty map.
   */
  private async loadProgressForLessons(
    userId: string | undefined,
    lessonIds: string[],
  ): Promise<Map<string, LessonUserProgressDto>> {
    const map = new Map<string, LessonUserProgressDto>();
    if (!userId || lessonIds.length === 0) return map;

    const rows = await this.prisma.userLessonProgress.findMany({
      where: { userId, lessonId: { in: lessonIds } },
    });
    for (const row of rows) {
      map.set(row.lessonId, {
        id: row.id,
        status: row.status as LessonUserProgressDto['status'],
        accuracy: row.accuracy,
        timeSpent: row.timeSpent,
        completedAt: row.completedAt ? row.completedAt.toISOString() : null,
        updatedAt: row.updatedAt.toISOString(),
      });
    }
    return map;
  }

  /** Return a single lesson by id, including its parent unit/level context. */
  async getLesson(lessonId: string): Promise<LessonDetailDto> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        unit: {
          include: {
            level: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: `lesson not found: ${lessonId}`,
      });
    }

    return {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      order: lesson.order,
      type: lesson.type,
      duration: lesson.duration,
      // The single-lesson endpoint is anonymous-only; per-user progress is
      // surfaced via the tree endpoint (Task 8).
      userProgress: null,
      unit: {
        id: lesson.unit.id,
        title: lesson.unit.title,
        order: lesson.unit.order,
      },
      level: {
        id: lesson.unit.level.id,
        code: lesson.unit.level.code,
        name: lesson.unit.level.name,
        order: lesson.unit.level.order,
      },
    };
  }
}

export interface LessonDetailDto extends LessonDto {
  unit: { id: string; title: string; order: number };
  level: { id: string; code: string; name: string; order: number };
}
