"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type {
  LessonDetail,
  ListeningExercise,
  ListeningQuestionType,
  ListeningCheckResult,
} from "@/lib/types";

/**
 * Listening practice page (Task 7.3).
 *
 * Flow:
 * 1. Fetch the lesson detail + the lesson's listening exercises.
 * 2. For each exercise:
 *    - Show an HTML5 <audio controls> player bound to the exercise audio.
 *    - Render questions one at a time, branched by `type`:
 *        MULTIPLE_CHOICE: option buttons
 *        FILL_BLANK:     text input + submit button
 *        TRUE_FALSE:     True / False two buttons
 *    - Submit → POST /listening/:exerciseId/check.
 *    - Show isCorrect feedback + correct answer.
 *    - "下一题" advances; after the last question, show the transcript
 *      review panel and a per-exercise summary (total / correct / accuracy).
 * 3. After the last exercise, show an overall summary.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

/** Resolve a backend-relative audio URL (e.g. /audio/... or /uploads/...) to absolute. */
function resolveAudioUrl(url: string): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}

const TYPE_LABEL: Record<ListeningQuestionType, string> = {
  MULTIPLE_CHOICE: "选择题",
  FILL_BLANK: "填空题",
  TRUE_FALSE: "判断题",
};

type Feedback = ListeningCheckResult & { userAnswer: string };

