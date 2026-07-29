"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGet, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type {
  ProgressDashboard,
  LanguageProgress,
  DailyTimeBucket,
  RecentLesson,
} from "@/lib/types";

/**
 * Learning center dashboard.
 *
 * Requires authentication (JWT in localStorage). Calls GET /progress/dashboard
 * and renders:
 *   • top KPI cards: streak (flame), total study time, total completed lessons
 *   • per-language progress rings (SVG, side-by-side)
 *   • 7-day study-time bar chart (div-height simulation)
 *   • recent lesson list (linked to the lesson detail page)
 */
export default function DashboardPage() {
  const router = useRouter();
  const { token, hydrated, hydrate } = useAuthStore();

  const [dashboard, setDashboard] = useState<ProgressDashboard | null>(null);
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
        const data = await apiGet<ProgressDashboard>("/progress/dashboard");
        if (!cancelled) setDashboard(data);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError) {
          setError(err.message || "加载学习数据失败");
        } else {
          setError("网络异常，请稍后重试");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, token, router]);

  if (!hydrated || (!dashboard && !error)) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="h-32 animate-pulse rounded-2xl border border-brand-100 bg-brand-50/40 dark:border-brand-900 dark:bg-transparent" />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
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
        <div className="mt-6">
          <Link
            href="/"
            className="rounded-lg border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 dark:border-brand-800 dark:bg-transparent dark:text-brand-300"
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  const streakCount = dashboard?.streak.count ?? 0;
  const totalSeconds = dashboard?.totalStudySeconds ?? 0;
  const totalCompleted = dashboard?.totalCompletedLessons ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            学习中心
          </h1>
          <p className="mt-2 text-sm text-foreground/60">
            查看你的学习连续打卡、完成进度与最近学习记录。
          </p>
        </div>
        <Link
          href="/courses"
          className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
        >
          继续学习 →
        </Link>
      </header>

      {/* KPI cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          icon="🔥"
          accent="from-orange-400 to-rose-500"
          value={`${streakCount} 天`}
          label="连续打卡"
          hint={
            dashboard?.streak.lastDate
              ? `上次打卡：${dashboard.streak.lastDate}`
              : "完成任意课时即可开启 streak"
          }
        />
        <KpiCard
          icon="⏱️"
          accent="from-brand-500 to-violet-600"
          value={formatDuration(totalSeconds)}
          label="累计学习时长"
          hint={`共完成 ${totalCompleted} 节课时`}
        />
        <KpiCard
          icon="✅"
          accent="from-accent-500 to-accent-700"
          value={`${totalCompleted}`}
          label="已完成课时"
          hint={`覆盖 ${dashboard?.languages.length ?? 0} 个语种`}
        />
      </section>

      {/* Achievement entry card */}
      <section className="mt-6">
        <Link
          href="/achievements"
          className="group flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-5 shadow-sm transition-all hover:border-amber-300 hover:shadow-md dark:border-amber-800/60 dark:from-amber-900/20 dark:to-yellow-900/10"
        >
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-2xl text-white shadow-sm">
              🏆
            </span>
            <div>
              <p className="text-base font-semibold text-amber-900 dark:text-amber-200">
                成就中心
              </p>
              <p className="mt-0.5 text-xs text-amber-800/80 dark:text-amber-300/80">
                查看你的徽章、连续打卡挑战与本周学习榜
              </p>
            </div>
          </div>
          <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-800 transition-transform group-hover:translate-x-1 dark:text-amber-200">
            前往 →
          </span>
        </Link>
      </section>

      {/* Progress rings by language */}
      <section className="mt-8 rounded-2xl border border-brand-100 bg-white p-6 shadow-sm dark:border-brand-900 dark:bg-transparent">
        <h2 className="text-lg font-semibold">按语言完成度</h2>
        <p className="mt-1 text-xs text-foreground/50">
          每种语言的已完成课时数 / 总课时数
        </p>
        {dashboard && dashboard.languages.length > 0 ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {dashboard.languages.map((lang) => (
              <ProgressRingCard key={lang.languageCode} lang={lang} />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-brand-200 bg-brand-50/40 p-8 text-center text-sm text-foreground/50 dark:border-brand-800 dark:bg-brand-900/10">
            暂无语言课程数据。
          </div>
        )}
      </section>

      {/* 7-day study-time bar chart */}
      <section className="mt-6 rounded-2xl border border-brand-100 bg-white p-6 shadow-sm dark:border-brand-900 dark:bg-transparent">
        <h2 className="text-lg font-semibold">最近 7 天学习时长</h2>
        <p className="mt-1 text-xs text-foreground/50">
          每日学习时长（分钟）
        </p>
        {dashboard && <BarChart buckets={dashboard.dailyTimes} />}
      </section>

      {/* Recent lessons */}
      <section className="mt-6 rounded-2xl border border-brand-100 bg-white p-6 shadow-sm dark:border-brand-900 dark:bg-transparent">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">最近学习课时</h2>
          <Link
            href="/courses"
            className="text-sm font-medium text-brand-700 hover:text-brand-600 dark:text-brand-300"
          >
            查看全部 →
          </Link>
        </div>
        {dashboard && dashboard.recentLessons.length > 0 ? (
          <ul className="mt-4 divide-y divide-brand-50 dark:divide-brand-900/50">
            {dashboard.recentLessons.map((item) => (
              <RecentLessonRow key={item.lessonProgress.id} item={item} />
            ))}
          </ul>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-brand-200 bg-brand-50/40 p-8 text-center text-sm text-foreground/50 dark:border-brand-800 dark:bg-brand-900/10">
            还没有学习记录，去
            <Link
              href="/courses"
              className="ml-1 font-medium text-brand-700 hover:underline dark:text-brand-300"
            >
              选择课时
            </Link>
            开始吧。
          </div>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------
// Presentational components
// ---------------------------------------------------------------

function KpiCard({
  icon,
  accent,
  value,
  label,
  hint,
}: {
  icon: string;
  accent: string;
  value: string;
  label: string;
  hint?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-100 bg-white p-5 shadow-sm dark:border-brand-900 dark:bg-transparent">
      <div
        className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${accent} opacity-20 blur-2xl`}
      />
      <div className="relative flex items-center gap-4">
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-2xl text-white shadow-sm`}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-xs text-foreground/60">{label}</p>
        </div>
      </div>
      {hint && (
        <p className="relative mt-3 text-xs text-foreground/50">{hint}</p>
      )}
    </div>
  );
}

function ProgressRingCard({ lang }: { lang: LanguageProgress }) {
  const ratio =
    lang.totalLessons > 0 ? lang.completedLessons / lang.totalLessons : 0;
  const pct = Math.round(ratio * 100);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - ratio);

  // Color per language code (consistent across renders).
  const color =
    lang.languageCode === 'english'
      ? '#4f46e5'
      : lang.languageCode === 'japanese'
        ? '#ec4899'
        : lang.languageCode === 'korean'
          ? '#10b981'
          : '#6366f1';

  return (
    <div className="flex items-center gap-4 rounded-xl border border-brand-100 bg-brand-50/30 p-4 dark:border-brand-900 dark:bg-brand-900/10">
      <svg width="96" height="96" viewBox="0 0 96 96" className="shrink-0">
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-brand-100 dark:text-brand-900"
        />
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 48 48)"
          style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
        />
        <text
          x="48"
          y="48"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-foreground"
          style={{ fontSize: '18px', fontWeight: 700 }}
        >
          {pct}%
        </text>
      </svg>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{lang.languageName}</p>
        <p className="mt-0.5 text-xs uppercase tracking-wider text-foreground/50">
          {lang.languageCode}
        </p>
        <p className="mt-2 text-xs text-foreground/60">
          {lang.completedLessons} / {lang.totalLessons} 课时
        </p>
      </div>
    </div>
  );
}

function BarChart({ buckets }: { buckets: DailyTimeBucket[] }) {
  const maxSeconds = Math.max(60, ...buckets.map((b) => b.seconds));
  const maxMinutes = Math.ceil(maxSeconds / 60);

  return (
    <div className="mt-5">
      <div className="flex items-end justify-between gap-2 h-44">
        {buckets.map((b) => {
          const minutes = b.seconds / 60;
          const heightPct = maxSeconds > 0 ? (b.seconds / maxSeconds) * 100 : 0;
          const isToday = b.date === todayStringLocal();
          return (
            <div
              key={b.date}
              className="flex flex-1 flex-col items-center gap-2"
            >
              <div className="flex h-full w-full items-end justify-center">
                <div
                  className={`w-full max-w-[2.5rem] rounded-t-md ${
                    isToday
                      ? 'bg-gradient-to-t from-brand-600 to-violet-500'
                      : 'bg-gradient-to-t from-brand-400 to-brand-300'
                  }`}
                  style={{ height: `${heightPct}%`, minHeight: b.seconds > 0 ? '4px' : '0' }}
                  title={`${minutes.toFixed(1)} 分钟`}
                />
              </div>
              <span className="text-[10px] text-foreground/50">
                {formatDayLabel(b.date)}
              </span>
              <span className="text-[11px] font-medium text-foreground/70">
                {minutes.toFixed(0)}m
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-right text-xs text-foreground/40">
        最大 {maxMinutes} 分钟
      </p>
    </div>
  );
}

function RecentLessonRow({ item }: { item: RecentLesson }) {
  const { lessonProgress, lessonTitle, languageName } = item;
  const statusLabel =
    lessonProgress.status === 'COMPLETED'
      ? '已完成'
      : lessonProgress.status === 'IN_PROGRESS'
        ? '学习中'
        : '未开始';
  const statusClass =
    lessonProgress.status === 'COMPLETED'
      ? 'bg-accent-100 text-accent-700 dark:bg-accent-700/20 dark:text-accent-400'
      : lessonProgress.status === 'IN_PROGRESS'
        ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
        : 'bg-foreground/10 text-foreground/60';

  return (
    <li>
      <Link
        href={`/courses/lessons/${lessonProgress.lessonId}`}
        className="flex items-center gap-3 py-3 text-sm transition-colors hover:bg-brand-50/60 dark:hover:bg-brand-900/10"
      >
        <span
          className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${statusClass}`}
        >
          {statusLabel}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">{lessonTitle}</p>
          <p className="mt-0.5 truncate text-xs text-foreground/50">
            {languageName ? `${languageName} · ` : ''}
            正确率 {formatAccuracy(lessonProgress.accuracy)} · 用时{' '}
            {formatDuration(lessonProgress.timeSpent)}
          </p>
        </div>
        <span className="shrink-0 text-xs text-foreground/40">
          {formatRelativeTime(lessonProgress.updatedAt)}
        </span>
      </Link>
    </li>
  );
}

// ---------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0 分钟';
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  if (hours > 0) return `${hours} 小时 ${remMinutes} 分钟`;
  if (minutes > 0) return `${minutes} 分钟`;
  return `${seconds} 秒`;
}

function formatAccuracy(accuracy: number | null): string {
  if (accuracy === null || accuracy === undefined) return '—';
  return `${Math.round(accuracy * 100)}%`;
}

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} 天前`;
  const date = new Date(iso);
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDayLabel(dateStr: string): string {
  // dateStr is YYYY-MM-DD; show MM-DD only.
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[1]}-${parts[2]}`;
  return dateStr;
}

function todayStringLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}
