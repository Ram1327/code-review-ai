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
  FolderOpen,
  ArrowRight, 
  AlertCircle, 
  CheckCircle2,
  Trash2
} from 'lucide-react';

interface SelectedFile {
  path: string;
  size: number;
  content: string;
}

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
  const [uploadedFiles, setUploadedFiles] = useState<SelectedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

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

  // Process files recursively and read contents
  const processFilesList = async (filesList: FileList) => {
    const filesArray = Array.from(filesList);
    const readFilesPromises = filesArray.map((file) => {
      return new Promise<SelectedFile>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          // Use webkitRelativePath if directory, otherwise fall back to file.name
          const relativePath = file.webkitRelativePath || file.name;
          resolve({
            path: relativePath,
            size: file.size,
            content: event.target?.result as string,
          });
        };
        reader.onerror = (err) => reject(err);
        reader.readAsText(file);
      });
    });

    try {
      const parsedFiles = await Promise.all(readFilesPromises);
      setUploadedFiles((prev) => [...prev, ...parsedFiles]);

      // Set language based on first file's extension if not set
      if (parsedFiles.length > 0 && activeTab === 'upload') {
        const detectedLang = detectLanguage(parsedFiles[0].path);
        setLanguage(detectedLang);
      }

      // Auto-populate project name if empty
      if (!projectName && parsedFiles.length > 0) {
        const pathSegments = parsedFiles[0].path.split('/');
        const rootFolder = pathSegments.length > 1 ? pathSegments[0] : '';
        setProjectName(rootFolder ? `${rootFolder} Project` : 'Code Review Project');
      }
    } catch (err) {
      setError('Error reading some uploaded files.');
    }
  };

  // Handle files selection
  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFilesList(e.target.files);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      processFilesList(e.dataTransfer.files);
    }
  };

  const clearFilesList = () => {
    setUploadedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
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

    let payload: any = {
      projectName: activeProjectName,
      language,
      reviewType: activeTab === 'paste' ? 'snippet' : 'upload',
    };

    if (activeTab === 'paste') {
      const activeContent = codeContent.trim();
      if (!activeContent) {
        setError('Please enter code content.');
        setLoading(false);
        return;
      }
      payload.codeContent = activeContent;
      payload.fileName = `snippet.${language === 'python' ? 'py' : language === 'javascript' ? 'js' : 'ts'}`;
    } else {
      if (uploadedFiles.length === 0) {
        setError('Please select or upload folder files.');
        setLoading(false);
        return;
      }
      payload.files = uploadedFiles.map((f) => ({
        path: f.path,
        content: f.content,
      }));
    }

    try {
      const res = await fetch(`${API_URL}/reviews/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to submit review.');
        setLoading(false);
        return;
      }

      setSuccess('Code submitted and analyzed successfully! Redirecting...');
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
          Paste a single code snippet, upload individual scripts, or select an entire project folder to review.
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
            <Upload className="h-4 w-4" /> Upload Files / Folders
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

            {/* Language dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                {activeTab === 'paste' ? 'Select Language' : 'Primary Language Detected'}
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
                height="380px"
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
              <div className="flex-1 flex flex-col p-6 space-y-6">
                {/* Drag & Drop zone */}
                <div 
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-slate-800 hover:border-indigo-500/40 rounded-xl transition-colors cursor-pointer bg-slate-950/40"
                >
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFilesSelect}
                    className="hidden"
                    multiple
                    accept=".js,.jsx,.ts,.tsx,.py,.html,.css,.json"
                  />
                  {/* Standard Directory/Folder Input */}
                  <input 
                    type="file"
                    ref={folderInputRef}
                    onChange={handleFilesSelect}
                    className="hidden"
                    // @ts-ignore
                    webkitdirectory=""
                    directory=""
                  />

                  <div className="space-y-4">
                    <div className="mx-auto bg-slate-900 border border-slate-800 p-4 rounded-2xl w-fit text-slate-400">
                      <Upload className="h-7 w-7" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-white">Drag and drop folder / files here, or browse</p>
                      <div className="flex justify-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold rounded-lg text-slate-200 flex items-center gap-1.5"
                        >
                          <FileCode className="h-3.5 w-3.5" /> Select Files
                        </button>
                        <button
                          type="button"
                          onClick={() => folderInputRef.current?.click()}
                          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold rounded-lg text-slate-200 flex items-center gap-1.5"
                        >
                          <FolderOpen className="h-3.5 w-3.5" /> Select Folder
                        </button>
                      </div>
                      <p className="text-2xs text-slate-500">Supports JS, TS, PY, HTML, CSS, JSON formats</p>
                    </div>
                  </div>
                </div>

                {/* Selected Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Files to Analyze ({uploadedFiles.length})
                      </h3>
                      <button
                        type="button"
                        onClick={clearFilesList}
                        className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-medium"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Clear All
                      </button>
                    </div>

                    <div className="max-h-48 overflow-y-auto border border-slate-800/80 rounded-xl divide-y divide-slate-800/40 bg-slate-950/20">
                      {uploadedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 text-xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileCode className="h-4 w-4 text-indigo-400 shrink-0" />
                            <span className="font-mono text-slate-300 truncate" title={file.path}>
                              {file.path}
                            </span>
                          </div>
                          <span className="text-slate-500 shrink-0">{(file.size / 1024).toFixed(1)} KB</span>
                        </div>
                      ))}
                    </div>
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
              {loading ? 'Analyzing Code...' : 'Analyze Code'}
              {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
