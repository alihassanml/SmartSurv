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
    <section className="w-[220px] bg-[#070809] border-l border-[rgba(176,198,255,0.1)] flex flex-col shrink-0">
      <div className="px-4 py-3 border-b border-[rgba(176,198,255,0.1)] bg-[rgba(6,6,8,0.9)] shrink-0">
        <h2 className="text-[10px] font-bold tracking-[0.25em] text-[#b0c6ff]">PERSONS_LOG</h2>
        <p className="text-[8px] opacity-25 uppercase mt-0.5">Re-ID Engine Â· 5min cooldown</p>

        {/* Semantic Search */}
        <div className="mt-3 relative group">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#b0c6ff]/30 group-focus-within:text-[#b0c6ff]" />
          <input
            type="text"
            placeholder="DESC_SEARCH..."
            value={semanticQuery}
            onChange={(e) => handleSemanticSearch(e.target.value)}
            className="w-full bg-black/40 border border-[#b0c6ff]/10 focus:border-[#b0c6ff]/40 pl-8 pr-3 py-1.5 text-[8px] font-bold tracking-widest text-[#b0c6ff] outline-none transition-all placeholder:text-[#b0c6ff]/20"
          />
          {semanticQuery && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {semanticLoading ? (
                <RefreshCw className="w-2.5 h-2.5 text-[#b0c6ff] animate-spin" />
              ) : (
                <button onClick={() => handleSemanticSearch('')} className="opacity-40 hover:opacity-100 transition-opacity">
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {detectedPersons.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 opacity-15">
            <User className="w-8 h-8" />
            <span className="text-[8px] tracking-[0.3em]">NO_PERSONS_LOG</span>
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
                  className={`relative border overflow-hidden cursor-pointer transition-all group/pcard ${
                    focusedPersonId === p.person_id
                      ? 'border-red-500/60 bg-red-900/5 shadow-[0_0_15px_rgba(255,0,0,0.1)]'
                      : isTopMatch
                      ? 'border-[#b4c6f8]/60 bg-[#b4c6f8]/5 shadow-[0_0_12px_rgba(180,198,248,0.15)]'
                      : 'border-[rgba(176,198,255,0.12)] bg-[rgba(12,13,16,0.8)] hover:border-[#b0c6ff]/50'
                  }`}
                >
                  {focusedPersonId === p.person_id && (
                    <div className="absolute top-1.5 right-1.5 z-10">
                      <Target className="w-2.5 h-2.5 text-red-500 animate-pulse" />
                    </div>
                  )}

                  <div
                    className="absolute top-0 right-0 px-1.5 py-0.5 text-[7px] font-bold z-10"
                    style={p.status === 'NEW'
                      ? { background: '#b0c6ff', color: '#000' }
                      : { background: '#b4c6f8', color: '#000' }
                    }
                  >
                    {p.status}
                  </div>

                  {semanticQuery && (
                    <div className="absolute top-4 right-0 px-1.5 py-0.5 bg-black/80 text-[7px] font-bold z-10 border-l border-b border-[#b0c6ff]/30">
                      {Math.round((semanticResults.find(r => r.id === p.person_id)?.score || 0) * 100)}% MATCH
                    </div>
                  )}

                  <div className="relative w-full aspect-square bg-black overflow-hidden">
                    <img
                      src={`data:image/jpeg;base64,${p.face}`}
                      alt={p.person_id}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-x-0 top-0 h-[1px] bg-[#b0c6ff]/50 animate-scanner" />
                  </div>

                  <div className="px-2 py-1.5">
                    <p className="text-[10px] font-bold text-[#b0c6ff] tracking-widest">{p.person_id}</p>
                    <p className="text-[7px] opacity-30 mt-0.5">{p.timestamp} Â· {p.feed_id}</p>
                    {p.traits && p.traits !== 'ANALYZING...' && (
                      <p className="text-[7px] text-[#b4c6f8]/50 mt-0.5 truncate">{p.traits}</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {detectedPersons.length > 0 && (
        <div className="p-2 border-t border-[rgba(176,198,255,0.1)] shrink-0">
          <button
            onClick={() => setDetectedPersons([])}
            className="w-full py-1.5 text-[8px] font-bold tracking-widest border border-[rgba(255,68,102,0.3)] text-red-400 hover:bg-red-900/10 transition-all"
          >
            CLEAR_LOG ({detectedPersons.length})
          </button>
        </div>
      )}
    </section>
  );
};

export default PersonsPanel;

