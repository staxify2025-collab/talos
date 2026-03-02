'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, FileCode, CreditCard, BarChart3, Settings, ChevronRight, ArrowLeft, Plus, Upload, ShieldCheck, Loader2, Database } from 'lucide-react';
import { listTenants } from '@/lib/api';

const navItems = [
  { label: 'Tenants', href: '/admin/tenants', icon: Users, description: 'Create & manage tenant accounts' },
  { label: 'Field Schemas', href: '/admin/schemas', icon: FileCode, description: 'Define mapping schemas per tenant' },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3, description: 'View cost savings & performance' },
  { label: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard, description: 'Manage Stripe billing' },
  { label: 'Data Migrations', href: '/admin/migrations', icon: Database, description: 'Source-to-Destination bulk transfer' },
  { label: 'Training Context', href: '/admin/training', icon: Upload, description: 'Manage agent knowledge files' },
  { label: 'Settings', href: '/admin/settings', icon: Settings, description: 'Platform configuration' },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [tenantCount, setTenantCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listTenants()
      .then(tenants => setTenantCount(tenants.length))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Active Tenants', value: loading ? '...' : (tenantCount?.toString() || '0'), icon: Users, color: 'var(--brand)' },
    { label: 'Schemas Defined', value: '0', icon: FileCode, color: 'var(--brand)' },
    { label: 'Jobs Processed', value: '0', icon: BarChart3, color: 'var(--accent-green)' },
    { label: 'Revenue (MRR)', value: '$0.00', icon: CreditCard, color: 'var(--brand)' },
  ];

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
          justifyContent: 'space-between',
          background: 'rgba(5, 5, 5, 0.9)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 5L20 30V65L50 95L80 65V30L50 5Z" stroke="#0df2f2" strokeWidth="2" />
            <path d="M35 45L50 35L65 45" stroke="#0df2f2" strokeWidth="2" />
            <path d="M50 35V75" stroke="#0df2f2" strokeWidth="2" />
            <circle cx="50" cy="35" r="2" fill="#0df2f2" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--brand)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Talos</span>
          <div
            style={{
              fontSize: 9,
              padding: '2px 8px',
              borderRadius: 4,
              border: '1px solid var(--border-glow)',
              background: 'rgba(13, 242, 242, 0.05)',
              color: 'var(--brand)',
              fontWeight: 700,
              letterSpacing: '0.1em',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <ShieldCheck size={10} /> CONTROL PLANE
          </div>
        </div>
        <Link
          href="/"
          style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 11, display: 'flex', alignItems: 'center', gap: 5, letterSpacing: '0.04em', transition: 'color 0.2s' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <ArrowLeft size={12} /> Exit Dashboard
        </Link>
      </header>

      <div 
        style={{ 
          background: 'rgba(13, 242, 242, 0.03)', 
          borderBottom: '1px solid var(--border-subtle)',
          padding: '12px 32px',
          position: 'relative',
          zIndex: 60
        }}
      >
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8, position: 'relative', zIndex: 70 }}>
            <Link 
              href="/admin/tenants"
              className="btn-primary" 
              style={{ padding: '6px 14px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', border: '1px solid var(--brand)', textDecoration: 'none', color: 'black', background: 'var(--brand)' }}
            >
              <Plus size={14} /> New Tenant
            </Link>
            <Link 
              href="/admin/subscriptions"
              className="btn-outline" 
              style={{ padding: '6px 14px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--brand)', border: '1px solid var(--border-subtle)', borderRadius: 4, cursor: 'pointer', textDecoration: 'none', background: 'rgba(13, 242, 242, 0.05)' }}
            >
              <CreditCard size={14} /> Add Plan
            </Link>
            <Link 
              href="/admin/training"
              className="btn-outline" 
              style={{ padding: '6px 14px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'var(--brand)', border: '1px solid var(--border-subtle)', borderRadius: 4, background: 'rgba(13, 242, 242, 0.05)', textDecoration: 'none' }}
            >
              <Upload size={14} /> Upload Context
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 11 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
            System Live: us-central1
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        {/* Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            marginBottom: 32,
          }}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="glass" style={{ padding: '20px', background: 'rgba(13, 242, 242, 0.01)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <stat.icon size={15} style={{ color: stat.color, opacity: 0.8 }} />
                <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {stat.label}
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                {loading && stat.label === 'Active Tenants' ? <Loader2 size={24} className="spin" /> : stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Modules Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
          {/* Main Modules */}
          <div>
            <p style={{ color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: 10, fontWeight: 600, marginBottom: 14 }}>
              Core Modules
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 12,
              }}
            >
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="glass"
                  style={{
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    textDecoration: 'none',
                    color: 'inherit',
                    position: 'relative',
                    zIndex: 20
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--brand)';
                    e.currentTarget.style.background = 'rgba(13, 242, 242, 0.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <item.icon size={18} style={{ color: 'var(--brand)', opacity: 0.7, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2, color: 'var(--text-primary)' }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.description}</div>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          </div>

          {/* Activity Feed / System Log Sidebar */}
          <div>
            <p style={{ color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: 10, fontWeight: 600, marginBottom: 14 }}>
              System Events
            </p>
            <div className="glass" style={{ padding: '16px', fontSize: 11 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { time: 'now', event: 'System Online', type: 'success' },
                ].map((log, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, paddingBottom: i === 3 ? 0 : 12, borderBottom: i === 3 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{log.time}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{log.event}</span>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => alert('Audit logs will be paginated here')}
                style={{ 
                  marginTop: 16, 
                  width: '100%', 
                  background: 'none', 
                  border: '1px dashed var(--border-subtle)', 
                  padding: '8px', 
                  borderRadius: 4,
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                View Full Audit Log
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
