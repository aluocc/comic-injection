"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type {
  PlacementQuestion,
  PlacementAnswer,
  QuizResult,
  SetGoalPayload,
  SetGoalResult,
} from "@/lib/types";

/**
 * Onboarding wizard: a 4-step flow that personalizes the user's learning
 * experience.
 *
 *   Step 1 — choose target language (english / japanese / korean)
 *   Step 2 — choose learning purpose (travel / exam / work / hobby)
 *   Step 3 — choose daily goal (15 / 30 / 60 minutes)
 *   Step 4 — placement quiz (10 questions)
 *
 * On submit, the wizard:
 *   1. POSTs the goal (targetLanguage + dailyGoal + purpose) to
 *      /recommendation/goal, which updates User.targetLanguage and
 *      stores dailyGoal/purpose in Redis.
 *   2. POSTs the quiz answers to /recommendation/placement-quiz/submit,
 *      which grades them, computes a CEFR level, and persists it on
 *      User.currentLevel.
 *   3. Refreshes the local auth-store user projection (so the Navbar
 *      shows the new targetLanguage / level immediately).
 *   4. Navigates to /recommendation (the path detail page).
 */
export default function OnboardingPage() {
  const router = useRouter();
  const { token, user, hydrated, hydrate, setUser } = useAuthStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step selections.
  const [targetLanguage, setTargetLanguage] =
    useState<SetGoalPayload["targetLanguage"]>("english");
  const [purpose, setPurpose] = useState<SetGoalPayload["purpose"]>("hobby");
  const [dailyGoal, setDailyGoal] = useState<number>(30);

  // Quiz state.
  const [questions, setQuestions] = useState<PlacementQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizError, setQuizError] = useState<string | null>(null);

  // Submission state.
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  // Redirect to /login when not authenticated.
  useEffect(() => {
    if (hydrated && !token) {
      router.replace("/login?expired=1");
    }
  }, [hydrated, token, router]);

  // Load placement questions on step 4.
  useEffect(() => {
    if (step !== 4 || questions.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await apiGet<PlacementQuestion[]>(
          "/recommendation/placement-quiz",
        );
        if (!cancelled) setQuestions(data);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError) {
          setQuizError(err.message || "加载测试题失败");
        } else {
          setQuizError("网络异常，请稍后重试");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step, questions.length]);

  const onSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      // 1) Set the goal first (so the path generator can read it).
      const goalPayload: SetGoalPayload = {
        targetLanguage,
        dailyGoal,
        purpose,
      };
      const goalRes = await apiPost<SetGoalResult>(
        "/recommendation/goal",
        goalPayload,
      );
      // Sync the local user projection with the updated targetLanguage.
      setUser({
        ...user!,
        ...goalRes.user,
      });

      // 2) Submit the placement quiz.
      const answerList: PlacementAnswer[] = Object.entries(answers).map(
        ([questionId, userAnswer]) => ({ questionId, userAnswer }),
      );
      if (answerList.length > 0) {
        const quizRes = await apiPost<QuizResult>(
          "/recommendation/placement-quiz/submit",
          { answers: answerList },
        );
        // Sync the local user projection with the updated currentLevel.
        setUser({
          ...user!,
          targetLanguage: goalRes.user.targetLanguage,
          currentLevel: quizRes.level,
        });
      }

      // 3) Go to the path detail page.
      router.replace("/recommendation");
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message || "提交失败，请重试");
      } else {
        setSubmitError("网络异常，请稍后重试");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!hydrated || !user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <div className="h-32 animate-pulse rounded-2xl border border-brand-100 bg-brand-50/40 dark:border-brand-900 dark:bg-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          开启你的学习之旅
        </h1>
        <p className="mt-2 text-sm text-foreground/60">
          告诉我们你的目标与起点，我们将为你定制专属的学习路径。
        </p>
      </header>

      <Stepper current={step} />

      <div className="mt-8 rounded-2xl border border-brand-100 bg-white p-6 shadow-sm dark:border-brand-900 dark:bg-transparent sm:p-8">
        {step === 1 && (
          <Step1Language
            value={targetLanguage}
            onChange={(v) => setTargetLanguage(v)}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <Step2Purpose
            value={purpose}
            onChange={(v) => setPurpose(v)}
            onPrev={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <Step3DailyGoal
            value={dailyGoal}
            onChange={(v) => setDailyGoal(v)}
            onPrev={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}
        {step === 4 && (
          <Step4Quiz
            questions={questions}
            answers={answers}
            onAnswer={(qid, ans) =>
              setAnswers((prev) => ({ ...prev, [qid]: ans }))
            }
            error={quizError}
            submitting={submitting}
            submitError={submitError}
            onPrev={() => setStep(3)}
            onSubmit={onSubmit}
          />
        )}
      </div>

      <p className="mt-6 text-center text-xs text-foreground/50">
        已登录为 {user.nickname} ·{" "}
        <Link
          href="/"
          className="font-medium text-brand-600 hover:underline"
        >
          返回首页
        </Link>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------
// Stepper
// ---------------------------------------------------------------

function Stepper({ current }: { current: number }) {
  const steps = [
    { n: 1, label: "目标语言" },
    { n: 2, label: "学习目的" },
    { n: 3, label: "每日目标" },
    { n: 4, label: "水平测试" },
  ];
  return (
    <ol className="flex items-center gap-2 text-xs sm:text-sm">
      {steps.map((s, idx) => {
        const done = current > s.n;
        const active = current === s.n;
        return (
          <li key={s.n} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                active
                  ? "bg-brand-600 text-white"
                  : done
                    ? "bg-accent-500 text-white"
                    : "bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300"
              }`}
            >
              {done ? "✓" : s.n}
            </span>
            <span
              className={`truncate ${
                active
                  ? "font-semibold text-foreground"
                  : "text-foreground/60"
              }`}
            >
              {s.label}
            </span>
            {idx < steps.length - 1 && (
              <span className="ml-auto hidden h-px flex-1 bg-brand-100 dark:bg-brand-900/50 sm:block" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ---------------------------------------------------------------
// Step 1: target language
// ---------------------------------------------------------------

const LANGUAGE_OPTIONS: Array<{
  value: SetGoalPayload["targetLanguage"];
  label: string;
  icon: string;
  desc: string;
}> = [
  { value: "english", label: "英语", icon: "🇬🇧", desc: "全球通用，旅行与职场必备" },
  { value: "japanese", label: "日语", icon: "🇯🇵", desc: "动漫、文化、商务交流" },
  { value: "korean", label: "韩语", icon: "🇰🇷", desc: "韩剧、K-Pop、潮流文化" },
];

function Step1Language({
  value,
  onChange,
  onNext,
}: {
  value: SetGoalPayload["targetLanguage"];
  onChange: (v: SetGoalPayload["targetLanguage"]) => void;
  onNext: () => void;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold">选择目标语言</h2>
      <p className="mt-1 text-sm text-foreground/60">
        你想学习哪种语言？之后可以随时调整。
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {LANGUAGE_OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm ${
                selected
                  ? "border-brand-500 bg-brand-50 ring-2 ring-brand-200 dark:border-brand-400 dark:bg-brand-900/20 dark:ring-brand-700"
                  : "border-brand-200 bg-white dark:border-brand-800 dark:bg-transparent"
              }`}
            >
              <span className="text-3xl">{opt.icon}</span>
              <span className="text-base font-semibold">{opt.label}</span>
              <span className="text-xs text-foreground/60">{opt.desc}</span>
              {selected && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-xs text-white">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={onNext}
          className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
        >
          下一步 →
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Step 2: purpose
// ---------------------------------------------------------------

const PURPOSE_OPTIONS: Array<{
  value: SetGoalPayload["purpose"];
  label: string;
  icon: string;
  desc: string;
}> = [
  { value: "travel", label: "旅行", icon: "✈️", desc: "出行、点餐、问路" },
  { value: "exam", label: "考试", icon: "📝", desc: "TOEIC、TOEFL、JLPT、TOPIK" },
  { value: "work", label: "工作", icon: "💼", desc: "职场沟通与商务表达" },
  { value: "hobby", label: "兴趣", icon: "🌟", desc: "均衡学习，自由探索" },
];

function Step2Purpose({
  value,
  onChange,
  onPrev,
  onNext,
}: {
  value: SetGoalPayload["purpose"];
  onChange: (v: SetGoalPayload["purpose"]) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold">选择学习目的</h2>
      <p className="mt-1 text-sm text-foreground/60">
        不同目的会调整每周计划的重点模块。
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {PURPOSE_OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`relative flex items-center gap-3 rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm ${
                selected
                  ? "border-brand-500 bg-brand-50 ring-2 ring-brand-200 dark:border-brand-400 dark:bg-brand-900/20 dark:ring-brand-700"
                  : "border-brand-200 bg-white dark:border-brand-800 dark:bg-transparent"
              }`}
            >
              <span className="text-2xl">{opt.icon}</span>
              <div>
                <p className="text-sm font-semibold">{opt.label}</p>
                <p className="mt-0.5 text-xs text-foreground/60">{opt.desc}</p>
              </div>
              {selected && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-xs text-white">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={onPrev}
          className="rounded-xl border border-brand-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 dark:border-brand-800 dark:bg-transparent dark:text-brand-300"
        >
          ← 上一步
        </button>
        <button
          type="button"
          onClick={onNext}
          className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
        >
          下一步 →
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Step 3: daily goal
// ---------------------------------------------------------------

const DAILY_GOAL_OPTIONS: Array<{
  value: number;
  label: string;
  desc: string;
}> = [
  { value: 15, label: "15 分钟", desc: "轻松节奏，每日 1-2 课时" },
  { value: 30, label: "30 分钟", desc: "推荐节奏，每日 2-3 课时" },
  { value: 60, label: "60 分钟", desc: "冲刺节奏，每日 4-5 课时" },
];

function Step3DailyGoal({
  value,
  onChange,
  onPrev,
  onNext,
}: {
  value: number;
  onChange: (v: number) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold">选择每日目标</h2>
      <p className="mt-1 text-sm text-foreground/60">
        每日计划学习时长，决定每周建议课时数。
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {DAILY_GOAL_OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`relative flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm ${
                selected
                  ? "border-brand-500 bg-brand-50 ring-2 ring-brand-200 dark:border-brand-400 dark:bg-brand-900/20 dark:ring-brand-700"
                  : "border-brand-200 bg-white dark:border-brand-800 dark:bg-transparent"
              }`}
            >
              <span className="text-lg font-bold">{opt.label}</span>
              <span className="text-xs text-foreground/60">{opt.desc}</span>
              {selected && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-xs text-white">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={onPrev}
          className="rounded-xl border border-brand-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 dark:border-brand-800 dark:bg-transparent dark:text-brand-300"
        >
          ← 上一步
        </button>
        <button
          type="button"
          onClick={onNext}
          className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
        >
          进入水平测试 →
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Step 4: placement quiz
// ---------------------------------------------------------------

function Step4Quiz({
  questions,
  answers,
  onAnswer,
  error,
  submitting,
  submitError,
  onPrev,
  onSubmit,
}: {
  questions: PlacementQuestion[];
  answers: Record<string, string>;
  onAnswer: (qid: string, ans: string) => void;
  error: string | null;
  submitting: boolean;
  submitError: string | null;
  onPrev: () => void;
  onSubmit: () => void;
}) {
  const answeredCount = Object.keys(answers).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  return (
    <div>
      <h2 className="text-lg font-semibold">水平测试</h2>
      <p className="mt-1 text-sm text-foreground/60">
        共 {questions.length || "—"} 道题，覆盖词汇 / 语法 / 听力理解。我们
        会根据你的正确率设置初始等级。
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-300">
          {error}
        </div>
      )}

      {questions.length === 0 && !error ? (
        <div className="mt-6 space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-brand-100 bg-brand-50/40 dark:border-brand-900 dark:bg-transparent"
            />
          ))}
        </div>
      ) : null}

      <ol className="mt-6 space-y-4">
        {questions.map((q, idx) => {
          const selected = answers[q.id];
          return (
            <li
              key={q.id}
              className="rounded-xl border border-brand-100 bg-brand-50/30 p-4 dark:border-brand-900 dark:bg-brand-900/10"
            >
              <p className="text-sm font-medium text-foreground">
                <span className="mr-2 text-brand-600">{idx + 1}.</span>
                {q.question}
              </p>
              <span className="mt-1 inline-block rounded bg-foreground/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-foreground/50">
                {q.type}
              </span>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {q.options.map((opt) => {
                  const isSelected = selected === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => onAnswer(q.id, opt)}
                      className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                        isSelected
                          ? "border-brand-500 bg-brand-100 text-brand-800 dark:border-brand-400 dark:bg-brand-900/40 dark:text-brand-200"
                          : "border-brand-200 bg-white text-foreground hover:border-brand-300 hover:bg-brand-50 dark:border-brand-800 dark:bg-transparent dark:hover:bg-brand-900/20"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>

      {submitError && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-300">
          {submitError}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={submitting}
          className="rounded-xl border border-brand-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 disabled:opacity-60 dark:border-brand-800 dark:bg-transparent dark:text-brand-300"
        >
          ← 上一步
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-foreground/50">
            已答 {answeredCount} / {questions.length}
          </span>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting || !allAnswered}
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "提交中…" : "提交并生成路径 →"}
          </button>
        </div>
      </div>
    </div>
  );
}
