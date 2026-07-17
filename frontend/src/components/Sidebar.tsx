'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  Code2, 
  History, 
  User, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'New Review', href: '/dashboard/new', icon: Code2 },
    { name: 'History', href: '/dashboard/history', icon: History },
    { name: 'Profile', href: '/dashboard/profile', icon: User },
  ];

  return (
    <aside 
      className={`fixed md:sticky top-0 left-0 z-40 h-screen bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col justify-between ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Brand Logo Section */}
      <div>
        <div className="flex items-center justify-between p-4 border-b border-slate-800 h-16">
          <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="bg-indigo-600 p-2 rounded-lg text-white shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            {!collapsed && (
              <span className="font-semibold text-lg text-white tracking-wider whitespace-nowrap transition-opacity duration-300">
                CodeReview<span className="text-indigo-400">.AI</span>
              </span>
            )}
          </Link>
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex items-center justify-center p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                {!collapsed && (
                  <span className="text-sm font-medium tracking-wide whitespace-nowrap transition-opacity duration-300">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile and Logout Section */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        {/* Theme Switcher Button */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all duration-200 group"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? (
            <>
              <Moon className="h-5 w-5 shrink-0 group-hover:scale-105" />
              {!collapsed && <span className="text-sm font-medium tracking-wide">Dark Mode</span>}
            </>
          ) : (
            <>
              <Sun className="h-5 w-5 shrink-0 group-hover:scale-105 text-amber-400 animate-pulse" />
              {!collapsed && <span className="text-sm font-medium tracking-wide">Light Mode</span>}
            </>
          )}
        </button>

        {!collapsed && user && (
          <div className="flex items-center gap-3 px-2 py-1 overflow-hidden border-t border-slate-850 pt-3">
            <div className="h-9 w-9 rounded-full bg-slate-800 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-semibold shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 transition-all duration-200 group`}
        >
          <LogOut className="h-5 w-5 shrink-0 group-hover:scale-105" />
          {!collapsed && (
            <span className="text-sm font-medium tracking-wide whitespace-nowrap">
              Log Out
            </span>
          )}
        </button>
      </div>
    </aside>
  );
};
