'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, Calendar, Shield, Sparkles } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-3xl animate-fadeIn">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] flex items-center gap-2">
          <User className="h-6 w-6 text-indigo-500" /> Account Profile
        </h1>
        <p className="text-[var(--text-muted)] text-sm">
          Manage your personal details, workspace preferences, and security settings.
        </p>
      </div>

      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 md:p-8 shadow-sm space-y-8 text-left">
        <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-[var(--border)]">
          <div className="h-20 w-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-550 dark:text-indigo-400 flex items-center justify-center font-bold text-3xl shrink-0">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-xl font-bold text-[var(--foreground)] tracking-wide flex items-center justify-center sm:justify-start gap-2">
              {user?.name}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-indigo-500/10 text-indigo-550 dark:text-indigo-400 border border-indigo-500/20">
                <Sparkles className="h-2.5 w-2.5" /> Developer Tier
              </span>
            </h2>
            <p className="text-sm text-[var(--text-muted)]">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3 p-4 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl shadow-2xs">
            <Mail className="h-5 w-5 text-[var(--text-muted)] mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Email Address</span>
              <span className="text-sm text-[var(--foreground)] font-medium">{user?.email}</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl shadow-2xs">
            <Calendar className="h-5 w-5 text-[var(--text-muted)] mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Member Since</span>
              <span className="text-sm text-[var(--foreground)] font-medium">July 2026</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl shadow-2xs">
            <Shield className="h-5 w-5 text-[var(--text-muted)] mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Security Level</span>
              <span className="text-sm text-[var(--foreground)] font-medium">Standard JWT Authentication</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
