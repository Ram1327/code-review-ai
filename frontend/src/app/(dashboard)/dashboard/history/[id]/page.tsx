'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Editor from '@monaco-editor/react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  ArrowLeft, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  FileCode,
  TrendingUp,
  Shield
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useTheme } from '@/context/ThemeContext';

interface Finding {
  id: string;
  severity: 'error' | 'warning' | 'info';
  issue: string;
  explanation: string;
  suggestedFix: string;
  fileName: string;
  lineNumber: number;
}

interface ReviewDetails {
  id: string;
  reviewType: string;
  overallScore: number;
  summary: string;
  totalLoc?: number;
  classCount?: number;
  functionCount?: number;
  complexityScore?: number;
  createdAt: string;
  project: {
    id: string;
    projectName: string;
  };
  findings: Finding[];
}

interface UploadedFile {
  path: string;
  content: string;
}

export default function ReviewDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { accessToken } = useAuth();
  const { theme } = useTheme();

  const [review, setReview] = useState<ReviewDetails | null>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  
  const [activeTab, setActiveTab] = useState<'summary' | 'findings' | 'analytics' | 'documentation'>('summary');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [fileFilter, setFileFilter] = useState<string>('all');

  const [docs, setDocs] = useState<string>('');
  const [loadingDocs, setLoadingDocs] = useState<boolean>(false);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const editorRef = useRef<any>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchReviewDetails = async () => {
      try {
        const res = await fetch(`${API_URL}/reviews/${id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Failed to fetch review details.');
          setLoading(false);
          return;
        }

        setReview(data.review);
        setFiles(data.files);
        if (data.files.length > 0) {
          setSelectedFile(data.files[0]);
        }
      } catch (err: any) {
        setError(err.message || 'Network error.');
      } finally {
        setLoading(false);
      }
    };

    if (id && accessToken) {
      fetchReviewDetails();
    }
  }, [id, accessToken]);

  useEffect(() => {
    const fetchDocs = async () => {
      if (activeTab !== 'documentation' || docs) return;
      setLoadingDocs(true);
      setDocsError(null);
      try {
        const res = await fetch(`${API_URL}/reviews/${id}/docs`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        const data = await res.json();
        if (!res.ok) {
          setDocsError(data.error || 'Failed to fetch documentation.');
        } else {
          setDocs(data.docs);
        }
      } catch (err: any) {
        setDocsError(err.message || 'Network error.');
      } finally {
        setLoadingDocs(false);
      }
    };

    fetchDocs();
  }, [activeTab, id, accessToken, docs]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleFindingClick = (finding: Finding) => {
    const targetFile = files.find(f => f.path === finding.fileName);
    if (targetFile) {
      setSelectedFile(targetFile);
    }

    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.revealLineInCenter(finding.lineNumber);
        editorRef.current.setPosition({ lineNumber: finding.lineNumber, column: 1 });
        editorRef.current.focus();
      }
    }, 150);
  };

  const getEditorLanguage = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx': return 'javascript';
      case 'ts':
      case 'tsx': return 'typescript';
      case 'py': return 'python';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'json': return 'json';
      default: return 'typescript';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[var(--border)]">
          <div className="space-y-2">
            <div className="h-3 w-24 rounded bg-[var(--border)] animate-pulse" />
            <div className="h-7 w-48 rounded bg-[var(--border)] animate-pulse" />
            <div className="h-3 w-40 rounded bg-[var(--border)] animate-pulse" />
          </div>
          <div className="h-12 w-28 rounded-2xl bg-[var(--border)] animate-pulse" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left panel */}
          <div className="lg:col-span-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl h-[580px] p-4 flex flex-col justify-between shadow-sm">
            <div className="h-8 w-full rounded bg-[var(--border)] animate-pulse" />
            <div className="flex-1 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl mt-4 animate-pulse" />
          </div>
          {/* Right panel */}
          <div className="lg:col-span-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl h-[580px] p-5 space-y-6 shadow-sm">
            <div className="h-10 w-full rounded bg-[var(--border)] animate-pulse" />
            <div className="flex items-center justify-center py-4">
              <div className="h-32 w-32 rounded-full border-8 border-[var(--border)] animate-pulse" />
            </div>
            <div className="space-y-3">
              <div className="h-4 w-28 rounded bg-[var(--border)] animate-pulse" />
              <div className="h-16 w-full rounded-xl bg-[var(--border)] animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
        <AlertTriangle className="h-12 w-12 text-rose-500" />
        <h2 className="text-xl font-bold text-[var(--foreground)]">Review Retrieval Failed</h2>
        <p className="text-[var(--text-muted)] text-sm">{error || 'Review could not be loaded.'}</p>
        <Link href="/dashboard/history" className="px-4 py-2 bg-[var(--card-bg)] text-[var(--foreground)] border border-[var(--border)] rounded-xl text-sm hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
          Back to History
        </Link>
      </div>
    );
  }

  const filteredFindings = review.findings.filter(f => {
    const matchesSeverity = severityFilter === 'all' || f.severity === severityFilter;
    const matchesFile = fileFilter === 'all' || f.fileName === fileFilter;
    return matchesSeverity && matchesFile;
  });

  const severityCounts = { error: 0, warning: 0, info: 0 };
  const fileCounts: Record<string, number> = {};

  review.findings.forEach(f => {
    severityCounts[f.severity] = (severityCounts[f.severity] || 0) + 1;
    fileCounts[f.fileName] = (fileCounts[f.fileName] || 0) + 1;
  });

  const pieData = [
    { name: 'Errors', value: severityCounts.error, color: '#f43f5e' },
    { name: 'Warnings', value: severityCounts.warning, color: '#f59e0b' },
    { name: 'Info', value: severityCounts.info, color: '#38bdf8' }
  ].filter(d => d.value > 0);

  const barData = Object.keys(fileCounts).map(fileName => ({
    name: fileName.split('/').pop() || fileName,
    issues: fileCounts[fileName]
  }));

  const scoreColor = review.overallScore >= 80 
    ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/5 dark:text-emerald-400' 
    : review.overallScore >= 60 
      ? 'text-amber-500 border-amber-500/30 bg-amber-500/5 dark:text-amber-400' 
      : 'text-rose-500 border-rose-500/30 bg-rose-500/5 dark:text-rose-400';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[var(--border)]">
        <div className="space-y-1">
          <Link href="/dashboard/history" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors pb-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to History
          </Link>
          <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-wide flex items-center gap-2">
            {review.project.projectName}
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            Reviewed via {review.reviewType === 'snippet' ? 'Code Snippet' : 'Directory Upload'} &bull; {new Date(review.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border ${scoreColor}`}>
          <TrendingUp className="h-5 w-5 shrink-0" />
          <div className="text-left">
            <span className="text-2xs font-bold uppercase tracking-wider block text-[var(--text-muted)]">Quality Score</span>
            <span className="text-lg font-bold tracking-tight">{review.overallScore}%</span>
          </div>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Code Editor (3/5 width) */}
        <div className="lg:col-span-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden flex flex-col h-[580px] shadow-sm">
          {/* File selector header */}
          <div className="flex items-center justify-between p-3 border-b border-[var(--border)] bg-slate-900/5 dark:bg-slate-900/40">
            <div className="flex items-center gap-2.5 text-xs text-[var(--text-muted)]">
              <FileCode className="h-4 w-4 text-indigo-500" />
              <span>Viewing File:</span>
            </div>
            <select
              value={selectedFile?.path || ''}
              onChange={(e) => {
                const target = files.find(f => f.path === e.target.value);
                if (target) setSelectedFile(target);
              }}
              className="px-3 py-1.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-xs font-mono text-[var(--foreground)] focus:outline-none focus:border-indigo-500 max-w-[250px] truncate"
            >
              {files.map((file) => (
                <option key={file.path} value={file.path}>
                  {file.path}
                </option>
              ))}
            </select>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 bg-[var(--input-bg)]">
            {selectedFile ? (
              <Editor
                height="100%"
                language={getEditorLanguage(selectedFile.path)}
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                value={selectedFile.content}
                onMount={handleEditorDidMount}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  domReadOnly: true,
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">
                No code files found.
              </div>
            )}
          </div>
        </div>

        {/* Right: Results Tabs Pane (2/5 width) */}
        <div className="lg:col-span-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden flex flex-col h-[580px] shadow-sm">
          {/* Tab buttons */}
          <div className="flex border-b border-[var(--border)] bg-slate-900/5 dark:bg-slate-900/40 p-1.5 gap-1.5">
            {['summary', 'findings', 'analytics', 'documentation'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === tab 
                    ? 'bg-indigo-600 dark:bg-slate-800 text-white border border-indigo-700 dark:border-slate-700/60 shadow-sm' 
                    : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content area */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* SUMMARY TAB */}
            {activeTab === 'summary' && (
              <div className="space-y-6">
                <div className="flex items-center justify-center py-4">
                  {/* Gauge */}
                  <div className={`relative h-32 w-32 rounded-full border-8 flex flex-col items-center justify-center ${
                    review.overallScore >= 80 ? 'border-emerald-500/20' : review.overallScore >= 60 ? 'border-amber-500/20' : 'border-rose-500/20'
                  }`}>
                    <span className="text-3xl font-extrabold text-[var(--foreground)] tracking-tight">{review.overallScore}</span>
                    <span className="text-4xs font-bold text-[var(--text-muted)] uppercase tracking-widest block">Quality Score</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5 text-left">
                    <Sparkles className="h-4 w-4 text-indigo-500" /> Executive Summary
                  </h3>
                  <div className="p-4 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-left">
                    <p className="text-[var(--foreground)] text-xs leading-relaxed whitespace-pre-line">
                      {review.summary}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-center shadow-2xs">
                    <span className="text-[var(--text-muted)] text-3xs font-semibold uppercase tracking-wider block mb-1">Total Files</span>
                    <span className="text-md font-bold text-[var(--foreground)]">{files.length}</span>
                  </div>
                  <div className="p-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-center shadow-2xs">
                    <span className="text-[var(--text-muted)] text-3xs font-semibold uppercase tracking-wider block mb-1">Findings</span>
                    <span className="text-md font-bold text-[var(--foreground)]">{review.findings.length}</span>
                  </div>
                  <div className="p-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-center shadow-2xs">
                    <span className="text-[var(--text-muted)] text-3xs font-semibold uppercase tracking-wider block mb-1">Status</span>
                    <span className="text-xs font-semibold text-emerald-500 dark:text-emerald-400 block pt-0.5">Checked</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5 pt-2 text-left">
                    <Shield className="h-4 w-4 text-indigo-500" /> Complexity & Structure Metrics
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div className="p-3.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl">
                      <span className="text-[var(--text-muted)] text-3xs font-semibold uppercase tracking-wider block">Lines of Code</span>
                      <span className="text-lg font-bold text-[var(--foreground)] block mt-0.5">{review.totalLoc || 0}</span>
                    </div>
                    <div className="p-3.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl">
                      <span className="text-[var(--text-muted)] text-3xs font-semibold uppercase tracking-wider block">Total Functions</span>
                      <span className="text-lg font-bold text-[var(--foreground)] block mt-0.5">{review.functionCount || 0}</span>
                    </div>
                    <div className="p-3.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl">
                      <span className="text-[var(--text-muted)] text-3xs font-semibold uppercase tracking-wider block">Total Classes</span>
                      <span className="text-lg font-bold text-[var(--foreground)] block mt-0.5">{review.classCount || 0}</span>
                    </div>
                    <div className="p-3.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl flex justify-between items-center">
                      <div>
                        <span className="text-[var(--text-muted)] text-3xs font-semibold uppercase tracking-wider block">Nesting Complexity</span>
                        <span className="text-lg font-bold text-[var(--foreground)] block mt-0.5">{review.complexityScore || 0}</span>
                      </div>
                      <span className={`px-2 py-0.5 text-4xs font-bold uppercase rounded ${
                        (review.complexityScore || 0) < 15 
                          ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20' 
                          : (review.complexityScore || 0) < 40 
                            ? 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20' 
                            : 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20'
                      }`}>
                        {(review.complexityScore || 0) < 15 ? 'Low' : (review.complexityScore || 0) < 40 ? 'Medium' : 'High'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FINDINGS TAB */}
            {activeTab === 'findings' && (
              <div className="space-y-4">
                {/* Findings Filters */}
                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-[var(--border)]">
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-xs text-[var(--foreground)]"
                  >
                    <option value="all">All Severities</option>
                    <option value="error">Errors Only</option>
                    <option value="warning">Warnings Only</option>
                    <option value="info">Info Only</option>
                  </select>

                  <select
                    value={fileFilter}
                    onChange={(e) => setFileFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-xs text-[var(--foreground)] truncate"
                  >
                    <option value="all">All Files</option>
                    {files.map(f => (
                      <option key={f.path} value={f.path}>{f.path.split('/').pop() || f.path}</option>
                    ))}
                  </select>
                </div>

                {/* Findings List */}
                <div className="space-y-3">
                  {filteredFindings.length === 0 ? (
                    <div className="text-center py-10 text-xs text-[var(--text-muted)]">
                      No findings matching selected filters.
                    </div>
                  ) : (
                    filteredFindings.map((finding) => (
                      <div
                        key={finding.id}
                        onClick={() => handleFindingClick(finding)}
                        className={`p-4 border rounded-xl cursor-pointer hover:border-slate-500 dark:hover:border-slate-650 transition-all text-left space-y-2.5 bg-[var(--input-bg)]/20 ${
                          finding.severity === 'error' 
                            ? 'border-rose-500/20 hover:bg-rose-500/5' 
                            : finding.severity === 'warning' 
                              ? 'border-amber-500/20 hover:bg-amber-500/5' 
                              : 'border-sky-500/20 hover:bg-sky-500/5'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className={`text-2xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            finding.severity === 'error' 
                              ? 'bg-rose-550/10 text-rose-500 dark:text-rose-400 border border-rose-500/20' 
                              : finding.severity === 'warning' 
                                ? 'bg-amber-550/10 text-amber-500 dark:text-amber-400 border border-amber-500/20' 
                                : 'bg-sky-550/10 text-sky-500 dark:text-sky-400 border border-sky-500/20'
                          }`}>
                            {finding.severity}
                          </span>
                          <span className="text-4xs font-semibold text-[var(--text-muted)] font-mono tracking-wider truncate">
                            {finding.fileName.split('/').pop()} : L{finding.lineNumber}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-[var(--foreground)] leading-tight">
                          {finding.issue}
                        </h4>

                        <div className="space-y-1 text-xs text-[var(--text-muted)]">
                          <p className="leading-relaxed">
                            {finding.explanation}
                          </p>
                          {finding.suggestedFix && (
                            <p className="pt-1.5 text-[var(--text-muted)] leading-normal">
                              <span className="font-semibold text-[var(--foreground)] text-3xs uppercase tracking-wider block">Suggested Fix:</span>
                              {finding.suggestedFix}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && mounted && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider text-left">Severity Breakdown</h3>
                  {pieData.length === 0 ? (
                    <div className="text-center py-6 text-xs text-[var(--text-muted)]">No issues found.</div>
                  ) : (
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={4}
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ background: theme === 'dark' ? '#0f172a' : '#ffffff', border: '1px solid var(--border)', borderRadius: '8px' }}
                            itemStyle={{ color: 'var(--foreground)', fontSize: '11px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex justify-center gap-6 text-2xs font-semibold pt-1">
                        {pieData.map((d, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                            <span className="text-[var(--text-muted)]">{d.name} ({d.value})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-4 border-t border-[var(--border)]">
                  <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider text-left">Issues per File</h3>
                  {barData.length === 0 ? (
                    <div className="text-center py-6 text-xs text-[var(--text-muted)]">No issues found.</div>
                  ) : (
                    <div className="h-44 w-full text-2xs font-mono">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                          <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={9} />
                          <YAxis stroke="var(--text-muted)" fontSize={9} allowDecimals={false} />
                          <Tooltip 
                            contentStyle={{ background: theme === 'dark' ? '#0f172a' : '#ffffff', border: '1px solid var(--border)', borderRadius: '8px' }}
                            itemStyle={{ color: 'var(--foreground)', fontSize: '11px' }}
                          />
                          <Bar dataKey="issues" fill="var(--color-indigo-500, #6366f1)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DOCUMENTATION TAB */}
            {activeTab === 'documentation' && (
              <div className="space-y-4">
                {loadingDocs ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-650 border-t-transparent"></div>
                    <p className="text-[var(--text-muted)] text-xs animate-pulse">Generating developer guides...</p>
                  </div>
                ) : docsError ? (
                  <div className="text-center py-10 space-y-3">
                    <AlertTriangle className="h-8 w-8 text-rose-500 mx-auto" />
                    <p className="text-xs text-rose-450 font-semibold">{docsError}</p>
                    <button 
                      onClick={() => { setDocs(''); setActiveTab('documentation'); }} 
                      className="px-3 py-1.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-2xs font-semibold text-[var(--foreground)] hover:bg-slate-200 dark:hover:bg-slate-800"
                    >
                      Retry Generation
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Controls */}
                    <div className="flex justify-end gap-2.5 pb-2 border-b border-[var(--border)]">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(docs);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="px-3 py-1.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-2xs font-bold text-[var(--foreground)] hover:border-slate-500 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        {copied ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Copied!
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5 text-indigo-500" /> Copy Markdown
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          const blob = new Blob([docs], { type: 'text/markdown' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${review?.project?.projectName.replace(/\s+/g, '_')}_README.md`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-550 rounded-lg text-2xs font-bold text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileCode className="h-3.5 w-3.5" /> Download .md
                      </button>
                    </div>

                    {/* Markdown Body */}
                    <div className="text-left">
                      <pre className="whitespace-pre-wrap font-sans text-[var(--foreground)] leading-relaxed text-xs bg-[var(--input-bg)] p-4 rounded-xl border border-[var(--border)] font-normal max-h-[420px] overflow-y-auto">
                        {docs}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
