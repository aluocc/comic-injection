"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiGet, ApiError } from "@/lib/api";
import {
  type LanguageTree,
  type Unit,
  type Lesson,
  LESSON_TYPE_META,
} from "@/lib/types";

/**
 * Course tree page for a single language.
 *
 * Layout: levels grouped as sections, each level lists its units as
 * expandable accordions; each unit reveals its lesson list. Clicking a
 * lesson navigates to `/courses/lessons/[lessonId]`.
 */
export default function CourseTreePage() {
  const params = useParams<{ langCode: string }>();
  const langCode = params?.langCode ?? '';

  const [tree, setTree] = useState<LanguageTree | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiGet<LanguageTree>(
          `/courses/languages/${encodeURIComponent(langCode)}/tree`,
        );
        if (!cancelled) setTree(data);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError) {
          setError(err.message || "加载课程失败");
        } else {
          setError("网络异常，请稍后重试");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [langCode]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <nav className="mb-6 flex items-center gap-2 text-sm text-foreground/60">
        <Link href="/courses" className="hover:text-brand-600">
          课程
        </Link>
        <span>/</span>
        <span className="text-foreground">
          {tree ? `${tree.icon ?? ''} ${tree.name}` : langCode}
        </span>
      </nav>

      {tree && (
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {tree.icon ?? '🌐'} {tree.name}课程
          </h1>
          <p className="mt-2 text-sm text-foreground/60">
            共 {tree.levels.length} 个等级 · 选择单元开始学习
          </p>
        </header>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-300">
          {error}
        </div>
      )}

      {!tree && !error && (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl border border-brand-100 bg-brand-50/40 dark:border-brand-900 dark:bg-transparent"
            />
          ))}
        </div>
      )}

      {tree && tree.levels.length === 0 && (
        <div className="rounded-2xl border border-brand-100 bg-white p-10 text-center text-sm text-foreground/60 dark:border-brand-900 dark:bg-transparent">
          该语言暂无课程内容。
        </div>
      )}

      {tree &&
        tree.levels.map((level) => (
          <section key={level.id} className="mb-8">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
                {level.code}
              </span>
              <div>
                <h2 className="text-lg font-semibold">
                  {level.code} · {level.name}
                </h2>
                <p className="text-xs text-foreground/50">
                  {level.units.length} 个单元
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {level.units.map((unit) => (
                <UnitAccordion key={unit.id} unit={unit} />
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}

function UnitAccordion({ unit }: { unit: Unit }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm dark:border-brand-900 dark:bg-transparent">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-brand-50/60 dark:hover:bg-brand-900/10"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent-100 text-xs font-bold text-accent-700 dark:bg-accent-700/20 dark:text-accent-400">
              {unit.order}
            </span>
            <h3 className="truncate text-sm font-semibold text-foreground">
              {unit.title}
            </h3>
          </div>
          {unit.description && (
            <p className="mt-1 line-clamp-1 pl-8 text-xs text-foreground/50">
              {unit.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            {unit.lessons.length} 课时
          </span>
          <span
            className={`text-foreground/40 transition-transform ${open ? 'rotate-90' : ''}`}
          >
            ▶
          </span>
        </div>
      </button>

      {open && (
        <ul className="divide-y divide-brand-50 border-t border-brand-50 dark:divide-brand-900/50 dark:border-brand-900/50">
          {unit.lessons.map((lesson) => (
            <LessonRow key={lesson.id} lesson={lesson} />
          ))}
        </ul>
      )}
    </div>
  );
}

function LessonRow({ lesson }: { lesson: Lesson }) {
  const meta = useMemo(() => LESSON_TYPE_META[lesson.type], [lesson.type]);
  return (
    <li>
      <Link
        href={`/courses/lessons/${lesson.id}`}
        className="flex items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-brand-50/60 dark:hover:bg-brand-900/10"
      >
        <span className="text-lg" aria-hidden>
          {meta.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">{lesson.title}</p>
          {lesson.description && (
            <p className="truncate text-xs text-foreground/50">
              {lesson.description}
            </p>
          )}
        </div>
        <span className="shrink-0 rounded-md bg-brand-50 px-2 py-0.5 text-xs text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
          {meta.label}
        </span>
        <span className="shrink-0 text-xs text-foreground/40">
          {lesson.duration} 分钟
        </span>
      </Link>
    </li>
  );
}
