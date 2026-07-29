"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import type { Circle, PostListItem } from "@/lib/types";
import { useAuthStore } from "@/stores/auth-store";

/**
 * New-post form page.
 *
 * Lets a logged-in user pick a circle, enter a title/content/tags and submit
 * via POST /community/circles/:langCode/posts. On success the user is
 * redirected to the new post's detail page.
 */
export default function NewPostPage() {
  const router = useRouter();
  const { token, user, hydrated } = useAuthStore();

  const [circles, setCircles] = useState<Circle[]>([]);
  const [langCode, setLangCode] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load circles + pre-select from ?circle= query param.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiGet<Circle[]>("/community/circles");
        if (cancelled) return;
        setCircles(data);
        // Read ?circle= from the URL without useSearchParams (avoids Suspense).
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const preselect = params.get("circle");
          if (preselect && data.some((c) => c.languageCode === preselect)) {
            setLangCode(preselect);
          } else if (data.length > 0) {
            setLangCode(data[0].languageCode);
          }
        } else if (data.length > 0) {
          setLangCode(data[0].languageCode);
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError) {
          setError(err.message || "加载圈子失败");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Redirect to login when not authenticated.
  useEffect(() => {
    if (hydrated && (!token || !user)) {
      router.replace("/login?expired=1");
    }
  }, [hydrated, token, user, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!langCode || !title.trim() || !content.trim()) return;
    setSubmitting(true);
    setError(null);
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    try {
      const post = await apiPost<PostListItem>(
        `/community/circles/${encodeURIComponent(langCode)}/posts`,
        { title: title.trim(), content: content.trim(), tags },
      );
      router.push(`/community/posts/${post.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "发帖失败");
      } else {
        setError("网络异常，请稍后重试");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (hydrated && (!token || !user)) {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <nav className="mb-6 flex items-center gap-2 text-sm text-foreground/60">
        <Link href="/community" className="hover:text-brand-600">
          社区
        </Link>
        <span>/</span>
        <span className="text-foreground">发帖</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          发布新帖
        </h1>
        <p className="mt-2 text-sm text-foreground/60">
          选择圈子，分享你的学习心得或提问。
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-300">
          {error}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-2xl border border-brand-100 bg-white p-6 shadow-sm dark:border-brand-900 dark:bg-transparent"
      >
        <div>
          <label
            htmlFor="circle"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            选择圈子
          </label>
          <select
            id="circle"
            value={langCode}
            onChange={(e) => setLangCode(e.target.value)}
            className="w-full rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 dark:border-brand-900 dark:bg-transparent"
          >
            {circles.length === 0 ? (
              <option value="">加载中…</option>
            ) : (
              circles.map((c) => (
                <option key={c.id} value={c.languageCode}>
                  {c.icon ?? ""} {c.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label
            htmlFor="title"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            标题
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="给帖子起个标题…"
            maxLength={200}
            required
            className="w-full rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 dark:border-brand-900 dark:bg-transparent"
          />
        </div>

        <div>
          <label
            htmlFor="content"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            内容
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="写下你想分享或讨论的内容…"
            rows={8}
            maxLength={10000}
            required
            className="w-full resize-y rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 dark:border-brand-900 dark:bg-transparent"
          />
        </div>

        <div>
          <label
            htmlFor="tags"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            标签 <span className="text-foreground/40">（用英文逗号分隔，可选）</span>
          </label>
          <input
            id="tags"
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="例如: 语法, 日常会话, N2"
            className="w-full rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 dark:border-brand-900 dark:bg-transparent"
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/community"
            className="rounded-lg border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 dark:border-brand-900 dark:bg-transparent dark:text-brand-300"
          >
            取消
          </Link>
          <button
            type="submit"
            disabled={submitting || !langCode || !title.trim() || !content.trim()}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "发布中…" : "发布"}
          </button>
        </div>
      </form>
    </div>
  );
}
