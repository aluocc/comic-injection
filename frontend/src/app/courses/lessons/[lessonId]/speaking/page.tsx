"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type {
  LessonDetail,
  SpeakingExercise,
  SpeakingAttemptResult,
  SpeakingWordFeedback,
} from "@/lib/types";

/**
 * Speaking read-along practice page (Task 6.3).
 *
 * Flow:
 * 1. Fetch the lesson detail + the lesson's speaking exercises.
 * 2. For each exercise:
 *    - Show the read-along text and a native-audio player.
 *    - Let the user either record via the Web Speech API (SpeechRecognition)
 *      or, when unsupported, type the sentence manually.
 *    - Submit the transcription → POST /speaking/:id/attempt.
 *    - Show a score ring (0-100) and per-word highlight:
 *        correct → green, wrong → red, missing → grey.
 *    - "下一题" advances; after the last one, show the average score.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

/** Resolve a backend-relative audio URL (e.g. /uploads/... or /audio/...) to absolute. */
function resolveAudioUrl(url: string): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}

/** Map platform language code to a BCP-47 tag for SpeechRecognition. */
const SPEECH_LANG: Record<string, string> = {
  english: "en-US",
  japanese: "ja-JP",
  korean: "ko-KR",
};

// --- Minimal Web Speech API typing (not in lib.dom.d.ts) -------------------
interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike;
  isFinal: boolean;
  length: number;
}
interface SpeechRecognitionResultListLike {
  length: number;
  item(index: number): SpeechRecognitionResultLike;
  [index: number]: SpeechRecognitionResultLike;
}
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}
interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
  message?: string;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// --- Score ring helpers -----------------------------------------------------
function scoreColor(score: number): { stroke: string; text: string; bg: string; label: string } {
  if (score >= 80) {
    return {
      stroke: "#10b981", // emerald-500
      text: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      label: "优秀",
    };
  }
  if (score >= 60) {
    return {
      stroke: "#f59e0b", // amber-500
      text: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-900/20",
      label: "及格",
    };
  }
  return {
    stroke: "#ef4444", // rose-500
    text: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-900/20",
    label: "需加油",
  };
}

function wordState(item: SpeakingWordFeedback): "correct" | "wrong" | "missing" {
  if (item.match) return "correct";
  if (item.word === "") return "missing";
  return "wrong";
}

function wordClass(state: "correct" | "wrong" | "missing"): string {
  switch (state) {
    case "correct":
      return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700";
    case "wrong":
      return "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/40 dark:text-rose-200 dark:border-rose-700";
    case "missing":
    default:
      return "bg-gray-100 text-gray-400 border-gray-300 line-through dark:bg-gray-800/60 dark:text-gray-500 dark:border-gray-700";
  }
}

type Feedback = SpeakingAttemptResult & { userTranscription: string };

