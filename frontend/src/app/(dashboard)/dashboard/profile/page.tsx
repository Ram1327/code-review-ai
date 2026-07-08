'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, Calendar, Shield, Sparkles } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-3xl animate-fadeIn">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <User className="h-6 w-6 text-indigo-400" /> Account Profile
        </h1>
        <p className="text-slate-400 text-sm">
          Manage your personal details, workspace preferences, and security settings.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl space-y-8">
        <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-slate-800">
          <div className="h-20 w-20 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-3xl shrink-0">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-xl font-bold text-white tracking-wide flex items-center justify-center sm:justify-start gap-2">
              {user?.name}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Sparkles className="h-2.5 w-2.5" /> Developer Tier
              </span>
            </h2>
            <p className="text-sm text-slate-400">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3 p-4 bg-slate-950/40 border border-slate-800 rounded-xl">
            <Mail className="h-5 w-5 text-slate-400 mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Email Address</span>
              <span className="text-sm text-slate-200 font-medium">{user?.email}</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-slate-950/40 border border-slate-800 rounded-xl">
            <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Member Since</span>
              <span className="text-sm text-slate-200 font-medium">July 2026</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-slate-950/40 border border-slate-800 rounded-xl">
            <Shield className="h-5 w-5 text-slate-400 mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Security Level</span>
              <span className="text-sm text-slate-200 font-medium">Standard JWT Authentication</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
