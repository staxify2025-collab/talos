'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BarChart3, TrendingUp, Zap, Database, Loader2, Plug } from 'lucide-react';
import { getRuns } from '@/lib/api';
import type { RunLog } from '@/lib/firestore-schema';

// ─── Helpers ────────────────────────────────────────────────

function pct(n: number, d: number) {
  if (d === 0) return '0';
  return ((n / d) * 100).toFixed(1);
}

function estimateCostSavings(runs: RunLog[]) {
  const PRICE_PER_1K = 0.00035;
  const CACHE_DISCOUNT = 0.9;

  let totalTokens = 0;
  let cachedTokens = 0;

  for (const r of runs) {
    totalTokens += r.usageMetadata.totalTokenCount;
    cachedTokens += r.usageMetadata.cachedContentTokenCount;
  }

  const fullCost = (totalTokens / 1000) * PRICE_PER_1K;
  const actualCost =
    ((totalTokens - cachedTokens) / 1000) * PRICE_PER_1K +
    (cachedTokens / 1000) * PRICE_PER_1K * (1 - CACHE_DISCOUNT);
  const saved = fullCost - actualCost;

  return { totalTokens, cachedTokens, fullCost, actualCost, saved };
}

// ─── Component ──────────────────────────────────────────────

export default function AnalyticsPage() {
  const router = useRouter();
  const [runs, setRuns] = useState<RunLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a production admin view, this might list all runs or allow filtering.
    // For now, we fetch the demo logs to show the dashboard.
    getRuns('demo')
      .then(setRuns)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalRuns = runs.length;
  const cacheHits = runs.filter((r) => r.cacheStatus === 'HIT').length;
  const hitRate = totalRuns > 0 ? ((cacheHits / totalRuns) * 100).toFixed(1) : '0';
  const webmcpRuns = runs.filter((r) => r.executionPath === 'WEBMCP').length;
  const webmcpRate = totalRuns > 0 ? ((webmcpRuns / totalRuns) * 100).toFixed(1) : '0';
  const cost = estimateCostSavings(runs);

  const schemaMap = new Map<string, RunLog[]>();
  for (const r of runs) {
    const arr = schemaMap.get(r.schemaId) ?? [];
    arr.push(r);
    schemaMap.set(r.schemaId, arr);
  }

  const cardStyle: React.CSSProperties = {
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  };

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
        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--brand)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Analytics</span>
      </header>

      <div className="container" style={{ paddingTop: 36, paddingBottom: 60, maxWidth: 960, position: 'relative', zIndex: 10 }}>
        <div style={{ marginBottom: 32 }}>
          <p style={{ color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: 10, fontWeight: 600, marginBottom: 8 }}>
            Performance
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-primary)' }}>
            <BarChart3 size={20} style={{ color: 'var(--brand)' }} />
            Context Caching ROI
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, letterSpacing: '0.02em' }}>
            Track token usage, cache hit rates, WebMCP adoption, and cost savings.
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <Loader2 size={24} className="spin" style={{ color: 'var(--brand)' }} />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: 14,
                marginBottom: 36,
              }}
            >
              {/* Total Runs */}
              <div className="glass" style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Zap size={14} style={{ color: 'var(--brand)', opacity: 0.8 }} />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Total Runs
                  </span>
                </div>
                <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>{totalRuns}</span>
              </div>

              {/* Cache Hit Rate */}
              <div className="glass" style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Database size={14} style={{ color: 'var(--accent-green)', opacity: 0.8 }} />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Cache Hit Rate
                  </span>
                </div>
                <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-green)' }}>{hitRate}%</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cacheHits} / {totalRuns}</span>
              </div>

              {/* Cached Tokens */}
              <div className="glass" style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <TrendingUp size={14} style={{ color: 'var(--brand)', opacity: 0.8 }} />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Cached Tokens
                  </span>
                </div>
                <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--brand)' }}>{pct(cost.cachedTokens, cost.totalTokens)}%</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cost.cachedTokens.toLocaleString()} / {cost.totalTokens.toLocaleString()}</span>
              </div>

              {/* Cost Saved */}
              <div className="glass" style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <TrendingUp size={14} style={{ color: 'var(--accent-green)', opacity: 0.8 }} />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Cost Saved
                  </span>
                </div>
                <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-green)' }}>${cost.saved.toFixed(2)}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>vs ${cost.fullCost.toFixed(2)} without caching</span>
              </div>

              {/* WebMCP Rate */}
              <div className="glass" style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Plug size={14} style={{ color: 'var(--brand)', opacity: 0.8 }} />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    WebMCP Rate
                  </span>
                </div>
                <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--brand)' }}>{webmcpRate}%</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{webmcpRuns} structured / {totalRuns} total</span>
              </div>
            </div>

            {/* Per-Schema Breakdown */}
            <p style={{ color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: 10, fontWeight: 600, marginBottom: 14 }}>
              Per-Schema Breakdown
            </p>

            {schemaMap.size === 0 ? (
              <div className="glass" style={{ padding: '40px 28px', textAlign: 'center' }}>
                <BarChart3 size={28} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: 12 }} />
                <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  No runs yet. Process documents from the Dashboard to see analytics.
                </p>
              </div>
            ) : (
              <div className="glass" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      {['Schema', 'Runs', 'Hit Rate', 'Cached', 'Total', 'Savings'].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: 'left',
                            padding: '10px 14px',
                            fontSize: 10,
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...schemaMap.entries()].map(([schemaId, schemaRuns]) => {
                      const hits = schemaRuns.filter((r) => r.cacheStatus === 'HIT').length;
                      const total = schemaRuns.reduce((s, r) => s + r.usageMetadata.totalTokenCount, 0);
                      const cached = schemaRuns.reduce((s, r) => s + r.usageMetadata.cachedContentTokenCount, 0);
                      const avgSavings =
                        schemaRuns.length > 0
                          ? (schemaRuns.reduce((s, r) => s + r.tokenSavingsPercent, 0) / schemaRuns.length).toFixed(1)
                          : '0';
                      return (
                        <tr
                          key={schemaId}
                          style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s', cursor: 'pointer' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(13, 242, 242, 0.02)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: '10px 14px', fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                            {schemaId.slice(0, 8)}…
                          </td>
                          <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>
                            {schemaRuns.length}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ color: 'var(--accent-green)', fontWeight: 600, fontSize: 13 }}>
                              {pct(hits, schemaRuns.length)}%
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>
                            {cached.toLocaleString()}
                          </td>
                          <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>
                            {total.toLocaleString()}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: 4,
                                letterSpacing: '0.04em',
                                background: 'rgba(13, 242, 242, 0.08)',
                                color: 'var(--brand)',
                              }}
                            >
                              {avgSavings}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
