'use client';

import { useState } from 'react';

export default function JoinBeta() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <section style={{ padding: '40px 0 100px' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'center' }}>
        <div className="glass" style={{ maxWidth: 520, width: '100%', padding: '48px 36px', textAlign: 'center' }}>
          {/* Section Label */}
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
            Early Access
          </p>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>
            Join the Beta
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.7, maxWidth: 380, margin: '0 auto 28px' }}>
            Be among the first to experience autonomous data entry. Get early access and shape the product.
          </p>

          {!submitted ? (
            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', gap: 10, maxWidth: 380, margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}
            >
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  flex: 1,
                  minWidth: 200,
                  padding: '11px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                  background: 'rgba(5, 17, 17, 0.8)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontFamily: 'Space Grotesk, sans-serif',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
              />
              <button type="submit" className="btn-primary" style={{ padding: '11px 24px', fontSize: 12 }}>
                Join Now
              </button>
            </form>
          ) : (
            <div
              style={{
                padding: '14px 20px',
                borderRadius: 8,
                background: 'rgba(34, 197, 94, 0.08)',
                border: '1px solid rgba(34, 197, 94, 0.25)',
                color: 'var(--accent-green)',
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              You&apos;re on the list! We&apos;ll be in touch.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