export default function ListeningPage() {
  const params = useParams<{ lessonId: string }>();
  const lessonId = params?.lessonId ?? "";

  const token = useAuthStore((s) => s.token);

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [exercises, setExercises] = useState<ListeningExercise[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [exIndex, setExIndex] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [textAnswer, setTextAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  // Per-exercise results: resultsByExercise[i] = boolean[] for exercise i.
  const [resultsByExercise, setResultsByExercise] = useState<boolean[][]>([]);
  // Transcript captured from the first check response of each exercise.
  const [transcript, setTranscript] = useState<string | null>(null);
  const [exerciseDone, setExerciseDone] = useState(false);
  const [allDone, setAllDone] = useState(false);

  // Load lesson + listening exercises in parallel.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [lessonData, exData] = await Promise.all([
          apiGet<LessonDetail>(
            `/courses/lessons/${encodeURIComponent(lessonId)}`,
          ),
          apiGet<ListeningExercise[]>(
            `/listening/lesson/${encodeURIComponent(lessonId)}`,
          ),
        ]);
        if (cancelled) return;
        setLesson(lessonData);
        setExercises(exData);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError) {
          setError(err.message || "加载听力练习失败");
        } else {
          setError("网络异常，请稍后重试");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  const currentExercise = exercises?.[exIndex] ?? null;
  const currentQuestion = currentExercise?.questions[qIndex] ?? null;

  const resetForNext = useCallback(() => {
    setTextAnswer("");
    setSubmitting(false);
    setFeedback(null);
  }, []);

  const advance = useCallback(() => {
    if (!currentExercise) return;
    const nextQ = qIndex + 1;
    if (nextQ < currentExercise.questions.length) {
      // Next question in the same exercise.
      setQIndex(nextQ);
      resetForNext();
      return;
    }
    // Exercise finished — show the exercise review panel (transcript + stats).
    setExerciseDone(true);
  }, [currentExercise, qIndex, resetForNext]);

  const nextExercise = useCallback(() => {
    if (!exercises) return;
    const nextEx = exIndex + 1;
    if (nextEx >= exercises.length) {
      setAllDone(true);
      return;
    }
    setExIndex(nextEx);
    setQIndex(0);
    setTranscript(null);
    setExerciseDone(false);
    resetForNext();
  }, [exercises, exIndex, resetForNext]);

  const submit = useCallback(
    async (answer: string) => {
      if (!currentExercise || !currentQuestion || submitting || feedback) return;
      const trimmed = answer.trim();
      if (!trimmed) {
        setError("请先填写答案再提交。");
        return;
      }
      if (!token) {
        setError("请先登录后再进行听力练习，系统将跳转登录页。");
        return;
      }
      setSubmitting(true);
      setError(null);
      try {
        const result = await apiPost<ListeningCheckResult>(
          `/listening/${currentExercise.id}/check`,
          { questionId: currentQuestion.id, userAnswer: trimmed },
        );
        setFeedback({ ...result, userAnswer: trimmed });
        // Capture the transcript from the first check response of this
        // exercise so we can render the review panel at the end.
        if (result.transcript !== null && result.transcript !== undefined) {
          setTranscript(result.transcript);
        }
        setResultsByExercise((prev) => {
          const next = [...prev];
          while (next.length <= exIndex) next.push([]);
          next[exIndex] = [...next[exIndex], result.isCorrect];
          return next;
        });
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
    [currentExercise, currentQuestion, submitting, feedback, token, exIndex],
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

  // Stats for the current exercise.
  const exerciseStats = useMemo(() => {
    const arr = resultsByExercise[exIndex] ?? [];
    const total = arr.length;
    const correct = arr.filter(Boolean).length;
    const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);
    return { total, correct, accuracy };
  }, [resultsByExercise, exIndex]);

  // Overall stats across all completed exercises.
  const overallStats = useMemo(() => {
    const all = resultsByExercise.flat();
    const total = all.length;
    const correct = all.filter(Boolean).length;
    const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);
    return { total, correct, accuracy };
  }, [resultsByExercise]);

  const totalExercises = exercises?.length ?? 0;
  const totalQuestionsInExercise = currentExercise?.questions.length ?? 0;

  const restart = useCallback(() => {
    setExIndex(0);
    setQIndex(0);
    setResultsByExercise([]);
    setTranscript(null);
    setExerciseDone(false);
    setAllDone(false);
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
            <span className="text-foreground/80">听力训练</span>
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
      {!exercises && !error && (
        <div className="h-72 animate-pulse rounded-2xl border border-brand-100 bg-brand-50/40 dark:border-brand-900 dark:bg-transparent" />
      )}

      {/* Empty state */}
      {exercises && exercises.length === 0 && !error && (
        <div className="rounded-2xl border border-brand-100 bg-white p-10 text-center text-sm text-foreground/60 dark:border-brand-900 dark:bg-transparent">
          本课时暂无听力练习。
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

      {/* All-exercises completion summary */}
      {allDone && exercises && exercises.length > 0 && (
        <div className="rounded-2xl border border-brand-100 bg-white p-8 text-center shadow-sm dark:border-brand-900 dark:bg-transparent">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-100 text-3xl dark:bg-accent-700/20">
            🎧
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight">听力训练完成！</h2>
          <p className="mt-2 text-sm text-foreground/60">
            你已完成本课时 {totalExercises} 段听力、共 {overallStats.total} 道题目。
          </p>
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4 dark:border-brand-900 dark:bg-brand-900/10">
              <div className="text-3xl font-bold text-brand-700 dark:text-brand-300">
                {overallStats.total}
              </div>
              <div className="mt-1 text-xs text-foreground/60">总题数</div>
            </div>
            <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4 dark:border-brand-900 dark:bg-brand-900/10">
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {overallStats.correct}
              </div>
              <div className="mt-1 text-xs text-foreground/60">正确数</div>
            </div>
            <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4 dark:border-brand-900 dark:bg-brand-900/10">
              <div className="text-3xl font-bold text-brand-700 dark:text-brand-300">
                {overallStats.accuracy}%
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

      {/* Active exercise + question */}
      {exercises &&
        exercises.length > 0 &&
        currentExercise &&
        !allDone && (
          <>
            <div className="mb-4 flex items-center justify-between text-sm text-foreground/60">
              <span>
                听力 {exIndex + 1} / {totalExercises}
                {totalExercises > 1 && (
                  <span className="ml-2 text-foreground/40">
                    （已累计完成 {overallStats.total} 题）
                  </span>
                )}
              </span>
              <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                难度 {currentExercise.difficulty}
              </span>
            </div>

            {/* Progress bar across all questions of the current exercise */}
            {!exerciseDone && (
              <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-brand-100 dark:bg-brand-900/40">
                <div
                  className="h-full rounded-full bg-brand-600 transition-all"
                  style={{
                    width: `${(qIndex / Math.max(1, totalQuestionsInExercise)) * 100}%`,
                  }}
                />
              </div>
            )}

            {/* Audio player — shown while answering and during the review panel */}
            <div className="mb-6 rounded-2xl border border-brand-100 bg-white p-6 shadow-sm dark:border-brand-900 dark:bg-transparent">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground/50">
                音频播放
              </div>
              <audio
                key={currentExercise.id}
                controls
                src={resolveAudioUrl(currentExercise.audioUrl)}
                className="w-full"
              >
                您的浏览器不支持音频播放。
              </audio>
              <p className="mt-2 text-xs text-foreground/50">
                可反复播放音频后再作答。
              </p>
            </div>

            {/* Active question */}
            {!exerciseDone && currentQuestion && (
              <>
                <div className="mb-4 flex items-center justify-between text-sm text-foreground/60">
                  <span>
                    第 {qIndex + 1} / {totalQuestionsInExercise} 题
                  </span>
                  <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                    {TYPE_LABEL[currentQuestion.type]}
                  </span>
                </div>

                <article className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm dark:border-brand-900 dark:bg-transparent sm:p-8">
                  <h1 className="text-lg font-semibold leading-relaxed text-foreground sm:text-xl">
                    {currentQuestion.question}
                  </h1>

                  {/* MULTIPLE_CHOICE: option buttons */}
                  {currentQuestion.type === "MULTIPLE_CHOICE" &&
                    currentQuestion.options && (
                      <div className="mt-6 grid gap-3">
                        {currentQuestion.options.map((opt, i) => {
                          const isSelected =
                            feedback?.userAnswer.trim().toLowerCase() ===
                            opt.trim().toLowerCase();
                          const isCorrectOpt =
                            feedback &&
                            opt.trim().toLowerCase() ===
                              feedback.correctAnswer.trim().toLowerCase();
                          let state: "idle" | "correct" | "wrong" | "muted" =
                            "idle";
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
                              {state === "correct" && (
                                <span className="ml-auto">✓</span>
                              )}
                              {state === "wrong" && (
                                <span className="ml-auto">✗</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                  {/* TRUE_FALSE: True / False two buttons */}
                  {currentQuestion.type === "TRUE_FALSE" &&
                    currentQuestion.options && (
                      <div className="mt-6 grid grid-cols-2 gap-3">
                        {currentQuestion.options.map((opt, i) => {
                          const isSelected =
                            feedback?.userAnswer.trim().toLowerCase() ===
                            opt.trim().toLowerCase();
                          const isCorrectOpt =
                            feedback &&
                            opt.trim().toLowerCase() ===
                              feedback.correctAnswer.trim().toLowerCase();
                          let state: "idle" | "correct" | "wrong" | "muted" =
                            "idle";
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
                              <span className="text-base font-semibold">
                                {opt}
                              </span>
                              {state === "correct" && (
                                <span className="ml-auto">✓</span>
                              )}
                              {state === "wrong" && (
                                <span className="ml-auto">✗</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                  {/* FILL_BLANK: text input */}
                  {currentQuestion.type === "FILL_BLANK" && (
                    <form className="mt-6" onSubmit={handleTextSubmit}>
                      <input
                        type="text"
                        value={textAnswer}
                        onChange={(e) => setTextAnswer(e.target.value)}
                        placeholder="请输入答案"
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
                      {qIndex + 1 >= totalQuestionsInExercise
                        ? "查看本题复盘"
                        : "下一题 →"}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Exercise review panel (transcript + stats) */}
            {exerciseDone && (
              <div className="space-y-6">
                {/* Per-exercise stats */}
                <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm dark:border-brand-900 dark:bg-transparent sm:p-8">
                  <div className="flex items-center gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-xl dark:bg-emerald-900/30">
                      ✓
                    </span>
                    <h2 className="text-xl font-bold tracking-tight">
                      本段听力完成
                    </h2>
                  </div>
                  <p className="mt-2 text-sm text-foreground/60">
                    你已完成本段听力的 {exerciseStats.total} 道题目。
                  </p>
                  <div className="mt-5 grid grid-cols-3 gap-4">
                    <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4 text-center dark:border-brand-900 dark:bg-brand-900/10">
                      <div className="text-2xl font-bold text-brand-700 dark:text-brand-300">
                        {exerciseStats.total}
                      </div>
                      <div className="mt-1 text-xs text-foreground/60">总题数</div>
                    </div>
                    <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4 text-center dark:border-brand-900 dark:bg-brand-900/10">
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {exerciseStats.correct}
                      </div>
                      <div className="mt-1 text-xs text-foreground/60">正确数</div>
                    </div>
                    <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4 text-center dark:border-brand-900 dark:bg-brand-900/10">
                      <div className="text-2xl font-bold text-brand-700 dark:text-brand-300">
                        {exerciseStats.accuracy}%
                      </div>
                      <div className="mt-1 text-xs text-foreground/60">正确率</div>
                    </div>
                  </div>
                </div>

                {/* Transcript review panel */}
                <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-accent-500/10 p-6 shadow-sm dark:border-brand-800 dark:from-brand-900/20 sm:p-8">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📝</span>
                    <h3 className="text-base font-semibold text-foreground">
                      原文复盘
                    </h3>
                  </div>
                  {transcript ? (
                    <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-foreground/80">
                      {transcript}
                    </p>
                  ) : (
                    <p className="mt-4 text-sm text-foreground/50">
                      本段听力暂无原文。
                    </p>
                  )}
                  <p className="mt-4 text-xs text-foreground/50">
                    可对照原文再次播放音频，巩固听力细节。
                  </p>
                </div>

                {/* Advance to next exercise */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={nextExercise}
                    className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
                  >
                    {exIndex + 1 >= totalExercises ? "查看总成绩" : "下一段听力 →"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
    </div>
  );
}

/**
 * Tailwind class builder for option buttons (MULTIPLE_CHOICE / TRUE_FALSE),
 * reflecting one of four visual states: idle (default), correct (green),
 * wrong (red), muted (dimmed non-selected after submit).
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
