'use client';

import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Code2, 
  ArrowRight, 
  Trash2, 
  AlertTriangle,
  FolderOpen
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

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

export default function HistoryPage() {
  const { accessToken } = useAuth();

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [scoreRating, setScoreRating] = useState('all');
  const [reviewType, setReviewType] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [order, setOrder] = useState('desc');

  const API_URL = 'http://localhost:5000/api';

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (scoreRating !== 'all') params.append('scoreRating', scoreRating);
      if (reviewType !== 'all') params.append('reviewType', reviewType);
      if (sortBy) params.append('sortBy', sortBy);
      if (order) params.append('order', order);

      const res = await fetch(`${API_URL}/reviews?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to fetch reviews.');
        return;
      }

      setReviews(data);
    } catch (err: any) {
      setError(err.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchReviews();
    }
  }, [accessToken, scoreRating, reviewType, sortBy, order]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReviews();
  };

  const handleDelete = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to delete this code review? This will remove all database findings and local uploads.')) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to delete review.');
        return;
      }

      // Filter out deleted review from state immediately
      setReviews(prev => prev.filter(r => r.id !== reviewId));
    } catch (err: any) {
      alert(err.message || 'Network error.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <History className="h-6 w-6 text-indigo-400" /> Review History
        </h1>
        <p className="text-slate-400 text-sm md:text-base">
          Track, search, and manage your past code submissions, quality scores, and documentation.
        </p>
      </div>

      {/* Search and Filters Bar */}
      <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-3 bg-slate-900/60 p-4 border border-slate-800 rounded-2xl">
        {/* Search Input */}
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search project name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Score Filter */}
        <div>
          <select
            value={scoreRating}
            onChange={(e) => setScoreRating(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Quality Scores</option>
            <option value="high">High (80+)</option>
            <option value="medium">Medium (60-79)</option>
            <option value="low">Low (&lt;60)</option>
          </select>
        </div>

        {/* Review Type Filter */}
        <div>
          <select
            value={reviewType}
            onChange={(e) => setReviewType(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Formats</option>
            <option value="snippet">Snippets</option>
            <option value="upload">Directory Uploads</option>
          </select>
        </div>

        {/* Sorting Fields */}
        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="date">Sort by Date</option>
            <option value="score">Sort by Score</option>
          </select>
        </div>

        {/* Sort Order & Search Trigger */}
        <div className="flex gap-2">
          <select
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            className="flex-1 px-2.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
          <button 
            type="submit"
            className="px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Go
          </button>
        </div>
      </form>

      {/* History Log Cards/Table Container */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            <p className="text-slate-400 text-xs animate-pulse">Loading history logs...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-10 space-y-2 border border-slate-800 rounded-2xl bg-slate-900/40">
          <AlertTriangle className="h-8 w-8 text-rose-500" />
          <p className="text-sm font-bold text-white">Error Loading History</p>
          <p className="text-slate-400 text-xs">{error}</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 space-y-3 border border-slate-800 rounded-2xl bg-slate-900/20">
          <FolderOpen className="h-10 w-10 text-slate-600" />
          <p className="text-sm font-bold text-white">No Reviews Found</p>
          <p className="text-slate-500 text-xs">Submit a code block to start tracking review records.</p>
          <Link href="/dashboard/new" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md">
            New Submission
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((review) => {
            const scoreColor = review.overallScore >= 80 
              ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' 
              : review.overallScore >= 60 
                ? 'text-amber-400 border-amber-500/20 bg-amber-500/5' 
                : 'text-rose-400 border-rose-500/20 bg-rose-500/5';

            return (
              <div 
                key={review.id} 
                className="bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4 hover:shadow-xl transition-all duration-300 text-left"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="text-base font-bold text-white tracking-wide truncate pr-4">
                      {review.project.projectName}
                    </h3>
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border shrink-0 ${scoreColor}`}>
                      {review.overallScore}%
                    </span>
                  </div>

                  <p className="text-slate-400 text-xs font-medium leading-relaxed line-clamp-3">
                    {review.summary.replace(/\[Static Check\]|\[AI Review\]/g, '').trim()}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 text-2xs font-semibold text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="capitalize">{review.reviewType === 'snippet' ? 'Snippet' : 'Folder upload'}</span>
                    <span>&bull;</span>
                    <span>{review.totalLoc || 0} LOC</span>
                    <span>&bull;</span>
                    <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="p-1.5 bg-slate-950 hover:bg-rose-950/20 border border-slate-850 hover:border-rose-900 text-slate-500 hover:text-rose-400 rounded-xl transition-all"
                      title="Delete Review"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <Link 
                      href={`/dashboard/history/${review.id}`} 
                      className="p-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400 rounded-xl transition-all flex items-center gap-1"
                    >
                      Inspect <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
