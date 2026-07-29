"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiGet, apiPost, apiDelete, ApiError } from "@/lib/api";
import type { PostDetail, PostComment, ToggleLikeResult } from "@/lib/types";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Post detail page.
 *
 * Endpoint: GET /community/posts/:postId (public).
 * Shows the post title, author, content, tags, a like toggle button,
 * the comment list, and a comment input (when logged in).
 */
export default function PostDetailPage() {
  const params = useParams<{ postId: string }>();
  const postId = params?.postId ?? "";
  const router = useRouter();
  const { token, user, hydrated } = useAuthStore();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeBusy, setLikeBusy] = useState(false);

  // comment form state
  const [commentText, setCommentText] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const loadPost = async () => {
    try {
      const data = await apiGet<PostDetail>(
        `/community/posts/${encodeURIComponent(postId)}`,
      );
      setPost(data);
      setLikeCount(data.likeCount);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "加载帖子失败");
      } else {
        setError("网络异常，请稍后重试");
      }
    }
  };

  useEffect(() => {
    loadPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const onToggleLike = async () => {
    if (!token) {
      router.push("/login?expired=1");
      return;
    }
    setLikeBusy(true);
    try {
      const res = await apiPost<ToggleLikeResult>(
        `/community/posts/${encodeURIComponent(postId)}/like`,
      );
      setLiked(res.liked);
      setLikeCount(res.likeCount);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "操作失败");
      }
    } finally {
      setLikeBusy(false);
    }
  };

  const onSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommentBusy(true);
    setCommentError(null);
    try {
      const newComment = await apiPost<PostComment>(
        `/community/posts/${encodeURIComponent(postId)}/comments`,
        { content: commentText.trim() },
      );
      setPost((prev) =>
        prev
          ? {
              ...prev,
              comments: [...prev.comments, newComment],
              commentCount: prev.commentCount + 1,
            }
          : prev,
      );
      setCommentText("");
    } catch (err) {
      if (err instanceof ApiError) {
        setCommentError(err.message || "评论失败");
      } else {
        setCommentError("网络异常，请稍后重试");
      }
    } finally {
      setCommentBusy(false);
    }
  };

  const onDeletePost = async () => {
    if (!confirm("确定要删除这篇帖子吗？此操作不可撤销。")) return;
    try {
      await apiDelete(`/community/posts/${encodeURIComponent(postId)}`);
      router.push(
        post ? `/community` : "/community",
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "删除失败");
      }
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <nav className="mb-6 flex items-center gap-2 text-sm text-foreground/60">
        <Link href="/community" className="hover:text-brand-600">
          社区
        </Link>
        <span>/</span>
        <span className="text-foreground truncate">{post?.title ?? "帖子"}</span>
      </nav>

      {error && (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-300">
          {error}
        </div>
      )}

      {!post && !error ? (
        <div className="h-64 animate-pulse rounded-2xl border border-brand-100 bg-brand-50/40 dark:border-brand-900 dark:bg-transparent" />
      ) : null}

      {post ? (
        <>
          <article className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm dark:border-brand-900 dark:bg-transparent">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {post.title}
              </h1>
              {hydrated && token && user && post.author.id === user.id ? (
                <button
                  type="button"
                  onClick={onDeletePost}
                  className="shrink-0 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:border-rose-900 dark:bg-transparent"
                >
                  删除
                </button>
              ) : null}
            </div>

            <div className="mt-3 flex items-center gap-3 text-sm text-foreground/60">
              <span className="flex items-center gap-1.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-800/40 dark:text-brand-200">
                  {post.author.nickname.slice(0, 1).toUpperCase()}
                </span>
                {post.author.nickname}
              </span>
              <span>·</span>
              <time>{formatTime(post.createdAt)}</time>
            </div>

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

            <div className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {post.content}
            </div>

            <div className="mt-6 flex items-center gap-4 border-t border-brand-50 pt-4 dark:border-brand-900/50">
              <button
                type="button"
                onClick={onToggleLike}
                disabled={likeBusy}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  liked
                    ? "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400"
                    : "border border-brand-200 text-brand-700 hover:bg-brand-50 dark:border-brand-900 dark:text-brand-300"
                }`}
              >
                <span>{liked ? "❤" : "🤍"}</span>
                <span>{likeCount}</span>
              </button>
              <span className="text-sm text-foreground/50">
                💬 {post.comments.length} 条评论
              </span>
            </div>
          </article>

          {/* Comments */}
          <section className="mt-8">
            <h2 className="mb-4 text-lg font-semibold">评论</h2>

            {hydrated && token && user ? (
              <form
                onSubmit={onSubmitComment}
                className="mb-6 rounded-2xl border border-brand-100 bg-white p-4 dark:border-brand-900 dark:bg-transparent"
              >
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="写下你的评论…"
                  rows={3}
                  maxLength={2000}
                  className="w-full resize-none rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 dark:border-brand-900 dark:bg-transparent"
                />
                {commentError ? (
                  <p className="mt-2 text-xs text-rose-600">{commentError}</p>
                ) : null}
                <div className="mt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={commentBusy || !commentText.trim()}
                    className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {commentBusy ? "发送中…" : "发表评论"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mb-6 rounded-2xl border border-brand-100 bg-white p-4 text-center text-sm text-foreground/60 dark:border-brand-900 dark:bg-transparent">
                <Link href="/login" className="font-medium text-brand-600 hover:underline">
                  登录
                </Link>
                后即可发表评论。
              </div>
            )}

            <div className="space-y-3">
              {post.comments.length === 0 ? (
                <p className="rounded-2xl border border-brand-100 bg-white p-6 text-center text-sm text-foreground/50 dark:border-brand-900 dark:bg-transparent">
                  还没有评论，快来抢沙发！
                </p>
              ) : (
                post.comments.map((c) => (
                  <CommentItem key={c.id} comment={c} />
                ))
              )}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

function CommentItem({ comment }: { comment: PostComment }) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-4 dark:border-brand-900 dark:bg-transparent">
      <div className="flex items-center gap-2 text-sm">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-800/40 dark:text-brand-200">
          {comment.author.nickname.slice(0, 1).toUpperCase()}
        </span>
        <span className="font-medium text-foreground">
          {comment.author.nickname}
        </span>
        <time className="text-xs text-foreground/40">
          {formatTime(comment.createdAt)}
        </time>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/80">
        {comment.content}
      </p>
    </div>
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
