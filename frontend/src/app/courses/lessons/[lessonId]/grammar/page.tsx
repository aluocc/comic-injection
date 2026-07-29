"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type {
  GrammarQuestion,
  GrammarQuestionType,
  GrammarCheckResult,
  LessonDetail,
} from "@/lib/types";

/**
 * Grammar practice page (Task 5.3).
 *
 * Flow:
 * 1. Fetch the lesson detail + the lesson's grammar questions.
 * 2. Render one question at a time, branched by `type`:
 *    - MULTIPLE_CHOICE: option buttons; clicking an option submits it.
 *    - FILL_BLANK: text input + submit button.
 *    - CORRECTION: text input (correct form) + submit button.
 * 3. After submitting, show isCorrect feedback + correct answer + explanation.
 *    A "下一题" button advances to the next question.
 * 4. After the last question, show a summary (total / correct / accuracy).
 */

const TYPE_LABEL: Record<GrammarQuestionType, string> = {
  MULTIPLE_CHOICE: "选择题",
  FILL_BLANK: "填空题",
  CORRECTION: "改错题",
};

type Feedback = GrammarCheckResult & { userAnswer: string };

export default function GrammarPage() {
  const params = useParams<{ lessonId: string }>();
  const lessonId = params?.lessonId ?? "";

  const token = useAuthStore((s) => s.token);

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [questions, setQuestions] = useState<GrammarQuestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [index, setIndex] = useState(0);
  const [textAnswer, setTextAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);

  // Load lesson + grammar questions in parallel.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [lessonData, questionData] = await Promise.all([
          apiGet<LessonDetail>(
            `/courses/lessons/${encodeURIComponent(lessonId)}`,
          ),
          apiGet<GrammarQuestion[]>(
            `/grammar/lesson/${encodeURIComponent(lessonId)}`,
          ),
        ]);
        if (cancelled) return;
        setLesson(lessonData);
        setQuestions(questionData);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError) {
          setError(err.message || "加载语法题目失败");
        } else {
          setError("网络异常，请稍后重试");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  const current = questions?.[index] ?? null;

  const resetForNext = useCallback(() => {
    setTextAnswer("");
    setSubmitting(false);
    setFeedback(null);
  }, []);

  const advance = useCallback(() => {
    setIndex((prev) => {
      const next = prev + 1;
      if (questions && next >= questions.length) {
        setDone(true);
        return prev;
      }
      return next;
    });
    resetForNext();
  }, [questions, resetForNext]);

  const submit = useCallback(
    async (answer: string) => {
      if (!current || submitting || feedback) return;
      const trimmed = answer.trim();
      if (!trimmed) {
        setError("请先填写答案再提交。");
        return;
      }
      if (!token) {
        setError("请先登录后再进行语法练习，系统将跳转登录页。");
        return;
      }
      setSubmitting(true);
      setError(null);
      try {
        const result = await apiPost<GrammarCheckResult>(
          `/grammar/${current.id}/check`,
          { userAnswer: trimmed },
        );
        setFeedback({ ...result, userAnswer: trimmed });
        setResults((prev) => [...prev, result.isCorrect]);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message || "提交答案失败");
        } else {
          setError("网络异常，请稍后重试");
        }
      } finally {
        setSubmitting(false);
      }
    },
    [current, submitting, feedback, token],
  );

  const handleOptionClick = useCallback(
    (option: string) => {
      if (submitting || feedback) return;
      void submit(option);
    },
    [submit, submitting, feedback],
  );

  const handleTextSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      void submit(textAnswer);
    },
    [submit, textAnswer],
  );

  const stats = useMemo(() => {
    const total = results.length;
    const correct = results.filter(Boolean).length;
    const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);
    return { total, correct, accuracy };
  }, [results]);

  const total = questions?.length ?? 0;

  const restart = useCallback(() => {
    setIndex(0);
    setResults([]);
    setDone(false);
    resetForNext();
  }, [resetForNext]);

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
            <span className="text-foreground/80">语法练习</span>
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
      {!questions && !error && (
        <div className="h-72 animate-pulse rounded-2xl border border-brand-100 bg-brand-50/40 dark:border-brand-900 dark:bg-transparent" />
      )}

      {/* Empty state */}
      {questions && questions.length === 0 && !error && (
        <div className="rounded-2xl border border-brand-100 bg-white p-10 text-center text-sm text-foreground/60 dark:border-brand-900 dark:bg-transparent">
          本课时暂无语法题目。
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
      {done && questions && questions.length > 0 && (
        <div className="rounded-2xl border border-brand-100 bg-white p-8 text-center shadow-sm dark:border-brand-900 dark:bg-transparent">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-100 text-3xl dark:bg-accent-700/20">
            🎉
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight">练习完成！</h2>
          <p className="mt-2 text-sm text-foreground/60">
            你已完成本课时 {stats.total} 道语法题。
          </p>
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4 dark:border-brand-900 dark:bg-brand-900/10">
              <div className="text-3xl font-bold text-brand-700 dark:text-brand-300">
                {stats.total}
              </div>
              <div className="mt-1 text-xs text-foreground/60">总题数</div>
            </div>
            <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4 dark:border-brand-900 dark:bg-brand-900/10">
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats.correct}
              </div>
              <div className="mt-1 text-xs text-foreground/60">正确数</div>
            </div>
            <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4 dark:border-brand-900 dark:bg-brand-900/10">
              <div className="text-3xl font-bold text-brand-700 dark:text-brand-300">
                {stats.accuracy}%
              </div>
              <div className="mt-1 text-xs text-foreground/60">正确率</div>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={restart}
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

      {/* Active question */}
      {questions && questions.length > 0 && current && !done && (
        <>
          <div className="mb-4 flex items-center justify-between text-sm text-foreground/60">
            <span>
              第 {index + 1} / {total} 题
            </span>
            <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
              {TYPE_LABEL[current.type]}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-brand-100 dark:bg-brand-900/40">
            <div
              className="h-full rounded-full bg-brand-600 transition-all"
              style={{ width: `${(index / total) * 100}%` }}
            />
          </div>

          <article className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm dark:border-brand-900 dark:bg-transparent sm:p-8">
            <h1 className="text-lg font-semibold leading-relaxed text-foreground sm:text-xl">
              {current.question}
            </h1>

            {/* MULTIPLE_CHOICE: option buttons */}
            {current.type === "MULTIPLE_CHOICE" && current.options && (
              <div className="mt-6 grid gap-3">
                {current.options.map((opt, i) => {
                  const isSelected =
                    feedback?.userAnswer.trim().toLowerCase() ===
                    opt.trim().toLowerCase();
                  const isCorrectOpt =
                    feedback &&
                    opt.trim().toLowerCase() ===
                      feedback.correctAnswer.trim().toLowerCase();
                  let state: "idle" | "correct" | "wrong" | "muted" = "idle";
                  if (feedback) {
                    if (isCorrectOpt) state = "correct";
                    else if (isSelected) state = "wrong";
                    else state = "muted";
                  }
                  return (
                    <button
                      key={`${opt}-${i}`}
                      type="button"
                      disabled={!!feedback || submitting}
                      onClick={() => handleOptionClick(opt)}
                      className={optionClass(state)}
                    >
                      <span className="mr-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-current/30 text-xs font-bold">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-left">{opt}</span>
                      {state === "correct" && <span className="ml-auto">✓</span>}
                      {state === "wrong" && <span className="ml-auto">✗</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {/* FILL_BLANK / CORRECTION: text input */}
            {(current.type === "FILL_BLANK" ||
              current.type === "CORRECTION") && (
              <form className="mt-6" onSubmit={handleTextSubmit}>
                <input
                  type="text"
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder={
                    current.type === "CORRECTION"
                      ? "请输入正确的形式"
                      : "请输入答案"
                  }
                  disabled={!!feedback || submitting}
                  autoFocus
                  className="w-full rounded-xl border border-brand-200 bg-white px-4 py-3 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-foreground/40 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-70 dark:border-brand-800 dark:bg-transparent"
                />
                {!feedback && (
                  <button
                    type="submit"
                    disabled={submitting || !textAnswer.trim()}
                    className="mt-4 w-full rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? "提交中…" : "提交答案"}
                  </button>
                )}
              </form>
            )}

            {/* Feedback panel */}
            {feedback && (
              <div
                className={`mt-6 rounded-xl border p-5 ${
                  feedback.isCorrect
                    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-900/20"
                    : "border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-900/20"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold ${
                      feedback.isCorrect
                        ? "bg-emerald-600 text-white"
                        : "bg-rose-600 text-white"
                    }`}
                  >
                    {feedback.isCorrect ? "✓" : "✗"}
                  </span>
                  <span
                    className={`text-base font-semibold ${
                      feedback.isCorrect
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-rose-700 dark:text-rose-300"
                    }`}
                  >
                    {feedback.isCorrect ? "回答正确！" : "回答错误"}
                  </span>
                </div>

                {!feedback.isCorrect && (
                  <div className="mt-3 text-sm text-foreground/80">
                    <span className="font-medium text-foreground/60">
                      你的答案：
                    </span>
                    <span className="ml-1 text-rose-700 line-through dark:text-rose-300">
                      {feedback.userAnswer}
                    </span>
                  </div>
                )}

                <div className="mt-2 text-sm text-foreground/80">
                  <span className="font-medium text-foreground/60">
                    正确答案：
                  </span>
                  <span className="ml-1 font-semibold text-emerald-700 dark:text-emerald-300">
                    {feedback.correctAnswer}
                  </span>
                </div>

                {feedback.explanation && (
                  <div className="mt-3 border-t border-current/10 pt-3 text-sm leading-relaxed text-foreground/70">
                    <div className="mb-1 text-xs font-medium uppercase tracking-wide text-foreground/50">
                      解析
                    </div>
                    {feedback.explanation}
                  </div>
                )}
              </div>
            )}
          </article>

          {/* Next button */}
          {feedback && (
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={advance}
                className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
              >
                {index + 1 >= total ? "查看结果" : "下一题 →"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Tailwind class builder for MULTIPLE_CHOICE option buttons, reflecting one of
 * four visual states: idle (default), correct (green), wrong (red), muted
 * (dimmed non-selected after submit).
 */
function optionClass(state: "idle" | "correct" | "wrong" | "muted"): string {
  const base =
    "flex items-center rounded-xl border px-4 py-3 text-sm font-medium shadow-sm transition-colors disabled:cursor-not-allowed";
  switch (state) {
    case "correct":
      return `${base} border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200`;
    case "wrong":
      return `${base} border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-200`;
    case "muted":
      return `${base} border-brand-100 bg-white text-foreground/50 dark:border-brand-900 dark:bg-transparent`;
    default:
      return `${base} border-brand-200 bg-white text-foreground hover:border-brand-300 hover:bg-brand-50 dark:border-brand-800 dark:bg-transparent dark:hover:bg-brand-900/20`;
  }
}
