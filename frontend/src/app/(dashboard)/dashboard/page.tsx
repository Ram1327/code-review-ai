'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  Code2, 
  History, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  FolderOpen
} from 'lucide-react';

interface ReviewItem {
  id: string;
  reviewType: string;
  overallScore: number;
  summary: string;
  createdAt: string;
  totalLoc: number;
  project: {
    id: string;
    projectName: string;
  };
}

export default function DashboardPage() {
  const { user, accessToken } = useAuth();
  const [recentReviews, setRecentReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const fetchRecentReviews = async () => {
      try {
        const res = await fetch(`${API_URL}/reviews?sortBy=date&order=desc`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          // Take first 3 reviews for dashboard view
          setRecentReviews(data.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to fetch recent reviews', err);
      } finally {
        setLoading(false);
      }
    };

    if (accessToken) {
      fetchRecentReviews();
    }
  }, [accessToken]);

  // Calculate aggregated stats
  const totalReviewsCount = recentReviews.length;
  const averageScore = recentReviews.length > 0
    ? Math.round(recentReviews.reduce((sum, r) => sum + r.overallScore, 0) / recentReviews.length)
    : 0;

  const stats = [
    { name: 'Total Code Reviews', value: String(totalReviewsCount), icon: History, color: 'text-indigo-500', bg: 'bg-indigo-500/5 dark:bg-indigo-950/40 border-indigo-500/20' },
    { name: 'Average Quality Score', value: `${averageScore}/100`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/5 dark:bg-emerald-950/40 border-emerald-500/20' },
    { name: 'Fixed Issues', value: '74', icon: CheckCircle2, color: 'text-teal-500', bg: 'bg-teal-500/5 dark:bg-teal-950/40 border-teal-500/20' },
    { name: 'Monitored Metrics', value: 'Checked', icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-500/5 dark:bg-amber-950/40 border-amber-500/20' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-[var(--card-bg)] border border-[var(--border)] p-8 md:p-10 shadow-sm">
        <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 pointer-events-none">
          <Sparkles className="h-40 w-40 text-indigo-500" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-550 dark:text-indigo-400 border border-indigo-500/20">
            <Sparkles className="h-3 w-3" /> AI Assistant is ready
          </span>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--foreground)]">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-indigo-650 dark:from-indigo-200 dark:to-indigo-400">{user?.name}</span>!
          </h1>
          <p className="text-[var(--text-muted)] leading-relaxed text-sm md:text-base">
            Upload your source files or paste code snippets to analyze structure, find bugs, and receive generative refactoring recommendations immediately.
          </p>
          <div className="pt-2 flex flex-wrap gap-4">
            <Link 
              href="/dashboard/new" 
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30 group"
            >
              Start New Review 
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link 
              href="/dashboard/history" 
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--input-bg)] text-[var(--foreground)] border border-[var(--border)] font-medium text-sm hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              View History
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div 
              key={stat.name} 
              className={`p-6 rounded-2xl border flex flex-col justify-between h-36 ${stat.bg}`}
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{stat.name}</span>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-3xl font-extrabold text-[var(--foreground)] tracking-tight text-left">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Reviews Table */}
        <div className="lg:col-span-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-[var(--foreground)] tracking-wide">Recent Reviews</h2>
            <Link href="/dashboard/history" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 text-sm font-medium flex items-center gap-1 group">
              See all <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                <p className="text-[var(--text-muted)] text-xs animate-pulse">Loading recent logs...</p>
              </div>
            ) : recentReviews.length === 0 ? (
              <div className="text-center py-8 text-xs text-[var(--text-muted)] flex flex-col items-center gap-2">
                <FolderOpen className="h-8 w-8 text-[var(--text-muted)]" />
                <p>No recent reviews. Upload code to begin.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider bg-slate-900/5 dark:bg-slate-900/40 p-2">
                    <th className="pb-3 pl-3">Project</th>
                    <th className="pb-3">Format</th>
                    <th className="pb-3">Score</th>
                    <th className="pb-3">Lines</th>
                    <th className="pb-3 text-right pr-3">Analyzed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-sm">
                  {recentReviews.map((review) => (
                    <tr key={review.id} className="hover:bg-slate-500/5 transition-colors">
                      <td className="py-4 pl-3 font-semibold text-[var(--foreground)] flex items-center gap-2">
                        <Code2 className="h-4 w-4 text-indigo-500" />
                        {review.project.projectName}
                      </td>
                      <td className="py-4 text-[var(--text-muted)] capitalize">{review.reviewType === 'snippet' ? 'Snippet' : 'Folder'}</td>
                      <td className="py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          review.overallScore >= 80 
                            ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20'
                        }`}>
                          {review.overallScore}%
                        </span>
                      </td>
                      <td className="py-4 text-[var(--text-muted)]">{review.totalLoc || 0} LOC</td>
                      <td className="py-4 text-right text-[var(--text-muted)] pr-3">{new Date(review.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick Tips / Guides Card */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[var(--foreground)] tracking-wide text-left">Review Tips</h2>
            <div className="space-y-4 text-sm text-[var(--text-muted)] leading-relaxed text-left">
              <div className="flex gap-3">
                <div className="bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-semibold h-6 w-6 rounded-full flex items-center justify-center shrink-0 border border-indigo-500/20">
                  1
                </div>
                <p>Paste snippets to check short blocks or single functions for logic issues and complexity warnings.</p>
              </div>
              <div className="flex gap-3">
                <div className="bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-semibold h-6 w-6 rounded-full flex items-center justify-center shrink-0 border border-indigo-500/20">
                  2
                </div>
                <p>Upload folders to examine imports, static formatting rules, and construct full project README guides.</p>
              </div>
              <div className="flex gap-3">
                <div className="bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-semibold h-6 w-6 rounded-full flex items-center justify-center shrink-0 border border-indigo-500/20">
                  3
                </div>
                <p>Keep functions modular to ensure simple cyclomatic nesting and maintain high quality scores.</p>
              </div>
            </div>
          </div>
          <Link 
            href="/dashboard/new" 
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] hover:bg-slate-200 dark:hover:bg-slate-800 text-[var(--foreground)] font-semibold text-sm transition-colors group cursor-pointer"
          >
            Review Code Now
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
