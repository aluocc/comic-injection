"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, ApiError } from "@/lib/api";
import type { Language } from "@/lib/types";

/**
 * Language selection page: lists every available language as a clickable
 * card. Clicking a card navigates to `/courses/[langCode]` (the course tree).
 */
export default function CoursesPage() {
  const [languages, setLanguages] = useState<Language[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiGet<Language[]>("/courses/languages");
        if (!cancelled) setLanguages(data);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError) {
          setError(err.message || "加载语言列表失败");
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
          选择你要学习的语言
        </h1>
        <p className="mt-2 text-sm text-foreground/60">
          按语言、难度与主题组织的分级课程，从零基础到流利表达。
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-300">
          {error}
        </div>
      )}

      {languages === null && !error ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-2xl border border-brand-100 bg-brand-50/40 dark:border-brand-900 dark:bg-transparent"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {languages?.map((lang) => (
            <LanguageCard key={lang.id} lang={lang} />
          ))}
        </div>
      )}

      {languages && languages.length === 0 && (
        <div className="rounded-2xl border border-brand-100 bg-white p-10 text-center text-sm text-foreground/60 dark:border-brand-900 dark:bg-transparent">
          暂无可用语言，请稍后再来。
        </div>
      )}
    </div>
  );
}

function LanguageCard({ lang }: { lang: Language }) {
  return (
    <Link
      href={`/courses/${lang.code}`}
      className="group relative flex h-40 flex-col justify-between overflow-hidden rounded-2xl border border-brand-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-brand-900 dark:bg-transparent"
    >
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-brand-300/30 to-violet-500/30 blur-2xl transition-opacity group-hover:opacity-80" />
      <div className="relative flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-2xl dark:bg-brand-900/40">
          {lang.icon ?? '🌐'}
        </span>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {lang.name}
          </h2>
          <p className="text-xs uppercase tracking-wider text-foreground/50">
            {lang.code}
          </p>
        </div>
      </div>
      <div className="relative mt-4 flex items-center justify-between">
        <span className="text-sm text-foreground/60">查看课程 →</span>
        <span className="rounded-full bg-brand-600 px-3 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
          开始
        </span>
      </div>
    </Link>
  );
}
