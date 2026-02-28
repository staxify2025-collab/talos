'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, CreditCard, Check, Settings } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: string;
  interval: string;
  tenants: number;
  features: string[];
}

const mockPlans: Plan[] = [
  { id: '1', name: 'Enterprise (Staxify Baseline)', price: '$0', interval: 'yr', tenants: 1, features: ['Internal Platform Access', 'Unlimited processing', 'Unlimited schemas'] },
];

export default function SubscriptionsPage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative' }}>
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
        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--brand)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Subscriptions</span>
      </header>

      <div className="container" style={{ paddingTop: 36, paddingBottom: 60, maxWidth: 1000, position: 'relative', zIndex: 10 }}>
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p style={{ color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: 10, fontWeight: 600, marginBottom: 8 }}>
              Billing Configuration
            </p>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
              <CreditCard size={18} style={{ color: 'var(--brand)', opacity: 0.8 }} />
              Subscription Plans
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              Manage public and private pricing tiers for the platform.
            </p>
          </div>
          <button 
            onClick={() => alert('Plan editor coming soon')}
            className="btn-primary" 
            style={{ padding: '9px 18px', fontSize: 12, border: '1px solid var(--brand)', cursor: 'pointer', background: 'transparent' }}
          >
            <Plus size={14} /> Create New Plan
          </button>
        </div>

        {/* Plans Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {mockPlans.map((plan) => (
            <div key={plan.id} className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{plan.name}</h3>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{plan.tenants} tenants active</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--brand)' }}>{plan.price}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>/{plan.interval}</div>
                </div>
              </div>

              <div style={{ flex: 1, marginBottom: 24 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.04em' }}>Included Features</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {plan.features.map((feat, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                      <Check size={12} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
                      {feat}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button 
                  onClick={() => alert('Editing this tier...')}
                  className="btn-outline" 
                  style={{ flex: 1, padding: '8px', fontSize: 11, background: 'none', border: '1px solid var(--border-subtle)', color: 'var(--brand)', borderRadius: 4, cursor: 'pointer' }}
                >
                  Edit Tier
                </button>
                <button 
                  onClick={() => alert('Advanced plan settings...')}
                  className="btn-outline" 
                  style={{ width: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: '1px solid var(--border-subtle)', color: 'var(--brand)', borderRadius: 4, cursor: 'pointer' }}
                >
                  <Settings size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Billing Logs */}
        <div style={{ marginTop: 40 }}>
           <p style={{ color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: 10, fontWeight: 600, marginBottom: 14 }}>
            Recent Billing Transactions
          </p>
          <div className="glass" style={{ padding: '0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
                  {['Transaction ID', 'Tenant', 'Amount', 'Date', 'Status'].map(h => (
                    <th key={h} style={{ padding: '12px 18px', textAlign: 'left', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { id: 'TX-9021', tenant: 'Staxify (Direct)', amount: '$0.00', date: '2024-03-01', status: 'internal' },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                     <td style={{ padding: '12px 18px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{row.id}</td>
                     <td style={{ padding: '12px 18px', fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{row.tenant}</td>
                     <td style={{ padding: '12px 18px', fontSize: 12, color: 'var(--text-secondary)' }}>{row.amount}</td>
                     <td style={{ padding: '12px 18px', fontSize: 11, color: 'var(--text-muted)' }}>{row.date}</td>
                     <td style={{ padding: '12px 18px' }}>
                       <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(13, 242, 242, 0.1)', color: 'var(--brand)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
                         {row.status}
                       </span>
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
