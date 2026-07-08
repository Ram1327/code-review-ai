'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  Code2, 
  History, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    { name: 'Total Code Reviews', value: '12', icon: History, color: 'text-indigo-400', bg: 'bg-indigo-950/40 border-indigo-500/20' },
    { name: 'Average Quality Score', value: '84/100', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-500/20' },
    { name: 'Unresolved Warnings', value: '38', icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-950/40 border-amber-500/20' },
    { name: 'Fixed Issues', value: '74', icon: CheckCircle2, color: 'text-teal-400', bg: 'bg-teal-950/40 border-teal-500/20' },
  ];

  const recentReviews = [
    { id: '1', name: 'authMiddleware.ts', language: 'TypeScript', score: 92, date: '2 hours ago', issues: 2 },
    { id: '2', name: 'dbConnection.py', language: 'Python', score: 68, date: 'Yesterday', issues: 14 },
    { id: '3', name: 'userProfile.tsx', language: 'TypeScript', score: 85, date: '3 days ago', issues: 5 },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-slate-800 p-8 md:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="h-40 w-40 text-indigo-400" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sparkles className="h-3 w-3" /> AI Assistant is ready
          </span>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-indigo-400">{user?.name}</span>!
          </h1>
          <p className="text-slate-400 leading-relaxed text-sm md:text-base">
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
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 font-medium text-sm hover:bg-slate-700 hover:text-white transition-colors"
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
                <span className="text-sm font-medium text-slate-400">{stat.name}</span>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-3xl font-bold text-white tracking-tight">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Reviews Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white tracking-wide">Recent Reviews</h2>
            <Link href="/dashboard/history" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-1 group">
              See all <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="pb-3">File / Project</th>
                  <th className="pb-3">Language</th>
                  <th className="pb-3">Score</th>
                  <th className="pb-3">Issues</th>
                  <th className="pb-3 text-right">Analyzed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {recentReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 font-medium text-white flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-indigo-400" />
                      {review.name}
                    </td>
                    <td className="py-4 text-slate-400">{review.language}</td>
                    <td className="py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        review.score >= 80 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {review.score}%
                      </span>
                    </td>
                    <td className="py-4 text-slate-400">{review.issues}</td>
                    <td className="py-4 text-right text-slate-500">{review.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Tips / Guides Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white tracking-wide">Review Tips</h2>
            <div className="space-y-4 text-sm text-slate-400 leading-relaxed">
              <div className="flex gap-3">
                <div className="bg-indigo-500/10 text-indigo-400 font-semibold h-6 w-6 rounded-full flex items-center justify-center shrink-0 border border-indigo-500/20">
                  1
                </div>
                <p>Paste snippets to check short blocks or single functions for logic issues and complexity warnings.</p>
              </div>
              <div className="flex gap-3">
                <div className="bg-indigo-500/10 text-indigo-400 font-semibold h-6 w-6 rounded-full flex items-center justify-center shrink-0 border border-indigo-500/20">
                  2
                </div>
                <p>Upload files to examine structural formatting, syntax errors, and get a global documentation file.</p>
              </div>
              <div className="flex gap-3">
                <div className="bg-indigo-500/10 text-indigo-400 font-semibold h-6 w-6 rounded-full flex items-center justify-center shrink-0 border border-indigo-500/20">
                  3
                </div>
                <p>Keep functions concise to maintain a high average score. The AI highlights complexity hotspots.</p>
              </div>
            </div>
          </div>
          <Link 
            href="/dashboard/new" 
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-colors group"
          >
            Review Code Now
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
