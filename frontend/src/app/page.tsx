'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Code2, ArrowRight, CheckCircle2, Shield, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden relative">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/3 h-[500px] w-[500px] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 h-[400px] w-[400px] rounded-full bg-purple-600/5 blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-6 h-20 flex items-center justify-between border-b border-slate-900">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-600/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-semibold text-lg text-white tracking-wider">
            CodeReview<span className="text-indigo-400">.AI</span>
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">
            Log In
          </Link>
          <Link 
            href="/signup" 
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 font-medium text-sm transition-colors shadow-lg shadow-indigo-600/20"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl w-full mx-auto px-6 py-20 flex-1 flex flex-col items-center justify-center text-center space-y-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Sparkles className="h-3 w-3" /> Next-generation analysis platform
        </span>
        
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-3xl leading-[1.15]">
          Inspect & Optimize Your Code Using{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            Generative AI
          </span>
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-2xl leading-relaxed">
          Fast-track your code review cycle. Paste single files or upload entire scripts to detect syntax errors, evaluate complexity, and receive instant refactoring advice.
        </p>

        <div className="pt-4 flex flex-wrap gap-4 justify-center">
          <Link 
            href="/signup" 
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors shadow-xl shadow-indigo-600/30 group"
          >
            Create Free Account
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link 
            href="/login" 
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-800 hover:text-white font-semibold text-sm transition-colors"
          >
            Sign In to Dashboard
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 max-w-5xl w-full">
          <div className="bg-slate-900/60 border border-slate-900 p-6 rounded-2xl text-left space-y-3">
            <Zap className="h-5 w-5 text-indigo-400" />
            <h3 className="font-semibold text-white">Stage 1: Static Analysis</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Detect syntax errors, duplicate scripts, unused variables, and style warnings within milliseconds.
            </p>
          </div>
          <div className="bg-slate-900/60 border border-slate-900 p-6 rounded-2xl text-left space-y-3">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <h3 className="font-semibold text-white">Stage 2: AI Code Review</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Get deep semantic reviews including bug findings, structure advice, variable suggestions, and security audits.
            </p>
          </div>
          <div className="bg-slate-900/60 border border-slate-900 p-6 rounded-2xl text-left space-y-3">
            <Shield className="h-5 w-5 text-emerald-400" />
            <h3 className="font-semibold text-white">Metrics & Complexity</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Inspect cyclomatic complexity, lines of code, and structure graphs in a unified, professional dashboard.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-slate-900 text-center text-xs text-slate-600">
        <p>&copy; {new Date().getFullYear()} CodeReview.AI. Built for developers.</p>
      </footer>
    </div>
  );
}
