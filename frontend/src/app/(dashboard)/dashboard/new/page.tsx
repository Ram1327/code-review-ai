'use client';

import React from 'react';
import { Sparkles, Code2, Upload } from 'lucide-react';

export default function NewReviewPage() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-indigo-400" /> Start New Code Review
        </h1>
        <p className="text-slate-400 text-sm md:text-base">
          Submit code snippets or upload repository files to perform static linting and AI review.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        {/* Paste Snippet Placeholder */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 hover:border-indigo-500/30 transition-all duration-300 flex flex-col justify-between h-80 group">
          <div className="space-y-4">
            <div className="bg-indigo-500/10 text-indigo-400 p-3 rounded-xl w-fit border border-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
              <Code2 className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide">Paste Snippet</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Paste lines of source code directly into our Monaco web editor. Great for checking individual files, modules, or single functions.
            </p>
          </div>
          <button className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-colors border border-slate-700">
            Paste Code Snippet
          </button>
        </div>

        {/* Upload Files Placeholder */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 hover:border-indigo-500/30 transition-all duration-300 flex flex-col justify-between h-80 group">
          <div className="space-y-4">
            <div className="bg-indigo-500/10 text-indigo-400 p-3 rounded-xl w-fit border border-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
              <Upload className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide">Upload Files</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Select or drag-and-drop code files directly. Analyze standard syntax, imports, and variables across multiple scripts concurrently.
            </p>
          </div>
          <button className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-colors border border-slate-700">
            Upload Code Files
          </button>
        </div>
      </div>
    </div>
  );
}
