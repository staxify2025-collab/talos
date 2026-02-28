'use client';

import { Zap, Shield, Brain } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Fast Processing',
    description: 'Gemini 3 Flash with context caching. Sub-second field extraction and coordinate mapping.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Enterprise-grade encryption. Multi-tenant isolation. Your data never leaves your control.',
  },
  {
    icon: Brain,
    title: 'Vision Intelligence',
    description: 'Pixel-precise bounding boxes on any UI — modern apps, legacy ERP systems, even terminal UIs.',
  },
];

export default function AICapabilities() {
  return (
    <section id="capabilities" style={{ padding: '60px 0 80px' }}>
      <div className="container" style={{ maxWidth: 900 }}>
        {/* Section Label */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
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
            Capabilities
          </p>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
            Built for Precision
          </h2>
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="glass"
                style={{
                  padding: 28,
                  transition: 'all 0.3s',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-glow)';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(13,242,242,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Icon size={20} style={{ color: 'var(--brand)', marginBottom: 16, opacity: 0.8 }} />
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
                  {f.title}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>
                  {f.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