export default function SpeakingPage() {
  const params = useParams<{ lessonId: string }>();
  const lessonId = params?.lessonId ?? "";

  const token = useAuthStore((s) => s.token);

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [exercises, setExercises] = useState<SpeakingExercise[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [index, setIndex] = useState(0);
  const [transcription, setTranscription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  // Speech recognition state
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);

  useEffect(() => {
    setSpeechSupported(getSpeechRecognitionCtor() !== null);
  }, []);

  // Load lesson + speaking exercises in parallel.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [lessonData, exData] = await Promise.all([
          apiGet<LessonDetail>(
            `/courses/lessons/${encodeURIComponent(lessonId)}`,
          ),
          apiGet<SpeakingExercise[]>(
            `/speaking/lesson/${encodeURIComponent(lessonId)}`,
          ),
        ]);
        if (cancelled) return;
        setLesson(lessonData);
        setExercises(exData);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError) {
          setError(err.message || "加载口语练习失败");
        } else {
          setError("网络异常，请稍后重试");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  const current = exercises?.[index] ?? null;

  const resetForNext = useCallback(() => {
    setTranscription("");
    setSubmitting(false);
    setFeedback(null);
    setSpeechError(null);
  }, []);

  const advance = useCallback(() => {
    setIndex((prev) => {
      const next = prev + 1;
      if (exercises && next >= exercises.length) {
        setDone(true);
        return prev;
      }
      return next;
    });
    resetForNext();
  }, [exercises, resetForNext]);

  const submit = useCallback(async () => {
    if (!current || submitting || feedback) return;
    const trimmed = transcription.trim();
    if (!trimmed) {
      setError("请先录音或输入跟读内容后再提交。");
      return;
    }
    if (!token) {
      setError("请先登录后再进行口语练习，系统将跳转登录页。");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await apiPost<SpeakingAttemptResult>(
        `/speaking/${current.id}/attempt`,
        { transcription: trimmed },
      );
      setFeedback({ ...result, userTranscription: trimmed });
      setScores((prev) => [...prev, result.score]);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "提交评分失败");
      } else {
        setError("网络异常，请稍后重试");
      }
    } finally {
      setSubmitting(false);
    }
  }, [current, submitting, feedback, transcription, token]);

  // --- Speech recognition handlers ----------------------------------------
  const startListening = useCallback(() => {
    if (!current || listening) return;
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setSpeechError("当前浏览器不支持语音识别，请使用文本输入。");
      return;
    }
    // Stop any previous instance before starting a new one.
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
    }
    const recognition = new Ctor();
    recognition.lang = SPEECH_LANG[current.languageCode] ?? "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setSpeechError(null);
    };
    recognition.onerror = (e) => {
      setSpeechError(`语音识别失败：${e.error}`);
      setListening(false);
    };
    recognition.onresult = (e) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      setTranscription(text.trim());
    };
    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setSpeechError("无法启动语音识别，请改用文本输入。");
      setListening(false);
    }
  }, [current, listening]);

  const stopListening = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec && listening) {
      try {
        rec.stop();
      } catch {
        // ignore
      }
    }
    setListening(false);
  }, [listening]);

  // Cleanup recognition on unmount.
  useEffect(() => {
    return () => {
      const rec = recognitionRef.current;
      if (rec) {
        try {
          rec.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const stats = useMemo(() => {
    if (scores.length === 0) return { total: 0, average: 0 };
    const sum = scores.reduce((a, b) => a + b, 0);
    return { total: scores.length, average: Math.round(sum / scores.length) };
  }, [scores]);

  const total = exercises?.length ?? 0;
  const restart = useCallback(() => {
    setIndex(0);
    setScores([]);
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
            <span className="text-foreground/80">口语跟读</span>
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
          本课时暂无口语跟读练习。
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
      {done && exercises && exercises.length > 0 && (
        <div className="rounded-2xl border border-brand-100 bg-white p-8 text-center shadow-sm dark:border-brand-900 dark:bg-transparent">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-100 text-3xl dark:bg-accent-700/20">
            🎤
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight">练习完成！</h2>
          <p className="mt-2 text-sm text-foreground/60">
            你已完成本课时 {stats.total} 道口语跟读。
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4 dark:border-brand-900 dark:bg-brand-900/10">
              <div className="text-3xl font-bold text-brand-700 dark:text-brand-300">
                {stats.total}
              </div>
              <div className="mt-1 text-xs text-foreground/60">练习题数</div>
            </div>
            <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4 dark:border-brand-900 dark:bg-brand-900/10">
              <div
                className={`text-3xl font-bold ${scoreColor(stats.average).text}`}
              >
                {stats.average}
              </div>
              <div className="mt-1 text-xs text-foreground/60">平均分</div>
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

      {/* Active exercise */}
      {exercises && exercises.length > 0 && current && !done && (
        <>
          <div className="mb-4 flex items-center justify-between text-sm text-foreground/60">
            <span>
              第 {index + 1} / {total} 题
            </span>
            <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
              跟读 · {current.difficulty}
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
            {/* Read-along text */}
            <div className="text-xs font-medium uppercase tracking-wide text-foreground/50">
              跟读文本
            </div>
            <p className="mt-2 text-xl font-semibold leading-relaxed text-foreground sm:text-2xl">
              {current.text}
            </p>

            {/* Native audio player */}
            <div className="mt-5 rounded-xl border border-brand-100 bg-brand-50/40 p-4 dark:border-brand-900 dark:bg-brand-900/10">
              <div className="mb-2 text-xs text-foreground/50">原音示范</div>
              <audio
                key={current.id}
                controls
                src={resolveAudioUrl(current.audioUrl)}
                className="w-full"
              >
                您的浏览器不支持音频播放。
              </audio>
            </div>

            {/* Recording / input controls (hidden after submit) */}
            {!feedback && (
              <div className="mt-6">
                {speechSupported ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={listening ? stopListening : startListening}
                      disabled={submitting}
                      className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        listening
                          ? "bg-rose-600 hover:bg-rose-700"
                          : "bg-brand-600 hover:bg-brand-700"
                      }`}
                    >
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full bg-white ${
                          listening ? "animate-pulse" : ""
                        }`}
                      />
                      {listening ? "停止录音" : "开始录音"}
                    </button>
                    <span className="text-xs text-foreground/50">
                      {listening
                        ? "正在聆听… 请大声跟读"
                        : "点击录音后朗读上方文本"}
                    </span>
                  </div>
                ) : (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-300">
                    当前浏览器不支持语音识别（Web Speech API），请使用下方文本框手动输入跟读内容。
                  </div>
                )}

                {speechError && (
                  <div className="mt-3 text-xs text-rose-600 dark:text-rose-400">
                    {speechError}
                  </div>
                )}

                <form
                  className="mt-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void submit();
                  }}
                >
                  <textarea
                    value={transcription}
                    onChange={(e) => setTranscription(e.target.value)}
                    placeholder={
                      speechSupported
                        ? "录音结果会自动填入，也可在此手动编辑"
                        : "请输入你跟读的内容"
                    }
                    disabled={submitting}
                    rows={3}
                    autoFocus={!speechSupported}
                    className="w-full resize-none rounded-xl border border-brand-200 bg-white px-4 py-3 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-foreground/40 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-70 dark:border-brand-800 dark:bg-transparent"
                  />
                  <button
                    type="submit"
                    disabled={submitting || !transcription.trim()}
                    className="mt-3 w-full rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? "评分中…" : "提交评分"}
                  </button>
                </form>
              </div>
            )}

            {/* Feedback panel */}
            {feedback && (
              <div className="mt-6">
                <div className="flex flex-col items-center gap-4 rounded-xl border border-brand-100 bg-brand-50/40 p-6 sm:flex-row sm:items-center sm:gap-6 dark:border-brand-900 dark:bg-brand-900/10">
                  <ScoreRing score={feedback.score} />
                  <div className="min-w-0 flex-1 text-center sm:text-left">
                    <div
                      className={`text-sm font-semibold ${scoreColor(feedback.score).text}`}
                    >
                      {scoreColor(feedback.score).label}
                    </div>
                    <div className="mt-1 text-xs text-foreground/50">
                      满分 100，分数 = 1 − 编辑距离 / 较长文本词数
                    </div>
                    <div className="mt-3 text-xs text-foreground/60">
                      <span className="font-medium text-foreground/70">
                        你的朗读：
                      </span>
                      <span className="ml-1">{feedback.userTranscription}</span>
                    </div>
                  </div>
                </div>

                {/* Per-word highlight */}
                <div className="mt-5">
                  <div className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground/50">
                    逐词反馈
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {feedback.wordFeedback.map((item, i) => {
                      const state = wordState(item);
                      return (
                        <span
                          key={`${item.expected}-${i}`}
                          className={`rounded-md border px-2.5 py-1 text-sm font-medium ${wordClass(state)}`}
                          title={
                            state === "missing"
                              ? `缺失：${item.expected}`
                              : state === "wrong"
                                ? `期望：${item.expected}`
                                : "正确"
                          }
                        >
                          {item.word || item.expected}
                        </span>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-foreground/50">
                    <Legend color="bg-emerald-200" label="正确" />
                    <Legend color="bg-rose-200" label="错误" />
                    <Legend color="bg-gray-200" label="缺失" />
                  </div>
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
                {index + 1 >= total ? "查看结果" : "下一题 →"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Circular score gauge. Renders an SVG ring whose filled arc length is
 * proportional to the score, colored by score band. */
function ScoreRing({ score }: { score: number }) {
  const { stroke, text } = scoreColor(score);
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference * (1 - clamped / 100);
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg
        viewBox="0 0 80 80"
        className="h-24 w-24 -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-brand-100 dark:text-brand-900/60"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold ${text}`}>{clamped}</span>
        <span className="text-[10px] text-foreground/40">分</span>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block h-3 w-3 rounded-sm ${color}`} />
      {label}
    </span>
  );
}
