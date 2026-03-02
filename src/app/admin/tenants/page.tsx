'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Users, MoreVertical, Search, Loader2, X } from 'lucide-react';
import { listTenants, createTenant } from '@/lib/api';
import type { Tenant } from '@/lib/firestore-schema';

export default function TenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [newTenant, setNewTenant] = useState({
    name: '',
    ownerName: '',
    ownerEmail: '',
    plan: 'enterprise' as const,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await listTenants();
      setTenants(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const tenant = await createTenant(newTenant);
      setShowModal(false);
      setNewTenant({ name: '', ownerName: '', ownerEmail: '', plan: 'enterprise' });
      // Redirect to onboarding wizard
      router.push(`/admin/tenants/setup?id=${tenant.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to create tenant');
    } finally {
      setSaving(false);
    }
  };

  const filtered = tenants.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

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
        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--brand)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Tenants</span>
      </header>

      <div className="container" style={{ paddingTop: 36, paddingBottom: 60, maxWidth: 900, position: 'relative', zIndex: 10 }}>
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p style={{ color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: 10, fontWeight: 600, marginBottom: 8 }}>
              Accounts
            </p>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
              <Users size={18} style={{ color: 'var(--brand)', opacity: 0.8 }} />
              Tenant Management
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              Create and manage tenant accounts and subscriptions.
            </p>
          </div>
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Opening Tenants Modal');
              setShowModal(true);
            }}
            className="btn-primary" 
            style={{ padding: '9px 18px', fontSize: 12, border: '1px solid var(--brand)', cursor: 'pointer', background: 'var(--brand)', color: 'black', position: 'relative', zIndex: 100 }}
          >
            <Plus size={14} /> New Tenant
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 320, marginBottom: 20 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search tenants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 34px',
              borderRadius: 6,
              border: '1px solid var(--border-subtle)',
              background: 'rgba(5, 17, 17, 0.8)',
              color: 'var(--text-primary)',
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 12,
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
          />
        </div>

        {/* Table */}
        <div className="glass" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <Loader2 size={24} className="spin" style={{ color: 'var(--brand)' }} />
            </div>
          ) : error ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>{error}</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No tenants found.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {['Name', 'Plan', 'Status', 'ID', 'Created', ''].map((h) => (
                    <th
                      key={h || 'actions'}
                      style={{
                        textAlign: 'left',
                        padding: '10px 16px',
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
                {filtered.map((tenant) => (
                  <tr
                    key={tenant.id}
                    style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(13, 242, 242, 0.02)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            background: 'rgba(13, 242, 242, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 700,
                            color: 'var(--brand)',
                          }}
                        >
                          {tenant.name[0]}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{tenant.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>
                      {tenant.plan}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 4,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          background:
                            tenant.status === 'active' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(13, 242, 242, 0.08)',
                          color:
                            tenant.status === 'active' ? 'var(--accent-green)' : 'var(--brand)',
                        }}
                      >
                        {tenant.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {tenant.id.slice(0, 8)}...
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        <button 
                          onClick={() => router.push('/admin/subscriptions')}
                          className="btn-outline" 
                          style={{ padding: '4px 10px', fontSize: 10, background: 'none', cursor: 'pointer' }}
                        >
                          Plan
                        </button>
                        <button 
                          onClick={() => router.push('/admin/training')}
                          className="btn-outline" 
                          style={{ padding: '4px 10px', fontSize: 10, background: 'none', cursor: 'pointer' }}
                        >
                          Training
                        </button>
                        <button
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, transition: 'color 0.2s' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                        >
                          <MoreVertical size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: 20 }}
        >
          <div 
            className="glass" 
            style={{ maxWidth: 460, width: '100%', padding: 32, position: 'relative', boxShadow: '0 0 40px rgba(0,0,0,0.5)', zIndex: 3010 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', right: 20, top: 20, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Register New Tenant</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Provision a new platform instance and owner account.</p>
            
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--brand)', textTransform: 'uppercase', marginBottom: 6 }}>Organization Name</label>
                <input 
                  required
                  placeholder="e.g. Acme Corp"
                  value={newTenant.name}
                  onChange={e => setNewTenant(prev => ({ ...prev, name: e.target.value }))}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '10px 12px', color: 'white', fontSize: 14, outline: 'none', fontFamily: 'Space Grotesk' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--brand)', textTransform: 'uppercase', marginBottom: 6 }}>Owner Name</label>
                  <input 
                    required
                    placeholder="John Doe"
                    value={newTenant.ownerName}
                    onChange={e => setNewTenant(prev => ({ ...prev, ownerName: e.target.value }))}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '10px 12px', color: 'white', fontSize: 14, outline: 'none', fontFamily: 'Space Grotesk' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--brand)', textTransform: 'uppercase', marginBottom: 6 }}>Tier</label>
                  <select 
                    value={newTenant.plan}
                    onChange={e => setNewTenant(prev => ({ ...prev, plan: e.target.value as any }))}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '10px 12px', color: 'white', fontSize: 14, outline: 'none', fontFamily: 'Space Grotesk' }}
                  >
                    <option value="enterprise">Enterprise</option>
                    <option value="professional">Professional</option>
                    <option value="starter">Starter</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--brand)', textTransform: 'uppercase', marginBottom: 6 }}>Owner Email</label>
                <input 
                  required
                  type="email"
                  placeholder="owner@company.com"
                  value={newTenant.ownerEmail}
                  onChange={e => setNewTenant(prev => ({ ...prev, ownerEmail: e.target.value }))}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '10px 12px', color: 'white', fontSize: 14, outline: 'none', fontFamily: 'Space Grotesk' }}
                />
              </div>

              <button 
                type="submit"
                disabled={saving}
                className="btn-primary" 
                style={{ marginTop: 12, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: '1px solid var(--brand)', cursor: 'pointer', background: 'var(--brand)', color: 'black' }}
              >
                {saving ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
                {saving ? 'Provisioning...' : 'Complete Registration'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
