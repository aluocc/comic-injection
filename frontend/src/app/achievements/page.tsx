"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type {
  Badge,
  BadgeCategory,
  BadgeWithStatus,
  Leaderboard,
  LeaderboardEntry,
} from "@/lib/types";

/**
 * Achievement center (Task 11.3).
 *
 * Calls:
 *   • GET  /achievement/badges       — all badges + the caller's award status
 *   • GET  /achievement/leaderboard  — Top-20 weekly leaderboard + own rank
 *   • POST /achievement/check        — re-evaluates rules and awards new badges
 *
 * Layout:
 *   • Header: title + "检查新成就" button
 *   • Badges section, grouped by category (streak / learning / social / milestone)
 *     — awarded badges are highlighted, un-awarded ones are dimmed
 *   • Leaderboard section: Top-20 + the current user's row (highlighted)
 */
export default function AchievementsPage() {
  const router = useRouter();
  const { token, user, hydrated, hydrate } = useAuthStore();

  const [badges, setBadges] = useState<BadgeWithStatus[] | null>(null);
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const loadAll = useCallback(async () => {
    const [badgeRes, lbRes] = await Promise.all([
      apiGet<BadgeWithStatus[]>("/achievement/badges"),
      apiGet<Leaderboard>("/achievement/leaderboard"),
    ]);
    setBadges(badgeRes);
    setLeaderboard(lbRes);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.replace("/login?expired=1");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await loadAll();
        if (cancelled) return;
        void data;
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError) {
          setError(err.message || "加载成就数据失败");
        } else {
          setError("网络异常，请稍后重试");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, token, router, loadAll]);

  const onCheck = useCallback(async () => {
    setChecking(true);
    setError(null);
    try {
      const result = await apiPost<{ newBadges: Badge[]; allBadges: Badge[] }>(
        "/achievement/check",
      );
      // Refresh both lists so the UI reflects newly awarded badges and any
      // leaderboard score changes triggered elsewhere.
      await loadAll();
      if (result.newBadges.length > 0) {
        const names = result.newBadges
          .map((b) => `${b.icon} ${b.name}`)
          .join("、");
        setToast(`恭喜解锁 ${result.newBadges.length} 个新成就：${names}`);
      } else {
        setToast("已检查，暂无新成就解锁，继续加油！");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "检查成就失败");
      } else {
        setError("网络异常，请稍后重试");
      }
    } finally {
      setChecking(false);
      // Auto-dismiss the toast after a few seconds.
      window.setTimeout(() => setToast(null), 4000);
    }
  }, [loadAll]);

  if (!hydrated || (!badges && !leaderboard && !error)) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="h-32 animate-pulse rounded-2xl border border-brand-100 bg-brand-50/40 dark:border-brand-900 dark:bg-transparent" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-2xl border border-brand-100 bg-brand-50/40 dark:border-brand-900 dark:bg-transparent"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error && !badges && !leaderboard) {
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            成就中心
          </h1>
          <p className="mt-2 text-sm text-foreground/60">
            收集徽章、挑战连续打卡、与同学竞技本周学习榜。
          </p>
        </div>
        <button
          type="button"
          onClick={onCheck}
          disabled={checking}
          className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {checking ? "检查中…" : "检查新成就"}
        </button>
      </header>

      {error ? (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      {toast ? (
        <div className="mb-6 rounded-lg border border-accent-200 bg-accent-50 px-4 py-3 text-sm font-medium text-accent-700 dark:border-accent-800 dark:bg-accent-900/20 dark:text-accent-300">
          {toast}
        </div>
      ) : null}

      {/* Badges by category */}
      <BadgesSection badges={badges ?? []} />

      {/* Leaderboard */}
      <LeaderboardSection
        leaderboard={leaderboard}
        currentUserId={user?.id ?? null}
      />
    </div>
  );
}

// ---------------------------------------------------------------
// Badges section
// ---------------------------------------------------------------

const CATEGORY_META: Record<
  BadgeCategory,
  { label: string; icon: string; accent: string }
> = {
  streak: {
    label: "连续打卡",
    icon: "🔥",
    accent: "from-orange-400 to-rose-500",
  },
  learning: {
    label: "学习进度",
    icon: "📚",
    accent: "from-brand-500 to-violet-600",
  },
  social: {
    label: "社区互动",
    icon: "💬",
    accent: "from-sky-400 to-cyan-500",
  },
  milestone: {
    label: "里程碑",
    icon: "🎯",
    accent: "from-amber-400 to-yellow-500",
  },
};

