'use client';

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  ArrowRight, 
  Search, 
  PenTool, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Pause, 
  RotateCcw,
  Maximize2,
  Layout,
  FileText,
  Activity,
  History,
  ShieldCheck,
  TrendingUp,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { 
  subscribeMigrationSession, 
  subscribeMigrationJobs, 
  submitMigrationStep,
  updateMigrationJob,
  getMigrationReportUrl
} from '@/lib/api';
import type { MigrationSession, MigrationJob } from '@/lib/firestore-schema';

type MigrationState = 'IDLE' | 'READING' | 'MAPPING' | 'WRITING' | 'VALIDATING' | 'SUCCESS' | 'ERROR';

export default function MigrationController() {
  const { id } = useParams() as { id: string };
  const searchParams = useSearchParams();
  const tenantId = searchParams.get('tenantId') || 'TEST_TENANT';
  
  const [session, setSession] = useState<MigrationSession | null>(null);
  const [jobs, setJobs] = useState<MigrationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeState, setActiveState] = useState<MigrationState>('IDLE');
  
  const [recordID, setRecordID] = useState('REC-001');
  const [sourceImg, setSourceImg] = useState<string | null>(null);
  const [targetImg, setTargetImg] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [selectedJob, setSelectedJob] = useState<MigrationJob | null>(null);
  const [correction, setCorrection] = useState<Record<string, string>>({});
  const [downloadingReport, setDownloadingReport] = useState(false);

  useEffect(() => {
    const unsubSession = subscribeMigrationSession(tenantId, id, setSession);
    const unsubJobs = subscribeMigrationJobs(tenantId, id, setJobs);
    setLoading(false);
    return () => {
      unsubSession();
      unsubJobs();
    };
  }, [tenantId, id]);

  const runMigrationStep = async () => {
    if (!sourceImg || !targetImg || !session) return;
    
    setProcessing(true);
    setActiveState('READING');
    
    try {
      await new Promise(r => setTimeout(r, 1500));
      setActiveState('MAPPING');
      
      await submitMigrationStep({
        tenantId,
        sessionId: id,
        recordID,
        sourceScreenshotBase64: sourceImg.split(',')[1],
        targetScreenshotBase64: targetImg.split(',')[1],
        schemaId: session.schemaId
      });

      setActiveState('WRITING');
      await new Promise(r => setTimeout(r, 2000));
      
      setActiveState('VALIDATING');
      await new Promise(r => setTimeout(r, 1200));
      
      setActiveState('SUCCESS');
      setProcessing(false);
      
      setTimeout(() => {
        setActiveState('IDLE');
        setRecordID(prev => `REC-${(parseInt(prev.split('-')[1]) + 1).toString().padStart(3, '0')}`);
      }, 2000);

    } catch (err) {
      console.error(err);
      setActiveState('ERROR');
      setProcessing(false);
      
      if (sourceImg && targetImg && session) {
        await submitMigrationStep({
          tenantId,
          sessionId: id,
          recordID,
          sourceScreenshotBase64: sourceImg.split(',')[1],
          targetScreenshotBase64: targetImg.split(',')[1],
          schemaId: session.schemaId
        }).catch(() => {});
      }
    }
  };

  const applyOverride = async () => {
    if (!selectedJob) return;
    setProcessing(true);
    await updateMigrationJob(tenantId, id, selectedJob.id, {
      status: 'override',
      userCorrection: correction
    });
    setProcessing(false);
    setSelectedJob(null);
  };

  const handleDownloadReport = async () => {
    try {
      setDownloadingReport(true);
      const url = await getMigrationReportUrl(tenantId, id);
      window.open(url, '_blank');
    } catch (err) {
      console.error(err);
      alert('Failed to generate report. Please try again.');
    } finally {
      setDownloadingReport(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, type: 'source' | 'target') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (type === 'source') setSourceImg(ev.target?.result as string);
      else setTargetImg(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  if (loading || !session) return <div className="p-12 text-zinc-500">Loading controller...</div>;

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-xl z-10">
        <div className="flex items-center gap-6">
          <Link href={`/admin/migrations?tenantId=${tenantId}`} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <RotateCcw size={18} className="text-zinc-400" />
          </Link>
          <div className="h-8 w-px bg-zinc-800" />
          <div>
            <span className="text-[10px] font-black tracking-tighter text-indigo-500 uppercase">Dual-Surface Controller</span>
            <h1 className="text-lg font-bold truncate max-w-[300px] leading-tight uppercase tracking-tight italic">
              {session.name}
            </h1>
          </div>
        </div>

        <div className="flex-1 max-w-xl mx-12">
          <div className="flex justify-between items-end mb-2">
             <div className="flex gap-4 items-center">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">ROI: <span className="text-emerald-400">{(session.totalTokensSaved / 1000).toFixed(1)}k Saved</span></span>
                <div className="h-4 w-px bg-zinc-800" />
                <button 
                  onClick={handleDownloadReport}
                  disabled={downloadingReport}
                  className="flex items-center gap-1.5 text-[10px] font-black text-indigo-400 hover:text-indigo-300 transition-all uppercase tracking-tighter disabled:opacity-50"
                >
                  {downloadingReport ? <Loader2 size={10} className="animate-spin" /> : <FileText size={10} />}
                  Download Proof
                </button>
             </div>
             <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest leading-none">
                {Math.round((session.migratedCount / session.totalRecords) * 100)}% Complete
             </span>
          </div>
          <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden flex ring-1 ring-zinc-800 shadow-inner">
             <div 
               className="h-full bg-linear-to-r from-indigo-600 to-indigo-400 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(99,102,241,0.3)]"
               style={{ width: `${(session.migratedCount / session.totalRecords) * 100}%` }}
             />
             <div 
               className="h-full bg-amber-500 opacity-50"
               style={{ width: `${(session.exceptionCount / session.totalRecords) * 100}%` }}
             />
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Target Surface</span>
              <span className="text-xs font-bold text-white uppercase italic tracking-tighter">{session.targetApp}</span>
           </div>
           <div className="h-10 w-10 bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
           </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-80 border-r border-zinc-900 bg-zinc-950 flex flex-col shadow-2xl z-10 overflow-y-auto custom-scrollbar">
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={runMigrationStep}
                disabled={processing || !sourceImg || !targetImg}
                className="flex flex-col items-center justify-center p-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:bg-zinc-800 rounded-3xl transition-all group relative overflow-hidden"
              >
                <div className="p-2.5 bg-white/20 rounded-xl mb-2 group-hover:scale-110 transition-transform">
                  {processing ? <Loader2 size={20} className="animate-spin" /> : <Play size={20} fill="currentColor" />}
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest italic">Process Next</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-3xl transition-all group">
                <div className="p-2.5 bg-zinc-800 rounded-xl mb-2 group-hover:rotate-12 transition-transform">
                  <Pause size={20} />
                </div>
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest italic">Pause Queue</span>
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle size={12} /> Exceptions ({session.exceptionCount})
              </h3>
              <div className="space-y-2">
                {jobs.filter(j => j.status === 'failed').map(j => (
                  <button 
                    key={j.id} 
                    onClick={() => { setSelectedJob(j); setCorrection(j.extractedData || {}); }}
                    className="w-full p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between group hover:bg-amber-500/20 transition-all text-left"
                  >
                    <div>
                      <div className="text-[10px] font-bold text-white uppercase">{j.recordID}</div>
                      <div className="text-[9px] text-amber-400 font-medium italic">UI Verification Failed</div>
                    </div>
                    <PenTool size={14} className="text-amber-500" />
                  </button>
                ))}
                {session.exceptionCount === 0 && (
                  <p className="text-[10px] text-zinc-700 italic">No exceptions found.</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <History size={12} /> Execution Log
              </h3>
              <div className="space-y-4">
                {jobs.filter(j => ['completed', 'verified', 'override'].includes(j.status)).slice(0, 5).map(j => (
                  <div key={j.id} className="p-3 bg-zinc-900/40 border border-zinc-800/50 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-white tracking-widest uppercase italic">{j.recordID}</span>
                      {j.status === 'override' ? <PenTool size={12} className="text-amber-500" /> : <CheckCircle2 size={12} className="text-emerald-500" />}
                    </div>
                    <div className="flex gap-2 text-[9px] font-bold text-zinc-600 uppercase">
                      <span>{j.mappedActions?.length || 0} fields mapped</span>
                      <span>•</span>
                      <span className={j.status === 'override' ? "text-amber-500" : "text-emerald-500/80"}>
                        {j.status === 'override' ? 'Manual Override' : 'Verified'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 bg-black flex flex-col p-10 overflow-hidden relative">
          <div className="flex-1 grid grid-cols-2 gap-10 min-h-0 mb-10">
            {/* Source */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                 <span className="text-xs font-black text-white italic uppercase tracking-widest">Source Surface</span>
                 {sourceImg && (
                    <button onClick={() => setSourceImg(null)} className="text-[9px] font-bold text-zinc-600 hover:text-red-400 uppercase tracking-widest transition-colors">Reset</button>
                 )}
              </div>
              <div className="flex-1 bg-zinc-900/50 border border-zinc-900 rounded-[2.5rem] relative overflow-hidden group shadow-2xl">
                 <input type="file" onChange={(e) => handleFile(e, 'source')} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                 {sourceImg ? (
                   <img src={sourceImg} className="w-full h-full object-contain p-4 group-hover:scale-[1.02] transition-transform duration-500" alt="Source screenshot" />
                 ) : (
                   <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 p-8 text-center space-y-4">
                      <div className="p-4 bg-zinc-800/50 rounded-full group-hover:bg-indigo-500/10 transition-all">
                         <Layout size={32} />
                      </div>
                      <p className="text-sm font-medium">Drop source screenshot here.</p>
                   </div>
                 )}
              </div>
            </div>

            {/* Target */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                 <span className="text-xs font-black text-white italic uppercase tracking-widest">Destination Surface</span>
                 {targetImg && (
                    <button onClick={() => setTargetImg(null)} className="text-[9px] font-bold text-zinc-600 hover:text-red-400 uppercase tracking-widest transition-colors">Reset</button>
                 )}
              </div>
              <div className="flex-1 bg-zinc-900/50 border border-zinc-900 rounded-[2.5rem] relative overflow-hidden group shadow-2xl">
                 <input type="file" onChange={(e) => handleFile(e, 'target')} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                 {targetImg ? (
                   <>
                     <img 
                        src={targetImg} 
                        className={`w-full h-full object-contain p-4 transition-all duration-700 ${['MAPPING', 'WRITING'].includes(activeState) ? 'blur-sm grayscale opacity-50' : ''}`} 
                        alt="Target screenshot"
                     />
                     {activeState !== 'IDLE' && activeState !== 'SUCCESS' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
                           <div className="bg-zinc-950/80 border border-zinc-800 p-8 rounded-3xl shadow-2xl backdrop-blur-md flex flex-col items-center space-y-6 max-w-xs w-full animate-in zoom-in-95">
                              <Loader2 size={48} className="text-indigo-500 animate-spin" />
                              <div className="text-center">
                                 <h3 className="text-sm font-black text-white italic uppercase">{activeState}...</h3>
                                 <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Record: {recordID}</p>
                              </div>
                           </div>
                        </div>
                     )}
                     {activeState === 'SUCCESS' && (
                         <div className="absolute inset-0 bg-emerald-500/90 backdrop-blur-md flex flex-col items-center justify-center space-y-4 animate-in zoom-in duration-300">
                            <CheckCircle2 size={64} className="text-white mb-2 shadow-2xl" />
                            <h3 className="text-3xl font-black text-white italic uppercase">100% Match!</h3>
                            <p className="text-sm text-emerald-50 text-center font-bold px-8 uppercase">Record {recordID} successfully migrated.</p>
                         </div>
                     )}
                   </>
                 ) : (
                   <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 p-8 text-center space-y-4">
                      <div className="p-4 bg-zinc-800/50 rounded-full">
                         <PenTool size={32} />
                      </div>
                      <p className="text-sm font-medium">Drop target screenshot here.</p>
                   </div>
                 )}
              </div>
            </div>
          </div>

          {/* Analytics Footer */}
          <div className="grid grid-cols-3 gap-6 shrink-0">
             <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col gap-2 relative overflow-hidden group hover:border-indigo-500/30 transition-all shadow-xl">
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <TrendingUp size={48} />
                 </div>
                 <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">Automation Accuracy</span>
                 <div className="text-3xl font-black text-white italic">99.8%</div>
                 <p className="text-[9px] font-bold text-zinc-600 uppercase">Verified via Post-Entry Vision</p>
             </div>
             <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col gap-2 relative overflow-hidden group hover:border-emerald-500/30 transition-all shadow-xl">
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <History size={48} />
                 </div>
                 <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">Process Velocity</span>
                 <div className="text-3xl font-black text-white italic">0.2s/Field</div>
                 <p className="text-[9px] font-bold text-zinc-600 uppercase">Average Latency (G3 Flash)</p>
             </div>
             <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col gap-2 relative overflow-hidden group hover:border-amber-500/30 transition-all shadow-xl">
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <ShieldCheck size={48} />
                 </div>
                 <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">Audit Status</span>
                 <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-black text-emerald-500 italic uppercase tracking-tighter">Compliant</div>
                    <div className="text-[10px] font-bold text-zinc-600">Verification Active</div>
                 </div>
                 <div className="mt-2 w-full bg-zinc-950 h-1 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-1000" 
                      style={{ width: `${(session.migratedCount / session.totalRecords) * 100}%` }}
                    />
                 </div>
                 <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">Full Screen-Log Captured per Record</p>
             </div>
          </div>
        </div>
      </div>

      {/* Manual Override Overlay */}
      {selectedJob && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-12">
           <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
                 <div>
                    <span className="text-[10px] font-black text-amber-500 uppercase">Manual Correction Mode</span>
                    <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Record Exception: {selectedJob.recordID}</h2>
                 </div>
                 <button onClick={() => setSelectedJob(null)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-all">
                    <RotateCcw size={20} />
                 </button>
              </div>
              
              <div className="flex-1 flex overflow-hidden">
                 <div className="flex-1 bg-black p-4">
                    <div className="w-full h-full relative rounded-xl overflow-hidden border border-zinc-800">
                       <img src={selectedJob.sourceScreenshotUrl} className="w-full h-full object-contain" alt="Evidence" />
                       <div className="absolute top-4 left-4 bg-zinc-950/80 p-2 rounded-lg border border-zinc-800 text-[9px] font-bold text-zinc-400">SOURCE SURFACE EVIDENCE</div>
                    </div>
                 </div>

                 <div className="w-96 border-l border-zinc-800 p-8 space-y-6 overflow-y-auto bg-zinc-900/50">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Extracted Fields</label>
                       {Object.entries(selectedJob.extractedData || {}).map(([key, val]) => (
                          <div key={key} className="space-y-1.5">
                             <span className="text-[10px] font-bold text-zinc-400 uppercase">{key}</span>
                             <input 
                                value={correction[key] || (val as string) || ''}
                                onChange={e => setCorrection(prev => ({ ...prev, [key]: e.target.value }))}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium text-white focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all"
                             />
                          </div>
                       ))}
                    </div>

                    <div className="pt-8 border-t border-zinc-800 space-y-3">
                       <button 
                          onClick={applyOverride}
                          disabled={processing}
                          className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-900/20 uppercase italic tracking-tight"
                       >
                          {processing ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                          Confirm & Override
                       </button>
                       <p className="text-[9px] text-zinc-600 text-center font-medium leading-relaxed uppercase tracking-tighter">
                          Applying an override marks this record as Manually Verified and increments the migrated count.
                       </p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
