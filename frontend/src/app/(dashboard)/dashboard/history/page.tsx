'use client';

import React from 'react';
import { History, Search, Filter, Code2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function HistoryPage() {
  const reviews = [
    { id: '1', name: 'authMiddleware.ts', language: 'TypeScript', score: 92, date: '2 hours ago', issues: 2, type: 'Snippet' },
    { id: '2', name: 'dbConnection.py', language: 'Python', score: 68, date: 'Yesterday', issues: 14, type: 'File Upload' },
    { id: '3', name: 'userProfile.tsx', language: 'TypeScript', score: 85, date: '3 days ago', issues: 5, type: 'Snippet' },
    { id: '4', name: 'server.js', language: 'JavaScript', score: 79, date: 'Last week', issues: 9, type: 'File Upload' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <History className="h-6 w-6 text-indigo-400" /> Review History
        </h1>
        <p className="text-slate-400 text-sm md:text-base">
          Track, search, and manage your past code submissions and review results.
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search reviews by name or keyword..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <button className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-medium transition-colors">
          <Filter className="h-4 w-4" /> Filters
        </button>
      </div>

      {/* History Log List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-900/60">
                <th className="p-4 pl-6">Review Item</th>
                <th className="p-4">Language</th>
                <th className="p-4">Submission</th>
                <th className="p-4">Score</th>
                <th className="p-4">Issues Found</th>
                <th className="p-4">Date</th>
                <th className="p-4 pr-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm">
              {reviews.map((review) => (
                <tr key={review.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="p-4 pl-6 font-medium text-white flex items-center gap-2.5">
                    <Code2 className="h-4 w-4 text-indigo-400" />
                    {review.name}
                  </td>
                  <td className="p-4 text-slate-400">{review.language}</td>
                  <td className="p-4 text-slate-500">{review.type}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      review.score >= 80 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {review.score}%
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">{review.issues} issues</td>
                  <td className="p-4 text-slate-500">{review.date}</td>
                  <td className="p-4 pr-6 text-right">
                    <Link href={`/dashboard/history/${review.id}`} className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 group">
                      View <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
