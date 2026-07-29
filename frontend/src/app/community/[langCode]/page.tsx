"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiGet, ApiError } from "@/lib/api";
import type { PaginatedPosts, PostListItem } from "@/lib/types";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Post list for a single circle.
 *
 * Endpoint: GET /community/circles/:langCode/posts?page=&pageSize= (public).
 * Shows a "发帖" button when the user is logged in, linking to the new-post
 * page with the current circle pre-selected.
 */
export default function CirclePostsPage() {
  const params = useParams<{ langCode: string }>();
  const langCode = params?.langCode ?? "";
  const { token, user, hydrated } = useAuthStore();

  const [data, setData] = useState<PaginatedPosts | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiGet<PaginatedPosts>(
          `/community/circles/${encodeURIComponent(langCode)}/posts?page=${page}&pageSize=10`,
        );
        if (!cancelled) setData(res);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError) {
          setError(err.message || "加载帖子失败");
        } else {
          setError("网络异常，请稍后重试");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [langCode, page]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <nav className="mb-6 flex items-center gap-2 text-sm text-foreground/60">
        <Link href="/community" className="hover:text-brand-600">
          社区
        </Link>
        <span>/</span>
        <span className="text-foreground">{langCode}</span>
      </nav>

      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            帖子列表
          </h1>
          <p className="mt-2 text-sm text-foreground/60">
            {data ? `共 ${data.total} 篇帖子` : "加载中…"}
          </p>
        </div>
        {hydrated && token && user ? (
          <Link
            href={`/community/new-post?circle=${encodeURIComponent(langCode)}`}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            + 发帖
          </Link>
        ) : null}
      </header>

      {error && (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-300">
          {error}
        </div>
      )}

      {!data && !error ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl border border-brand-100 bg-brand-50/40 dark:border-brand-900 dark:bg-transparent"
            />
          ))}
        </div>
      ) : null}

      {data && data.items.length === 0 ? (
        <div className="rounded-2xl border border-brand-100 bg-white p-10 text-center text-sm text-foreground/60 dark:border-brand-900 dark:bg-transparent">
          这个圈子还没有帖子，{hydrated && token ? "快来发第一篇吧！" : "登录后即可发帖。"}
        </div>
      ) : null}

      {data && data.items.length > 0 ? (
        <div className="space-y-4">
          {data.items.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : null}

      {data && data.totalPages > 1 ? (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-brand-900 dark:bg-transparent dark:text-brand-300"
          >
            上一页
          </button>
          <span className="text-sm text-foreground/60">
            {page} / {data.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-brand-900 dark:bg-transparent dark:text-brand-300"
          >
            下一页
          </button>
        </div>
      ) : null}
    </div>
  );
}

function PostCard({ post }: { post: PostListItem }) {
  return (
    <Link
      href={`/community/posts/${post.id}`}
      className="block rounded-2xl border border-brand-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-brand-900 dark:bg-transparent"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-base font-semibold text-foreground">
          {post.title}
        </h3>
        <time className="shrink-0 text-xs text-foreground/40">
          {formatTime(post.createdAt)}
        </time>
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-foreground/60">
        {post.content}
      </p>
      {post.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {post.tags.map((tag, i) => (
            <span
              key={i}
              className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
            >
              #{tag}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-3 flex items-center gap-4 text-xs text-foreground/50">
        <span className="flex items-center gap-1">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700 dark:bg-brand-800/40 dark:text-brand-200">
            {post.author.nickname.slice(0, 1).toUpperCase()}
          </span>
          {post.author.nickname}
        </span>
        <span>❤ {post.likeCount}</span>
        <span>💬 {post.commentCount}</span>
      </div>
    </Link>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return d.toLocaleDateString("zh-CN");
}
