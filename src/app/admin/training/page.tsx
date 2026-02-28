'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, FileText, Trash2, Database, Search, ChevronRight, Loader2 } from 'lucide-react';
import { listTenants, listKnowledgeBase, uploadKnowledgeBase } from '@/lib/api';
import type { Tenant } from '@/lib/firestore-schema';
import type { KnowledgeFile } from '@/lib/api';
import { db } from '@/lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';

interface ContextFile {
  id: string;
  name: string;
  tenant: string;
  type: string;
  size: string;
  uploadedAt: string;
}

export default function TrainingPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    listTenants()
      .then(data => {
        setTenants(data);
        if (data.length > 0) setSelectedTenantId(data[0].id);
      })
      .finally(() => setLoadingTenants(false));
  }, []);

  useEffect(() => {
    if (selectedTenantId) {
      setLoadingFiles(true);
      listKnowledgeBase(selectedTenantId)
        .then(setFiles)
        .finally(() => setLoadingFiles(false));
    } else {
      setFiles([]);
    }
  }, [selectedTenantId]);

  const handleDelete = async (file: KnowledgeFile) => {
    if (!confirm(`Delete ${file.name}?`)) return;
    try {
      // 1. Delete from Storage (if storage exists)
      const storage = getStorage();
      // Need to extract path from URL or store path in DB. 
      // For now, let's assume we can derive it or just delete DB record.
      // Better: In a real app, store storagePath in KnowledgeFile.
      
      // 2. Delete from Firestore
      await deleteDoc(doc(db!, `tenants/${file.tenantId}/knowledge`, file.id));
      
      setFiles(prev => prev.filter(f => f.id !== file.id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete file');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0 || !selectedTenantId) return;
    
    setUploading(true);
    try {
      const newFile = await uploadKnowledgeBase(selectedTenantId, fileList[0]);
      setFiles(prev => [newFile, ...prev]);
      alert('File uploaded and indexed for training.');
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 32px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: 'rgba(5, 5, 5, 0.9)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Link
          href="/admin"
          style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, letterSpacing: '0.04em', transition: 'color 0.2s' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <ArrowLeft size={14} /> Admin
        </Link>
        <span style={{ color: 'var(--border-subtle)' }}>/</span>
        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--brand)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Training Context</span>
      </header>

      <div className="container" style={{ paddingTop: 36, paddingBottom: 60, maxWidth: 900, position: 'relative', zIndex: 10 }}>
        {/* Top bar */}
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 28 }}>
          <p style={{ color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: 10, fontWeight: 600, marginBottom: 8 }}>
            Knowledge Base
          </p>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
            <Database size={18} style={{ color: 'var(--brand)', opacity: 0.8 }} />
            Tenant Context Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            Upload and manage the files used to train the agent for specific tenant application logic.
          </p>
        </div>

        {/* Global Upload Zone */}
        <div 
          className="glass"
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); }}
          style={{
            padding: '40px',
            textAlign: 'center',
            border: dragActive ? '2px dashed var(--brand)' : '1px dashed var(--border-subtle)',
            background: dragActive ? 'rgba(13, 242, 242, 0.05)' : 'rgba(13, 242, 242, 0.01)',
            marginBottom: 32,
            transition: 'all 0.2s'
          }}
        >
          {uploading ? <Loader2 size={32} className="spin" style={{ color: 'var(--brand)', marginBottom: 16 }} /> : <Upload size={32} style={{ color: 'var(--brand)', marginBottom: 16, opacity: 0.6 }} />}
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>{uploading ? 'Processing File...' : 'Bulk Upload Context Files'}</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Drop PDFs, JSON, or CSV files here to process</p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'center' }}>
            <select 
              value={selectedTenantId}
              onChange={e => setSelectedTenantId(e.target.value)}
              style={{
                background: 'rgba(5, 17, 17, 0.8)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                padding: '8px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontFamily: 'Space Grotesk, sans-serif'
              }}
            >
                <option value="">Select Tenant...</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <label className="btn-primary" style={{ padding: '8px 20px', fontSize: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              {uploading ? 'Working...' : 'Select Files'}
              <input type="file" hidden onChange={handleFileUpload} disabled={uploading || !selectedTenantId} />
            </label>
          </div>
        </div>

        {/* Existing Files Table */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p style={{ color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: 10, fontWeight: 600 }}>
            Uploaded Context
          </p>
          <div style={{ position: 'relative' }}>
            <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              placeholder="Search files..." 
              style={{
                background: 'rgba(5, 17, 17, 0.8)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                padding: '6px 10px 6px 30px',
                borderRadius: 4,
                fontSize: 11,
                fontFamily: 'Space Grotesk, sans-serif',
                width: 200
              }}
            />
          </div>
        </div>

        <div className="glass" style={{ padding: 0, overflow: 'hidden' }}>
          {loadingFiles ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <Loader2 size={24} className="spin" style={{ color: 'var(--brand)' }} />
            </div>
          ) : files.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No training files found.</div>
          ) : files.map((file, i) => (
            <div 
              key={file.id} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 16, 
                padding: '16px 20px', 
                borderBottom: i === files.length - 1 ? 'none' : '1px solid var(--border-subtle)',
                transition: 'background 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(13, 242, 242, 0.02)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(13, 242, 242, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', flexShrink: 0 }}>
                <FileText size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{file.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {tenants.find(t => t.id === selectedTenantId)?.name} · {file.type} · {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', minWidth: 80 }}>
                {file.createdAt.toLocaleDateString()}
              </div>
              <div style={{ display: 'flex', gap: 8, paddingLeft: 16 }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(file); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <Trash2 size={14} />
                </button>
                <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
