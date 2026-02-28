'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2 } from 'lucide-react';

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function StaxZone() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    setFiles((prev) => [...prev, ...accepted]);
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
    if (files.length === 0) return;
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1500));
    setFiles([]);
    setProcessing(false);
  };

  return (
    <section id="stax-zone" style={{ padding: '40px 0 80px' }}>
      <div className="container" style={{ maxWidth: 640 }}>
        {/* Section Label */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <p
            style={{
              color: 'var(--brand)',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              fontSize: 11,
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            Upload Zone
          </p>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
            Process Your Documents
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6, maxWidth: 400, margin: '0 auto' }}>
            Drag and drop your PDF, CSV, or image files.
            <br />
            Powered by Talos&apos;s neural vision engine.
          </p>
        </div>

        {/* Dropzone */}
        <div className="glass" style={{ padding: 32 }}>
          <div
            {...getRootProps()}
            style={{
              border: `1px dashed ${isDragActive ? 'var(--brand)' : 'var(--border-subtle)'}`,
              borderRadius: 8,
              padding: 40,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              background: isDragActive ? 'rgba(13, 242, 242, 0.04)' : 'transparent',
              marginBottom: files.length > 0 ? 20 : 0,
            }}
          >
            <input {...getInputProps()} />
            <Upload size={24} style={{ color: 'var(--brand)', marginBottom: 12, opacity: 0.7 }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
              {isDragActive ? 'Drop files here' : 'Drag & drop, or click to browse'}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>
              PDF, PNG, JPEG, CSV · Max 100MB
            </p>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                {files.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 14px',
                      background: 'rgba(13, 242, 242, 0.04)',
                      borderRadius: 6,
                      fontSize: 13,
                    }}
                  >
                    <FileText size={14} style={{ color: 'var(--brand)', flexShrink: 0, opacity: 0.7 }} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.name}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11, flexShrink: 0 }}>
                      {formatSize(f.size)}
                    </span>
                  </div>
                ))}
              </div>
              <button
                className="btn-primary"
                onClick={handleProcess}
                disabled={processing}
                style={{ width: '100%', justifyContent: 'center', padding: '10px 24px', fontSize: 13 }}
              >
                {processing ? (
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Upload size={14} />
                )}
                {processing ? 'Processing...' : `Process ${files.length} file${files.length > 1 ? 's' : ''}`}
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
