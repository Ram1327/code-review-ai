'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Editor from '@monaco-editor/react';
import { useAuth } from '@/context/AuthContext';
import { 
  Sparkles, 
  Code2, 
  Upload, 
  FileCode, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2,
  Trash2
} from 'lucide-react';

export default function NewReviewPage() {
  const { accessToken } = useAuth();
  const router = useRouter();

  // Tabs: 'paste' | 'upload'
  const [activeTab, setActiveTab] = useState<'paste' | 'upload'>('paste');

  // Input states
  const [projectName, setProjectName] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [codeContent, setCodeContent] = useState('// Paste your code here\nfunction helloWorld() {\n  console.log("Hello, AI Reviewer!");\n}');
  
  // File Upload states
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number; content: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Common Form states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const API_URL = 'http://localhost:5000/api';

  // Helper to map file extensions to editor languages
  const detectLanguage = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'py':
        return 'python';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      default:
        return 'typescript';
    }
  };

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const detectedLang = detectLanguage(file.name);
      setUploadedFile({
        name: file.name,
        size: file.size,
        content
      });
      setLanguage(detectedLang);
      // Auto-populate project name if empty
      if (!projectName) {
        setProjectName(file.name.split('.')[0] + ' Review');
      }
    };
    reader.readAsText(file);
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const clearFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const activeProjectName = projectName.trim();
    if (!activeProjectName) {
      setError('Please provide a project name.');
      setLoading(false);
      return;
    }

    let activeContent = '';
    let reviewType: 'snippet' | 'upload' = 'snippet';
    let fileName = 'snippet.txt';

    if (activeTab === 'paste') {
      activeContent = codeContent.trim();
      reviewType = 'snippet';
      fileName = `snippet.${language === 'python' ? 'py' : language === 'javascript' ? 'js' : 'ts'}`;
    } else {
      if (!uploadedFile) {
        setError('Please select or upload a code file.');
        setLoading(false);
        return;
      }
      activeContent = uploadedFile.content;
      reviewType = 'upload';
      fileName = uploadedFile.name;
    }

    if (!activeContent) {
      setError('Please provide code content to analyze.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/reviews/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          projectName: activeProjectName,
          language,
          codeContent: activeContent,
          reviewType,
          fileName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to submit review.');
        setLoading(false);
        return;
      }

      setSuccess('Code submitted successfully! Redirecting...');
      setTimeout(() => {
        router.push('/dashboard/history');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Network error during submission.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl animate-fadeIn">
      {/* Top Heading */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-indigo-400" /> Start New Code Review
        </h1>
        <p className="text-slate-400 text-sm">
          Paste snippet code directly or upload a single script file to begin your analysis.
        </p>
      </div>

      {/* Message banners */}
      {error && (
        <div className="flex items-center gap-2.5 p-4 bg-rose-950/20 border border-rose-500/20 rounded-xl text-sm text-rose-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2.5 p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-sm text-emerald-400">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p>{success}</p>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-[500px]">
        {/* Toggle Header Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/40 p-2 gap-2">
          <button
            onClick={() => { setActiveTab('paste'); setError(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'paste' 
                ? 'bg-slate-800 text-white border border-slate-700/60' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="h-4 w-4" /> Paste Code Snippet
          </button>
          <button
            onClick={() => { setActiveTab('upload'); setError(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'upload' 
                ? 'bg-slate-800 text-white border border-slate-700/60' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="h-4 w-4" /> Upload File
          </button>
        </div>

        {/* Input Settings Form */}
        <form onSubmit={handleSubmit} className="p-6 flex-1 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Name input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Project Name</label>
              <input
                type="text"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. User Auth Router"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-600 transition-colors"
              />
            </div>

            {/* Language dropdown (Only enabled for pasted code, auto-detected for files) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                {activeTab === 'paste' ? 'Select Language' : 'Detected Language'}
              </label>
              <select
                value={language}
                disabled={activeTab === 'upload'}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-600 transition-colors disabled:opacity-50"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="json">JSON</option>
              </select>
            </div>
          </div>

          {/* Code Input Field */}
          <div className="flex-1 flex flex-col min-h-[300px] border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
            {activeTab === 'paste' ? (
              <Editor
                height="350px"
                language={language}
                theme="vs-dark"
                value={codeContent}
                onChange={(value) => setCodeContent(value || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            ) : (
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="flex-1 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-800 hover:border-indigo-500/40 rounded-xl transition-colors cursor-pointer"
                onClick={() => !uploadedFile && fileInputRef.current?.click()}
              >
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".js,.jsx,.ts,.tsx,.py,.html,.css,.json"
                />

                {!uploadedFile ? (
                  <div className="space-y-4">
                    <div className="mx-auto bg-slate-900 border border-slate-800 p-4 rounded-2xl w-fit text-slate-400">
                      <Upload className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-white">Drag and drop file here, or browse</p>
                      <p className="text-xs text-slate-500">Supports JS, TS, PY, HTML, CSS, JSON (Max 5MB)</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-md w-full p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="bg-indigo-500/10 text-indigo-400 p-2.5 rounded-xl border border-indigo-500/20">
                        <FileCode className="h-5 w-5" />
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{uploadedFile.name}</p>
                        <p className="text-xs text-slate-500">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={clearFile}
                      className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 group"
            >
              {loading ? 'Submitting Code...' : 'Analyze Code'}
              {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
