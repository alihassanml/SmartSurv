import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Search, RefreshCw, X, Target } from 'lucide-react';
import type { PersonEvent } from '../../types/dashboard';

interface PersonsPanelProps {
  detectedPersons: PersonEvent[];
  setSelectedPerson: (p: PersonEvent | null) => void;
  semanticQuery: string;
  semanticResults: { id: string; score: number }[];
  semanticLoading: boolean;
  handleSemanticSearch: (val: string) => void;
  focusedPersonId: string | null;
  setDetectedPersons: (persons: PersonEvent[]) => void;
}

const PersonsPanel: React.FC<PersonsPanelProps> = ({
  detectedPersons,
  setSelectedPerson,
  semanticQuery,
  semanticResults,
  semanticLoading,
  handleSemanticSearch,
  focusedPersonId,
  setDetectedPersons,
}) => {
  return (
    <section className="w-[220px] flex flex-col shrink-0"
      style={{ background: 'var(--color-surface)', borderLeft: '1px solid rgba(0,0,0,0.1)', boxShadow: '-2px 0 10px rgba(0,0,0,0.05)' }}>
      <div className="px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', background: 'var(--color-surface-container-low)' }}>
        <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: 'var(--color-on-surface)' }}>Persons Log</h2>
        <p className="text-[8px] mt-0.5 uppercase" style={{ color: 'var(--color-outline)' }}>Re-ID Engine Â· 5min cooldown</p>

        {/* Semantic Search */}
        <div className="mt-3 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: 'var(--color-outline-variant)' }} />
          <input
            type="text"
            placeholder="Search persons..."
            value={semanticQuery}
            onChange={(e) => handleSemanticSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-[8px] font-semibold tracking-wide outline-none transition-all"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid rgba(0,0,0,0.1)',
              color: 'var(--color-on-surface)',
              borderRadius: '0.375rem',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(36,128,255,0.12)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
          {semanticQuery && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {semanticLoading ? (
                <RefreshCw className="w-2.5 h-2.5 animate-spin" style={{ color: 'var(--color-primary)' }} />
              ) : (
                <button onClick={() => handleSemanticSearch('')}
                  className="transition-opacity hover:opacity-100 opacity-60"
                  style={{ color: 'var(--color-outline)' }}>
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {detectedPersons.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2" style={{ opacity: 0.3 }}>
            <User className="w-8 h-8" style={{ color: 'var(--color-outline)' }} />
            <span className="text-[8px] tracking-[0.3em]" style={{ color: 'var(--color-outline)' }}>NO PERSONS</span>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {(semanticQuery
              ? [...detectedPersons].sort((a, b) => {
                  const sa = semanticResults.find(r => r.id === a.person_id)?.score || 0;
                  const sb = semanticResults.find(r => r.id === b.person_id)?.score || 0;
                  return sb - sa;
                })
              : detectedPersons
            ).map((p) => {
              const matchScore = semanticResults.find(r => r.id === p.person_id)?.score || 0;
              const isTopMatch = !!(semanticQuery && matchScore > 0.25);
              return (
                <motion.div
                  key={p.person_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setSelectedPerson(p)}
                  className="relative overflow-hidden cursor-pointer transition-all rounded-lg"
                  style={focusedPersonId === p.person_id
                    ? { border: '1px solid rgba(186,26,26,0.4)', background: 'rgba(186,26,26,0.04)', boxShadow: '0 1px 6px rgba(186,26,26,0.08)' }
                    : isTopMatch
                    ? { border: '1px solid rgba(36,128,255,0.4)', background: 'rgba(36,128,255,0.04)', boxShadow: '0 1px 6px rgba(36,128,255,0.08)' }
                    : { border: '1px solid rgba(0,0,0,0.1)', background: 'var(--color-surface)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }
                  }
                  onMouseEnter={e => { if (focusedPersonId !== p.person_id && !isTopMatch) (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(36,128,255,0.25)'; }}
                  onMouseLeave={e => { if (focusedPersonId !== p.person_id && !isTopMatch) (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,0,0,0.1)'; }}
                >
                  {focusedPersonId === p.person_id && (
                    <div className="absolute top-1.5 right-1.5 z-10">
                      <Target className="w-2.5 h-2.5 animate-pulse" style={{ color: '#ba1a1a' }} />
                    </div>
                  )}

                  <div
                    className="absolute top-0 right-0 px-1.5 py-0.5 text-[7px] font-bold z-10"
                    style={p.status === 'NEW'
                      ? { background: 'var(--color-primary)', color: '#ffffff', borderRadius: '0 0.5rem 0 0.25rem' }
                      : { background: '#47607e', color: '#ffffff', borderRadius: '0 0.5rem 0 0.25rem' }
                    }
                  >
                    {p.status}
                  </div>

                  {semanticQuery && (
                    <div className="absolute top-5 right-0 px-1.5 py-0.5 text-[7px] font-bold z-10"
                      style={{ background: 'rgba(36,128,255,0.1)', color: 'var(--color-primary)', borderRadius: '0 0 0 0.25rem', border: '1px solid rgba(36,128,255,0.2)' }}>
                      {Math.round((semanticResults.find(r => r.id === p.person_id)?.score || 0) * 100)}%
                    </div>
                  )}

                  <div className="relative w-full aspect-square overflow-hidden bg-gray-100">
                    <img
                      src={`data:image/jpeg;base64,${p.face}`}
                      alt={p.person_id}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-x-0 top-0 h-[1px] animate-scanner"
                      style={{ background: 'rgba(36,128,255,0.5)' }} />
                  </div>

                  <div className="px-2 py-1.5">
                    <p className="text-[10px] font-bold tracking-wide" style={{ color: 'var(--color-primary)' }}>{p.person_id}</p>
                    <p className="text-[7px] mt-0.5" style={{ color: 'var(--color-outline-variant)' }}>{p.timestamp} Â· {p.feed_id}</p>
                    {p.traits && p.traits !== 'ANALYZING...' && (
                      <p className="text-[7px] mt-0.5 truncate" style={{ color: 'var(--color-outline)' }}>{p.traits}</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {detectedPersons.length > 0 && (
        <div className="p-2 shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
          <button
            onClick={() => setDetectedPersons([])}
            className="w-full py-1.5 text-[8px] font-bold tracking-widest transition-all rounded"
            style={{ border: '1px solid rgba(186,26,26,0.25)', color: '#ba1a1a', background: 'rgba(186,26,26,0.04)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(186,26,26,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(186,26,26,0.04)'; }}
          >
            Clear Log ({detectedPersons.length})
          </button>
        </div>
      )}
    </section>
  );
};

export default PersonsPanel;

