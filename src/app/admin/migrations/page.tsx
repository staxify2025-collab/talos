'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Database, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getSchemas, createMigrationSession } from '@/lib/api';
import type { MigrationSession, FieldMappingSchema } from '@/lib/firestore-schema';

export default function MigrationsPage() {
  const searchParams = useSearchParams();
  const tenantId = searchParams.get('tenantId') || 'TEST_TENANT';
  
  const [sessions, setSessions] = useState<MigrationSession[]>([]);
  const [schemas, setSchemas] = useState<FieldMappingSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newSession, setNewSession] = useState({
    name: '',
    sourceApp: '',
    targetApp: '',
    schemaId: '',
    totalRecords: 100, // Placeholder
  });

  useEffect(() => {
    // 1. Fetch Migration Sessions
    const q = query(
      collection(db!, `tenants/${tenantId}/migration_sessions`),
      orderBy('createdAt', 'desc')
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as MigrationSession));
      setSessions(docs);
      setLoading(false);
    });

    // 2. Fetch Schemas for the modal
    getSchemas(tenantId).then(setSchemas);

    return () => unsub();
  }, [tenantId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMigrationSession(tenantId, newSession);
      setShowModal(false);
      setNewSession({ name: '', sourceApp: '', targetApp: '', schemaId: '', totalRecords: 100 });
    } catch (err) {
      console.error(err);
      alert('Failed to create migration session');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Data Migrations</h1>
          <p className="text-zinc-400 mt-1">Orchestrate "Source-to-Destination" bulk record transfers.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20"
        >
          <Plus size={20} />
          New Migration
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-zinc-500 animate-pulse">Initializing migration controller...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-16 text-center space-y-6">
          <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto">
            <Database className="text-zinc-500" size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-white">No migration sessions found</h3>
            <p className="text-zinc-400 max-w-sm mx-auto">
              Ready to move data between apps? Start your first migration session to see the Talos Dual-Surface controller in action.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {sessions.map((session) => (
            <Link 
              key={session.id} 
              href={`/admin/migrations/${session.id}?tenantId=${tenantId}`}
              className="group block bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl hover:border-indigo-500/50 transition-all hover:bg-zinc-900/60 shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${
                    session.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                    session.status === 'in_progress' ? 'bg-indigo-500/10 text-indigo-500' :
                    'bg-zinc-800 text-zinc-400'
                  }`}>
                    <Database size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-wider text-sm">
                      {session.name}
                    </h3>
                    <div className="flex items-center gap-2 text-zinc-500 mt-1">
                      <span className="text-sm font-medium">{session.sourceApp}</span>
                      <ArrowRight size={14} className="opacity-50" />
                      <span className="text-sm font-medium">{session.targetApp}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-2xl font-black text-white">
                      {Math.round((session.migratedCount / (session.totalRecords || 1)) * 100)}%
                    </div>
                    <div className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">Progress</div>
                  </div>
                  <ChevronRight size={20} className="text-zinc-600 group-hover:text-indigo-500 transition-colors" />
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                  <div className="flex gap-4">
                    <span className="text-zinc-500">Records: {session.totalRecords}</span>
                    <span className="text-emerald-500">Migrated: {session.migratedCount}</span>
                    <span className="text-amber-500">Exceptions: {session.exceptionCount}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] ${
                    session.status === 'completed' ? 'bg-emerald-500/20 text-emerald-500' :
                    session.status === 'in_progress' ? 'bg-indigo-500/20 text-indigo-500 animate-pulse' :
                    'bg-zinc-800 text-zinc-400'
                  }`}>
                    {session.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="h-3 bg-zinc-800/80 rounded-full overflow-hidden flex shadow-inner">
                  <div 
                    className="h-full bg-indigo-500 shadow-lg shadow-indigo-500/50 transition-all duration-500" 
                    style={{ width: `${(session.migratedCount / session.totalRecords) * 100}%` }}
                  />
                  <div 
                    className="h-full bg-amber-500/80 transition-all duration-500" 
                    style={{ width: `${(session.exceptionCount / session.totalRecords) * 100}%` }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal - New Migration (Glassmorphism) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-zinc-800">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Plus className="text-indigo-500" />
                Start Migration Session
              </h2>
            </div>
            
            <form onSubmit={handleCreate} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Session Name</label>
                <input
                  required
                  value={newSession.name}
                  onChange={e => setNewSession({...newSession, name: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="e.g. Q1 CRM to ERP Migration"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Source App</label>
                  <input
                    required
                    value={newSession.sourceApp}
                    onChange={e => setNewSession({...newSession, sourceApp: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="e.g. Salesforce"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Target App</label>
                  <input
                    required
                    value={newSession.targetApp}
                    onChange={e => setNewSession({...newSession, targetApp: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="e.g. NetSuite"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Field Mapping Schema</label>
                <select
                  required
                  value={newSession.schemaId}
                  onChange={e => setNewSession({...newSession, schemaId: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                >
                  <option value="">Select a mapping schema...</option>
                  {schemas.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.targetApp})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-5 py-3 rounded-xl font-bold text-zinc-400 hover:bg-zinc-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"
                >
                  Create Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
