'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  ArrowLeft, 
  Upload, 
  Database, 
  Settings, 
  Rocket,
  Loader2,
  FileText
} from 'lucide-react';
import { getTenant, uploadKnowledgeBase, createSchema } from '@/lib/api';
import type { Tenant } from '@/lib/firestore-schema';

const STEPS = [
  { id: 'identity', title: 'Verify Identity', icon: Settings },
  { id: 'training', title: 'Knowledge Base', icon: Database },
  { id: 'mapping', title: 'First Schema', icon: FileText },
  { id: 'launch', title: 'Launch', icon: Rocket },
];

function SetupWizardContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Form States
  const [kbFiles, setKbFiles] = useState<File[]>([]);
  const [schema, setSchema] = useState({ name: 'Standard Extraction', targetApp: '' });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (id) {
      getTenant(id).then(data => {
        if (data) setTenant(data as unknown as Tenant);
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [id]);

  const handleNext = async () => {
    if (!id) return;

    if (currentStep === 1 && kbFiles.length > 0) {
      setUploading(true);
      try {
        for (const file of kbFiles) {
          await uploadKnowledgeBase(id, file);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setUploading(false);
      }
    }
    
    if (currentStep === 2) {
      try {
        await createSchema(id, {
          ...schema,
          description: 'Initial onboarding schema',
          mappings: [] 
        });
      } catch (err) {
        console.error(err);
      }
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      router.push('/admin/tenants');
    }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><Loader2 className="spin" /></div>;

  if (!id) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 20 }}>
        <p style={{ color: 'var(--text-muted)' }}>Missing Tenant ID</p>
        <button onClick={() => router.push('/admin/tenants')} className="btn-outline">Back to Tenants</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '60px 20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Progress Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 15, left: '10%', right: '10%', height: 1, background: 'var(--border-subtle)', zIndex: 0 }} />
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = i === currentStep;
            const isDone = i < currentStep;
            return (
              <div key={step.id} style={{ textAlign: 'center', zIndex: 1, width: '25%' }}>
                <div style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: '50%', 
                  background: isDone ? 'var(--accent-green)' : (isActive ? 'var(--brand)' : 'var(--bg-card)'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px',
                  color: (isActive || isDone) ? 'black' : 'var(--text-muted)',
                  border: '1px solid var(--border-subtle)',
                  transition: 'all 0.3s'
                }}>
                  {isDone ? <CheckCircle2 size={18} /> : <Icon size={16} />}
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: isActive ? 'var(--brand)' : 'var(--text-muted)' }}>
                  {step.title}
                </div>
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="glass" style={{ padding: 48, minHeight: 400, display: 'flex', flexDirection: 'column' }}>
          {currentStep === 0 && (
            <div className="fade-in">
              <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Welcome to Talos, {tenant?.name}</h1>
              <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Let's get your platform instance configured for a perfect onboarding.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div className="glass" style={{ padding: 20 }}>
                  <label style={{ fontSize: 11, color: 'var(--brand)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Tier</label>
                  <p style={{ fontSize: 16, fontWeight: 600 }}>{tenant?.plan.toUpperCase()}</p>
                </div>
                <div className="glass" style={{ padding: 20 }}>
                  <label style={{ fontSize: 11, color: 'var(--brand)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Status</label>
                  <p style={{ fontSize: 16, fontWeight: 600 }}>{tenant?.status.toUpperCase()}</p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="fade-in">
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Ground the Agent</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Upload business rules, policy docs, or formatting guides to help the agent understand your specific requirements.</p>
              
              <label style={{ 
                border: '1px dashed var(--border-subtle)', 
                borderRadius: 12, 
                padding: 40, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                cursor: 'pointer',
                background: 'rgba(13, 242, 242, 0.02)'
              }}>
                <Upload size={32} style={{ color: 'var(--brand)', marginBottom: 12 }} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Click to upload training data</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>PDF, JSON, CSV supported</span>
                <input 
                  type="file" 
                  hidden 
                  multiple 
                  onChange={e => e.target.files && setKbFiles(Array.from(e.target.files))} 
                />
              </label>

              {kbFiles.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <p style={{ fontSize: 11, color: 'var(--brand)', textTransform: 'uppercase', marginBottom: 12 }}>Queued for upload</p>
                  {kbFiles.map(f => (
                    <div key={f.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4, color: 'var(--text-secondary)' }}>
                      <span>{f.name}</span>
                      <span>{(f.size / 1024).toFixed(1)} KB</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="fade-in">
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Define Your Target</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Name your first automation target. This is usually the name of the ERP or web application you want to automate.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--brand)', textTransform: 'uppercase', marginBottom: 8 }}>Application Name</label>
                  <input 
                    placeholder="e.g. NetSuite, SAP, Internal Portal"
                    value={schema.targetApp}
                    onChange={e => setSchema(s => ({ ...s, targetApp: e.target.value }))}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '12px', color: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--brand)', textTransform: 'uppercase', marginBottom: 8 }}>Process Name</label>
                  <input 
                    placeholder="e.g. Invoice Entry"
                    value={schema.name}
                    onChange={e => setSchema(s => ({ ...s, name: e.target.value }))}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '12px', color: 'white' }}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="fade-in" style={{ textAlign: 'center', paddingTop: 40 }}>
              <div style={{ 
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                background: 'rgba(13, 242, 242, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 24px',
                color: 'var(--brand)'
              }}>
                <Rocket size={40} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Ready for Liftoff</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 40, maxWidth: 400, margin: '0 auto 40px' }}>
                Your tenant instance is provisioned and trained. You're ready to start automating pixels.
              </p>
            </div>
          )}

          <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', paddingTop: 40 }}>
            <button 
              disabled={currentStep === 0 || uploading}
              onClick={() => setCurrentStep(prev => prev - 1)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}
            >
              <ArrowLeft size={16} /> Previous
            </button>
            <button 
              disabled={uploading || (currentStep === 2 && !schema.targetApp)}
              onClick={handleNext}
              className="btn-primary" 
              style={{ padding: '12px 32px', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {uploading ? <Loader2 size={16} className="spin" /> : (currentStep === STEPS.length - 1 ? 'Go to Dashboard' : 'Next Step')}
              {!uploading && <ArrowRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SetupWizard() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><Loader2 className="spin" /></div>}>
      <SetupWizardContent />
    </Suspense>
  );
}
