'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, FileCode, ArrowRight, Trash2, GripVertical, Loader2, X } from 'lucide-react';
import { listTenants, getSchemas, createSchema } from '@/lib/api';
import type { Tenant, FieldMappingSchema, MappingEntry } from '@/lib/firestore-schema';

const inputBase: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 6,
  border: '1px solid var(--border-subtle)',
  background: 'rgba(5, 17, 17, 0.8)',
  color: 'var(--text-primary)',
  fontFamily: 'Space Grotesk, sans-serif',
  fontSize: 13,
  outline: 'none',
  transition: 'border-color 0.2s',
};

export default function SchemasPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [schemas, setSchemas] = useState<FieldMappingSchema[]>([]);
  const [loading, setLoading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Editor State
  const [schemaForm, setSchemaForm] = useState({
    name: '',
    targetApp: '',
    description: '',
    mappings: [{ sourceField: '', targetLabel: '' }] as MappingEntry[]
  });

  useEffect(() => {
    listTenants().then(data => {
      setTenants(data);
      if (data.length > 0) setSelectedTenantId(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedTenantId) return;
    setLoading(true);
    getSchemas(selectedTenantId)
      .then(setSchemas)
      .finally(() => setLoading(false));
  }, [selectedTenantId]);

  const addMapping = () => setSchemaForm(prev => ({ ...prev, mappings: [...prev.mappings, { sourceField: '', targetLabel: '' }] }));
  
  const removeMapping = (index: number) => 
    setSchemaForm(prev => ({ ...prev, mappings: prev.mappings.filter((_, i) => i !== index) }));

  const updateMapping = (index: number, field: 'sourceField' | 'targetLabel', value: string) =>
    setSchemaForm(prev => ({
      ...prev,
      mappings: prev.mappings.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    }));

  const handleSave = async () => {
    if (!selectedTenantId) return;
    setSaving(true);
    try {
      await createSchema(selectedTenantId, schemaForm);
      setShowEditor(false);
      setSchemaForm({ name: '', targetApp: '', description: '', mappings: [{ sourceField: '', targetLabel: '' }] });
      // Refresh
      const data = await getSchemas(selectedTenantId);
      setSchemas(data);
    } catch (err) {
      console.error(err);
      alert('Failed to save schema');
    } finally {
      setSaving(false);
    }
  };

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
        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--brand)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Field Schemas</span>
      </header>

      <div className="container" style={{ paddingTop: 36, paddingBottom: 60, maxWidth: 900, position: 'relative', zIndex: 10 }}>
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p style={{ color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: 10, fontWeight: 600, marginBottom: 8 }}>
              Configuration
            </p>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
              <FileCode size={18} style={{ color: 'var(--brand)', opacity: 0.8 }} />
              Field Mapping Schemas
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              Define how source document fields map to target application inputs.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, position: 'relative', zIndex: 50 }}>
            <select 
              value={selectedTenantId}
              onChange={e => setSelectedTenantId(e.target.value)}
              style={{ ...inputBase, width: 200, fontSize: 12 }}
            >
              {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <button 
              className="btn-primary" 
              style={{ padding: '9px 18px', fontSize: 12, border: '1px solid var(--brand)', cursor: 'pointer', background: 'var(--brand)', color: 'black' }} 
              onClick={() => setShowEditor(true)}
            >
              <Plus size={14} /> New Schema
            </button>
          </div>
        </div>

        {/* Schema Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}><Loader2 className="spin" /></div>
          ) : schemas.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }} className="glass">No schemas defined for this tenant.</div>
          ) : schemas.map((schema) => (
            <div
              key={schema.id}
              className="glass"
              style={{
                padding: '18px 22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-glow)';
                e.currentTarget.style.boxShadow = '0 0 16px rgba(13,242,242,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <FileCode size={18} style={{ color: 'var(--brand)', opacity: 0.7 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2, color: 'var(--text-primary)' }}>{schema.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {schema.targetApp} · {schema.mappings.length} mappings
                  </div>
                </div>
              </div>
              <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
          ))}
        </div>

        {/* Schema Editor Modal */}
        {showEditor && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
              padding: 24,
            }}
          >
            <div
              className="glass"
              style={{ maxWidth: 640, width: '100%', padding: 28, maxHeight: '90vh', overflowY: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>
                    Create Field Mapping Schema
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    Map source document fields to target application input fields.
                  </p>
                </div>
                <button onClick={() => setShowEditor(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 5, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Schema Name</label>
                  <input 
                    placeholder="Invoice Entry" 
                    value={schemaForm.name}
                    onChange={e => setSchemaForm(prev => ({ ...prev, name: e.target.value }))}
                    style={inputBase} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 5, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Target App</label>
                  <input 
                    placeholder="SAP S/4HANA" 
                    value={schemaForm.targetApp}
                    onChange={e => setSchemaForm(prev => ({ ...prev, targetApp: e.target.value }))}
                    style={inputBase} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 5, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Description</label>
                  <input 
                    placeholder="Description of this mapping flow" 
                    value={schemaForm.description}
                    onChange={e => setSchemaForm(prev => ({ ...prev, description: e.target.value }))}
                    style={inputBase} 
                  />
                </div>
              </div>

              {/* Mappings Builder */}
              <p style={{ color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: 10, fontWeight: 600, marginBottom: 12 }}>
                Field Mappings
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {schemaForm.mappings.map((mapping, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '10px 12px',
                      borderRadius: 6,
                      background: 'rgba(13, 242, 242, 0.03)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <GripVertical size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <input
                      placeholder="Source Field (e.g. Total)"
                      value={mapping.sourceField}
                      onChange={(e) => updateMapping(i, 'sourceField', e.target.value)}
                      style={{ ...inputBase, flex: 1, padding: '7px 10px', fontSize: 12 }}
                    />
                    <ArrowRight size={12} style={{ color: 'var(--brand)', flexShrink: 0, opacity: 0.7 }} />
                    <input
                      placeholder="Target Label (e.g. amount_total)"
                      value={mapping.targetLabel}
                      onChange={(e) => updateMapping(i, 'targetLabel', e.target.value)}
                      style={{ ...inputBase, flex: 1, padding: '7px 10px', fontSize: 12 }}
                    />
                    <button
                      onClick={() => removeMapping(i)}
                      disabled={schemaForm.mappings.length <= 1}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: schemaForm.mappings.length <= 1 ? 'var(--text-muted)' : '#ef4444',
                        cursor: schemaForm.mappings.length <= 1 ? 'not-allowed' : 'pointer',
                        padding: 4,
                        flexShrink: 0,
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={addMapping}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  marginTop: 10,
                  padding: '7px 12px',
                  borderRadius: 6,
                  border: '1px dashed var(--border-subtle)',
                  background: 'transparent',
                  color: 'var(--brand)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Space Grotesk, sans-serif',
                }}
              >
                <Plus size={12} /> Add Mapping
              </button>

              <div style={{ display: 'flex', gap: 10, marginTop: 28, justifyContent: 'flex-end' }}>
                <button className="btn-outline" style={{ padding: '9px 18px', fontSize: 12, background: 'none' }} onClick={() => setShowEditor(false)}>
                  Cancel
                </button>
                <button 
                  className="btn-primary" 
                  disabled={saving}
                  style={{ padding: '9px 18px', fontSize: 12, border: 'none' }}
                  onClick={handleSave}
                >
                  {saving ? <Loader2 size={14} className="spin" /> : 'Save Schema'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
