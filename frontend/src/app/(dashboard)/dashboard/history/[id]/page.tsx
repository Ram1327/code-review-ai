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
  Code2,
  FileCode,
  TrendingUp,
  Shield,
  HelpCircle
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

  const [review, setReview] = useState<ReviewDetails | null>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  
  const [activeTab, setActiveTab] = useState<'summary' | 'findings' | 'analytics'>('summary');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [fileFilter, setFileFilter] = useState<string>('all');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const editorRef = useRef<any>(null);

  const API_URL = 'http://localhost:5000/api';

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

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleFindingClick = (finding: Finding) => {
    // 1. Switch active file to the finding file
    const targetFile = files.find(f => f.path === finding.fileName);
    if (targetFile) {
      setSelectedFile(targetFile);
    }

    // 2. Center editor and highlight the specific line number
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.revealLineInCenter(finding.lineNumber);
        editorRef.current.setPosition({ lineNumber: finding.lineNumber, column: 1 });
        editorRef.current.focus();
      }
    }, 150);
  };

  // Helper to retrieve language based on filename extension
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
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-slate-400 text-sm animate-pulse">Loading analysis report...</p>
        </div>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
        <AlertTriangle className="h-12 w-12 text-rose-500" />
        <h2 className="text-xl font-bold text-white">Review Retrieval Failed</h2>
        <p className="text-slate-400 text-sm">{error || 'Review could not be loaded.'}</p>
        <Link href="/dashboard/history" className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm border border-slate-700 hover:bg-slate-700 transition-colors">
          Back to History
        </Link>
      </div>
    );
  }

  // Filter findings
  const filteredFindings = review.findings.filter(f => {
    const matchesSeverity = severityFilter === 'all' || f.severity === severityFilter;
    const matchesFile = fileFilter === 'all' || f.fileName === fileFilter;
    return matchesSeverity && matchesFile;
  });

  // Calculate charts data
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
    ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5' 
    : review.overallScore >= 60 
      ? 'text-amber-400 border-amber-500/30 bg-amber-500/5' 
      : 'text-rose-400 border-rose-500/30 bg-rose-500/5';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <Link href="/dashboard/history" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-white transition-colors pb-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to History
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-wide flex items-center gap-2">
            {review.project.projectName}
          </h1>
          <p className="text-xs text-slate-400">
            Reviewed via {review.reviewType === 'snippet' ? 'Code Snippet' : 'Directory Upload'} &bull; {new Date(review.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border ${scoreColor}`}>
          <TrendingUp className="h-5 w-5 shrink-0" />
          <div>
            <span className="text-2xs font-bold uppercase tracking-wider block text-slate-500">Quality Score</span>
            <span className="text-lg font-bold tracking-tight">{review.overallScore}%</span>
          </div>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Code Editor (3/5 width) */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[580px] shadow-xl">
          {/* File selector header */}
          <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-900/40">
            <div className="flex items-center gap-2.5 text-xs text-slate-400">
              <FileCode className="h-4 w-4 text-indigo-400" />
              <span>Viewing File:</span>
            </div>
            <select
              value={selectedFile?.path || ''}
              onChange={(e) => {
                const target = files.find(f => f.path === e.target.value);
                if (target) setSelectedFile(target);
              }}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-600 max-w-[250px] truncate"
            >
              {files.map((file) => (
                <option key={file.path} value={file.path}>
                  {file.path}
                </option>
              ))}
            </select>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 bg-slate-950">
            {selectedFile ? (
              <Editor
                height="100%"
                language={getEditorLanguage(selectedFile.path)}
                theme="vs-dark"
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
              <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                No code files found.
              </div>
            )}
          </div>
        </div>

        {/* Right: Results Tabs Pane (2/5 width) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[580px] shadow-xl">
          {/* Tab buttons */}
          <div className="flex border-b border-slate-800 bg-slate-900/40 p-1.5 gap-1.5">
            {['summary', 'findings', 'analytics'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl uppercase tracking-wider transition-all ${
                  activeTab === tab 
                    ? 'bg-slate-800 text-white border border-slate-700/60' 
                    : 'text-slate-400 hover:text-white'
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
                    <span className="text-3xl font-extrabold text-white tracking-tight">{review.overallScore}</span>
                    <span className="text-4xs font-bold text-slate-500 uppercase tracking-widest block">Quality Score</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-indigo-400" /> Executive Summary
                  </h3>
                  <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl">
                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                      {review.summary}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 bg-slate-950/40 border border-slate-800 rounded-xl text-center">
                    <span className="text-slate-500 text-3xs font-semibold uppercase tracking-wider block mb-1">Total Files</span>
                    <span className="text-md font-bold text-white">{files.length}</span>
                  </div>
                  <div className="p-3.5 bg-slate-950/40 border border-slate-800 rounded-xl text-center">
                    <span className="text-slate-500 text-3xs font-semibold uppercase tracking-wider block mb-1">Findings</span>
                    <span className="text-md font-bold text-white">{review.findings.length}</span>
                  </div>
                  <div className="p-3.5 bg-slate-950/40 border border-slate-800 rounded-xl text-center">
                    <span className="text-slate-500 text-3xs font-semibold uppercase tracking-wider block mb-1">Status</span>
                    <span className="text-xs font-semibold text-emerald-400 block pt-0.5">Checked</span>
                  </div>
                </div>
              </div>
            )}

            {/* FINDINGS TAB */}
            {activeTab === 'findings' && (
              <div className="space-y-4">
                {/* Findings Filters */}
                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-800/80">
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300"
                  >
                    <option value="all">All Severities</option>
                    <option value="error">Errors Only</option>
                    <option value="warning">Warnings Only</option>
                    <option value="info">Info Only</option>
                  </select>

                  <select
                    value={fileFilter}
                    onChange={(e) => setFileFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 truncate"
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
                    <div className="text-center py-10 text-xs text-slate-500">
                      No findings matching selected filters.
                    </div>
                  ) : (
                    filteredFindings.map((finding) => (
                      <div
                        key={finding.id}
                        onClick={() => handleFindingClick(finding)}
                        className={`p-4 border rounded-xl cursor-pointer hover:border-slate-600 transition-all text-left space-y-2.5 bg-slate-950/20 ${
                          finding.severity === 'error' 
                            ? 'border-rose-500/20 hover:bg-rose-950/5' 
                            : finding.severity === 'warning' 
                              ? 'border-amber-500/20 hover:bg-amber-950/5' 
                              : 'border-sky-500/20 hover:bg-sky-950/5'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className={`text-2xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            finding.severity === 'error' 
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                              : finding.severity === 'warning' 
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                                : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          }`}>
                            {finding.severity}
                          </span>
                          <span className="text-4xs font-semibold text-slate-500 font-mono tracking-wider truncate">
                            {finding.fileName.split('/').pop()} : L{finding.lineNumber}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white leading-tight">
                          {finding.issue}
                        </h4>

                        <div className="space-y-1 text-xs text-slate-400">
                          <p className="leading-relaxed">
                            {finding.explanation}
                          </p>
                          {finding.suggestedFix && (
                            <p className="pt-1.5 text-slate-500 leading-normal">
                              <span className="font-semibold text-slate-400 text-3xs uppercase tracking-wider block">Suggested Fix:</span>
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
                {/* Severity Pie Chart */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Severity Breakdown</h3>
                  {pieData.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-500">No issues found.</div>
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
                            contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff', fontSize: '11px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Legends */}
                      <div className="flex justify-center gap-6 text-2xs font-semibold pt-1">
                        {pieData.map((d, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                            <span className="text-slate-400">{d.name} ({d.value})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* File Issues Bar Chart */}
                <div className="space-y-2 pt-4 border-t border-slate-800/80">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Issues per File</h3>
                  {barData.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-500">No issues found.</div>
                  ) : (
                    <div className="h-44 w-full text-2xs font-mono">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                          <XAxis dataKey="name" stroke="#475569" fontSize={9} />
                          <YAxis stroke="#475569" fontSize={9} allowDecimals={false} />
                          <Tooltip 
                            contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff', fontSize: '11px' }}
                          />
                          <Bar dataKey="issues" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
