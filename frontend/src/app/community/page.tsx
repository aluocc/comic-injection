"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, ApiError } from "@/lib/api";
import type { Circle } from "@/lib/types";

/**
 * Community landing page: lists every language circle as a clickable card.
 * Clicking a card navigates to `/community/[langCode]` (the post list).
 *
 * Endpoint: GET /community/circles (public).
 */
export default function CommunityPage() {
  const [circles, setCircles] = useState<Circle[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiGet<Circle[]>("/community/circles");
        if (!cancelled) setCircles(data);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError) {
          setError(err.message || "加载圈子失败");
        } else {
          setError("网络异常，请稍后重试");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-16">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          学习社区
        </h1>
        <p className="mt-2 text-sm text-foreground/60">
          加入语言学习圈子，与同学一起交流、提问、分享学习心得。
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-300">
          {error}
        </div>
      )}

      {circles === null && !error ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-2xl border border-brand-100 bg-brand-50/40 dark:border-brand-900 dark:bg-transparent"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {circles?.map((c) => (
            <CircleCard key={c.id} circle={c} />
          ))}
        </div>
      )}

      {circles && circles.length === 0 && (
        <div className="rounded-2xl border border-brand-100 bg-white p-10 text-center text-sm text-foreground/60 dark:border-brand-900 dark:bg-transparent">
          暂无圈子，请稍后再来。
        </div>
      )}
    </div>
  );
}

function CircleCard({ circle }: { circle: Circle }) {
  return (
    <Link
      href={`/community/${circle.languageCode}`}
      className="group relative flex h-44 flex-col justify-between overflow-hidden rounded-2xl border border-brand-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-brand-900 dark:bg-transparent"
    >
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-brand-300/30 to-violet-500/30 blur-2xl transition-opacity group-hover:opacity-80" />
      <div className="relative flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-2xl dark:bg-brand-900/40">
          {circle.icon ?? "🌐"}
        </span>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {circle.name}
          </h2>
          <p className="text-xs uppercase tracking-wider text-foreground/50">
            {circle.languageCode}
          </p>
        </div>
      </div>
      {circle.description && (
        <p className="relative mt-2 line-clamp-2 text-sm text-foreground/60">
          {circle.description}
        </p>
      )}
      <div className="relative mt-4 flex items-center justify-between">
        <span className="text-sm text-foreground/60">
          {circle.postCount} 篇帖子
        </span>
        <span className="rounded-full bg-brand-600 px-3 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
          进入圈子
        </span>
      </div>
    </Link>
  );
}
