'use client';

import Link from 'next/link';
import { ArrowLeft, Settings, Shield, Bell, Lock, Database } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
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
        }}
      >
        <Link
          href="/admin"
          style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, letterSpacing: '0.04em' }}
        >
          <ArrowLeft size={14} /> Admin
        </Link>
        <span style={{ color: 'var(--border-subtle)' }}>/</span>
        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--brand)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Settings</span>
      </header>

      <div className="container" style={{ paddingTop: 36, paddingBottom: 60, maxWidth: 800 }}>
        <div style={{ marginBottom: 32 }}>
          <p style={{ color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: 10, fontWeight: 600, marginBottom: 8 }}>
            Platform Control
          </p>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
            <Settings size={18} style={{ color: 'var(--brand)', opacity: 0.8 }} />
            System Settings
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            Configure global platform behavior and security policies.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { icon: Shield, label: 'Access Control', desc: 'Manage admin roles and permissions' },
            { icon: Bell, label: 'Notifications', desc: 'Configure system alerts and emails' },
            { icon: Lock, label: 'Security', desc: 'API keys, tokens and encryption settings' },
            { icon: Database, label: 'Database', desc: 'Firestore and Storage configuration' },
          ].map((item, i) => (
            <div key={i} className="glass" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(13, 242, 242, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)' }}>
                <item.icon size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.desc}</div>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--brand)', opacity: 0.5 }}>CONFIGURE</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
