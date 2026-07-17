'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Menu, X } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-slate-400 text-sm animate-pulse">Initializing session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Prevents flashing dashboard content while redirecting
  }

  return (
    <div className="flex min-h-screen bg-[var(--background)] text-[var(--foreground)] relative">
      {/* Sidebar - Desktop */}
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Sidebar - Mobile Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative flex flex-col w-64 bg-slate-900 border-r border-slate-800">
            <Sidebar collapsed={false} setCollapsed={() => {}} />
            <button 
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-[-48px] bg-slate-900 border border-slate-800 text-slate-400 p-2 rounded-full focus:outline-none hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 h-16 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
              <span className="font-bold text-sm">CR</span>
            </div>
            <span className="font-semibold text-md text-white tracking-wider">
              CodeReview<span className="text-indigo-400">.AI</span>
            </span>
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <Menu className="h-6 w-6" />
          </button>
        </header>

        {/* Inner page content */}
        <main className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