function BadgesSection({ badges }: { badges: BadgeWithStatus[] }) {
  const grouped = useMemo(() => {
    const map: Record<BadgeCategory, BadgeWithStatus[]> = {
      streak: [],
      learning: [],
      social: [],
      milestone: [],
    };
    for (const b of badges) {
      const cat = (b.category as BadgeCategory) ?? 'milestone';
      if (map[cat]) map[cat].push(b);
    }
    return map;
  }, [badges]);

  const totalAwarded = badges.filter((b) => b.awarded).length;

  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm dark:border-brand-900 dark:bg-transparent">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">我的徽章</h2>
        <span className="text-sm text-foreground/60">
          已解锁 <span className="font-bold text-brand-700 dark:text-brand-300">{totalAwarded}</span> / {badges.length}
        </span>
      </div>
      <p className="mt-1 text-xs text-foreground/50">
        按类别分组，灰色为尚未解锁的徽章。
      </p>

      <div className="mt-5 space-y-6">
        {(Object.keys(grouped) as BadgeCategory[]).map((cat) => {
          const list = grouped[cat];
          if (list.length === 0) return null;
          const meta = CATEGORY_META[cat];
          const awardedInCat = list.filter((b) => b.awarded).length;
          return (
            <div key={cat}>
              <div className="mb-3 flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br ${meta.accent} text-sm text-white shadow-sm`}
                >
                  {meta.icon}
                </span>
                <h3 className="text-sm font-semibold">{meta.label}</h3>
                <span className="text-xs text-foreground/50">
                  {awardedInCat} / {list.length}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {list.map((b) => (
                  <BadgeCard key={b.id} badge={b} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function BadgeCard({ badge }: { badge: BadgeWithStatus }) {
  const awarded = badge.awarded;
  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-4 transition-all ${
        awarded
          ? "border-brand-200 bg-gradient-to-br from-brand-50 to-violet-50 shadow-sm dark:border-brand-700 dark:from-brand-900/30 dark:to-violet-900/20"
          : "border-dashed border-brand-200 bg-brand-50/30 opacity-70 dark:border-brand-900 dark:bg-brand-900/10"
      }`}
      title={badge.description}
    >
      {awarded ? (
        <span className="absolute right-2 top-2 rounded-full bg-accent-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
          已解锁
        </span>
      ) : (
        <span className="absolute right-2 top-2 rounded-full bg-foreground/10 px-1.5 py-0.5 text-[10px] font-medium text-foreground/60">
          未解锁
        </span>
      )}
      <div className="flex flex-col items-center gap-2 text-center">
        <span
          className={`flex h-14 w-14 items-center justify-center rounded-full text-3xl ${
            awarded
              ? "bg-white shadow-sm dark:bg-brand-900/60"
              : "bg-foreground/5 grayscale"
          }`}
        >
          {badge.icon}
        </span>
        <div>
          <p className={`text-sm font-semibold ${awarded ? "" : "text-foreground/60"}`}>
            {badge.name}
          </p>
          <p className="mt-0.5 text-xs text-foreground/50">
            {badge.description}
          </p>
        </div>
        {awarded && badge.awardedAt ? (
          <p className="text-[10px] text-foreground/40">
            {formatDate(badge.awardedAt)}
          </p>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Leaderboard section
// ---------------------------------------------------------------

function LeaderboardSection({
  leaderboard,
  currentUserId,
}: {
  leaderboard: Leaderboard | null;
  currentUserId: string | null;
}) {
  const topUsers = leaderboard?.topUsers ?? [];
  const currentUser = leaderboard?.currentUser ?? null;
  const weekKey = leaderboard?.weekKey ?? "";

  return (
    <section className="mt-6 rounded-2xl border border-brand-100 bg-white p-6 shadow-sm dark:border-brand-900 dark:bg-transparent">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">本周学习榜</h2>
          <p className="mt-1 text-xs text-foreground/50">
            按本周已完成课时数排名，每周一重置。
          </p>
        </div>
        {weekKey ? (
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            {weekKey}
          </span>
        ) : null}
      </div>

      {topUsers.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-brand-200 bg-brand-50/40 p-8 text-center text-sm text-foreground/50 dark:border-brand-800 dark:bg-brand-900/10">
          本周还没有人完成课时，去
          <Link
            href="/courses"
            className="ml-1 font-medium text-brand-700 hover:underline dark:text-brand-300"
          >
            学习一节
          </Link>
          抢占榜首吧！
        </div>
      ) : (
        <ol className="mt-5 divide-y divide-brand-50 dark:divide-brand-900/50">
          {topUsers.map((entry) => (
            <LeaderboardRow
              key={entry.userId}
              entry={entry}
              isCurrentUser={entry.userId === currentUserId}
            />
          ))}
        </ol>
      )}

      {currentUser && currentUser.rank > 0 && currentUser.rank > topUsers.length ? (
        <>
          <div className="my-2 text-center text-xs text-foreground/40">
            · · ·
          </div>
          <ol className="divide-y divide-brand-50 dark:divide-brand-900/50">
            <LeaderboardRow
              entry={currentUser}
              isCurrentUser
            />
          </ol>
        </>
      ) : null}

      {currentUser && currentUser.score === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-brand-200 bg-brand-50/40 p-4 text-center text-sm text-foreground/60 dark:border-brand-800 dark:bg-brand-900/10">
          你本周还未完成课时，
          <Link
            href="/courses"
            className="ml-1 font-medium text-brand-700 hover:underline dark:text-brand-300"
          >
            去学习一节
          </Link>
          上榜吧。
        </div>
      ) : null}
    </section>
  );
}

function LeaderboardRow({
  entry,
  isCurrentUser,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}) {
  const rank = entry.rank;
  const rankStyle =
    rank === 1
      ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white"
      : rank === 2
        ? "bg-gradient-to-br from-slate-300 to-slate-400 text-white"
        : rank === 3
          ? "bg-gradient-to-br from-orange-300 to-orange-500 text-white"
          : "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300";

  return (
    <li
      className={`flex items-center gap-3 py-3 text-sm transition-colors ${
        isCurrentUser
          ? "rounded-lg bg-brand-50/80 px-3 dark:bg-brand-900/30"
          : "px-3 hover:bg-brand-50/40 dark:hover:bg-brand-900/10"
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${rankStyle}`}
      >
        {rank}
      </span>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-brand-700 dark:bg-brand-800/40 dark:text-brand-200">
        {entry.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.avatar}
            alt={entry.nickname}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-sm font-bold">
            {entry.nickname.slice(0, 1).toUpperCase()}
          </span>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">
          {entry.nickname}
          {isCurrentUser ? (
            <span className="ml-2 rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-medium text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
              我
            </span>
          ) : null}
        </p>
      </div>
      <span className="shrink-0 text-sm font-semibold text-foreground/80">
        {entry.score}
        <span className="ml-1 text-xs font-normal text-foreground/50">课时</span>
      </span>
    </li>
  );
}

// ---------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}
