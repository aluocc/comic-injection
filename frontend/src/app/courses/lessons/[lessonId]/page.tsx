"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiGet, ApiError } from "@/lib/api";
import {
  type LessonDetail,
  LESSON_TYPE_META,
} from "@/lib/types";

/**
 * Lesson detail placeholder page.
 *
 * Fetches a single lesson by id and displays its title, type, duration and
 * parent unit/level context. The "开始学习" button is a placeholder — the
 * actual interactive learning flow will be wired in Tasks 4-7.
 */
export default function LessonDetailPage() {
  const params = useParams<{ lessonId: string }>();
  const lessonId = params?.lessonId ?? '';

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiGet<LessonDetail>(
          `/courses/lessons/${encodeURIComponent(lessonId)}`,
        );
        if (!cancelled) setLesson(data);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError) {
          setError(err.message || "加载课时失败");
        } else {
          setError("网络异常，请稍后重试");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  const meta = useMemo(
    () => (lesson ? LESSON_TYPE_META[lesson.type] : null),
    [lesson],
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-foreground/60">
        <Link href="/courses" className="hover:text-brand-600">
          课程
        </Link>
        <span>/</span>
        {lesson && (
          <>
            <span className="text-foreground">
              {lesson.level.code} · {lesson.level.name}
            </span>
            <span>/</span>
            <span className="text-foreground">{lesson.unit.title}</span>
            <span>/</span>
            <span className="text-foreground/80">{lesson.title}</span>
          </>
        )}
        {!lesson && !error && <span>加载中…</span>}
      </nav>

      {error && (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-300">
          {error}
        </div>
      )}

      {!lesson && !error && (
        <div className="h-48 animate-pulse rounded-2xl border border-brand-100 bg-brand-50/40 dark:border-brand-900 dark:bg-transparent" />
      )}

      {lesson && meta && (
        <article className="rounded-2xl border border-brand-100 bg-white p-8 shadow-sm dark:border-brand-900 dark:bg-transparent">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-3xl dark:bg-brand-900/40">
              {meta.icon}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                  {meta.label}
                </span>
                <span className="rounded-md bg-accent-100 px-2 py-0.5 text-xs font-medium text-accent-700 dark:bg-accent-700/20 dark:text-accent-400">
                  {lesson.duration} 分钟
                </span>
                <span className="text-xs text-foreground/40">
                  课时 {lesson.order}
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight">
                {lesson.title}
              </h1>
              <p className="mt-1 text-xs text-foreground/50">
                {lesson.level.code} · {lesson.level.name} · {lesson.unit.title}
              </p>
            </div>
          </div>

          {lesson.description && (
            <p className="mt-6 text-sm leading-relaxed text-foreground/70">
              {lesson.description}
            </p>
          )}

          {/* Task 4: vocabulary memory entry — shown for vocabulary / mixed lessons */}
          {(lesson.type === 'vocabulary' || lesson.type === 'mixed') && (
            <Link
              href={`/courses/lessons/${lesson.id}/vocabulary`}
              className="group mt-8 flex items-center gap-4 rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50 to-violet-500/10 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-brand-800 dark:from-brand-900/20"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm dark:bg-transparent">
                📖
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-foreground">
                    单词记忆
                  </h2>
                  <span className="rounded-md bg-brand-600 px-2 py-0.5 text-xs font-medium text-white">
                    卡片翻转
                  </span>
                </div>
                <p className="mt-1 text-sm text-foreground/60">
                  翻转卡片记忆单词，使用 SM-2 间隔复习算法巩固学习效果。
                </p>
              </div>
              <span className="text-sm font-semibold text-brand-700 transition-transform group-hover:translate-x-0.5 dark:text-brand-300">
                开始 →
              </span>
            </Link>
          )}

          {/* Task 5: grammar practice entry — shown for grammar / mixed lessons */}
          {(lesson.type === 'grammar' || lesson.type === 'mixed') && (
            <Link
              href={`/courses/lessons/${lesson.id}/grammar`}
              className="group mt-4 flex items-center gap-4 rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50 to-accent-500/10 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-brand-800 dark:from-brand-900/20"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm dark:bg-transparent">
                ✍️
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-foreground">
                    语法练习
                  </h2>
                  <span className="rounded-md bg-accent-600 px-2 py-0.5 text-xs font-medium text-white">
                    选择 / 填空 / 改错
                  </span>
                </div>
                <p className="mt-1 text-sm text-foreground/60">
                  通过选择、填空、改错三种题型巩固语法，提交后查看解析与正确答案。
                </p>
              </div>
              <span className="text-sm font-semibold text-brand-700 transition-transform group-hover:translate-x-0.5 dark:text-brand-300">
                开始 →
              </span>
            </Link>
          )}

          {/* Task 6: speaking read-along entry — shown for speaking / mixed lessons */}
          {(lesson.type === 'speaking' || lesson.type === 'mixed') && (
            <Link
              href={`/courses/lessons/${lesson.id}/speaking`}
              className="group mt-4 flex items-center gap-4 rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50 to-rose-500/10 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-brand-800 dark:from-brand-900/20"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm dark:bg-transparent">
                🎤
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-foreground">
                    口语跟读
                  </h2>
                  <span className="rounded-md bg-rose-500 px-2 py-0.5 text-xs font-medium text-white">
                    录音 / 朗读
                  </span>
                </div>
                <p className="mt-1 text-sm text-foreground/60">
                  听原音示范，跟读并录音（或手动输入），系统按词级相似度评分并逐词高亮反馈。
                </p>
              </div>
              <span className="text-sm font-semibold text-brand-700 transition-transform group-hover:translate-x-0.5 dark:text-brand-300">
                开始 →
              </span>
            </Link>
          )}

          {/* Task 7: listening practice entry — shown for listening / mixed lessons */}
          {(lesson.type === 'listening' || lesson.type === 'mixed') && (
            <Link
              href={`/courses/lessons/${lesson.id}/listening`}
              className="group mt-4 flex items-center gap-4 rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50 to-sky-500/10 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-brand-800 dark:from-brand-900/20"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm dark:bg-transparent">
                🎧
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-foreground">
                    听力训练
                  </h2>
                  <span className="rounded-md bg-sky-500 px-2 py-0.5 text-xs font-medium text-white">
                    选择 / 填空 / 判断
                  </span>
                </div>
                <p className="mt-1 text-sm text-foreground/60">
                  播放音频并作答，提交后查看对错与正确答案，完成后展示原文复盘与正确率统计。
                </p>
              </div>
              <span className="text-sm font-semibold text-brand-700 transition-transform group-hover:translate-x-0.5 dark:text-brand-300">
                开始 →
              </span>
            </Link>
          )}

          {lesson.type !== 'vocabulary' &&
            lesson.type !== 'grammar' &&
            lesson.type !== 'speaking' &&
            lesson.type !== 'listening' &&
            lesson.type !== 'mixed' && (
              <div className="mt-8 rounded-xl border border-dashed border-brand-200 bg-brand-50/40 p-6 text-center dark:border-brand-800 dark:bg-brand-900/10">
                <p className="text-sm text-foreground/60">
                  互动学习内容即将上线。
                </p>
              </div>
            )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
            >
              开始学习
            </button>
            <Link
              href="/courses"
              className="rounded-xl border border-brand-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 dark:border-brand-800 dark:bg-transparent dark:text-brand-300"
            >
              返回课程列表
            </Link>
          </div>
        </article>
      )}
    </div>
  );
}
