'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Zap,
  ArrowLeft,
  LogOut,
  BarChart3,
  Plug,
  Eye,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { subscribeJobs } from '@/lib/api';
import { detectWebMCP } from '@/lib/webmcp-client';
import type { Job } from '@/lib/firestore-schema';

// ─── Helpers ────────────────────────────────────────────────

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function timeAgo(date: Date) {
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return date.toLocaleDateString();
}

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  completed: { icon: CheckCircle2, color: 'var(--accent-green)', label: 'Completed' },
  processing: { icon: Loader2, color: 'var(--brand)', label: 'Processing' },
  pending: { icon: Clock, color: 'var(--text-secondary)', label: 'Pending' },
  failed: { icon: XCircle, color: '#ef4444', label: 'Failed' },
};

// ─── Component ──────────────────────────────────────────────

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [webmcpAvailable, setWebmcpAvailable] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  const [tenantId, setTenantId] = useState('3wF0ID7ezu1qBvjTKcLV'); // Default to Cahaba Restoration
  useEffect(() => {
    if (!user) return;
    // In a real production flow, we would fetch the user's profile from Firestore
    // to get their assigned tenantId. For this phase, we use Houston County as the active context.
    const unsub = subscribeJobs(tenantId, setJobs);
    return unsub;
  }, [user, tenantId]);

  useEffect(() => {
    setWebmcpAvailable(detectWebMCP());
  }, []);

  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');
  const [urlInput, setUrlInput] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'text/csv': ['.csv'],
    },
    maxSize: 100 * 1024 * 1024,
  });

  const handleProcess = async () => {
    if (uploadMode === 'file' && selectedFiles.length === 0) return;
    if (uploadMode === 'url' && !urlInput.trim()) return;

    setUploading(true);

    if (uploadMode === 'url') {
      // Split by newline or comma, clean up whitespace, and filter out empties
      const urls = urlInput.split(/[\n,]+/).map(u => u.trim()).filter(Boolean);
      console.log('Processing batch URLs:', urls);
      // Here you would trigger the backend extraction job for each URL
    }

    await new Promise((r) => setTimeout(r, 1500));
    
    if (uploadMode === 'file') setSelectedFiles([]);
    if (uploadMode === 'url') setUrlInput('');
    setUploading(false);
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={24} style={{ color: 'var(--brand)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 32px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(5, 5, 5, 0.9)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, letterSpacing: '0.04em' }}>
            <ArrowLeft size={14} /> Home
          </Link>
          <span style={{ color: 'var(--border-subtle)' }}>/</span>
          <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--brand)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Dashboard</span>
          <div style={{ fontSize: 9, padding: '2px 8px', borderRadius: 4, background: 'rgba(13, 242, 242, 0.05)', color: 'var(--brand)', fontWeight: 700, letterSpacing: '0.1em' }}>
            STAXIFY
          </div>
          {/* Compatibility Badge */}
          <div
             style={{
               display: 'inline-flex',
               alignItems: 'center',
               gap: 5,
               padding: '3px 10px',
               borderRadius: 6,
               fontSize: 10,
               fontWeight: 700,
               letterSpacing: '0.05em',
               background: webmcpAvailable ? 'rgba(34, 197, 94, 0.1)' : 'rgba(13, 242, 242, 0.08)',
               color: webmcpAvailable ? 'var(--accent-green)' : 'var(--brand)',
               border: `1px solid ${webmcpAvailable ? 'rgba(34,197,94,0.2)' : 'var(--border-subtle)'}`,
             }}
           >
             {webmcpAvailable ? <Plug size={10} /> : <Eye size={10} />}
             {webmcpAvailable ? 'STRUCTURED' : 'VISION'}
           </div>
         </div>
 
         <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
           <Link
             href="/admin/analytics"
             style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5, letterSpacing: '0.04em', transition: 'color 0.2s' }}
             onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand)')}
             onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
           >
             <BarChart3 size={13} /> Analytics
           </Link>
           <div
             style={{
               width: 28,
               height: 28,
               borderRadius: '50%',
               border: '1px solid var(--border-glow)',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               fontSize: 11,
               fontWeight: 700,
               color: 'var(--brand)',
             }}
           >
             {user.displayName?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?'}
           </div>
           <button
             onClick={() => signOut()}
             style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, transition: 'color 0.2s' }}
             title="Sign out"
             onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand)')}
             onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
           >
             <LogOut size={14} />
           </button>
         </div>
       </header>
 
       <div className="container" style={{ paddingTop: 36, paddingBottom: 60, maxWidth: 860 }}>
         {/* Upload Section */}
         <div className="glass" style={{ padding: 28, marginBottom: 28 }}>
           <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
             <Zap size={16} style={{ color: 'var(--brand)' }} />
             Start AI Extraction
           </h2>
           <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 20 }}>
             Upload source files or provide a web URL for extraction and mapping.
           </p>
 
           <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
             <button
               onClick={() => setUploadMode('url')}
               style={{
                 flex: 1,
                 padding: '10px 16px',
                 borderRadius: 8,
                 border: '1px solid var(--border-subtle)',
                 background: uploadMode === 'url' ? 'rgba(13, 242, 242, 0.04)' : 'transparent',
                 color: uploadMode === 'url' ? 'var(--brand)' : 'var(--text-muted)',
                 fontSize: 13,
                 fontWeight: 600,
                 cursor: 'pointer',
               }}
             >
               Web URL Extraction
             </button>
             <button
               onClick={() => setUploadMode('file')}
               style={{
                 flex: 1,
                 padding: '10px 16px',
                 borderRadius: 8,
                 border: '1px solid var(--border-subtle)',
                 background: uploadMode === 'file' ? 'rgba(13, 242, 242, 0.04)' : 'transparent',
                 color: uploadMode === 'file' ? 'var(--brand)' : 'var(--text-muted)',
                 fontSize: 13,
                 fontWeight: 600,
                 cursor: 'pointer',
               }}
             >
               File Upload (PDF/Image)
             </button>
           </div>
 
          {uploadMode === 'url' ? (
           <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Source Application URLs (Paste multiple URLs separated by commas or lines)</label>
              <textarea 
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder={"https://leap.example.com/job/123\nhttps://leap.example.com/job/456"} 
                rows={4}
                style={{ 
                  width: '100%', 
                  padding: '12px 16px', 
                  borderRadius: 8, 
                  border: '1px solid var(--border-subtle)', 
                  background: 'rgba(0,0,0,0.5)', 
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  resize: 'vertical'
                }} 
              />
           </div>
          ) : (
            <div style={{ marginBottom: 16 }}>
             <div
               {...getRootProps()}
               style={{
                 border: `1px dashed ${isDragActive ? 'var(--brand)' : 'var(--border-subtle)'}`,
                 borderRadius: 8,
                 padding: 28,
                 textAlign: 'center',
                 cursor: 'pointer',
                 transition: 'all 0.3s',
                 background: isDragActive ? 'rgba(13, 242, 242, 0.04)' : 'transparent',
                 marginBottom: selectedFiles.length > 0 ? 14 : 0,
               }}
             >
               <input {...getInputProps()} />
               <Upload size={22} style={{ color: 'var(--brand)', marginBottom: 10, opacity: 0.7 }} />
               <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>
                 {isDragActive ? 'Drop files here' : 'Drag & drop, or click to browse'}
               </p>
               <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                 PDF, PNG, JPEG, CSV · Max 100MB
               </p>
             </div>
 
             {selectedFiles.length > 0 && (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                   {selectedFiles.map((f, i) => (
                     <div
                       key={i}
                       style={{
                         display: 'flex',
                         alignItems: 'center',
                         gap: 10,
                         padding: '8px 12px',
                         background: 'rgba(13, 242, 242, 0.04)',
                         borderRadius: 6,
                         fontSize: 12,
                       }}
                     >
                       <FileText size={13} style={{ color: 'var(--brand)', flexShrink: 0, opacity: 0.7 }} />
                       <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                       <span style={{ color: 'var(--text-muted)', fontSize: 11, flexShrink: 0 }}>{formatSize(f.size)}</span>
                     </div>
                   ))}
                 </div>
             )}
            </div>
          )}
 
           <button
             className="btn-primary"
             onClick={handleProcess}
             disabled={uploading}
             style={{ width: '100%', padding: '12px', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
           >
             {uploading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={16} />}
             {uploading ? 'Initializing Agent...' : `Start Autonomous Agent ${uploadMode === 'file' && selectedFiles.length > 0 ? `(${selectedFiles.length} files)` : ''}`}
           </button>
         </div>

        {/* Job History */}
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          <Clock size={14} style={{ color: 'var(--brand)' }} />
          Job History
        </h2>

        {jobs.length === 0 ? (
          <div className="glass" style={{ padding: '40px 28px', textAlign: 'center' }}>
            <FileText size={32} style={{ color: 'var(--text-muted)', marginBottom: 14, opacity: 0.3 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              No jobs yet. Upload a document to get started.
            </p>
          </div>
        ) : (
          <div className="glass" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {['File', 'Status', 'Mode', 'Cache', 'Time'].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'left',
                        padding: '12px 16px',
                        fontSize: 10,
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const cfg = statusConfig[job.status] ?? statusConfig.pending;
                  const Icon = cfg.icon;
                  return (
                    <tr
                      key={job.id}
                      style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(13, 242, 242, 0.02)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <FileText size={13} style={{ color: 'var(--brand)', flexShrink: 0, opacity: 0.7 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                            {job.sourceFileName}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '3px 10px',
                            borderRadius: 6,
                            background: `${cfg.color}15`,
                            color: cfg.color,
                          }}
                        >
                          <Icon size={11} />
                          {cfg.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 4,
                            letterSpacing: '0.04em',
                            background: job.executionPath === 'WEBMCP' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(13, 242, 242, 0.08)',
                            color: job.executionPath === 'WEBMCP' ? 'var(--accent-green)' : 'var(--brand)',
                          }}
                        >
                          {job.executionPath === 'WEBMCP' ? <Plug size={9} /> : <Eye size={9} />}
                          {job.executionPath === 'WEBMCP' ? 'MCP' : 'Vision'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 4,
                            letterSpacing: '0.04em',
                            background: job.cacheStatus === 'HIT' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(13, 242, 242, 0.08)',
                            color: job.cacheStatus === 'HIT' ? 'var(--accent-green)' : 'var(--brand)',
                          }}
                        >
                          {job.cacheStatus}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>
                        {timeAgo(job.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
