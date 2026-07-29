"use client";

import { useEffect } from "react";
import Link from "next/link";
import { HealthStatus } from "@/components/health-status";
import { useAuthStore } from "@/stores/auth-store";

export default function Home() {
  const { token, user, hydrated, hydrate } = useAuthStore();

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:py-20">
      <section className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-accent-50 p-8 shadow-sm dark:border-brand-900 dark:from-brand-900/40 dark:via-transparent dark:to-accent-700/10 sm:p-12">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gradient-to-br from-brand-400/30 to-violet-600/30 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center rounded-full border border-brand-200 bg-white/70 px-3 py-1 text-xs font-medium text-brand-700 dark:border-brand-800 dark:bg-transparent dark:text-brand-300">
            多语种在线学习平台 · Scaffolding Ready
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            欢迎来到{" "}
            <span className="bg-gradient-to-r from-brand-600 to-violet-600 bg-clip-text text-transparent">
              多语种学习平台
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground/70">
            一次学习，多种语言。在这里你可以按课程进度学习词汇、完成练习，
            并跟踪自己的成长轨迹。当前为项目脚手架阶段，前端 Next.js +
            Tailwind 已就绪，后端 NestJS 已就绪。
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {hydrated && token && user ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
                >
                  进入学习中心
                </Link>
                <Link
                  href="/courses"
                  className="rounded-xl border border-brand-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 dark:border-brand-800 dark:bg-transparent dark:text-brand-300"
                >
                  浏览课程
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/courses"
                  className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
                >
                  开始学习
                </Link>
                <Link
                  href="/register"
                  className="rounded-xl border border-brand-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 dark:border-brand-800 dark:bg-transparent dark:text-brand-300"
                >
                  立即注册
                </Link>
                <Link
                  href="/login"
                  className="rounded-xl border border-brand-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 dark:border-brand-800 dark:bg-transparent dark:text-brand-300"
                >
                  登录账号
                </Link>
              </>
            )}
          </div>

          <HealthStatus />
        </div>
      </section>

      {hydrated && token && user && (
        <section className="mt-8 rounded-2xl border border-brand-100 bg-white p-6 shadow-sm dark:border-brand-900 dark:bg-transparent">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-600 text-lg font-bold text-white">
              {user.nickname.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="text-sm text-foreground/60">欢迎回来</p>
              <p className="text-lg font-semibold text-foreground">
                {user.nickname}
              </p>
              <p className="mt-0.5 text-xs text-foreground/50">
                {user.email}
                {user.targetLanguage
                  ? ` · 目标：${user.targetLanguage}`
                  : ""}
                {user.currentLevel ? ` · ${user.currentLevel}` : ""}
              </p>
            </div>
          </div>
        </section>
      )}

      <section
        id="features"
        className="mt-10 grid gap-4 sm:grid-cols-3"
      >
        <FeatureCard
          title="多语种课程"
          desc="按语言、难度、主题组织的学习路径。"
        />
        <FeatureCard title="词汇练习" desc="间隔重复与智能复习。" />
        <FeatureCard title="进度跟踪" desc="可视化你的学习成长曲线。" />
      </section>

      <section className="mt-6">
        <Link
          href="/courses"
          className="group relative flex flex-col items-start gap-4 overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-accent-50 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-md dark:border-brand-800 dark:from-brand-900/40 dark:via-transparent dark:to-accent-700/10 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-brand-400/30 to-violet-600/30 blur-3xl transition-opacity group-hover:opacity-80" />
          <div className="relative flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl text-white shadow-sm">
              🎓
            </span>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                开始学习
              </h3>
              <p className="mt-0.5 text-sm text-foreground/60">
                选择英语、日语或韩语，按等级循序渐进地进入课程。
              </p>
            </div>
          </div>
          <span className="relative rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors group-hover:bg-brand-700">
            进入课程 →
          </span>
        </Link>
      </section>

      {hydrated && token && user && (
        <section className="mt-4">
          <Link
            href="/dashboard"
            className="group relative flex flex-col items-start gap-4 overflow-hidden rounded-2xl border border-accent-200 bg-gradient-to-br from-accent-50 via-white to-brand-50 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent-400 hover:shadow-md dark:border-accent-700/40 dark:from-accent-700/10 dark:via-transparent dark:to-brand-900/20 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-accent-400/30 to-brand-500/30 blur-3xl transition-opacity group-hover:opacity-80" />
            <div className="relative flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700 text-2xl text-white shadow-sm">
                📊
              </span>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  学习中心
                </h3>
                <p className="mt-0.5 text-sm text-foreground/60">
                  查看连续打卡、完成进度、7 日学习趋势与最近学习记录。
                </p>
              </div>
            </div>
            <span className="relative rounded-xl bg-accent-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors group-hover:bg-accent-700">
              查看仪表盘 →
            </span>
          </Link>
        </section>
      )}

      {hydrated && token && user && (
        <section className="mt-4">
          <Link
            href={user.targetLanguage ? "/recommendation" : "/onboarding"}
            className="group relative flex flex-col items-start gap-4 overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-brand-50 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-400 hover:shadow-md dark:border-violet-700/40 dark:from-violet-700/10 dark:via-transparent dark:to-brand-900/20 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-violet-400/30 to-brand-500/30 blur-3xl transition-opacity group-hover:opacity-80" />
            <div className="relative flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-brand-600 text-2xl text-white shadow-sm">
                🧭
              </span>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  个性化学习路径
                </h3>
                <p className="mt-0.5 text-sm text-foreground/60">
                  {user.targetLanguage
                    ? "查看为你定制的本周学习计划与重点模块。"
                    : "完成引导流程，获取专属每周学习计划。"}
                </p>
              </div>
            </div>
            <span className="relative rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors group-hover:bg-violet-700">
              {user.targetLanguage ? "查看学习路径 →" : "开始我的学习路径 →"}
            </span>
          </Link>
        </section>
      )}
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-brand-900 dark:bg-transparent">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-100 text-accent-700 dark:bg-accent-700/20 dark:text-accent-400">
        •
      </div>
      <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-foreground/60">{desc}</p>
    </div>
  );
}
