"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { LessonDetail, Vocabulary, ReviewGrade } from "@/lib/types";

/**
 * Vocabulary flashcard page (Task 4.3).
 *
 * Flow:
 * 1. Fetch the lesson detail (for title/type) + the lesson's vocabularies.
 * 2. Show one card at a time. Click the card to flip it (front: word +
 *    phonetic; back: translation + example).
 * 3. Three grade buttons under the card: 不记得 (AGAIN) / 记得 (GOOD) /
 *    很简单 (EASY). Clicking submits POST /vocabulary/:id/review and
 *    advances to the next card.
 * 4. After the last card, show a round summary (total + average score).
 *
 * Grade → score mapping (mirrors the SM-2 quality): AGAIN=0, GOOD=3, EASY=5.
 */
const GRADE_SCORE: Record<ReviewGrade, number> = {
  AGAIN: 0,
  GOOD: 3,
  EASY: 5,
};

const GRADE_LABEL: Record<ReviewGrade, string> = {
  AGAIN: "不记得",
  GOOD: "记得",
  EASY: "很简单",
};

export default function VocabularyPage() {
  const params = useParams<{ lessonId: string }>();
  const lessonId = params?.lessonId ?? "";

  const token = useAuthStore((s) => s.token);

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [vocabularies, setVocabularies] = useState<Vocabulary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scores, setScores] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  // Load lesson + vocabularies in parallel.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [lessonData, vocabData] = await Promise.all([
          apiGet<LessonDetail>(
            `/courses/lessons/${encodeURIComponent(lessonId)}`,
          ),
          apiGet<Vocabulary[]>(
            `/vocabulary/lesson/${encodeURIComponent(lessonId)}`,
          ),
        ]);
        if (cancelled) return;
        setLesson(lessonData);
        setVocabularies(vocabData);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError) {
          setError(err.message || "加载词汇失败");
        } else {
          setError("网络异常，请稍后重试");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  const current = vocabularies?.[index] ?? null;

  const advance = useCallback(() => {
    setFlipped(false);
    setSubmitting(false);
    setIndex((prev) => {
      const next = prev + 1;
      if (vocabularies && next >= vocabularies.length) {
        setDone(true);
        return prev;
      }
      return next;
    });
  }, [vocabularies]);

  const handleGrade = useCallback(
    async (grade: ReviewGrade) => {
      if (!current || submitting) return;
      if (!token) {
        setError("请先登录后再进行单词记忆，系统将跳转登录页。");
        return;
      }
      setSubmitting(true);
      try {
        await apiPost(`/vocabulary/${current.id}/review`, { grade });
        setScores((prev) => [...prev, GRADE_SCORE[grade]]);
        advance();
      } catch (err) {
        setSubmitting(false);
        if (err instanceof ApiError) {
          setError(err.message || "提交评分失败");
        } else {
          setError("网络异常，请稍后重试");
        }
      }
    },
    [current, submitting, token, advance],
  );

  const stats = useMemo(() => {
    if (scores.length === 0) return { total: 0, average: 0 };
    const sum = scores.reduce((a, b) => a + b, 0);
    return { total: scores.length, average: sum / scores.length };
  }, [scores]);

  const total = vocabularies?.length ?? 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-foreground/60">
        <Link href="/courses" className="hover:text-brand-600">
          课程
        </Link>
        <span>/</span>
        {lesson && (
          <>
            <Link
              href={`/courses/lessons/${lesson.id}`}
              className="hover:text-brand-600"
            >
              {lesson.title}
            </Link>
            <span>/</span>
            <span className="text-foreground/80">单词记忆</span>
          </>
        )}
        {!lesson && !error && <span>加载中…</span>}
      </nav>

      {error && (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {!vocabularies && !error && (
        <div className="h-72 animate-pulse rounded-2xl border border-brand-100 bg-brand-50/40 dark:border-brand-900 dark:bg-transparent" />
      )}

      {/* Empty state */}
      {vocabularies && vocabularies.length === 0 && !error && (
        <div className="rounded-2xl border border-brand-100 bg-white p-10 text-center text-sm text-foreground/60 dark:border-brand-900 dark:bg-transparent">
          本课时暂无词汇数据。
          <div className="mt-4">
            <Link
              href={`/courses/lessons/${lessonId}`}
              className="rounded-xl border border-brand-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 dark:border-brand-800 dark:bg-transparent dark:text-brand-300"
            >
              返回课时
            </Link>
          </div>
        </div>
      )}

      {/* Completion summary */}
      {done && vocabularies && vocabularies.length > 0 && (
        <div className="rounded-2xl border border-brand-100 bg-white p-8 text-center shadow-sm dark:border-brand-900 dark:bg-transparent">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-100 text-3xl dark:bg-accent-700/20">
            🎉
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight">本轮完成！</h2>
          <p className="mt-2 text-sm text-foreground/60">
            你已完成本课时 {stats.total} 个单词的记忆练习。
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4 dark:border-brand-900 dark:bg-brand-900/10">
              <div className="text-3xl font-bold text-brand-700 dark:text-brand-300">
                {stats.total}
              </div>
              <div className="mt-1 text-xs text-foreground/60">练习单词数</div>
            </div>
            <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4 dark:border-brand-900 dark:bg-brand-900/10">
              <div className="text-3xl font-bold text-brand-700 dark:text-brand-300">
                {stats.average.toFixed(2)}
              </div>
              <div className="mt-1 text-xs text-foreground/60">
                平均评分（满分 5）
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setIndex(0);
                setScores([]);
                setDone(false);
                setFlipped(false);
              }}
              className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
            >
              再来一轮
            </button>
            <Link
              href={`/courses/lessons/${lessonId}`}
              className="rounded-xl border border-brand-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 dark:border-brand-800 dark:bg-transparent dark:text-brand-300"
            >
              返回课时
            </Link>
          </div>
        </div>
      )}

      {/* Active flashcard */}
      {vocabularies &&
        vocabularies.length > 0 &&
        current &&
        !done && (
          <>
            <div className="mb-4 flex items-center justify-between text-sm text-foreground/60">
              <span>
                第 {index + 1} / {total} 张
              </span>
              <span>点击卡片可翻转查看答案</span>
            </div>

            {/* Progress bar */}
            <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-brand-100 dark:bg-brand-900/40">
              <div
                className="h-full rounded-full bg-brand-600 transition-all"
                style={{ width: `${((index) / total) * 100}%` }}
              />
            </div>

            {/* 3D flip card */}
            <div
              className="[perspective:1200px]"
              style={{ minHeight: "20rem" }}
            >
              <button
                type="button"
                onClick={() => setFlipped((f) => !f)}
                className="relative block h-80 w-full cursor-pointer text-left [transform-style:preserve-3d] transition-transform duration-500"
                style={{
                  transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
                aria-label="翻转卡片"
              >
                {/* Front face: word + phonetic */}
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-brand-100 bg-white p-8 shadow-sm [backface-visibility:hidden] dark:border-brand-900 dark:bg-transparent">
                  <span className="mb-3 rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                    单词
                  </span>
                  <div className="text-4xl font-bold tracking-tight sm:text-5xl">
                    {current.word}
                  </div>
                  {current.phonetic && (
                    <div className="mt-3 font-mono text-base text-foreground/60">
                      {current.phonetic}
                    </div>
                  )}
                  <div className="mt-6 text-xs text-foreground/40">
                    点击查看释义
                  </div>
                </div>

                {/* Back face: translation + example */}
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-violet-200 bg-gradient-to-br from-brand-50 to-violet-500/10 p-8 shadow-sm [backface-visibility:hidden] [transform:rotateY(180deg)] dark:border-violet-800">
                  <span className="mb-3 rounded-md bg-violet-500/15 px-2 py-0.5 text-xs font-medium text-violet-600 dark:text-violet-300">
                    释义
                  </span>
                  <div className="text-3xl font-bold tracking-tight sm:text-4xl">
                    {current.translation}
                  </div>
                  {current.example && (
                    <div className="mt-5 max-w-md text-center text-sm leading-relaxed text-foreground/70">
                      “{current.example}”
                      {current.exampleTranslation && (
                        <div className="mt-1 text-xs text-foreground/50">
                          {current.exampleTranslation}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </button>
            </div>

            {/* Grade buttons */}
            <div className="mt-8 grid grid-cols-3 gap-3">
              <GradeButton
                label={GRADE_LABEL.AGAIN}
                color="rose"
                disabled={submitting}
                onClick={() => handleGrade("AGAIN")}
              />
              <GradeButton
                label={GRADE_LABEL.GOOD}
                color="brand"
                disabled={submitting}
                onClick={() => handleGrade("GOOD")}
              />
              <GradeButton
                label={GRADE_LABEL.EASY}
                color="accent"
                disabled={submitting}
                onClick={() => handleGrade("EASY")}
              />
            </div>
            {submitting && (
              <p className="mt-3 text-center text-xs text-foreground/50">
                提交中…
              </p>
            )}
          </>
        )}
    </div>
  );
}

type GradeButtonProps = {
  color: "rose" | "brand" | "accent";
  disabled?: boolean;
  onClick: () => void;
};

function GradeButton({ label, color, disabled, onClick }: GradeButtonProps & { label: string }) {
  const palette: Record<
    GradeButtonProps["color"],
    { base: string; hover: string }
  > = {
    rose: {
      base: "border-rose-200 bg-white text-rose-700 dark:border-rose-900 dark:bg-transparent dark:text-rose-300",
      hover: "hover:bg-rose-50 dark:hover:bg-rose-900/20",
    },
    brand: {
      base: "border-brand-200 bg-white text-brand-700 dark:border-brand-900 dark:bg-transparent dark:text-brand-300",
      hover: "hover:bg-brand-50 dark:hover:bg-brand-900/20",
    },
    accent: {
      base: "border-accent-100 bg-white text-accent-700 dark:border-accent-700/30 dark:bg-transparent dark:text-accent-400",
      hover: "hover:bg-accent-50 dark:hover:bg-accent-700/20",
    },
  };
  const c = palette[color];
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-xl border px-4 py-3 text-sm font-semibold shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${c.base} ${c.hover}`}
    >
      {label}
    </button>
  );
}
