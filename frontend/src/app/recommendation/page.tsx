"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGet, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type {
  RecommendationPath,
  PlanDay,
  PlanLesson,
} from "@/lib/types";

/**
 * Personalized learning-path detail page.
 *
 * Calls GET /recommendation/path and renders:
 *   • A summary card (level / target language / daily goal / purpose)
 *   • Focus-module tags
 *   • Estimated weeks to finish
 *   • A 7-day weekly plan; each day shows its suggested lessons and each
 *     lesson links to the corresponding lesson page.
 *
 * If the user has not set a target language yet, a banner links to
 * /onboarding so they can complete the wizard first.
 */
export default function RecommendationPage() {
  const router = useRouter();
  const { token, user, hydrated, hydrate } = useAuthStore();

  const [path, setPath] = useState<RecommendationPath | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.replace("/login?expired=1");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await apiGet<RecommendationPath>("/recommendation/path");
        if (!cancelled) setPath(data);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError) {
          setError(err.message || "加载学习路径失败");
        } else {
          setError("网络异常，请稍后重试");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, token, router]);

  if (!hydrated || (!path && !error)) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="h-32 animate-pulse rounded-2xl border border-brand-100 bg-brand-50/40 dark:border-brand-900 dark:bg-transparent" />
        <div className="mt-6 grid gap-4 sm:grid-cols-7">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-2xl border border-brand-100 bg-brand-50/40 dark:border-brand-900 dark:bg-transparent"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-300">
          {error}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-lg border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 dark:border-brand-800 dark:bg-transparent dark:text-brand-300"
          >
            返回首页
          </Link>
          <Link
            href="/onboarding"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            重新设置目标
          </Link>
        </div>
      </div>
    );
  }

  // No target language set yet → prompt onboarding.
  if (user && !user.targetLanguage) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <div className="rounded-2xl border border-brand-100 bg-white p-8 text-center shadow-sm dark:border-brand-900 dark:bg-transparent">
          <span className="text-4xl">🧭</span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">
            还没有为你定制的学习路径
          </h1>
          <p className="mt-2 text-sm text-foreground/60">
            完成简单的引导流程（约 2 分钟），我们将为你生成专属的每周
            学习计划。
          </p>
          <Link
            href="/onboarding"
            className="mt-6 inline-block rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            开始引导流程 →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            个性化学习路径
          </h1>
          <p className="mt-2 text-sm text-foreground/60">
            基于你的等级、目标与进度生成的本周计划。
          </p>
        </div>
        <Link
          href="/onboarding"
          className="rounded-xl border border-brand-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 dark:border-brand-800 dark:bg-transparent dark:text-brand-300"
        >
          重新设置目标
        </Link>
      </header>

      {/* Summary card */}
      <section className="grid gap-4 sm:grid-cols-4">
        <SummaryCard
          icon="🎯"
          accent="from-brand-500 to-violet-600"
          label="目标语言"
          value={languageLabel(path!.targetLanguage)}
        />
        <SummaryCard
          icon="📈"
          accent="from-accent-500 to-accent-700"
          label="当前等级"
          value={path!.level}
        />
        <SummaryCard
          icon="⏱️"
          accent="from-orange-400 to-rose-500"
          label="每日目标"
          value={`${path!.dailyGoal} 分钟`}
        />
        <SummaryCard
          icon="📅"
          accent="from-emerald-500 to-teal-600"
          label="预计完成"
          value={`${path!.estimatedWeeks} 周`}
        />
      </section>

      {/* Focus modules */}
      <section className="mt-6 rounded-2xl border border-brand-100 bg-white p-6 shadow-sm dark:border-brand-900 dark:bg-transparent">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">重点模块</h2>
            <p className="mt-0.5 text-xs text-foreground/50">
              {path!.purpose ? `根据你的学习目的（${purposeLabel(path!.purpose)}）调整` : "均衡覆盖各类练习"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {path!.focusModules.map((m) => (
              <span
                key={m}
                className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Weekly plan */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold">本周计划</h2>
        <p className="mt-0.5 text-xs text-foreground/50">
          点击任意课时即可跳转到对应学习页。
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {path!.weeklyPlan.map((day) => (
            <DayCard key={day.day} day={day} />
          ))}
        </div>
      </section>

      <section className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/courses"
          className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
        >
          浏览全部课程 →
        </Link>
        <Link
          href="/dashboard"
          className="rounded-xl border border-brand-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 dark:border-brand-800 dark:bg-transparent dark:text-brand-300"
        >
          查看学习中心
        </Link>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------
// Presentational components
// ---------------------------------------------------------------

function SummaryCard({
  icon,
  accent,
  label,
  value,
}: {
  icon: string;
  accent: string;
  label: string;
  value: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-100 bg-white p-5 shadow-sm dark:border-brand-900 dark:bg-transparent">
      <div
        className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${accent} opacity-20 blur-2xl`}
      />
      <div className="relative flex items-center gap-3">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-xl text-white shadow-sm`}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-xs text-foreground/60">{label}</p>
          <p className="truncate text-lg font-bold tracking-tight">{value}</p>
        </div>
      </div>
    </div>
  );
}

function DayCard({ day }: { day: PlanDay }) {
  const totalMinutes = day.lessons.reduce(
    (sum, l) => sum + (l.duration ?? 0),
    0,
  );
  return (
    <div className="flex h-full flex-col rounded-2xl border border-brand-100 bg-white p-4 shadow-sm dark:border-brand-900 dark:bg-transparent">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{day.day}</h3>
        <span className="text-[10px] text-foreground/50">
          {day.lessons.length} 课时 · {totalMinutes} 分钟
        </span>
      </div>
      <ul className="mt-3 flex-1 space-y-2">
        {day.lessons.length === 0 ? (
          <li className="rounded-lg border border-dashed border-brand-200 bg-brand-50/30 px-2 py-3 text-center text-xs text-foreground/40 dark:border-brand-800 dark:bg-brand-900/10">
            自由复习
          </li>
        ) : (
          day.lessons.map((lesson) => (
            <LessonRow key={lesson.lessonId} lesson={lesson} />
          ))
        )}
      </ul>
    </div>
  );
}

function LessonRow({ lesson }: { lesson: PlanLesson }) {
  const meta = lessonTypeMeta(lesson.type);
  return (
    <li>
      <Link
        href={`/courses/lessons/${lesson.lessonId}`}
        className="flex items-start gap-2 rounded-lg border border-brand-100 bg-brand-50/30 px-2 py-2 text-xs transition-colors hover:border-brand-300 hover:bg-brand-50 dark:border-brand-900 dark:bg-brand-900/10 dark:hover:bg-brand-900/20"
      >
        <span className="text-base leading-none">{meta.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">{lesson.title}</p>
          <p className="mt-0.5 text-[10px] text-foreground/50">
            {meta.label} · {lesson.duration} 分钟
          </p>
        </div>
        <span className="text-foreground/30">→</span>
      </Link>
    </li>
  );
}

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

function languageLabel(code: string): string {
  const map: Record<string, string> = {
    english: "英语",
    japanese: "日语",
    korean: "韩语",
  };
  return map[code] ?? code;
}

function purposeLabel(purpose: string): string {
  const map: Record<string, string> = {
    travel: "旅行",
    exam: "考试",
    work: "工作",
    hobby: "兴趣",
  };
  return map[purpose] ?? purpose;
}

function lessonTypeMeta(type: string): { icon: string; label: string } {
  const map: Record<string, { icon: string; label: string }> = {
    vocabulary: { icon: "📖", label: "单词" },
    grammar: { icon: "✍️", label: "语法" },
    speaking: { icon: "🎤", label: "口语" },
    listening: { icon: "🎧", label: "听力" },
    mixed: { icon: "📚", label: "综合" },
  };
  return map[type] ?? { icon: "📘", label: type };
}
