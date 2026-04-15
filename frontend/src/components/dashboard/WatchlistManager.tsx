import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UploadCloud, Search } from 'lucide-react';
import { API } from '../../types/dashboard';

interface WatchlistManagerProps {
  isAddingTarget: boolean;
  setIsAddingTarget: (v: boolean) => void;
  newTargetName: string;
  setNewTargetName: (v: string) => void;
  newTargetPreview: string | null;
  setNewTargetPreview: (v: string | null) => void;
  handleAddWatchlist: (e: React.ChangeEvent<HTMLInputElement>) => void;
  watchlist: string[];
  removeTarget: (name: string) => void;
}

const WatchlistManager: React.FC<WatchlistManagerProps> = ({
  isAddingTarget,
  setIsAddingTarget,
  newTargetName,
  setNewTargetName,
  newTargetPreview,
  setNewTargetPreview,
  handleAddWatchlist,
  watchlist,
  removeTarget,
}) => {
  return (
    <AnimatePresence>
      {isAddingTarget && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsAddingTarget(false)}
            className="fixed inset-0 bg-black/80 z-[300] backdrop-blur-md"
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            className="fixed top-0 right-0 h-full w-[400px] bg-[#090a0c] border-l border-[#00ff85]/20 p-8 z-[301] shadow-2xl"
          >
            <div className="flex justify-between items-center mb-10 border-b border-[#00ff85]/10 pb-6">
              <div>
                <h3 className="text-xl font-bold tracking-widest text-[#00ff85]">WATCHLIST_DB</h3>
                <p className="text-[10px] opacity-40 uppercase font-bold mt-1">Personnel Authorization Management</p>
              </div>
              <button
                onClick={() => setIsAddingTarget(false)}
                className="p-2 hover:bg-white/5 border border-transparent hover:border-[#00ff85]/30"
              >
                <X className="w-5 h-5 text-[#00ff85]" />
              </button>
            </div>

            <div className="space-y-8">
              {/* Add New Target */}
              <div className="space-y-3 bg-[#0c0e12] p-5 border border-[#00ff85]/10">
                <p className="text-[9px] font-bold text-[#00ff85]/60 tracking-widest uppercase">Add New Target</p>
                <input
                  type="text"
                  placeholder="ENTER_PERSON_NAME..."
                  value={newTargetName}
                  onChange={(e) => setNewTargetName(e.target.value)}
                  className="w-full bg-black/40 border border-[#00ff85]/20 text-[#00ff85] text-xs px-4 py-3 placeholder:text-[#00ff85]/20 focus:outline-none focus:border-[#00ff85]/50 transition-all font-bold"
                />
                <label className="block">
                  {newTargetPreview ? (
                    <div className="relative w-full aspect-square border border-[#00ff85]/30 mb-3 bg-black/40 overflow-hidden">
                      <img src={newTargetPreview} className="w-full h-full object-cover grayscale" alt="Preview" />
                      <div className="absolute inset-0 bg-[#00ff85]/10 animate-pulse" />
                      <div className="absolute top-0 left-0 w-full h-0.5 bg-[#00ff85] animate-scanner" />
                      <button
                        onClick={(e) => { e.preventDefault(); setNewTargetPreview(null); }}
                        className="absolute top-2 right-2 p-1 bg-black/60 text-white hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className={`w-full py-8 border-2 border-dashed ${newTargetName ? 'border-[#00ff85]/40 hover:bg-[#00ff85]/5 cursor-pointer text-[#00ff85]' : 'border-white/5 text-white/10 opacity-50 cursor-not-allowed'} font-bold text-[10px] tracking-widest uppercase text-center transition-all flex flex-col items-center gap-2`}>
                      <UploadCloud className="w-6 h-6" />
                      {newTargetName ? 'Select Biometric Image' : 'Enter Name First'}
                    </div>
                  )}
                  <input type="file" className="hidden" onChange={handleAddWatchlist} disabled={!newTargetName} />
                </label>
              </div>

              {/* Active Watchlist */}
              <div className="space-y-4">
                <p className="text-[9px] font-bold text-[#00ff85]/60 tracking-widest uppercase">Active Targets ({watchlist.length})</p>
                <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[420px] pr-1 custom-scrollbar">
                  {watchlist.length === 0 ? (
                    <div className="col-span-2 text-center py-10 opacity-20 text-[10px] italic">NO_TARGETS_ACTIVE</div>
                  ) : (
                    watchlist.map(name => (
                      <div key={name} className="relative border border-[#00ff85]/15 bg-black/50 group hover:border-[#00ff85]/50 transition-all overflow-hidden">
                        <div className="relative w-full aspect-square bg-black overflow-hidden">
                          <img
                            src={`${API}/api/watchlist/images/${name}.jpg?t=${Date.now()}`}
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            alt={name}
                          />
                          <div className="absolute inset-0 bg-[#00ff85]/0 group-hover:bg-[#00ff85]/5 transition-all duration-300" />
                          <div className="absolute top-0 left-0 w-full h-[1px] bg-[#00ff85]/40 opacity-0 group-hover:opacity-100 animate-scanner" />
                          <button
                            onClick={() => removeTarget(name)}
                            className="absolute top-1 right-1 p-1 bg-black/70 text-[#00ff85]/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="px-2 py-1.5 flex items-center justify-between">
                          <span className="text-[9px] font-bold tracking-wider text-[#00ff85] truncate">{name.toUpperCase()}</span>
                          <Search className="w-3 h-3 text-[#00ff85]/30 shrink-0" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WatchlistManager;
